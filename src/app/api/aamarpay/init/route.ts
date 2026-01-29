
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, shippingInfo, cartItems, appliedDiscount } = body;

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) { return cookieStore.get(name)?.value },
            set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
            remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
    }

    // 1. Fetch aamarPay settings
    const { data: settingsList, error: settingsError } = await supabase.from('settings').select('key, value');

    if (settingsError) {
        throw new Error(`Failed to fetch settings: ${settingsError.message}`);
    }

    const settings = (settingsList || []).reduce((acc, { key, value }) => {
        if (key) (acc as any)[key] = value;
        return acc;
    }, {} as { [key: string]: any });
    
    if (settings?.enable_aamarpay !== 'true') {
        return NextResponse.json({ error: 'aamarPay is not enabled.',settings:settings }, { status: 500 });
    }

    const isSandbox = settings.aamarpay_mode === 'sandbox';
    const store_id = isSandbox ? settings.aamarpay_sandbox_store_id : settings.aamarpay_production_store_id;
    const signature_key = isSandbox ? settings.aamarpay_sandbox_signature_key : settings.aamarpay_production_signature_key;
    const apiUrl = isSandbox ? 'https://sandbox.aamarpay.com/jsonpost.php' : 'https://secure.aamarpay.com/jsonpost.php';

    if (!store_id || !signature_key) {
        return NextResponse.json({ error: 'aamarPay is not configured correctly. Please contact support.' }, { status: 500 });
    }

    // 2. Create a 'Pending' order to get a transaction ID
    const orderNumber = 'KBZ-' + Date.now();
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            order_number: orderNumber,
            total_amount: amount,
            shipping_details: shippingInfo,
            status: 'Pending',
            payment_method: 'aamarpay',
            payment_details: null,
            coupon_code: appliedDiscount?.code || null,
            discount_amount: appliedDiscount?.discount || 0,
        })
        .select('id')
        .single();
    
    if (orderError || !orderData) {
        throw new Error(orderError?.message || 'Failed to create order for aamarPay.');
    }

    const newOrderId = orderData.id;
    
    const orderItemsToInsert = cartItems.map((item: any) => ({
        order_id: newOrderId,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

    if (itemsError) {
        await supabase.from('orders').delete().eq('id', newOrderId);
        throw new Error(itemsError.message || 'Failed to add items to order for aamarPay.');
    }

    await supabase.from('order_history').insert({
        order_id: newOrderId,
        status: 'Pending',
    });


    const origin = request.nextUrl.origin;
    const paymentData = {
        store_id,
        signature_key,
        cus_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        cus_email: shippingInfo.email,
        cus_phone: shippingInfo.phone,
        cus_add1: shippingInfo.address,
        cus_add2: shippingInfo.city,
        cus_city: shippingInfo.city,
        cus_country: 'Bangladesh', // Assuming Bangladesh
        amount: amount,
        tran_id: orderNumber,
        currency: 'BDT',
        success_url: `${origin}/api/aamarpay/success`,
        fail_url: `${origin}/api/aamarpay/fail`,
        cancel_url: `${origin}/api/aamarpay/cancel`,
        desc: `Order from ${settings.site_title || 'Your Store'}`,
        type: 'json'
    };

    const aamarPayResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    });

    const aamarPayData = await aamarPayResponse.json();

    if (aamarPayData.result !== 'true' || !aamarPayData.payment_url) {
        console.error("aamarPay initialization failed:", aamarPayData);
        // Attempt to update the order status to Failed
        await supabase.from('orders').update({ status: 'Failed' }).eq('id', newOrderId);
        throw new Error('Failed to initialize aamarPay payment gateway.');
    }
    
    return NextResponse.json({ url: aamarPayData.payment_url });

  } catch (error: any) {
    console.error("Payment initialization failed:", error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}

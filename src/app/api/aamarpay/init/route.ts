
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
    const orderItems = cartItems.map((item: any) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
    }));
    
    const { data: orderNumber, error: createOrderError } = await supabase.rpc('create_new_order', {
        p_total_amount: amount,
        p_shipping_details: shippingInfo,
        p_items: orderItems,
        p_payment_method: 'aamarpay',
        p_transaction_details: null,
        p_coupon_code: appliedDiscount?.code || null,
        p_discount_amount: appliedDiscount?.discount || 0,
        p_initial_status: 'Pending'
    });

    if (createOrderError) {
      throw new Error(`Failed to create order: ${createOrderError.message}`);
    }

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
        throw new Error('Failed to initialize aamarPay payment gateway.');
    }
    
    return NextResponse.json({ url: aamarPayData.payment_url });

  } catch (error: any) {
    console.error("Payment initialization failed:", error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}

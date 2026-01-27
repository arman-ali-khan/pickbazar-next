import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import SSLCommerzPayment from 'sslcommerz-lts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, shippingInfo, cartItems, appliedDiscount } = body;

    const supabase = createClient();

    // 1. Fetch settings
    const { data: settingsData } = await supabase.rpc('get_all_settings');
    const settings = settingsData?.[0];

    if (!settings) {
      throw new Error("Could not fetch payment gateway settings.");
    }
    
    const isSandbox = settings.sslcommerz_mode === 'sandbox';
    const store_id = isSandbox ? settings.sslcommerz_sandbox_store_id : settings.sslcommerz_production_store_id;
    const store_password = isSandbox ? settings.sslcommerz_sandbox_store_password : settings.sslcommerz_production_store_password;

    if (!store_id || !store_password) {
        return NextResponse.json({ error: 'SSLCommerz is not configured correctly. Please contact support.' }, { status: 500 });
    }

    // 2. Create a 'Pending' order to get a transaction ID
    const orderItems = cartItems.map((item: any) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
    }));
    
    const { data: orderNumber, error: createOrderError } = await supabase.rpc('create_order', {
        p_total_amount: amount,
        p_shipping_details: shippingInfo,
        p_items: orderItems,
        p_payment_method: 'sslcommerz',
        p_transaction_details: null,
        p_coupon_code: appliedDiscount?.code || null,
        p_discount_amount: appliedDiscount?.discount || 0,
        p_initial_status: 'Pending'
    });

    if (createOrderError) {
      throw new Error(`Failed to create order: ${createOrderError.message}`);
    }
    
    // 3. Prepare data for SSLCommerz
    const origin = request.nextUrl.origin;
    const paymentData = {
        total_amount: amount,
        currency: 'BDT',
        tran_id: orderNumber, // Using our order number as the transaction ID
        success_url: `${origin}/api/payment/success/${orderNumber}`,
        fail_url: `${origin}/api/payment/fail/${orderNumber}`,
        cancel_url: `${origin}/api/payment/cancel/${orderNumber}`,
        ipn_url: `${origin}/api/payment/ipn`,
        shipping_method: 'Courier',
        product_name: cartItems.map((item:any) => item.name).join(', '),
        product_category: 'Ecommerce',
        product_profile: 'general',
        cus_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        cus_email: shippingInfo.email,
        cus_add1: shippingInfo.address,
        cus_city: shippingInfo.city,
        cus_state: shippingInfo.state,
        cus_postcode: shippingInfo.zip,
        cus_country: 'Bangladesh',
        cus_phone: shippingInfo.phone,
        ship_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        ship_add1: shippingInfo.address,
        ship_city: shippingInfo.city,
        ship_state: shippingInfo.state,
        ship_postcode: shippingInfo.zip,
        ship_country: 'Bangladesh',
    };
    
    // 4. Initialize payment
    const sslcz = new SSLCommerzPayment(store_id, store_password, isSandbox);
    const apiResponse = await sslcz.init(paymentData);
    
    if (apiResponse?.status !== 'SUCCESS') {
        throw new Error(`Failed to initialize SSLCommerz payment: ${apiResponse?.failedreason}`);
    }

    return NextResponse.json({ url: apiResponse.GatewayPageURL });

  } catch (error: any) {
    console.error("Payment initialization failed:", error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createOrderNotification } from '@/app/actions';
import SSLCommerzPayment from 'sslcommerz-lts';

export async function POST(request: NextRequest, { params }: { params: { tran_id: string } }) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const supabase = createClient();
    
    const { status, tran_id, val_id, amount } = data;

    if (!tran_id || tran_id !== params.tran_id) {
        throw new Error("Transaction ID mismatch.");
    }
    
    // In a real application, you MUST validate the transaction with SSLCommerz.
    const { data: settingsData } = await supabase.rpc('get_all_settings');
    const settings = settingsData?.[0];
    const isSandbox = settings?.sslcommerz_mode === 'sandbox';
    const store_id = isSandbox ? settings?.sslcommerz_sandbox_store_id : settings?.sslcommerz_production_store_id;
    const store_password = isSandbox ? settings?.sslcommerz_sandbox_store_password : settings?.sslcommerz_production_store_password;
    
    if(!store_id || !store_password) {
        throw new Error("SSLCommerz credentials not configured.");
    }
    
    const sslcz = new SSLCommerzPayment(store_id, store_password, isSandbox);
    const validation = await sslcz.validate({ val_id: String(val_id) });
    
    if (validation?.status !== 'VALID' && validation?.status !== 'VALIDATED') {
      console.error(`SSLCommerz transaction validation failed for tran_id ${tran_id}. Status: ${validation?.status}`);
      return NextResponse.redirect(new URL(`/checkout?payment_status=validation_failed&order=${tran_id}`, request.url), 303);
    }
    
    // Check if amounts match
    if (Number(validation.amount) !== Number(amount)) {
      console.error(`Amount mismatch for tran_id ${tran_id}. Received: ${amount}, Validated: ${validation.amount}`);
      // You might want to flag this for manual review
    }
    
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('order_number', tran_id)
        .single();
    
    if (orderError || !orderData) {
        console.error(`Success callback received for non-existent order: ${tran_id}`);
        return NextResponse.redirect(new URL('/checkout?payment_status=error', request.url), 303);
    }
    
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Processing', payment_details: data })
        .eq('id', orderData.id);

    if (updateError) {
        console.error(`Failed to update order status for tran_id ${tran_id}:`, updateError.message);
        return NextResponse.redirect(new URL('/checkout?payment_status=dberror', request.url), 303);
    }

    await createOrderNotification(tran_id as string, Number(amount));

    return NextResponse.redirect(new URL(`/checkout/success?order_number=${tran_id}`, request.url), 303);

  } catch (e: any) {
    console.error("Error in SSLCommerz success callback:", e.message);
    return NextResponse.redirect(new URL('/checkout?payment_status=error', request.url), 303);
  }
}

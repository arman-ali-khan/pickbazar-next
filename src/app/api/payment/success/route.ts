import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createOrderNotification } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const { status, tran_id, val_id, amount } = data;
    console.log("SSLCommerz Success Callback:", data);

    // In a real application, you MUST validate the transaction with SSLCommerz
    // to prevent tampering. This involves calling their validation API.
    // Ref: https://developer.sslcommerz.com/doc/v4/#order-validation-api

    // For now, we trust the status from the request body for simplicity.
    if (status === 'VALID' || status === 'VALIDATED') {
      const supabase = createClient();

      // Find the order by transaction ID (which is our order_number)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('order_number', tran_id)
        .single();
      
      if (orderError || !orderData) {
        console.error(`Success callback received for non-existent order: ${tran_id}`);
        // Redirect to a failure page even if SSL said it was valid
        return NextResponse.redirect(new URL('/checkout?payment_status=error', request.url), 303);
      }
      
      // Update the order status to 'Processing'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Processing', payment_details: data })
        .eq('id', orderData.id);

      if (updateError) {
          console.error(`Failed to update order status for tran_id ${tran_id}:`, updateError.message);
          return NextResponse.redirect(new URL('/checkout?payment_status=dberror', request.url), 303);
      }

      await createOrderNotification(tran_id as string, Number(amount));

      // Redirect user to the final success page
      return NextResponse.redirect(new URL(`/checkout/success?order_number=${tran_id}`, request.url), 303);
    } else {
      console.log(`SSLCommerz transaction failed or was invalid for tran_id ${tran_id}. Status: ${status}`);
      return NextResponse.redirect(new URL('/checkout?payment_status=failed', request.url), 303);
    }
  } catch (e: any) {
    console.error("Error in SSLCommerz success callback:", e.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const tran_id = request.nextUrl.searchParams.get('tran_id');
    if (tran_id) {
        return NextResponse.redirect(new URL(`/checkout/success?order_number=${tran_id}`, request.url), 303);
    }
    return NextResponse.redirect(new URL('/checkout', request.url), 303);
}

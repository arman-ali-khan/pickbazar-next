import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { tran_id: string } }) {
  const tran_id = params.tran_id;
  console.log(`SSLCommerz Cancel Callback for transaction: ${tran_id}`);
  
  if (tran_id) {
    try {
        const supabase = createClient();
        await supabase
            .from('orders')
            .update({ status: 'Cancelled' })
            .eq('order_number', tran_id);
    } catch (error) {
        console.error(`Failed to update order status to Cancelled for tran_id ${tran_id}:`, (error as Error).message);
    }
  }

  // Redirect to the checkout payment page so user can try again
  return NextResponse.redirect(new URL('/checkout/payment', request.url), 303);
}

export async function GET(request: NextRequest) {
    return NextResponse.redirect(new URL('/checkout/payment', request.url), 303);
}

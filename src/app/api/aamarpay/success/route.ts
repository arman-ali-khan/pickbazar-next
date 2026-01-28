import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createOrderNotification } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    
    const { pay_status, mer_txnid, amount } = data;

    if (!mer_txnid) {
        throw new Error("Transaction ID (mer_txnid) not found in aamarPay response.");
    }

    if (pay_status === 'Successful') {Loading 
        const cookieStore = cookies();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
            },
        });
        
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', mer_txnid)
            .single();
        
        if (orderError || !orderData) {
            console.error(`aamarPay success callback received for non-existent order: ${mer_txnid}`);
            // Still redirect to success page but log the error
            return NextResponse.redirect(new URL(`/checkout/success?order_number=${mer_txnid}`, request.url), 303);
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'Processing', payment_details: data })
            .eq('id', orderData.id);

        if (updateError) {
            console.error(`Failed to update order status for tran_id ${mer_txnid}:`, updateError.message);
            // Don't block user, proceed to success page but log this issue
        }

        // Notify Admins
        await createOrderNotification(mer_txnid as string, Number(amount));
    }
    
    return NextResponse.redirect(new URL(`/checkout/success?order_number=${mer_txnid}`, request.url), 303);

  } catch (e: any) {
    console.error("Error in aamarPay success callback:", e.message);
    return NextResponse.redirect(new URL('/checkout?payment_status=error', request.url), 303);
  }
}

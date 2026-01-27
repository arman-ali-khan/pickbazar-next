import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());
  const tran_id = data.mer_txnid as string;

  if (tran_id) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
            },
        });
        await supabase
            .from('orders')
            .update({ status: 'Failed' })
            .eq('order_number', tran_id);
    } catch (error) {
        console.error(`Failed to update order status to Failed for tran_id ${tran_id}:`, (error as Error).message);
    }
  }
  
  return NextResponse.redirect(new URL('/checkout?payment_status=failed', request.url), 303);
}

export async function GET(request: NextRequest) {
    return NextResponse.redirect(new URL('/checkout?payment_status=failed', request.url), 303);
}

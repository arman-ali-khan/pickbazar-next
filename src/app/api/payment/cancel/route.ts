import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());
  console.log("SSLCommerz Cancel Callback:", data);
   // You might want to update the order status to 'Cancelled' in your DB here
  return NextResponse.redirect(new URL('/checkout/payment', request.url), 303);
}

export async function GET(request: NextRequest) {
    return NextResponse.redirect(new URL('/checkout/payment', request.url), 303);
}

import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // aamarPay may POST to cancel, so we handle it and redirect.
  return NextResponse.redirect(new URL('/checkout/payment', request.url), 303);
}

export async function GET(request: NextRequest) {
    // Or they may just redirect with GET.
    return NextResponse.redirect(new URL('/checkout/payment', request.url), 303);
}

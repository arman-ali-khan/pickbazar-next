import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is the Instant Payment Notification endpoint.
// SSLCommerz will send a background request here to confirm the payment status.
// This is crucial for ensuring orders are processed even if the user closes their browser
// before being redirected back to your success page.
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());
        console.log("SSLCommerz IPN Received:", data);

        // Here you would perform the same validation and database update logic
        // as in the success route. This provides a fallback.
        // For now, we'll just acknowledge the request.

        return new NextResponse('IPN Received', { status: 200 });
    } catch (e: any) {
        console.error("Error processing IPN:", e.message);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

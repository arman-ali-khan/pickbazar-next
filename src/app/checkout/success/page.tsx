'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

interface OrderData {
    items: CartItem[];
    total: number;
    orderId: string;
}

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const [orderData, setOrderData] = useState<OrderData | null>(null);

    useEffect(() => {
        const data = searchParams.get('data');
        if (data) {
            try {
                setOrderData(JSON.parse(decodeURIComponent(data)));
            } catch (error) {
                console.error("Failed to parse order data", error);
            }
        }
    }, [searchParams]);

    if (!orderData) {
        return (
             <div className="bg-muted/20 min-h-screen">
                <Header />
                <main className="container py-12 text-center">
                    <p>Loading order details...</p>
                </main>
                <Footer />
                <CartDrawer />
            </div>
        );
    }

    const { items, total, orderId } = orderData;

    return (
        <div className="bg-muted/20 min-h-screen">
            <Header />
            <main className="container py-12">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                            <CardTitle className="text-2xl">Order Successful!</CardTitle>
                            <p className="text-muted-foreground">Thank you for your purchase.</p>
                            <p className="font-semibold text-lg">Order ID: {orderId}</p>
                        </CardHeader>
                        <CardContent>
                            <h3 className="font-semibold mb-4">Order Summary</h3>
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                                <Image src={item.image.imageUrl} alt={item.name} data-ai-hint={item.image.imageHint} fill className="object-contain p-1" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="flex justify-between font-bold text-lg">
                                <p>Total</p>
                                <p>${total.toFixed(2)}</p>
                            </div>
                             <Button asChild className="w-full mt-6">
                                <Link href="/shop">Continue Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
}

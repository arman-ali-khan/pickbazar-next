
'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Suspense, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useSupabase } from '@/lib/supabase/provider';
import { useAppDispatch } from '@/lib/redux/hooks';
import { clearCart } from '@/lib/redux/slices/cartSlice';
import { Skeleton } from '@/components/ui/skeleton';


interface OrderItem {
    id: number;
    quantity: number;
    price_at_purchase: number;
    products: {
        name: string;
        featured_image_url: string;
    } | null;
}

interface OrderData {
    order_number: string;
    total_amount: number;
    order_items: OrderItem[];
}

const SuccessSkeleton = () => (
    <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader className="text-center">
                <Skeleton className="h-16 w-16 mx-auto rounded-full mb-4" />
                <Skeleton className="h-7 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
                <Skeleton className="h-6 w-40 mx-auto mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                    ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-lg">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                </div>
                 <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
);

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('order_number');
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const { supabase, user, loading: authLoading } = useSupabase();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const setPageTitle = async () => {
          const { data } = await supabase.rpc('get_all_settings');
          const siteTitle = data?.[0]?.site_title || 'Karwanbazar';
          document.title = `Order Successful | ${siteTitle}`;
        }
        setPageTitle();
        dispatch(clearCart());
        localStorage.removeItem('shippingInfo');
        localStorage.removeItem('appliedDiscount');
        localStorage.removeItem('shippingCost');
    }, [dispatch, supabase]);

    const getOrderDetails = useCallback(async () => {
        if (!orderNumber || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                order_number,
                total_amount,
                order_items (
                    id,
                    quantity,
                    price_at_purchase,
                    products (
                        name,
                        featured_image_url
                    )
                )
            `)
            .eq('order_number', orderNumber)
            .single();
        
        if (error || !data) {
            console.error("Failed to fetch order data", error);
            setOrderData(null);
        } else {
            setOrderData(data as OrderData);
        }
        setLoading(false);
    }, [orderNumber, supabase, user]);

    useEffect(() => {
        if (!authLoading) {
            getOrderDetails();
        }
    }, [getOrderDetails, authLoading]);

    if (loading || authLoading) {
        return <SuccessSkeleton />;
    }
    
    if (!orderData) {
        return (
            <div className="text-center">
                <p className="text-destructive">Could not find order details.</p>
                <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl">Order Successful!</CardTitle>
                    <CardDescription>Thank you for your purchase.</CardDescription>
                    <p className="font-semibold text-lg">Order ID: {orderData.order_number}</p>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-4">
                        {orderData.order_items.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                        <Image src={item.products?.featured_image_url || 'https://picsum.photos/seed/placeholder/200'} alt={item.products?.name || 'Product'} fill className="object-contain p-1" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.products?.name}</p>
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-semibold">${(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total</p>
                        <p>${Number(orderData.total_amount).toFixed(2)}</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button asChild className="w-full" variant="outline">
                           <Link href="/profile/my-orders">My Orders</Link>
                        </Button>
                        <Button asChild className="w-full">
                           <Link href="/shop">Continue Shopping</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <div className="bg-muted/20 min-h-screen">
            <Header />
            <main className="container mx-auto py-12">
                <Suspense fallback={<SuccessSkeleton />}>
                    <SuccessContent />
                </Suspense>
            </main>
            <CartDrawer />
        </div>
    );
}

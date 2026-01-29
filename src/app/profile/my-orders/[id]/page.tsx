
'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSupabase } from '@/lib/supabase/provider';
import { useParams, notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Timeline, TimelineItem, TimelinePoint, TimelineTime, TimelineTitle } from '@/components/ui/timeline';

interface OrderItem {
    id: number;
    quantity: number;
    price_at_purchase: number;
    products: { name: string; featured_image_url: string; } | null;
}

interface OrderDetails {
    id: number;
    order_number: string;
    created_at: string;
    total_amount: number;
    status: OrderStatus;
    shipping_details: {
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zip: string;
    };
    order_items: OrderItem[];
    coupon_code: string | null;
    discount_amount: number | null;
    payment_method: string | null;
    payment_details: {
        trxId: string;
        mobileLast4: string;
    } | null;
}

interface OrderTimelineItem {
    status: string;
    created_at: string;
}

const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
        case 'Delivered': return 'secondary';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
};

export default function MyOrderDetailsPage() {
    const params = useParams<{ id: string }>();
    const orderNumber = params.id;
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [timeline, setTimeline] = useState<OrderTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);

    const getOrder = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        // 1. Fetch the order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .eq('order_number', orderNumber)
            .single();

        if (orderError || !orderData) {
            toast({ variant: "destructive", title: "Error", description: "Order not found or you don't have permission to view it." });
            notFound();
            return;
        }

        // 2. Fetch order items
        const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('id, quantity, price_at_purchase, product_id')
            .eq('order_id', orderData.id);
        
        if (itemsError) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch order items." });
            setLoading(false);
            return;
        }

        // 3. Fetch product details
        const productIds = orderItems.map(item => item.product_id);
        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name, featured_image_url')
            .in('id', productIds);
        
        if (productsError) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch product details for the order." });
            setLoading(false);
            return;
        }

        const productsById = productsData.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {} as Record<number, { id: number, name: string, featured_image_url: string }>);

        const hydratedItems: OrderItem[] = orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
            products: productsById[item.product_id] || null
        }));

        const combinedOrder: OrderDetails = {
            ...orderData,
            order_items: hydratedItems,
        };
        
        setOrder(combinedOrder);
        
        const { data: timelineData } = await supabase.rpc('get_order_history', { p_order_id: orderData.id });
        if (timelineData) {
            setTimeline(timelineData);
        }
        
        setLoading(false);
    }, [user, supabase, toast, orderNumber]);


    useEffect(() => {
        getOrder();
    }, [getOrder]);
    
    if (loading) {
        return (
            <div className="bg-muted/20 min-h-screen">
              <Header />
              <main className="container py-12">
                <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                    <div className="hidden md:block">
                         <aside className="space-y-6">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-96 w-full" />
                        </aside>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-7 w-7 rounded-md" />
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <Card>
                            <CardHeader className="flex-row justify-between items-center">
                                <div>
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-32 mt-2" />
                                </div>
                                <Skeleton className="h-7 w-24 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-16 w-16 rounded-md" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                    ))}
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                                    <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between"><Skeleton className="h-5 w-12" /><Skeleton className="h-5 w-20" /></div>
                                </div>
                                <Separator className="my-4" />
                                <div>
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <div className="space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-48" /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
              </main>
              <CartDrawer />
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const subtotal = order.order_items.reduce((acc, item) => acc + item.price_at_purchase * item.quantity, 0);
    const shipping = Number(order.total_amount) + (order.discount_amount || 0) - subtotal;
    const transactionDetails = order.payment_details;

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                            <Link href="/profile/my-orders">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Back to Orders</span>
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">Order Details</h1>
                    </div>
                    <Card>
                        <CardHeader className="flex-row justify-between items-center">
                            <div>
                                <CardTitle>Order {order.order_number}</CardTitle>
                                <CardDescription>Placed on {format(new Date(order.created_at), 'PP')}</CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(order.status)} className="text-sm">{order.status}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <h4 className="font-semibold mb-4">Order History</h4>
                                <Timeline>
                                    {timeline.map((item, index) => (
                                        <TimelineItem key={index}>
                                            <TimelinePoint />
                                            <TimelineTitle>{item.status}</TimelineTitle>
                                            <TimelineTime>{format(new Date(item.created_at), "PPp")}</TimelineTime>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            </div>
                            <Separator className="my-6" />
                            <div className="space-y-4">
                                {order.order_items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                            <Image 
                                                src={item.products?.featured_image_url || ''} 
                                                alt={item.products?.name || 'Product image'} 
                                                fill 
                                                className="object-contain p-1"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.products?.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">${(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p className="font-medium">${subtotal.toFixed(2)}</p>
                                </div>
                                {order.discount_amount && order.discount_amount > 0 && (
                                    <div className="flex justify-between text-destructive">
                                        <p className="text-muted-foreground">Discount ({order.coupon_code})</p>
                                        <p className="font-medium">-${order.discount_amount.toFixed(2)}</p>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Shipping</p>
                                    <p className="font-medium">${shipping > 0 ? shipping.toFixed(2) : '0.00'}</p>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-semibold text-base">
                                    <p>Total</p>
                                    <p>${Number(order.total_amount).toFixed(2)}</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                             <div>
                                <h4 className="font-semibold mb-2">Shipping Address</h4>
                                <address className="not-italic text-muted-foreground text-sm">
                                    {order.shipping_details.firstName} {order.shipping_details.lastName}<br />
                                    {order.shipping_details.address}<br />
                                    {order.shipping_details.city}, {order.shipping_details.state} {order.shipping_details.zip}<br />
                                    {order.shipping_details.phone}
                                </address>
                            </div>
                             <Separator className="my-4" />
                             <div>
                                <h4 className="font-semibold mb-2">Payment Information</h4>
                                {order.payment_method ? (
                                    <div className="text-sm text-muted-foreground">
                                        <p className="capitalize">Method: {order.payment_method}</p>
                                        {order.payment_method === 'mobile-banking' && transactionDetails && (
                                            <div className="mt-1">
                                                <p>Transaction ID: {transactionDetails.trxId}</p>
                                                <p>Mobile (last 4): {transactionDetails.mobileLast4}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Payment details not available.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </main>
          <CartDrawer />
        </div>
    );
}

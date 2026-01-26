<<<<<<< HEAD

=======
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/provider';
import type { OrderStatus } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
<<<<<<< HEAD
import { updateOrderStatus } from '@/app/actions';
=======
import { updateOrderStatus } from '@/app/actions/order';
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
import { Timeline, TimelineItem, TimelinePoint, TimelineTime, TimelineTitle } from '@/components/ui/timeline';
import { format } from 'date-fns';


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
        email: string;
<<<<<<< HEAD
=======
        phone: string;
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
        address: string;
        city: string;
        state: string;
        zip: string;
    };
    profiles: {
        full_name: string;
        avatar_url: string | null;
    } | null;
    order_items: OrderItem[];
    coupon_code: string | null;
    discount_amount: number | null;
    payment_method: string | null;
    transaction_details: {
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
        case 'Pending': return 'default';
        case 'Processing': return 'outline';
        case 'Shipped': return 'default';
        default: return 'default';
    }
};

export default function OrderDetailsPage() {
    const params = useParams<{ id: string }>();
    const orderNumber = params.id;
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [timeline, setTimeline] = useState<OrderTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<OrderStatus>('Pending');
    const [isUpdating, startUpdateTransition] = useTransition();

    const fetchOrder = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .rpc('get_admin_order_details', { p_order_number: orderNumber });

        if (error || !data || data.length === 0) {
            toast({ variant: "destructive", title: "Error", description: `Order not found. ${error?.message || ''}`.trim() });
            notFound();
        } else {
            const orderData = data[0] as OrderDetails;
            setOrder(orderData);
            setStatus(orderData.status as OrderStatus);

            const { data: timelineData } = await supabase.rpc('get_order_history', { p_order_id: orderData.id });
            if (timelineData) {
                setTimeline(timelineData);
            }
        }
        setLoading(false);
    }, [orderNumber, supabase, toast]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);
    
    const handleUpdate = async () => {
        if (!order) return;
        startUpdateTransition(async () => {
            const result = await updateOrderStatus(order.id, status);

            if (result.error) {
                toast({ variant: "destructive", title: "Update Failed", description: result.error });
            } else {
                toast({
                    title: "Order Status Updated",
                    description: `Order #${result.orderNumber} is now ${status}. A notification has been sent.`,
                });
                fetchOrder(); // Re-fetch to confirm update
            }
        });
    };

    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-6 w-40" />
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-40" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     <div className="grid auto-rows-max gap-4 lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-6 w-24 rounded-full" />
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
                            </CardContent>
                        </Card>
                     </div>
                     <div className="grid auto-rows-max gap-4">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                 <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                     </div>
                </div>
            </main>
        );
    }

    if (!order) {
        return null;
    }

    const subtotal = (order.order_items || []).reduce((acc, item) => acc + item.price_at_purchase * item.quantity, 0);
    const shipping = Number(order.total_amount) + (order.discount_amount || 0) - subtotal;

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/orders">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Order Details
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm">Invoice</Button>
                    <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                        <Bell className="mr-2 h-4 w-4" />
                        {isUpdating ? 'Sending...' : 'Send Notification'}
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <div className="grid auto-rows-max gap-4 lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Order {order.order_number}</CardTitle>
                             <Badge variant={getStatusVariant(status)}>{status}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(order.order_items || []).map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                        <Image 
                                            src={item.products?.featured_image_url || ''} 
                                            alt={item.products?.name || 'Product'} 
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
                        </CardContent>
                    </Card>
                 </div>
                 <div className="grid auto-rows-max gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={order.profiles?.avatar_url || undefined} alt={order.shipping_details.firstName} />
                                    <AvatarFallback>{order.shipping_details.firstName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{order.shipping_details.firstName} {order.shipping_details.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{order.shipping_details.email}</p>
<<<<<<< HEAD
=======
                                    <p className="text-sm text-muted-foreground">{order.shipping_details.phone}</p>
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Shipping Address</h4>
                                <address className="not-italic text-muted-foreground text-sm">
                                    {order.shipping_details.address}<br />
                                    {order.shipping_details.city}, {order.shipping_details.state} {order.shipping_details.zip}
                                </address>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Timeline>
                                {timeline.map((item, index) => (
                                    <TimelineItem key={index}>
                                        <TimelinePoint />
                                        <TimelineTitle>{item.status}</TimelineTitle>
                                        <TimelineTime>{format(new Date(item.created_at), "PPp")}</TimelineTime>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="capitalize">Method: {order.payment_method}</p>
                            {order.payment_method === 'mobile-banking' && order.transaction_details && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    <p>Transaction ID: {order.transaction_details.trxId}</p>
                                    <p>Mobile Number (last 4): {order.transaction_details.mobileLast4}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                             <CardTitle>Order Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Processing">Processing</SelectItem>
                                    <SelectItem value="Shipped">Shipped</SelectItem>
                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update Status'}</Button>
                        </CardFooter>
                    </Card>
                 </div>
            </div>
        </main>
    );
}

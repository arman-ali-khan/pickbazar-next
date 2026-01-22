
'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import type { OrderStatus } from '@/lib/data';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { RefundRequestDialog } from '@/components/refund-request-dialog';

export interface Order {
    id: number;
    order_number: string;
    created_at: string;
    status: OrderStatus;
    total_amount: number;
}

export default function MyOrdersPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const getOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch your orders." });
        } else {
            setOrders(data);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getOrders();
    }, [getOrders]);
    
    const getStatusVariant = (status: OrderStatus) => {
        switch (status) {
            case 'Delivered': return 'secondary';
            case 'Cancelled': return 'destructive';
            default: return 'default';
        }
    };

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>My Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading your orders...</p>
                        ) : orders.length === 0 ? (
                            <p className="text-muted-foreground">You have not placed any orders yet.</p>
                        ) : (
                            <>
                                {/* Desktop View */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">{order.order_number}</TableCell>
                                                    <TableCell>{format(new Date(order.created_at), 'PP')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>${order.total_amount}</TableCell>
                                                    <TableCell className="space-x-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/profile/my-orders/${order.order_number}`}>View Details</Link>
                                                        </Button>
                                                        {order.status === 'Delivered' ? (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                     <Button variant="secondary" size="sm">Request Refund</Button>
                                                                </DialogTrigger>
                                                                <RefundRequestDialog order={order} />
                                                            </Dialog>
                                                        ) : (
                                                            <Button variant="secondary" size="sm" disabled>Request Refund</Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Mobile View */}
                                <div className="block md:hidden space-y-4">
                                    {orders.map(order => (
                                        <Card key={order.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{order.order_number}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'PP')}</p>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Status</p>
                                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                                    </div>
                                                     <div>
                                                        <p className="text-xs text-muted-foreground text-right">Total</p>
                                                        <p className="font-semibold mt-1 text-right">${order.total_amount}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/profile/my-orders/${order.order_number}`}>View Details</Link>
                                                    </Button>
                                                    {order.status === 'Delivered' ? (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="secondary" size="sm">Request Refund</Button>
                                                            </DialogTrigger>
                                                            <RefundRequestDialog order={order} />
                                                        </Dialog>
                                                    ) : (
                                                         <Button variant="secondary" size="sm" disabled>Request Refund</Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

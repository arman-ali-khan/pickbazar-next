'use client';

import { useState, useEffect } from 'react';
import { orders as allOrdersData, products as allProducts } from '@/lib/data';
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
import type { Order } from '@/lib/data';

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Delivered':
            return 'secondary';
        case 'Cancelled':
            return 'destructive';
        case 'Pending':
            return 'default';
        case 'Processing':
            return 'outline';
        case 'Shipped':
            return 'default';
        default:
            return 'default';
    }
};


export default function OrderDetailsPage() {
    const params = useParams<{ id: string }>();
    const order = allOrdersData.find(o => o.id === params.id);
    const { toast } = useToast();
    
    const [status, setStatus] = useState(order?.status);

    useEffect(() => {
        if (!order) {
            notFound();
        }
    }, [order]);

    if (!order) {
        return null;
    }
    
    const handleStatusChange = (newStatus: Order['status']) => {
        setStatus(newStatus);
    };

    const handleUpdate = () => {
        // Here you would normally update the order status in your backend
        console.log(`Updating status to ${status}`);
        toast({
            title: "Order Status Updated",
            description: `Order ${order.id} is now ${status}. A notification has been sent.`,
        });
    };

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 5.00;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

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
                    <Button size="sm" onClick={handleUpdate}>
                        <Bell className="mr-2 h-4 w-4" />
                        Send Notification
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <div className="grid auto-rows-max gap-4 lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Order {order.id}</CardTitle>
                             <Badge variant={getStatusVariant(status || order.status)}>{status || order.status}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map(item => {
                                    const product = allProducts.find(p => p.id === item.id);
                                    return (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                            <Image 
                                                src={product?.image.imageUrl || ''} 
                                                alt={item.name} 
                                                data-ai-hint={product?.image.imageHint} 
                                                fill 
                                                className="object-contain p-1" 
                                            />
                                            </div>
                                            <div className="flex-1">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <Separator className="my-4" />
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p className="font-medium">${subtotal.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Shipping</p>
                                    <p className="font-medium">${shipping.toFixed(2)}</p>
                                </div>
                                 <div className="flex justify-between">
                                    <p className="text-muted-foreground">Tax</p>
                                    <p className="font-medium">${tax.toFixed(2)}</p>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-semibold text-base">
                                    <p>Total</p>
                                    <p>${total.toFixed(2)}</p>
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
                                    <AvatarImage src={order.customer.avatar.imageUrl} alt={order.customer.name} data-ai-hint={order.customer.avatar.imageHint} />
                                    <AvatarFallback>{order.customer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{order.customer.name}</p>
                                    <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Shipping Address</h4>
                                <address className="not-italic text-muted-foreground text-sm">
                                    123 Market St<br />
                                    San Francisco, CA 94103
                                </address>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Billing Address</h4>
                                <address className="not-italic text-muted-foreground text-sm">
                                    Same as shipping
                                </address>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                             <CardTitle>Order Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={status} onValueChange={(value) => handleStatusChange(value as Order['status'])}>
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
                            <Button className="w-full" onClick={handleUpdate}>Update Status</Button>
                        </CardFooter>
                    </Card>
                 </div>
            </div>
        </main>
    );
}
'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const orders = [
    { id: 'ORD-12345', date: 'June 15, 2024', status: 'Delivered', total: '$125.50' },
    { id: 'ORD-12346', date: 'June 18, 2024', status: 'Processing', total: '$89.90' },
    { id: 'ORD-12347', date: 'June 20, 2024', status: 'Shipped', total: '$210.00' },
    { id: 'ORD-12348', date: 'June 21, 2024', status: 'Cancelled', total: '$55.20' },
];

export default function MyOrdersPage() {
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
                                            <TableCell className="font-medium">{order.id}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    order.status === 'Delivered' ? 'secondary' :
                                                    order.status === 'Cancelled' ? 'destructive' :
                                                    'default'
                                                }>{order.status}</Badge>
                                            </TableCell>
                                            <TableCell>{order.total}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm">View Details</Button>
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
                                        <CardTitle className="text-base">{order.id}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{order.date}</p>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <div>
                                            <Badge variant={
                                                order.status === 'Delivered' ? 'secondary' :
                                                order.status === 'Cancelled' ? 'destructive' :
                                                'default'
                                            }>{order.status}</Badge>
                                            <p className="font-semibold mt-2">{order.total}</p>
                                        </div>
                                        <Button variant="outline" size="sm">View Details</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const refunds = [
    { id: 'REF-001', orderId: 'ORD-12348', date: 'June 22, 2024', status: 'Approved', amount: '$55.20' },
    { id: 'REF-002', orderId: 'ORD-12340', date: 'June 10, 2024', status: 'Pending', amount: '$30.00' },
    { id: 'REF-003', orderId: 'ORD-12335', date: 'June 01, 2024', status: 'Rejected', amount: '$15.75' },
];

export default function MyRefundsPage() {
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
                        <CardTitle>My Refunds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Refund ID</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {refunds.map(refund => (
                                    <TableRow key={refund.id}>
                                        <TableCell className="font-medium">{refund.id}</TableCell>
                                        <TableCell>{refund.orderId}</TableCell>
                                        <TableCell>{refund.date}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                refund.status === 'Approved' ? 'secondary' :
                                                refund.status === 'Rejected' ? 'destructive' :
                                                'default'
                                            }>{refund.status}</Badge>
                                        </TableCell>
                                        <TableCell>{refund.amount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Refund {
    id: number;
    order_id: number;
    order_number: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason: string;
    created_at: string;
}

const getStatusVariant = (status: Refund['status']) => {
    switch (status) {
        case 'Approved': return 'secondary';
        case 'Rejected': return 'destructive';
        case 'Pending': return 'default';
        default: return 'default';
    }
};

export default function MyRefundsPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [loading, setLoading] = useState(true);

    const getRefunds = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_refunds', { p_user_id: user.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your refund requests.' });
        } else {
            setRefunds(data || []);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getRefunds();
    }, [getRefunds]);

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
                        <CardDescription>A history of your refund requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? <p>Loading refunds...</p> : refunds.length > 0 ? (
                            <>
                                {/* Desktop View */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Request ID</TableHead>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {refunds.map(refund => (
                                                <TableRow key={refund.id}>
                                                    <TableCell className="font-medium">REF-{refund.id}</TableCell>
                                                    <TableCell>
                                                        <Button asChild variant="link" className="p-0 h-auto">
                                                            <Link href={`/profile/my-orders/${refund.order_number}`}>{refund.order_number}</Link>
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(refund.created_at), 'PP')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>${refund.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Mobile View */}
                                 <div className="block md:hidden space-y-4">
                                    {refunds.map(refund => (
                                        <Card key={refund.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">REF-{refund.id}</CardTitle>
                                                <CardDescription>Order: <Link href={`/profile/my-orders/${refund.order_number}`} className="underline">{refund.order_number}</Link></CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-muted-foreground">{format(new Date(refund.created_at), 'PP')}</span>
                                                    <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                                </div>
                                                <p className="font-semibold text-right">${refund.amount.toFixed(2)}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                         ) : (
                            <p className="text-muted-foreground">You have not requested any refunds.</p>
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

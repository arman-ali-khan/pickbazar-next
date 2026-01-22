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

interface UserTransaction {
    id: number;
    order_id: number;
    order_number: string;
    amount: number;
    payment_method: string;
    status: 'Pending' | 'Completed' | 'Failed';
    created_at: string;
}

const getStatusVariant = (status: UserTransaction['status']) => {
    switch (status) {
        case 'Completed': return 'secondary';
        case 'Failed': return 'destructive';
        default: return 'default';
    }
};

export default function MyTransactionsPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<UserTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const getTransactions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_transactions', { p_user_id: user.id });

        if (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch your transactions." });
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getTransactions();
    }, [getTransactions]);
    
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
                        <CardTitle>My Transactions</CardTitle>
                        <CardDescription>A history of all your payments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading your transactions...</p>
                        ) : transactions.length === 0 ? (
                            <p className="text-muted-foreground">You have not made any transactions yet.</p>
                        ) : (
                            <>
                                {/* Desktop View */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Transaction ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Order</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map(t => (
                                                <TableRow key={t.id}>
                                                    <TableCell className="font-medium">TRN-{t.id}</TableCell>
                                                    <TableCell>{format(new Date(t.created_at), 'PP')}</TableCell>
                                                    <TableCell>{t.payment_method}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(t.status)}>{t.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>${t.amount.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="link" asChild className="p-0 h-auto">
                                                            <Link href={`/profile/my-orders/${t.order_number}`}>{t.order_number}</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Mobile View */}
                                <div className="block md:hidden space-y-4">
                                    {transactions.map(t => (
                                        <Card key={t.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">TRN-{t.id}</CardTitle>
                                                <CardDescription>Order: <Link href={`/profile/my-orders/${t.order_number}`} className="underline">{t.order_number}</Link></CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                  <span>{format(new Date(t.created_at), 'PPp')}</span>
                                                  <Badge variant={getStatusVariant(t.status)}>{t.status}</Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="text-muted-foreground text-sm">{t.payment_method}</span>
                                                  <span className="font-semibold">${t.amount.toFixed(2)}</span>
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

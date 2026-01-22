
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cancelRefund } from '@/app/actions';

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
    const [isPending, startTransition] = useTransition();

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

    const handleCancel = (refundId: number) => {
        startTransition(async () => {
            const result = await cancelRefund(refundId);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error Cancelling Refund', description: result.error });
            } else {
                toast({ title: 'Refund Request Cancelled', description: 'Your refund request has been successfully withdrawn.' });
                getRefunds();
            }
        });
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
                                                <TableHead>Order</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
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
                                                    <TableCell suppressHydrationWarning>{format(new Date(refund.created_at), 'PP')}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>${refund.amount.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {refund.status === 'Pending' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="destructive" size="sm" disabled={isPending}>Cancel</Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently cancel your refund request for order {refund.order_number}. This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleCancel(refund.id)}>
                                                                            Yes, Cancel It
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </TableCell>
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
                                            <CardContent className="space-y-3">
                                                <p className="text-sm italic text-muted-foreground">"{refund.reason}"</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>{format(new Date(refund.created_at), 'PP')}</span>
                                                    <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <p className="font-semibold text-right">${refund.amount.toFixed(2)}</p>
                                                     {refund.status === 'Pending' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" size="sm" disabled={isPending}>Cancel Request</Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will permanently cancel your refund request for order {refund.order_number}. This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleCancel(refund.id)}>
                                                                        Yes, Cancel It
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </>
                         ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">You have not requested any refunds.</p>
                            </div>
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


'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { updateRefundStatus } from "@/app/actions/order";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface AdminRefund {
    id: number;
    order_id: number;
    order_number: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason: string;
    created_at: string;
    user_id: string;
    customer_name: string;
    customer_avatar_url: string;
}

const getStatusVariant = (status: AdminRefund['status']) => {
    switch (status) {
        case 'Approved': return 'secondary';
        case 'Rejected': return 'destructive';
        case 'Pending': return 'default';
        default: return 'default';
    }
};

export default function AdminRefundsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [refunds, setRefunds] = useState<AdminRefund[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const getRefunds = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admin_refunds');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching refunds', description: error.message });
        } else {
            setRefunds(data || []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getRefunds();
    }, [getRefunds]);

    const handleAction = (refundId: number, status: 'Approved' | 'Rejected') => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('refundId', String(refundId));
            formData.append('status', status);
            const result = await updateRefundStatus(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Refund Status Updated' });
                getRefunds();
            }
        });
    }

    if (loading) {
        return <p>Loading refunds...</p>
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Refunds</CardTitle>
                    <CardDescription>Manage your customer refund requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {refunds.map((refund) => (
                                    <TableRow key={refund.id}>
                                        <TableCell className="font-medium">REF-{refund.id}</TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={refund.customer_avatar_url ?? undefined} alt={refund.customer_name} />
                                                    <AvatarFallback>{refund.customer_name?.charAt(0) ?? 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{refund.customer_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(refund.created_at), 'PP')}</TableCell>
                                        <TableCell>${refund.amount.toFixed(2)}</TableCell>
                                        <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isPending}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {refund.status === 'Pending' && (
                                                        <>
                                                        <DropdownMenuItem onClick={() => handleAction(refund.id, 'Approved')}>Approve</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(refund.id, 'Rejected')}>Reject</DropdownMenuItem>
                                                        </>
                                                    )}
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/admin/orders/${refund.order_number}`}>View Order</Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {refunds.map((refund) => (
                            <Card key={refund.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-base">
                                        REF-{refund.id}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isPending}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {refund.status === 'Pending' && (
                                                    <>
                                                    <DropdownMenuItem onClick={() => handleAction(refund.id, 'Approved')}>Approve</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAction(refund.id, 'Rejected')}>Reject</DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/orders/${refund.order_number}`}>View Order</Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardTitle>
                                    <CardDescription>
                                        <Link href={`/admin/orders/${refund.order_number}`} className="text-muted-foreground text-sm hover:underline">Order ID: {refund.order_number}</Link>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm italic text-muted-foreground">"{refund.reason}"</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{format(new Date(refund.created_at), 'PP')}</p>
                                            <p className="font-semibold mt-2">${refund.amount.toFixed(2)}</p>
                                        </div>
                                        <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}

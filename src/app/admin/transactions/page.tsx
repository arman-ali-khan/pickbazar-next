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
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { format } from 'date-fns';
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Transaction {
    id: number;
    order_id: number;
    order_number: string;
    customer_name: string;
    customer_avatar: string | null;
    amount: number;
    payment_method: string;
    status: 'Pending' | 'Completed' | 'Failed';
    created_at: string;
}

const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed':
            return 'secondary';
        case 'Failed':
            return 'destructive';
        case 'Pending':
            return 'default';
        default:
            return 'default';
    }
};

export default function AdminTransactionsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const getTransactions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admin_transactions');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching transactions', description: error.message });
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getTransactions();
    }, [getTransactions]);

    if (loading) {
        return <p>Loading transactions...</p>
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>View and manage your transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">TRN-{transaction.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={transaction.customer_avatar ?? undefined} alt={transaction.customer_name} />
                                                    <AvatarFallback>{transaction.customer_name?.charAt(0) ?? 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{transaction.customer_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell suppressHydrationWarning>{format(new Date(transaction.created_at), 'PPp')}</TableCell>
                                        <TableCell>{transaction.payment_method}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                     {transaction.order_number && <DropdownMenuItem asChild>
                                                        <Link href={`/admin/orders/${transaction.order_number}`}>View Order</Link>
                                                    </DropdownMenuItem>}
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
                        {transactions.map((transaction) => (
                            <Card key={transaction.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-base">
                                        <span>TRN-{transaction.id}</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {transaction.order_number && <DropdownMenuItem asChild>
                                                    <Link href={`/admin/orders/${transaction.order_number}`}>View Order</Link>
                                                </DropdownMenuItem>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardTitle>
                                    {transaction.order_number && <CardDescription>
                                        <Link href={`/admin/orders/${transaction.order_number}`} className="text-muted-foreground hover:underline">Order ID: {transaction.order_number}</Link>
                                    </CardDescription>}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                     <p className="text-sm text-muted-foreground" suppressHydrationWarning>{format(new Date(transaction.created_at), 'PPp')}</p>
                                     <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{transaction.payment_method}</p>
                                            <p className="font-semibold mt-1">${transaction.amount.toFixed(2)}</p>
                                        </div>
                                        <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
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

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
import { useState } from "react";
import Link from 'next/link';
import { transactions as initialTransactions } from '@/lib/data';
import { format } from 'date-fns';

type Transaction = typeof initialTransactions[0];

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
    const [transactions, setTransactions] = useState(initialTransactions);

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
                                    <TableHead>Order ID</TableHead>
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
                                        <TableCell className="font-medium">{transaction.id}</TableCell>
                                        <TableCell>
                                            <Button variant="link" asChild className="p-0 h-auto">
                                                <Link href={`/admin/orders/${transaction.orderId}`}>{transaction.orderId}</Link>
                                            </Button>
                                        </TableCell>
                                        <TableCell suppressHydrationWarning>{format(new Date(transaction.date), 'PPp')}</TableCell>
                                        <TableCell>{transaction.paymentMethod}</TableCell>
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
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/admin/orders/${transaction.orderId}`}>View Order</Link>
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
                        {transactions.map((transaction) => (
                            <Card key={transaction.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-base">
                                        {transaction.id}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/orders/${transaction.orderId}`}>View Order</Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardTitle>
                                    <CardDescription>
                                        <Button variant="link" asChild className="p-0 h-auto text-muted-foreground text-sm">
                                            <Link href={`/admin/orders/${transaction.orderId}`}>Order ID: {transaction.orderId}</Link>
                                        </Button>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                     <p className="text-sm text-muted-foreground" suppressHydrationWarning>{format(new Date(transaction.date), 'PPp')}</p>
                                     <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{transaction.paymentMethod}</p>
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

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
import Link from "next/link";


const initialRefunds = [
    { id: 'REF-001', orderId: 'ORD-004', date: 'June 22, 2024', status: 'Approved' as const, amount: '$55.20' },
    { id: 'REF-002', orderId: 'ORD-002', date: 'June 10, 2024', status: 'Pending' as const, amount: '$30.00' },
    { id: 'REF-003', orderId: 'ORD-003', date: 'June 01, 2024', status: 'Rejected' as const, amount: '$15.75' },
    { id: 'REF-004', orderId: 'ORD-001', date: 'May 28, 2024', status: 'Approved' as const, amount: '$110.00' },
];

type Refund = typeof initialRefunds[0];

const getStatusVariant = (status: Refund['status']) => {
    switch (status) {
        case 'Approved':
            return 'secondary';
        case 'Rejected':
            return 'destructive';
        case 'Pending':
            return 'default';
        default:
            return 'default';
    }
};

export default function AdminRefundsPage() {
    const [refunds, setRefunds] = useState(initialRefunds);

    const handleAction = (refundId: string, action: 'approve' | 'reject') => {
        setRefunds(refunds.map(r => r.id === refundId ? { ...r, status: action === 'approve' ? 'Approved' : 'Rejected' } : r));
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Refunds</CardTitle>
                    <CardDescription>Manage your refund requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Refund ID</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {refunds.map((refund) => (
                                    <TableRow key={refund.id}>
                                        <TableCell className="font-medium">{refund.id}</TableCell>
                                        <TableCell>
                                            <Button variant="link" asChild className="p-0 h-auto">
                                                <Link href={`/admin/orders/${refund.orderId}`}>{refund.orderId}</Link>
                                            </Button>
                                        </TableCell>
                                        <TableCell>{refund.date}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{refund.amount}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {refund.status === 'Pending' && (
                                                        <>
                                                        <DropdownMenuItem onClick={() => handleAction(refund.id, 'approve')}>Approve</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(refund.id, 'reject')}>Reject</DropdownMenuItem>
                                                        </>
                                                    )}
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/admin/orders/${refund.orderId}`}>View Order</Link>
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
                                        {refund.id}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {refund.status === 'Pending' && (
                                                    <>
                                                    <DropdownMenuItem onClick={() => handleAction(refund.id, 'approve')}>Approve</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAction(refund.id, 'reject')}>Reject</DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/orders/${refund.orderId}`}>View Order</Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardTitle>
                                    <CardDescription>
                                        <Button variant="link" asChild className="p-0 h-auto text-muted-foreground text-sm">
                                            <Link href={`/admin/orders/${refund.orderId}`}>Order ID: {refund.orderId}</Link>
                                        </Button>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{refund.date}</p>
                                        <p className="font-semibold mt-2">{refund.amount}</p>
                                    </div>
                                    <Badge variant={getStatusVariant(refund.status)}>{refund.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}

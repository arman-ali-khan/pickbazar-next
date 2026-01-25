'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AdminRefund {
    id: number;
    order_number: string;
    amount: number;
    customer_name: string;
    customer_avatar_url: string;
    created_at: string;
}

export default function PendingRefunds({ refunds }: { refunds: AdminRefund[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Refunds</CardTitle>
        <CardDescription>
          {refunds.length > 0 ? `You have ${refunds.length} refund requests.` : 'No pending refund requests.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {refunds.length > 0 ? (
          <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {refunds.map((refund) => (
                         <TableRow key={refund.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border">
                                      <AvatarImage src={refund.customer_avatar_url ?? undefined} alt={refund.customer_name} />
                                      <AvatarFallback>{(refund.customer_name ?? 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{refund.customer_name}</p>
                                        <p className="text-xs text-muted-foreground">Order <Link href={`/admin/orders/${refund.order_number}`} className="hover:underline">{refund.order_number}</Link></p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <p className="text-sm font-bold">${refund.amount.toFixed(2)}</p>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground" suppressHydrationWarning>
                                {formatDistanceToNow(new Date(refund.created_at), { addSuffix: true })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             <Button asChild className="w-full mt-4">
              <Link href="/admin/refunds">Manage All Refunds</Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending refund requests.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

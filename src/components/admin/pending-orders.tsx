'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "../ui/badge";
import { OrderStatus } from "@/lib/data";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type OrderWithCustomer = {
    id: number;
    order_number: string;
    created_at: string;
    total_amount: number;
    status: OrderStatus;
    customer_name: string | null;
    customer_email: string;
    customer_avatar_url: string | null;
}

export default function PendingOrders({ orders }: { orders: OrderWithCustomer[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Orders</CardTitle>
        <CardDescription>
          {orders.length > 0 ? `You have ${orders.length} orders to process.` : 'No pending orders.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border">
                                      <AvatarImage src={order.customer_avatar_url ?? undefined} alt={order.customer_name ?? ''} />
                                      <AvatarFallback>{(order.customer_name ?? 'G').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Link href={`/admin/orders/${order.order_number}`} className="font-medium text-sm hover:underline">{order.order_number}</Link>
                                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="font-semibold">${order.total_amount.toFixed(2)}</TableCell>
                             <TableCell className="text-right text-xs text-muted-foreground" suppressHydrationWarning>
                                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button asChild className="w-full mt-4">
              <Link href="/admin/orders">Manage All Orders</Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending orders right now.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

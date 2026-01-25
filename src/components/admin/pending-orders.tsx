'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "../ui/badge";
import { OrderStatus } from "@/lib/data";

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

const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
        case 'Delivered': return 'secondary';
        case 'Cancelled': return 'destructive';
        case 'Pending': return 'default';
        case 'Processing': return 'outline';
        case 'Shipped': return 'default';
        default: return 'default';
    }
};

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
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={order.customer_avatar_url ?? undefined} alt={order.customer_name ?? ''} />
                  <AvatarFallback>{(order.customer_name ?? 'G').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {order.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Order <Link href={`/admin/orders/${order.order_number}`} className="hover:underline font-medium text-foreground">{order.order_number}</Link>
                      </p>
                    </div>
                     <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-bold">
                            ${order.total_amount.toFixed(2)}
                        </div>
                         <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
             <Button asChild className="w-full mt-6">
              <Link href="/admin/orders">Manage All Orders</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending orders right now.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from 'date-fns';

interface AdminRefund {
    id: number;
    order_number: string;
    amount: number;
    created_at: string;
    customer_name: string;
    customer_avatar_url: string;
}

export default function RecentRefundRequests({ refunds }: { refunds: AdminRefund[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Refund Requests</CardTitle>
        <CardDescription>
          {refunds.length > 0 ? `You have ${refunds.length} new refund requests.` : 'No pending refunds right now.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {refunds.length > 0 ? (
          <div className="space-y-6">
            {refunds.map((refund) => (
              <div key={refund.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={refund.customer_avatar_url ?? undefined} alt={refund.customer_name ?? ''} />
                  <AvatarFallback>{(refund.customer_name ?? 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {refund.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Order <Link href={`/admin/orders/${refund.order_number}`} className="hover:underline font-medium text-foreground">{refund.order_number}</Link>
                      </p>
                    </div>
                    <div className="text-sm font-bold text-destructive">
                      -${refund.amount.toFixed(2)}
                    </div>
                  </div>
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    Requested {formatDistanceToNow(new Date(refund.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
             <Button asChild className="w-full mt-6">
              <Link href="/admin/refunds">Manage All Refunds</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>All caught up! No pending refunds.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

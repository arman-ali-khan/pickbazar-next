
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { requestRefund } from '@/app/actions';
import type { Order } from '@/app/profile/my-orders/page';

interface RefundRequestDialogProps {
  order: Order;
}

export function RefundRequestDialog({ order }: RefundRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
        const formData = new FormData();
        formData.append('orderId', String(order.id));
        formData.append('amount', String(order.total_amount));
        formData.append('reason', reason);

        const result = await requestRefund(formData);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Refund Request Submitted', description: 'Your request is being processed.' });
            // The DialogClose will be inside the form, so we can wrap the submit button
        }
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Request Refund for Order {order.order_number}</DialogTitle>
        <DialogDescription>
          Please provide a reason for your refund request. Our team will review it shortly.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Item was damaged, wrong item received, etc."
              required
            />
          </div>
          <p className="text-sm font-semibold">Refund Amount: ${order.total_amount}</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isPending || !reason}>
            {isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

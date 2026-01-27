'use client';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { clearCart } from '@/lib/redux/slices/cartSlice';


interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
}

interface AppliedDiscount {
  code: string;
  discount: number;
}

interface SslCommerzDialogProps {
    amount: number;
    shippingInfo: ShippingInfo | null;
    cartItems: CartItem[];
    appliedDiscount: AppliedDiscount | null;
}

export function SslCommerzDialog({ amount, shippingInfo, cartItems, appliedDiscount }: SslCommerzDialogProps) {
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSslPayment = async () => {
        if (!shippingInfo) {
            toast({ variant: 'destructive', title: 'Error', description: 'Shipping information is missing.' });
            return;
        }
        setIsProcessing(true);

        try {
            const response = await fetch('/api/payment/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, shippingInfo, cartItems, appliedDiscount }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize payment.');
            }

            // Clear client-side cart optimistically before redirect
            dispatch(clearCart());
            localStorage.removeItem('shippingInfo');
            localStorage.removeItem('appliedDiscount');
            localStorage.removeItem('shippingCost');

            // Redirect to SSLCommerz Gateway
            window.location.href = data.url;

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
            setIsProcessing(false);
        }
    }

    return (
        <>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>SSLCommerz Payment</DialogTitle>
                    <DialogDescription>
                        You will be redirected to the secure payment gateway to complete your purchase.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center">
                    <p>Amount to Pay: <span className='font-bold text-lg'>${amount.toFixed(2)}</span></p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSslPayment} disabled={isProcessing}>
                        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Proceed to Pay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </>
    );
}
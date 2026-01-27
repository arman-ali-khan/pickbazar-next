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
import { useSupabase } from '@/lib/supabase/provider';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Script from 'next/script';
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
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const [settings, setSettings] = useState<any>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoadingSettings(true);
            const { data } = await supabase.rpc('get_all_settings');
            if (data && data[0]) {
                setSettings(data[0]);
            }
            setIsLoadingSettings(false);
        };
        fetchSettings();
    }, [supabase]);

    const handleSslPayment = async () => {
        if (typeof window === 'undefined' || !window.easyCheckout) {
            toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway is not ready. Please refresh and try again.' });
            return;
        }
        if (!settings || !shippingInfo || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Configuration, shipping info, or user session is missing.' });
            return;
        }

        const isSandbox = settings.sslcommerz_mode === 'sandbox';
        const store_id = isSandbox ? settings.sslcommerz_sandbox_store_id : settings.sslcommerz_production_store_id;
        const store_password = isSandbox ? settings.sslcommerz_sandbox_store_password : settings.sslcommerz_production_store_password;

        if (!store_id || !store_password) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'SSLCommerz is not configured correctly in admin settings.' });
            return;
        }

        setIsProcessing(true);

        const orderItems = cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
        }));
        
        const { data: orderNumber, error: createOrderError } = await supabase.rpc('create_order', {
            p_total_amount: amount,
            p_shipping_details: shippingInfo,
            p_items: orderItems,
            p_payment_method: 'sslcommerz',
            p_transaction_details: null,
            p_coupon_code: appliedDiscount?.code || null,
            p_discount_amount: appliedDiscount?.discount || 0,
            p_initial_status: 'Pending'
        });

        if (createOrderError || !orderNumber) {
            toast({ variant: 'destructive', title: 'Order Creation Failed', description: createOrderError?.message || 'Could not initiate the order.' });
            setIsProcessing(false);
            return;
        }
        
        dispatch(clearCart());
        localStorage.removeItem('shippingInfo');
        localStorage.removeItem('appliedDiscount');
        localStorage.removeItem('shippingCost');

        const paymentData = {
            store_id,
            store_password,
            total_amount: amount,
            currency: 'BDT',
            tran_id: orderNumber,
            success_url: `${window.location.origin}/api/payment/success`,
            fail_url: `${window.location.origin}/api/payment/fail`,
            cancel_url: `${window.location.origin}/api/payment/cancel`,
            ipn_url: `${window.location.origin}/api/payment/ipn`,
            cus_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            cus_email: shippingInfo.email,
            cus_phone: shippingInfo.phone,
            cus_add1: shippingInfo.address,
            cus_city: shippingInfo.city,
            cus_state: shippingInfo.state,
            cus_postcode: shippingInfo.zip,
            cus_country: 'Bangladesh',
            shipping_method: 'Courier',
            product_name: 'Various Items from Pickbazar',
            product_category: 'Ecommerce',
            product_profile: 'general',
        };

        window.easyCheckout(paymentData);
    }

    const scriptSrc = settings?.sslcommerz_mode === 'sandbox'
      ? 'https://sandbox.sslcommerz.com/easycheckout/v1/easyCheckout.js'
      : 'https://secure.sslcommerz.com/easycheckout/v1/easyCheckout.js';

    return (
        <>
            {settings && <Script src={scriptSrc} strategy="lazyOnload" onLoad={() => setScriptLoaded(true)} />}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>SSLCommerz Payment</DialogTitle>
                    <DialogDescription>
                        You will be redirected to the secure payment gateway to complete your purchase.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center">
                    {isLoadingSettings ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                        <div className='space-y-4'>
                            <p>Amount to Pay: <span className='font-bold text-lg'>${amount.toFixed(2)}</span></p>
                            {settings?.sslcommerz_mode === 'sandbox' && (
                               <p className='text-xs text-muted-foreground'>This is a sandbox environment. Use test credentials to pay.</p>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSslPayment} disabled={isLoadingSettings || isProcessing || !scriptLoaded}>
                        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Proceed to Pay'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </>
    );
}
    
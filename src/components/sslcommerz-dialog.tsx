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

// Define the shape of shippingInfo here to make the component self-contained
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

interface SslCommerzDialogProps {
    amount: number;
    onSuccess: () => void;
    shippingInfo: ShippingInfo | null;
}

declare global {
  interface Window {
    easyCheckout: (data: any, callback: (response: any) => void) => void;
  }
}

export function SslCommerzDialog({ amount, onSuccess, shippingInfo }: SslCommerzDialogProps) {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.from('settings').select('key, value');
            
            if (error) {
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
                setIsLoading(false);
                return;
            } 
            
            if (data) {
                const settingsData = data.reduce((acc, { key, value }) => {
                    if (!key) return acc;
        
                    if (value === null) {
                        (acc as any)[key] = null;
                        return acc;
                    }
        
                    if (['social_links', 'mobile_banking_options'].includes(key)) {
                        try {
                            (acc as any)[key] = JSON.parse(value);
                        } catch {
                            (acc as any)[key] = [];
                        }
                    } else if (key.startsWith('enable_') || key === 'maintenance_mode') {
                        (acc as any)[key] = value === 'true';
                    } else if (key === 'shipping_cost') {
                        const numValue = parseFloat(value);
                        (acc as any)[key] = isNaN(numValue) ? null : numValue;
                    } else {
                        (acc as any)[key] = value;
                    }
                    return acc;
                }, {} as { [key: string]: any });
                
                setSettings(settingsData);
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, [supabase, toast]);

    useEffect(() => {
        if (!settings) return;

        const isSandbox = settings.sslcommerz_mode === 'sandbox';
        const scriptSrc = isSandbox
            ? 'https://sandbox.sslcommerz.com/easycheckout/v1/easyCheckout.js'
            : 'https://secure.sslcommerz.com/easycheckout/v1/easyCheckout.js';
        const scriptId = 'sslcommerz-script';
        
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        
        // If a script exists but has the wrong source, replace it
        if (script && script.src !== scriptSrc) {
            script.remove();
            script = null;
        }
        
        // If the script is already loaded and correct, we're done
        if (script && window.easyCheckout) {
            setScriptLoaded(true);
            return;
        }
        
        // If script doesn't exist, create and append it
        if (!script) {
            const newScript = document.createElement('script');
            newScript.id = scriptId;
            newScript.src = scriptSrc;
            newScript.async = true;

            const handleLoad = () => {
                setScriptLoaded(true);
                newScript.removeEventListener('load', handleLoad);
                newScript.removeEventListener('error', handleError);
            };

            const handleError = (e: Event) => {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load payment gateway script.' });
                document.getElementById(scriptId)?.remove(); // Clean up failed script
                setScriptLoaded(false); // Reset loaded state
                newScript.removeEventListener('load', handleLoad);
                newScript.removeEventListener('error', handleError);
            };

            newScript.addEventListener('load', handleLoad);
            newScript.addEventListener('error', handleError);
            
            document.body.appendChild(newScript);
        }
        
    }, [settings, toast]);
    
    const handleSslPayment = () => {
        if (!scriptLoaded) {
            toast({ variant: 'destructive', title: 'Please Wait', description: 'Payment gateway is still loading.' });
            return;
        }
        if (!settings || !shippingInfo) {
            toast({ variant: 'destructive', title: 'Error', description: 'Configuration or shipping info is missing.' });
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
        const tran_id = `PBZ_${Date.now()}`;

        const paymentData = {
            store_id,
            store_password,
            total_amount: amount,
            currency: 'BDT',
            tran_id,
            success_url: '#', // Callback handles success
            fail_url: '#',
            cancel_url: '#',
            cus_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            cus_email: shippingInfo.email,
            cus_phone: shippingInfo.phone,
            cus_add1: shippingInfo.address,
            cus_city: shippingInfo.city,
            cus_state: shippingInfo.state,
            cus_postcode: shippingInfo.zip,
            cus_country: 'Bangladesh',
            shipping_method: 'Courier',
            product_name: 'Various Items',
            product_category: 'Groceries',
            product_profile: 'general',
        };

        if (window.easyCheckout) {
            window.easyCheckout(paymentData, (response: any) => {
                setIsProcessing(false);
                if (response && (response.status === 'success' || response.status === 'VALIDATED')) {
                    toast({ title: 'Payment Successful', description: 'Processing your order...' });
                    onSuccess();
                } else {
                    toast({ variant: 'destructive', title: 'Payment Failed', description: response.failedreason || 'The payment was not completed.' });
                }
            });
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'Payment gateway did not load correctly.' });
             setIsProcessing(false);
        }
    }
    
    const storeId = settings?.sslcommerz_mode === 'sandbox'
        ? settings?.sslcommerz_sandbox_store_id
        : settings?.sslcommerz_production_store_id;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>SSLCommerz Payment</DialogTitle>
                <DialogDescription>
                    You are being redirected to the secure payment gateway.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : storeId ? (
                    <div className='space-y-4'>
                        <p>Mode: <span className='font-semibold capitalize'>{settings?.sslcommerz_mode}</span></p>
                        <p>Amount to Pay: <span className='font-bold text-lg'>${amount.toFixed(2)}</span></p>
                        {settings?.sslcommerz_mode === 'sandbox' && (
                           <p className='text-xs text-muted-foreground'>This is a sandbox environment. No real payment will be processed.</p>
                        )}
                    </div>
                ) : (
                    <p className='text-destructive'>SSLCommerz is not configured correctly. Please contact support.</p>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSslPayment} disabled={isLoading || isProcessing || !storeId || !scriptLoaded}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : 'Pay Now'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

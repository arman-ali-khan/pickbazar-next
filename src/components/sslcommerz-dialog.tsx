
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

interface SslCommerzDialogProps {
    amount: number;
    onSuccess: () => void;
}

export function SslCommerzDialog({ amount, onSuccess }: SslCommerzDialogProps) {
    const { supabase } = useSupabase();
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value')
                .in('key', [
                    'sslcommerz_mode',
                    'sslcommerz_sandbox_store_id',
                    'sslcommerz_production_store_id'
                ]);
            
            if (error) {
                console.error('Error fetching SSLCommerz settings:', error);
            } else if (data) {
                const settingsData = data.reduce((acc, { key, value }) => {
                    if (key) (acc as any)[key] = value;
                    return acc;
                }, {} as { [key: string]: any });
                setSettings(settingsData);
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, [supabase]);
    
    const handlePayment = () => {
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
        }, 3000);
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
                        <p className='text-xs text-muted-foreground'>This is a sandbox environment. No real payment will be processed.</p>
                    </div>
                ) : (
                    <p className='text-destructive'>SSLCommerz is not configured correctly. Please contact support.</p>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handlePayment} disabled={isLoading || isProcessing || !storeId}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Pay Now'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

    

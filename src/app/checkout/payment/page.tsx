'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { selectSubtotal, selectCartItems, clearCart, removeFromCart } from '@/lib/redux/slices/cartSlice';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import { CreditCard, Landmark, Smartphone, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
}

interface AppliedDiscount {
  code: string;
  discount: number;
}

export default function PaymentPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { supabase, user, loading: authLoading } = useSupabase();
    const { toast } = useToast();

    const cartItems = useAppSelector(selectCartItems);
    const subtotal = useAppSelector(selectSubtotal);
    
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [trxId, setTrxId] = useState('');
    const [mobileLast4, setMobileLast4] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

    const shippingCost = 5.00;
    const discountAmount = appliedDiscount?.discount || 0;
    const total = subtotal + shippingCost - discountAmount;

    useEffect(() => {
        if (!authLoading && !user) {
            toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please login to continue.' });
            router.push('/checkout');
            return;
        }

        const savedInfo = localStorage.getItem('shippingInfo');
        const savedDiscount = localStorage.getItem('appliedDiscount');

        if (savedDiscount) {
            setAppliedDiscount(JSON.parse(savedDiscount));
        }

        if (savedInfo) {
            setShippingInfo(JSON.parse(savedInfo));
        } else if (cartItems.length > 0) {
            // If no shipping info but we have cart items, something is wrong, go back
            router.push('/checkout');
        }
    }, [router, cartItems, authLoading, user, toast]);
    
    const handlePayment = async () => {
        if (!shippingInfo || !user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'User or shipping information is missing.',
            });
            return;
        }

        setIsProcessing(true);

        const orderItems = cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
        }));
        
        const transactionDetails = selectedMethod === 'mobile-banking' ? { trxId, mobileLast4 } : null;

        const { data: orderNumber, error } = await supabase.rpc('create_order', {
            p_user_id: user.id,
            p_total_amount: total,
            p_shipping_details: shippingInfo,
            p_items: orderItems,
            p_payment_method: selectedMethod,
            p_transaction_details: transactionDetails,
            p_coupon_code: appliedDiscount?.code || null,
            p_discount_amount: discountAmount,
        });

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: error.message,
            });
            setIsProcessing(false);
            return;
        }

        dispatch(clearCart());
        localStorage.removeItem('shippingInfo');
        localStorage.removeItem('appliedDiscount');
        
        router.push(`/checkout/success?order_number=${orderNumber}`);
    };

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Shipping To</CardTitle>
                    <Button variant="link" asChild className="p-0 h-auto">
                        <Link href="/checkout">Change</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {shippingInfo ? (
                         <div className="text-sm text-muted-foreground">
                            <p className="font-semibold text-foreground">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                            <p>{shippingInfo.address}</p>
                            <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}</p>
                            <p>{shippingInfo.email}</p>
                         </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Loading shipping details...</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items in Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                          <Image src={item.image.imageUrl} alt={item.name} data-ai-hint={item.image.imageHint} fill className="object-contain p-1" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => dispatch(removeFromCart(item.id))}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Choose Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-4">
                  <Label htmlFor="card" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or Amex</p>
                    </div>
                    <RadioGroupItem value="card" id="card" />
                  </Label>

                  <Label 
                    htmlFor="mobile-banking" 
                    className={cn(
                        "flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary",
                        selectedMethod === 'mobile-banking' && "rounded-b-none"
                    )}
                  >
                    <Smartphone className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Mobile Banking</p>
                      <p className="text-sm text-muted-foreground">Pay with bKash, Nagad, Rocket</p>
                    </div>
                    <RadioGroupItem value="mobile-banking" id="mobile-banking" />
                  </Label>
                  {selectedMethod === 'mobile-banking' && (
                    <div className="p-4 border border-t-0 rounded-b-md bg-muted/20 space-y-4 -mt-4">
                        <p className="text-sm text-muted-foreground">
                            1. Go to your bKash/Nagad/Rocket App and select 'Send Money'.<br/>
                            2. Enter the agent number: <strong className="text-primary">01xxxxxxxxx</strong><br/>
                            3. Enter the total amount: <strong className="text-primary">${total.toFixed(2)}</strong><br/>
                            4. Complete the transaction and enter the details below.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="trxId">Transaction ID</Label>
                                <Input id="trxId" placeholder="Enter TrxID" value={trxId} onChange={(e) => setTrxId(e.target.value)} required={selectedMethod === 'mobile-banking'} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobileLast4">Your Mobile No. (Last 4 Digits)</Label>
                                <Input id="mobileLast4" placeholder="e.g., 1234" value={mobileLast4} onChange={(e) => setMobileLast4(e.target.value)} required={selectedMethod === 'mobile-banking'} />
                            </div>
                        </div>
                    </div>
                  )}

                  <Label htmlFor="sslcommerz" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">SSLCommerz</p>
                      <p className="text-sm text-muted-foreground">Secure online payment gateway</p>
                    </div>
                    <RadioGroupItem value="sslcommerz" id="sslcommerz" />
                  </Label>

                   <Label htmlFor="cod" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <Landmark className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay with cash when your order arrives</p>
                    </div>
                    <RadioGroupItem value="cod" id="cod" />
                  </Label>
                </RadioGroup>
                <Separator className="my-6" />
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Subtotal</p>
                        <p className="font-semibold">${subtotal.toFixed(2)}</p>
                    </div>
                     {discountAmount > 0 && (
                        <div className="flex justify-between text-destructive">
                            <p>Discount ({appliedDiscount?.code})</p>
                            <p className="font-semibold">-${discountAmount.toFixed(2)}</p>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Shipping</p>
                        <p className="font-semibold">${shippingCost.toFixed(2)}</p>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total</p>
                        <p>${total.toFixed(2)}</p>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                 <Button onClick={handlePayment} className="w-full h-12 text-lg" disabled={isProcessing || total < 0 || (selectedMethod === 'mobile-banking' && (!trxId || !mobileLast4))}>
                    {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </Button>
              </CardFooter>
            </Card>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { selectSubtotal, selectCartItems, clearCart } from '@/lib/redux/slices/cartSlice';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Landmark, Smartphone, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector(selectCartItems);
    const subtotal = useAppSelector(selectSubtotal);
    const shippingCost = 5.00;
    const total = subtotal + shippingCost;
    
    const handlePayment = () => {
        const orderData = {
            items: cartItems,
            total,
            orderId: `ORD-${Date.now()}`
        };
        const query = encodeURIComponent(JSON.stringify(orderData));
        router.push(`/checkout/success?data=${query}`);
        dispatch(clearCart());
    };

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Choose Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="card" className="space-y-4">
                  <Label htmlFor="card" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or Amex</p>
                    </div>
                    <RadioGroupItem value="card" id="card" />
                  </Label>
                  <Label htmlFor="mobile-banking" className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">Mobile Banking</p>
                      <p className="text-sm text-muted-foreground">Pay with bKash, Nagad, Rocket</p>
                    </div>
                    <RadioGroupItem value="mobile-banking" id="mobile-banking" />
                  </Label>
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
                 <Button onClick={handlePayment} className="w-full h-12 text-lg">
                    Pay ${total.toFixed(2)}
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

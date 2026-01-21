'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectSubtotal, selectCartItems } from '@/lib/redux/slices/cartSlice';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
}

export default function CheckoutPage() {
    const cartItems = useAppSelector(selectCartItems);
    const subtotal = useAppSelector(selectSubtotal);
    const shippingCost = 5.00;
    const total = subtotal + shippingCost;
    
    const { supabase, user } = useSupabase();
    const router = useRouter();

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      email: '',
    });

    useEffect(() => {
        if (user) {
            // Pre-fill email from auth user
            setShippingInfo(prev => ({ ...prev, email: user.email || '' }));

            // Fetch profile and address from database
            const fetchUserData = async () => {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                
                if (profileData) {
                    const [firstName, ...lastNameParts] = (profileData.full_name || '').split(' ');
                    setShippingInfo(prev => ({
                        ...prev,
                        firstName: firstName || '',
                        lastName: lastNameParts.join(' ') || '',
                    }));
                }

                const { data: addressData, error: addressError } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (addressData) {
                    setShippingInfo(prev => ({
                        ...prev,
                        address: addressData.street_address || '',
                        city: addressData.city || '',
                        state: addressData.state || '',
                        zip: addressData.zip || '',
                    }));
                }
            };
            fetchUserData();
        }
    }, [user, supabase]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [id]: value }));
    };
    
    const handleProceedToPayment = () => {
        // Save shipping info to localStorage to pass to next step
        localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
        router.push('/checkout/payment');
    };

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Checkout</h1>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" value={shippingInfo.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" value={shippingInfo.lastName} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Market St" value={shippingInfo.address} onChange={handleInputChange} />
                </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="San Francisco" value={shippingInfo.city} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="CA" value={shippingInfo.state} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input id="zip" placeholder="94103" value={shippingInfo.zip} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={shippingInfo.email} onChange={handleInputChange} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
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
                 <Button onClick={handleProceedToPayment} className="w-full mt-6 h-12">
                    Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

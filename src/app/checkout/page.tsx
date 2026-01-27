'use client';

import { useEffect, useState, useTransition } from 'react';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectSubtotal, selectCartItems } from '@/lib/redux/slices/cartSlice';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import { applyCoupon } from '@/app/actions/order';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/login-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

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

interface Address {
    id: number;
    title: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
}

export default function CheckoutPage() {
    const cartItems = useAppSelector(selectCartItems);
    const subtotal = useAppSelector(selectSubtotal);
    const { supabase, user, loading: authLoading } = useSupabase();
    const router = useRouter();

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      email: '',
      phone: '',
    });

    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
    const [isApplyingCoupon, startCouponTransition] = useTransition();
    const [isProceeding, startProceedingTransition] = useTransition();
    const [shippingCost, setShippingCost] = useState(5.00);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

    const discountAmount = appliedDiscount?.discount || 0;
    const total = subtotal + shippingCost - discountAmount;

    useEffect(() => {
        const fetchSettingsAndTitle = async () => {
            setLoadingSettings(true);
            const { data } = await supabase.rpc('get_all_settings');
            if (data && data[0]) {
                setShippingCost(Number(data[0].shipping_cost || 5.00));
                document.title = `Checkout | ${data[0].site_title || 'Karwanbazar'}`;
            } else {
                setShippingCost(5.00); // Fallback
                document.title = `Checkout | Karwanbazar`;
            }
            setLoadingSettings(false);
        };

        if (user) {
            const fetchUserData = async () => {
                const { data: profileData } = await supabase.from('profiles').select('full_name, contact_number').eq('id', user.id).single();
                if (profileData) {
                    const [firstName, ...lastNameParts] = (profileData.full_name || '').split(' ');
                    setShippingInfo(prev => ({ ...prev, firstName: firstName || '', lastName: lastNameParts.join(' ') || '', phone: profileData.contact_number || '' }));
                }
                const { data: addressesData } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

                if (addressesData && addressesData.length > 0) {
                    setSavedAddresses(addressesData as Address[]);
                    const firstAddress = addressesData[0];
                    setSelectedAddressId(String(firstAddress.id));
                    setShippingInfo(prev => ({
                        ...prev,
                        address: firstAddress.street_address || '',
                        city: firstAddress.city || '',
                        state: firstAddress.state || '',
                        zip: firstAddress.zip || '',
                    }));
                } else {
                    setSelectedAddressId('new');
                }
            };
            fetchUserData();
            setShippingInfo(prev => ({ ...prev, email: user.email || '' }));
        }
        
        fetchSettingsAndTitle();
    }, [user, supabase]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [id]: value }));
    };

    const handleAddressSelect = (addressId: string) => {
        setSelectedAddressId(addressId);
        if (addressId === 'new') {
            setShippingInfo(prev => ({
                ...prev,
                address: '',
                city: '',
                state: '',
                zip: '',
            }));
        } else {
            const selected = savedAddresses.find(addr => addr.id === parseInt(addressId));
            if (selected) {
                setShippingInfo(prev => ({
                    ...prev,
                    address: selected.street_address || '',
                    city: selected.city || '',
                    state: selected.state || '',
                    zip: selected.zip || '',
                }));
            }
        }
    };

    const handleApplyCoupon = () => {
        startCouponTransition(async () => {
            setCouponMessage(null);
            const simpleCartItems = cartItems.map(item => ({ id: item.id, price: item.price, quantity: item.quantity }));
            const result = await applyCoupon(couponCode, simpleCartItems);

            if (result.error) {
                setCouponMessage({ type: 'error', message: result.error });
                setAppliedDiscount(null);
            }
            if (result.success && result.discount) {
                setCouponMessage({ type: 'success', message: result.success });
                setAppliedDiscount({ code: result.code!, discount: result.discount });
            }
        });
    };
    
    const handleProceedToPayment = () => {
        startProceedingTransition(() => {
            localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
            localStorage.setItem('shippingCost', JSON.stringify(shippingCost));
            if (appliedDiscount) {
                localStorage.setItem('appliedDiscount', JSON.stringify(appliedDiscount));
            } else {
                localStorage.removeItem('appliedDiscount');
            }
            router.push('/checkout/payment');
        });
    };
    
    const renderOrderSummary = () => (
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
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-destructive">
                            <p>Discount ({appliedDiscount?.code})</p>
                            <p className="font-semibold">-${discountAmount.toFixed(2)}</p>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <p className="text-muted-foreground">Shipping</p>
                        {loadingSettings ? <Skeleton className="h-5 w-12" /> : <p className="font-semibold">${shippingCost.toFixed(2)}</p>}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total</p>
                        {loadingSettings ? <Skeleton className="h-6 w-20" /> : <p>${total.toFixed(2)}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const AddressFormFields = () => (
        <>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Market St" value={shippingInfo.address} onChange={handleInputChange} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="San Francisco" value={shippingInfo.city} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="CA" value={shippingInfo.state} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" placeholder="94103" value={shippingInfo.zip} onChange={handleInputChange} required />
            </div>
          </div>
        </>
    );

    if (authLoading) {
      return (
          <div className="bg-muted/20 min-h-screen">
            <Header />
            <main className="container mx-auto py-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Checkout</h1>
              </div>
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-8">
                      <Skeleton className="h-96 w-full" />
                  </div>
                  <Skeleton className="h-96 w-full" />
              </div>
            </main>
            <CartDrawer />
          </div>
      );
    }

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Checkout</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleProceedToPayment(); }}>
            <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
                {user ? (
                <>
                    <Card>
                    <CardHeader>
                        <CardTitle>Shipping Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="John" value={shippingInfo.firstName} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Doe" value={shippingInfo.lastName} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" value={shippingInfo.email} onChange={handleInputChange} required readOnly={!!user} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" placeholder="Your phone number" value={shippingInfo.phone} onChange={handleInputChange} required />
                        </div>
                        </div>
                        {savedAddresses.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                <Label>Shipping Address</Label>
                                <RadioGroup onValueChange={handleAddressSelect} value={selectedAddressId} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {savedAddresses.map((addr) => (
                                        <Label
                                            key={addr.id}
                                            htmlFor={`addr-${addr.id}`}
                                            className={cn(
                                                "flex flex-col justify-between p-4 border rounded-lg cursor-pointer transition-all",
                                                selectedAddressId === String(addr.id)
                                                    ? "border-primary ring-2 ring-primary"
                                                    : "border-border hover:border-gray-400"
                                            )}
                                        >
                                            <div className="flex justify-between items-start w-full">
                                                <div className="space-y-1">
                                                    <p className="font-semibold">{addr.title}</p>
                                                    <address className="not-italic text-muted-foreground text-sm">
                                                        {addr.street_address}, {addr.city}, {addr.state} {addr.zip}
                                                    </address>
                                                </div>
                                                <RadioGroupItem value={String(addr.id)} id={`addr-${addr.id}`} />
                                            </div>
                                        </Label>
                                    ))}
                                    <Label
                                        htmlFor="addr-new"
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all min-h-[110px]",
                                            selectedAddressId === 'new'
                                                ? "border-primary ring-2 ring-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <p className="font-semibold mt-2">+ Add New Address</p>
                                        <RadioGroupItem value="new" id="addr-new" className="hidden" />
                                    </Label>
                                </RadioGroup>
                                {selectedAddressId === 'new' && (
                                    <div className="pt-4 space-y-4">
                                        <AddressFormFields />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AddressFormFields />
                            </div>
                        )}
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader>
                        <CardTitle>Coupon Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" />
                            <Button type="button" onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
                                {isApplyingCoupon ? 'Applying...' : 'Apply'}
                            </Button>
                        </div>
                        {couponMessage && (
                            <p className={`text-sm mt-2 ${couponMessage.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                                {couponMessage.message}
                            </p>
                        )}
                    </CardContent>
                    </Card>
                </>
                ) : (
                <Card>
                    <CardHeader>
                    <CardTitle>Please Login to Continue</CardTitle>
                    <CardDescription>You need to be logged in to proceed with checkout.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                        <Button className="w-full h-12">Login or Register</Button>
                        </DialogTrigger>
                        <LoginDialog />
                    </Dialog>
                    </CardContent>
                </Card>
                )}
            </div>
            <div>
                {renderOrderSummary()}
                {user && (
                <Button type="submit" className="w-full mt-6 h-12" disabled={isProceeding || loadingSettings}>
                    {isProceeding ? 'Processing...' : 'Proceed to Payment'}
                </Button>
                )}
            </div>
            </div>
        </form>
      </main>
      <CartDrawer />
    </div>
  );
}

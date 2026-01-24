'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, CreditCard } from 'lucide-react';

// Basic validation, not for production use without a real payment processor
const cardFormSchema = z.object({
  cardNumber: z.string().min(13, 'Invalid card number').max(19, 'Invalid card number').regex(/^\d+$/, "Card number must be numeric"),
  cardHolder: z.string().min(2, 'Card holder name is required'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date format (MM/YY)'),
  cvc: z.string().min(3, 'Invalid CVC').max(4, 'Invalid CVC').regex(/^\d+$/, "CVC must be numeric"),
});

export default function AddCardPage() {
    const { supabase, user } = useSupabase();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof cardFormSchema>>({
        resolver: zodResolver(cardFormSchema),
        defaultValues: {
            cardNumber: '',
            cardHolder: '',
            expiryDate: '',
            cvc: '',
        },
    });

    const getCardType = (cardNumber: string) => {
        if (cardNumber.startsWith('4')) return 'Visa';
        if (cardNumber.startsWith('5')) return 'Mastercard';
        if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) return 'American Express';
        return 'Card';
    }

    async function onSubmit(values: z.infer<typeof cardFormSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not authenticated' });
            return;
        }

        setIsSubmitting(true);

        const [expiryMonth, expiryYear] = values.expiryDate.split('/');
        const cardData = {
            user_id: user.id,
            card_type: getCardType(values.cardNumber),
            last4: values.cardNumber.slice(-4),
            expiry_month: parseInt(expiryMonth),
            expiry_year: 2000 + parseInt(expiryYear),
        };

        const { error } = await supabase.from('cards').insert(cardData);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error saving card',
                description: error.message,
            });
        } else {
            toast({
                title: 'Card Added',
                description: 'Your new card has been saved successfully.',
            });
            router.push('/profile/my-cards');
        }

        setIsSubmitting(false);
    }

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                                        <Link href="/profile/my-cards">
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="sr-only">Back</span>
                                        </Link>
                                    </Button>
                                    <CardTitle>Add New Card</CardTitle>
                                </div>
                                <CardDescription>Enter your card details. We do not store your full card number.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="cardNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Card Number</FormLabel>
                                            <FormControl>
                                                 <div className="relative">
                                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    <Input {...field} placeholder="0000 0000 0000 0000" className="pl-10"/>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="cardHolder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Card Holder Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="John Doe" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="expiryDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expiry Date</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="MM/YY" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="cvc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CVC</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="123" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Card'}
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </div>
          </main>
          <CartDrawer />
        </div>
    );
}

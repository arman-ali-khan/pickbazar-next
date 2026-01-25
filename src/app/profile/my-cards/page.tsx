'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedCard {
  id: number;
  card_type: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
}

const getCardIcon = (type: string) => {
    // In a real app, you'd have icons for Visa, Mastercard, etc.
    return <CreditCard className="h-8 w-8 text-muted-foreground" />;
}

export default function MyCardsPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [cards, setCards] = useState<SavedCard[]>([]);
    const [loading, setLoading] = useState(true);

    const getCards = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching cards', description: error.message });
        } else {
            setCards(data);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getCards();
    }, [getCards]);

    const handleDelete = async (cardId: number) => {
        const { error } = await supabase.from('cards').delete().eq('id', cardId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting card', description: error.message });
        } else {
            toast({ title: 'Card Deleted', description: 'Your card has been removed.' });
            setCards(prev => prev.filter(c => c.id !== cardId));
        }
    };

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>My Cards</CardTitle>
                        <Button asChild>
                            <Link href="/profile/my-cards/add">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Card
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <Card key={i} className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-8 w-8" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-9 w-24" />
                                    </Card>
                                ))}
                            </div>
                        ) : cards.length > 0 ? (
                            cards.map(card => (
                                <Card key={card.id} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {getCardIcon(card.card_type)}
                                        <div>
                                            <p className="font-semibold">{card.card_type}</p>
                                            <p className="text-muted-foreground">**** **** **** {card.last4}</p>
                                            <p className="text-sm text-muted-foreground">Expires {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}</p>
                                        </div>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4 mr-2"/> Remove
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your saved card.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(card.id)}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </Card>
                            ))
                        ) : (
                             <div className="text-center py-12">
                                <p className="text-muted-foreground">You have no saved cards.</p>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </div>
          </main>
          <CartDrawer />
        </div>
    );
}

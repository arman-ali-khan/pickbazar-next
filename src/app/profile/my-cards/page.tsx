'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const savedCards = [
    { id: 1, type: 'Mastercard', last4: '4321', expiry: '12/25' },
    { id: 2, type: 'Visa', last4: '1234', expiry: '08/24' },
];

export default function MyCardsPage() {
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
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Card
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {savedCards.map(card => (
                            <Card key={card.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{card.type}</p>
                                    <p className="text-muted-foreground">**** **** **** {card.last4}</p>
                                    <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                                </div>
                                <Button variant="ghost" size="sm">Remove</Button>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

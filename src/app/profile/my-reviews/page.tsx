'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { UserReview } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved':
            return 'secondary';
        case 'Hidden':
            return 'destructive';
        case 'Pending':
            return 'default';
        default:
            return 'default';
    }
};

export default function MyReviewsPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(true);

    const getReviews = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_reviews', { p_user_id: user.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching your reviews.', description: error.message });
        } else {
            setReviews(data || []);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getReviews();
    }, [getReviews]);

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>My Reviews</CardTitle>
                        <CardDescription>A history of all the reviews you have submitted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-6">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i} className="p-4">
                                        <div className="flex items-start gap-4">
                                            <Skeleton className="h-16 w-16 rounded-md" />
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-5 w-40" />
                                                        <Skeleton className="h-4 w-24" />
                                                    </div>
                                                    <Skeleton className="h-6 w-20 rounded-full" />
                                                </div>
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-4/5" />
                                                <Skeleton className="h-3 w-28" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : 
                         reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map(review => (
                                    <Card key={review.id} className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="relative h-16 w-16 rounded-md border flex-shrink-0">
                                                <Image src={review.product_image} alt={review.product_name} fill className="object-contain p-1" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Link href={`/products/${review.product_id}`} className="font-semibold hover:underline">{review.product_name}</Link>
                                                        <div className="flex items-center mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Badge variant={getStatusVariant(review.status)}>{review.status}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                                                <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>{format(new Date(review.created_at), 'PP')}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">You haven't submitted any reviews yet.</p>
                                <Button asChild variant="link" className="mt-2">
                                    <Link href="/shop">Start shopping</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

'use client';

import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import type { UserQuestion } from '@/lib/data';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyQuestionsPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [questions, setQuestions] = useState<UserQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    const getQuestions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_questions', { p_user_id: user.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching your questions.', description: error.message });
        } else {
            setQuestions(data || []);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getQuestions();
    }, [getQuestions]);

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
                        <CardTitle>My Questions</CardTitle>
                        <CardDescription>A history of all the questions you have submitted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i} className="p-4">
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) :
                         questions.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {questions.map((q) => (
                                <AccordionItem value={`item-${q.id}`} key={q.id} className="bg-background p-2 rounded-lg shadow-sm border-b-0">
                                    <AccordionTrigger className="text-left px-4 font-semibold hover:no-underline text-base w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <p className="flex-1 text-left mr-4">Q: {q.question_text}</p>
                                            <Badge variant={q.status === 'Answered' ? 'secondary' : 'default'}>{q.status}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pt-2 text-muted-foreground text-sm space-y-4">
                                        {q.answer_text ? (
                                            <p><span className="font-semibold text-foreground">A:</span> {q.answer_text}</p>
                                        ) : (
                                            <p>This question has not been answered yet.</p>
                                        )}
                                        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md border">
                                            <div className="relative h-12 w-12 rounded-md border flex-shrink-0">
                                                <Image src={q.product_image} alt={q.product_name} fill className="object-contain p-1" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{q.product_name}</p>
                                                <Button variant="link" asChild className="p-0 h-auto text-xs">
                                                    <Link href={`/products/${q.product_id}`}>View Product</Link>
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground ml-auto self-start" suppressHydrationWarning>
                                                Asked on {format(new Date(q.created_at), 'PP')}
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                         ) : (
                             <div className="text-center py-10">
                                <p className="text-muted-foreground">You haven't asked any questions yet.</p>
                                <Button asChild variant="link" className="mt-2">
                                    <Link href="/shop">Start shopping</Link>
                                </Button>
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

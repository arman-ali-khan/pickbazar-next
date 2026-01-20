'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { product as detailedProduct } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const questions = detailedProduct.questions;

export default function MyQuestionsPage() {
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
                    </CardHeader>
                    <CardContent>
                         <Accordion type="single" collapsible className="w-full space-y-4">
                            {questions.map((q, index) => (
                              <AccordionItem value={`item-${index}`} key={q.id} className="bg-white p-2 rounded-lg shadow-sm border-b-0">
                                <AccordionTrigger className="text-left px-4 font-semibold hover:no-underline text-lg">
                                  Q: {q.question}
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pt-2 text-muted-foreground text-base">
                                  <p>A: {q.answer}</p>
                                  <p className="text-xs text-muted-foreground mt-2">on {q.date}</p>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

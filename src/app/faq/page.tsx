
import type { Metadata } from 'next';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
};

interface FaqItem {
  question: string;
  answer: string;
}

export default async function FaqPage() {
  const supabase = createClient();
  const { data } = await supabase.from('pages').select('content').eq('slug', 'faq').single();
  
  if (!data) {
    notFound();
  }

  const { faqs } = data.content as { faqs: FaqItem[] };

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container mx-auto py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mt-4 text-lg">Find answers to common questions about our products and services.</p>
          </div>
          {faqs && faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="bg-white p-2 rounded-lg shadow-sm border-b-0">
                  <AccordionTrigger className="text-left px-4 font-semibold hover:no-underline text-lg">{faq.question}</AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 text-muted-foreground text-base">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground">No FAQs found.</p>
          )}
        </div>
      </main>
      <CartDrawer />
    </div>
  );
}

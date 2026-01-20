'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from './ui/button';
import Link from 'next/link';

const faqs = [
  {
    question: 'How does the delivery process work?',
    answer:
      'We offer delivery within 90 minutes for most locations. Once you place an order, our system assigns it to the nearest delivery partner. You will receive a notification once your order is out for delivery.',
  },
  {
    question: 'What are the payment methods available?',
    answer:
      'We accept all major credit and debit cards, as well as digital wallets like Apple Pay and Google Pay. Cash on Delivery (COD) is also available for select orders.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We have a no-questions-asked return policy for most items within 24 hours of delivery, provided the items are in their original packaging and condition. Please check the item description for specific return information.',
  },
  {
    question: 'How do I track my order?',
    answer:
      "You can track your order in real-time from the 'My Orders' section of your account. You will also receive SMS and email updates at every stage of your order.",
  },
];

export default function FaqSection() {
  return (
    <section className="py-12 px-4 md:px-8 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="bg-white p-2 rounded-lg shadow-sm border-b-0">
              <AccordionTrigger className="text-left px-4 font-semibold hover:no-underline text-lg">{faq.question}</AccordionTrigger>
              <AccordionContent className="px-4 pt-2 text-muted-foreground text-base">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="text-center mt-12">
            <Button asChild variant="outline">
                <Link href="/faq">View All FAQs</Link>
            </Button>
        </div>
      </div>
    </section>
  );
}

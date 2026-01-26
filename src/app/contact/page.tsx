'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { submitContactMessage } from '@/app/actions/contact';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

type ContactInfo = {
  address: string;
  email: string;
  phone: string;
};

export default function ContactPage() {
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.title = 'Contact Us | Pickbazar';
  }, []);

  useEffect(() => {
    const fetchContactInfo = async () => {
      const { data } = await supabase.from('pages').select('content').eq('slug', 'contact').single();
      if (data) {
        setContactInfo(data.content as ContactInfo);
      }
    };
    fetchContactInfo();
  }, [supabase]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('subject', values.subject);
        formData.append('message', values.message);

        const result = await submitContactMessage(formData);
        
        if (result?.error) {
            toast({
                variant: 'destructive',
                title: "Submission Failed",
                description: result.error,
            });
        } else {
            toast({
                title: "Message Sent!",
                description: "Thank you for contacting us. We'll get back to you shortly.",
            });
            form.reset();
        }
    });
  }

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Get In Touch</h1>
          <p className="text-muted-foreground mt-4 text-lg">We'd love to hear from you. Here's how you can reach us.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {contactInfo ? (
                  <>
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold">Our Address</h4>
                        <p className="text-muted-foreground">{contactInfo.address}</p>
                      </div>
                    </div>
                     <div className="flex items-start gap-4">
                      <Mail className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold">Email Us</h4>
                        <p className="text-muted-foreground">{contactInfo.email}</p>
                      </div>
                    </div>
                     <div className="flex items-start gap-4">
                      <Phone className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold">Call Us</h4>
                        <p className="text-muted-foreground">{contactInfo.phone}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Loading contact information...</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Question about a product" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Type your message here..." {...field} className="min-h-[120px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isPending}>
                      {isPending ? "Sending..." : <><Send className="mr-2 h-5 w-5" />Send Message</>}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <CartDrawer />
    </div>
  );
}

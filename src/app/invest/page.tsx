'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/components/header';
import Footer from '@/components/footer';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Landmark, User, MapPin, Phone, CircleDollarSign, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  address: z.string().min(10, 'Please enter a valid address.'),
  mobileNumber: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Please enter a valid mobile number.'),
  investmentAmount: z.preprocess(
    (a) => parseFloat(String(a).replace(/[^0-9.-]+/g, "")),
    z.number().min(1000, 'Minimum investment is $1,000.')
  ),
});

export default function InvestPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      address: '',
      mobileNumber: '',
      investmentAmount: 1000,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Application Submitted!",
      description: "Thank you for your interest. We will review your application and get back to you soon.",
    });
    form.reset();
  }

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Landmark className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Become an Investor</h1>
            <p className="text-muted-foreground mt-4 text-lg">Join us in our mission to revolutionize the fresh food market.</p>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Info className="h-4 w-4 !text-primary" />
            <AlertTitle className="text-primary font-semibold">Our Investment Policy</AlertTitle>
            <AlertDescription className="text-primary/80">
              We are seeking partners who share our passion for quality and innovation. Investments are subject to due diligence and are governed by the terms outlined in our private placement memorandum. Minimum investment thresholds apply. By submitting this form, you acknowledge that you are an accredited investor.
            </AlertDescription>
          </Alert>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-2xl">Investor Application</CardTitle>
              <CardDescription>Please provide your details below. All information is kept confidential.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <div className="relative">
                           <MapPin className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
                           <FormControl>
                            <Textarea placeholder="123 Market St, San Francisco, CA 94103" {...field} className="pl-10 min-h-[100px]" />
                           </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="+1 (123) 456-7890" {...field} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="investmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How much would you like to invest?</FormLabel>
                        <div className="relative">
                          <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input type="number" step="1000" min="1000" {...field} 
                              onChange={event => field.onChange(event.target.valueAsNumber)}
                              className="pl-10 font-semibold" 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg font-semibold">Submit Application</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

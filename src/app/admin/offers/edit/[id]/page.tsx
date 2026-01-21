'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { offers as initialOffers } from '@/lib/data';
import type { Offer } from '@/lib/data';

export default function EditOfferPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const offerId = parseInt(params.id, 10);
    
    const [offer, setOffer] = useState<Offer | undefined>(() => initialOffers.find(o => o.id === offerId));
    
    const [title, setTitle] = useState(offer?.title || '');
    const [subtitle, setSubtitle] = useState(offer?.subtitle || '');
    const [code, setCode] = useState(offer?.code || '');
    const [discount, setDiscount] = useState(offer?.discount || 0);
    const [status, setStatus] = useState(offer?.status || '');
    const [startDate, setStartDate] = useState<Date | undefined>(offer ? new Date(offer.startDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(offer ? new Date(offer.endDate) : undefined);


    useEffect(() => {
        const foundOffer = initialOffers.find(a => a.id === offerId);
        if (foundOffer) {
            setOffer(foundOffer);
            setTitle(foundOffer.title);
            setSubtitle(foundOffer.subtitle);
            setCode(foundOffer.code);
            setDiscount(foundOffer.discount);
            setStatus(foundOffer.status);
            setStartDate(new Date(foundOffer.startDate));
            setEndDate(new Date(foundOffer.endDate));
        } else {
            notFound();
        }
    }, [offerId]);


    if (!offer) {
        return null; 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ id: offer.id, title, subtitle, code, discount, status, startDate, endDate });
        toast({
            title: "Offer Updated",
            description: `The offer "${title}" has been successfully updated.`,
        });
        router.push('/admin/offers');
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/offers">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Offer
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Offer Details</CardTitle>
                        <CardDescription>Update the details for the offer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="subtitle">Subtitle</Label>
                                <Input id="subtitle" type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="grid gap-3">
                                  <Label htmlFor="code">Code</Label>
                                  <Input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} required />
                              </div>
                               <div className="grid gap-3">
                                  <Label htmlFor="discount">Discount (%)</Label>
                                  <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} required />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-3">
                                    <Label>Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-3">
                                    <Label>End Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                 <Select value={status} onValueChange={(value) => setStatus(value as Offer['status'])}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit">Update Offer</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

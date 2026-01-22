
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft, CalendarIcon, UploadCloud, X } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuGroup, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { useSupabase } from '@/lib/supabase/provider';
import React from 'react';

type OfferStatus = 'active' | 'inactive' | 'expired';

interface SelectableProduct {
  id: number;
  name: string;
  categories: { id: number; name: string }[];
}

interface Category {
  id: number;
  name: string;
}

export default function EditOfferPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { supabase } = useSupabase();
    const offerId = parseInt(params.id, 10);
    
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [code, setCode] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
    const [status, setStatus] = useState<OfferStatus>('active');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [allProducts, setAllProducts] = useState<SelectableProduct[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isNaN(offerId)) {
            notFound();
            return;
        }

        const fetchOfferAndProducts = async () => {
            const { data: offerData, error: offerError } = await supabase.from('offers').select('*').eq('id', offerId).single();
            
            if (offerError || !offerData) {
                toast({ variant: 'destructive', title: 'Error', description: 'Offer not found.' });
                notFound();
                return;
            }

            const [productsRes, categoriesRes] = await Promise.all([
                supabase.from('products').select('id, name, product_categories(categories(id, name))'),
                supabase.from('categories').select('id, name').order('name')
            ]);
            
            setTitle(offerData.title);
            setSubtitle(offerData.subtitle || '');
            setCode(offerData.code);
            setDiscountPercentage(offerData.discount_percentage);
            setStatus(offerData.status as OfferStatus);
            setStartDate(new Date(offerData.start_date));
            setEndDate(new Date(offerData.end_date));
            setImagePreview(offerData.image_url);
            setSelectedProductIds(offerData.product_ids || []);
            
            if (productsRes.data) {
                const productsWithCategories = productsRes.data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    categories: p.product_categories.map((pc: any) => pc.categories).filter(Boolean)
                }));
                setAllProducts(productsWithCategories);
            }
            if (categoriesRes.data) {
                setAllCategories(categoriesRes.data);
            }

            setLoading(false);
        };
        fetchOfferAndProducts();
    }, [offerId, supabase, toast]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aistudio');

        const response = await fetch('https://api.cloudinary.com/v1_1/dcckbmhft/image/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to upload image to Cloudinary: ${errorData.error.message}`);
        }
        const data = await response.json();
        return data.secure_url;
    };

    const handleProductSelection = (productId: number) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
            ? prev.filter(id => id !== productId)
            : [...prev, productId]
        );
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let imageUrl = imagePreview;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const offerData = {
                title,
                subtitle: subtitle || null,
                code,
                discount_percentage: discountPercentage,
                status,
                start_date: startDate?.toISOString(),
                end_date: endDate?.toISOString(),
                image_url: imageUrl,
                product_ids: selectedProductIds,
            };

            const { error } = await supabase.from('offers').update(offerData).eq('id', offerId);
            if (error) throw error;

            toast({ title: "Offer Updated", description: `The offer "${title}" has been successfully updated.` });
            router.push('/admin/offers');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating offer', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <p>Loading offer details...</p>
    }

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
                     <CardContent className="grid gap-6">
                        <div className="space-y-2">
                            <Label>Offer Image</Label>
                            {imagePreview ? (
                                <div className="relative w-full h-48 border rounded-lg">
                                    <Image src={imagePreview} alt="Offer preview" fill className="object-contain rounded-md p-2" />
                                    <Button variant="destructive" size="icon" type="button" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                    </div>
                                    <Input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                                </label> 
                            )}
                        </div>
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
                                <Input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="discount">Discount (%)</Label>
                                <Input id="discount" type="number" value={discountPercentage ?? ''} onChange={(e) => setDiscountPercentage(e.target.value === '' ? null : parseInt(e.target.value, 10))} required />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
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
                                        <Button variant={"outline"} className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
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
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={(value) => setStatus(value as OfferStatus)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label>Link Products (Optional)</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start font-normal h-auto text-left">
                                            {selectedProductIds.length > 0 ? `${selectedProductIds.length} products selected` : "Select products"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 p-0 max-h-72 overflow-y-auto" align="start">
                                        {allCategories.map(category => {
                                            const productsInCategory = allProducts.filter(p => 
                                                p.categories.some(cat => cat.id === category.id)
                                            );

                                            if (productsInCategory.length === 0) return null;

                                            return (
                                                <DropdownMenuGroup key={category.id}>
                                                    <DropdownMenuLabel className="px-2 py-1.5">{category.name}</DropdownMenuLabel>
                                                    {productsInCategory.map(product => (
                                                        <DropdownMenuCheckboxItem
                                                            key={product.id}
                                                            checked={selectedProductIds.includes(product.id)}
                                                            onCheckedChange={() => handleProductSelection(product.id)}
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="pl-4"
                                                        >
                                                            {product.name}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuGroup>
                                            )
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Update Offer'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

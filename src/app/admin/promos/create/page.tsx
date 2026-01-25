
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { useSupabase } from '@/lib/supabase/provider';

export default function CreatePromoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { supabase } = useSupabase();

    // Form state
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [buttonLink, setButtonLink] = useState('');
    const [status, setStatus] = useState('active');
    
    // Image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out the title field.' });
            return;
        }
        setIsSubmitting(true);

        try {
            let imageUrl: string | null = null;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const promoData = {
                title,
                subtitle: subtitle || null,
                button_text: buttonText || null,
                button_link: buttonLink || null,
                status,
                image_url: imageUrl,
            };

            const { error } = await supabase.from('promos').insert(promoData);

            if (error) throw error;

            toast({
                title: "Promo Created",
                description: `The promo "${title}" has been successfully created.`,
            });
            router.push('/admin/promos');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error creating promo', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/promos">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Add New Promo
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Promo Details</CardTitle>
                        <CardDescription>Enter the details for the new promotional popup.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="space-y-2">
                            <Label>Promo Image</Label>
                            {imagePreview ? (
                                <div className="relative w-full h-48 border rounded-lg">
                                    <Image src={imagePreview} alt="Promo preview" fill className="object-contain rounded-md p-2" />
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setImageFile(null); setImagePreview(null); }}>
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
                            <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Summer Sale" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="subtitle">Subtitle</Label>
                            <Input id="subtitle" type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g., Up to 50% off!" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="buttonText">Button Text</Label>
                                <Input id="buttonText" type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g., Shop Now" />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="buttonLink">Button Link</Label>
                                <Input id="buttonLink" type="text" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="e.g., /shop?category=sale" />
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Promo'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

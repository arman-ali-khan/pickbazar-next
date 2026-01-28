
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { UploadCloud, Image as ImageIcon, X, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TiptapEditor from '@/components/tiptap-editor';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Category { id: number; name: string; parent_id: number | null; }
interface CategoryWithSubcategories extends Category { subcategories: Category[]; }
interface Tag { id: number; name: string; }

export default function EditProductPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const productId = parseInt(params.id);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState('');
    const [price, setPrice] = useState<number | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);
    const [stock, setStock] = useState<number | null>(null);
    const [status, setStatus] = useState('draft');
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Data State
    const [allCategories, setAllCategories] = useState<CategoryWithSubcategories[]>([]);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    
    // Image State
    const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
    const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
    const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
    const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);

    const slug = useMemo(() => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }, [name]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*, product_tags(tags(*)), product_categories(category_id)')
            .eq('id', productId)
            .single();

        if (productError || !productData) {
            toast({ variant: 'destructive', title: 'Error fetching product' });
            router.push('/admin/products');
            return;
        }

        const [categoriesRes, tagsRes] = await Promise.all([
            supabase.from('categories').select('id, name, parent_id'),
            supabase.from('tags').select('id, name'),
        ]);

        // Set Form State
        setName(productData.name);
        setDescription(productData.description || '');
        setUnit(productData.unit || '');
        setPrice(productData.price);
        setOriginalPrice(productData.original_price);
        setStock(productData.stock);
        setStatus(productData.status);
        
        const fetchedTags = productData.product_tags ? (productData.product_tags as any[]).map((pt: any) => pt.tags).filter(Boolean) : [];
        setSelectedTags(fetchedTags);

        setFeaturedImagePreview(productData.featured_image_url);
        setGalleryImagePreviews(productData.gallery_urls || []);
        if (productData.product_categories) {
            setSelectedCategories((productData.product_categories as any).map((pc: any) => pc.category_id));
        }

        if (categoriesRes.data) {
             const fetchedCategories: Category[] = categoriesRes.data;
            const topLevel = fetchedCategories.filter(c => !c.parent_id);
            const children = fetchedCategories.filter(c => c.parent_id);

            const hierarchical = topLevel.map(parent => ({
                ...parent,
                subcategories: children.filter(child => child.parent_id === parent.id)
            }));
            setAllCategories(hierarchical);
        }
        if (tagsRes.data) setAllTags(tagsRes.data);
        
        setLoading(false);
    }, [supabase, toast, productId, router]);

    useEffect(() => {
        if(productId) {
            fetchData();
        }
    }, [fetchData, productId]);
    
    const handleCategorySelection = (categoryId: number) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
            ? prev.filter(id => id !== categoryId)
            : [...prev, categoryId]
        );
    };

    const handleTagSelection = (tag: Tag) => {
        setSelectedTags(prev => 
            prev.find(t => t.id === tag.id) 
            ? prev.filter(t => t.id !== tag.id) 
            : [...prev, tag]
        );
    };

    const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFeaturedImageFile(file);
            setFeaturedImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setGalleryImageFiles(prev => [...prev, ...filesArray]);
            const previews = filesArray.map(file => URL.createObjectURL(file));
            setGalleryImagePreviews(prev => [...prev, ...previews]);
        }
    };
    
    const handleRemoveGalleryImage = (indexToRemove: number) => {
        const urlToRemove = galleryImagePreviews[indexToRemove];
        setGalleryImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));

        if(urlToRemove.startsWith('blob:')) {
            // This was a new file, find and remove it from galleryImageFiles
            // This assumes order is maintained, which it should be in this logic
            let blobCount = -1;
            for(let i=0; i<indexToRemove+1; i++) {
                if(galleryImagePreviews[i].startsWith('blob:')) {
                    blobCount++;
                }
            }
            setGalleryImageFiles(prev => prev.filter((_, i) => i !== blobCount));
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
        setIsSubmitting(true);

        try {
            let final_featured_image_url = featuredImagePreview;
            if (featuredImageFile) {
                final_featured_image_url = await uploadImage(featuredImageFile);
            }

            const newGalleryUrls = await Promise.all(
                galleryImageFiles.map(file => uploadImage(file))
            );

            const existingUrls = galleryImagePreviews.filter(url => !url.startsWith('blob:'));
            const final_gallery_urls = [...existingUrls, ...newGalleryUrls];

            const { error: productError } = await supabase
                .from('products')
                .update({
                    name, slug, description, unit, 
                    price: price || 0,
                    original_price: originalPrice, 
                    stock: stock || 0,
                    status, 
                    featured_image_url: final_featured_image_url, 
                    gallery_urls: final_gallery_urls
                })
                .eq('id', productId);
            
            if (productError) throw productError;
            
            // Update categories
            await supabase.from('product_categories').delete().eq('product_id', productId);
            if (selectedCategories.length > 0) {
                const productCategories = selectedCategories.map(catId => ({ product_id: productId, category_id: catId }));
                const { error: categoriesError } = await supabase.from('product_categories').insert(productCategories);
                if (categoriesError) throw categoriesError;
            }

            // Update tags
            await supabase.from('product_tags').delete().eq('product_id', productId);
            if (selectedTags.length > 0) {
                const productTags = selectedTags.map(tag => ({ product_id: productId, tag_id: tag.id }));
                const { error: tagsError } = await supabase.from('product_tags').insert(productTags);
                if (tagsError) throw tagsError;
            }

            toast({ title: 'Product updated successfully' });
            router.push('/admin/products');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating product', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-6 w-40" />
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
                            <CardContent className="space-y-6">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-28" /></CardHeader>
                            <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    return (
         <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <form onSubmit={handleSubmit}>
                <div className="mx-auto grid flex-1 auto-rows-max gap-4 w-full">
                    <div className="flex items-center gap-4">
                         <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                            <Link href="/admin/products">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Back</span>
                            </Link>
                        </Button>
                        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                            Edit Product
                        </h1>
                        <div className="hidden items-center gap-2 md:ml-auto md:flex">
                             <Button variant="outline" size="sm" type="button" onClick={() => router.push('/admin/products')}>Discard</Button>
                             <Button size="sm" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Product'}</Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                            <Card>
                                <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                                    <div><Label>Slug</Label><Input value={slug} readOnly /></div>
                                    <div><Label>Unit (e.g., 1kg, 1pc)</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
                                    <div><Label>Description</Label><TiptapEditor content={description} onChange={setDescription} /></div>
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader><CardTitle>Media</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Featured Image</Label>
                                        <div className="relative w-40 h-40">
                                            <Image src={featuredImagePreview || 'https://picsum.photos/seed/placeholder/200'} alt="Featured" fill className="object-cover rounded-md" />
                                        </div>
                                         <label htmlFor="featured-image-upload" className="cursor-pointer text-sm text-primary hover:underline">
                                            Change image
                                            <Input id="featured-image-upload" type="file" className="hidden" onChange={handleFeaturedImageChange} />
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gallery</Label>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                            {galleryImagePreviews.map((preview, i) => (
                                                <div key={i} className="relative w-full aspect-square">
                                                    <Image src={preview} alt={`Gallery ${i}`} fill className="object-cover rounded-md" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveGalleryImage(i)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                             <label htmlFor="gallery-images-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                                                <div className="flex flex-col items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <Input id="gallery-images-upload" type="file" multiple className="hidden" onChange={handleGalleryImageChange} />
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div><Label>Price</Label><Input type="number" value={price ?? ''} onChange={(e) => setPrice(e.target.value === '' ? null : parseFloat(e.target.value))} required /></div>
                                    <div><Label>Original Price (Optional)</Label><Input type="number" value={originalPrice ?? ''} onChange={(e) => setOriginalPrice(e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                    <div><Label>Stock</Label><Input type="number" value={stock ?? ''} onChange={(e) => setStock(e.target.value === '' ? null : parseInt(e.target.value, 10))} /></div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                            <Card>
                                <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
                                <CardContent>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                           <Card>
                                <CardHeader><CardTitle>Categorization</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Categories</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start font-normal h-auto text-left">
                                                    {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : "Select categories"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64 p-2 max-h-60 overflow-y-auto" align="start">
                                                {allCategories.map(cat => (
                                                <React.Fragment key={cat.id}>
                                                    <DropdownMenuCheckboxItem
                                                    checked={selectedCategories.includes(cat.id)}
                                                    onCheckedChange={() => handleCategorySelection(cat.id)}
                                                    onSelect={(e) => e.preventDefault()}
                                                    >
                                                    {cat.name}
                                                    </DropdownMenuCheckboxItem>
                                                    {cat.subcategories.length > 0 && (
                                                    <div className="pl-6">
                                                        {cat.subcategories.map(sub => (
                                                        <DropdownMenuCheckboxItem
                                                            key={sub.id}
                                                            checked={selectedCategories.includes(sub.id)}
                                                            onCheckedChange={() => handleCategorySelection(sub.id)}
                                                            onSelect={(e) => e.preventDefault()}
                                                        >
                                                            {sub.name}
                                                        </DropdownMenuCheckboxItem>
                                                        ))}
                                                    </div>
                                                    )}
                                                </React.Fragment>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div>
                                        <Label>Tags</Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start font-normal">Select tags</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64 p-2">
                                                {allTags.map(tag => (
                                                    <DropdownMenuCheckboxItem key={tag.id} checked={selectedTags.some(t => t.id === tag.id)} onCheckedChange={() => handleTagSelection(tag)}>
                                                        {tag.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedTags.map(tag => (
                                                <Badge key={tag.id} variant="secondary">
                                                    {tag.name}
                                                    <button type="button" onClick={() => handleTagSelection(tag)} className="ml-2"><X className="h-3 w-3"/></button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                     <div className="flex items-center justify-center gap-2 md:hidden">
                        <Button variant="outline" size="sm" type="button" onClick={() => router.push('/admin/products')}>Discard</Button>
                        <Button size="sm" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Product'}</Button>
                    </div>
                </div>
            </form>
        </main>
    );
}

    
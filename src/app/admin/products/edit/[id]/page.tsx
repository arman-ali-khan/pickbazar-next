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

interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }
interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    unit: string;
    price: number;
    original_price: number | null;
    stock: number;
    status: string;
    category_id: number;
    featured_image_url: string;
    gallery_urls: string[];
    tags: Tag[];
}

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
    const [price, setPrice] = useState(0);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);
    const [stock, setStock] = useState(0);
    const [status, setStatus] = useState('draft');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Data State
    const [allCategories, setAllCategories] = useState<Category[]>([]);
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
            .select('*, tags(*)')
            .eq('id', productId)
            .single();

        if (productError || !productData) {
            toast({ variant: 'destructive', title: 'Error fetching product' });
            router.push('/admin/products');
            return;
        }

        const [categoriesRes, tagsRes] = await Promise.all([
            supabase.from('categories').select('id, name'),
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
        setCategoryId(String(productData.category_id));
        setSelectedTags(productData.tags || []);
        setFeaturedImagePreview(productData.featured_image_url);
        setGalleryImagePreviews(productData.gallery_urls || []);

        if (categoriesRes.data) setAllCategories(categoriesRes.data);
        if (tagsRes.data) setAllTags(tagsRes.data);
        
        setLoading(false);
    }, [supabase, toast, productId, router]);

    useEffect(() => {
        if(productId) {
            fetchData();
        }
    }, [fetchData, productId]);
    
    // Most handlers are identical to create page...
    const handleTagSelection = (tag: Tag) => {
        setSelectedTags(prev => 
            prev.find(t => t.id === tag.id) 
            ? prev.filter(t => t.id !== tag.id) 
            : [...prev, tag]
        );
    };

    const uploadImage = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('product_images').upload(fileName, file);
        if (error) throw new Error(`Failed to upload image: ${error.message}`);
        const { data } = supabase.storage.from('product_images').getPublicUrl(fileName);
        return data.publicUrl;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let featured_image_url = featuredImagePreview;
            if (featuredImageFile) {
                featured_image_url = await uploadImage(featuredImageFile);
            }

            // For simplicity, we just add new gallery images. A full implementation might handle deletions.
            const newGalleryUrls = await Promise.all(galleryImageFiles.map(file => uploadImage(file)));
            const gallery_urls = [...(galleryImagePreviews || []), ...newGalleryUrls];

            const { error: productError } = await supabase
                .from('products')
                .update({
                    name, slug, description, unit, price, original_price: originalPrice, stock, status, category_id: Number(categoryId), featured_image_url, gallery_urls
                })
                .eq('id', productId);
            
            if (productError) throw productError;

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


    if (loading) return <p>Loading product details...</p>;

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
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gallery</Label>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                            {galleryImagePreviews.map((preview, i) => (
                                                <div key={i} className="relative w-full aspect-square"><Image src={preview} alt={`Gallery ${i}`} fill className="object-cover rounded-md" /></div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div><Label>Price</Label><Input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} required /></div>
                                    <div><Label>Original Price (Optional)</Label><Input type="number" value={originalPrice ?? ''} onChange={(e) => setOriginalPrice(e.target.value ? parseFloat(e.target.value) : null)} /></div>
                                    <div><Label>Stock</Label><Input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value))} /></div>
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
                                        <Label>Category</Label>
                                        <Select value={categoryId ?? ''} onValueChange={setCategoryId} required>
                                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                            <SelectContent>
                                                {allCategories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
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
                                                    <button onClick={() => handleTagSelection(tag)} className="ml-2"><X className="h-3 w-3"/></button>
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

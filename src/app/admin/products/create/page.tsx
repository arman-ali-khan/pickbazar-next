'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { UploadCloud, Image as ImageIcon, X, PlusCircle, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TiptapEditor from '@/components/tiptap-editor';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

export default function CreateProductPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const router = useRouter();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState('');
    const [price, setPrice] = useState<number | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);
    const [stock, setStock] = useState<number | null>(null);
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
        const [categoriesRes, tagsRes] = await Promise.all([
            supabase.from('categories').select('id, name'),
            supabase.from('tags').select('id, name'),
        ]);

        if (categoriesRes.error) toast({ variant: 'destructive', title: 'Error fetching categories' });
        else setAllCategories(categoriesRes.data);

        if (tagsRes.error) toast({ variant: 'destructive', title: 'Error fetching tags' });
        else setAllTags(tagsRes.data);
        
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
    
    const handleRemoveGalleryImage = (index: number) => {
        setGalleryImageFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryImagePreviews(prev => prev.filter((_, i) => i !== index));
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
        if (!name || !categoryId || !featuredImageFile) {
            toast({ variant: 'destructive', title: 'Missing required fields', description: 'Please fill in name, category and featured image.'});
            return;
        }
        setIsSubmitting(true);

        try {
            // Upload images
            const featured_image_url = await uploadImage(featuredImageFile);
            const gallery_urls = await Promise.all(galleryImageFiles.map(file => uploadImage(file)));

            // Insert product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .insert({
                    name, slug, description, unit, 
                    price: price || 0, 
                    original_price: originalPrice, 
                    stock: stock || 0, 
                    status, 
                    category_id: Number(categoryId), 
                    featured_image_url, 
                    gallery_urls
                })
                .select('id')
                .single();
            
            if (productError) throw productError;

            // Insert tags
            if (selectedTags.length > 0) {
                const productTags = selectedTags.map(tag => ({
                    product_id: productData.id,
                    tag_id: tag.id
                }));
                const { error: tagsError } = await supabase.from('product_tags').insert(productTags);
                if (tagsError) throw tagsError;
            }

            toast({ title: 'Product created successfully' });
            router.push('/admin/products');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error creating product', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>Loading...</p>;

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
                            Add New Product
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
                                        {featuredImagePreview ? (
                                             <div className="relative w-40 h-40"><Image src={featuredImagePreview} alt="Featured" fill className="object-cover rounded-md" /><Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => { setFeaturedImageFile(null); setFeaturedImagePreview(null); }}><X className="h-4 w-4" /></Button></div>
                                        ) : (
                                            <div className="flex items-center justify-center w-full"><label htmlFor="featured-image" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70"><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" /><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p></div><Input id="featured-image" type="file" className="hidden" onChange={handleFeaturedImageChange} /></label></div> 
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gallery</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {galleryImagePreviews.map((preview, i) => (
                                                <div key={i} className="relative w-full aspect-square"><Image src={preview} alt={`Gallery ${i}`} fill className="object-cover rounded-md" /><Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveGalleryImage(i)}><X className="h-4 w-4" /></Button></div>
                                            ))}
                                            {galleryImageFiles.length < 5 && <label htmlFor="gallery-images" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70"><div className="flex flex-col items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div><Input id="gallery-images" type="file" multiple className="hidden" onChange={handleGalleryImageChange} /></label>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div><Label>Price</Label><Input type="number" value={price ?? ''} onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : null)} required /></div>
                                    <div><Label>Original Price (Optional)</Label><Input type="number" value={originalPrice ?? ''} onChange={(e) => setOriginalPrice(e.target.value ? parseFloat(e.target.value) : null)} /></div>
                                    <div><Label>Stock</Label><Input type="number" value={stock ?? ''} onChange={(e) => setStock(e.target.value ? parseInt(e.target.value, 10) : null)} /></div>
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

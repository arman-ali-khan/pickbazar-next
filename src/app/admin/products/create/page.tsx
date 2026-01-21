'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Image as ImageIcon, Video, X, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categories = [
    { name: 'Fruits & Vegetables', sub: ['Fruits', 'Vegetables'] },
    { name: 'Meat & Fish', sub: ['Meat', 'Fish'] },
    { name: 'Snacks', sub: ['Chips', 'Chocolate'] },
];

const allTags = ['fresh', 'organic', 'sale', 'healthy', 'frozen'];

export default function CreateProductPage() {
    const [name, setName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    const slug = useMemo(() => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }, [name]);

    const availableSubcategories = useMemo(() => {
        return categories.filter(c => selectedCategories.includes(c.name)).flatMap(c => c.sub);
    }, [selectedCategories]);

    const handleAddTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setNewTag('');
        }
    };
    
    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };


    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="mx-auto grid flex-1 auto-rows-max gap-4 w-full">
                <div className="flex items-center gap-4">
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        Add New Product
                    </h1>
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Button variant="outline" size="sm">Discard</Button>
                        <Button size="sm">Save Product</Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        {/* Product Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Information</CardTitle>
                                <CardDescription>Enter the basic details of your product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="product-name">Name</Label>
                                    <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Organic Bananas" />
                                </div>
                                <div>
                                    <Label htmlFor="product-slug">Slug</Label>
                                    <Input id="product-slug" value={slug} readOnly placeholder="e.g., organic-bananas" />
                                </div>
                                 <div>
                                    <Label htmlFor="product-unit">Unit</Label>
                                    <Input id="product-unit" placeholder="e.g., 1kg, 1pc, 1lb" />
                                </div>
                                <div>
                                    <Label htmlFor="product-description">Description</Label>
                                    <Textarea id="product-description" placeholder="Provide a detailed description of the product..." className="min-h-32" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Media</CardTitle>
                                <CardDescription>Upload images and videos for your product.</CardDescription>
                            </CardHeader>
                             <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Featured Image</Label>
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF</p>
                                            </div>
                                            <Input id="dropzone-file" type="file" className="hidden" />
                                        </label>
                                    </div> 
                                </div>
                                 <div className="space-y-2">
                                    <Label>Gallery Images</Label>
                                     <div className="grid grid-cols-3 gap-4">
                                        {[...Array(3)].map((_, i) => (
                                             <div key={i} className="flex items-center justify-center w-full">
                                                <label htmlFor={`gallery-file-${i}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                    <Input id={`gallery-file-${i}`} type="file" className="hidden" />
                                                </label>
                                            </div> 
                                        ))}
                                     </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="video-url">Video Upload</Label>
                                    <div className="relative">
                                         <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input id="video-url" placeholder="Paste video link here" className="pl-10" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Variation Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Variation</CardTitle>
                                <CardDescription>Add variations like size or color.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Attribute Name</Label>
                                            <Input placeholder="e.g., Size"/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Attribute Value</Label>
                                            <Input placeholder="e.g., Small"/>
                                        </div>
                                    </div>
                                     <Button variant="outline" size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add another variation
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                         {/* Publishing Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Publishing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select defaultValue="draft">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Category & Tags Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Categorization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Category</Label>
                                    <Select onValueChange={(value) => setSelectedCategories([value])}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {availableSubcategories.length > 0 && (
                                    <div>
                                        <Label>Sub-category</Label>
                                        <Select onValueChange={(value) => setSelectedSubCategory(value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select sub-category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableSubcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div>
                                    <Label>Tags</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            value={newTag} 
                                            onChange={(e) => setNewTag(e.target.value)} 
                                            placeholder="Add a tag"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        />
                                        <Button type="button" onClick={handleAddTag} variant="outline" size="sm">Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {tags.map(tag => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="ml-2">
                                                    <X className="h-3 w-3"/>
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                 <div className="flex items-center justify-center gap-2 md:hidden">
                    <Button variant="outline" size="sm">Discard</Button>
                    <Button size="sm">Save Product</Button>
                </div>
            </div>
        </main>
    );
}

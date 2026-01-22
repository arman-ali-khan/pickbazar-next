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
import { useSupabase } from '@/lib/supabase/provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { iconList } from '@/lib/icon-list';
import LucideIcon from '@/components/lucide-icon';

interface Category {
  id: number;
  name: string;
}

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { supabase } = useSupabase();
    const categoryId = parseInt(params.id, 10);
    
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryData = async () => {
            if (isNaN(categoryId)) {
                notFound();
                return;
            }

            // Fetch the category being edited
            const { data: categoryData, error: categoryError } = await supabase
                .from('categories')
                .select('*')
                .eq('id', categoryId)
                .single();

            if (categoryError || !categoryData) {
                toast({ variant: 'destructive', title: 'Error', description: 'Category not found.' });
                notFound();
                return;
            }

            setName(categoryData.name);
            setSlug(categoryData.slug);
            setIcon(categoryData.icon);
            setDescription(categoryData.description || '');
            setParentId(categoryData.parent_id ? String(categoryData.parent_id) : null);

            // Fetch potential parent categories (all top-level categories, excluding the current one if it's a top-level)
            const { data: parentsData, error: parentsError } = await supabase
                .from('categories')
                .select('id, name')
                .is('parent_id', null)
                .not('id', 'eq', categoryId);
            
            if (parentsData) {
                setParentCategories(parentsData);
            }
            setLoading(false);
        };
        fetchCategoryData();
    }, [categoryId, supabase, toast]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const updatedCategory = {
            name,
            slug,
            description,
            icon,
            parent_id: parentId ? parseInt(parentId) : null,
        };

        const { error } = await supabase.from('categories').update(updatedCategory).eq('id', categoryId);
        setLoading(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: "Error Updating Category",
                description: error.message,
            });
        } else {
             toast({
                title: "Category Updated",
                description: `The category "${name}" has been successfully updated.`,
            });
            router.push('/admin/categories');
        }
    };

    if (loading) {
        return <p>Loading category...</p>
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/categories">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Category
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Category Details</CardTitle>
                        <CardDescription>Update the details for the category.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                             <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    className="w-full"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    type="text"
                                    className="w-full"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="icon">Icon</Label>
                                <Select onValueChange={setIcon} value={icon ?? ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {iconList.map(iconName => (
                                            <SelectItem key={iconName} value={iconName}>
                                                <div className="flex items-center gap-2">
                                                    <LucideIcon name={iconName} className="h-4 w-4" />
                                                    <span>{iconName}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="parent">Parent Category</Label>
                                <Select onValueChange={(value) => setParentId(value === 'none' ? null : value)} value={parentId ?? ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a parent category (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top-level category)</SelectItem>
                                        {parentCategories.map(cat => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    className="w-full"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Category'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

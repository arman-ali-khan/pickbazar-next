
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { ArrowUp, ArrowDown, Trash2, GripVertical } from "lucide-react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import LucideIcon from '@/components/lucide-icon';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  icon: string | null;
}

interface Section {
  id: number | null; // Can be null for newly added sections before saving
  category_id: number;
  display_order: number;
  categories: {
    name: string;
    icon: string | null;
  };
}

export default function HomeSectionsManagerPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [sections, setSections] = useState<Section[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newSectionCategoryId, setNewSectionCategoryId] = useState<string>('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [sectionsRes, categoriesRes] = await Promise.all([
            supabase.from('home_page_sections').select('id, category_id, display_order, categories(name, icon)').order('display_order'),
            supabase.from('categories').select('id, name, parent_id, icon').order('name'),
        ]);

        if (sectionsRes.error) {
            toast({ variant: 'destructive', title: 'Error fetching sections', description: sectionsRes.error.message });
        } else {
            setSections(sectionsRes.data as Section[]);
        }

        if (categoriesRes.error) {
            toast({ variant: 'destructive', title: 'Error fetching categories', description: categoriesRes.error.message });
        } else {
            setAllCategories(categoriesRes.data);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { availableCategories, parentCategories, subCategories } = useMemo(() => {
        const visibleCategoryIds = new Set(sections.map(s => s.category_id));
        const available = allCategories.filter(c => !visibleCategoryIds.has(c.id));
        const parents = available.filter(c => c.parent_id === null);
        const subs = available.filter(c => c.parent_id !== null);
        return { availableCategories: available, parentCategories: parents, subCategories: subs };
    }, [sections, allCategories]);

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newSections.length) return;
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        setSections(newSections.map((s, i) => ({ ...s, display_order: i })));
    };

    const handleRemove = (index: number) => {
        setSections(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, display_order: i })));
    };

    const handleAdd = () => {
        if (!newSectionCategoryId) {
            toast({ variant: 'destructive', title: 'Please select a category to add.' });
            return;
        }
        const categoryToAdd = allCategories.find(c => c.id === parseInt(newSectionCategoryId));
        if (categoryToAdd) {
            const newSection: Section = {
                id: null,
                category_id: categoryToAdd.id,
                display_order: sections.length,
                categories: { name: categoryToAdd.name, icon: categoryToAdd.icon },
            };
            setSections(prev => [...prev, newSection]);
            setNewSectionCategoryId('');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        
        // Use a Supabase function to handle the transaction
        const sectionsToSave = sections.map((section, index) => ({
            category_id: section.category_id,
            display_order: index,
        }));

        const { error } = await supabase.rpc('update_home_sections', { sections_data: sectionsToSave });

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving sections', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Home page sections have been updated.' });
            fetchData();
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-64" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50">
                                    <Skeleton className="h-5 w-5" />
                                    <Skeleton className="h-5 w-5" />
                                    <Skeleton className="h-5 w-48 flex-1" />
                                    <div className="flex items-center gap-1">
                                        <Skeleton className="h-9 w-9" />
                                        <Skeleton className="h-9 w-9" />
                                        <Skeleton className="h-9 w-9" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full sm:w-auto">
                            <Skeleton className="h-5 w-32 mb-2" />
                            <div className="flex gap-2">
                                 <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-20" />
                            </div>
                        </div>
                         <div className="pt-4 sm:pt-0 self-end">
                            <Skeleton className="h-12 w-36" />
                        </div>
                    </CardFooter>
                </Card>
            </main>
        );
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Home Page Section Manager</CardTitle>
                    <CardDescription>Select and order the product categories displayed on your home page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sections.length > 0 ? (
                            sections.map((section, index) => (
                                <div key={section.category_id} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <LucideIcon name={section.categories.icon} className="h-5 w-5 text-muted-foreground" />
                                   <p className="flex-1 font-medium">{section.categories.name}</p>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === sections.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No sections configured for the home page yet.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                        <h4 className="font-semibold mb-2">Add New Section</h4>
                        <div className="flex gap-2">
                             <Select value={newSectionCategoryId} onValueChange={setNewSectionCategoryId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {parentCategories.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Main Categories</SelectLabel>
                                            {parentCategories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    {subCategories.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Sub-Categories</SelectLabel>
                                            {subCategories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAdd} disabled={!newSectionCategoryId}>Add</Button>
                        </div>
                    </div>
                     <div className="pt-4 sm:pt-0 self-end">
                        <Button onClick={handleSave} disabled={isSaving} size="lg">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </main>
    );
}

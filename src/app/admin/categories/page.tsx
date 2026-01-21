'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
}

interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

export default function AdminCategoriesPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSubCategoryNames, setNewSubCategoryNames] = useState<{ [key: number]: string }>({});
    const [addingSubCategoryId, setAddingSubCategoryId] = useState<number | null>(null);

    const getCategories = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
            setCategories([]);
        } else {
            const topLevelCategories = data.filter(c => c.parent_id === null);
            const subCategories = data.filter(c => c.parent_id !== null);

            const hierarchicalCategories = topLevelCategories.map(parent => ({
                ...parent,
                subcategories: subCategories.filter(sub => sub.parent_id === parent.id),
            }));

            setCategories(hierarchicalCategories);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    const handleDelete = async (id: number) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting category', description: error.message });
        } else {
            toast({ title: 'Category Deleted' });
            getCategories(); // Refresh list
        }
    };

    const handleAddSubcategory = async (e: React.FormEvent, parentId: number) => {
        e.preventDefault();
        const name = newSubCategoryNames[parentId];
        if (!name || !name.trim()) {
            toast({ variant: 'destructive', title: 'Name is required' });
            return;
        }
        setAddingSubCategoryId(parentId);

        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const { error } = await supabase.from('categories').insert({
            name: name.trim(),
            slug,
            parent_id: parentId,
        });

        setAddingSubCategoryId(null);

        if (error) {
            toast({ variant: 'destructive', title: 'Error adding sub-category', description: error.message });
        } else {
            toast({ title: 'Sub-category Added' });
            setNewSubCategoryNames(prev => ({ ...prev, [parentId]: '' }));
            getCategories(); // Refresh list
        }
    };

    if (loading) {
        return <p>Loading categories...</p>
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>Manage your product categories and sub-categories.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" asChild>
                         <Link href="/admin/categories/create">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Category
                            </span>
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full space-y-2">
                        {categories.map((category) => (
                            <AccordionItem value={`item-${category.id}`} key={category.id} className="bg-white rounded-lg border">
                                <div className="flex items-center pr-4">
                                    <AccordionTrigger className="flex-1 text-left px-4 py-0 font-semibold hover:no-underline text-base">
                                         <div className="flex justify-between items-center w-full py-4">
                                            <div className="flex-1 space-y-1 text-left">
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-sm text-muted-foreground">{category.slug}</p>
                                            </div>
                                             {category.subcategories.length > 0 && <Badge variant="outline">{category.subcategories.length} sub-categories</Badge>}
                                        </div>
                                    </AccordionTrigger>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/categories/edit/${category.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(category.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <AccordionContent className="px-4 pt-0 pb-4">
                                    <div className="border-t mt-2 pt-4">
                                        <h4 className="font-semibold text-sm mb-2">Sub-categories</h4>
                                        {category.subcategories.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Slug</TableHead>
                                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                {category.subcategories.map(sub => (
                                                    <TableRow key={sub.id}>
                                                        <TableCell>{sub.name}</TableCell>
                                                        <TableCell>{sub.slug}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/admin/categories/edit/${sub.id}`}>
                                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(sub.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No sub-categories yet.</p>
                                        )}
                                        <form onSubmit={(e) => handleAddSubcategory(e, category.id)} className="mt-4">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="New sub-category name"
                                                    value={newSubCategoryNames[category.id] || ''}
                                                    onChange={(e) => setNewSubCategoryNames(prev => ({ ...prev, [category.id]: e.target.value }))}
                                                />
                                                <Button type="submit" disabled={addingSubCategoryId === category.id}>
                                                    {addingSubCategoryId === category.id ? "Adding..." : "Add"}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </main>
    );
}

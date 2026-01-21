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

// Mock data - in a real app, this would come from an API
const initialCategories = [
    { id: 1, name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh fruits and vegetables', productCount: 32, subcategories: ['Fruits', 'Vegetables'] },
    { id: 2, name: 'Meat & Fish', slug: 'meat-fish', description: 'Fresh meat and fish', productCount: 21, subcategories: ['Meat', 'Fish'] },
    { id: 3, name: 'Snacks', slug: 'snacks', description: 'Chips, chocolate, and more', productCount: 15, subcategories: ['Chips', 'Chocolate', 'Nuts'] },
    { id: 4, name: 'Pet Care', slug: 'pet-care', description: 'Food and supplies for pets', productCount: 8, subcategories: ['Dog Food', 'Cat Food'] },
    { id: 5, name: 'Home & Cleaning', slug: 'home-cleaning', description: 'Household cleaning supplies', productCount: 12, subcategories: ['Detergent', 'Cleaning Tools'] },
    { id: 6, name: 'Dairy', slug: 'dairy', description: 'Milk, cheese, yogurt', productCount: 18, subcategories: ['Milk', 'Cheese', 'Yogurt'] },
];

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const categoryId = parseInt(params.id, 10);
    
    const [category, setCategory] = useState(() => initialCategories.find(c => c.id === categoryId));
    
    const [name, setName] = useState(category?.name || '');
    const [slug, setSlug] = useState(category?.slug || '');
    const [description, setDescription] = useState(category?.description || '');

    useEffect(() => {
        const foundCategory = initialCategories.find(c => c.id === categoryId);
        if (foundCategory) {
            setCategory(foundCategory);
            setName(foundCategory.name);
            setSlug(foundCategory.slug);
            setDescription(foundCategory.description);
        } else {
            notFound();
        }
    }, [categoryId]);


    if (!category) {
        return null; 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ id: category.id, name, slug, description });
        toast({
            title: "Category Updated",
            description: `The category "${name}" has been successfully updated.`,
        });
        router.push('/admin/categories');
    };

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
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    type="text"
                                    className="w-full"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit">Update Category</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

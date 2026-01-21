'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';


const initialCategories = [
    { id: 1, name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh fruits and vegetables', productCount: 32, subcategories: ['Fruits', 'Vegetables'] },
    { id: 2, name: 'Meat & Fish', slug: 'meat-fish', description: 'Fresh meat and fish', productCount: 21, subcategories: ['Meat', 'Fish'] },
    { id: 3, name: 'Snacks', slug: 'snacks', description: 'Chips, chocolate, and more', productCount: 15, subcategories: ['Chips', 'Chocolate', 'Nuts'] },
    { id: 4, name: 'Pet Care', slug: 'pet-care', description: 'Food and supplies for pets', productCount: 8, subcategories: ['Dog Food', 'Cat Food'] },
    { id: 5, name: 'Home & Cleaning', slug: 'home-cleaning', description: 'Household cleaning supplies', productCount: 12, subcategories: ['Detergent', 'Cleaning Tools'] },
    { id: 6, name: 'Dairy', slug: 'dairy', description: 'Milk, cheese, yogurt', productCount: 18, subcategories: ['Milk', 'Cheese', 'Yogurt'] },
];

type Category = typeof initialCategories[0];


export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState(initialCategories);

    const handleDelete = (id: number) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>Manage your product categories.</CardDescription>
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
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Sub-categories</TableHead>
                                    <TableHead className="text-right">Products</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{category.slug}</TableCell>
                                        <TableCell className="text-muted-foreground">{category.description}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {category.subcategories.slice(0, 3).map(sub => <Badge key={sub} variant="outline">{sub}</Badge>)}
                                                {category.subcategories.length > 3 && <Badge variant="outline">...</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{category.productCount}</TableCell>
                                        <TableCell>
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Mobile View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {categories.map((category) => (
                            <Card key={category.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-lg">
                                        {category.name}
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
                                    </CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Slug:</span> {category.slug}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {category.subcategories.map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-sm text-muted-foreground">{category.productCount} products</p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
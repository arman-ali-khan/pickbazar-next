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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const initialCategories = [
    { id: 1, name: 'Fruits & Vegetables', description: 'Fresh fruits and vegetables', productCount: 32, subcategories: ['Fruits', 'Vegetables'] },
    { id: 2, name: 'Meat & Fish', description: 'Fresh meat and fish', productCount: 21, subcategories: ['Meat', 'Fish'] },
    { id: 3, name: 'Snacks', description: 'Chips, chocolate, and more', productCount: 15, subcategories: ['Chips', 'Chocolate', 'Nuts'] },
    { id: 4, name: 'Pet Care', description: 'Food and supplies for pets', productCount: 8, subcategories: ['Dog Food', 'Cat Food'] },
    { id: 5, name: 'Home & Cleaning', description: 'Household cleaning supplies', productCount: 12, subcategories: ['Detergent', 'Cleaning Tools'] },
    { id: 6, name: 'Dairy', description: 'Milk, cheese, yogurt', productCount: 18, subcategories: ['Milk', 'Cheese', 'Yogurt'] },
];

type Category = typeof initialCategories[0];

// Dialog for Add/Edit
function CategoryFormDialog({
    isOpen,
    setIsOpen,
    category,
    onSave
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    category: Category | null;
    onSave: (data: { name: string, description: string }) => void;
}) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        onSave({ name, description });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        <DialogDescription>
                            {category ? 'Make changes to your category here. Click save when you\'re done.' : 'Add a new category to your store.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input id="name" name="name" defaultValue={category?.name || ''} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input id="description" name="description" defaultValue={category?.description || ''} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState(initialCategories);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

    const openFormForEdit = (category: Category) => {
        setCurrentCategory(category);
        setIsFormOpen(true);
    };

    const openFormForAdd = () => {
        setCurrentCategory(null);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    const handleSave = (data: { name: string, description: string }) => {
        if (currentCategory) { // Editing
            setCategories(categories.map(c => c.id === currentCategory.id ? { ...c, ...data } : c));
        } else { // Adding
            const newCategory = {
                id: Date.now(),
                ...data,
                productCount: 0,
                subcategories: []
            };
            setCategories([...categories, newCategory]);
        }
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>Manage your product categories.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" onClick={openFormForAdd}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Category
                        </span>
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
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
                                                    <DropdownMenuItem onClick={() => openFormForEdit(category)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
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
                                                <DropdownMenuItem onClick={() => openFormForEdit(category)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
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

            <CategoryFormDialog
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                category={currentCategory}
                onSave={handleSave}
            />
        </main>
    );
}

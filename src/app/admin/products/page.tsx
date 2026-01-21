'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter
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
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products as allProductsData } from "@/lib/data";
import Image from "next/image";
import { PlusCircle, Search, ListFilter, Pencil, Trash2, Power, PowerOff, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const productsWithStatus = allProductsData.map((p, i) => ({
    ...p,
    stock: Math.floor(Math.random() * 100),
    status: ['active', 'draft', 'archived'][i % 3] as 'active' | 'draft' | 'archived',
}));

type ProductWithStatus = (typeof productsWithStatus)[0];

const ProductList = ({ products }: { products: ProductWithStatus[] }) => {
    if (products.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No products found.</p>
            </div>
        )
    }

    return (
        <>
            {/* Card View for mobile */}
            <div className="grid grid-cols-2 gap-4 md:hidden">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col overflow-hidden">
                        <CardHeader className="p-0">
                            <div className="relative aspect-square bg-muted">
                                <Image
                                    src={product.image.imageUrl}
                                    alt={product.name}
                                    data-ai-hint={product.image.imageHint}
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 flex-grow space-y-2">
                            <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
                             <div className="flex justify-between items-center">
                                <span className="font-bold text-md">${product.price.toFixed(2)}</span>
                                <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'draft' ? 'outline' : 'destructive'} className="text-xs">
                                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                </Badge>
                            </div>
                        </CardContent>
                         <CardFooter className="p-2 pt-0 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                    {product.status === 'active' ? (
                                        <DropdownMenuItem>
                                            <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem>
                                            <Power className="mr-2 h-4 w-4" /> Activate
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Table View for desktop */}
            <div className="hidden md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="hidden md:table-cell">
                                Stock
                            </TableHead>
                             <TableHead className="hidden md:table-cell">
                                Category
                            </TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={product.name}
                                        className="aspect-square rounded-md object-contain"
                                        height="64"
                                        src={product.image.imageUrl}
                                        data-ai-hint={product.image.imageHint}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    {product.name}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'draft' ? 'outline' : 'destructive'}>
                                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell>${product.price.toFixed(2)}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {product.stock}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {product.category}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                aria-haspopup="true"
                                                size="icon"
                                                variant="ghost"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Delete</DropdownMenuItem>
                                            {product.status === 'active' ? (
                                                <DropdownMenuItem>Deactivate</DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem>Activate</DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}

export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{
        categories: string[];
        price: { min: number | null; max: number | null };
        stock: { min: number | null; max: number | null };
    }>({
        categories: [],
        price: { min: null, max: null },
        stock: { min: null, max: null },
    });
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE = 8;

    const uniqueCategories = [...new Set(productsWithStatus.map(p => p.category))];
    
    const filterAndSearch = (status?: 'active' | 'draft' | 'archived') => {
        let filtered = productsWithStatus;

        if (status) {
            filtered = filtered.filter(p => p.status === status);
        }

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (filters.categories.length > 0) {
            filtered = filtered.filter(p => filters.categories.includes(p.category));
        }

        if (filters.price.min !== null) {
            filtered = filtered.filter(p => p.price >= filters.price.min!);
        }
        if (filters.price.max !== null) {
            filtered = filtered.filter(p => p.price <= filters.price.max!);
        }

        if (filters.stock.min !== null) {
            filtered = filtered.filter(p => p.stock >= filters.stock.min!);
        }
        if (filters.stock.max !== null) {
            filtered = filtered.filter(p => p.stock <= filters.stock.max!);
        }
        
        return filtered;
    }

    const clearFilters = () => {
        setFilters({
            categories: [],
            price: { min: null, max: null },
            stock: { min: null, max: null },
        });
    }

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1);
    };

    const productsMap = {
        all: filterAndSearch(),
        active: filterAndSearch('active'),
        draft: filterAndSearch('draft'),
        archived: filterAndSearch('archived'),
    };
    
    const currentProductList = productsMap[activeTab as keyof typeof productsMap] || [];
    const totalPages = Math.ceil(currentProductList.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = currentProductList.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE,
        currentPage * PRODUCTS_PER_PAGE
    );
    
    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
        <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <div className="flex items-center">
                 <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                    <TabsTrigger value="archived" className="hidden sm:flex">Archived</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Filter
                            </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filters</h4>
                                    <p className="text-sm text-muted-foreground">Set your product filters.</p>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Category</Label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {uniqueCategories.map(category => (
                                                <div key={category} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`cat-${category}`}
                                                        checked={filters.categories.includes(category)}
                                                        onCheckedChange={checked => {
                                                            const newCategories = checked
                                                                ? [...filters.categories, category]
                                                                : filters.categories.filter(c => c !== category);
                                                            setFilters({ ...filters, categories: newCategories });
                                                        }}
                                                    />
                                                    <Label htmlFor={`cat-${category}`} className="font-normal">{category}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Price Range</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                value={filters.price.min ?? ''}
                                                onChange={e => setFilters({...filters, price: {...filters.price, min: e.target.value ? Number(e.target.value) : null}})}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                value={filters.price.max ?? ''}
                                                onChange={e => setFilters({...filters, price: {...filters.price, max: e.target.value ? Number(e.target.value) : null}})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Stock</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                value={filters.stock.min ?? ''}
                                                onChange={e => setFilters({...filters, stock: {...filters.stock, min: e.target.value ? Number(e.target.value) : null}})}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                value={filters.stock.max ?? ''}
                                                onChange={e => setFilters({...filters, stock: {...filters.stock, max: e.target.value ? Number(e.target.value) : null}})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={clearFilters} variant="ghost">Clear Filters</Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button size="sm" className="h-8 gap-1" asChild>
                        <Link href="/admin/products/create">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Product
                            </span>
                        </Link>
                    </Button>
                </div>
            </div>
             <Card>
                <CardHeader>
                     <CardTitle>Products</CardTitle>
                    <CardDescription>
                        Manage your products and view their sales performance.
                    </CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Search products..." 
                            className="w-full appearance-none bg-background pl-8 shadow-none md:w-1/3"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                   <ProductList products={paginatedProducts} />
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>{currentProductList.length > 0 ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0}</strong> to <strong>{Math.min(currentPage * PRODUCTS_PER_PAGE, currentProductList.length)}</strong> of <strong>{currentProductList.length}</strong> products
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages || totalPages === 0}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </Tabs>
        </main>
    );
}

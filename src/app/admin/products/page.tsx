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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products as allProducts } from "@/lib/data";
import Image from "next/image";
import { File, PlusCircle, MoreHorizontal, Search, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const productsWithStatus = allProducts.map((p, i) => ({
    ...p,
    stock: Math.floor(Math.random() * 100),
    status: ['active', 'draft', 'archived'][i % 3] as 'active' | 'draft' | 'archived',
}));

const ProductList = ({ products }: { products: typeof productsWithStatus }) => {
    if (products.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No products found.</p>
            </div>
        )
    }
    return (
    <>
        {/* Desktop View */}
        <div className="hidden md:block">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-[100px]">Stock</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="relative h-16 w-16">
                                <Image
                                    src={product.image.imageUrl}
                                    alt={product.name}
                                    data-ai-hint={product.image.imageHint}
                                    fill
                                    className="rounded-md object-contain"
                                />
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                                <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'draft' ? 'outline' : 'destructive'}>
                                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
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
            {products.map((product) => (
                <Card key={product.id}>
                    <CardHeader className="p-2">
                        <div className="relative h-32 w-full">
                            <Image
                                src={product.image.imageUrl}
                                alt={product.name}
                                data-ai-hint={product.image.imageHint}
                                fill
                                className="rounded-md object-contain p-2"
                            />
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" className="absolute top-2 right-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                             <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'draft' ? 'outline' : 'destructive'}>
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Stock: {product.stock}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    </>
    )
};


export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filterAndSearch = (status?: 'active' | 'draft' | 'archived') => {
        let filtered = productsWithStatus;
        if (status) {
            filtered = filtered.filter(p => p.status === status);
        }
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    }

    const allProducts = filterAndSearch();
    const activeProducts = filterAndSearch('active');
    const draftProducts = filterAndSearch('draft');
    const archivedProducts = filterAndSearch('archived');
    
    return (
        <main className="grid flex-1 items-start gap-4 sm:px-6 sm:py-0 md:gap-8">
        <Tabs defaultValue="all">
            <div className="flex items-center">
                 <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                    <TabsTrigger value="archived" className="hidden sm:flex">Archived</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filter
                      </span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                        <File className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Export
                        </span>
                    </Button>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Product
                        </span>
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
                    <TabsContent value="all">
                        <ProductList products={allProducts} />
                    </TabsContent>
                     <TabsContent value="active">
                        <ProductList products={activeProducts} />
                    </TabsContent>
                     <TabsContent value="draft">
                        <ProductList products={draftProducts} />
                    </TabsContent>
                     <TabsContent value="archived">
                        <ProductList products={archivedProducts} />
                    </TabsContent>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{allProducts.length}</strong> of <strong>{productsWithStatus.length}</strong> products
                    </div>
                </CardFooter>
            </Card>
        </Tabs>
        </main>
    );
}
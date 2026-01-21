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
import { File, PlusCircle, Search, ListFilter, Pencil, Trash2, Power, PowerOff, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

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
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
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
                        Showing <strong>{allProducts.length}</strong> of <strong>{productsWithStatus.length}</strong> products
                    </div>
                </CardFooter>
            </Card>
        </Tabs>
        </main>
    );
}

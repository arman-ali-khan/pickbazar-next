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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products as allProductsData } from "@/lib/data";
import Image from "next/image";
import { File, PlusCircle, Search, ListFilter, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const productsWithStatus = allProductsData.map((p, i) => ({
    ...p,
    stock: Math.floor(Math.random() * 100),
    status: ['active', 'draft', 'archived'][i % 3] as 'active' | 'draft' | 'archived',
}));

const ProductList = ({ products }: { products: typeof productsWithStatus }) => {
    if (products.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No products found.</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
                <Card key={product.id} className="flex flex-col overflow-hidden">
                    <CardHeader className="p-0">
                        <div className="relative aspect-video bg-muted">
                            <Image
                                src={product.image.imageUrl}
                                alt={product.name}
                                data-ai-hint={product.image.imageHint}
                                fill
                                className="object-contain p-4"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                            <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'draft' ? 'outline' : 'destructive'}>
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-xl">${product.price.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                        {product.status === 'active' ? (
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <PowerOff className="h-3.5 w-3.5" /> Deactivate
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Power className="h-3.5 w-3.5" /> Activate
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
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
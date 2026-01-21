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
import { products as allProducts } from "@/lib/data";
import Image from "next/image";
import { File, PlusCircle, Search, ListFilter, Edit, Trash, Power, PowerOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type ProductWithStatus = (typeof allProducts)[0] & {
    stock: number;
    status: 'active' | 'draft' | 'archived';
};


const ProductList = ({ products, onStatusChange }: { products: ProductWithStatus[], onStatusChange: (productId: number, newStatus: 'active' | 'draft' | 'archived') => void }) => {
    if (products.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No products found.</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
                <Card key={product.id}>
                    <CardHeader className="flex flex-row items-start gap-4">
                        <div className="relative h-20 w-20 flex-shrink-0">
                            <Image
                                src={product.image.imageUrl}
                                alt={product.name}
                                data-ai-hint={product.image.imageHint}
                                fill
                                className="rounded-md object-contain"
                            />
                        </div>
                        <div className="flex-grow">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                             <p className="text-sm text-muted-foreground">{product.category}</p>
                             <Badge variant={product.status === 'active' ? 'secondary' : product.status === 'draft' ? 'outline' : 'destructive'} className="mt-2">
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-semibold">${product.price.toFixed(2)}</p>
                        </div>
                         <div>
                            <p className="text-muted-foreground">Stock</p>
                            <p className="font-semibold">{product.stock}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-start gap-2">
                        <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onStatusChange(product.id, product.status === 'active' ? 'draft' : 'active')}>
                            {product.status === 'active' ? (
                                <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                                </>
                             ) : (
                                 <>
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                                </>
                             )}
                        </Button>
                        <Button variant="destructive" size="sm">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
};


export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductWithStatus[]>(() => 
        allProducts.map((p, i) => ({
            ...p,
            stock: Math.floor(Math.random() * 100),
            status: ['active', 'draft', 'archived'][i % 3] as 'active' | 'draft' | 'archived',
        }))
    );
    const [searchTerm, setSearchTerm] = useState('');

    const handleStatusChange = (productId: number, newStatus: 'active' | 'draft' | 'archived') => {
        setProducts(currentProducts => currentProducts.map(p => p.id === productId ? { ...p, status: newStatus } : p));
    };
    
    const filterAndSearch = (status?: 'active' | 'draft' | 'archived') => {
        let filtered = products;
        if (status) {
            filtered = filtered.filter(p => p.status === status);
        }
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    }

    const allProductsFiltered = filterAndSearch();
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
                        <ProductList products={allProductsFiltered} onStatusChange={handleStatusChange} />
                    </TabsContent>
                     <TabsContent value="active">
                        <ProductList products={activeProducts} onStatusChange={handleStatusChange} />
                    </TabsContent>
                     <TabsContent value="draft">
                        <ProductList products={draftProducts} onStatusChange={handleStatusChange} />
                    </TabsContent>
                     <TabsContent value="archived">
                        <ProductList products={archivedProducts} onStatusChange={handleStatusChange} />
                    </TabsContent>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>1-{allProductsFiltered.length}</strong> of <strong>{products.length}</strong> products
                    </div>
                </CardFooter>
            </Card>
        </Tabs>
        </main>
    );
}

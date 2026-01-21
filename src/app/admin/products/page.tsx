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
import Image from "next/image";
import { PlusCircle, Search, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";

type ProductWithCategory = {
    id: number;
    name: string;
    status: string;
    price: number;
    stock: number;
    featured_image_url: string;
    categories: { name: string } | null;
}

const ProductList = ({ products, onDelete }: { products: ProductWithCategory[], onDelete: (id: number) => void }) => {
    if (products.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No products found.</p>
            </div>
        )
    }

    const getStatusVariant = (status: string) => {
      switch (status) {
        case 'active': return 'secondary';
        case 'draft': return 'outline';
        case 'archived': return 'destructive';
        default: return 'default';
      }
    };

    return (
        <>
            {/* Card View for mobile */}
            <div className="grid grid-cols-2 gap-4 md:hidden">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col overflow-hidden">
                        <CardHeader className="p-0">
                            <div className="relative aspect-square bg-muted">
                                <Image
                                    src={product.featured_image_url || 'https://picsum.photos/seed/placeholder/200'}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 flex-grow space-y-2">
                            <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
                             <div className="flex justify-between items-center">
                                <span className="font-bold text-md">${product.price.toFixed(2)}</span>
                                <Badge variant={getStatusVariant(product.status)} className="text-xs capitalize">
                                    {product.status}
                                </Badge>
                            </div>
                        </CardContent>
                         <CardFooter className="p-2 pt-0 flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/products/edit/${product.id}`}><Pencil className="mr-2 h-4 w-4" /> Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(product.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
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
                                Image
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
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
                                        src={product.featured_image_url || 'https://picsum.photos/seed/placeholder/200'}
                                        width="64"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(product.status)} className="capitalize">
                                        {product.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>${product.price.toFixed(2)}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>{product.categories?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/products/edit/${product.id}`}>Edit</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(product.id)}>Delete</DropdownMenuItem>
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
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    
    const getProducts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('id, name, status, price, stock, featured_image_url, categories(name)')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching products', description: error.message });
        } else {
            setProducts(data as ProductWithCategory[]);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getProducts();
    }, [getProducts]);
    
    const handleDelete = async (id: number) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting product', description: error.message });
        } else {
            toast({ title: 'Product Deleted' });
            getProducts();
        }
    };

    const filteredProducts = useMemo(() => {
      let filtered = [...products];

      if (activeTab !== 'all') {
          filtered = filtered.filter(p => p.status === activeTab);
      }

      if (searchTerm) {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return filtered;
    }, [products, activeTab, searchTerm]);

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center">
                     <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="draft">Draft</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                    <div className="ml-auto flex items-center gap-2">
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
                        <CardDescription>Manage your products and view their sales performance.</CardDescription>
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
                      {loading ? <p>Loading products...</p> : <ProductList products={filteredProducts} onDelete={handleDelete} />}
                    </CardContent>
                </Card>
            </Tabs>
        </main>
    );
}

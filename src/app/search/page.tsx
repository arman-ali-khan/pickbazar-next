'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProductCard from '@/components/product-details';
import type { Product } from '@/lib/data';
import { useMemo, useState, Suspense, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilterSidebar from '@/components/filter-sidebar';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useSupabase } from '@/lib/supabase/provider';
import { Skeleton } from '@/components/ui/skeleton';

type SortOrder = 'default' | 'price-asc' | 'price-desc';
const PRODUCTS_PER_PAGE = 12;

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { supabase } = useSupabase();

  // Data states
  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<{name: string, subcategories: string[]}[]>([]);
  const [loading, setLoading] = useState(true);

  // UI/Filter states
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const fetchAndProcessData = useCallback(async () => {
    if (!query) {
      setSearchedProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select(`*, product_categories(categories(name))`)
        .eq('status', 'active')
        .ilike('name', `%${query}%`),
      supabase.rpc('get_category_tree')
    ]);

    if (productsRes.data) {
      const fetchedProducts: Product[] = productsRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || '', imageHint: 'product', description: p.name },
        weight: p.unit || '',
        category: p.product_categories[0]?.categories?.name || 'Uncategorized',
        dbCategories: p.product_categories.map((pc: any) => pc.categories.name),
        rating: p.rating || 4.5, // Assuming rating is available, fallback to 4.5
      }));
      setSearchedProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } else {
      setSearchedProducts([]);
      setFilteredProducts([]);
    }

    if (categoriesRes.data) {
      setDbCategories(categoriesRes.data);
    }

    setLoading(false);
  }, [supabase, query]);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);
  
  const handleFilterChange = useCallback((filters: {
    categories: string[];
    rating: number;
  }) => {
    let tempProducts = [...searchedProducts];

    if (filters.categories.length > 0) {
      tempProducts = tempProducts.filter(p => {
        const productCats = (p as any).dbCategories || [];
        return productCats.some((pc: string) => filters.categories.includes(pc));
      });
    }

    if (filters.rating > 0) {
      tempProducts = tempProducts.filter(p => p.rating && p.rating >= filters.rating);
    }
    
    setFilteredProducts(tempProducts);
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchedProducts]);

  const sortedProducts = useMemo(() => {
    let products = [...filteredProducts];
    if (sortOrder === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    }
    return products;
  }, [filteredProducts, sortOrder]);

  const loadMoreProducts = () => {
    setVisibleCount(prevCount => prevCount + PRODUCTS_PER_PAGE);
  };
  
  const currentProducts = sortedProducts.slice(0, visibleCount);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...searchedProducts.map(p => p.price), 100)), [searchedProducts]);
  
  return (
    <main className="container py-12">
        <div className="text-center mb-12">
            {query ? (
                <>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Search Results for "{query}"</h1>
                <p className="text-muted-foreground mt-4 text-lg">
                    {loading ? 'Searching...' : `Found ${sortedProducts.length} matching products.`}
                </p>
                </>
            ) : (
                <>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Search Our Products</h1>
                <p className="text-muted-foreground mt-4 text-lg">
                    Use the search bar above to find what you're looking for.
                </p>
                </>
            )}
        </div>

        {query && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                <div className="hidden lg:block">
                    <FilterSidebar onFilterChange={handleFilterChange} allCategories={dbCategories} maxPrice={maxPrice} />
                </div>
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="lg:hidden w-full sm:w-auto">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filters
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-80 overflow-y-auto">
                                    <SheetTitle className="sr-only">Filters</SheetTitle>
                                    <FilterSidebar onFilterChange={handleFilterChange} allCategories={dbCategories} maxPrice={maxPrice} />
                                </SheetContent>
                            </Sheet>
                        </div>
                        <p className="text-sm text-muted-foreground hidden sm:block">Showing {currentProducts.length} of {sortedProducts.length} products</p>
                        <div className="w-full sm:w-auto">
                          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                              <SelectTrigger className="w-full sm:w-[180px]">
                                  <SelectValue placeholder="Sort by" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="default">Default</SelectItem>
                                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>
                    </div>
                    {loading ? (
                       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="aspect-[3/2] w-full" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : currentProducts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                                {currentProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                             {currentProducts.length < sortedProducts.length && (
                                <div className="text-center mt-12">
                                <Button onClick={loadMoreProducts} variant="outline" size="lg">
                                    Load More
                                </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-lg text-muted-foreground">
                            No products found matching your search and filter criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <Suspense fallback={<div className="container py-12 text-center">Loading search results...</div>}>
        <SearchContent />
      </Suspense>
      <Footer />
      <CartDrawer />
    </div>
  );
}

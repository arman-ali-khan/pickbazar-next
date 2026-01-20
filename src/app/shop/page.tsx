'use client';

import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProductCard from '@/components/product-details';
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/data';
import FilterSidebar from '@/components/filter-sidebar';
import { Button } from '@/components/ui/button';
import { Filter, Grid, List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductRowCard from '@/components/product-row-card';

type ViewMode = 'grid' | 'list';
type SortOrder = 'default' | 'price-asc' | 'price-desc';
const PRODUCTS_PER_PAGE = 12;

export default function ShopPage() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);
  const [displayProducts, setDisplayProducts] = useState<Product[]>(allProducts);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const handleFilterChange = useCallback((filters: {
    categories: string[];
    priceRange: number[];
    rating: number;
  }) => {
    let products = [...allProducts];

    if (filters.categories.length > 0) {
      products = products.filter(p => filters.categories.includes(p.category));
    }

    products = products.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    if (filters.rating > 0) {
      products = products.filter(p => p.rating && p.rating >= filters.rating);
    }
    
    setFilteredProducts(products);
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, []);

  useEffect(() => {
    let sortedProducts = [...filteredProducts];
    if (sortOrder === 'price-asc') {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      sortedProducts.sort((a, b) => b.price - a.price);
    }
    setDisplayProducts(sortedProducts);
  }, [filteredProducts, sortOrder]);

  const loadMoreProducts = () => {
    setVisibleCount(prevCount => prevCount + PRODUCTS_PER_PAGE);
  };
  
  const currentProducts = displayProducts.slice(0, visibleCount);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="py-8 px-1 md:px-2">
        <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Shop</h1>
            <p className="text-muted-foreground mt-2">Browse our collection of fresh products.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-2">
            <div className="hidden lg:block">
                <FilterSidebar onFilterChange={handleFilterChange} />
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
                            <SheetContent side="left" className="p-0 w-80">
                                <SheetTitle className="sr-only">Filters</SheetTitle>
                                <FilterSidebar onFilterChange={handleFilterChange} />
                            </SheetContent>
                        </Sheet>
                    </div>
                    <p className="text-sm text-muted-foreground hidden sm:block">Showing {currentProducts.length} of {displayProducts.length} products</p>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center p-1 bg-gray-100 rounded-md">
                            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8">
                                <Grid className="h-5 w-5" />
                            </Button>
                            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8">
                                <List className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                      {currentProducts.map(product => (
                          <ProductCard key={product.id} product={product} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                      {currentProducts.map(product => (
                          <ProductRowCard key={product.id} product={product} />
                      ))}
                  </div>
                )}
                {currentProducts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
                    </div>
                )}

                {currentProducts.length < displayProducts.length && (
                  <div className="text-center mt-12">
                    <Button onClick={loadMoreProducts} variant="outline" size="lg">
                      Load More
                    </Button>
                  </div>
                )}
            </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

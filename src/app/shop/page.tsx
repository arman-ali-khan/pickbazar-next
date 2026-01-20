'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProductCard from '@/components/product-details';
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/data';
import FilterSidebar from '@/components/filter-sidebar';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function ShopPage() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);

  const handleFilterChange = (filters: {
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
  };
  
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Shop</h1>
            <p className="text-muted-foreground mt-2">Browse our collection of fresh products.</p>
        </div>
        <div className="lg:hidden mb-4">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                    <FilterSidebar onFilterChange={handleFilterChange} />
                </SheetContent>
            </Sheet>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            <div className="hidden lg:block">
                <FilterSidebar onFilterChange={handleFilterChange} />
            </div>
            <div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
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

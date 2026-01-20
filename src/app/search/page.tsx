'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProductCard from '@/components/product-details';
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/data';
import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOrder = 'default' | 'price-asc' | 'price-desc';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  
  const filteredProducts = useMemo(() => {
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      return allProducts.filter(product =>
        product.name.toLowerCase().includes(lowercasedQuery) ||
        product.category.toLowerCase().includes(lowercasedQuery)
      );
    }
    return [];
  }, [query]);

  const sortedProducts = useMemo(() => {
    let products = [...filteredProducts];
    if (sortOrder === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    }
    return products;
  }, [filteredProducts, sortOrder]);


  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-6">
          {query ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Search Results for "{query}"</h1>
              <p className="text-muted-foreground mt-4 text-lg">
                Found {sortedProducts.length} matching products.
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

        {sortedProducts.length > 0 && (
          <div className="flex justify-end mb-6">
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
          </div>
        )}

        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          query && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                No products found matching your search.
              </p>
            </div>
          )
        )}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

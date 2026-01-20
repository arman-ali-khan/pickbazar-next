'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProductCard from '@/components/product-details';
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/data';
import { useMemo } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
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

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          {query ? (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Search Results for "{query}"</h1>
              <p className="text-muted-foreground mt-4 text-lg">
                Found {filteredProducts.length} matching products.
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

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {filteredProducts.map(product => (
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

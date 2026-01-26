
'use client';

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product-details';
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
import { useSupabase } from '@/lib/supabase/provider';
import OfferCarousel, { type OfferForCarousel } from '@/components/offer-carousel';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'grid' | 'list';
type SortOrder = 'default' | 'price-asc' | 'price-desc';
const PRODUCTS_PER_PAGE = 12;

function ShopContent() {
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();

  const categoriesQuery = searchParams.get('categories');
  const offerProductsQuery = searchParams.get('offer_products');

  const initialCategories = useMemo(() => (categoriesQuery ? categoriesQuery.split(',') : []), [categoriesQuery]);
  const initialProductIds = useMemo(() => (offerProductsQuery ? offerProductsQuery.split(',').map(Number) : []), [offerProductsQuery]);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<{name: string, subcategories: string[]}[]>([]);
  const [offers, setOffers] = useState<OfferForCarousel[]>([]);
  const [loading, setLoading] = useState(true);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  useEffect(() => {
    const savedViewMode = localStorage.getItem('shopViewMode') as ViewMode;
    const savedSortOrder = localStorage.getItem('shopSortOrder') as SortOrder;
    if (savedViewMode) setViewMode(savedViewMode);
    if (savedSortOrder) setSortOrder(savedSortOrder);
  }, []);
  
  useEffect(() => {
    localStorage.setItem('shopViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('shopSortOrder', sortOrder);
  }, [sortOrder]);

  const fetchAndProcessData = useCallback(async () => {
    setLoading(true);
    const [productsRes, categoriesRes, offersRes, allCategoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select(`*, product_categories(categories(name))`)
        .eq('status', 'active'),
      supabase.rpc('get_category_tree'),
      supabase
        .from('offers')
        .select('id, title, subtitle, image_url, category_ids, product_ids')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .limit(5),
      supabase.from('categories').select('id, name')
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
        rating: p.rating || 4.5,
      }));
      setAllProducts(fetchedProducts);
    }

    if (categoriesRes.data) {
      setDbCategories(categoriesRes.data);
    }

    if (offersRes.data && allCategoriesRes.data) {
        const offersWithCategoryNames = offersRes.data.map(offer => {
            const categoryNames = offer.category_ids?.map(id => (allCategoriesRes.data as any[]).find(c => c.id === id)?.name).filter(Boolean) as string[];
            return {
                id: offer.id,
                title: offer.title,
                subtitle: offer.subtitle,
                image_url: offer.image_url,
                product_ids: offer.product_ids,
                categoryNames,
            };
        });
        setOffers(offersWithCategoryNames);
    } else {
        if(offersRes.error) console.error("Shop page offer fetch error:", offersRes.error.message);
    }


    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  useEffect(() => {
    if (allProducts.length > 0) {
      if (initialProductIds.length > 0 || initialCategories.length > 0) {
          const tempProducts = allProducts.filter(p => {
              const matchesProductIds = initialProductIds.length > 0 && initialProductIds.includes(p.id);
              const productCats = (p as any).dbCategories || [p.category];
              const matchesCategories = initialCategories.length > 0 && productCats.some((pc: string) => initialCategories.includes(pc));
              return matchesProductIds || matchesCategories;
          });
          setFilteredProducts(tempProducts);
      } else {
          setFilteredProducts(allProducts);
      }
    }
  }, [allProducts, initialCategories, initialProductIds]);


  const handleFilterChange = useCallback((filters: {
    categories: string[];
    rating: number;
    priceRange: [number, number];
  }) => {
    let tempProducts = [...allProducts];

    if (filters.categories.length > 0) {
      tempProducts = tempProducts.filter(p => {
        const productCats = (p as any).dbCategories || [p.category];
        return productCats.some((pc: string) => filters.categories.includes(pc));
      });
    }

    if (filters.rating > 0) {
      tempProducts = tempProducts.filter(p => p.rating && p.rating >= filters.rating);
    }

    if (filters.priceRange) {
        tempProducts = tempProducts.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
    }
    
    setFilteredProducts(tempProducts);
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [allProducts]);

  useEffect(() => {
    let sorted = [...filteredProducts];
    if (sortOrder === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    }
    setDisplayProducts(sorted);
  }, [filteredProducts, sortOrder]);

  const loadMoreProducts = () => {
    setVisibleCount(prevCount => prevCount + PRODUCTS_PER_PAGE);
  };
  
  const currentProducts = displayProducts.slice(0, visibleCount);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...allProducts.map(p => p.price), 100)), [allProducts]);

  if (loading) {
    return (
      <>
        <div className="mb-8">
            <Skeleton className="h-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 mx-auto">
            <div className="hidden lg:block space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-[3/2] w-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
          <OfferCarousel offers={offers} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <div className="hidden lg:block">
              <FilterSidebar onFilterChange={handleFilterChange} initialCategories={initialCategories} allCategories={dbCategories} maxPrice={maxPrice} />
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
                              <FilterSidebar onFilterChange={handleFilterChange} initialCategories={initialCategories} allCategories={dbCategories} maxPrice={maxPrice} />
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

              {currentProducts.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-2">
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
                )
              ) : (
                <div className="text-center py-16 col-span-full">
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
    </>
  );
}

export default function ShopPageClient() {
  return (
    <main className="container py-8 mx-auto">
      <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Shop</h1>
          <p className="text-muted-foreground mt-2">Browse our collection of fresh products.</p>
      </div>
      <Suspense fallback={<div className="text-center">Loading products...</div>}>
        <ShopContent />
      </Suspense>
    </main>
  );
}

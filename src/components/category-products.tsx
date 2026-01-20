'use client';
import ProductCard from '@/components/product-details';
import { products } from '@/lib/data';
import { Button } from './ui/button';
import Link from 'next/link';

const categories = [...new Set(products.map(p => p.category))];

const CategorySection = ({ category }: { category: string }) => {
    const categoryProducts = products.filter(p => p.category === category).slice(0, 6);
    if (categoryProducts.length === 0) return null;
  
    return (
      <section className="py-8 px-4 md:px-8">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{category}</h2>
              <Button variant="link" asChild>
                  <Link href={`/shop?category=${category}`}>View All</Link>
              </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
      </section>
    );
}

export default function CategoryProducts() {
  return (
    <>
        {categories.map(category => (
            <CategorySection key={category} category={category} />
        ))}
    </>
  );
}

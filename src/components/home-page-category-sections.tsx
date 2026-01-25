'use client';
import ProductCard from '@/components/product-details';
import { Button } from './ui/button';
import Link from 'next/link';
import { Product } from '@/lib/data';
import LucideIcon from './lucide-icon';

export default function HomePageCategorySections({ sections }: { sections: any[] | null }) {
    if (!sections || sections.length === 0) {
        return null;
    }

    return <>
        {sections.map((section) => {
            if (!section.categories || !section.products || section.products.length === 0) {
                return null;
            }

            return (
                <section key={section.categories.id} className="py-8 px-4 md:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                           <LucideIcon name={section.categories.icon} className="h-6 w-6 text-primary" />
                           <span>{section.categories.name}</span>
                        </h2>
                        <Button variant="link" asChild>
                            <Link href={`/shop?category=${encodeURIComponent(section.categories.name)}`}>{`View All`}</Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1">
                      {section.products.map((product: Product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                </section>
            );
        })}
    </>;
}

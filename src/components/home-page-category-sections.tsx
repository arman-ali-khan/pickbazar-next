import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/product-details';
import { Button } from './ui/button';
import Link from 'next/link';
import { Product } from '@/lib/data';
import LucideIcon from './lucide-icon';

async function getProductsForCategory(categoryId: number) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('products')
        .select('*, product_categories!inner(category_id)')
        .eq('product_categories.category_id', categoryId)
        .limit(6);
    
    if (error) {
        console.error("Error fetching products for category:", error);
        return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.original_price,
      image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
      weight: p.unit || '',
      category: '', // This data is not available directly on the product row
      rating: 0, // This data is not available directly on the product row
    }));
}

export default async function HomePageCategorySections({ sections }: { sections: any[] | null }) {
    if (!sections || sections.length === 0) {
        return null;
    }

    const categorySections = await Promise.all(
        sections.map(async (section) => {
            if (!section.categories) return null;

            const products = await getProductsForCategory(section.categories.id);
            if (products.length === 0) return null;

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
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product as Product} />
                      ))}
                    </div>
                </section>
            );
        })
    );

    return <>{categorySections}</>;
}

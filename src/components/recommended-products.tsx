import ProductCard from '@/components/product-details';
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';

export default async function RecommendedProducts() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('view_count', { ascending: false, nullsFirst: false })
    .limit(12);

  const recommendedProducts: Product[] = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.original_price,
      image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
      weight: p.unit || '',
      category: '',
      rating: 0,
  }));

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-6">Recommended Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
    </section>
  );
}

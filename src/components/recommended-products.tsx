import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';
import RecommendedProductsClient from './recommended-products-client';

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

  return <RecommendedProductsClient products={recommendedProducts} />;
}

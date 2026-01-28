
import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';
import RecommendedProductsClient from './recommended-products-client';

export default async function RecommendedProducts() {
  const supabase = createClient();
  // Use the new RPC function to get recommended products
  const { data, error } = await supabase.rpc('get_recommended_products', { p_limit: 12 });

  if (error) {
    console.warn("Could not fetch recommended products:", error.message);
    return null;
  }

  const recommendedProducts: Product[] = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.original_price,
      image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
      weight: p.unit || '',
      category: '', // This info isn't returned by the RPC, and not needed for the card
      rating: 0, // This info isn't returned by the RPC, and not needed for the card
  }));

  if (recommendedProducts.length === 0) {
    return null;
  }

  return <RecommendedProductsClient products={recommendedProducts} />;
}

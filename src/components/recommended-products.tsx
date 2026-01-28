import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';
import RecommendedProductsClient from './recommended-products-client';

export default async function RecommendedProducts() {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_recommended_products', { p_limit: 12 });

  if (error && error.message) {
    // Error is handled gracefully by not showing the section.
  }

  const productsToShow: Product[] = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.original_price,
      image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
      weight: p.unit || '',
      category: '', // Not needed for the card
      rating: 0,   // Not needed for the card
  }));
  
  if (productsToShow.length === 0) {
    return null;
  }

  return <RecommendedProductsClient products={productsToShow} />;
}

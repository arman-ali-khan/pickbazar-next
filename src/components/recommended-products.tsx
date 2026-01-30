import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';
import RecommendedProductsClient from './recommended-products-client';

export default async function RecommendedProducts() {
  const supabase = createClient();
  
  // Fetch products with highest view_count as "recommended"
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('view_count', { ascending: false, nulls: 'last' })
    .limit(12);

  if (error) {
    console.error('Error fetching recommended products:', error);
    // Gracefully fail by not showing the section
    return null;
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

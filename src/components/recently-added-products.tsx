import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';
import RecentlyAddedProductsClient from './recently-added-products-client';

export default async function RecentlyAddedProducts() {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6);

  const recentProducts: Product[] = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.original_price,
      image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
      weight: p.unit || '',
      category: '',
      rating: 0,
  }));

  if (recentProducts.length === 0) {
    return null;
  }
  
  return <RecentlyAddedProductsClient products={recentProducts} />;
}

import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/data';
import RecommendedProductsClient from './recommended-products-client';

export default async function RecommendedProducts() {
  const supabase = createClient();
  let productsToShow: Product[] = [];
  
  // Try to get products from the recommendation algorithm first
  const { data: recommendedData } = await supabase.rpc('get_recommended_products', { p_limit: 12 });

  if (recommendedData && recommendedData.length > 0) {
    productsToShow = (recommendedData || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
        weight: p.unit || '',
        category: '', // This info isn't returned by the RPC, and not needed for the card
        rating: 0, // This info isn't returned by the RPC, and not needed for the card
    }));
  } else {
    // Fallback to most recent products if recommendation returns nothing
    const { data: recentData } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6);
    
    productsToShow = (recentData || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        image: { id: `prod-${p.id}`, imageUrl: p.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: p.name },
        weight: p.unit || '',
        category: '',
        rating: 0,
    }));
  }

  if (productsToShow.length === 0) {
    return null;
  }

  return <RecommendedProductsClient products={productsToShow} />;
}

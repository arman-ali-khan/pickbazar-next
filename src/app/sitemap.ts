import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const { data: settingsData } = await supabase.rpc('get_all_settings');
  const baseUrl = settingsData?.[0]?.canonical_url || 'https://example.com'; 

  const staticRoutes = [
    '', 
    '/shop', 
    '/offers', 
    '/contact', 
    '/about', 
    '/faq', 
    '/privacy-policy', 
    '/terms-and-conditions'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    priority: route === '' ? 1.0 : (route === '/shop' ? 0.9 : 0.7),
    changeFrequency: 'weekly' as const,
  }));

  const { data: products } = await supabase.from('products').select('id').eq('status', 'active');
  
  const productRoutes = products?.map(({ id }) => ({
    url: `${baseUrl}/products/${id}`,
    lastModified: new Date().toISOString(),
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  })) || [];

  return [...staticRoutes, ...productRoutes];
}


import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: settingsData } = await supabase.rpc('get_all_settings');
  const baseUrl = settingsData?.[0]?.canonical_url || 'http://localhost:9002';

  // Get all products
  const { data: products } = await supabase.from('products').select('id, updated_at').eq('status', 'active');

  const productUrls = products?.map(product => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(product.updated_at).toISOString(),
  })) ?? [];

  const staticRoutes = [
    '/',
    '/shop',
    '/offers',
    '/about',
    '/contact',
    '/faq',
    '/privacy-policy',
    '/terms-and-conditions'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  return [
    ...staticRoutes,
    ...productUrls
  ];
}

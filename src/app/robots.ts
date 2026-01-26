
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
 
export default async function robots(): Promise<MetadataRoute.Robots> {
  const supabase = createClient();
  const { data: settingsData } = await supabase.rpc('get_all_settings');
  const baseUrl = settingsData?.[0]?.canonical_url || 'http://localhost:9002';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/profile/', 
        '/checkout/', 
        '/auth/',
        '/api/',
        '/maintenance'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

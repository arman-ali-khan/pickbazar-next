import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_all_settings');
    const settings = data?.[0];
    const baseUrl = settings?.canonical_url || 'https://example.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/profile/', '/checkout/'],
            }
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

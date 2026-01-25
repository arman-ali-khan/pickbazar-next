
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ShopPageClient from '@/components/shop-page-client';

export default async function ShopPage() {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_all_settings');
    const settings = data?.[0];

    return (
        <div className="bg-background min-h-screen">
            <Header logoUrl={settings?.logo_url} siteTitle={settings?.site_title} />
            <ShopPageClient />
            <CartDrawer />
        </div>
    );
}

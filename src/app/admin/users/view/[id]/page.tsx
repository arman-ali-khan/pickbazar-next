
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ViewUserPageClient, { type UserProfile, type Address, type Order, type WishlistItem } from '@/components/admin/view-user-page-client';

export const dynamic = 'force-dynamic';

export default async function ViewUserPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const userId = params.id;

    if (!userId) {
        notFound();
    }

    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) {
        // This case should be covered by the admin layout, but it's good practice.
        notFound();
    }

    const [allUsersRes, addressesRes, ordersRes, wishlistRes] = await Promise.all([
        supabase.rpc('get_all_users'),
        supabase.from('addresses').select('*').eq('user_id', userId),
        supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('wishlist').select('products!inner(id, name, featured_image_url)').eq('user_id', userId)
    ]);
    
    const { data: allUsers, error: userError } = allUsersRes;
    const userArray = allUsers ? (allUsers as UserProfile[]).filter(u => u.id === userId) : [];

    if (userError || userArray.length === 0) {
        notFound();
    }
    const user = userArray[0];
    
    const addresses = (addressesRes.data || []) as Address[];
    const recentOrders = (ordersRes.data || []) as Order[];
    const wishlistItems = (wishlistRes.data || []).map((item: any) => item.products).filter(p => p !== null) as WishlistItem[];

    return (
        <ViewUserPageClient
            user={user}
            addresses={addresses}
            recentOrders={recentOrders}
            wishlist={wishlistItems}
        />
    )
}

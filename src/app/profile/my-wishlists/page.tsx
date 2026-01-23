'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import ProductCard from '@/components/product-details';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import type { Product } from '@/lib/data';

export default function MyWishlistPage() {
    const { supabase, user } = useSupabase();
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user) return;
            setLoading(true);
            
            const { data, error } = await supabase
                .from('wishlist')
                .select(`
                    products (
                        id,
                        name,
                        price,
                        original_price,
                        featured_image_url,
                        unit
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching wishlist", error);
            } else if (data) {
                const products = data
                    .filter((item: any) => item.products) // Filter out wishlisted items that might have been deleted
                    .map((item: any) => ({
                        id: item.products.id,
                        name: item.products.name,
                        price: item.products.price,
                        originalPrice: item.products.original_price,
                        image: { id: `prod-${item.products.id}`, imageUrl: item.products.featured_image_url || 'https://picsum.photos/seed/placeholder/200', imageHint: 'product', description: item.products.name },
                        weight: item.products.unit || '',
                        category: '', // Not needed for card display
                        rating: 0, // Not available here
                    }));
                setWishlistItems(products);
            }
            setLoading(false);
        };

        fetchWishlist();
    }, [user, supabase]);

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>My Wishlist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p>Loading your wishlist...</p>
                        ) : wishlistItems.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wishlistItems.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Your wishlist is empty.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

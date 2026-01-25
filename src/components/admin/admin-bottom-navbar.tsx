
'use client';

import Link from 'next/link';
import { LayoutGrid, ShoppingCart, Star, PlusCircle, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/lib/supabase/provider';
import { useEffect, useState } from 'react';

const AdminNavItem = ({ href, icon: Icon, label, count }: { href: string; icon: React.ElementType; label: string; count?: number }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} className={cn("relative flex flex-col items-center justify-center h-full text-xs gap-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-primary")}>
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                 <span className="absolute top-1 right-3 text-xs bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
};


export default function AdminBottomNavbar() {
    const { supabase } = useSupabase();
    const [counts, setCounts] = useState({
      orders: 0,
      reviews: 0,
      messages: 0,
    });
  
    useEffect(() => {
        const fetchCounts = async () => {
            const [
                ordersRes,
                reviewsRes,
                messagesRes,
            ] = await Promise.all([
                supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
                supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
                supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'unread'),
            ]);

            setCounts({
                orders: ordersRes.count ?? 0,
                reviews: reviewsRes.count ?? 0,
                messages: messagesRes.count ?? 0,
            });
        };

        fetchCounts();

        const channel = supabase.channel('admin-bottom-nav-counts')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                fetchCounts();
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);


    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t md:hidden">
            <div className="grid h-full grid-cols-5 mx-auto">
                <AdminNavItem href="/admin/orders" icon={ShoppingCart} label="Orders" count={counts.orders} />
                <AdminNavItem href="/admin/reviews" icon={Star} label="Reviews" count={counts.reviews} />
                <Link href="/admin/products/create" className="inline-flex flex-col items-center justify-center p-2 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <div className="w-14 h-14 -mt-8 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
                        <PlusCircle className="h-7 w-7" />
                    </div>
                    <span className="sr-only">Add Product</span>
                </Link>
                <AdminNavItem href="/admin/messages" icon={MessageSquare} label="Messages" count={counts.messages} />
                <AdminNavItem href="/admin" icon={LayoutGrid} label="Dashboard" />
            </div>
        </div>
    );
}

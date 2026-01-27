
'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { UserNotification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bell, ShoppingCart, Percent, Star, Shield, User, HelpCircle } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getNotificationIcon = (type: UserNotification['type']) => {
    switch (type) {
        case 'order_shipped':
        case 'order_update':
            return <ShoppingCart className="h-5 w-5 text-primary" />;
        case 'promotion':
            return <Percent className="h-5 w-5 text-green-500" />;
        case 'review_request':
            return <Star className="h-5 w-5 text-yellow-500" />;
        case 'security':
            return <Shield className="h-5 w-5 text-red-500" />;
        case 'question_answered':
            return <HelpCircle className="h-5 w-5 text-blue-500" />;
        case 'role_update':
            return <User className="h-5 w-5 text-purple-500" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
}

export default function NotificationsPage() {
    const { supabase, user } = useSupabase();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const setPageTitle = async () => {
            const { data } = await supabase.rpc('get_all_settings');
            const siteTitle = data?.[0]?.site_title || 'Karwanbazar';
            document.title = `Notifications | ${siteTitle}`;
        }
        setPageTitle();
    }, [supabase]);

    const getNotifications = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch notifications.' });
        } else {
            setNotifications(data as UserNotification[]);
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        getNotifications();
    }, [getNotifications]);

    const markAsRead = async (id: number) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update notification.' });
        } else {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
    };
    
    const markAllAsRead = async () => {
        if (!user) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not mark all as read.' });
        } else {
            getNotifications();
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="bg-muted/20 min-h-screen">
            <Header />
            <main className="container py-12">
                <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                    <div className="hidden md:block">
                        <ProfileSidebar />
                    </div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>You have {unreadCount} unread messages.</CardDescription>
                            </div>
                            <Button variant="link" onClick={markAllAsRead} disabled={unreadCount === 0}>
                                Mark all as read
                            </Button>
                        </CardHeader>
                        <CardContent>
                             {loading ? (
                                <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                                        <Skeleton className="h-5 w-5 mt-1" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-5 w-1/2" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-1/3 mt-1" />
                                        </div>
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                ))}
                                </div>
                             ) : (
                                <div className="space-y-4">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                                                !notification.is_read ? "bg-primary/10 border-primary/20" : "bg-background"
                                            )}
                                        >
                                            <div className="mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <Link href={notification.link || '#'} className="hover:underline">
                                                    <p className={cn("font-semibold", !notification.is_read && "font-bold")}>{notification.title}</p>
                                                </Link>
                                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                                    Mark as read
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <div className="text-center py-12">
                                            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                            <p className="mt-4 text-muted-foreground">You have no notifications.</p>
                                        </div>
                                    )}
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <CartDrawer />
        </div>
    );
}

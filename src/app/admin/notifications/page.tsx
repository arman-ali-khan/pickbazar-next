
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bell, ShoppingCart, Star, CheckCheck, MailOpen } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface Notification {
    id: number;
    title: string;
    message: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
    type: string | null;
}

const getNotificationIcon = (type: string | null) => {
    switch (type) {
        case 'new_order':
            return <ShoppingCart className="h-5 w-5 text-primary" />;
        case 'new_review':
            return <Star className="h-5 w-5 text-yellow-500" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
};

const NOTIFICATIONS_PER_PAGE = 10;

export default function AdminNotificationsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, startTransition] = useTransition();
    const [currentPage, setCurrentPage] = useState(1);

    const getNotifications = useCallback(async () => {
        setLoading(true);
<<<<<<< HEAD
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .filter('user_id', 'is', null)
            .order('created_at', { ascending: false });

=======
        const { data, error } = await supabase.rpc('get_admin_notifications');
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching notifications', description: error.message });
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getNotifications();
    }, [getNotifications]);

    const handleMarkAsRead = async (id: number) => {
        startTransition(async () => {
            const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not mark notification as read.' });
            } else {
                getNotifications();
            }
        });
    };

    const handleMarkAllAsRead = async () => {
        startTransition(async () => {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;
            
            const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
            if (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not mark all notifications as read.' });
            } else {
                getNotifications();
            }
        });
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const totalPages = Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE);
    const paginatedNotifications = notifications.slice(
        (currentPage - 1) * NOTIFICATIONS_PER_PAGE,
        currentPage * NOTIFICATIONS_PER_PAGE
    );

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            You have {unreadCount} unread notifications.
                        </CardDescription>
                    </div>
                     <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isUpdating || unreadCount === 0}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark All as Read
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                                    <Skeleton className="h-5 w-5 mt-1" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-5 w-1/2" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-1/3 mt-1" />
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    ) : 
                     notifications.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Bell className="mx-auto h-12 w-12" />
                            <p className="mt-4">You're all caught up!</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                            {paginatedNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                                        !notification.is_read && "bg-primary/5 border-primary/20"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("font-semibold", !notification.is_read && "font-bold")}>{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }} disabled={isUpdating}>
                                            <MailOpen className="h-4 w-4" />
                                            <span className="sr-only">Mark as read</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                     )}
                </CardContent>
                {totalPages > 1 && (
                     <CardFooter>
                        <div className="flex items-center justify-between w-full">
                            <div className="text-xs text-muted-foreground">
                                Showing <strong>{Math.min((currentPage - 1) * NOTIFICATIONS_PER_PAGE + 1, notifications.length)}</strong> to <strong>{Math.min(currentPage * NOTIFICATIONS_PER_PAGE, notifications.length)}</strong> of <strong>{notifications.length}</strong> notifications
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </main>
    );
}

'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { userNotifications as initialNotifications } from '@/lib/data';
import type { UserNotification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bell, ShoppingCart, Percent, Star, Shield } from 'lucide-react';

const getNotificationIcon = (type: UserNotification['type']) => {
    switch (type) {
        case 'order_shipped':
            return <ShoppingCart className="h-5 w-5 text-primary" />;
        case 'promotion':
            return <Percent className="h-5 w-5 text-green-500" />;
        case 'review_request':
            return <Star className="h-5 w-5 text-yellow-500" />;
        case 'security':
            return <Shield className="h-5 w-5 text-red-500" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(initialNotifications);

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };
    
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                            <div className="space-y-4">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                                            notification.isRead ? "bg-background" : "bg-primary/5 border-primary/20"
                                        )}
                                    >
                                        <div className="mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <Link href={notification.link} className="hover:underline">
                                                <p className="font-semibold">{notification.title}</p>
                                            </Link>
                                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                                            <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
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
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
}

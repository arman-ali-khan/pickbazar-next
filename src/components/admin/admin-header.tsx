
'use client';
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu, Search, CircleUser, Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { formatDistanceToNow } from 'date-fns';


interface Notification {
    id: number;
    title: string;
    message: string | null;
    link: string | null;
    created_at: string;
}

export default function AdminHeader() {
    const { toggleSidebar } = useSidebar();
    const { supabase } = useSupabase();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase.rpc('get_admin_notifications');

            if (error) {
                console.error("Error fetching notifications for header:", error);
            } else if (data) {
                const unreadNotifications = data.filter((n: any) => !n.is_read);
                setNotifications(unreadNotifications.slice(0, 5));
                setUnreadCount(unreadNotifications.length);
            }
        };

        fetchNotifications();
        
        const channel = supabase.channel('realtime-notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' },
            (payload) => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [supabase]);

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
            <div className="w-full flex-1">
              <form>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full appearance-none bg-muted pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  />
                </div>
              </form>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <DropdownMenuItem key={n.id} asChild className="cursor-pointer">
                           <Link href={n.link || '/admin/notifications'}>
                             <div className="flex flex-col">
                                <p className="font-semibold text-sm">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                                <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                </p>
                             </div>
                           </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/admin/notifications" className="flex items-center justify-center">
                        See all notifications
                    </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/seed/admin/40" alt="Admin" data-ai-hint="person face" />
                        <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/admin/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}

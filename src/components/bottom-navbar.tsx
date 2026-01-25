
'use client';

import Link from 'next/link';
import { Home, Menu, User, ShoppingCart, ChevronDown, Settings, Leaf, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { openCart, selectTotalItems } from '@/lib/redux/slices/cartSlice';
import ProfileSidebar from './profile-sidebar';
import { useSupabase } from '@/lib/supabase/provider';
import { useState, useEffect, useCallback } from 'react';
import LucideIcon from './lucide-icon';
import type { UserNotification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';

const LoginDialog = dynamic(() => import('@/components/login-dialog').then(mod => mod.LoginDialog));

const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
    <Link
      href={href}
      className="transition-colors hover:text-primary text-sm font-medium text-gray-600 block py-2"
    >
      {children}
    </Link>
  );

interface DbCategory {
    id: number;
    name: string;
    parent_id: number | null;
    icon: string | null;
}

interface HierarchicalCategory extends DbCategory {
    sub: DbCategory[];
}

const navItems = [{ name: 'Shop', href: '/shop' }, { name: 'Offers', href: '/offers' }, { name: 'Contact', href: '/contact' }];

function PagesDrawer() {
    const { user, supabase } = useSupabase();
    const [categories, setCategories] = useState<HierarchicalCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, parent_id, icon')
                .order('name');
            
            if (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            } else if (data) {
                const topLevel: HierarchicalCategory[] = data
                    .filter(c => c.parent_id === null)
                    .map(c => ({...c, sub: []}));
                
                const children: DbCategory[] = data.filter(c => c.parent_id !== null);

                topLevel.forEach(parent => {
                    parent.sub = children
                        .filter(child => child.parent_id === parent.id);
                });
                setCategories(topLevel);
            }
            setLoading(false);
        };
        fetchCategories();
    }, [supabase]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2">
                    <Menu className="h-6 w-6" />
                    <span className="text-xs">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
                <SheetTitle className="sr-only">Pages Menu</SheetTitle>
                <div className="p-6">
                    <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                      <Leaf className="h-7 w-7 text-primary" />
                      <h1 className="text-2xl font-bold text-gray-800">Pickbazar</h1>
                    </Link>
                  <div className="flex flex-col space-y-4">
                     <Accordion type="multiple" className="w-full -my-2">
                        <AccordionItem value="categories" className="border-b-0">
                            <AccordionTrigger className="py-2 text-sm font-medium text-gray-600 hover:text-primary hover:no-underline flex justify-between w-full">
                                Categories
                            </AccordionTrigger>
                            <AccordionContent>
                                {loading ? <p className="text-sm text-muted-foreground text-center">Loading categories...</p> : (
                                    <Accordion type="multiple" className="ml-4">
                                    {categories.map((category) => (
                                        <AccordionItem value={category.name} key={category.id} className="border-b-0">
                                            <AccordionTrigger className="py-2 hover:no-underline">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <LucideIcon name={category.icon} className="h-4 w-4" />
                                                    <span>{category.name}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="pl-4 flex flex-col items-start">
                                                {category.sub.map((subCategory) => (
                                                    <Link href={`/shop?category=${encodeURIComponent(subCategory.name)}`} key={subCategory.id} className="py-2 text-sm text-muted-foreground hover:text-primary">{subCategory.name}</Link>
                                                ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                    </Accordion>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                    {navItems.map((item) => (
                      <NavItem key={item.name} href={item.href}>{item.name}</NavItem>
                    ))}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary text-sm font-medium text-gray-600">
                            Pages
                            <ChevronDown className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild><Link href="/about">About Us</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/contact">Contact Us</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/faq">FAQ</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/privacy-policy">Privacy Policy</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/terms-and-conditions">Terms & Conditions</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="mt-4 flex flex-col gap-2">
                        {!user && (
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button>Join</Button>
                              </DialogTrigger>
                              <LoginDialog />
                          </Dialog>
                        )}
                    </div>
                  </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default function BottomNavbar() {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const totalItems = useAppSelector(selectTotalItems);
    const { user, supabase } = useSupabase();
    const router = useRouter();
    const isProfilePage = pathname.startsWith('/profile');
    
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getNotifications = useCallback(async () => {
      if (!user) {
          setNotifications([]);
          return;
      }
      const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notifications for bottom navbar:", error);
      }
      setNotifications((data as UserNotification[]) || []);
    }, [user, supabase]);

    useEffect(() => {
        if (user) {
            getNotifications();
            const channel = supabase.channel(`mobile-notifications:${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    getNotifications();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, supabase, getNotifications]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.is_read).length);
    }, [notifications]);

    const markAsRead = async (id: number) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleProfileClick = () => {
        if (user) {
            router.push('/profile');
        }
    }
    
    if (pathname.startsWith('/admin')) {
        return null;
    }

    const renderProfileButton = () => {
        if (user) {
            if (isProfilePage) {
                return (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2">
                                <Settings className="h-6 w-6" />
                                <span className="text-xs">Account</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-80 overflow-y-auto">
                            <SheetTitle className="sr-only">Profile Menu</SheetTitle>
                            <div className="p-6">
                                <ProfileSidebar />
                            </div>
                        </SheetContent>
                    </Sheet>
                );
            } else {
                return (
                    <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2" onClick={handleProfileClick}>
                        <User className="h-6 w-6" />
                        <span className="text-xs">Profile</span>
                    </Button>
                );
            }
        } else {
            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2">
                            <User className="h-6 w-6" />
                            <span className="text-xs">Profile</span>
                        </Button>
                    </DialogTrigger>
                    <LoginDialog />
                </Dialog>
            );
        }
    };

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t md:hidden">
            <div className="grid h-full grid-cols-5 mx-auto">
                <PagesDrawer />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative flex flex-col h-full rounded-none text-muted-foreground p-2">
                            <Bell className="h-6 w-6" />
                            <span className="text-xs">Alerts</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-3.5 text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="center" className="w-80 mb-2">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length > 0 ? (
                            notifications.slice(0, 4).map((notification) => (
                                 <DropdownMenuItem key={notification.id} onSelect={() => markAsRead(notification.id)} asChild className="flex flex-col items-start gap-1 p-2 cursor-pointer">
                                    <Link href={notification.link || '#'}>
                                        <p className="font-semibold text-sm">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground whitespace-normal">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        ) : (
                             <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
                        )}
                         <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile/notifications" className="flex items-center justify-center text-sm p-2">See all notifications</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/" className="inline-flex flex-col items-center justify-center p-2 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <div className="w-14 h-14 -mt-8 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
                        <Home className="h-7 w-7" />
                    </div>
                    <span className="sr-only">Home</span>
                </Link>

                {renderProfileButton()}

                <Button id="cart-icon-mobile" variant="ghost" className="relative flex flex-col h-full rounded-none text-muted-foreground p-2" onClick={() => dispatch(openCart())}>
                    <ShoppingCart className="h-6 w-6" />
                    <span className="text-xs">Cart</span>
                    {totalItems > 0 && (
                        <span className="absolute top-1 right-3.5 text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {totalItems}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}

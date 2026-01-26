
'use client';

import Link from 'next/link';
import { ChevronDown, Menu, Search, Leaf, X, User, Bell, ShoppingBag, Heart, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
<<<<<<< HEAD
=======
import { LoginDialog } from '@/components/login-dialog';
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setSearchOpen } from '@/lib/redux/slices/uiSlice';
import LucideIcon from './lucide-icon';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { UserNotification } from '@/lib/data';
<<<<<<< HEAD
import dynamic from 'next/dynamic';

const LoginDialog = dynamic(() => import('@/components/login-dialog').then(mod => mod.LoginDialog));
const PromoDialog = dynamic(() => import('@/components/promo-dialog'), { ssr: false });
=======
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b

const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
  <Link
    href={href}
    className="transition-colors hover:text-primary text-sm font-medium text-gray-600"
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

const CategoriesNav = () => {
    const isMobile = useIsMobile();
    const { supabase } = useSupabase();
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

    const categoriesContent = (
      <Accordion type="single" collapsible defaultValue={categories.length > 0 ? categories[0].name : undefined} className="w-full">
        {categories.map((category) => (
          <AccordionItem value={category.name} key={category.id} className="border-b last:border-b-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <LucideIcon name={category.icon} className="h-5 w-5" />
                <span>{category.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-8 flex flex-col items-start">
                {category.sub.map((subCategory) => (
                  <Link href={`/shop?category=${encodeURIComponent(subCategory.name)}`} key={subCategory.id} className="py-1.5 text-sm text-muted-foreground hover:text-primary w-full text-left">{subCategory.name}</Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );

    if (loading && !isMobile) {
        return (
             <Button variant="outline" className="gap-2" disabled>
                <Menu className="h-5 w-5" />
                Categories
            </Button>
        )
    }

    if (isMobile) {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Categories</SheetTitle>
                    </SheetHeader>
                    <div className="p-2">
                        {loading ? <p className="text-center text-sm text-muted-foreground">Loading categories...</p> : categoriesContent}
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Menu className="h-5 w-5" />
                    Categories
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-2 max-h-[calc(80vh)] overflow-y-auto">
                {loading ? <p className="text-center text-sm text-muted-foreground">Loading categories...</p> : categoriesContent}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

interface HeaderProps {
  logoUrl?: string | null;
  siteTitle?: string | null;
}

<<<<<<< HEAD
export default function Header({ logoUrl, siteTitle }: HeaderProps) {
=======
export default function Header({ logoUrl: propLogoUrl, siteTitle: propSiteTitle }: HeaderProps) {
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<{ avatar_url: string | null; role: string | null; } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const dispatch = useAppDispatch();
  const isSearchOpen = useAppSelector(state => state.ui.isSearchOpen);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, supabase } = useSupabase();
  const { toast } = useToast();
  const navItems = [{ name: 'Shop', href: '/shop' }, { name: 'Offers', href: '/offers' }];

<<<<<<< HEAD
=======
  const [logoUrl, setLogoUrl] = useState(propLogoUrl);
  const [siteTitle, setSiteTitle] = useState(propSiteTitle);

    useEffect(() => {
        setLogoUrl(propLogoUrl);
    }, [propLogoUrl]);

    useEffect(() => {
        setSiteTitle(propSiteTitle);
    }, [propSiteTitle]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.rpc('get_all_settings');
      if (data?.[0]) {
        if (propLogoUrl === undefined) {
          setLogoUrl(data[0].logo_url);
        }
        if (propSiteTitle === undefined) {
          setSiteTitle(data[0].site_title);
        }
      }
    };

    if (propLogoUrl === undefined || propSiteTitle === undefined) {
      fetchSettings();
    }
  }, [propLogoUrl, propSiteTitle, supabase]);


>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, role')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
        }
      };
      fetchProfile();

      const profileChannel = supabase
        .channel(`profile-changes-for-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            setProfile(payload.new as any);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user, supabase]);

  const getNotifications = useCallback(async () => {
      if (!user) return;

      const { count, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

      if (countError) {
          console.error("Error fetching notification count:", countError);
      } else {
          setUnreadCount(count ?? 0);
      }

      const { data, error: dataError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
      
      if (dataError) {
          console.error("Error fetching notifications:", dataError);
      } else {
          setNotifications(data || []);
      }
  }, [user, supabase]);

  useEffect(() => {
      if (user) {
          getNotifications();
          const channel = supabase.channel(`header-notifications:${user.id}`)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
              (payload) => {
                  getNotifications();
              })
              .subscribe();

          return () => {
              supabase.removeChannel(channel);
          };
      } else {
          setNotifications([]);
          setUnreadCount(0);
      }
  }, [user, supabase, getNotifications]);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
      router.refresh();
       toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      dispatch(setSearchOpen(false));
      setSearchTerm('');
    }
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const allowedAdminRoles = ['admin', 'manager', 'super-admin'];
  const isAdmin = profile?.role && allowedAdminRoles.includes(profile.role);

  if (!isMounted) {
    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b transition-all duration-300",
            "bg-white border-gray-200 shadow-sm"
        )}>
            <div className="container flex h-20 items-center justify-between px-2 mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 md:hidden" />
                    <div className="hidden md:block">
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="hidden items-center space-x-6 text-sm md:flex">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                </div>
                <div className="flex items-center justify-end space-x-2">
                    <div className="hidden md:flex items-center space-x-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="md:hidden flex items-center gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </div>
            </div>
        </header>
    );
  }

  return (
<<<<<<< HEAD
    <>
      <PromoDialog />
      <header className={cn(
          "sticky top-0 z-50 w-full border-b transition-all duration-300",
          isScrolled ? 'bg-white border-gray-200 shadow-sm' : 'bg-transparent border-transparent'
      )}>
        <div className="container flex h-auto py-2 items-center justify-between mx-auto px-2">
          {isSearchOpen ? (
            <div className="flex w-full items-center gap-2">
              <form onSubmit={handleSearch} className="flex w-full items-center rounded-lg border-2 border-primary bg-white">
                  <div className="relative flex-grow">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search your products from here"
                        className="h-12 w-full border-0 bg-transparent pl-12 pr-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 flex-shrink-0 rounded-l-none rounded-r-md text-muted-foreground hover:bg-primary/10"
                      onClick={() => dispatch(setSearchOpen(false))}
                      type="button"
                  >
                      <X className="h-5 w-5" />
                  </Button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                  <div className="md:hidden">
                      <CategoriesNav />
                  </div>
                  <div className={cn(
                      "hidden md:block transition-opacity duration-300",
                      isScrolled ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}>
                      <CategoriesNav />
                  </div>
                <Link href="/" className="flex items-center gap-2">
                  {logoUrl ? (
                      <Image src={logoUrl} alt={siteTitle || 'Logo'} width={32} height={32} className="h-8 w-auto" />
                  ) : (
                      <Leaf className="h-7 w-7 text-primary" />
                  )}
                  <h1 className="text-2xl font-bold text-gray-800">{siteTitle || 'PickBazar'}</h1>
                </Link>
              </div>

              <nav className="hidden items-center space-x-6 text-sm md:flex">
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
              </nav>

              <div className="flex items-center justify-end space-x-2">
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => dispatch(setSearchOpen(true))}>
                      <Search className="h-5 w-5" />
                  </Button>
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <DropdownMenuItem key={n.id} asChild className="cursor-pointer">
                              <Link href={n.link || '/profile/notifications'}>
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
                          <p className="p-2 text-center text-sm text-muted-foreground">No new notifications</p>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/profile/notifications" className="flex items-center justify-center">
                            See all notifications
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar>
                            <AvatarImage src={userAvatar || 'https://picsum.photos/seed/profile/200'} alt={userName || 'User'} />
                            <AvatarFallback>{userName ? userName[0].toUpperCase() : user.email?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile/my-orders">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            <span>My Orders</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile/my-wishlists">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>My Wishlist</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile/notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Notifications</span>
                            {unreadCount > 0 && <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />}
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                              <Link href="/admin">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Admin Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Join</Button>
                        </DialogTrigger>
                        <LoginDialog />
                      </Dialog>
                  )}
                </div>
                <div className="md:hidden flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => dispatch(setSearchOpen(true))}>
                      <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    </>
=======
    <header className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        isScrolled ? 'bg-white border-gray-200 shadow-sm' : 'bg-transparent border-transparent'
    )}>
      <div className="container flex h-auto py-2 items-center justify-between mx-auto px-2">
        {isSearchOpen ? (
           <div className="flex w-full items-center gap-2">
            <form onSubmit={handleSearch} className="flex w-full items-center rounded-lg border-2 border-primary bg-white">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search your products from here"
                      className="h-12 w-full border-0 bg-transparent pl-12 pr-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 rounded-l-none rounded-r-md text-muted-foreground hover:bg-primary/10"
                    onClick={() => dispatch(setSearchOpen(false))}
                    type="button"
                >
                    <X className="h-5 w-5" />
                </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
                <div className="md:hidden">
                    <CategoriesNav />
                </div>
                <div className={cn(
                    "hidden md:block transition-opacity duration-300",
                    isScrolled ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <CategoriesNav />
                </div>
              <Link href="/" className="flex items-center gap-2">
                {logoUrl ? (
                    <Image src={logoUrl} alt={siteTitle || 'Logo'} width={32} height={32} className="h-8 w-auto" />
                ) : (
                    <Leaf className="h-7 w-7 text-primary" />
                )}
                <h1 className="text-2xl font-bold text-gray-800">{siteTitle || 'PickBazar'}</h1>
              </Link>
            </div>

            <nav className="hidden items-center space-x-6 text-sm md:flex">
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
            </nav>

            <div className="flex items-center justify-end space-x-2">
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => dispatch(setSearchOpen(true))}>
                    <Search className="h-5 w-5" />
                </Button>
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <DropdownMenuItem key={n.id} asChild className="cursor-pointer">
                            <Link href={n.link || '/profile/notifications'}>
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
                        <p className="p-2 text-center text-sm text-muted-foreground">No new notifications</p>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile/notifications" className="flex items-center justify-center">
                          See all notifications
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {user ? (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                          <AvatarImage src={userAvatar || 'https://picsum.photos/seed/profile/200'} alt={userName || 'User'} />
                          <AvatarFallback>{userName ? userName[0].toUpperCase() : user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                        <Link href="/profile/my-orders">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile/my-wishlists">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>My Wishlist</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile/notifications">
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Notifications</span>
                          {unreadCount > 0 && <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />}
                        </Link>
                      </DropdownMenuItem>
                       {isAdmin && (
                         <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                       )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button>Join</Button>
                      </DialogTrigger>
                      <LoginDialog />
                    </Dialog>
                )}
              </div>
              <div className="md:hidden flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => dispatch(setSearchOpen(true))}>
                    <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
  );
}

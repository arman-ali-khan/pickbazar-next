
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarHeader,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Box,
  ShoppingCart,
  Tag,
  RefreshCcw,
  Banknote,
  Users,
  MessageSquare,
  Star,
  HelpCircle,
  Gift,
  Settings,
  LogOut,
  ChevronLeft,
  Leaf,
  ChevronDown,
  LayoutTemplate,
  Files,
  Bell,
  Megaphone
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import React, { Suspense, useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useSupabase } from '@/lib/supabase/provider';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/admin', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications', countKey: 'notifications' },
  { href: '/admin/products', icon: Box, label: 'Products', countKey: 'products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', countKey: 'orders' },
  { href: '/admin/categories', icon: LayoutGrid, label: 'Categories' },
  { href: '/admin/tags', icon: Tag, label: 'Tags' },
  { href: '/admin/home-sections', icon: LayoutTemplate, label: 'Home Sections' },
  { href: '/admin/refunds', icon: RefreshCcw, label: 'Refunds', countKey: 'refunds' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/reviews', icon: Star, label: 'Reviews', countKey: 'reviews' },
  { href: '/admin/questions', icon: HelpCircle, label: 'Questions', countKey: 'questions' },
  { href: '/admin/offers', icon: Gift, label: 'Offers' },
  { href: '/admin/promos', icon: Megaphone, label: 'Promos' },
  { href: '/admin/messages', icon: MessageSquare, label: 'Messages', countKey: 'messages' },
  { href: '/admin/pages', icon: Files, label: 'Page Manager' },
];

const settingsNavItems = [
    { href: '/admin/settings', label: 'General', tab: 'general' },
    { href: '/admin/settings?tab=seo', label: 'SEO', tab: 'seo' },
    { href: '/admin/settings?tab=payments', label: 'Payments', tab: 'payments' },
    { href: '/admin/settings?tab=shipping', label: 'Shipping', tab: 'shipping' },
    { href: '/admin/settings?tab=maintenance', label: 'Maintenance', tab: 'maintenance' },
    { href: '/admin/settings?tab=promo', label: 'Promotions', tab: 'promo' },
    { href: '/admin/settings?tab=social', label: 'Social', tab: 'social' },
];

const SidebarNavLink = ({ href, icon: Icon, label, count }: { href: string; icon: React.ElementType; label: string; count?: number; }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href) && (href !== '/admin' || pathname === '/admin');
    const { state } = useSidebar();

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} className="w-full justify-start">
                <Link href={href}>
                    <Icon className="h-5 w-5" />
                    <span className="truncate flex-1">{label}</span>
                    {state === 'expanded' && count !== undefined && count > 0 && (
                        <Badge variant={'destructive'}>{count}</Badge>
                    )}
                </Link>
            </SidebarMenuButton>
            {state === 'collapsed' && count !== undefined && count > 0 && (
                <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-[10px] leading-none rounded-full">{count > 9 ? '9+' : count}</Badge>
            )}
        </SidebarMenuItem>
    );
};

const SettingsAccordion = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'general';
    const isSettingsPage = pathname.startsWith('/admin/settings');
    const { state } = useSidebar();

    if (state === 'collapsed') {
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 p-2 justify-center w-full",
                                isSettingsPage && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            )}
                        >
                            <Settings className="h-5 w-5 shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                        {settingsNavItems.map(item => {
                            const isActive = isSettingsPage && currentTab === item.tab;
                            return (
                                <DropdownMenuItem key={item.href} asChild className={cn(isActive && 'bg-accent')}>
                                    <Link href={item.href}>
                                        {item.label}
                                    </Link>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        )
    }
    
    return (
        <SidebarMenuItem>
            <Accordion type="single" collapsible defaultValue={isSettingsPage ? "settings" : ""}>
                <AccordionItem value="settings" className="border-b-0">
                    <AccordionTrigger
                        className={cn(
                            "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                            "h-8 justify-start hover:no-underline",
                            isSettingsPage && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        )}
                    >
                       <Settings className="h-5 w-5 shrink-0" />
                       <span className="truncate flex-1 text-left">Settings</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:-rotate-180" />
                    </AccordionTrigger>
                    <AccordionContent className="pt-1">
                        <SidebarMenu className="pl-6">
                            {settingsNavItems.map(item => {
                                const isActive = isSettingsPage && currentTab === item.tab;
                                return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={isActive} size="sm" className="w-full justify-start font-normal">
                                        <Link href={item.href}>
                                            {item.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )})}
                        </SidebarMenu>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </SidebarMenuItem>
    )
}

interface AdminSidebarProps {
  logoUrl?: string | null;
  siteTitle?: string | null;
}

export default function AdminSidebar({ logoUrl, siteTitle }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { supabase, user } = useSupabase();
  const [counts, setCounts] = useState({
      notifications: 0,
      products: 0,
      orders: 0,
      refunds: 0,
      reviews: 0,
      questions: 0,
      messages: 0,
  });
  const [profile, setProfile] = useState<{ full_name: string | null, avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
        const fetchProfile = async () => {
            const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
            if (data) {
                setProfile(data);
            }
        };
        fetchProfile();
    }
}, [user, supabase]);

  useEffect(() => {
      const fetchCounts = async () => {
          const [
              notificationsRes,
              lowStockRes,
              ordersRes,
              refundsRes,
              reviewsRes,
              questionsRes,
              messagesRes,
          ] = await Promise.all([
              supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false).filter('user_id', 'is', null),
              supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock', 10),
              supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
              supabase.from('refunds').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
              supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
              supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
              supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'unread'),
          ]);

          setCounts({
              notifications: notificationsRes.count ?? 0,
              products: lowStockRes.count ?? 0,
              orders: ordersRes.count ?? 0,
              refunds: refundsRes.count ?? 0,
              reviews: reviewsRes.count ?? 0,
              questions: questionsRes.count ?? 0,
              messages: messagesRes.count ?? 0,
          });
      };

      fetchCounts();

      const channel = supabase.channel('admin-sidebar-counts')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
              fetchCounts();
          })
          .subscribe();
      
      return () => {
          supabase.removeChannel(channel);
      };
  }, [supabase]);
  
  const userName = profile?.full_name || user?.user_metadata?.full_name || 'Admin Name';
  const userEmail = user?.email || 'admin@pickbazar.com';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <Sidebar collapsible="icon" className="border-r bg-card hidden md:flex">
       <SidebarHeader className={cn("flex items-center justify-between  p-4", state === 'expanded' ? 'flex-row-reverse' : '')}>
        <div className={cn("flex items-center gap-2 overflow-hidden transition-all duration-300", state === 'expanded' ? 'w-auto' : 'w-0')}>
            {logoUrl ? (
                <Image src={logoUrl} alt={siteTitle || 'Logo'} width={28} height={28} className="h-7 w-auto"/>
            ) : (
                <Leaf className="h-6 w-6 text-primary" />
            )}
            <Link href="/" className="font-bold text-lg">{siteTitle || 'Pickbazar'}</Link>
        </div>
        <SidebarTrigger className="hidden md:flex">
            <ChevronLeft />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
            {navItems.map(item => (
              'countKey' in item ? (
                 <SidebarNavLink 
                    key={item.href} 
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    count={counts[item.countKey as keyof typeof counts]}
                />
              ) : (
                <SidebarNavLink 
                    key={item.href} 
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                />
              )
            ))}
            <Suspense fallback={null}>
              <SettingsAccordion />
            </Suspense>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className={cn("flex items-center gap-3 transition-all duration-300", state === 'collapsed' ? 'justify-center' : '')}>
             <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar || "https://picsum.photos/seed/admin/40"} alt={userName} data-ai-hint="person face" />
                <AvatarFallback>{userName?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn("overflow-hidden transition-all duration-300", state === 'expanded' ? 'w-auto' : 'w-0')}>
                <p className="font-semibold text-sm">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
             <Button variant="ghost" size="icon" className={cn("transition-all duration-300", state === 'expanded' ? 'ml-auto' : '')}>
                <LogOut className="h-5 w-5" />
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

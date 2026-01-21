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
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import React, { Suspense } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/admin', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/admin/products', icon: Box, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/categories', icon: LayoutGrid, label: 'Categories' },
  { href: '/admin/tags', icon: Tag, label: 'Tags' },
  { href: '/admin/refunds', icon: RefreshCcw, label: 'Refunds' },
  { href: '/admin/transactions', icon: Banknote, label: 'Transactions' },
  { href: '/admin/admins', icon: Users, label: 'Admins' },
  { href: '/admin/reviews', icon: Star, label: 'Reviews' },
  { href: '/admin/questions', icon: HelpCircle, label: 'Questions' },
  { href: '/admin/offers', icon: Gift, label: 'Offers' },
  { href: '/admin/messages', icon: MessageSquare, label: 'Messages' },
];

const settingsNavItems = [
    { href: '/admin/settings', label: 'General', tab: 'general' },
    { href: '/admin/settings?tab=seo', label: 'SEO', tab: 'seo' },
    { href: '/admin/settings?tab=payments', label: 'Payments', tab: 'payments' },
    { href: '/admin/settings?tab=maintenance', label: 'Maintenance', tab: 'maintenance' },
    { href: '/admin/settings?tab=promo', label: 'Promotions', tab: 'promo' },
];

const SidebarNavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} className="w-full justify-start">
                <Link href={href}>
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{label}</span>
                </Link>
            </SidebarMenuButton>
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

export default function AdminSidebar() {
  const { state } = useSidebar();
  
  return (
    <Sidebar collapsible="icon" className="border-r bg-card hidden md:flex">
       <SidebarHeader className={cn("flex items-center justify-between  p-4", state === 'expanded' ? 'flex-row-reverse' : '')}>
        <div className={cn("flex items-center gap-2 overflow-hidden transition-all duration-300", state === 'expanded' ? 'w-auto' : 'w-0')}>
            <Leaf className="h-6 w-6 text-primary" />
            <Link href="/" className="font-bold text-lg">Pickbazar</Link>
        </div>
        <SidebarTrigger className="hidden md:flex">
            <ChevronLeft />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
            {navItems.map(item => (
                <SidebarNavLink key={item.href} {...item} />
            ))}
            <Suspense fallback={null}>
              <SettingsAccordion />
            </Suspense>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className={cn("flex items-center gap-3 transition-all duration-300", state === 'collapsed' ? 'justify-center' : '')}>
             <Avatar className="h-9 w-9">
                <AvatarImage src="https://picsum.photos/seed/admin/40" alt="Admin" data-ai-hint="person face" />
                <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className={cn("overflow-hidden transition-all duration-300", state === 'expanded' ? 'w-auto' : 'w-0')}>
                <p className="font-semibold text-sm">Admin Name</p>
                <p className="text-xs text-muted-foreground">admin@pickbazar.com</p>
            </div>
             <Button variant="ghost" size="icon" className={cn("transition-all duration-300", state === 'expanded' ? 'ml-auto' : '')}>
                <LogOut className="h-5 w-5" />
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

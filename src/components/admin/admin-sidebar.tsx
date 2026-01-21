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
  Leaf
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

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
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
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


export default function AdminSidebar() {
  const { state } = useSidebar();
  
  return (
    <Sidebar collapsible="icon" className="border-r bg-card hidden md:flex">
       <SidebarHeader className="flex items-center justify-between p-4">
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

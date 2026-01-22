'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  KeyRound,
  CreditCard,
  ShoppingBag,
  Heart,
  HelpCircle,
  RefreshCw,
  Wallet,
  LogOut,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import { useState, useEffect } from 'react';

const navItems = [
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/profile/change-password', icon: KeyRound, label: 'Change Password' },
    { href: '/profile/my-cards', icon: CreditCard, label: 'My Cards' },
    { href: '/profile/my-orders', icon: ShoppingBag, label: 'My Orders' },
    { href: '/profile/my-wishlists', icon: Heart, label: 'My Wishlists' },
    { href: '/profile/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile/my-questions', icon: HelpCircle, label: 'My Questions' },
    { href: '/profile/my-refunds', icon: RefreshCw, label: 'My Refunds' },
    { href: '/contact', icon: HelpCircle, label: 'Need Help' },
];

const ProfileNavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <span
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium',
          isActive
            ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </span>
    </Link>
  );
};

export default function ProfileSidebar() {
    const { supabase, user } = useSupabase();
    const router = useRouter();
    const { toast } = useToast();
    const [profileRole, setProfileRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (data && data.role) {
                    setProfileRole(data.role);
                }
            }
        };
        fetchProfile();
    }, [user, supabase]);

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

    const allowedAdminRoles = ['admin', 'manager', 'super-admin'];
    const isAdmin = profileRole && allowedAdminRoles.includes(profileRole);

    return (
        <aside className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Wallet Points
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 divide-x text-center">
                    <div className="space-y-1">
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground">Used</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-primary">0</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-2 space-y-1">
                    {isAdmin && <ProfileNavLink href="/admin" icon={LayoutDashboard} label="Admin Dashboard" />}
                    {navItems.map((item) => (
                        <ProfileNavLink key={item.href} {...item} />
                    ))}
                     <div className="p-2">
                        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start flex items-center gap-3 px-2 py-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground h-auto">
                            <LogOut className="h-5 w-5" />
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}



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
  LogOut,
  Bell,
  LayoutDashboard,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/profile/my-orders', icon: ShoppingBag, label: 'My Orders' },
    { href: '/profile/my-wishlists', icon: Heart, label: 'My Wishlists' },
    { href: '/profile/my-reviews', icon: Star, label: 'My Reviews' },
    { href: '/profile/my-questions', icon: HelpCircle, label: 'My Questions' },
    { href: '/profile/my-cards', icon: CreditCard, label: 'My Cards' },
    { href: '/profile/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile/change-password', icon: KeyRound, label: 'Change Password' },
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
    const [profile, setProfile] = useState<{
        role: string | null;
        full_name: string | null;
        avatar_url: string | null;
        bio: string | null;
    } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role, full_name, avatar_url, bio')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setProfile(data);
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
    const isAdmin = profile?.role && allowedAdminRoles.includes(profile.role);

    return (
        <aside className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? ''} />
                            <AvatarFallback>
                                {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-semibold">{profile?.full_name || 'User'}</h2>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        {profile?.bio && <p className="text-sm text-muted-foreground mt-2 text-center">{profile.bio}</p>}
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

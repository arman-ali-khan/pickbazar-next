'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChangePasswordPage() {
    const { supabase, user, loading: authLoading } = useSupabase();
    const router = useRouter();
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Change Password | Pickbazar';
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'You must be logged in to change your password.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
                description: 'Please ensure both password fields are identical.',
            });
            return;
        }

        if (newPassword.length < 6) {
             toast({
                variant: 'destructive',
                title: 'Password too short',
                description: 'Your password must be at least 6 characters long.',
            });
            return;
        }

        setIsSubmitting(true);

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error updating password',
                description: error.message,
            });
        } else {
            toast({
                title: 'Password Updated',
                description: 'Your password has been changed successfully.',
            });
            setNewPassword('');
            setConfirmPassword('');
        }

        setIsSubmitting(false);
    }
    
    if (authLoading) {
        return (
            <div className="bg-muted/20 min-h-screen">
                <Header />
                <main className="container py-12">
                    <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                        <div className="hidden md:block">
                            <aside className="space-y-6">
                                <Skeleton className="h-40 w-full rounded-lg" />
                                <Skeleton className="h-96 w-full rounded-lg" />
                            </aside>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6 max-w-lg">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <Skeleton className="h-10 w-36" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <CartDrawer />
            </div>
        );
    }

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid sm:grid-cols-[320px_1fr] gap-8 items-start">
                <div className="hidden md:block">
                    <ProfileSidebar />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                             <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input 
                                    id="new-password" 
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    required
                                 />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input 
                                    id="confirm-password" 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
          </main>
          <CartDrawer />
        </div>
    );
}

'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import CartDrawer from '@/components/cart-drawer';

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
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

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL || 'https://picsum.photos/seed/profile/200'} alt={user.displayName || 'User'} data-ai-hint="person face" />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{user.displayName || 'New User'}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <Button variant="outline" size="sm">Change Photo</Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
                <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" defaultValue={user.displayName || ''} />
                </div>
                 <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user.email || ''} disabled />
                </div>
            </div>
            <div className="flex justify-between">
                <Button>Update Profile</Button>
                <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

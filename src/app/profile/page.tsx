'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { UploadCloud, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const addresses = [
    {
        title: 'Irure Elit Fugiat S',
        address: 'Temporibus sunt ist, Enim magni ratione p, Aperiam rem sint cor, 87067, Quisquam non atque v',
    },
    {
        title: 'Bjk',
        address: 'fjjbj, mymjf, ufjc, 234578, ba',
    },
];

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');


  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
     if (user) {
        setName(user.displayName || '');
    }
  }, [user, loading, router]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically update the user's profile in Firebase
    console.log({ name, bio });
    toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
    });
  }

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
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
            <ProfileSidebar />

            <div className="space-y-8">
                {/* Profile Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center gap-6 p-6 border-2 border-dashed rounded-lg">
                            <UploadCloud className="h-12 w-12 text-muted-foreground" />
                            <div className="text-center">
                                <p className="font-semibold text-primary">Upload an image <span className="text-muted-foreground font-normal">or drag and drop</span></p>
                                <p className="text-xs text-muted-foreground">PNG, JPG</p>
                            </div>
                        </div>

                        <div className="relative w-28 h-28 -mt-20 ml-8">
                            <Avatar className="h-full w-full border-4 border-background">
                                <AvatarImage src={user.photoURL || 'https://picsum.photos/seed/profile/200'} alt={user.displayName || 'User'} data-ai-hint="person face" />
                                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Save</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Email */}
                <Card>
                    <CardHeader>
                        <CardTitle>Email</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Input id="email" defaultValue={user.email || ''} disabled />
                         <div className="flex justify-end">
                            <Button>Update</Button>
                         </div>
                    </CardContent>
                </Card>

                {/* Contact Number */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Contact Number</CardTitle>
                        <Button variant="link" className="p-0 h-auto text-primary">+ Update</Button>
                    </CardHeader>
                    <CardContent>
                         <Input id="contact" defaultValue="+1 (936) 514-1641" />
                    </CardContent>
                </Card>

                 {/* Addresses */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Addresses</CardTitle>
                         <Button variant="link" className="p-0 h-auto text-primary flex items-center gap-1">
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        {addresses.map((address, i) => (
                             <Card key={i}>
                                <CardHeader>
                                    <CardTitle className="text-base">{address.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{address.address}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

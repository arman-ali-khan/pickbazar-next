
'use client';

import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { UploadCloud, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AddAddressDialog, type AddressFormValues } from '@/components/add-address-dialog';
import { UpdateContactDialog } from '@/components/update-contact-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  full_name: string;
  bio: string;
  contact_number: string;
  avatar_url: string;
}

interface Address extends AddressFormValues {
  id: number;
}

export default function ProfilePage() {
  const { user, supabase, loading: authLoading } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({ full_name: '', bio: '', contact_number: '', avatar_url: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const setPageTitle = async () => {
        const { data } = await supabase.rpc('get_all_settings');
        const siteTitle = data?.[0]?.site_title || 'Karwanbazar';
        document.title = `My Profile | ${siteTitle}`;
    }
    setPageTitle();
  }, [supabase]);

  const getAddresses = useCallback(async () => {
    if (!user) return;
    try {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
            setAddresses(data.map(addr => ({ ...addr, type: addr.address_type, streetAddress: addr.street_address } as Address)));
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching addresses', description: error.message });
    }
  }, [user, supabase, toast]);


  const getProfile = useCallback(async () => {
    if (!user) return;
    try {
      setProfileLoading(true);
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, bio, contact_number, avatar_url`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile({
            full_name: data.full_name || user.user_metadata.full_name || '',
            bio: data.bio || '',
            contact_number: data.contact_number || '',
            avatar_url: data.avatar_url || user.user_metadata.avatar_url || ''
        });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error fetching profile', description: error.message });
    } finally {
      setProfileLoading(false);
    }
  }, [user, supabase, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getProfile();
      getAddresses();
    }
  }, [user, getProfile, getAddresses]);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setProfileLoading(true);

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        bio: profile.bio,
        contact_number: profile.contact_number,
        avatar_url: profile.avatar_url,
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        console.error('Supabase error during profile update:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      toast({ title: 'Profile Updated', description: 'Your profile information has been saved.' });
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error Updating Profile', 
        description: error.message || 'An unknown error occurred. Please check database policies.'
      });
    } finally {
      setProfileLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;

    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: data.publicUrl,
      })

      if (updateError) throw updateError;
      
      setProfile(prev => ({...prev, avatar_url: data.publicUrl}));
      toast({ title: 'Avatar updated!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error uploading avatar', description: error.message });
    } finally {
      setUploading(false);
    }
  }
  
  async function handleAddAddress(data: AddressFormValues) {
    if (!user) return;
    try {
        const { error } = await supabase.from('addresses').insert({
            user_id: user.id,
            address_type: data.type,
            title: data.title,
            country: data.country,
            city: data.city,
            state: data.state,
            zip: data.zip,
            street_address: data.streetAddress,
        });

        if (error) throw error;
        getAddresses(); // Re-fetch addresses
        toast({ title: 'Address Added', description: 'Your new address has been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error adding address', description: error.message });
    }
  };

  async function handleDeleteAddress(addressId: number) {
      if (!user) return;
      try {
          const { error } = await supabase.from('addresses').delete().eq('id', addressId);
          if (error) throw error;
          setAddresses(prev => prev.filter(addr => addr.id !== addressId));
          toast({ title: 'Address Removed', description: 'The address has been deleted.' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error deleting address', description: error.message });
      }
  }

  async function handleUpdateContact(newContact: string) {
    if (!user) return;
    try {
        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            contact_number: newContact,
        });
        if (error) throw error;
        setProfile(prev => ({...prev, contact_number: newContact}));
        toast({ title: "Contact Updated", description: "Your contact number has been saved." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error updating contact', description: error.message });
    }
  };

  const userNameForAvatar = profile.full_name || user?.email;
  
  if (authLoading || profileLoading) {
    return (
        <div className="bg-muted/20 min-h-screen">
            <Header />
            <main className="container py-12 w-full mx-auto">
                <div className="grid w-full md:grid-cols-[320px_1fr] gap-8 items-start">
                    <div className="hidden md:block">
                        <aside className="space-y-6">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-96 w-full" />
                        </aside>
                    </div>
                    <div className="space-y-8 w-full">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                                <div className="flex justify-end"><Skeleton className="h-10 w-20" /></div>
                            </CardContent>
                        </Card>
                        <Card><CardHeader><Skeleton className="h-6 w-16" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-24" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                </div>
            </main>
            <CartDrawer />
        </div>
    );
  }

  if (!user) {
    // This will be caught by the useEffect and redirect, but as a fallback
    return null;
  }

  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12 w-full mx-auto">
        <div className="grid w-full md:grid-cols-[320px_1fr] gap-8 items-start">
            <div className="hidden md:block">
                <ProfileSidebar />
            </div>

            <div className="space-y-8 w-full">
                {/* Profile Form */}
                <form onSubmit={handleProfileUpdate}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>This is how others will see you on the site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-center gap-6">
                                <div className="relative">
                                    <label htmlFor="avatar-upload" className="cursor-pointer group block">
                                        <Avatar className="h-24 w-24">
                                            <AvatarImage src={profile.avatar_url || 'https://picsum.photos/seed/profile/200'} alt={userNameForAvatar || 'User'} data-ai-hint="person face" />
                                            <AvatarFallback>{userNameForAvatar?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            {uploading ? <Skeleton className="h-8 w-8 rounded-full bg-slate-400" /> : <UploadCloud className="h-8 w-8 text-white" />}
                                        </div>
                                    </label>
                                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea id="bio" value={profile.bio || ''} onChange={(e) => setProfile({...profile, bio: e.target.value})} placeholder="Tell us about yourself" />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-6">
                            <Button type="submit" disabled={profileLoading || uploading}>
                                {profileLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>

                {/* Email */}
                <Card>
                    <CardHeader>
                        <CardTitle>Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Input id="email" defaultValue={user.email || ''} disabled />
                    </CardContent>
                </Card>

                {/* Contact Number */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Contact Number</CardTitle>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-primary">+ Update</Button>
                            </DialogTrigger>
                            <UpdateContactDialog currentContact={profile.contact_number} onUpdateContact={handleUpdateContact} />
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                         <Input id="contact" value={profile.contact_number || ''} placeholder="No contact number added" readOnly />
                    </CardContent>
                </Card>

                 {/* Addresses */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Addresses</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto text-primary flex items-center gap-1">
                                    <Plus className="h-4 w-4" />
                                    Add
                                </Button>
                            </DialogTrigger>
                            <AddAddressDialog onAddAddress={handleAddAddress} />
                        </Dialog>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                             <Card key={address.id}>
                                <CardHeader className="flex-row justify-between items-start">
                                    <CardTitle className="text-base">{address.title}</CardTitle>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this address.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteAddress(address.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{address.streetAddress}, {address.city}, {address.state} {address.zip}, {address.country}</p>
                                </CardContent>
                            </Card>
                        ))}
                         {addresses.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No addresses added yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <CartDrawer />
    </div>
  );
}

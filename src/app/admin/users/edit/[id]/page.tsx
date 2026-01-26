'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft, UploadCloud } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { supabase } = useSupabase();
    const userId = params.id;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUser = useCallback(async () => {
        if (!userId) {
            notFound();
            return;
        }
        setLoading(true);
        const { data: allUsers, error } = await supabase.rpc('get_all_users');

        if (error || !allUsers) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users.' });
            notFound();
            return;
        }
        
        const userData = (allUsers as any[]).find(u => u.id === userId);

        if (!userData) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
            notFound();
            return;
        }

        setUser(userData);
        setFullName(userData.full_name || '');
        setAvatarUrl(userData.avatar_url || null);
        setLoading(false);
    }, [userId, supabase, toast]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aistudio');

        const response = await fetch('https://api.cloudinary.com/v1_1/dcckbmhft/image/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to upload image to Cloudinary: ${errorData.error.message}`);
        }

        const data = await response.json();
        return data.secure_url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let finalAvatarUrl = user?.avatar_url;
            if (avatarFile) {
                finalAvatarUrl = await uploadImage(avatarFile);
            }

            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName, avatar_url: finalAvatarUrl })
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: "User Updated",
                description: "The user's profile has been successfully updated.",
            });
            router.push('/admin/users');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Error Updating User",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <p>Loading user details...</p>;
    }

    if (!user) {
        return null;
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/users">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit User
                </h1>
            </div>
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>Update the user's profile information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label>Avatar</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? ''} />
                                        <AvatarFallback>{(fullName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="avatar-upload" className="flex-1 flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70">
                                        <div className="flex flex-col items-center justify-center">
                                            <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">Click to upload</p>
                                        </div>
                                        <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={user.email ?? ''} disabled />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Update User'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

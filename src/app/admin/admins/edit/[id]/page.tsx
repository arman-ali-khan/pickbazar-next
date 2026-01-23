
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabase } from '@/lib/supabase/provider';
import { updateUserRole } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';

interface Admin {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'manager' | 'super-admin';
}

export default function EditAdminPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { supabase, user: currentUser } = useSupabase();
    const adminId = params.id;
    
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [role, setRole] = useState<'admin' | 'manager' | 'customer' | 'super-admin'>('admin');
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchAdmin = useCallback(async () => {
        if (!adminId) {
            notFound();
            return;
        }
        setLoading(true);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, users(email)')
            .eq('id', adminId)
            .in('role', ['admin', 'manager', 'super-admin'])
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'Admin not found.' });
            notFound();
            return;
        }

        const adminData = {
            id: data.id,
            full_name: (data as any).full_name || 'No Name',
            email: (data as any).users?.email || 'No Email',
            role: data.role as Admin['role'],
        };
        
        setAdmin(adminData);
        setRole(adminData.role);
        setLoading(false);
    }, [adminId, supabase, toast]);

    useEffect(() => {
        fetchAdmin();
    }, [fetchAdmin]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!admin) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('userId', admin.id);
            formData.append('role', role);

            const result = await updateUserRole(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Admin Role Updated', description: "The user's role has been successfully updated." });
                router.push('/admin/admins');
            }
        });
    };

    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid gap-3">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="grid gap-3">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Skeleton className="h-10 w-28" />
                    </CardFooter>
                </Card>
            </main>
        );
    }
    
    if (!admin) {
        return null;
    }
    
    // A super-admin cannot demote another super-admin
    const isEditingSuperAdmin = admin.role === 'super-admin' && admin.id !== currentUser?.id;

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/admins">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Admin
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Details</CardTitle>
                        <CardDescription>Update the details for the admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" type="text" value={admin.full_name} disabled />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={admin.email} disabled />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(value) => setRole(value as any)} disabled={isPending || isEditingSuperAdmin}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="customer">Customer (Demote)</SelectItem>
                                        {admin.role === 'super-admin' && <SelectItem value="super-admin" disabled>Super Admin</SelectItem>}
                                    </SelectContent>
                                </Select>
                                {isEditingSuperAdmin && <p className="text-sm text-muted-foreground">Super-admin roles cannot be changed.</p>}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit" disabled={isPending || isEditingSuperAdmin}>Update Admin</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}


'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { updateUserRole } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';

interface PotentialAdmin {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
}

export default function PromoteUserPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { supabase } = useSupabase();
    const [users, setUsers] = useState<PotentialAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_potential_admins');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handlePromote = (userId: string, role: 'admin' | 'manager') => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('role', role);

            const result = await updateUserRole(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'User Promoted', description: `The user has been promoted to ${role}.` });
                router.push('/admin/admins');
            }
        });
    };

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
                    Promote User to Admin
                </h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Select a user to promote to an admin or manager role.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-full" />
                                                <div>
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-40 mt-1" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-9 w-24 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? ''} />
                                                    <AvatarFallback>{(user.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.full_name ?? 'No Name'}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" disabled={isPending}>
                                                        Promote
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handlePromote(user.id, 'admin')}>
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePromote(user.id, 'manager')}>
                                                        Make Manager
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     { !loading && users.length === 0 && <p className="text-center text-muted-foreground py-8">No users available to promote.</p> }
                </CardContent>
            </Card>
        </main>
    );
}

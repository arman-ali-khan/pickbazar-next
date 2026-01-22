
'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback, useTransition } from "react";
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { updateUserRole } from "@/app/actions";

type Admin = {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'manager' | 'super-admin';
    avatar_url: string;
}

const roleDisplayMap: { [key: string]: string } = {
  'admin': 'Admin',
  'manager': 'Manager',
  'super-admin': 'Super Admin'
};

export default function AdminAdminsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admins');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching admins', description: error.message });
        } else {
            setAdmins(data || []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleDemote = (adminId: string) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('userId', adminId);
            formData.append('role', 'customer');
            const result = await updateUserRole(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Admin Demoted', description: 'The user has been demoted to a customer.' });
                fetchAdmins();
            }
        });
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Admins</CardTitle>
                        <CardDescription>Manage your store administrators.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" asChild>
                         <Link href="/admin/admins/create">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Promote User
                            </span>
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading admins...</p> : (
                        <>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins.map((admin) => (
                                        <TableRow key={admin.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={admin.avatar_url ?? undefined} alt={admin.full_name} />
                                                        <AvatarFallback>{(admin.full_name ?? admin.email).charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{admin.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={admin.role === 'super-admin' ? 'default' : 'secondary'}>
                                                    {roleDisplayMap[admin.role] || admin.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isPending}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/admins/edit/${admin.id}`}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit Role
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {admin.role !== 'super-admin' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive">
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Demote
                                                                    </div>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will demote the user to a customer and remove their admin privileges.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDemote(admin.id)}>
                                                                            Demote
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Mobile View */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                            {admins.map((admin) => (
                                <Card key={admin.id}>
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                        <Avatar className="h-10 w-10">
                                             <AvatarImage src={admin.avatar_url ?? undefined} alt={admin.full_name} />
                                             <AvatarFallback>{(admin.full_name ?? admin.email).charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <CardTitle className="text-base">{admin.full_name}</CardTitle>
                                            <CardDescription>{admin.email}</CardDescription>
                                        </div>
                                        {/* Dropdown for mobile needs implementation */}
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center text-sm">
                                        <Badge variant={admin.role === 'super-admin' ? 'default' : 'secondary'}>{roleDisplayMap[admin.role] || admin.role}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}


'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft, Edit, Heart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from '@/app/actions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

type UserRole = 'customer' | 'manager' | 'admin' | 'super-admin';
interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string;
    role: UserRole;
}

interface Address {
  id: number;
  title: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
    id: number;
    order_number: string;
    created_at: string;
    status: string;
    total_amount: number;
}

interface WishlistItem {
    id: number;
    name: string;
    featured_image_url: string;
}

const roleDisplayMap: Record<UserRole, string> = {
  'customer': 'Customer',
  'manager': 'Manager',
  'admin': 'Admin',
  'super-admin': 'Super Admin'
};

const getRoleVariant = (role: UserRole) => {
    switch (role) {
        case 'super-admin': return 'default';
        case 'admin': return 'secondary';
        case 'manager': return 'outline';
        default: return 'secondary';
    }
}


export default function ViewUserPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { supabase, user: currentUser } = useSupabase();
    const userId = params.id;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRoleUpdating, startRoleUpdate] = useTransition();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        if (!userId) {
            notFound();
            return;
        }
        setLoading(true);

        const [userRes, addressesRes, ordersRes, wishlistRes] = await Promise.all([
            supabase.rpc('get_user_details', { p_user_id: userId }),
            supabase.from('addresses').select('*').eq('user_id', userId),
            supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
            supabase.rpc('get_admin_user_wishlist', { p_user_id: userId })
        ]);

        const { data: userArray, error: userError } = userRes;

        if (userError || !userArray || userArray.length === 0) {
            toast({ variant: "destructive", title: "Error", description: `User not found. ${userError?.message || ''}`.trim() });
            notFound();
            return;
        }
        const userData = userArray[0];
        setUser(userData as UserProfile);

        const { data: addressesData } = addressesRes;
        if (addressesData) {
            setAddresses(addressesData);
        }
        
        const { data: ordersData } = ordersRes;
        if (ordersData) {
            setRecentOrders(ordersData as Order[]);
        }

        const { data: wishlistData } = wishlistRes;
        if (wishlistData) {
            setWishlist(wishlistData);
        }
        
        setLoading(false);
    }, [userId, supabase, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleChange = (newRole: UserRole) => {
        if (!user) return;
        startRoleUpdate(async () => {
            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('role', newRole);
            const result = await updateUserRole(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error Updating Role', description: result.error });
            } else {
                toast({ title: 'Role Updated', description: "The user's role has been successfully updated." });
                fetchData();
            }
        });
    };

    const handleDelete = () => {
        toast({
            variant: "destructive",
            title: "Not Implemented",
            description: "User deletion must be handled with a secure server-side function.",
        });
    };

    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-9 w-28 ml-auto" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="grid auto-rows-max gap-4 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col items-center gap-4">
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                    <div className="text-center space-y-1">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <div className="grid gap-2">
                                    <div className="flex justify-between"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-24" /></div>
                                     <div className="flex justify-between items-center"><Skeleton className="h-4 w-12" /><Skeleton className="h-6 w-20 rounded-full" /></div>
                                    <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-8" /></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-28" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid auto-rows-max gap-4 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-64" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-40 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
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
                    User Profile
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" asChild>
                        <Link href={`/admin/users/edit/${user.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Edit User
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isRoleUpdating}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger disabled={user.id === currentUser?.id || user.role === 'super-admin'}>Change Role</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => handleRoleChange('admin')}>Make Admin</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange('manager')}>Make Manager</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange('customer')}>Make Customer (Demote)</DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={handleDelete} disabled={user.role === 'super-admin'}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="grid auto-rows-max gap-4 lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? ''} />
                                    <AvatarFallback>{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <CardTitle>{user.full_name || 'No Name'}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="grid gap-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Joined</span>
                                    <span suppressHydrationWarning>{format(new Date(user.created_at), 'PP')}</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Role</span>
                                    <Badge variant={getRoleVariant(user.role)}>{roleDisplayMap[user.role]}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Orders</span>
                                    <span>{recentOrders.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Addresses</CardTitle></CardHeader>
                        <CardContent>
                            {addresses.length > 0 ? (
                                addresses.map(addr => (
                                    <div key={addr.id} className="mb-4 last:mb-0">
                                        <p className="font-semibold">{addr.title}</p>
                                        <address className="not-italic text-muted-foreground text-sm">
                                            {addr.street_address}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
                                        </address>
                                    </div>
                                ))
                            ) : <p className="text-muted-foreground text-sm">No addresses found.</p>}
                        </CardContent>
                    </Card>
                </div>
                <div className="grid auto-rows-max gap-4 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>A list of the user's most recent orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                 <Link href={`/admin/orders/${order.order_number}`} className="font-medium hover:underline">{order.order_number}</Link>
                                            </TableCell>
                                            <TableCell suppressHydrationWarning>{format(new Date(order.created_at), 'PP')}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'Delivered' ? 'secondary' : order.status === 'Cancelled' ? 'destructive' : 'default'}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">${order.total_amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5 text-destructive" />
                                User's Wishlist
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {wishlist.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {wishlist.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-12 w-12 rounded-md border">
                                                            <Image src={item.featured_image_url || ''} alt={item.name} fill className="object-contain p-1" />
                                                        </div>
                                                        <div>
                                                            <Link href={`/products/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-muted-foreground text-sm">This user has not wishlisted any items.</p>}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </main>
    );
}

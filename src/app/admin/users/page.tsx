'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter,
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
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, Eye, Pencil, ListFilter, Send } from "lucide-react";
import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import Link from 'next/link';
import { updateUserRole, sendCustomNotification } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UserRole = 'customer' | 'manager' | 'admin' | 'super-admin';
interface User {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: string;
    role: UserRole;
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

export default function AdminUsersPage() {
    const { supabase, user: currentUser } = useSupabase();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRoleUpdating, startRoleUpdate] = useTransition();
    const [isNotificationSending, startNotificationSend] = useTransition();
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationLink, setNotificationLink] = useState('');

    const getUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_users');

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching users', description: error.message });
            setUsers([]);
        } else {
            setUsers((data as User[]) || []);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const filteredUsers = useMemo(() => {
        if (roleFilter === 'all') {
            return users;
        }
        return users.filter(user => user.role === roleFilter);
    }, [users, roleFilter]);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        startRoleUpdate(async () => {
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('role', newRole);
            const result = await updateUserRole(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error Updating Role', description: result.error });
            } else {
                toast({ title: 'Role Updated', description: "The user's role has been successfully updated." });
                getUsers(); // Refresh the user list
            }
        });
    };

    const handleDelete = (userId: string) => {
        toast({
            variant: "destructive",
            title: "Not Implemented",
            description: "User deletion must be handled with a secure server-side function.",
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectUser = (userId: string, checked: boolean) => {
        setSelectedUserIds(prev =>
            checked ? [...prev, userId] : prev.filter(id => id !== userId)
        );
    };

    const handleSendNotification = (e: React.FormEvent) => {
        e.preventDefault();
        startNotificationSend(async () => {
            const formData = new FormData();
            selectedUserIds.forEach(id => formData.append('userIds', id));
            formData.append('title', notificationTitle);
            formData.append('message', notificationMessage);
            formData.append('link', notificationLink);

            const result = await sendCustomNotification(formData);

            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: `Notifications Sent`, description: `Successfully sent notifications to ${result.count} users.` });
                setNotificationTitle('');
                setNotificationMessage('');
                setNotificationLink('');
                setSelectedUserIds([]);
            }
        });
    };

    if (loading) {
        return <p>Loading users...</p>;
    }
    
    const isAllSelected = selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length;
    const isSomeSelected = selectedUserIds.length > 0 && selectedUserIds.length < filteredUsers.length;

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>View and manage your application's users and their roles.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <ListFilter className="mr-2 h-4 w-4" />
                                Filter by role
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuRadioGroup value={roleFilter} onValueChange={setRoleFilter}>
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="super-admin">Super Admin</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="manager">Manager</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="customer">Customer</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            onCheckedChange={handleSelectAll}
                                            checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                                         />
                                    </TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedUserIds.includes(user.id)}
                                                onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? ''} />
                                                    <AvatarFallback>{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.full_name ?? 'No Name'}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleVariant(user.role)}>{roleDisplayMap[user.role]}</Badge>
                                        </TableCell>
                                        <TableCell suppressHydrationWarning>{format(new Date(user.created_at), 'PP')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isRoleUpdating}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/users/view/${user.id}`}><Eye className="mr-2 h-4 w-4" /> View</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/users/edit/${user.id}`}><Pencil className="mr-2 h-4 w-4" /> Edit Profile</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger disabled={user.id === currentUser?.id || user.role === 'super-admin'}>Change Role</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>Make Admin</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'manager')}>Make Manager</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'customer')}>Make Customer (Demote)</DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)} disabled={user.role === 'super-admin'}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                    </DropdownMenuItem>
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
                        {filteredUsers.map((user) => (
                             <Card key={user.id}>
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                     <Checkbox
                                        checked={selectedUserIds.includes(user.id)}
                                        onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                                    />
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? ''} />
                                        <AvatarFallback>{(user.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">
                                            <Link href={`/admin/users/view/${user.id}`} className="hover:underline">
                                                {user.full_name ?? 'No Name'}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription>{user.email}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/users/view/${user.id}`}><Eye className="mr-2 h-4 w-4" /> View</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/users/edit/${user.id}`}><Pencil className="mr-2 h-4 w-4" /> Edit Profile</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger disabled={user.id === currentUser?.id || user.role === 'super-admin'}>Change Role</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>Make Admin</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'manager')}>Make Manager</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'customer')}>Make Customer (Demote)</DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)} disabled={user.role === 'super-admin'}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center text-sm p-4 pt-0">
                                    <p className="text-muted-foreground" suppressHydrationWarning>Joined {format(new Date(user.created_at), 'PP')}</p>
                                    <Badge variant={getRoleVariant(user.role)}>{roleDisplayMap[user.role]}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-8">
                <form onSubmit={handleSendNotification}>
                    <CardHeader>
                        <CardTitle>Send Custom Notification</CardTitle>
                        <CardDescription>
                            Send a notification to the selected users. {selectedUserIds.length} user(s) selected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notification-title">Title</Label>
                            <Input
                                id="notification-title"
                                placeholder="e.g. 🎉 Weekend Flash Sale!"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notification-message">Message (Optional)</Label>
                            <Textarea
                                id="notification-message"
                                placeholder="Get 20% off on all fresh vegetables."
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="notification-link">Link (Optional)</Label>
                            <Input
                                id="notification-link"
                                placeholder="/offers"
                                value={notificationLink}
                                onChange={(e) => setNotificationLink(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={selectedUserIds.length === 0 || !notificationTitle || isNotificationSending}>
                            <Send className="mr-2 h-4 w-4" />
                            {isNotificationSending ? 'Sending...' : `Send to ${selectedUserIds.length} users`}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}

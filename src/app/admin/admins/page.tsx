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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';
import { admins as initialAdmins } from '@/lib/data';
import type { Admin } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getStatusVariant = (status: Admin['status']) => {
    return status === 'active' ? 'secondary' : 'destructive';
};

export default function AdminAdminsPage() {
    const [admins, setAdmins] = useState(initialAdmins);

    const handleDelete = (id: number) => {
        setAdmins(admins.filter(admin => admin.id !== id));
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
                                Add Admin
                            </span>
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={admin.avatar.imageUrl} alt={admin.name} data-ai-hint={admin.avatar.imageHint} />
                                                    <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{admin.name}</p>
                                                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{admin.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(admin.status)} className="capitalize">{admin.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/admins/edit/${admin.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(admin.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                        {admins.map((admin) => (
                            <Card key={admin.id}>
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={admin.avatar.imageUrl} alt={admin.name} data-ai-hint={admin.avatar.imageHint} />
                                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{admin.name}</CardTitle>
                                        <CardDescription>{admin.email}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                 <Link href={`/admin/admins/edit/${admin.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(admin.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center text-sm">
                                    <p className="text-muted-foreground">{admin.role}</p>
                                    <Badge variant={getStatusVariant(admin.status)} className="capitalize">{admin.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}

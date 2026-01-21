
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { admins as initialAdmins } from '@/lib/data';
import type { Admin } from '@/lib/data';

export default function EditAdminPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const adminId = parseInt(params.id, 10);
    
    const [admin, setAdmin] = useState<Admin | undefined>(() => initialAdmins.find(a => a.id === adminId));
    
    const [name, setName] = useState(admin?.name || '');
    const [email, setEmail] = useState(admin?.email || '');
    const [role, setRole] = useState(admin?.role || '');
    const [status, setStatus] = useState(admin?.status || '');


    useEffect(() => {
        const foundAdmin = initialAdmins.find(a => a.id === adminId);
        if (foundAdmin) {
            setAdmin(foundAdmin);
            setName(foundAdmin.name);
            setEmail(foundAdmin.email);
            setRole(foundAdmin.role);
            setStatus(foundAdmin.status);
        } else {
            notFound();
        }
    }, [adminId]);


    if (!admin) {
        return null; 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ id: admin.id, name, email, role, status });
        toast({
            title: "Admin Updated",
            description: `The admin "${name}" has been successfully updated.`,
        });
        router.push('/admin/admins');
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
                                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="super-admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="status">Status</Label>
                                 <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit">Update Admin</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

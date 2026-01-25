
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
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import Image from "next/image";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";

type PromoStatus = 'active' | 'inactive';

interface Promo {
  id: number;
  title: string;
  subtitle: string | null;
  status: PromoStatus;
  image_url: string | null;
}

const getStatusVariant = (status: PromoStatus) => {
    switch (status) {
        case 'active': return 'secondary';
        case 'inactive': return 'default';
        default: return 'default';
    }
};

export default function AdminPromosPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [promos, setPromos] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);

    const getPromos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('promos').select('*').order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching promos', description: error.message });
        } else {
            setPromos(data as Promo[]);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getPromos();
    }, [getPromos]);

    const handleDelete = async (id: number) => {
        const { error } = await supabase.from('promos').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting promo', description: error.message });
        } else {
            toast({ title: 'Promo Deleted' });
            getPromos();
        }
    };

    if (loading) {
        return <p>Loading promos...</p>;
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Promotional Popups</CardTitle>
                        <CardDescription>Manage your promotional popups.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" asChild>
                         <Link href="/admin/promos/create">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Promo
                            </span>
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promos.map((promo) => (
                                <TableRow key={promo.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={promo.title}
                                            className="aspect-square rounded-md object-contain p-1"
                                            height="64"
                                            src={promo.image_url || 'https://picsum.photos/seed/placeholder/200'}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell>
                                      <p className="font-medium">{promo.title}</p>
                                      <p className="text-xs text-muted-foreground">{promo.subtitle}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(promo.status)} className="capitalize">{promo.status}</Badge>
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
                                                    <Link href={`/admin/promos/edit/${promo.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(promo.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}

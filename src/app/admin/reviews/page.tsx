
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Star, Trash2, Eye, EyeOff } from "lucide-react";
import Link from 'next/link';
import type { AdminReview } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { format } from 'date-fns';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';

const getStatusVariant = (status: AdminReview['status']) => {
    switch (status) {
        case 'Approved':
            return 'secondary';
        case 'Hidden':
            return 'destructive';
        case 'Pending':
            return 'default';
        default:
            return 'default';
    }
};

export default function AdminReviewsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);

    const getReviews = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admin_reviews');

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching reviews', description: error.message });
        } else {
            setReviews(data as AdminReview[]);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getReviews();
    }, [getReviews]);

    const handleStatusChange = async (reviewId: number, newStatus: AdminReview['status']) => {
        const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', reviewId);
        if (error) {
            toast({ variant: 'destructive', title: `Failed to ${newStatus}`, description: error.message });
        } else {
            toast({ title: `Review status changed to ${newStatus}` });
            getReviews();
        }
    };

    const handleDelete = async (reviewId: number) => {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete review', description: error.message });
        } else {
            toast({ title: 'Review deleted' });
            getReviews();
        }
    };

    if (loading) {
        return <p>Loading reviews...</p>;
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Reviews Management</CardTitle>
                    <CardDescription>Approve, hide, or delete customer reviews.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Review</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 rounded-md border">
                                                    <Image src={review.product.featured_image_url} alt={review.product.name} fill className="object-contain p-1" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{review.product.name}</p>
                                                    <Button variant="link" asChild className="p-0 h-auto text-xs">
                                                        <Link href={`/products/${review.product.id}`}>View Product</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={review.author.avatar_url ?? undefined} alt={review.author.name ?? ''} />
                                                    <AvatarFallback>{(review.author.name ?? 'U').charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-medium">{review.author.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate max-w-xs">{review.text}</p>
                                        </TableCell>
                                        <TableCell suppressHydrationWarning>{format(new Date(review.created_at), 'PP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(review.status)}>{review.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {review.status !== 'Approved' && <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'Approved')}><Eye className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>}
                                                    {review.status !== 'Hidden' && <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'Hidden')}><EyeOff className="mr-2 h-4 w-4" />Hide</DropdownMenuItem>}
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(review.id)}>
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
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {reviews.map((review) => (
                            <Card key={review.id}>
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={review.author.avatar_url ?? undefined} alt={review.author.name ?? ''} />
                                        <AvatarFallback>{(review.author.name ?? 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-base flex justify-between">
                                            <span>{review.author.name}</span>
                                            <Badge variant={getStatusVariant(review.status)}>{review.status}</Badge>
                                        </CardTitle>
                                        <CardDescription suppressHydrationWarning>{format(new Date(review.created_at), 'PP')}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {review.status !== 'Approved' && <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'Approved')}><Eye className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>}
                                            {review.status !== 'Hidden' && <DropdownMenuItem onClick={() => handleStatusChange(review.id, 'Hidden')}><EyeOff className="mr-2 h-4 w-4" />Hide</DropdownMenuItem>}
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(review.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2">
                                    <div className="flex items-center mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{review.text}</p>
                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md border mt-2">
                                        <div className="relative h-12 w-12 rounded-md border flex-shrink-0">
                                            <Image src={review.product.featured_image_url} alt={review.product.name} fill className="object-contain p-1" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{review.product.name}</p>
                                            <Button variant="link" asChild className="p-0 h-auto text-xs">
                                                <Link href={`/products/${review.product.id}`}>View Product</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                </CardContent>
            </Card>
        </main>
    );
}

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
import { offers as initialOffers } from '@/lib/data';
import type { Offer } from '@/lib/data';
import Image from "next/image";
import { format } from "date-fns";

const getStatusVariant = (status: Offer['status']) => {
    switch (status) {
        case 'active':
            return 'secondary';
        case 'expired':
            return 'destructive';
        case 'inactive':
            return 'default';
        default:
            return 'default';
    }
};

export default function AdminOffersPage() {
    const [offers, setOffers] = useState(initialOffers);

    const handleDelete = (id: number) => {
        setOffers(offers.filter(offer => offer.id !== id));
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Offers</CardTitle>
                        <CardDescription>Manage your store offers and promotions.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" asChild>
                         <Link href="/admin/offers/create">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Offer
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
                                    <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Date Range</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {offers.map((offer) => (
                                    <TableRow key={offer.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image
                                                alt={offer.title}
                                                className="aspect-square rounded-md object-contain"
                                                height="64"
                                                src={offer.image.imageUrl}
                                                data-ai-hint={offer.image.imageHint}
                                                width="64"
                                            />
                                        </TableCell>
                                        <TableCell>
                                          <p className="font-medium">{offer.title}</p>
                                          <p className="text-xs text-muted-foreground">{offer.subtitle}</p>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{offer.code}</Badge></TableCell>
                                        <TableCell>{offer.discount}%</TableCell>
                                        <TableCell>
                                            <p className="text-sm" suppressHydrationWarning>
                                              {format(new Date(offer.startDate), 'PP')} - {format(new Date(offer.endDate), 'PP')}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(offer.status)} className="capitalize">{offer.status}</Badge>
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
                                                        <Link href={`/admin/offers/edit/${offer.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(offer.id)}>
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
                        {offers.map((offer) => (
                            <Card key={offer.id}>
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                     <Image
                                        alt={offer.title}
                                        className="aspect-square rounded-md object-contain"
                                        height="48"
                                        src={offer.image.imageUrl}
                                        data-ai-hint={offer.image.imageHint}
                                        width="48"
                                    />
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{offer.title}</CardTitle>
                                        <CardDescription>{offer.subtitle}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                 <Link href={`/admin/offers/edit/${offer.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(offer.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">Code</span>
                                      <Badge variant="outline">{offer.code}</Badge>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">Discount</span>
                                      <span>{offer.discount}%</span>
                                  </div>
                                   <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">Status</span>
                                      <Badge variant={getStatusVariant(offer.status)} className="capitalize">{offer.status}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                                      {format(new Date(offer.startDate), 'PP')} - {format(new Date(offer.endDate), 'PP')}
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

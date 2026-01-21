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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';


const initialTags = [
    { id: 1, name: 'Fresh', slug: 'fresh', productCount: 50 },
    { id: 2, name: 'Organic', slug: 'organic', productCount: 30 },
    { id: 3, name: 'Sale', slug: 'sale', productCount: 15 },
    { id: 4, name: 'Healthy', slug: 'healthy', productCount: 75 },
    { id: 5, name: 'Frozen', slug: 'frozen', productCount: 20 },
    { id: 6, name: 'New', slug: 'new', productCount: 10 },
];

type Tag = typeof initialTags[0];


export default function AdminTagsPage() {
    const [tags, setTags] = useState(initialTags);

    const handleDelete = (id: number) => {
        setTags(tags.filter(c => c.id !== id));
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Tags</CardTitle>
                        <CardDescription>Manage your product tags.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" asChild>
                         <Link href="/admin/tags/create">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Tag
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
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">Products</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tags.map((tag) => (
                                    <TableRow key={tag.id}>
                                        <TableCell className="font-medium">{tag.name}</TableCell>
                                        <TableCell>{tag.slug}</TableCell>
                                        <TableCell className="text-right">{tag.productCount}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/tags/edit/${tag.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tag.id)}>
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
                        {tags.map((tag) => (
                            <Card key={tag.id}>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-lg">
                                        {tag.name}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                     <Link href={`/admin/tags/edit/${tag.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tag.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold">Slug:</span> {tag.slug}</p>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-sm text-muted-foreground">{tag.productCount} products</p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}

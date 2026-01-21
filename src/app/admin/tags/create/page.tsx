'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function CreateTagPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically save the new tag
        console.log({ name, slug });
        toast({
            title: "Tag Created",
            description: `The tag "${name}" has been successfully created.`,
        });
        router.push('/admin/tags');
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/tags">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Add New Tag
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Tag Details</CardTitle>
                        <CardDescription>Enter the details for the new tag.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                             <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    className="w-full"
                                    value={name}
                                    onChange={handleNameChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    type="text"
                                    className="w-full"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Button type="submit">Save Tag</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

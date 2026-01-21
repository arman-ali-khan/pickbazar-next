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

const initialTags = [
    { id: 1, name: 'Fresh', slug: 'fresh', productCount: 50 },
    { id: 2, name: 'Organic', slug: 'organic', productCount: 30 },
    { id: 3, name: 'Sale', slug: 'sale', productCount: 15 },
    { id: 4, name: 'Healthy', slug: 'healthy', productCount: 75 },
    { id: 5, name: 'Frozen', slug: 'frozen', productCount: 20 },
    { id: 6, name: 'New', slug: 'new', productCount: 10 },
];

export default function EditTagPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const tagId = parseInt(params.id, 10);
    
    const [tag, setTag] = useState(() => initialTags.find(t => t.id === tagId));
    
    const [name, setName] = useState(tag?.name || '');
    const [slug, setSlug] = useState(tag?.slug || '');

    useEffect(() => {
        const foundTag = initialTags.find(t => t.id === tagId);
        if (foundTag) {
            setTag(foundTag);
            setName(foundTag.name);
            setSlug(foundTag.slug);
        } else {
            notFound();
        }
    }, [tagId]);


    if (!tag) {
        return null; 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ id: tag.id, name, slug });
        toast({
            title: "Tag Updated",
            description: `The tag "${name}" has been successfully updated.`,
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
                    Edit Tag
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Tag Details</CardTitle>
                        <CardDescription>Update the details for the tag.</CardDescription>
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
                                    onChange={(e) => setName(e.target.value)}
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
                        <Button type="submit">Update Tag</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

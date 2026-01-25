
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
import { useSupabase } from '@/lib/supabase/provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTagPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { supabase } = useSupabase();
    const tagId = parseInt(params.id, 10);
    
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTag = async () => {
            if (isNaN(tagId)) {
                notFound();
                return;
            }

            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('id', tagId)
                .single();

            if (error || !data) {
                toast({ variant: 'destructive', title: 'Error', description: 'Tag not found.' });
                notFound();
                return;
            }

            setName(data.name);
            setSlug(data.slug);
            setLoading(false);
        };
        fetchTag();
    }, [tagId, supabase, toast]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('tags')
            .update({ name, slug })
            .eq('id', tagId);
        
        setLoading(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: "Error Updating Tag",
                description: error.message,
            });
        } else {
             toast({
                title: "Tag Updated",
                description: `The tag "${name}" has been successfully updated.`,
            });
            router.push('/admin/tags');
        }
    };

    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-3">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="grid gap-3">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                        <Skeleton className="h-10 w-28" />
                    </CardFooter>
                </Card>
            </main>
        );
    }

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
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Tag'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </main>
    );
}

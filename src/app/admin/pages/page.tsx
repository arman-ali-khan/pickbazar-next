
'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Page {
  slug: string;
  title: string;
}

export default function AdminPagesManager() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);

    const getPages = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('pages').select('slug, title').order('title');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching pages', description: error.message });
            setPages([]);
        } else {
            setPages(data);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getPages();
    }, [getPages]);

    if (loading) {
        return (
             <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({length: 6}).map((_, i) => (
                             <Card key={i} className="flex items-center justify-between p-4">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-9 w-24" />
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Page Manager</CardTitle>
                    <CardDescription>Edit the content of your site's static pages.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map((page) => (
                        <Card key={page.slug} className="flex items-center justify-between p-4">
                            <h3 className="font-semibold">{page.title}</h3>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/pages/edit/${page.slug}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                            </Button>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </main>
    );
}

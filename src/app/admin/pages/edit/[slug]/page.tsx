
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/lib/supabase/provider';
import TiptapEditor from '@/components/tiptap-editor';
import { Textarea } from '@/components/ui/textarea';

type PageData = {
    slug: string;
    title: string;
    content: any;
};

const PageEditor = () => {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const { supabase } = useSupabase();
    const { toast } = useToast();

    const [page, setPage] = useState<PageData | null>(null);
    const [content, setContent] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const slug = params.slug;

    const fetchPage = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('pages').select('*').eq('slug', slug).single();
        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'Page not found.' });
            notFound();
            return;
        }
        setPage(data);
        setTitle(data.title);
        setContent(data.content);
        setLoading(false);
    }, [slug, supabase, toast]);

    useEffect(() => {
        fetchPage();
    }, [fetchPage]);

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase.from('pages').update({ title, content }).eq('slug', slug);
        if (error) {
            toast({ variant: 'destructive', title: 'Error saving page', description: error.message });
        } else {
            toast({ title: 'Page Saved', description: `"${title}" has been updated.` });
            router.push('/admin/pages');
        }
        setIsSaving(false);
    };

    const renderEditor = () => {
        if (!content) return null;

        switch (slug) {
            case 'privacy-policy':
            case 'terms-and-conditions':
                return (
                    <TiptapEditor
                        content={content.html || ''}
                        onChange={(newHtml) => setContent({ html: newHtml })}
                    />
                );
            case 'contact':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label>Address</Label>
                            <Input value={content.address || ''} onChange={(e) => setContent({...content, address: e.target.value})} />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input type="email" value={content.email || ''} onChange={(e) => setContent({...content, email: e.target.value})} />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input value={content.phone || ''} onChange={(e) => setContent({...content, phone: e.target.value})} />
                        </div>
                    </div>
                );
            case 'faq':
                const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
                    const newFaqs = [...content.faqs];
                    newFaqs[index][field] = value;
                    setContent({ faqs: newFaqs });
                };
                const addFaq = () => {
                    setContent({ faqs: [...content.faqs, { question: '', answer: '' }] });
                };
                const removeFaq = (index: number) => {
                    const newFaqs = content.faqs.filter((_: any, i: number) => i !== index);
                    setContent({ faqs: newFaqs });
                };
                return (
                    <div className="space-y-4">
                        {content.faqs.map((faq: any, index: number) => (
                            <Card key={index} className="p-4">
                                <div className="flex justify-end mb-2">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFaq(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Question</Label>
                                    <Input value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} />
                                    <Label>Answer</Label>
                                    <Textarea value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} />
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={addFaq}><PlusCircle className="mr-2 h-4 w-4" /> Add FAQ</Button>
                    </div>
                );
            case 'about':
                return <p>Editing for the 'About Us' page requires specific fields and is not yet implemented in this generic editor.</p>;
            default:
                return <p>No editor available for this page type.</p>;
        }
    };

    if (loading) return <p>Loading editor...</p>;

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/pages">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Page
                </h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>
                        <Label htmlFor="page-title">Page Title</Label>
                        <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl font-bold h-auto p-0 border-none focus-visible:ring-0" />
                    </CardTitle>
                    <CardDescription>Slug: <span className="font-mono bg-muted p-1 rounded-sm">{slug}</span></CardDescription>
                </CardHeader>
                <CardContent>
                    {renderEditor()}
                </CardContent>
                <CardFooter className="justify-end border-t pt-6">
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                </CardFooter>
            </Card>
        </main>
    );
};

export default PageEditor;

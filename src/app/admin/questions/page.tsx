'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, MessageSquare } from "lucide-react";
import Link from 'next/link';
import type { AdminQuestion } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { format } from 'date-fns';
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

const getStatusVariant = (status: AdminQuestion['status']) => {
    return status === 'Answered' ? 'secondary' : 'default';
};

const QUESTIONS_PER_PAGE = 10;

export default function AdminQuestionsPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [questions, setQuestions] = useState<AdminQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const getQuestions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admin_questions');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching questions', description: error.message });
        } else {
            setQuestions(data as AdminQuestion[]);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        getQuestions();
    }, [getQuestions]);

    const handleDelete = async (questionId: number) => {
        const { error } = await supabase.from('questions').delete().eq('id', questionId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting question', description: error.message });
        } else {
            toast({ title: 'Question deleted successfully' });
            getQuestions();
        }
    };

    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    const paginatedQuestions = questions.slice(
        (currentPage - 1) * QUESTIONS_PER_PAGE,
        currentPage * QUESTIONS_PER_PAGE
    );
    
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <CardFooter>
                <div className="flex items-center justify-between w-full">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{Math.min((currentPage - 1) * QUESTIONS_PER_PAGE + 1, questions.length)}</strong> to <strong>{Math.min(currentPage * QUESTIONS_PER_PAGE, questions.length)}</strong> of <strong>{questions.length}</strong> questions
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardFooter>
        );
    };

    if (loading) {
        return (
            <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-64" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-48" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Skeleton className="h-12 w-12 rounded-md" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-full" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-32 mt-1" />
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Questions Management</CardTitle>
                    <CardDescription>View, answer, and manage customer questions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {questions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No questions found.</p>
                    ) : (
                        <>
                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Question/Answer</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedQuestions.map((question) => (
                                            <TableRow key={question.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-12 w-12 rounded-md border">
                                                            <Image src={question.product.image.imageUrl} alt={question.product.name} data-ai-hint={question.product.image.imageHint} fill className="object-contain p-1" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{question.product.name}</p>
                                                            <Button variant="link" asChild className="p-0 h-auto text-xs">
                                                                <Link href={`/products/${question.product.id}`}>View Product</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={question.author.avatar.imageUrl} alt={question.author.name} data-ai-hint={question.author.avatar.imageHint} />
                                                            <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <p className="font-medium">{question.author.name}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <p className="font-semibold text-sm truncate">Q: {question.question}</p>
                                                    {question.answer && <p className="text-sm text-muted-foreground mt-1 truncate">A: {question.answer}</p>}
                                                </TableCell>
                                                <TableCell suppressHydrationWarning>{format(new Date(question.date), 'PP')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(question.status)}>{question.status}</Badge>
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
                                                                <Link href={`/admin/questions/answer/${question.id}`}>
                                                                    <MessageSquare className="mr-2 h-4 w-4" /> Answer
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(question.id)}>
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
                                {paginatedQuestions.map((question) => (
                                    <Card key={question.id}>
                                        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={question.author.avatar.imageUrl} alt={question.author.name} data-ai-hint={question.author.avatar.imageHint} />
                                                <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <CardTitle className="text-base flex justify-between">
                                                    <span>{question.author.name}</span>
                                                    <Badge variant={getStatusVariant(question.status)}>{question.status}</Badge>
                                                </CardTitle>
                                                <CardDescription suppressHydrationWarning>{format(new Date(question.date), 'PPp')}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/admin/questions/answer/${question.id}`}>
                                                            <MessageSquare className="mr-2 h-4 w-4" /> Answer
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(question.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-semibold text-sm mb-2">Q: {question.question}</p>
                                            {question.answer && <p className="text-sm text-muted-foreground mb-4">A: {question.answer}</p>}
                                            
                                            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                                                <div className="relative h-12 w-12 rounded-md border flex-shrink-0">
                                                    <Image src={question.product.image.imageUrl} alt={question.product.name} data-ai-hint={question.product.image.imageHint} fill className="object-contain p-1" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{question.product.name}</p>
                                                    <Button variant="link" asChild className="p-0 h-auto text-xs">
                                                        <Link href={`/products/${question.product.id}`}>View Product</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
                {renderPagination()}
            </Card>
        </main>
    );
}

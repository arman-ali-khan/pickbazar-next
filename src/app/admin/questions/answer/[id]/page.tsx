'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { questionsForAdmin as initialQuestions } from '@/lib/data';
import type { AdminQuestion } from '@/lib/data';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


export default function AnswerQuestionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const questionId = parseInt(params.id, 10);
    
    const [question, setQuestion] = useState<AdminQuestion | undefined>(() => initialQuestions.find(q => q.id === questionId));
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        const foundQuestion = initialQuestions.find(q => q.id === questionId);
        if (foundQuestion) {
            setQuestion(foundQuestion);
            if (foundQuestion.answer) {
                setAnswer(foundQuestion.answer);
            }
        } else {
            notFound();
        }
    }, [questionId]);


    if (!question) {
        return null; 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically save the answer
        console.log({ questionId: question.id, answer });
        toast({
            title: "Answer Submitted",
            description: `The answer has been successfully submitted.`,
        });
        router.push('/admin/questions');
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/questions">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Answer Question
                </h1>
            </div>
             <form onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="grid auto-rows-max gap-4 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Question Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border">
                                    <div className="relative h-16 w-16 rounded-md border flex-shrink-0">
                                        <Image src={question.product.image.imageUrl} alt={question.product.name} data-ai-hint={question.product.image.imageHint} fill className="object-contain p-1" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base">{question.product.name}</p>
                                        <Button variant="link" asChild className="p-0 h-auto text-sm">
                                            <Link href={`/products/${question.product.id}`}>View Product</Link>
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-semibold text-lg">Q: {question.question}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={question.author.avatar.imageUrl} alt={question.author.name} data-ai-hint={question.author.avatar.imageHint} />
                                            <AvatarFallback>{question.author.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>by {question.author.name}</span>
                                        <span suppressHydrationWarning>on {format(new Date(question.date), 'PP')}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="answer" className="text-base">Your Answer</Label>
                                    <Textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer here..." className="min-h-[150px]" required />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end border-t pt-6">
                                <Button type="submit">Submit Answer</Button>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="grid auto-rows-max gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">Current status is <Badge variant={question.status === 'Answered' ? 'secondary' : 'default'}>{question.status}</Badge>.</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </main>
    );
}

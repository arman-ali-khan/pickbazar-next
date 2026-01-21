'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { messages as initialMessages } from '@/lib/data';
import type { Message } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import TiptapEditor from '@/components/tiptap-editor';


export default function ViewMessagePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const messageId = parseInt(params.id, 10);
    
    const [message, setMessage] = useState<Message | undefined>(() => initialMessages.find(q => q.id === messageId));
    const [reply, setReply] = useState('');

    useEffect(() => {
        const foundMessage = initialMessages.find(q => q.id === messageId);
        if (foundMessage) {
            setMessage(foundMessage);
        } else {
            // In a real app, you'd show a not found page.
            // For now, redirecting back.
            router.push('/admin/messages');
        }
    }, [messageId, router]);


    if (!message) {
        return null; 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ messageId: message.id, reply });
        toast({
            title: "Reply Sent",
            description: `Your reply has been sent to ${message.senderEmail}.`,
        });
        setReply('');
    };

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/messages">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    View Message
                </h1>
                 <Badge variant={message.status === 'read' ? 'secondary' : 'default'} className="capitalize">{message.status}</Badge>
            </div>
             <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                    <Card>
                        <CardHeader className="border-b">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={message.avatar.imageUrl} alt={message.senderName} data-ai-hint={message.avatar.imageHint}/>
                                    <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{message.senderName}</p>
                                    <p className="text-sm text-muted-foreground">{message.senderEmail}</p>
                                </div>
                                <p className="text-sm text-muted-foreground ml-auto" suppressHydrationWarning>{format(new Date(message.date), 'PPp')}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <h2 className="font-semibold text-xl">{message.subject}</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    {message.message}
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="answer" className="text-lg font-semibold">Your Reply</Label>
                                 <TiptapEditor
                                    content={reply}
                                    onChange={(newContent) => setReply(newContent)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-6">
                            <Button type="submit">Send Reply</Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </main>
    );
}

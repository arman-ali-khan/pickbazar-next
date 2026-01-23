
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import TiptapEditor from '@/components/tiptap-editor';
import { useSupabase } from '@/lib/supabase/provider';
import { updateMessageStatus } from '@/app/actions';

interface Message {
    id: number;
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
    date: string;
    status: 'read' | 'unread' | string;
    avatar: {
        imageUrl: string | null;
        imageHint: string;
    };
}


export default function ViewMessagePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { supabase } = useSupabase();
    const messageId = parseInt(params.id, 10);
    
    const [message, setMessage] = useState<Message | null>(null);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);

    const getMessage = useCallback(async () => {
        if (isNaN(messageId)) {
            notFound();
            return;
        }
        setLoading(true);

        const { data, error } = await supabase.rpc('get_contact_message_details', { p_message_id: messageId });

        if (error || !data || data.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Message not found.' });
            notFound();
            return;
        }
        
        const fetchedMessage = data[0] as Message;
        setMessage(fetchedMessage);

        if (fetchedMessage.status === 'unread') {
            await updateMessageStatus(fetchedMessage.id, 'read');
        }

        setLoading(false);
    }, [messageId, supabase, toast]);

    useEffect(() => {
        getMessage();
    }, [getMessage]);


    if (loading || !message) {
        return <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8"><p>Loading message...</p></main>;
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a mock action as email sending is not implemented
        console.log({ messageId: message.id, reply });
        toast({
            title: "Reply Sent (Mock)",
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

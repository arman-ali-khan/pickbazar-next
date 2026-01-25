'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, Eye, MailOpen } from "lucide-react";
import Link from 'next/link';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { updateMessageStatus, deleteContactMessage } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
    id: number;
    senderName: string;
    senderemail: string;
    subject: string;
    message: string;
    date: string;
    status: 'read' | 'unread' | string;
}

const getStatusVariant = (status: Message['status']) => {
    return status === 'read' ? 'secondary' : 'default';
};

const MESSAGES_PER_PAGE = 10;

export default function AdminMessagesPage() {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [currentPage, setCurrentPage] = useState(1);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_contact_messages');
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching messages', description: error.message });
        } else {
            setMessages(data as Message[]);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);


    const handleDelete = (messageId: number) => {
        startTransition(async () => {
            const result = await deleteContactMessage(messageId);
            if(result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Message deleted' });
                fetchMessages();
            }
        });
    };
    
    const toggleReadStatus = (messageId: number, currentStatus: Message['status']) => {
        startTransition(async () => {
            const newStatus = currentStatus === 'read' ? 'unread' : 'read';
            const result = await updateMessageStatus(messageId, newStatus);
            if(result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Status updated' });
                fetchMessages();
            }
        });
    }

    const totalPages = Math.ceil(messages.length / MESSAGES_PER_PAGE);
    const paginatedMessages = messages.slice(
        (currentPage - 1) * MESSAGES_PER_PAGE,
        currentPage * MESSAGES_PER_PAGE
    );
    
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <CardFooter>
                <div className="flex items-center justify-between w-full">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{Math.min((currentPage - 1) * MESSAGES_PER_PAGE + 1, messages.length)}</strong> to <strong>{Math.min(currentPage * MESSAGES_PER_PAGE, messages.length)}</strong> of <strong>{messages.length}</strong> messages
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

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>View and manage your customer messages.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-full" />
                                                <div>
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-40 mt-1" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                             <Skeleton className="h-4 w-48" />
                                             <Skeleton className="h-3 w-56 mt-1" />
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : messages.length === 0 ? <p className="text-center text-muted-foreground py-8">No messages found.</p> : (
                    <>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sender</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedMessages.map((message) => (
                                    <TableRow key={message.id} className={cn(message.status === 'unread' && 'bg-muted/50')}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{(message.senderName || 'U').charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={cn("font-medium", message.status === 'unread' && 'font-bold')}>{message.senderName}</p>
                                                    <p className="text-xs text-muted-foreground">{message.senderemail}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className={cn("font-medium truncate", message.status === 'unread' && 'font-bold')}>{message.subject}</p>
                                            <p className="text-sm text-muted-foreground mt-1 truncate">{message.message}</p>
                                        </TableCell>
                                        <TableCell suppressHydrationWarning>{format(new Date(message.date), 'PP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(message.status)} className="capitalize">{message.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isPending}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/admin/messages/view/${message.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> View/Reply
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleReadStatus(message.id, message.status)}>
                                                        <MailOpen className="mr-2 h-4 w-4" /> Mark as {message.status === 'read' ? 'Unread' : 'Read'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(message.id)}>
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
                        {paginatedMessages.map((message) => (
                            <Card key={message.id} className={cn(message.status === 'unread' && 'border-primary')}>
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{(message.senderName || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={cn("font-semibold text-base", message.status === 'unread' && 'font-bold')}>{message.senderName}</p>
                                                <p className="text-xs text-muted-foreground">{message.senderemail}</p>
                                            </div>
                                            <Badge variant={getStatusVariant(message.status)}>{message.status}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>{format(new Date(message.date), 'PPp')}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mt-2 -mr-2" disabled={isPending}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                             <DropdownMenuItem asChild>
                                                <Link href={`/admin/messages/view/${message.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" /> View/Reply
                                                </Link>
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => toggleReadStatus(message.id, message.status)}>
                                                <MailOpen className="mr-2 h-4 w-4" /> Mark as {message.status === 'read' ? 'Unread' : 'Read'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(message.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className={cn("font-medium text-sm mb-2", message.status === 'unread' && 'font-bold')}>{message.subject}</p>
                                    <p className="text-sm text-muted-foreground truncate">{message.message}</p>
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

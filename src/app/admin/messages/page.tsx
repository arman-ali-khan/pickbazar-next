'use client';

import { useState } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
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
import { messages as initialMessages } from '@/lib/data';
import type { Message } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const getStatusVariant = (status: Message['status']) => {
    return status === 'read' ? 'secondary' : 'default';
};

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState(initialMessages);

    const handleDelete = (messageId: number) => {
        setMessages(messages.filter(m => m.id !== messageId));
    };
    
    const toggleReadStatus = (messageId: number) => {
        setMessages(messages.map(m => m.id === messageId ? { ...m, status: m.status === 'read' ? 'unread' : 'read' } : m));
    }

    return (
        <main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>View and manage your customer messages.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                {messages.map((message) => (
                                    <TableRow key={message.id} className={cn(message.status === 'unread' && 'bg-muted/50')}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={message.avatar.imageUrl} alt={message.senderName} data-ai-hint={message.avatar.imageHint} />
                                                    <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={cn("font-medium", message.status === 'unread' && 'font-bold')}>{message.senderName}</p>
                                                    <p className="text-xs text-muted-foreground">{message.senderEmail}</p>
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
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/admin/messages/view/${message.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> View/Reply
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleReadStatus(message.id)}>
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
                        {messages.map((message) => (
                            <Card key={message.id} className={cn(message.status === 'unread' && 'border-primary')}>
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={message.avatar.imageUrl} alt={message.senderName} data-ai-hint={message.avatar.imageHint} />
                                        <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-base flex justify-between">
                                            <span className={cn(message.status === 'unread' && 'font-bold')}>{message.senderName}</span>
                                            <Badge variant={getStatusVariant(message.status)}>{message.status}</Badge>
                                        </CardTitle>
                                        <CardDescription suppressHydrationWarning>{format(new Date(message.date), 'PPp')}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                             <DropdownMenuItem asChild>
                                                <Link href={`/admin/messages/view/${message.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" /> View/Reply
                                                </Link>
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => toggleReadStatus(message.id)}>
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
                </CardContent>
            </Card>
        </main>
    );
}

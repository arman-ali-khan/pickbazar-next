'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';

interface RecentMessage {
    id: number;
    senderName: string;
    subject: string;
    date: string;
}

export default function RecentMessages({ messages }: { messages: RecentMessage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Messages</CardTitle>
        <CardDescription>
          {messages.length > 0 ? `You have ${messages.length} unread messages.` : 'No new messages.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>{(message.senderName ?? 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                    <Link href={`/admin/messages/view/${message.id}`} className="hover:underline">
                      <p className="text-sm font-medium leading-none">
                        {message.senderName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.subject}
                      </p>
                    </Link>
                   <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(message.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
             <Button asChild className="w-full mt-4">
              <Link href="/admin/messages">Manage All Messages</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Inbox is clear!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
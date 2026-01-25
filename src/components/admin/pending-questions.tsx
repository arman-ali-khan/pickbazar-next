'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { AdminQuestion } from '@/lib/data';

export default function PendingQuestions({ questions }: { questions: AdminQuestion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Questions</CardTitle>
        <CardDescription>
          {questions.length > 0 ? `You have ${questions.length} questions to answer.` : 'No pending questions.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={question.author.avatar.imageUrl} alt={question.author.name} data-ai-hint={question.author.avatar.imageHint} />
                  <AvatarFallback>{(question.author.name ?? 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                        {question.author.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                        on <Link href={`/admin/products/edit/${question.product.id}`} className="hover:underline">{question.product.name}</Link>
                    </p>
                    <p className="text-xs text-muted-foreground italic truncate">
                        Q: "{question.question}"
                    </p>
                </div>
                 <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/questions/answer/${question.id}`}>Answer</Link>
                 </Button>
              </div>
            ))}
            <Button asChild className="w-full mt-4">
              <Link href="/admin/questions">Manage All Questions</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending questions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

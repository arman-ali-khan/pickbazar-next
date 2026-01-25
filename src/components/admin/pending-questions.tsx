'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { AdminQuestion } from '@/lib/data';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
          <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions.map((question) => (
                        <TableRow key={question.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border">
                                      <AvatarImage src={question.author.avatar.imageUrl ?? undefined} alt={question.author.name} data-ai-hint={question.author.avatar.imageHint} />
                                      <AvatarFallback>{(question.author.name ?? 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{question.author.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <p className="text-xs text-muted-foreground italic truncate">"{question.question}"</p>
                                <p className="text-xs text-muted-foreground mt-1">on <Link href={`/admin/products/edit/${question.product.id}`} className="hover:underline font-medium text-foreground">{question.product.name}</Link></p>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/admin/questions/answer/${question.id}`}>Answer</Link>
                                 </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button asChild className="w-full mt-4">
              <Link href="/admin/questions">Manage All Questions</Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending questions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star } from "lucide-react";
import type { AdminReview } from '@/lib/data';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function PendingReviews({ reviews }: { reviews: AdminReview[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Reviews</CardTitle>
        <CardDescription>
          {reviews.length > 0 ? `You have ${reviews.length} reviews to approve.` : 'No pending reviews.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviews.map((review) => (
                        <TableRow key={review.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border">
                                      <AvatarImage src={review.author.avatar_url ?? undefined} alt={review.author.name ?? ''} />
                                      <AvatarFallback>{(review.author.name ?? 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{review.author.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <p className="text-xs text-muted-foreground italic truncate">"{review.text}"</p>
                                <p className="text-xs text-muted-foreground mt-1">on <Link href={`/admin/products/edit/${review.product.id}`} className="hover:underline font-medium text-foreground">{review.product.name}</Link></p>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button asChild className="w-full mt-4">
              <Link href="/admin/reviews">Manage All Reviews</Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending reviews.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

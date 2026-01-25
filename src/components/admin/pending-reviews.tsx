'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star } from "lucide-react";
import type { AdminReview } from '@/lib/data';

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
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={review.author.avatar_url ?? undefined} alt={review.author.name ?? ''} />
                  <AvatarFallback>{(review.author.name ?? 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {review.author.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        on <Link href={`/admin/products/edit/${review.product.id}`} className="hover:underline">{review.product.name}</Link>
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic truncate">
                    "{review.text}"
                  </p>
                </div>
              </div>
            ))}
            <Button asChild className="w-full mt-4">
              <Link href="/admin/reviews">Manage All Reviews</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending reviews.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

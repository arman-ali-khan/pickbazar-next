
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star } from 'lucide-react'
import Link from "next/link"
import type { AdminReview } from '@/lib/data'

export default function RecentReviews({ reviews }: { reviews: AdminReview[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Pending Reviews</CardTitle>
        <CardDescription>
          {reviews.length > 0 ? `You have ${reviews.length} new reviews to approve.` : 'No pending reviews right now.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <div className="space-y-6">
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
                        on <Link href={`/products/${review.product.id}`} className="hover:underline font-medium text-foreground">{review.product.name}</Link>
                      </p>
                    </div>
                    <div className="flex items-center text-sm ml-4 shrink-0">
                      {review.rating} <Star className="h-4 w-4 ml-1 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic line-clamp-2">"{review.text}"</p>
                </div>
              </div>
            ))}
             <Button asChild className="w-full mt-6">
              <Link href="/admin/reviews">Manage All Reviews</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>All caught up! No pending reviews.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

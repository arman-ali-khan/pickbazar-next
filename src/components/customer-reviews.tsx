'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react";
import { product as detailedProduct } from "@/lib/data";

export default function CustomerReviews() {
    const reviews = detailedProduct.reviews;

  return (
    <section className="py-12 px-4 md:px-8 bg-muted/20">
        <h2 className="text-2xl font-bold mb-6 text-center">What Our Customers Are Saying</h2>
         <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
        >
            <CarouselContent>
                {reviews.map((review) => (
                    <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                            <Card className="h-full">
                                <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={review.avatar.imageUrl} alt={review.author} data-ai-hint={review.avatar.imageHint}/>
                                        <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground italic">"{review.text}"</p>
                                    <span className="font-semibold">{review.author}</span>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    </section>
  )
}

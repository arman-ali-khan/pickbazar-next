
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Product, Review, Question } from '@/lib/data';
import { Star, ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import { StarRating } from './star-rating';
import { Input } from './ui/input';


function DetailsSection({ description }: { description: string }) {
  return (
    <div id="details">
      <h3 className="text-xl font-semibold mb-4">Details</h3>
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <p>{description}</p>
      </div>
    </div>
  );
}

function RatingSummary({ product }: { product: Product }) {
    const totalReviews = product.reviewsCount;
    const chartData = product.ratingDistribution.map(item => ({
        name: `${item.rating} Star`,
        value: item.count,
        percentage: totalReviews > 0 ? (item.count / totalReviews) * 100 : 0
    })).reverse();

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Ratings & Reviews of {product.name}</h3>
            <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center space-y-2 border-r pr-6">
                        <div className="flex items-baseline gap-2">
                             <span className="text-5xl font-bold text-primary">{product.rating.toFixed(2)}</span>
                             <span className="text-2xl text-muted-foreground">/ 5</span>
                        </div>
                        <StarRating rating={product.rating} size={6} />
                        <p className="text-muted-foreground text-sm">({totalReviews} Reviews)</p>
                    </div>
                    <div className="col-span-2">
                         <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6b7280' }} width={60} />
                                <Bar dataKey="percentage" barSize={10} radius={[5, 5, 5, 5]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={1 - (index * 0.15)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ProductReviews({ reviews }: { reviews: Review[] }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-semibold">Product Reviews ({reviews.length})</h3>
                 {/* TODO: Add sorting/filtering */}
            </div>
           
            <div className="space-y-6">
                {reviews.map((review) => (
                <div key={review.id} className="flex gap-4">
                    <Avatar className="h-12 w-12">
                    <AvatarImage src={review.avatar.imageUrl} alt={review.author} data-ai-hint={review.avatar.imageHint} />
                    <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{review.author}</p>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground">
                            <span className="font-bold text-sm">{review.rating.toFixed(1)}</span>
                            <Star className="h-4 w-4 fill-white" />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                    <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                            <ThumbsUp className="h-4 w-4" /> {review.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                            <ThumbsDown className="h-4 w-4" /> {review.dislikes}
                        </Button>
                    </div>
                    </div>
                </div>
                ))}
                {reviews.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No reviews yet.</p>
                )}
            </div>
        </div>
    );
}

function QuestionsAndAnswers({ questions }: { questions: Question[] }) {
  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h3 className="text-xl font-semibold">Questions and Answers ({questions.length})</h3>
            <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search question" className="pl-9" />
                </div>
                <Button>Ask a question</Button>
            </div>
        </div>
      
      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id}>
            <p className="font-semibold">Q: {q.question}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">A:</span> {q.answer}
            </p>
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground mt-2">
                Asked on {q.date}
                </p>
                 <div className="flex items-center gap-4 text-muted-foreground">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                        <ThumbsUp className="h-4 w-4" /> {q.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                        <ThumbsDown className="h-4 w-4" /> {q.dislikes}
                    </Button>
                </div>
            </div>
          </div>
        ))}
         {questions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No questions yet.</p>
        )}
      </div>
    </div>
  );
}

export default function ProductSections({ product }: { product: Product }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
            <DetailsSection description={product.description} />
            <Separator />
            <ProductReviews reviews={product.reviews} />
            <Separator />
            <QuestionsAndAnswers questions={product.questions} />
        </div>
        <div className="lg:col-span-1">
             <RatingSummary product={product} />
        </div>
    </div>
  );
}

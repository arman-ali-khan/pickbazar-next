import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/star-rating';
import type { Product, Review, Question } from '@/lib/data';

function DescriptionTab({ description }: { description: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewsTab({ reviews }: { reviews: Review[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-4">
            <Avatar>
              <AvatarImage src={review.avatar.imageUrl} alt={review.author} data-ai-hint={review.avatar.imageHint} />
              <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{review.author}</p>
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
              <StarRating rating={review.rating} className="my-1" />
              <p className="text-sm text-muted-foreground">{review.text}</p>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground">No reviews yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionsTab({ questions }: { questions: Question[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions & Answers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 divide-y">
        {questions.map((q) => (
          <div key={q.id} className="pt-4 first:pt-0">
            <p className="font-semibold">Q: {q.question}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">A:</span> {q.answer}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Asked by {q.author} on {q.date}
            </p>
          </div>
        ))}
         {questions.length === 0 && (
          <p className="text-center text-muted-foreground pt-4">No questions yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProductInfoTabs({ product }: { product: Product }) {
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="reviews">Reviews ({product.reviews.length})</TabsTrigger>
        <TabsTrigger value="questions">Questions ({product.questions.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        <DescriptionTab description={product.description} />
      </TabsContent>
      <TabsContent value="reviews">
        <ReviewsTab reviews={product.reviews} />
      </TabsContent>
      <TabsContent value="questions">
        <QuestionsTab questions={product.questions} />
      </TabsContent>
    </Tabs>
  );
}

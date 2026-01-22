
'use client';
import Image from 'next/image';
import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Product, RelatedProduct, ProductReview, Question } from '@/lib/data';
import ProductCard from '@/components/product-details';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { ImagePlaceholder } from '@/lib/placeholder-images';
import ImageMagnify from './image-magnify';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, updateQuantity, selectItemQuantity, triggerFlyToCart } from '@/lib/redux/slices/cartSlice';
import { useSupabase } from '@/lib/supabase/provider';
import { Dialog, DialogTrigger } from './ui/dialog';
import { LoginDialog } from './login-dialog';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitReview } from '@/app/actions';

interface ProductPageContentProps {
    product: Product & {
        shortDescription: string;
        description: string;
        stock: number;
        images: ImagePlaceholder[];
        rating: number;
        reviewsCount: number;
        category: string;
        tags: string[];
        sku: string;
        ratingDistribution: { rating: number, count: number }[];
        reviews: ProductReview[];
        questions: Question[];
    };
    relatedProducts: RelatedProduct[];
}

function ReviewForm({ productId }: { productId: number }) {
    const { user } = useSupabase();
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState('');
    const [isPending, startTransition] = useTransition();

    if (!user) {
        return (
            <div className="text-center p-6 border rounded-lg bg-muted/50">
                <p>You must be logged in to write a review.</p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="mt-4">Login</Button>
                    </DialogTrigger>
                    <LoginDialog />
                </Dialog>
            </div>
        );
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const formData = new FormData();
            formData.append('productId', String(productId));
            formData.append('rating', String(rating));
            formData.append('text', text);

            const result = await submitReview(formData);
            if (result?.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            } else {
                toast({ title: 'Review Submitted', description: 'Thank you! Your review is pending approval.' });
                setRating(0);
                setText('');
            }
        });
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-1">
                    <p className="text-sm mr-2">Your Rating:</p>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star className={`h-6 w-6 transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        </button>
                    ))}
                </div>
                <div>
                    <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your thoughts about the product..." />
                </div>
                <Button type="submit" disabled={rating === 0 || isPending}>
                    {isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
            </form>
        </div>
    );
}

export default function ProductPageContent({ product, relatedProducts }: ProductPageContentProps) {
    const dispatch = useAppDispatch();
    const quantity = useAppSelector(selectItemQuantity(product.id));
    const [mainImage, setMainImage] = useState(product.images[0]);
    const imageRef = useRef<HTMLDivElement>(null);

    const totalReviews = product.ratingDistribution.reduce((acc, item) => acc + item.count, 0);
    
    const handleAddToCart = () => {
        dispatch(addToCart({ product }));
        if (imageRef.current) {
            const rect = imageRef.current.getBoundingClientRect();
            dispatch(triggerFlyToCart({
                imageSrc: mainImage.imageUrl,
                imageHint: mainImage.imageHint,
                startRect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                },
            }));
        }
    };

    return (
        <div>
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div>
                    <div ref={imageRef} className="aspect-square relative rounded-lg border mb-4">
                        <ImageMagnify
                            src={mainImage.imageUrl}
                            alt={product.name}
                            imageHint={mainImage.imageHint}
                            imageClassName="p-8"
                        />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {product.images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setMainImage(image)}
                                className={`aspect-square relative rounded-md border-2 ${mainImage.imageUrl === image.imageUrl ? 'border-primary' : 'border-transparent'}`}
                            >
                                <Image src={image.imageUrl} alt={`${product.name} thumbnail ${index + 1}`} data-ai-hint={image.imageHint} fill className="object-contain p-2 rounded-md" />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                    <p className="text-muted-foreground mb-4">{product.weight}</p>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">({product.reviewsCount} Reviews)</span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                        <p className="font-bold text-gray-800 text-3xl">${product.price.toFixed(2)}</p>
                        {product.originalPrice && <p className="text-lg line-through text-muted-foreground">${product.originalPrice.toFixed(2)}</p>}
                    </div>

                    <p className="text-sm text-gray-600 mb-6">{product.shortDescription}</p>

                    <div className="flex items-center gap-4 mb-6">
                        {quantity === 0 ? (
                            <Button
                                className="h-12 text-base px-10"
                                onClick={handleAddToCart}
                            >
                                Add to cart
                            </Button>
                        ) : (
                            <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-12 w-40">
                                <Button size="icon" variant="ghost" className="h-12 w-12 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity - 1 }))}>
                                    <Minus className="h-5 w-5" />
                                </Button>
                                <span className="font-bold text-base">{quantity}</span>
                                <Button size="icon" variant="ghost" className="h-12 w-12 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity + 1 }))}>
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                        <p className="text-sm text-green-600 font-semibold">{product.stock} in stock</p>
                    </div>

                    <Separator />
                    
                    <div className="text-sm text-muted-foreground mt-4 space-y-1">
                        <p><span className="font-semibold text-gray-700">SKU:</span> {product.sku}</p>
                        <p><span className="font-semibold text-gray-700">Category:</span> {product.category}</p>
                        <p><span className="font-semibold text-gray-700">Tags:</span> {product.tags.join(', ')}</p>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <Tabs defaultValue="description">
                    <TabsList>
                        <TabsTrigger value="description">Description</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews ({product.reviewsCount})</TabsTrigger>
                        <TabsTrigger value="questions">Questions ({product.questions.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description" className="py-6 text-sm text-gray-600 leading-relaxed">
                        {product.description}
                    </TabsContent>
                    <TabsContent value="reviews" className="py-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                                <div className="flex items-center gap-2 mb-2">
                                     <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <p className="font-semibold">{product.rating.toFixed(1)} out of 5</p>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">({totalReviews} customer reviews)</p>
                                <div className="space-y-2">
                                    {product.ratingDistribution.slice().reverse().map(item => (
                                        <div key={item.rating} className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">{item.rating} star</span>
                                            <Progress value={(item.count/totalReviews) * 100} className="w-40 h-2" />
                                            <span className="text-sm text-muted-foreground">{totalReviews > 0 ? ((item.count/totalReviews) * 100).toFixed(0) : 0}%</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-8" />
                                <ReviewForm productId={product.id} />
                            </div>
                             <div>
                                {product.reviews.map(review => (
                                    <div key={review.id} className="mb-6 pb-6 border-b last:border-b-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={review.author_avatar ?? undefined} alt={review.author_name ?? 'User'} />
                                                <AvatarFallback>{(review.author_name ?? 'U').charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{review.author_name}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'PP')}</p>
                                            </div>
                                            <div className="flex items-center ml-auto">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{review.text}</p>
                                        {/* Likes/dislikes can be a future feature */}
                                        {/*
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                                <ThumbsUp className="h-4 w-4" /> {review.likes}
                                            </Button>
                                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                                <ThumbsDown className="h-4 w-4" /> {review.dislikes}
                                            </Button>
                                        </div>
                                        */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="questions" className="py-6">
                        <div className="space-y-6">
                            {product.questions.map(q => (
                                <div key={q.id}>
                                    <p className="font-semibold text-sm mb-1">Q: {q.question}</p>
                                    <p className="text-sm text-gray-600">A: {q.answer}</p>
                                    <p className="text-xs text-muted-foreground mt-2">By {q.author} on {q.date}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Related Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1">
                    {relatedProducts.map((p) => (
                        <ProductCard key={p.id} product={p as Product} />
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Product, ImagePlaceholder, RelatedProduct } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ImageMagnify from './image-magnify';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, updateQuantity, selectItemQuantity, triggerFlyToCart } from '@/lib/redux/slices/cartSlice';
import { getQuickViewData } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

type QuickViewProduct = Product & {
    images: ImagePlaceholder[];
    stock: number;
    rating: number;
    shortDescription: string;
    description: string;
    category: string;
    tags: string[];
    relatedProducts: RelatedProduct[];
};

function RelatedProductCard({ product }: { product: RelatedProduct }) {
    const dispatch = useAppDispatch();
    const quantity = useAppSelector(selectItemQuantity(product.id));
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;

    return (
        <Card className="w-full overflow-hidden group border-none shadow-none rounded-lg bg-white flex flex-col">
            <CardContent className="p-0 flex flex-col flex-grow">
                <div className="bg-gray-50 rounded-md overflow-hidden aspect-[3/2] relative mb-4">
                    {hasDiscount && product.tag && (
                        <Badge className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 rounded-md px-2 text-xs font-semibold border-none">
                            {product.tag}
                        </Badge>
                    )}
                    <Image
                        src={product.image.imageUrl}
                        alt={product.name}
                        data-ai-hint={product.image.imageHint}
                        fill
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="space-y-2 flex-grow">
                    <div className="flex items-baseline gap-2">
                        <p className="font-bold text-gray-800 text-base">${product.price.toFixed(2)}</p>
                        {hasDiscount && <p className="text-sm line-through text-muted-foreground">${product.originalPrice?.toFixed(2)}</p>}
                    </div>
                    <h3 className="font-normal text-gray-600 text-sm">
                        <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors  hover:underline">{product.name} {product.weight}</Link>
                    </h3>
                </div>
                <div className="mt-4">
                    {isMounted && quantity > 0 ? (
                        <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-10">
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity - 1 }))}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-sm">{quantity}</span>
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity + 1 }))}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-between bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300 text-gray-700"
                            onClick={() => dispatch(addToCart({ product: product as Product }))}
                        >
                            <span>Add</span>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

const QuickViewSkeleton = () => (
    <>
        <div className="p-4 flex items-center justify-between container mx-auto max-w-[850px] opacity-100">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-28" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 p-8">
            <div>
                <Skeleton className="aspect-square w-full mb-4" />
                <div className="grid grid-cols-5 gap-2">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="aspect-square w-full" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    </>
);


export default function ProductQuickView({ product, children }: { product: Product, children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const quantity = useAppSelector(selectItemQuantity(product.id));
    const [detailedProduct, setDetailedProduct] = useState<QuickViewProduct | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && !detailedProduct) {
            setIsLoading(true);
            const data = await getQuickViewData(product.id);
            if (data) {
                setDetailedProduct(data as any);
            }
            setIsLoading(false);
        }
    };

    const productToDisplay = detailedProduct || product;
    const images = detailedProduct?.images || [product.image];
    const hasDiscount = productToDisplay.originalPrice && productToDisplay.originalPrice > productToDisplay.price;
    const discountPercentage = hasDiscount ? Math.round(((productToDisplay.originalPrice! - productToDisplay.price) / productToDisplay.originalPrice!) * 100) : 0;

    const handlePrevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    const handleNextImage = () => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    
    const handleQuantityIncrease = () => {
        if (quantity === 0) {
            dispatch(addToCart({ product }));
            if (imageRef.current) {
                const rect = imageRef.current.getBoundingClientRect();
                dispatch(triggerFlyToCart({
                    imageSrc: images[currentImageIndex].imageUrl,
                    imageHint: images[currentImageIndex].imageHint,
                    startRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
                }));
            }
        } else {
            dispatch(updateQuantity({ productId: product.id, newQuantity: quantity + 1 }));
        }
    };
    
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setIsScrolled(e.currentTarget.scrollTop > 0);

    useEffect(() => {
        if (open) {
            setCurrentImageIndex(0);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent 
                className="sm:max-w-[900px] p-0 max-h-[90vh] overflow-y-auto grid grid-rows-[auto_1fr]"
                onScroll={handleScroll}
            >
                <DialogTitle className="sr-only">{`Quick view for ${product.name}`}</DialogTitle>
                
                {isLoading ? <QuickViewSkeleton /> : detailedProduct ? (
                    <>
                    <div className={cn(
                        "sticky z-10 top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b transition-opacity duration-300",
                        isScrolled ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                       <div className="p-4 flex items-center justify-between container mx-auto max-w-[850px]">
                            <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 flex-shrink-0 bg-gray-100 rounded-md">
                                    <Image src={images[0].imageUrl} data-ai-hint={images[0].imageHint} alt={product.name} fill className="rounded-md object-contain p-1"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground">{product.weight}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                 <div className="flex items-baseline gap-2">
                                    <p className="font-bold text-primary text-xl">${product.price.toFixed(2)}</p>
                                    {hasDiscount && <p className="text-base line-through text-muted-foreground">${productToDisplay.originalPrice?.toFixed(2)}</p>}
                                </div>
                                {isMounted && quantity > 0 ? (
                                    <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-10 w-28">
                                        <Button size="icon" variant="ghost" className="h-10 w-8 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity - 1 }))} disabled={quantity === 0}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-bold text-sm">{quantity}</span>
                                        <Button size="icon" variant="ghost" className="h-10 w-8 text-white hover:bg-primary/90" onClick={handleQuantityIncrease}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button className="h-10 px-6" onClick={handleQuantityIncrease}>Add to cart</Button>
                                )}
                            </div>
                       </div>
                    </div>
    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 p-8">
                        <div>
                            <div ref={imageRef} className="aspect-square relative mb-4 rounded-lg">
                                 {hasDiscount && (
                                    <Badge className="absolute top-4 left-4 z-10 bg-yellow-400 text-yellow-900 rounded-md px-2 py-1 text-xs font-bold border-none">{discountPercentage}%</Badge>
                                )}
                                <ImageMagnify src={images[currentImageIndex].imageUrl} alt={product.name} imageHint={images[currentImageIndex].imageHint}/>
                                <Button variant="ghost" size="icon" className="absolute top-1/2 left-2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/50 hover:bg-white z-10" onClick={handlePrevImage}><ChevronLeft className="h-5 w-5"/></Button>
                                <Button variant="ghost" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/50 hover:bg-white z-10" onClick={handleNextImage}><ChevronRight className="h-5 w-5"/></Button>
                            </div>
                             <div className="grid grid-cols-5 gap-2">
                                {images.slice(0, 5).map((image, index) => (
                                    <button key={image.id} onClick={() => setCurrentImageIndex(index)} className={`aspect-square relative rounded-md border-2 ${currentImageIndex === index ? 'border-primary' : 'border-gray-200'}`}>
                                        <Image src={image.imageUrl} alt={`${product.name} thumbnail ${index + 1}`} data-ai-hint={image.imageHint} fill className="object-contain p-1 rounded-md" />
                                    </button>
                                ))}
                            </div>
                        </div>
    
                        <div className="flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                 <h2 className="text-3xl font-bold">{detailedProduct.name}</h2>
                                 <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-gray-300"><Heart className="h-5 w-5 text-gray-500" /></Button>
                                    <Badge className="bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1">
                                        {detailedProduct.rating.toFixed(1)}
                                        <Star className="h-4 w-4 fill-white" />
                                    </Badge>
                                 </div>
                            </div>
    
                            <p className="text-muted-foreground text-sm mb-4">{detailedProduct.weight}</p>
                            <p className="text-sm text-gray-600 mb-2">{detailedProduct.shortDescription}</p>
                            <Button variant="link" asChild className="p-0 h-auto text-primary self-start mb-4"><Link href={`/products/${detailedProduct.id}`}>Read more</Link></Button>
                            <div className="flex items-baseline gap-2 my-4">
                                <p className="font-bold text-primary text-3xl">${detailedProduct.price.toFixed(2)}</p>
                                {hasDiscount && <p className="text-lg line-through text-muted-foreground">${detailedProduct.originalPrice?.toFixed(2)}</p>}
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                               {isMounted && quantity > 0 ? (
                                   <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-12 w-32">
                                        <Button size="icon" variant="ghost" className="h-12 w-10 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity - 1 }))}><Minus className="h-5 w-5" /></Button>
                                        <span className="font-bold text-base">{quantity}</span>
                                        <Button size="icon" variant="ghost" className="h-12 w-10 text-white hover:bg-primary/90" onClick={handleQuantityIncrease}><Plus className="h-5 w-5" /></Button>
                                    </div>
                                ) : <Button className="h-12 text-base px-10" onClick={handleQuantityIncrease}>Add to cart</Button>}
                                <p className="text-sm text-muted-foreground">{detailedProduct.stock} pieces available</p>
                            </div>
                            <Separator className="my-6"/>
                             <div className="text-sm space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-800">Categories:</span>
                                    <span className="text-muted-foreground">{detailedProduct.category}</span>
                                </div>
                                {detailedProduct.tags.length > 0 && <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-800">Tags:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {detailedProduct.tags.map(tag => <Badge key={tag} variant="outline" className="font-normal border-gray-300">{tag}</Badge>)}
                                    </div>
                                </div>}
                             </div>
                        </div>
                    </div>
    
                    <div className="px-8 pb-8">
                        {detailedProduct.relatedProducts.length > 0 && <div>
                             <h3 className="font-bold text-lg mb-6">Related Products</h3>
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                                {detailedProduct.relatedProducts.map(related => <RelatedProductCard key={related.id} product={related} />)}
                             </div>
                        </div>}
                    </div>
                    </>
                ) : null }
            </DialogContent>
        </Dialog>
    );
}

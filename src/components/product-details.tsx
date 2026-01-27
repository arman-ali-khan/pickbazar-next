'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Product } from '@/lib/data';
import ProductQuickView from './product-quick-view';
import { useRef, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, updateQuantity, selectItemQuantity, triggerFlyToCart } from '@/lib/redux/slices/cartSlice';
import WishlistButton from './wishlist-button';

export default function ProductCard({ product }: { product: Product }) {
    const dispatch = useAppDispatch();
    const quantity = useAppSelector(selectItemQuantity(product.id));
    const imageRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const handleAddToCart = () => {
        dispatch(addToCart({ product }));
        if (imageRef.current) {
            const rect = imageRef.current.getBoundingClientRect();
            dispatch(triggerFlyToCart({
                imageSrc: product.image.imageUrl,
                imageHint: product.image.imageHint,
                startRect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                }
            }));
        }
    };

    return (
        <Card className="w-full overflow-hidden group border rounded-lg hover:shadow-md transition-shadow duration-200 bg-white flex flex-col">
            <CardContent style={{padding:'0'}} className="flex flex-col flex-grow">
                <ProductQuickView product={product}>
                    <div ref={imageRef} className="bg-gray-50 rounded-md overflow-hidden aspect-[3/2] relative mb-4 cursor-pointer">
                        <div className="absolute top-2 left-2 z-10">
                            <WishlistButton productId={product.id} className="h-8 w-8" />
                        </div>
                        {hasDiscount && (
                            <Badge className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 rounded-md px-2 text-xs font-semibold border-none">
                                {discountPercentage}%
                            </Badge>
                        )}
                        <Image
                            width={300}
                            height={200}
                            src={product.image.imageUrl}
                            alt={product.name}
                            data-ai-hint={product.image.imageHint}
                            className="w-full h-full object-cover p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </ProductQuickView>
                <div className=" px-2 pb-2 sm:pb-6 sm:px-6">
                <div className="space-y-2 flex-grow">
                    <div className="flex items-baseline gap-2">
                        <p className="font-bold text-gray-800 text-lg">${product.price.toFixed(2)}</p>
                        {hasDiscount && <p className="text-sm line-through text-muted-foreground">${product.originalPrice.toFixed(2)}</p>}
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
                            onClick={handleAddToCart}
                        >
                            <span>Add to cart</span>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                </div>
            </CardContent>
        </Card>
    );
}

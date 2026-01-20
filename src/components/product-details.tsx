'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Product } from '@/lib/data';
import { product as detailedProduct, relatedProducts } from '@/lib/data';
import ProductQuickView from './product-quick-view';
import { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, updateQuantity, selectItemQuantity, triggerFlyToCart } from '@/lib/redux/slices/cartSlice';

export default function ProductCard({ product }: { product: Product }) {
    const dispatch = useAppDispatch();
    const quantity = useAppSelector(selectItemQuantity(product.id));
    const imageRef = useRef<HTMLDivElement>(null);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const productForQuickView = {
        ...detailedProduct,
        ...product,
        relatedProducts: relatedProducts.filter(p => p.id !== product.id),
    };

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
            <CardContent className="p-4 flex flex-col flex-grow">
                <ProductQuickView product={productForQuickView}>
                    <div ref={imageRef} className="bg-gray-50 rounded-md overflow-hidden aspect-[3/2] relative mb-4 cursor-pointer">
                        {hasDiscount && (
                            <Badge className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 rounded-md px-2 text-xs font-semibold border-none">
                                {discountPercentage}%
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
                </ProductQuickView>
                <div className="space-y-2 flex-grow">
                    <div className="flex items-baseline gap-2">
                        <p className="font-bold text-gray-800 text-lg">${product.price.toFixed(2)}</p>
                        {hasDiscount && <p className="text-sm line-through text-muted-foreground">${product.originalPrice.toFixed(2)}</p>}
                    </div>
                    <h3 className="font-normal text-gray-600 text-sm">
                        <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors">{product.name} {product.weight}</Link>
                    </h3>
                </div>
                 <div className="mt-4">
                    {quantity === 0 ? (
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-between bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300 text-gray-700"
                            onClick={handleAddToCart}
                        >
                            <span>Add</span>
                            <Plus className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-10">
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity - 1 }))}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-sm">{quantity}</span>
                             <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-primary/90" onClick={() => dispatch(updateQuantity({ productId: product.id, newQuantity: quantity + 1 }))}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

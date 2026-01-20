'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Product } from '@/lib/data';
import { useCart } from '@/contexts/cart-context';
import { useRef } from 'react';

export default function ProductRowCard({ product }: { product: Product }) {
    const { addToCart, updateQuantity, getItemQuantity, triggerFlyToCart } = useCart();
    const quantity = getItemQuantity(product.id);
    const imageRef = useRef<HTMLDivElement>(null);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const handleAddToCart = () => {
        addToCart(product);
        if (imageRef.current) {
            triggerFlyToCart(product.image.imageUrl, product.image.imageHint, imageRef.current);
        }
    };

    return (
        <Card className="w-full overflow-hidden group border rounded-lg hover:shadow-md transition-shadow duration-200 bg-white flex flex-col sm:flex-row">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 w-full">
                <div ref={imageRef} className="bg-gray-50 rounded-md overflow-hidden relative flex-shrink-0 w-full sm:w-32 h-48 sm:h-32">
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
                <div className="flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    <h3 className="font-semibold text-lg text-gray-800 mt-1 mb-2">
                        <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors">{product.name}</Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{product.weight}</p>
                    
                    <div className="flex-grow"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-baseline gap-2">
                            <p className="font-bold text-gray-800 text-xl">${product.price.toFixed(2)}</p>
                            {hasDiscount && <p className="text-md line-through text-muted-foreground">${product.originalPrice?.toFixed(2)}</p>}
                        </div>
                        <div className="w-full sm:w-32">
                            {quantity === 0 ? (
                                <Button
                                    variant="outline"
                                    className="w-full flex items-center justify-between"
                                    onClick={handleAddToCart}
                                >
                                    <span>Add</span>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-10">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-primary/90" onClick={() => updateQuantity(product.id, quantity - 1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold text-sm">{quantity}</span>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-primary/90" onClick={() => updateQuantity(product.id, quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

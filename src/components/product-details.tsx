'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Product } from '@/lib/data';

export default function ProductCard({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return (
        <Card className="w-full overflow-hidden group border rounded-lg hover:shadow-lg transition-shadow duration-300 bg-white">
            <CardContent className="p-4 space-y-4">
                <div className="bg-gray-50 rounded-md overflow-hidden aspect-square relative">
                    {hasDiscount && (
                        <Badge className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-900 rounded-md px-2 text-xs font-semibold">
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
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{product.weight}</p>
                    <h3 className="font-semibold text-gray-800 truncate text-base">
                        <Link href="#" className="hover:text-primary transition-colors">{product.name}</Link>
                    </h3>
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-baseline gap-2">
                            <p className="font-bold text-primary text-lg">${product.price.toFixed(2)}</p>
                            {hasDiscount && <p className="text-sm line-through text-muted-foreground">${product.originalPrice.toFixed(2)}</p>}
                        </div>
                        {product.id === 1 ? (
                             <div className="flex items-center bg-primary rounded-full h-9">
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-primary-foreground hover:bg-primary/90" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold w-5 text-center text-sm text-primary-foreground">{quantity}</span>
                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-primary-foreground hover:bg-primary/90" onClick={() => setQuantity(q => q + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="outline" className="h-9 px-4 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Cart
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

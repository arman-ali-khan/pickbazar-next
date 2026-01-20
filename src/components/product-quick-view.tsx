'use client';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import type { Product } from '@/lib/data';
import { useCart } from '@/contexts/cart-context';

export default function ProductQuickView({ product, children }: { product: Product, children: React.ReactNode }) {
    const { addToCart, updateQuantity, getItemQuantity } = useCart();
    const quantity = getItemQuantity(product.id);

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[800px] p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <div>
                        <div className="aspect-square relative">
                             <Image
                                src={product.image.imageUrl}
                                alt={product.name}
                                data-ai-hint={product.image.imageHint}
                                fill
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                        <p className="text-muted-foreground text-sm mb-4">{product.weight}</p>
                        
                        <div className="flex items-baseline gap-2 mb-4">
                            <p className="font-bold text-gray-800 text-3xl">${product.price.toFixed(2)}</p>
                            {product.originalPrice && <p className="text-lg line-through text-muted-foreground">${product.originalPrice.toFixed(2)}</p>}
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            An apple is a sweet, edible fruit produced by an apple tree... A classic choice for a healthy snack.
                        </p>

                        <div className="flex items-center gap-4 mb-6">
                            {quantity === 0 ? (
                                <Button
                                    variant="outline"
                                    className="w-full flex items-center justify-center bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300 text-gray-700 h-12 text-base"
                                    onClick={() => addToCart(product)}
                                >
                                    <span>Add to cart</span>
                                </Button>
                            ) : (
                                <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-md h-12 w-40">
                                    <Button size="icon" variant="ghost" className="h-12 w-12 text-white hover:bg-primary/90" onClick={() => updateQuantity(product.id, quantity - 1)}>
                                        <Minus className="h-5 w-5" />
                                    </Button>
                                    <span className="font-bold text-base">{quantity}</span>
                                    <Button size="icon" variant="ghost" className="h-12 w-12 text-white hover:bg-primary/90" onClick={() => updateQuantity(product.id, quantity + 1)}>
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                         <div className="text-sm">
                            <p><span className="font-semibold">SKU:</span> FRT-001</p>
                            <p><span className="font-semibold">Category:</span> Fruits & Vegetables</p>
                            <p><span className="font-semibold">Tags:</span> fresh, healthy, organic</p>
                         </div>

                        <Button variant="link" asChild className="p-0 h-auto mt-4">
                             <Link href={`/products/${product.id}`}>Read More</Link>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

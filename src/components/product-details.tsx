"use client";
import { useState } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import type { Product } from '@/lib/data';
import Link from 'next/link';

export default function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleAddToCart = () => {
    toast({
      title: "Added to cart!",
      description: `${quantity} x ${product.name} has been added to your cart.`,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
        <span className="text-sm text-muted-foreground mt-1 block">{product.weight}</span>
      </div>

      <p className="text-muted-foreground leading-relaxed text-sm">{product.shortDescription} <Link href="#details" className="text-primary font-medium hover:underline">See more</Link></p>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-primary">${product.discountPrice.toFixed(2)}</span>
        <span className="text-xl line-through text-muted-foreground/80">${product.price.toFixed(2)}</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button size="lg" className="w-full sm:w-auto flex-1 text-base" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Shopping Cart
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Add to wishlist">
            <Heart className="h-5 w-5" />
        </Button>
      </div>

       <div className="text-sm text-green-600 font-medium">
        <span>{product.stock} pieces available</span>
      </div>


      <div className="border-t pt-4 space-y-2 text-sm">
        <p><strong>Category:</strong> <Link href="#" className="text-primary hover:underline">{product.category}</Link></p>
        <p><strong>Sellers:</strong> <Link href="#" className="text-primary hover:underline">Grocery Shop</Link></p>
      </div>
    </div>
  );
}

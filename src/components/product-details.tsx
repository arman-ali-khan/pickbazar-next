"use client";
import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/data';
import { useToast } from "@/hooks/use-toast"
import { StarRating } from '@/components/star-rating';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
        <div className="mt-3 flex items-center gap-2">
          <StarRating rating={product.rating} />
          <span className="text-sm text-muted-foreground">({product.reviewsCount} reviews)</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-primary">${product.discountPrice.toFixed(2)}</span>
        <span className="text-xl line-through text-muted-foreground">${product.price.toFixed(2)}</span>
      </div>

      <p className="text-muted-foreground leading-relaxed">{product.description}</p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center border rounded-md">
          <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold" aria-live="polite">{quantity}</span>
          <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button size="lg" className="w-full sm:w-auto flex-1" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>
      </div>

      <div className="text-sm text-green-600 flex items-center gap-2 font-medium">
        <Check className="h-5 w-5" />
        <span>In Stock: {product.stock} units available</span>
      </div>

      <div className="border-t pt-4 space-y-3 text-sm">
        <p><strong>SKU:</strong> <span className="text-muted-foreground">{product.sku}</span></p>
        <div className="flex items-center gap-2">
          <strong>Category:</strong> <Badge variant="secondary">{product.category}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <strong>Tags:</strong>
          {product.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>
      </div>

      <div className="border rounded-lg p-4 flex items-center gap-4 bg-muted/20">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h4 className="font-semibold">100% Secure Payment</h4>
          <p className="text-sm text-muted-foreground">SSL secured checkout</p>
        </div>
      </div>
    </div>
  );
}

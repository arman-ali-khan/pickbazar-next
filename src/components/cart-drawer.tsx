'use client';

import { useCart } from '@/contexts/cart-context';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { ShoppingBag, Plus, Minus, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartDrawer() {
  const { cartItems, updateQuantity, removeFromCart, totalItems, subtotal } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div id="cart-trigger-button" className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
          <Button className="h-auto p-0 flex flex-col gap-0 rounded-l-md rounded-r-none shadow-lg">
            <div className="flex items-center gap-2 px-3 py-2">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-sm font-medium">{totalItems} Items</span>
            </div>
            <div className="bg-white text-primary rounded-md w-full py-1 px-4 text-sm font-bold m-1">
              ${subtotal.toFixed(2)}
            </div>
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 flex flex-col bg-white">
        <div className="flex items-center justify-between p-6 border-b">
          <SheetTitle className="flex items-center gap-3 text-primary">
            <ShoppingBag className="h-6 w-6" />
            <span className="text-lg font-semibold text-gray-800">{totalItems} Items</span>
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 w-8 h-8">
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </SheetClose>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {cartItems.length > 0 ? (
                 <div className="divide-y">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-6">
                            <div className="flex flex-col items-center justify-between bg-gray-100 rounded-full h-24 w-10 py-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-sm text-gray-800">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative h-16 w-16 flex-shrink-0">
                                <Image src={item.image.imageUrl} alt={item.name} data-ai-hint={item.image.imageHint} fill className="rounded-md object-contain" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-base text-gray-800">{item.name} {item.weight}</h4>
                                <p className="text-sm text-primary font-bold">${item.price.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.quantity} X {item.weight}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-base text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 w-6 h-6" onClick={() => removeFromCart(item.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
                </div>
            )}
        </div>
        
        <SheetFooter className="p-6 bg-white border-t mt-auto">
            <Button className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-base font-semibold relative" asChild>
                <Link href="#" className="flex items-center justify-center text-white">
                    Checkout
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-primary rounded-full px-5 py-2.5 text-sm font-bold">
                        ${subtotal.toFixed(2)}
                    </span>
                </Link>
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

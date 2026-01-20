'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';
import Image from 'next/image';
import { products } from '@/lib/data';
import Link from 'next/link';

const cartItems = [
    { ...products[0], quantity: 2, image: products[0].image },
    { ...products[1], quantity: 1, image: products[1].image },
];

export default function CartButton() {
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
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
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <span>{totalItems} Items</span>
          </SheetTitle>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto">
            {cartItems.length > 0 ? (
                 <div className="divide-y">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-6">
                            <div className="relative h-20 w-20">
                                <Image src={item.image.imageUrl} alt={item.name} data-ai-hint={item.image.imageHint} fill className="rounded-md object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} x {item.quantity}</p>
                                <p className="font-semibold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </Button>
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
        <Separator />
        <SheetFooter className="p-6 bg-muted/50">
            <div className="w-full space-y-4">
                 <div className="flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <Button className="w-full" asChild>
                    <Link href="#">Proceed to Checkout</Link>
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { Heart, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { toggleWishlist, selectIsInWishlist, selectIsTogglingWishlist } from '@/lib/redux/slices/wishlistSlice';
import { useSupabase } from '@/lib/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger } from './ui/dialog';
import { LoginDialog } from './login-dialog';
import React from 'react';

interface WishlistButtonProps extends React.ComponentProps<typeof Button> {
  productId: number;
}

export default function WishlistButton({ productId, className, ...props }: WishlistButtonProps) {
  const dispatch = useAppDispatch();
  const isInWishlist = useAppSelector(selectIsInWishlist(productId));
  const isToggling = useAppSelector(selectIsTogglingWishlist(productId));
  const { user } = useSupabase();
  const { toast } = useToast();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
        // This will be handled by the DialogTrigger, but as a safeguard
        return;
    }
    dispatch(toggleWishlist(productId)).unwrap().catch(err => {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not update wishlist. Please try again.',
        });
    });
  };
  
  if (!user) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className={cn("rounded-full w-10 h-10 border-gray-300 bg-white hover:bg-gray-100", className)} {...props}>
                    <Heart className="h-5 w-5 text-gray-500" />
                </Button>
            </DialogTrigger>
            <LoginDialog />
        </Dialog>
    );
  }

  if (isToggling) {
      return (
        <Button variant="outline" size="icon" className={cn("rounded-full w-10 h-10 border-gray-300 bg-white", className)} disabled {...props}>
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </Button>
      );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("rounded-full w-10 h-10 border-gray-300 bg-white hover:bg-gray-100", className)}
      onClick={handleToggle}
      {...props}
    >
      <Heart
        className={cn(
          "h-5 w-5 text-gray-500 transition-all",
          isInWishlist && "text-red-500 fill-red-500"
        )}
      />
    </Button>
  );
}

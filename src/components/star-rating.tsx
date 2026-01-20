import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  rating: number;
  className?: string;
  size?: number;
};

export function StarRating({ rating, className, size = 4 }: StarRatingProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            `h-${size} w-${size}`,
            i < Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground/50 fill-muted-foreground/20'
          )}
        />
      ))}
    </div>
  );
}

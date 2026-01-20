import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  rating: number;
  className?: string;
  size?: number;
  color?: string;
  fillColor?: string;
};

export function StarRating({ rating, className, size = 4, color = 'text-yellow-400', fillColor = 'fill-yellow-400' }: StarRatingProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            `h-${size} w-${size}`,
            i < Math.round(rating)
              ? `${color} ${fillColor}`
              : 'text-muted-foreground/30 fill-muted-foreground/20'
          )}
        />
      ))}
    </div>
  );
}

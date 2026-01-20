import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import { ShoppingCart } from 'lucide-react';
import type { RelatedProduct } from '@/lib/data';

function ProductCard({ product }: { product: RelatedProduct }) {
  const imageDetails = product.image.imageUrl.match(/seed\/(\d+)\/(\d+)\/(\d+)/);
  const imageWidth = imageDetails ? parseInt(imageDetails[2]) : 300;
  const imageHeight = imageDetails ? parseInt(imageDetails[3]) : 300;
  
  return (
    <Card className="w-full overflow-hidden group">
      <CardContent className="p-0">
        <div className="bg-muted/30 rounded-t-lg overflow-hidden aspect-square relative">
          <Image
            src={product.image.imageUrl}
            alt={product.name}
            data-ai-hint={product.image.imageHint}
            width={imageWidth}
            height={imageHeight}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <h3 className="font-semibold truncate">
                <Link href="#" className="hover:text-primary transition-colors">{product.name}</Link>
            </h3>
            <StarRating rating={product.rating} />
            <div className="flex justify-between items-center pt-2">
            <p className="font-bold text-primary">${product.price.toFixed(2)}</p>
            <Button size="sm" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add
            </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden lg:flex left-[-20px]"/>
        <CarouselNext className="hidden lg:flex right-[-20px]"/>
      </Carousel>
    </section>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import type { RelatedProduct } from '@/lib/data';
import { Badge } from './ui/badge';

function ProductCard({ product }: { product: RelatedProduct }) {
  const imageDetails = product.image.imageUrl.match(/seed\/\d+\/(\d+)\/(\d+)/);
  const imageWidth = imageDetails ? parseInt(imageDetails[1]) : 300;
  const imageHeight = imageDetails ? parseInt(imageDetails[2]) : 300;
  
  return (
    <Card className="w-full overflow-hidden group border rounded-lg hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-3">
        <div className="bg-muted/30 rounded-md overflow-hidden aspect-square relative mb-3">
            {product.tag && (
                <Badge variant={product.tag === 'NEW' ? 'secondary' : 'destructive'} className="absolute top-2 right-2 z-10">
                    {product.tag}
                </Badge>
            )}
          <Image
            src={product.image.imageUrl}
            alt={product.name}
            data-ai-hint={product.image.imageHint}
            width={imageWidth}
            height={imageHeight}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{product.weight}</p>
            <h3 className="font-semibold truncate text-sm">
                <Link href="#" className="hover:text-primary transition-colors">{product.name}</Link>
            </h3>
            <div className="flex justify-between items-center pt-1">
              <p className="font-bold text-primary">${product.price.toFixed(2)}</p>
              <Button size="sm" variant="outline" className="h-8">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
        {products.map((product) => (
            <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

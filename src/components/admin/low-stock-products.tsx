
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type LowStockProduct = {
    id: number;
    name: string;
    stock: number;
    featured_image_url: string;
}

export default function LowStockProducts({ products }: { products: LowStockProduct[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock Products</CardTitle>
        <CardDescription>
          Products running low on stock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="relative h-12 w-12 rounded-md border">
                    <Image src={product.featured_image_url} alt={product.name} fill className="object-contain p-1"/>
                </div>
                <div className="flex-1">
                  <Link href={`/admin/products/edit/${product.id}`} className="font-medium text-sm hover:underline">{product.name}</Link>
                </div>
                <div className="text-sm text-destructive font-bold">
                  {product.stock} left
                </div>
              </div>
            ))}
             <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/admin/products">View All Products</Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No products are low on stock.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

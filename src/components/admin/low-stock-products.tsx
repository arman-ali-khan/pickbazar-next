'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
          <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-10 w-10 rounded-md border">
                                        <Image src={product.featured_image_url} alt={product.name} fill className="object-contain p-1"/>
                                    </div>
                                    <Link href={`/admin/products/edit/${product.id}`} className="font-medium text-sm hover:underline">{product.name}</Link>
                                </div>
                            </TableCell>
                            <TableCell className="text-right text-sm text-destructive font-bold">
                                {product.stock} left
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/admin/products?tab=archived">View All Products</Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No products are low on stock.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import ProductCard from '@/components/product-details';
import { products } from '@/lib/data';

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

import ProductCard from '@/components/product-details';
import { products } from '@/lib/data';

export default function RecentlyAddedProducts() {
  const recentProducts = products.slice(4, 10);
  return (
    <section className="py-8 px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-6">Recently Added</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1">
          {recentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
    </section>
  );
}

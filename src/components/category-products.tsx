'use client';
import ProductCard from '@/components/product-details';
import { products } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ['Vegetables', 'Fruits'];

export default function CategoryProducts() {
  const filteredProducts = (category: string) => products.filter(p => p.category === category).slice(0,6);

  return (
    <section className="py-8 px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <Tabs defaultValue={TABS[0]} className="w-full">
            <TabsList>
                {TABS.map((tab) => (
                    <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
                ))}
            </TabsList>
            {TABS.map((tab) => (
                <TabsContent key={tab} value={tab}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 pt-4">
                        {filteredProducts(tab).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    </section>
  );
}

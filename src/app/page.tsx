import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductImageGallery from '@/components/product-image-gallery';
import ProductDetails from '@/components/product-details';
import ProductSections from '@/components/product-sections';
import RelatedProducts from '@/components/related-products';
import { product, relatedProducts as relatedProductsData } from '@/lib/data';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container py-8">
        <div className="mb-4">
          <Link href="#" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 rounded-lg">
          <ProductImageGallery images={product.images} />
          <ProductDetails product={product} />
        </div>
        <div className="mt-12">
          <ProductSections product={product} />
        </div>
        <div className="mt-12">
          <RelatedProducts products={relatedProductsData} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

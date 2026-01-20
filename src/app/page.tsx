import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductImageGallery from '@/components/product-image-gallery';
import ProductDetails from '@/components/product-details';
import ProductInfoTabs from '@/components/product-info-tabs';
import RelatedProducts from '@/components/related-products';
import { product, relatedProducts as relatedProductsData } from '@/lib/data';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ProductImageGallery images={product.images} />
          <ProductDetails product={product} />
        </div>
        <div className="mt-16">
          <ProductInfoTabs product={product} />
        </div>
        <div className="mt-16">
          <RelatedProducts products={relatedProductsData} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

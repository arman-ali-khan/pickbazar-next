import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import ProductPageContent from "@/components/product-page-content";
import { products, product as detailedProduct, relatedProducts } from "@/lib/data";

export default function ProductPage({ params }: { params: { id: string } }) {
  // For this example, we will use the detailed product data for any product ID.
  // In a real application, you would fetch the product data based on params.id.
  const productToShow = {
    ...detailedProduct,
    ...products.find(p => p.id === parseInt(params.id, 10))
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container py-8">
        <ProductPageContent product={productToShow} relatedProducts={relatedProducts} />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

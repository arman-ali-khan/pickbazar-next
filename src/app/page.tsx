import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroBanners from "@/components/product-image-gallery";
import OfferCarousel from "@/components/offer-carousel";
import ProductGrid from "@/components/related-products";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        <HeroBanners />
        <OfferCarousel />
        <div className="py-8 px-4 md:px-8">
            <ProductGrid />
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

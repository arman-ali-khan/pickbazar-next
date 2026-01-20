import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroBanners from "@/components/product-image-gallery";
import OfferCarousel from "@/components/offer-carousel";
import RecommendedProducts from "@/components/recommended-products";
import RecentlyAddedProducts from "@/components/recently-added-products";
import CategoryProducts from "@/components/category-products";
import CustomerReviews from "@/components/customer-reviews";
import ContactSection from "@/components/contact-section";


export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        <HeroBanners />
        <OfferCarousel />
        <RecommendedProducts />
        <RecentlyAddedProducts />
        <CategoryProducts />
        <CustomerReviews />
        <ContactSection />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

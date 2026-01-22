import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroBanners from "@/components/product-image-gallery";
import OfferCarousel from "@/components/offer-carousel";
import RecommendedProducts from "@/components/recommended-products";
import RecentlyAddedProducts from "@/components/recently-added-products";
import CustomerReviews from "@/components/customer-reviews";
import ContactSection from "@/components/contact-section";
import FaqSection from "@/components/faq-section";
import HomePageCategorySections from "@/components/home-page-category-sections";
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const { data: homeSections } = await supabase
    .from('home_page_sections')
    .select(`
      display_order,
      categories (
        id,
        name,
        icon
      )
    `)
    .order('display_order');

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        <HeroBanners />
        <OfferCarousel />
        <RecommendedProducts />
        <RecentlyAddedProducts />
        <HomePageCategorySections sections={homeSections} />
        <CustomerReviews />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

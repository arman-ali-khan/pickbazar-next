

import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroBanners from "@/components/product-image-gallery";
import OfferCarousel, { type OfferForCarousel } from "@/components/offer-carousel";
import RecommendedProducts from "@/components/recommended-products";
import RecentlyAddedProducts from "@/components/recently-added-products";
import CustomerReviews from "@/components/customer-reviews";
import ContactSection from "@/components/contact-section";
import FaqSection from "@/components/faq-section";
import { createClient } from '@/lib/supabase/server';
import PromoDialog from "@/components/promo-dialog";
import HomePageCategorySections from "@/components/home-page-category-sections";

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

  const { data: offersData, error: offersError } = await supabase
    .from('offers')
    .select('id, title, subtitle, image_url, category_ids, product_ids')
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .limit(5);

  const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('id, name');
  
  const { data } = await supabase.rpc('get_all_settings');
  const settings = data?.[0];

  let offers: OfferForCarousel[] = [];
  if (offersData && categoriesData) {
    offers = offersData.map(offer => {
        const categoryNames = offer.category_ids?.map(id => categoriesData.find(c => c.id === id)?.name).filter(Boolean) as string[];
        return {
            id: offer.id,
            title: offer.title,
            subtitle: offer.subtitle,
            image_url: offer.image_url,
            product_ids: offer.product_ids,
            categoryNames,
        };
    });
  } else {
    if (offersError) console.error("Error fetching offers for homepage:", offersError.message);
    if (categoriesError) console.error("Error fetching categories for homepage:", categoriesError.message);
  }

  return (
    <div className="bg-background min-h-screen">
      <Header logoUrl={settings?.logo_url} siteTitle={settings?.site_title} />
      <main>
        <PromoDialog />
        <HeroBanners />
        <OfferCarousel offers={offers} />
        <RecommendedProducts />
        <RecentlyAddedProducts />
        <HomePageCategorySections sections={homeSections} />
        <CustomerReviews />
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
              <FaqSection />
              <ContactSection />
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

import CartButton from "@/components/star-rating";
import CategorySidebar from "@/components/product-sections";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroBanners from "@/components/product-image-gallery";
import ProductGrid from "@/components/related-products";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        <HeroBanners />
        <div className="container grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 py-8 items-start">
          <aside className="hidden lg:block">
            <CategorySidebar />
          </aside>
          <div>
            <ProductGrid />
          </div>
        </div>
      </main>
      <Footer />
      <CartButton />
    </div>
  );
}

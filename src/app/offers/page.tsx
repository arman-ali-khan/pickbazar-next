
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

interface Offer {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  category_ids: number[] | null;
  product_ids: number[] | null;
}

const bgColors = [
  'bg-sky-100', 'bg-emerald-100', 'bg-fuchsia-100', 
  'bg-orange-100', 'bg-yellow-100', 'bg-lime-100'
];

export default async function OffersPage() {
  const supabase = createClient();
  const { data: offersData } = await supabase
    .from('offers')
    .select('id, title, subtitle, image_url, category_ids, product_ids')
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString());
  
  const offers: Offer[] = offersData || [];

  const { data: categoriesData } = await supabase.from('categories').select('id, name');
  const categories = categoriesData || [];

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Our Special Offers</h1>
          <p className="text-muted-foreground mt-4 text-lg">Take advantage of our latest deals and promotions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer, index) => {
            const categoryNames = offer.category_ids?.map(id => categories.find(c => c.id === id)?.name).filter(Boolean);
            
            const params = new URLSearchParams();
            if (categoryNames && categoryNames.length > 0) {
              params.set('categories', categoryNames.join(','));
            }
            if (offer.product_ids && offer.product_ids.length > 0) {
              params.set('offer_products', offer.product_ids.join(','));
            }
            const queryString = params.toString();
            const href = queryString ? `/shop?${queryString}` : '/shop';
            
            return (
              <div key={offer.id} className={`rounded-lg p-6 flex items-center justify-between h-48 ${bgColors[index % bgColors.length]}`}>
                <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {offer.title}
                    </h3>
                    {offer.subtitle && <p className="text-gray-600 text-sm">{offer.subtitle}</p>}
                    <Button asChild size="sm" className="font-semibold px-4 py-2 text-xs rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow">
                        <Link href={href}>Shop Now</Link>
                    </Button>
                </div>
                <div className="relative h-32 w-32 flex-shrink-0">
                    <Image 
                        src={offer.image_url || 'https://picsum.photos/seed/placeholder/200'}
                        alt={offer.title}
                        fill
                        className="object-contain"
                    />
                </div>
              </div>
            );
          })}
           {offers.length === 0 && (
            <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No active offers at the moment. Please check back later!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

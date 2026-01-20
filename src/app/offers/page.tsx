import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const offerBanners = [
  {
    title: 'Express Delivery',
    subtitle: 'With selected items',
    image: { src: 'https://picsum.photos/seed/express-delivery/200/200', hint: 'delivery person flying' },
    link: '#',
    buttonText: 'Save Now',
    bgColor: 'bg-sky-100'
  },
  {
    title: 'Cash On Delivery',
    subtitle: 'With selected items',
    image: { src: 'https://picsum.photos/seed/cash-delivery/200/200', hint: 'cash payment groceries' },
    link: '#',
    buttonText: 'Save Now',
    bgColor: 'bg-emerald-100'
  },
  {
    title: 'Gift Voucher',
    subtitle: 'With personal care items',
    image: { src: 'https://picsum.photos/seed/gift-voucher/200/200', hint: 'gift box' },
    link: '#',
    buttonText: 'Shop Coupons',
    bgColor: 'bg-fuchsia-100'
  },
  {
    title: 'Free Shipping',
    subtitle: 'On orders over $50',
    image: { src: 'https://picsum.photos/seed/free-shipping/200/200', hint: 'delivery truck' },
    link: '#',
    buttonText: 'Shop Now',
    bgColor: 'bg-orange-100'
  },
    {
    title: 'Weekly Sale',
    subtitle: 'Up to 30% off',
    image: { src: 'https://picsum.photos/seed/weekly-sale/200/200', hint: 'sale tag' },
    link: '#',
    buttonText: 'View Deals',
    bgColor: 'bg-yellow-100'
  },
  {
    title: 'New Arrivals',
    subtitle: 'Fresh & seasonal products',
    image: { src: 'https://picsum.photos/seed/new-arrivals/200/200', hint: 'fresh produce' },
    link: '#',
    buttonText: 'Explore',
    bgColor: 'bg-lime-100'
  }
];

export default function OffersPage() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Our Special Offers</h1>
          <p className="text-muted-foreground mt-4 text-lg">Take advantage of our latest deals and promotions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerBanners.map((banner, index) => (
            <div key={index} className={`rounded-lg p-6 flex items-center justify-between h-48 ${banner.bgColor}`}>
              <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-800">
                      {banner.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                      {banner.subtitle}
                  </p>
                  <Button asChild size="sm" className="font-semibold px-4 py-2 text-xs rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow">
                      <Link href={banner.link}>{banner.buttonText}</Link>
                  </Button>
              </div>
              <div className="relative h-32 w-32 flex-shrink-0">
                  <Image 
                      src={banner.image.src}
                      alt={banner.title}
                      data-ai-hint={banner.image.hint}
                      fill
                      className="object-contain"
                  />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

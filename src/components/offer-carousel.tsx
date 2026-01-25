
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export interface OfferForCarousel {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  product_ids: number[] | null;
  categoryNames?: string[];
}

const bgColors = ['bg-sky-100', 'bg-emerald-100', 'bg-fuchsia-100', 'bg-orange-100', 'bg-yellow-100'];

export default function OfferCarousel({ offers }: { offers: OfferForCarousel[] }) {

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 md:px-8">
      <Carousel
        plugins={[Autoplay({ delay: 5000 })]}
        opts={{ loop: true }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4">
          {offers.map((offer, index) => {
            const params = new URLSearchParams();
            if (offer.categoryNames && offer.categoryNames.length > 0) {
              params.set('categories', offer.categoryNames.join(','));
            }
            if (offer.product_ids && offer.product_ids.length > 0) {
              params.set('offer_products', offer.product_ids.join(','));
            }
            const queryString = params.toString();
            const href = queryString ? `/shop?${queryString}` : '/shop';

            return (
              <CarouselItem key={offer.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className={`rounded-lg p-6 flex items-center justify-between h-48 ${bgColors[index % bgColors.length]}`}>
                  <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-800">
                          {offer.title}
                      </h3>
                      {offer.subtitle && <p className="text-gray-600 text-sm">{offer.subtitle}</p>}
                      <Button asChild size="sm" className="font-semibold px-4 py-2 text-xs rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow">
                          <Link href={href}>Shop Now</Link>
                      </Button>
                  </div>
                  <div className="relative h-32 w-32">
                      <Image 
                          src={offer.image_url || 'https://picsum.photos/seed/placeholder/200'}
                          alt={offer.title}
                          fill
                          className="object-contain"
                      />
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
    </section>
  )
}

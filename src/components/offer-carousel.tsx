
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
import { useSupabase } from "@/lib/supabase/provider";
import { useState, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";

interface Offer {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  product_ids: number[] | null;
}

const bgColors = ['bg-sky-100', 'bg-emerald-100', 'bg-fuchsia-100', 'bg-orange-100', 'bg-yellow-100'];

export default function OfferCarousel() {
  const { supabase } = useSupabase();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('offers')
        .select('id, title, subtitle, image_url, product_ids')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .limit(5);

      if (error) {
        console.error("Error fetching offers for carousel:", error);
      } else {
        setOffers(data as Offer[] || []);
      }
      setLoading(false);
    };

    fetchOffers();
  }, [supabase]);

  if (loading) {
    return (
      <section className="py-8 px-4 md:px-8">
        <div className="flex gap-4">
          <Skeleton className="h-48 flex-1" />
          <Skeleton className="h-48 flex-1 hidden md:block" />
          <Skeleton className="h-48 flex-1 hidden lg:block" />
        </div>
      </section>
    );
  }
  
  if (offers.length === 0) {
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
          {offers.map((offer, index) => (
            <CarouselItem key={offer.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className={`rounded-lg p-6 flex items-center justify-between h-48 ${bgColors[index % bgColors.length]}`}>
                <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {offer.title}
                    </h3>
                    {offer.subtitle && <p className="text-gray-600 text-sm">{offer.subtitle}</p>}
                    <Button asChild size="sm" className="font-semibold px-4 py-2 text-xs rounded-full bg-white text-gray-800 hover:bg-gray-50 shadow">
                        <Link href={offer.product_ids && offer.product_ids.length > 0 ? `/shop?offer_products=${offer.product_ids.join(',')}` : '/offers'}>Shop Now</Link>
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
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
    </section>
  )
}

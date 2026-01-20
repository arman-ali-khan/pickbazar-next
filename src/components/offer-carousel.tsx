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

const offerBanners = [
  {
    title: 'Free Delivery on First Order',
    subtitle: 'Order now and get your groceries delivered for free.',
    image: 'https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/grocery-banner-2.png',
    link: '#',
    bgColor: 'bg-accent/20'
  },
  {
    title: 'Weekly Discounts on Fresh Produce',
    subtitle: 'Save up to 30% on selected fresh fruits and vegetables.',
    image: 'https://picsum.photos/seed/offer-banner2/800/600',
    link: '#',
    bgColor: 'bg-primary/10'
  }
];

export default function OfferCarousel() {
  return (
    <section className="container py-8">
      <Carousel
        plugins={[Autoplay({ delay: 5000 })]}
        opts={{ loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {offerBanners.map((banner, index) => (
            <CarouselItem key={index}>
                <div className={`grid md:grid-cols-2 items-center gap-8 rounded-lg p-8 ${banner.bgColor}`}>
                  <div className="space-y-4 text-center md:text-left">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                          {banner.title}
                      </h2>
                      <p className="text-gray-600 text-lg">
                          {banner.subtitle}
                      </p>
                      <Button asChild size="lg" className="font-semibold px-8 py-6 text-base">
                          <Link href={banner.link}>Learn More</Link>
                      </Button>
                  </div>
                  <div className="relative h-64 md:h-[300px] mt-8 md:mt-0">
                      <Image 
                          src={banner.image}
                          alt={banner.title}
                          fill
                          className="object-contain"
                      />
                  </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </Carousel>
    </section>
  )
}

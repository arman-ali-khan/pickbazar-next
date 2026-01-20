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
        <CarouselContent className="-ml-4">
          {offerBanners.map((banner, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className={`rounded-lg p-6 flex items-center justify-between h-48 ${banner.bgColor}`}>
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
                <div className="relative h-32 w-32">
                    <Image 
                        src={banner.image.src}
                        alt={banner.title}
                        data-ai-hint={banner.image.hint}
                        fill
                        className="object-contain"
                    />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2" />
      </Carousel>
    </section>
  )
}

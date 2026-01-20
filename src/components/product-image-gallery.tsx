'use client'

import * as React from "react"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

const banners = [
  {
    title: "Express Delivery",
    description: "With selected items",
    buttonText: "Save Now",
    bgColor: "bg-[#E3F2FD]",
    image: "https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/express-delivery.svg",
    alt: "Express Delivery",
    imageWidth: 160,
    imageHeight: 100,
    imageClassName: "absolute right-0 bottom-0"
  },
  {
    title: "Cash On Delivery",
    description: "With selected items",
    buttonText: "Save Now",
    bgColor: "bg-[#E8F5E9]",
    image: "https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/cod.svg",
    alt: "Cash on Delivery",
    imageWidth: 192,
    imageHeight: 100,
    imageClassName: "absolute right-0 bottom-0"
  },
  {
    title: "Gift Voucher",
    description: "With personal care items",
    buttonText: "Shop Coupons",
    bgColor: "bg-[#F3E5F5]",
    image: "https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/gift-voucher.svg",
    alt: "Gift Voucher",
    imageWidth: 128,
    imageHeight: 100,
    imageClassName: "absolute right-4 bottom-4"
  }
];

export default function HeroBanners() {
    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true })
    );

  return (
    <section className="container py-8">
       <Carousel 
         plugins={[plugin.current]}
         opts={{
            align: "start",
            loop: true,
         }}
         className="w-full"
         onMouseEnter={plugin.current.stop}
         onMouseLeave={plugin.current.reset}
       >
        <CarouselContent className="-ml-6">
          {banners.map((banner, index) => (
            <CarouselItem key={index} className="pl-6 md:basis-1/2 lg:basis-1/3">
              <div className={`${banner.bgColor} p-8 rounded-lg relative overflow-hidden text-gray-800 flex items-center h-[180px]`}>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{banner.title}</h2>
                    <p className="text-sm mb-4">{banner.description}</p>
                    <Button variant="outline" className="bg-white border-white text-gray-700">{banner.buttonText}</Button>
                  </div>
                  <Image src={banner.image} alt={banner.alt} width={banner.imageWidth} height={banner.imageHeight} className={banner.imageClassName} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 hidden md:flex bg-white/50 hover:bg-white text-gray-800 border-none" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex bg-white/50 hover:bg-white text-gray-800 border-none" />
      </Carousel>
    </section>
  );
}

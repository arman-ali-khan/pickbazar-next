import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HeroBanners() {
  return (
    <section className="bg-gray-100">
        <div className="grid md:grid-cols-2 items-center py-12 md:py-0 md:h-[450px] gap-8 px-4 md:px-8">
            <div className="space-y-4 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                    Groceries Delivered in 90 Mins
                </h1>
                <p className="text-gray-600 text-lg">
                    Get your groceries delivered to your door in as fast as 90 minutes.
                </p>
                <Button asChild size="lg" className="font-semibold px-8 py-6 text-base">
                    <Link href="#">Shop Now</Link>
                </Button>
            </div>
            <div className="relative h-64 md:h-full mt-8 md:mt-0">
                <Image 
                    src="https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/grocery-banner-2.png" 
                    alt="Grocery delivery" 
                    data-ai-hint="grocery delivery"
                    fill
                    className="object-contain"
                />
            </div>
        </div>
    </section>
  )
}

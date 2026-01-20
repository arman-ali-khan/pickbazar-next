import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { categoryData } from '@/lib/category-data';
import { ChevronRight } from 'lucide-react';

export default function HeroBanners() {
  return (
    <section className="bg-gray-100 pt-20">
        <div className="container grid md:grid-cols-[300px_1fr] items-stretch gap-4 md:h-[calc(450px-5rem)] py-8 md:py-4">
            <div className="bg-white rounded-lg shadow-sm h-full hidden md:flex flex-col">
                <h2 className="text-lg font-semibold p-4 border-b">Categories</h2>
                <div className="flex-1 overflow-y-auto p-2">
                    <ul className="space-y-1">
                        {categoryData.map((category) => (
                            <li key={category.name}>
                                <Link href={category.href} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                                    <div className="flex items-center gap-3">
                                        <category.icon className="h-5 w-5 text-muted-foreground" />
                                        <span>{category.name}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center bg-white md:bg-transparent rounded-lg md:rounded-none h-full p-8 md:p-0">
                 <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                        Groceries Delivered in 90 Mins
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Get your groceries delivered to your door in as fast as 90 minutes.
                    </p>
                    <Button asChild size="lg" className="font-semibold px-8 py-6 text-base">
                        <Link href="/shop">Shop Now</Link>
                    </Button>
                </div>
                <div className="relative h-64 md:h-full">
                    <Image 
                        src="https://storage.googleapis.com/app-pro-us-east4-prod-content/9d739818816c4c37976e1f33f114644a/grocery-banner-2.png" 
                        alt="Grocery delivery" 
                        data-ai-hint="grocery delivery"
                        fill
                        className="object-contain"
                    />
                </div>
            </div>
        </div>
    </section>
  )
}

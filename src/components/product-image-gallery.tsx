import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { categoryData } from '@/lib/category-data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HeroBanners() {
  return (
    <section className="relative w-full h-[550px]">
        <div className="absolute inset-0 z-0">
            <Image 
                src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxmcnVpdHN8ZW58MHx8fHwxNzY4OTI5MzY5fDA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Fresh fruits banner" 
                data-ai-hint="fresh fruits"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 container h-full flex items-center">
            <div className="grid md:grid-cols-[300px_1fr] items-center gap-8 w-full">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg h-full hidden md:flex flex-col text-black max-h-[450px]">
                    <h2 className="text-lg font-semibold p-4 border-b">Categories</h2>
                    <div className="flex-1 overflow-y-auto p-2">
                        <Accordion type="multiple" className="w-full">
                            {categoryData.map((category) => (
                                <AccordionItem value={category.name} key={category.name} className="border-b-0">
                                    <AccordionTrigger className="p-3 text-sm font-medium text-gray-700 hover:text-primary hover:no-underline rounded-md hover:bg-gray-100">
                                        <div className="flex items-center gap-3">
                                            <category.icon className="h-5 w-5 text-muted-foreground" />
                                            <span>{category.name}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pl-11 flex flex-col items-start">
                                        {category.sub.map((subCategory) => (
                                            <Link href={subCategory.href} key={subCategory.name} className="py-1.5 text-sm text-muted-foreground hover:text-primary">{subCategory.name}</Link>
                                        ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
                <div className="space-y-6 text-center md:text-left text-white">
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                        Groceries Delivered in 90 Mins
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200">
                        Get your groceries delivered to your door in as fast as 90 minutes.
                    </p>
                    <Button asChild size="lg" className="font-semibold px-8 py-6 text-base">
                        <Link href="/shop">Shop Now</Link>
                    </Button>
                </div>
            </div>
        </div>
    </section>
  )
}

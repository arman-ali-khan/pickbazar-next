'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import LucideIcon from './lucide-icon';
import { useSupabase } from '@/lib/supabase/provider';
import { useState, useEffect } from 'react';

interface DbCategory {
    id: number;
    name: string;
    parent_id: number | null;
    icon: string | null;
}

interface HierarchicalCategory extends DbCategory {
    sub: DbCategory[];
}


export default function HeroBanners() {
  const { supabase } = useSupabase();
  const [categoryTree, setCategoryTree] = useState<HierarchicalCategory[]>([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, name, parent_id, icon')
            .order('name');
        
        let tree: HierarchicalCategory[] = [];
        if (categoriesData) {
            const topLevel: HierarchicalCategory[] = categoriesData
                .filter(c => c.parent_id === null)
                .map(c => ({...c, sub: []}));
            
            const children: DbCategory[] = categoriesData.filter(c => c.parent_id !== null);

            topLevel.forEach(parent => {
                parent.sub = children
                    .filter(child => child.parent_id === parent.id);
            });
            tree = topLevel;
        }
        setCategoryTree(tree);
    };
    fetchCategories();
  }, [supabase]);
    
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
<<<<<<< HEAD
        <div className="relative z-10 container h-full flex items-center">
=======
        <div className="relative z-10 container mx-auto h-full flex items-center">
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
            <div className="grid md:grid-cols-[300px_1fr] items-center gap-8 w-full">
                <div className="backdrop-blur-xl rounded-lg shadow-lg h-full hidden md:flex flex-col text-black max-h-[450px]">
                    <h2 className="text-lg text-white font-semibold p-4 border-b">Categories</h2>
                    <div className="flex-1 overflow-y-auto p-2">
                        {categoryTree.length > 0 && 
                            <Accordion type="single" collapsible defaultValue={categoryTree[0]?.name} className="w-full">
                                {categoryTree.map((category) => (
                                    <AccordionItem value={category.name} key={category.id} className="border-b-0">
                                        <AccordionTrigger className="p-3 text-sm font-medium text-white hover:text-primary hover:no-underline rounded-md hover:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <LucideIcon name={category.icon} className="h-5 w-5 text-muted-foreground" />
                                                <span>{category.name}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-11 flex flex-col items-start">
                                            {category.sub.map((subCategory) => (
                                                <Link href={`/shop?category=${encodeURIComponent(subCategory.name)}`} key={subCategory.id} className="py-1.5 text-sm w-full hover:underline text-teal-600 text-muted-foreground hover:text-primary">{subCategory.name}</Link>
                                            ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        }
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

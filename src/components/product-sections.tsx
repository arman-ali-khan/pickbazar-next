'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Apple, Beef, Cookie, Dog, Home, Milk, Soup, Cake, GlassWater } from 'lucide-react';
import Link from 'next/link';

const categories = [
    { name: 'Fruits & Vegetables', icon: Apple, sub: ['Fruits', 'Vegetables'] },
    { name: 'Meat & Fish', icon: Beef, sub: ['Meat', 'Fish'] },
    { name: 'Snacks', icon: Cookie, sub: ['Chips', 'Chocolate'] },
    { name: 'Pet Care', icon: Dog, sub: ['Dog Food', 'Cat Food'] },
    { name: 'Home & Cleaning', icon: Home, sub: ['Detergent', 'Cleaning Tools'] },
    { name: 'Dairy', icon: Milk, sub: ['Milk', 'Cheese'] },
    { name: 'Cooking', icon: Soup, sub: ['Oil', 'Spices'] },
    { name: 'Breakfast', icon: Cake, sub: ['Cereal', 'Bread'] },
    { name: 'Beverage', icon: GlassWater, sub: ['Coffee', 'Juice'] },
]

export default function CategorySidebar() {
  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm">
      <Accordion type="multiple" defaultValue={['Fruits & Vegetables']} className="w-full">
        {categories.map((category) => (
          <AccordionItem value={category.name} key={category.name} className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <category.icon className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">{category.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pt-2 pl-8">
                {category.sub.map(subCategory => (
                    <li key={subCategory}>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-primary">{subCategory}</Link>
                    </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

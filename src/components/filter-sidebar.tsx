'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { products } from '@/lib/data';
import { Star } from 'lucide-react';

const categories = [...new Set(products.map(p => p.category))];
const maxPrice = Math.ceil(Math.max(...products.map(p => p.price)));

interface FilterSidebarProps {
  onFilterChange: (filters: {
    categories: string[];
    priceRange: number[];
    rating: number;
  }) => void;
  initialCategories?: string[];
}

export default function FilterSidebar({ onFilterChange, initialCategories = [] }: FilterSidebarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [priceRange, setPriceRange] = useState([0, maxPrice]);
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    onFilterChange({
      categories: selectedCategories,
      priceRange,
      rating: selectedRating,
    });
  }, [selectedCategories, priceRange, selectedRating, onFilterChange]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSelectedRating(0);
  };

  return (
    <aside className="w-full h-full lg:border-r lg:p-6 lg:bg-white lg:overflow-y-auto">
      <div className="flex justify-between items-center mb-6 px-6 lg:px-0 pt-6 lg:pt-0">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear All
        </Button>
      </div>
      <Accordion type="multiple" defaultValue={['categories', 'price', 'rating']} className="w-full px-6 lg:px-0">
        <AccordionItem value="categories">
          <AccordionTrigger className="font-semibold">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryChange(category)}
                  />
                  <Label htmlFor={category} className="font-normal">{category}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price">
          <AccordionTrigger className="font-semibold">Price</AccordionTrigger>
          <AccordionContent>
            <div className="pt-4">
              <Slider
                min={0}
                max={maxPrice}
                step={1}
                value={priceRange}
                onValueChange={setPriceRange}
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="rating">
          <AccordionTrigger className="font-semibold">Rating</AccordionTrigger>
          <AccordionContent>
            <RadioGroup value={String(selectedRating)} onValueChange={(value) => setSelectedRating(Number(value))} className="pt-2">
              {[4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(rating)} id={`rating-${rating}`} />
                  <Label htmlFor={`rating-${rating}`} className="flex items-center font-normal">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-2 text-muted-foreground">& up</span>
                  </Label>
                </div>
              ))}
                 <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="rating-any" />
                  <Label htmlFor="rating-any" className="font-normal">Any Rating</Label>
                </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Slider } from './ui/slider';

interface FilterSidebarProps {
  onFilterChange: (filters: {
    categories: string[];
    rating: number;
    priceRange: [number, number];
  }) => void;
  initialCategories?: string[];
  allCategories: { name: string, subcategories: string[] }[];
  maxPrice: number;
}

export default function FilterSidebar({ onFilterChange, initialCategories = [], allCategories, maxPrice }: FilterSidebarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedRating, setSelectedRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);

  // Sync price range when maxPrice prop changes (e.g., new search results)
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleApplyFilters = () => {
    onFilterChange({
        categories: selectedCategories,
        rating: selectedRating,
        priceRange: priceRange,
    });
  };

  const handleClearFilters = () => {
    const newPriceRange: [number, number] = [0, maxPrice];
    setSelectedCategories([]);
    setSelectedRating(0);
    setPriceRange(newPriceRange);
    onFilterChange({
      categories: [],
      rating: 0,
      priceRange: newPriceRange
    });
  };

  return (
    <aside className="w-full h-full lg:border-r lg:p-6 lg:bg-white lg:overflow-y-auto">
      <div className="flex justify-between items-center mb-4 px-6 lg:px-0 pt-6 lg:pt-0">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear All
        </Button>
      </div>
      <div className="px-6 lg:px-0 mb-4">
        <Button onClick={handleApplyFilters} className="w-full">Apply Filters</Button>
      </div>
      <Accordion type="multiple" defaultValue={['categories', 'price', 'rating']} className="w-full px-6 lg:px-0">
        <AccordionItem value="categories">
          <AccordionTrigger className="font-semibold">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {allCategories.map(category => (
                 <Accordion key={category.name} type="single" collapsible>
                    <AccordionItem value={category.name} className="border-b-0">
                      <div className="flex items-center space-x-2">
                          <Checkbox
                              id={`parent-${category.name}`}
                              checked={selectedCategories.includes(category.name)}
                              onCheckedChange={() => handleCategoryChange(category.name)}
                          />
                          <AccordionTrigger className="flex-1 p-0 hover:no-underline font-semibold">
                            <Label htmlFor={`parent-${category.name}`} className="font-semibold cursor-pointer">
                                {category.name}
                            </Label>
                          </AccordionTrigger>
                      </div>
                      <AccordionContent className="pl-6 pt-2 space-y-2">
                          {category.subcategories.map(sub => (
                              <div key={sub} className="flex items-center space-x-2">
                                  <Checkbox
                                      id={sub}
                                      checked={selectedCategories.includes(sub)}
                                      onCheckedChange={() => handleCategoryChange(sub)}
                                  />
                                  <Label htmlFor={sub} className="font-normal cursor-pointer">{sub}</Label>
                              </div>
                          ))}
                      </AccordionContent>
                    </AccordionItem>
                </Accordion>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="font-semibold">Price</AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={maxPrice}
                step={1}
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

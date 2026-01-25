import { Apple, Beef, Cookie, Dog, Home, Milk, Soup, Cake, GlassWater } from 'lucide-react';

export const categoryData = [
    { name: 'Fruits & Vegetables', icon: Apple, href: '/shop?category=Vegetables', sub: [
        { name: 'Fruits', href: '/shop?category=Fruits' },
        { name: 'Vegetables', href: '/shop?category=Vegetables' },
    ] },
    { name: 'Meat & Fish', icon: Beef, href: '/shop?category=Meat', sub: [
        { name: 'Meat', href: '/shop?category=Meat' },
        { name: 'Fish', href: '/shop?category=Fish' },
    ] },
    { name: 'Snacks', icon: Cookie, href: '/shop?category=Snacks', sub: [
        { name: 'Chips', href: '/shop?category=Chips' },
        { name: 'Chocolate', href: '/shop?category=Chocolate' },
    ] },
    { name: 'Pet Care', icon: Dog, href: '/shop?category=Pet%20Care', sub: [
        { name: 'Dog Food', href: '/shop?category=Dog%20Food' },
        { name: 'Cat Food', href: '/shop?category=Cat%20Food' },
    ] },
    { name: 'Home & Cleaning', icon: Home, href: '/shop?category=Home%20&%20Cleaning', sub: [
        { name: 'Detergent', href: '/shop?category=Detergent' },
        { name: 'Cleaning Tools', href: '/shop?category=Cleaning%20Tools' },
    ] },
    { name: 'Dairy', icon: Milk, href: '/shop?category=Dairy', sub: [
        { name: 'Milk', href: '/shop?category=Milk' },
        { name: 'Cheese', href: '/shop?category=Cheese' },
    ] },
    { name: 'Cooking', icon: Soup, href: '/shop?category=Cooking', sub: [
        { name: 'Oil', href: '/shop?category=Oil' },
        { name: 'Spices', href: '/shop?category=Spices' },
    ] },
    { name: 'Breakfast', icon: Cake, href: '/shop?category=Breakfast', sub: [
        { name: 'Cereal', href: '/shop?category=Cereal' },
        { name: 'Bread', href: '/shop?category=Bread' },
    ] },
    { name: 'Beverage', icon: GlassWater, href: '/shop?category=Beverage', sub: [
        { name: 'Coffee', href: '/shop?category=Coffee' },
        { name: 'Juice', href: '/shop?category=Juice' },
    ] },
];

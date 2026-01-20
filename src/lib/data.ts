import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string): ImagePlaceholder => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) {
    return { id: 'not-found', description: 'Image not found', imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'error' };
  }
  return image;
};

export const products = [
  {
    id: 1,
    name: 'Apples',
    weight: '1lb',
    price: 1.60,
    originalPrice: 2.00,
    image: getImage('apple_main'),
  },
  {
    id: 2,
    name: 'Baby Spinach',
    price: 0.60,
    weight: '2lb',
    image: getImage('related_prod_1'),
  },
  {
    id: 3,
    name: 'Blueberries',
    price: 3.00,
    weight: '1lb',
    image: getImage('related_prod_2'),
  },
  { id: 4, name: 'Brussels Sprout', price: 3.69, image: getImage('related_prod_3'), weight: '1lb', originalPrice: 4.50 },
  { id: 5, name: 'Clementines', price: 2.50, image: getImage('related_prod_4'), weight: '1lb', originalPrice: 2.75 },
  { id: 6, name: 'Sweet Corn', price: 4.00, image: getImage('related_prod_5'), weight: '1lb' },
  { id: 7, name: 'Cucumber', price: 2.59, image: getImage('related_prod_6'), weight: '1lb' },
  { id: 8, name: 'Dates', price: 8.69, image: getImage('related_prod_7'), weight: '1lb', originalPrice: 10.00 },
  { id: 9, name: 'French Green Beans', price: 1.20, image: getImage('related_prod_8'), weight: '1lb' },
  { id: 10, name: 'Radish', price: 2.11, weight: '1lbs', image: getImage('radish') },
];



export const product = {
  id: 1,
  name: 'Apples',
  weight: '3lb',
  shortDescription: 'An apple is a sweet, edible fruit produced by an apple tree...',
  description: "An apple is a sweet, edible fruit produced by an apple tree (Malus domestica). Apple trees are cultivated worldwide and are the most widely grown species in the genus Malus. The tree originated in Central Asia, where its wild ancestor, Malus sieversii, is still found today. Apples have been grown for thousands of years in Asia and Europe and were brought to North America by European colonists. Apples have religious and mythological significance in many cultures, including Norse, Greek and European Christian traditions. The skin of ripe apples is generally red, yellow, green, pink, or russetted, though many bi- or tri-colored cultivars may be found.",
  price: 2.00,
  discountPrice: 1.60,
  stock: 18,
  images: [
    getImage('apple_main'),
    getImage('apple_thumb_1'),
    getImage('apple_thumb_2'),
    getImage('apple_thumb_3'),
    getImage('apple_thumb_4'),
  ],
  rating: 4.67,
  reviewsCount: 3,
  category: 'Fruits & Vegetables',
  tags: ['fresh', 'healthy', 'organic'],
  sku: 'FRT-001',
  ratingDistribution: [
      { rating: 5, count: 1 },
      { rating: 4, count: 2 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
  ],
  reviews: [
    {
      id: 1,
      author: 'Customer 1',
      avatar: getImage('avatar_1'),
      rating: 4.0,
      date: 'March 11, 2023',
      text: 'Good not yummy',
      likes: 7,
      dislikes: 5
    },
    {
      id: 2,
      author: 'Customer 2',
      avatar: getImage('avatar_2'),
      rating: 5.0,
      date: 'March 11, 2023',
      text: 'Good quality and fresh apples',
      likes: 4,
      dislikes: 0
    },
    {
      id: 3,
      author: 'Customer 3',
      avatar: getImage('avatar_3'),
      rating: 5.0,
      date: 'March 11, 2023',
      text: 'Excellent and tasty apples',
      likes: 10,
      dislikes: 1
    },
  ],
  questions: [
    {
      id: 1,
      question: 'How long I can store this product?',
      answer: 'Hi, in freezer you can store them for about 2 weeks in freezer.',
      author: 'CuriousCustomer',
      date: 'March 17, 2023',
      likes: 2,
      dislikes: 0
    },
    {
      id: 2,
      question: 'How many apples will be there on 1 lbs',
      answer: '3-4 pcs approximately',
      author: 'VeggieLover',
      date: 'March 17, 2023',
      likes: 5,
      dislikes: 1
    },
    {
      id: 3,
      question: 'Do you have green apples as well?',
      answer: 'Unfortunately, no.',
      author: 'AppleFan',
      date: 'March 17, 2023',
      likes: 1,
      dislikes: 0
    },
  ],
};

export const relatedProducts = products.slice(1, 9).map(p => ({...p, id: p.id, name: p.name, price: p.price, image: p.image, weight: p.weight, tag: p.originalPrice ? `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%` : undefined}));

export type Product = (typeof products)[0] & { originalPrice?: number };
export type RelatedProduct = typeof relatedProducts[0];
export type Review = typeof product.reviews[0];
export type Question = typeof product.questions[0];

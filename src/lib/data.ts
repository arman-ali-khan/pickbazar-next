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
    id: 11,
    name: "Wegman's Carrots",
    weight: '1lbs',
    price: 2.10,
    image: getImage('carrots'),
    category: 'Vegetables',
    rating: 4.5,
  },
  {
    id: 12,
    name: 'White Radish',
    price: 2.99,
    weight: '1lbs',
    image: getImage('white_radish'),
    category: 'Vegetables',
    rating: 4.2,
  },
  { 
    id: 10,
    name: 'Radish',
    price: 2.11,
    weight: '1lbs',
    image: getImage('radish'),
    originalPrice: 2.59,
    category: 'Vegetables',
    rating: 4.8,
  },
  { 
    id: 13,
    name: 'Baby Radish',
    price: 1.00,
    image: getImage('baby_radish'),
    weight: '1lbs',
    category: 'Vegetables',
    rating: 3.9,
  },
  {
    id: 1,
    name: 'Apples',
    weight: '1lb',
    price: 1.60,
    originalPrice: 2.00,
    image: getImage('apple_main'),
    category: 'Fruits',
    rating: 4.7,
  },
  {
    id: 2,
    name: 'Baby Spinach',
    price: 0.60,
    weight: '2lb',
    image: getImage('related_prod_1'),
    category: 'Vegetables',
    rating: 4.3,
  },
  {
    id: 3,
    name: 'Blueberries',
    price: 3.00,
    weight: '1lb',
    image: getImage('related_prod_2'),
    category: 'Fruits',
    rating: 4.9,
  },
  { id: 4, name: 'Brussels Sprout', price: 3.69, image: getImage('related_prod_3'), weight: '1lb', originalPrice: 4.50, category: 'Vegetables', rating: 4.1 },
  { id: 5, name: 'Clementines', price: 2.50, image: getImage('related_prod_4'), weight: '1lb', originalPrice: 2.75, category: 'Fruits', rating: 4.6 },
  { id: 6, name: 'Sweet Corn', price: 1.80, image: getImage('related_prod_5'), weight: '1lb', category: 'Vegetables', rating: 4.4 },
  { id: 7, name: 'Cucumber', price: 0.75, image: getImage('related_prod_6'), weight: '1pc', category: 'Vegetables', rating: 4.0 },
  { id: 8, name: 'Dates', price: 4.50, image: getImage('related_prod_7'), weight: '250g', category: 'Fruits', rating: 4.9 },
  { id: 9, name: 'French Green Beans', price: 2.20, image: getImage('related_prod_8'), weight: '1lb', category: 'Vegetables', rating: 4.2 },
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

export const relatedProducts = products.slice(1, 13).map(p => ({...p, id: p.id, name: p.name, price: p.price, image: p.image, weight: p.weight, tag: p.originalPrice ? `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%` : undefined}));

export const orders = [
  {
    id: 'ORD-001',
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: getImage('avatar_1'),
    },
    date: '2024-07-28T14:48:00.000Z',
    total: 125.50,
    status: 'Delivered' as const,
    paymentMethod: 'Credit Card',
    items: [
      { id: 1, name: 'Apples', quantity: 2, price: 1.60 },
      { id: 2, name: 'Baby Spinach', quantity: 1, price: 0.60 },
    ]
  },
  {
    id: 'ORD-002',
    customer: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      avatar: getImage('avatar_2'),
    },
    date: '2024-07-27T10:30:00.000Z',
    total: 89.90,
    status: 'Processing' as const,
    paymentMethod: 'PayPal',
    items: [
      { id: 3, name: 'Blueberries', quantity: 1, price: 3.00 },
      { id: 4, name: 'Brussels Sprout', quantity: 2, price: 3.69 },
    ]
  },
  {
    id: 'ORD-003',
    customer: {
      name: 'Peter Jones',
      email: 'peter.jones@example.com',
      avatar: getImage('avatar_3'),
    },
    date: '2024-07-26T18:00:00.000Z',
    total: 210.00,
    status: 'Shipped' as const,
    paymentMethod: 'Credit Card',
    items: [
       { id: 5, name: 'Clementines', price: 2.50, quantity: 5 },
    ]
  },
  {
    id: 'ORD-004',
    customer: {
      name: 'Mary Johnson',
      email: 'mary.johnson@example.com',
      avatar: getImage('avatar_1'),
    },
    date: '2024-07-25T09:15:00.000Z',
    total: 55.20,
    status: 'Cancelled' as const,
    paymentMethod: 'Cash on Delivery',
    items: [
       { id: 6, name: 'Sweet Corn', price: 1.80, quantity: 10 },
    ]
  },
    {
    id: 'ORD-005',
    customer: {
      name: 'Chris Lee',
      email: 'chris.lee@example.com',
      avatar: getImage('avatar_2'),
    },
    date: '2024-07-28T11:00:00.000Z',
    total: 45.75,
    status: 'Pending' as const,
    paymentMethod: 'Credit Card',
    items: [
      { id: 7, name: 'Cucumber', quantity: 5, price: 0.75 },
      { id: 8, name: 'Dates', quantity: 1, price: 4.50 },
    ],
  },
];

export const transactions = [
    { id: 'TRN-001', orderId: 'ORD-001', date: '2024-07-28T14:48:00.000Z', amount: 125.50, paymentMethod: 'Credit Card', status: 'Completed' as const },
    { id: 'TRN-002', orderId: 'ORD-002', date: '2024-07-27T10:30:00.000Z', amount: 89.90, paymentMethod: 'PayPal', status: 'Completed' as const },
    { id: 'TRN-003', orderId: 'ORD-003', date: '2024-07-26T18:00:00.000Z', amount: 210.00, paymentMethod: 'Credit Card', status: 'Completed' as const },
    { id: 'TRN-004', orderId: 'ORD-004', date: '2024-07-25T09:15:00.000Z', amount: 55.20, paymentMethod: 'Cash on Delivery', status: 'Pending' as const },
    { id: 'TRN-005', orderId: 'ORD-005', date: '2024-07-28T11:00:00.000Z', amount: 45.75, paymentMethod: 'Credit Card', status: 'Failed' as const },
];

export const admins = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@pickbazar.com',
    role: 'Admin',
    avatar: getImage('avatar_1'),
    status: 'active' as const,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@pickbazar.com',
    role: 'Super Admin',
    avatar: getImage('avatar_2'),
    status: 'active' as const,
  },
  {
    id: 3,
    name: 'Peter Jones',
    email: 'peter.jones@pickbazar.com',
    role: 'Manager',
    avatar: getImage('avatar_3'),
    status: 'inactive' as const,
  },
];

export const reviewsForAdmin = [
    {
      id: 1,
      author: {
        name: 'Customer 1',
        avatar: getImage('avatar_1'),
      },
      product: {
          id: 1,
          name: 'Apples',
          image: getImage('apple_main')
      },
      rating: 4.0,
      date: '2024-07-28T10:00:00.000Z',
      text: 'Good not yummy. A bit sour but overall okay for the price. Would probably buy again if on sale.',
      status: 'Approved' as const,
    },
    {
      id: 2,
      author: {
        name: 'Customer 2',
        avatar: getImage('avatar_2'),
      },
      product: {
          id: 2,
          name: 'Baby Spinach',
          image: getImage('related_prod_1')
      },
      rating: 5.0,
      date: '2024-07-27T15:30:00.000Z',
      text: 'Good quality and fresh spinach. Perfect for my morning smoothies. Highly recommend!',
      status: 'Pending' as const,
    },
    {
      id: 3,
      author: {
        name: 'Customer 3',
        avatar: getImage('avatar_3'),
      },
      product: {
          id: 3,
          name: 'Blueberries',
          image: getImage('related_prod_2')
      },
      rating: 5.0,
      date: '2024-07-26T09:00:00.000Z',
      text: 'Excellent and tasty blueberries. Sweet and juicy, great for snacks or in yogurt.',
      status: 'Approved' as const,
    },
     {
      id: 4,
      author: {
        name: 'Mary Johnson',
        avatar: getImage('avatar_1'),
      },
      product: {
          id: 4,
          name: 'Brussels Sprout',
          image: getImage('related_prod_3')
      },
      rating: 2.0,
      date: '2024-07-25T11:45:00.000Z',
      text: 'They were a bit bitter for my taste. Packaging was good though.',
      status: 'Hidden' as const,
    }
];


export type Product = (typeof products)[0] & { originalPrice?: number, rating?: number };
export type RelatedProduct = typeof relatedProducts[0];
export type Review = typeof product.reviews[0];
export type Question = typeof product.questions[0];
export type Order = typeof orders[0];
export type Transaction = typeof transactions[0];
export type Admin = typeof admins[0];
export type AdminReview = typeof reviewsForAdmin[0];

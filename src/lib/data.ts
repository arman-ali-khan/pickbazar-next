

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

// This object can be removed as product data is now dynamic.
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
  ratingDistribution: [],
  reviews: [],
  questions: [],
};

export const relatedProducts = products.slice(1, 13).map(p => ({...p, id: p.id, name: p.name, price: p.price, image: p.image, weight: p.weight, tag: p.originalPrice ? `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%` : undefined}));


export const admins = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@pickbazar.com',
    role: 'admin',
    avatar: getImage('avatar_1'),
    status: 'active' as const,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@pickbazar.com',
    role: 'super-admin',
    avatar: getImage('avatar_2'),
    status: 'active' as const,
  },
  {
    id: 3,
    name: 'Peter Jones',
    email: 'peter.jones@pickbazar.com',
    role: 'manager',
    avatar: getImage('avatar_3'),
    status: 'inactive' as const,
  },
];

export const messages = [
  {
    id: 1,
    senderName: 'Alice',
    senderEmail: 'alice@example.com',
    subject: 'Question about my order',
    message: 'Hi, I have a question about my recent order #ORD-001. Can you please help me with the tracking information?',
    date: '2024-07-29T10:00:00.000Z',
    status: 'unread' as const,
    avatar: getImage('avatar_1'),
  },
  {
    id: 2,
    senderName: 'Bob',
    senderEmail: 'bob@example.com',
    subject: 'Feedback on product',
    message: 'Just wanted to say I love the fresh apples! They were delicious.',
    date: '2024-07-28T15:30:00.000Z',
    status: 'read' as const,
    avatar: getImage('avatar_2'),
  },
  {
    id: 3,
    senderName: 'Charlie',
    senderEmail: 'charlie@example.com',
    subject: 'Partnership inquiry',
    message: 'Hello, I am interested in partnering with Pickbazar. Who can I talk to about this?',
    date: '2024-07-28T09:00:00.000Z',
    status: 'read' as const,
    avatar: getImage('avatar_3'),
  },
   {
    id: 4,
    senderName: 'Diana',
    senderEmail: 'diana@example.com',
    subject: 'Issue with delivery',
    message: 'My order was marked as delivered, but I have not received it. Order ID is ORD-003.',
    date: '2024-07-29T11:45:00.000Z',
    status: 'unread' as const,
    avatar: getImage('avatar_1'),
  }
];

export const userNotifications = [
  {
    id: 1,
    type: 'order_shipped' as const,
    title: 'Order Shipped!',
    message: 'Your order #ORD-12345 has been shipped and is on its way.',
    date: '2024-08-01T10:00:00.000Z',
    isRead: false,
    link: '/profile/my-orders/ORD-12345'
  },
  {
    id: 2,
    type: 'promotion' as const,
    title: 'Weekend Sale is Live',
    message: 'Get 20% off on all fresh vegetables this weekend. Don\'t miss out!',
    date: '2024-07-31T12:30:00.000Z',
    isRead: false,
    link: '/offers'
  },
  {
    id: 3,
    type: 'review_request' as const,
    title: 'How was your purchase?',
    message: 'We\'d love to hear your feedback on the "Fresh Apples" you recently purchased.',
    date: '2024-07-30T18:00:00.000Z',
    isRead: true,
    link: '/products/1'
  },
  {
    id: 4,
    type: 'security' as const,
    title: 'Password Changed Successfully',
    message: 'Your password was changed from a new device. If this wasn\'t you, please secure your account.',
    date: '2024-07-29T11:45:00.000Z',
    isRead: true,
    link: '/profile/change-password'
  },
];

// --- Type Definitions ---

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type Product = (typeof products)[0] & { originalPrice?: number, rating?: number };
export type RelatedProduct = typeof relatedProducts[0];
export type Admin = typeof admins[0];
export type Message = typeof messages[0];
export type UserNotification = typeof userNotifications[0];

export interface Question {
  id: number;
  question: string;
  answer: string;
  author: string;
  date: string;
  likes: number;
  dislikes: number;
}

export interface ProductReview {
  id: number;
  rating: number;
  text: string | null;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
}

export interface AdminReview {
  id: number;
  rating: number;
  text: string | null;
  status: 'Pending' | 'Approved' | 'Hidden';
  created_at: string;
  author: {
    name: string | null;
    avatar_url: string | null;
  };
  product: {
    id: number;
    name: string;
    featured_image_url: string;
  };
}

export interface UserReview {
    id: number;
    rating: number;
    text: string | null;
    status: string;
    created_at: string;
    product_name: string;
    product_image: string;
    product_id: number;
}

export interface AdminQuestion {
  id: number;
  question: string;
  answer: string | null;
  status: 'Pending' | 'Answered';
  date: string;
  author: {
    name: string;
    avatar: {
      imageUrl: string;
      imageHint: string;
    };
  };
  product: {
    id: number;
    name: string;
    image: {
      imageUrl: string;
      imageHint: string;
    };
  };
}

export interface UserQuestion {
    id: number;
    question_text: string;
    answer_text: string | null;
    status: string;
    created_at: string;
    product_name: string;
    product_id: number;
    product_image: string;
}

import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string): ImagePlaceholder => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) {
    // Fallback for safety, though in a real app this should be handled more gracefully
    return { id: 'not-found', description: 'Image not found', imageUrl: 'https://picsum.photos/seed/error/200/200', imageHint: 'error' };
  }
  return image;
};

export const product = {
  id: 1,
  name: 'Fresh Green Asparagus',
  description: 'Asparagus is a spring vegetable, a flowering perennial plant species in the genus Asparagus. It’s a very popular vegetable, and is used in dishes around the world.',
  price: 4.99,
  discountPrice: 3.99,
  stock: 15,
  images: [
    getImage('product_main'),
    getImage('product_thumb_1'),
    getImage('product_thumb_2'),
    getImage('product_thumb_3'),
    getImage('product_thumb_4'),
  ],
  rating: 4.5,
  reviewsCount: 8,
  category: 'Vegetables',
  tags: ['fresh', 'healthy', 'organic'],
  sku: 'VEG-001',
  reviews: [
    {
      id: 1,
      author: 'Jane Doe',
      avatar: getImage('avatar_1'),
      rating: 5,
      date: '2023-04-15',
      text: 'Super fresh and delicious! Best asparagus I have had in a long time. Will definitely buy again.',
    },
    {
      id: 2,
      author: 'John Smith',
      avatar: getImage('avatar_2'),
      rating: 4,
      date: '2023-04-12',
      text: 'Very good quality, but a bit pricey. Still, worth it for the taste.',
    },
  ],
  questions: [
    {
      id: 1,
      question: 'Is this organic?',
      answer: 'Yes, this asparagus is certified organic.',
      author: 'CuriousCustomer',
      date: '2023-04-10',
    },
    {
      id: 2,
      question: 'What is the shelf life?',
      answer: 'It is best consumed within 5-7 days when stored properly in the refrigerator.',
      author: 'VeggieLover',
      date: '2023-04-11',
    },
  ],
};

export const relatedProducts = [
  {
    id: 2,
    name: 'Fresh Broccoli',
    price: 2.50,
    image: getImage('related_prod_1'),
    category: 'Vegetables',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Organic Carrots',
    price: 1.80,
    image: getImage('related_prod_2'),
    category: 'Vegetables',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Red Bell Pepper',
    price: 1.20,
    image: getImage('related_prod_3'),
    category: 'Vegetables',
    rating: 4.9,
  },
  {
    id: 5,
    name: 'Cherry Tomatoes',
    price: 3.00,
    image: getImage('related_prod_4'),
    category: 'Fruits',
    rating: 4.6,
  },
];

export type Product = typeof product;
export type RelatedProduct = typeof relatedProducts[0];
export type Review = typeof product.reviews[0];
export type Question = typeof product.questions[0];

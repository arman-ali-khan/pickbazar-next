import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import ProductPageContent from "@/components/product-page-content";
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import type { Product, RelatedProduct, Review, Question } from '@/lib/data';

// A mock to get avatar images. In a real app, this would come from user profiles.
const getImage = (id: string): ImagePlaceholder => {
    // Dummy implementation for mock data.
    const avatars: {[key: string]: string} = {
      'avatar_1': 'https://images.unsplash.com/photo-1710974481447-fb001ad9ad5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwZXJzb24lMjBmYWNlfGVufDB8fHx8MTc2ODg1Nzc2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      'avatar_2': 'https://images.unsplash.com/photo-1616002411355-49593fd89721?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3b21hbiUyMGZhY2V8ZW58MHx8fHwxNzY4NzgzNDM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    }
    return { 
        id, 
        imageUrl: avatars[id] || 'https://picsum.photos/seed/avatar/200', 
        description: 'avatar',
        imageHint: 'person face'
    };
};

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const productId = parseInt(params.id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  // 1. Fetch main product details from Supabase
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      categories ( name ),
      tags ( name )
    `)
    .eq('id', productId)
    .single();

  if (productError || !productData) {
    console.error('Error fetching product:', productError?.message);
    notFound();
  }

  // 2. Fetch related products from Supabase
  const { data: relatedProductsData } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', productData.category_id)
    .not('id', 'eq', productId)
    .limit(6);
  
  // 3. Prepare data for the `ProductPageContent` component
  // In a real app, reviews, questions, and ratings would also be fetched from the database.
  // For now, we'll use mock data for those sections.
  const mockReviews: Review[] = [
    { id: 1, author: 'Customer 1', avatar: getImage('avatar_1'), rating: 4.0, date: 'March 11, 2023', text: 'Good product, very fresh!', likes: 7, dislikes: 5 },
    { id: 2, author: 'Customer 2', avatar: getImage('avatar_2'), rating: 5.0, date: 'March 12, 2023', text: 'Excellent quality, will buy again.', likes: 10, dislikes: 0 },
  ];
  const mockQuestions: Question[] = [
    { id: 1, question: 'Is this organic?', answer: 'Yes, all our products are certified organic.', author: 'HealthNut', date: 'March 15, 2023', likes: 2, dislikes: 0 }
  ];
  const mockRatingDistribution = [
      { rating: 5, count: 20 }, { rating: 4, count: 10 }, { rating: 3, count: 2 }, { rating: 2, count: 1 }, { rating: 1, count: 0 }
  ];

  const relatedProducts: RelatedProduct[] = (relatedProductsData || []).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    image: {
        id: `product-${p.id}`,
        imageUrl: p.featured_image_url,
        imageHint: 'product image',
        description: p.name
    },
    weight: p.unit,
    tag: p.original_price && p.price < p.original_price ? `${Math.round(((p.original_price - p.price) / p.original_price) * 100)}%` : undefined,
  }));
  
  const productToShow = {
    // Required base product fields
    id: productData.id,
    name: productData.name,
    weight: productData.unit,
    price: productData.price,
    originalPrice: productData.original_price,
    image: {
        id: `product-${productData.id}`,
        imageUrl: productData.featured_image_url,
        imageHint: 'product',
        description: productData.name
    },
    // Required extended fields for ProductPageContent
    shortDescription: productData.description?.substring(0, 100) + '...' || '',
    description: productData.description || 'No description available.',
    stock: productData.stock,
    images: [
        { id: `featured-${productData.id}`, imageUrl: productData.featured_image_url, imageHint: 'featured product', description: 'featured image'}, 
        ...(productData.gallery_urls || []).map((url: string, index: number) => ({
            id: `gallery-${productData.id}-${index}`, imageUrl: url, imageHint: 'gallery image', description: `Gallery image ${index + 1}`
        }))
    ],
    category: (productData.categories as { name: string })?.name || 'N/A',
    tags: (productData.tags as { name: string }[])?.map(t => t.name) || [],
    sku: `SKU-${productData.id}`,
    // Mocked data for display
    rating: 4.5,
    reviewsCount: mockReviews.length,
    ratingDistribution: mockRatingDistribution,
    reviews: mockReviews,
    questions: mockQuestions,
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container px-2 sm:px-4 py-8">
        <ProductPageContent product={productToShow} relatedProducts={relatedProducts} />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

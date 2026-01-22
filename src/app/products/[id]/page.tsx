import CartDrawer from "@/components/cart-drawer";
import Footer from "@/components/footer";
import Header from "@/components/header";
import ProductPageContent from "@/components/product-page-content";
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import type { RelatedProduct, ProductReview, Question } from '@/lib/data';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const productId = parseInt(params.id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  // Increment view count (fire-and-forget)
  supabase.rpc('increment_product_view', { product_id_to_inc: productId }).then(({ error }) => {
    if (error) console.error('Error incrementing view count:', error);
  });

  // Fetch all product data in parallel
  const [productRes, relatedRes, reviewsRes, ratingStatsRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_categories(categories(name)), product_tags(tags(name))')
      .eq('id', productId)
      .single(),
    supabase.rpc('get_related_products', { p_id: productId, p_limit: 6 }),
    supabase.rpc('get_product_reviews', { p_product_id: productId }),
    supabase.rpc('get_product_rating_stats', { p_product_id: productId }).single(),
  ]);

  const { data: productData, error: productError } = productRes;

  if (productError || !productData) {
    console.error('Error fetching product:', productError?.message);
    notFound();
  }
  
  const { data: relatedProductsData } = relatedRes;
  const { data: reviewsData } = reviewsRes;
  const { data: ratingStatsData } = ratingStatsRes;

  // In a real app, questions would also be fetched from the database.
  // For now, we'll use mock data.
  const mockQuestions: Question[] = [
    { id: 1, question: 'Is this organic?', answer: 'Yes, all our products are certified organic.', author: 'HealthNut', date: 'March 15, 2023', likes: 2, dislikes: 0 }
  ];

  const relatedProducts: RelatedProduct[] = (relatedProductsData || []).map((p: any) => ({
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

  const categoryNames = Array.isArray(productData.product_categories) 
      ? productData.product_categories.map((pc: any) => pc.categories.name).join(', ')
      : 'N/A';
  
  const tagNames = Array.isArray(productData.product_tags)
      ? productData.product_tags.map((pt: any) => pt.tags.name)
      : [];
  
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
    category: categoryNames,
    tags: tagNames,
    sku: `SKU-${productData.id}`,
    // Data from database
    rating: ratingStatsData?.avg_rating || 0,
    reviewsCount: ratingStatsData?.total_reviews || 0,
    ratingDistribution: ratingStatsData?.rating_distribution || [],
    reviews: (reviewsData as ProductReview[] || []),
    // Mocked data for display
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

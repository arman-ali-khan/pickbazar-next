
'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getQuickViewData(productId: number) {
  if (isNaN(productId)) return null;

  const supabase = createClient();

  const productPromise = supabase
    .from('products')
    .select(
      `*, product_categories(categories(name)), product_tags(tags(name))`
    )
    .eq('id', productId)
    .single();

  const relatedPromise = supabase.rpc('get_related_products', {
    p_id: productId,
    p_limit: 4,
  });

  const [productResult, relatedResult] = await Promise.all([
    productPromise,
    relatedPromise,
  ]);

  const { data: productData, error: productError } = productResult;
  if (productError || !productData) {
    console.error('Quick view fetch error:', productError);
    return null;
  }

  const { data: relatedProductsData, error: relatedError } = relatedResult;
  if (relatedError) {
    console.error('Quick view related fetch error:', relatedError);
  }

  const categoryNames = Array.isArray(productData.product_categories)
    ? productData.product_categories.map((pc: any) => pc.categories.name).join(', ')
    : 'N/A';
  
  const tagNames = Array.isArray(productData.product_tags)
    ? productData.product_tags.map((pt: any) => pt.tags.name)
    : [];

  const detailedProduct = {
    ...productData,
    shortDescription: productData.description?.substring(0, 100) + '...' || '',
    images: [
      { id: `featured-${productData.id}`, imageUrl: productData.featured_image_url, imageHint: 'featured product', description: 'featured image'}, 
      ...(productData.gallery_urls || []).map((url: string, index: number) => ({
          id: `gallery-${productData.id}-${index}`, imageUrl: url, imageHint: 'gallery image', description: `Gallery image ${index + 1}`
      }))
    ],
    category: categoryNames,
    tags: tagNames,
    relatedProducts: (relatedProductsData || []).map((p: any) => ({
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
    })),
    // Mock data for fields not in DB
    rating: 4.5,
    reviewsCount: 0,
    ratingDistribution: [],
    reviews: [],
    questions: []
  };

  return detailedProduct;
}


export async function submitReview(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to submit a review.' }
  }

  const productId = formData.get('productId')
  const rating = formData.get('rating')
  const text = formData.get('text')

  if (!productId || !rating) {
    return { error: 'Product ID and rating are required.' }
  }

  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    product_id: Number(productId),
    rating: Number(rating),
    text: String(text)
  })

  if (error) {
    // Handle unique constraint violation (user already reviewed)
    if (error.code === '23505') {
        return { error: 'You have already reviewed this product.' };
    }
    return { error: error.message }
  }

  revalidatePath(`/products/${productId}`)
  return { success: true }
}

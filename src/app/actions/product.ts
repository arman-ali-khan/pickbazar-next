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
      tag: p.original_price && p.price < p.original_price ? `${Math.round(((p.original_price - p.price) / p.original_price) * 100)}%` : undefined,
      category: 'Related',
      rating: 4.5,
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

  const { data: reviewData, error } = await supabase.from('reviews').insert({
    user_id: user.id,
    product_id: Number(productId),
    rating: Number(rating),
    text: String(text),
    status: 'Pending'
  }).select().single();

  if (error) {
    // Handle unique constraint violation (user already reviewed)
    if (error.code === '23505') {
        return { error: 'You have already reviewed this product.' };
    }
    return { error: error.message }
  }
  
  // Admin notification for new reviews should be handled by a secure backend mechanism (e.g., database trigger)
  // to avoid RLS issues for the client.
  
  revalidatePath(`/products/${productId}`)
  return { success: true }
}

export async function submitQuestion(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to ask a question.' }
    }

    const productId = formData.get('productId');
    const questionText = formData.get('questionText');

    if (!productId || !questionText) {
        return { error: 'Product and question text are required.' };
    }

    const { data: questionData, error } = await supabase.from('questions').insert({
        user_id: user.id,
        product_id: Number(productId),
        question_text: String(questionText),
    }).select().single();

    if (error) {
        return { error: error.message };
    }

    // Notify admins
    const { error: notificationError } = await supabase.from('notifications').insert({
        title: `New question on a product`,
        message: `From: a user. Q: ${questionText}`,
        link: `/admin/questions`,
        type: 'new_question'
    });

    if (notificationError) {
        console.error("Failed to create admin notification for new question:", notificationError);
    }


    revalidatePath('/admin/questions');
    revalidatePath(`/products/${productId}`);
    return { success: true };
}

export async function answerQuestion(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Authentication required' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role;
    
    if (!role || !['admin', 'manager', 'super-admin'].includes(role)) {
        return { error: 'You do not have permission to perform this action.' };
    }

    const questionId = formData.get('questionId');
    const answerText = formData.get('answerText');

    if (!questionId || !answerText) {
        return { error: 'Question ID and answer text are required.' };
    }
    
    const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('user_id, product_id')
        .eq('id', Number(questionId))
        .single();
    
    if (questionError || !questionData) {
        return { error: 'Question not found.' };
    }

    const { error } = await supabase
        .from('questions')
        .update({
            answer_text: String(answerText),
            status: 'Answered',
            answered_at: new Date().toISOString(),
        })
        .eq('id', Number(questionId));

    if (error) {
        return { error: error.message };
    }

    const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: questionData.user_id,
        title: 'Your question has been answered',
        message: 'A question you asked about a product has been answered by our team.',
        link: `/products/${questionData.product_id}`,
        type: 'question_answered'
    });

    if (notificationError) {
        return { error: `Question answered, but failed to send notification: ${notificationError.message}` };
    }

    revalidatePath('/admin/questions');
    revalidatePath(`/products/${questionData.product_id}`);
    return { success: true };
}


export async function toggleWishlistItem(productId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to modify your wishlist.' };
  }

  const { data, error } = await supabase.rpc('toggle_wishlist_item', {
    p_user_id: user.id,
    p_product_id: productId,
  });

  if (error) {
    return { error: `Database error: ${error.message}` };
  }

  // Revalidate paths that show wishlist status
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/search');
  revalidatePath(`/products/${productId}`);
  revalidatePath('/profile/my-wishlists');

  return { success: true, status: (data as any).status };
}

export async function getWishlistIds() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase.rpc('get_user_wishlist_ids', { p_user_id: user.id });

    if (error) {
        console.error("Error fetching wishlist IDs:", error);
        return [];
    }

    return (data || []).map(item => item.product_id);
}

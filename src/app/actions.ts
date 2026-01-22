
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

    const { error } = await supabase.from('questions').insert({
        user_id: user.id,
        product_id: Number(productId),
        question_text: String(questionText),
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/questions');
    revalidatePath(`/products/${productId}`);
    return { success: true };
}

export async function answerQuestion(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In a real app, you'd have a more robust role check.
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
    
    const allowedRoles = ['admin', 'manager', 'super-admin'];
    if (!user || !allowedRoles.includes(profile?.role || '')) {
        return { error: 'You do not have permission to perform this action.' };
    }

    const questionId = formData.get('questionId');
    const answerText = formData.get('answerText');

    if (!questionId || !answerText) {
        return { error: 'Question ID and answer text are required.' };
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

    revalidatePath('/admin/questions');
    return { success: true };
}


export async function applyCoupon(code: string, cartItems: { id: number; price: number; quantity: number }[]) {
  const supabase = createClient();

  if (!code) {
    return { error: 'Please enter a coupon code.' };
  }

  // Find the offer
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('discount_percentage, category_ids, product_ids, start_date, end_date, status')
    .eq('code', code.toUpperCase())
    .single();

  if (offerError || !offer) {
    return { error: 'Invalid coupon code.' };
  }

  const now = new Date().toISOString();
  if (offer.status !== 'active' || offer.start_date > now || (offer.end_date && offer.end_date < now)) {
    return { error: 'This coupon is not active or has expired.' };
  }

  let totalDiscount = 0;
  const eligibleProductIds = new Set<number>();

  // Add products directly linked to the offer
  if (offer.product_ids) {
    offer.product_ids.forEach(id => eligibleProductIds.add(id));
  }

  // Add products from categories linked to the offer
  if (offer.category_ids && offer.category_ids.length > 0) {
    const { data: categoryProducts, error: catProdError } = await supabase
      .from('product_categories')
      .select('product_id')
      .in('category_id', offer.category_ids);
    
    if (catProdError) {
      console.error('Error fetching products in category for coupon', catProdError);
      return { error: 'Could not validate coupon categories. Please try again.' };
    }
    categoryProducts.forEach(p => eligibleProductIds.add(p.product_id));
  }
  
  if (eligibleProductIds.size === 0) {
      // This can happen if an offer has neither product_ids nor category_ids, which is a data issue but we should handle it.
      return { error: 'This coupon is not configured correctly.' };
  }

  // Calculate discount based on eligible items in the cart
  for (const item of cartItems) {
    if (eligibleProductIds.has(item.id)) {
      totalDiscount += (item.price * (offer.discount_percentage / 100)) * item.quantity;
    }
  }
  
  if (totalDiscount === 0) {
    return { error: 'This coupon is not valid for any items in your cart.' };
  }

  return { discount: totalDiscount, code: code.toUpperCase(), success: `Coupon "${code.toUpperCase()}" applied!` };
}

export async function requestRefund(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to request a refund.' };
  }

  const orderId = formData.get('orderId');
  const amount = formData.get('amount');
  const reason = formData.get('reason');

  if (!orderId || !amount || !reason) {
    return { error: 'Order ID, amount, and reason are required.' };
  }

  // Check if a refund for this order already exists
  const { data: existingRefund, error: checkError } = await supabase
    .from('refunds')
    .select('id')
    .eq('order_id', Number(orderId))
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found'
      return { error: `Could not process request: ${checkError.message}` };
  }

  if (existingRefund) {
    return { error: 'A refund request for this order already exists.' };
  }

  const { error } = await supabase.from('refunds').insert({
    order_id: Number(orderId),
    user_id: user.id,
    amount: Number(amount),
    reason: String(reason),
    status: 'Pending',
  });

  if (error) {
    return { error: `Refund request failed: ${error.message}` };
  }
  
  revalidatePath('/profile/my-orders');
  revalidatePath('/profile/my-refunds');
  return { success: true };
}

export async function updateRefundStatus(formData: FormData) {
  const supabase = createClient();
  // Role check should be done inside the server action
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const allowedRoles = ['admin', 'manager', 'super-admin'];
  if (!allowedRoles.includes(profile?.role || '')) {
      return { error: 'You do not have permission to perform this action.' };
  }

  const refundId = formData.get('refundId');
  const newStatus = formData.get('status');

  if (!refundId || !newStatus) {
    return { error: 'Refund ID and new status are required.' };
  }

  const { error } = await supabase
    .from('refunds')
    .update({ status: String(newStatus) })
    .eq('id', Number(refundId));
  
  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/refunds');
  revalidatePath('/admin');
  return { success: true };
}

export async function cancelRefund(refundId: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to cancel a refund.' }
  }

  // The RLS policy will ensure the user can only delete their own pending refund.
  const { error } = await supabase
    .from('refunds')
    .delete()
    .eq('id', refundId);

  if (error) {
    return { error: `Failed to cancel refund: ${error.message}` };
  }
  
  revalidatePath('/profile/my-refunds');
  return { success: true };
}

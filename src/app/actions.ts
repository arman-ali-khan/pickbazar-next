
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
    text: String(text)
  }).select().single();

  if (error) {
    // Handle unique constraint violation (user already reviewed)
    if (error.code === '23505') {
        return { error: 'You have already reviewed this product.' };
    }
    return { error: error.message }
  }
  
    // Notify admins
    const { error: notificationError } = await supabase.from('notifications').insert({
        title: `New review on a product`,
        message: `A new ${rating}-star review was submitted.`,
        link: `/admin/reviews`,
        type: 'new_review'
    });

    if (notificationError) {
        console.error("Failed to create admin notification for new review:", notificationError);
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

  // Notify admins
  const { error: notificationError } = await supabase.from('notifications').insert({
    title: `New refund request for order #${orderId}`,
    message: `Amount: $${amount}. Reason: ${reason}`,
    link: '/admin/refunds',
    type: 'new_refund'
  });
  
  if (notificationError) {
    console.error("Failed to create admin notification for new refund:", notificationError);
  }
  
  revalidatePath('/profile/my-refunds');
  revalidatePath('/admin/refunds');
  return { success: true };
}

export async function updateRefundStatus(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role;
  
  if (!role || !['admin', 'manager', 'super-admin'].includes(role)) {
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

export async function updateUserRole(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Authentication required' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const myRole = profile?.role;

    if (!myRole || !['admin', 'super-admin'].includes(myRole)) {
        return { error: 'You do not have permission to perform this action.' };
    }

    const userIdToUpdate = formData.get('userId') as string;
    const newRole = formData.get('role') as 'admin' | 'manager' | 'customer';

    if (!userIdToUpdate || !newRole) {
        return { error: 'User ID and new role are required.' };
    }
    
    if (userIdToUpdate === user.id) {
        return { error: 'Super-admins cannot change their own role.' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userIdToUpdate);

    if (error) {
        return { error: error.message };
    }

    const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: userIdToUpdate,
        title: 'Your role has been updated',
        message: `Your account role has been changed to ${newRole}.`,
        link: '/profile',
        type: 'role_update'
    });
    
    if (notificationError) {
        console.error(`Role updated, but failed to send notification: ${notificationError.message}`);
    }

    revalidatePath('/admin/users');
    return { success: true };
}

export async function submitContactMessage(formData: FormData) {
  const supabase = createClient();

  const rawFormData = {
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  };

  // Basic server-side validation
  if (!rawFormData.name || !rawFormData.email || !rawFormData.subject || !rawFormData.message) {
    return { error: 'All fields are required.' };
  }

  const { error } = await supabase.from('contact_messages').insert({
    name: String(rawFormData.name),
    email: String(rawFormData.email),
    subject: String(rawFormData.subject),
    message: String(rawFormData.message),
  });

  if (error) {
    return { error: `Database error: ${error.message}` };
  }

  // Notify Admins
  const { error: notificationError } = await supabase.from('notifications').insert({
    title: `New contact message from ${rawFormData.name}`,
    message: String(rawFormData.subject),
    link: '/admin/messages',
    type: 'new_message'
  });

  if (notificationError) {
    console.error("Failed to create admin notification for new contact message:", notificationError);
  }

  return { success: true };
}


export async function updateMessageStatus(messageId: number, newStatus: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required' };
    
    // RLS will handle role check, but an explicit check is good practice
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'manager', 'super-admin'].includes(profile?.role || '')) {
         return { error: 'Permission denied.' };
    }

    const { error } = await supabase.from('contact_messages').update({ status: newStatus }).eq('id', messageId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/messages');
    return { success: true };
}

export async function deleteContactMessage(messageId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'manager', 'super-admin'].includes(profile?.role || '')) {
         return { error: 'Permission denied.' };
    }

    const { error } = await supabase.from('contact_messages').delete().eq('id', messageId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/admin/messages');
    return { success: true };
}

export async function updateSettings(settings: { key: string; value: string | null }[]) {
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

  const { error } = await supabase.from('settings').upsert(settings, { onConflict: 'key' });
  
  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/settings');
  revalidatePath('/'); 
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

export async function updateOrderStatus(orderId: number, status: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required' };

    // Check if user is admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile?.role || !['admin', 'manager', 'super-admin'].includes(profile.role)) {
        return { error: 'Permission denied.' };
    }

    const { data: order, error: updateError } = await supabase.rpc('update_order_status_and_log', {
        p_order_id: orderId,
        p_new_status: status
    });

    if (updateError) {
        return { error: `Failed to update order: ${updateError.message}` };
    }

    const updatedOrder = order?.[0];

    // Insert notification
    if (updatedOrder) {
        const { error: notificationError } = await supabase.from('notifications').insert({
            user_id: updatedOrder.user_id,
            title: 'Order Status Updated',
            message: `Your order #${updatedOrder.order_number} is now ${status}.`,
            link: `/profile/my-orders/${updatedOrder.order_number}`,
            type: 'order_update'
        });

        if (notificationError) {
            console.error('Failed to create notification:', notificationError.message);
        }
    }
    
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${updatedOrder?.order_number}`);
    if (updatedOrder) revalidatePath(`/profile/my-orders/${updatedOrder.order_number}`);
    return { success: true, orderNumber: updatedOrder?.order_number };
}

export async function sendCustomNotification(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Authentication required' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const myRole = profile?.role;

    if (!myRole || !['admin', 'super-admin'].includes(myRole)) {
        return { error: 'You do not have permission to perform this action.' };
    }

    const userIds = formData.getAll('userIds') as string[];
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;
    const link = formData.get('link') as string;

    if (!userIds || userIds.length === 0 || !title) {
        return { error: 'User selection and title are required.' };
    }

    const notificationsToInsert = userIds.map(userId => ({
        user_id: userId,
        title,
        message: message || null,
        link: link || null,
        type: 'promotion'
    }));

    const { error } = await supabase.from('notifications').insert(notificationsToInsert);

    if (error) {
        return { error: `Failed to send notifications: ${error.message}` };
    }

    return { success: true, count: userIds.length };
}

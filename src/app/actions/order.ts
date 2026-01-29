'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
  const newStatus = formData.get('status') as string;

  if (!refundId || !newStatus) {
    return { error: 'Refund ID and new status are required.' };
  }

  // Fetch refund to get user_id and order_id
  const { data: refundData, error: refundError } = await supabase
    .from('refunds')
    .select('user_id, order_id')
    .eq('id', Number(refundId))
    .single();

  if (refundError || !refundData) {
      return { error: 'Refund not found.' };
  }

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('order_number')
    .eq('id', refundData.order_id)
    .single();

  if (orderError || !orderData) {
      return { error: 'Associated order not found.' };
  }
  const orderNumber = orderData.order_number;

  // Update the status
  const { error } = await supabase
    .from('refunds')
    .update({ status: newStatus })
    .eq('id', Number(refundId));
  
  if (error) {
    return { error: error.message };
  }

  // Create notification for the user
  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: refundData.user_id,
    title: `Your refund request has been ${newStatus.toLowerCase()}`,
    message: `Your refund request for order #${orderNumber} was ${newStatus.toLowerCase()}.`,
    link: `/profile/my-refunds`,
    type: 'refund_update'
  });

  if (notificationError) {
    console.error("Failed to create user notification for refund update:", notificationError);
    // Don't block the response for this, just log it.
  }

  revalidatePath('/admin/refunds');
  revalidatePath('/admin');
  revalidatePath('/profile/my-refunds');
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

export async function updateOrderStatus(orderId: number, status: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required' };

    // Check if user is admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile?.role || !['admin', 'manager', 'super-admin'].includes(profile.role)) {
        return { error: 'Permission denied.' };
    }

    const { data: order, error: updateError } = await supabase.rpc('update_order_status_and_log_v2', {
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

export async function createOrderNotification(orderNumber: string, total: number) {
    const supabase = createClient();
    const { error: notificationError } = await supabase.from('notifications').insert({
        title: `New Order Received: #${orderNumber}`,
        message: `A new order for $${total.toFixed(2)} has been placed.`,
        link: `/admin/orders/${orderNumber}`,
        type: 'new_order'
    });

    if (notificationError) {
        console.error("Failed to create new order notification (server action):", notificationError);
    }
}

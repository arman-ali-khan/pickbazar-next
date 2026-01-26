'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

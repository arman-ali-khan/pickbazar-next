'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

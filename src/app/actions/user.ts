'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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


import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import AdminBottomNavbar from '@/components/admin/admin-bottom-navbar';

async function checkAdminRole() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }
    
    // Fetch the user's role directly from the profiles table.
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
        console.error('Error checking admin role:', error.message);
        return false;
    }
    
    const role = profile?.role;
    const allowedRoles = ['admin', 'manager', 'super-admin'];
    return allowedRoles.includes(role || '');
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isAdmin = await checkAdminRole();

    if (!isAdmin) {
        redirect('/');
    }
    
    const supabase = createClient();
    const { data: settings } = await supabase.rpc('get_all_settings');

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-muted/20 w-full">
                <AdminSidebar logoUrl={settings?.logo_url} siteTitle={settings?.site_title} />
                <div className="flex flex-col flex-1 w-0 pb-16 md:pb-0">
                    <AdminHeader />
                    <main className="flex-1 p-1 sm:p-6 lg:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
                <AdminBottomNavbar />
            </div>
        </SidebarProvider>
    );
}

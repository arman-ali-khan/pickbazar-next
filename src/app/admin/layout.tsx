
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';

async function checkAdminRole() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    const allowedRoles = ['Admin', 'Manager', 'Super Admin'];
    return allowedRoles.includes(profile?.role || '');
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
    
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-muted/20 w-full">
                <AdminSidebar />
                <div className="flex flex-col flex-1 w-0">
                    <AdminHeader />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

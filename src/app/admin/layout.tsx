
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-muted/20">
                <AdminSidebar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </SidebarProvider>
    );
}

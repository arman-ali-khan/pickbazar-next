'use client';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import ProfileSidebar from '@/components/profile-sidebar';
import { usePathname } from 'next/navigation';

function toTitleCase(str: string) {
    return str.replace(/-/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export default function ProfileSubPage() {
    const pathname = usePathname();
    const pageTitle = toTitleCase(pathname.split('/').pop() || '');

    return (
        <div className="bg-muted/20 min-h-screen">
          <Header />
          <main className="container py-12">
            <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
                <ProfileSidebar />
                <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-muted-foreground">{pageTitle} - Coming Soon</h1>
                </div>
            </div>
          </main>
          <Footer />
          <CartDrawer />
        </div>
    );
}

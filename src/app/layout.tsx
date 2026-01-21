import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Inter } from 'next/font/google'
import FlyToCartAnimation from '@/components/fly-to-cart-animation';
import BottomNavbar from '@/components/bottom-navbar';
import { ReduxProvider } from '@/lib/redux/provider';
import SupabaseProvider from '@/lib/supabase/provider';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SetupSupabase } from '@/components/setup-supabase';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })


export const metadata: Metadata = {
  title: 'Pickbazar',
  description: 'An e-commerce storefront for fresh products.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isSupabaseConfigured) {
    return (
      <html lang="en" className={`${inter.variable} light`}>
        <body className="font-body antialiased">
          <SetupSupabase />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.variable} light`}>
      <body className="font-body antialiased pb-16 md:pb-0">
        <SupabaseProvider>
          <ReduxProvider>
            {children}
            <Toaster />
            <FlyToCartAnimation />
            <BottomNavbar />
          </ReduxProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

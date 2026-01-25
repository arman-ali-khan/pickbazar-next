import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Inter } from 'next/font/google';
import FlyToCartAnimation from '@/components/fly-to-cart-animation';
import BottomNavbar from '@/components/bottom-navbar';
import { ReduxProvider } from '@/lib/redux/provider';
import SupabaseProvider from '@/lib/supabase/provider';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SetupSupabase } from '@/components/setup-supabase';
import { Suspense } from 'react';
import ProgressBar from '@/components/progress-bar';
import Footer from '@/components/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  if (!isSupabaseConfigured) {
    return {
      title: 'Pickbazar',
      description: 'An e-commerce storefront for fresh products.',
    };
  }

  const supabase = createClient();
  const { data } = await supabase.rpc('get_all_settings');
  const settings = data?.[0];

  const siteTitle = settings?.site_title || 'Pickbazar';
  const siteSubtitle = settings?.site_subtitle || 'An e-commerce storefront for fresh products.';
  const faviconUrl = settings?.favicon_url;
  const linkPreviewImageUrl = settings?.link_preview_image_url;

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: siteSubtitle,
    icons: {
      icon: faviconUrl || '/favicon.ico',
    },
    openGraph: {
      title: siteTitle,
      description: siteSubtitle,
      images: linkPreviewImageUrl ? [{ url: linkPreviewImageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteSubtitle,
      images: linkPreviewImageUrl ? [linkPreviewImageUrl] : [],
    },
  };
}


export default async function RootLayout({
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

  const supabase = createClient();
  const { data } = await supabase.rpc('get_all_settings');
  const settings = data?.[0];

  return (
    <html lang="en" className={`${inter.variable} light`}>
      <body className="font-body antialiased pb-16 md:pb-0">
        <SupabaseProvider>
          <ReduxProvider>
            {/* The ProgressBar needs to be wrapped in Suspense to use navigation hooks */}
            <Suspense fallback={null}>
              <ProgressBar />
            </Suspense>
            {children}
            <Footer settings={settings} />
            <Toaster />
            <FlyToCartAnimation />
            <BottomNavbar />
          </ReduxProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

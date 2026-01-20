import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Inter } from 'next/font/google'
import { CartProvider } from '@/contexts/cart-context';
import FlyToCartAnimation from '@/components/fly-to-cart-animation';
import { UIProvider } from '@/contexts/ui-context';
import BottomNavbar from '@/components/bottom-navbar';

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
  return (
    <html lang="en" className={`${inter.variable} light`}>
      <body className="font-body antialiased pb-16 md:pb-0">
        <UIProvider>
          <CartProvider>
            {children}
            <Toaster />
            <FlyToCartAnimation />
            <BottomNavbar />
          </CartProvider>
        </UIProvider>
      </body>
    </html>
  );
}

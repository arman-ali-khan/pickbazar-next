'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './splash-screen';
<<<<<<< HEAD
import dynamic from 'next/dynamic';

const CartDrawer = dynamic(() => import('@/components/cart-drawer'), { ssr: false });
=======
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b

interface AppLoaderProps {
  children: React.ReactNode;
  logoUrl?: string | null;
  siteTitle?: string | null;
}

export default function AppLoader({ children, logoUrl, siteTitle }: AppLoaderProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for initial data fetching and hydration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen logoUrl={logoUrl} siteTitle={siteTitle} />;
  }

<<<<<<< HEAD
  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
=======
  return <>{children}</>;
>>>>>>> 87638565616690afc222294213d1ecad9540bc1b
}

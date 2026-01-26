'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './splash-screen';

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

  return <>{children}</>;
}

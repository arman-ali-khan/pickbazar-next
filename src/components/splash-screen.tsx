
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SplashScreenProps {
  logoUrl?: string | null;
  siteTitle?: string | null;
}

export default function SplashScreen({ logoUrl, siteTitle }: SplashScreenProps) {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    const timer2 = setTimeout(() => setProgress(90), 1200);
    return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-4 mb-6">
        {logoUrl ? (
          <Image src={logoUrl} alt={siteTitle || 'Logo'} width={48} height={48} className="h-12 w-auto" />
        ) : (
          <Leaf className="h-12 w-12 text-primary" />
        )}
        <span className="font-bold text-4xl">{siteTitle || 'Karwanbazar'}</span>
      </div>
      <div className="w-1/4 max-w-xs">
         <Progress value={progress} className="w-full h-2" />
      </div>
    </div>
  );
}

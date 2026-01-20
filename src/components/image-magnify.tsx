'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ZoomIn } from 'lucide-react';

interface ImageMagnifyProps {
  src: string;
  alt: string;
  imageHint?: string;
  zoomImageSrc?: string;
  className?: string;
  imageClassName?: string;
}

const ImageMagnify: React.FC<ImageMagnifyProps> = ({
  src,
  alt,
  imageHint,
  zoomImageSrc,
  className,
  imageClassName,
}) => {
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };
  
  const finalZoomSrc = zoomImageSrc || src;

  const imageElement = (
    <Image
      src={src}
      alt={alt}
      data-ai-hint={imageHint}
      fill
      className={cn('object-contain', imageClassName)}
    />
  );

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className={cn('relative w-full h-full cursor-pointer', className)}>
            {imageElement}
            <div className="absolute bottom-2 right-2 bg-background/70 backdrop-blur-sm p-2 rounded-full shadow-md">
              <ZoomIn className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 border-0 w-screen h-screen max-w-none bg-black/80 backdrop-blur-sm flex items-center justify-center">
           <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={finalZoomSrc}
              alt={alt}
              data-ai-hint={imageHint}
              fill
              className="object-contain"
            />
           </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div
      className={cn('relative w-full h-full', className)}
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      {imageElement}
      <div
        className={cn(
          'absolute top-0 left-[calc(100%+1rem)] w-full h-full pointer-events-none transition-opacity duration-300 z-50 bg-white border rounded-lg shadow-lg hidden md:block',
          showZoom ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          backgroundImage: `url(${finalZoomSrc})`,
          backgroundPosition: `${position.x}% ${position.y}%`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '250%',
        }}
      />
    </div>
  );
};

export default ImageMagnify;
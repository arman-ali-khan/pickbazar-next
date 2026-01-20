'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setPosition({ x, y });
  };
  
  const finalZoomSrc = zoomImageSrc || src;

  return (
    <div
      className={cn('relative w-full h-full', className)}
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        data-ai-hint={imageHint}
        fill
        className={cn('object-contain', imageClassName)}
      />
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

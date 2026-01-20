"use client";

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

type ProductImageGalleryProps = {
  images: ImagePlaceholder[];
};

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="relative aspect-square rounded-lg overflow-hidden border bg-white shadow-sm">
        <Image
          src={selectedImage.imageUrl}
          alt={selectedImage.description}
          data-ai-hint={selectedImage.imageHint}
          fill
          className="w-full h-full object-cover transition-opacity duration-300"
          priority
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {images.map((image) => (
          <button
            key={image.id}
            className={cn(
              'relative rounded-md overflow-hidden border-2 transition-colors aspect-square focus:outline-none focus:ring-2 focus:ring-primary',
              selectedImage.id === image.id ? 'border-primary' : 'border-transparent'
            )}
            onClick={() => setSelectedImage(image)}
            aria-label={`View image ${image.id}`}
          >
            <Image
              src={image.imageUrl}
              alt={image.description}
              data-ai-hint={image.imageHint}
              fill
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

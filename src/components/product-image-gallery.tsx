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
  
  const mainImageDetails = selectedImage.imageUrl.match(/seed\/(\d+)\/(\d+)\/(\d+)/);
  const mainImageWidth = mainImageDetails ? parseInt(mainImageDetails[2]) : 600;
  const mainImageHeight = mainImageDetails ? parseInt(mainImageDetails[3]) : 600;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="aspect-square rounded-lg overflow-hidden border bg-white shadow-sm">
        <Image
          src={selectedImage.imageUrl}
          alt={selectedImage.description}
          data-ai-hint={selectedImage.imageHint}
          width={mainImageWidth}
          height={mainImageHeight}
          className="w-full h-full object-cover transition-opacity duration-300"
          priority
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {images.map((image) => {
          const thumbDetails = image.imageUrl.match(/seed\/(\d+)\/(\d+)\/(\d+)/);
          const thumbWidth = thumbDetails ? parseInt(thumbDetails[2]) : 100;
          const thumbHeight = thumbDetails ? parseInt(thumbDetails[3]) : 100;
          return (
            <button
              key={image.id}
              className={cn(
                'rounded-lg overflow-hidden border-2 transition-colors aspect-square focus:outline-none focus:ring-2 focus:ring-primary',
                selectedImage.id === image.id ? 'border-primary' : 'border-transparent'
              )}
              onClick={() => setSelectedImage(image)}
              aria-label={`View image ${image.id}`}
            >
              <Image
                src={image.imageUrl}
                alt={image.description}
                data-ai-hint={image.imageHint}
                width={thumbWidth}
                height={thumbHeight}
                className="w-full h-full object-cover"
              />
            </button>
          )
        })}
      </div>
    </div>
  );
}

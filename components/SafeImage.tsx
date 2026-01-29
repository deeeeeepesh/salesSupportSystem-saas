'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getPlaceholderImage } from '@/lib/utils';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * SafeImage component with error handling for missing or failed images
 * Falls back to placeholder image on error or when src is null/undefined
 */
export function SafeImage({ 
  src, 
  alt, 
  fill, 
  width, 
  height, 
  className, 
  priority,
  sizes 
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const placeholderSrc = getPlaceholderImage();
  
  // Use placeholder if no src or error occurred
  const imageSrc = !src || error ? placeholderSrc : src;

  // For fill mode, width and height are not needed
  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        onError={() => setError(true)}
        priority={priority}
        sizes={sizes}
        unoptimized={imageSrc === placeholderSrc}
      />
    );
  }

  // For fixed dimensions mode
  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 300}
      height={height || 300}
      className={className}
      onError={() => setError(true)}
      priority={priority}
      unoptimized={imageSrc === placeholderSrc}
    />
  );
}

'use client';

import React, { useState } from 'react';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fileId: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  lowResSize?: number;
  highResSize?: number;
}

/**
 * High-performance 2-tier progressive blur-up image component.
 * Renders an instant micro-thumbnail (=s320) immediately with aspect-ratio preservation,
 * then seamlessly crossfades to crisp =s1400 once loaded.
 */
export function ProgressiveImage({
  fileId,
  alt,
  className = '',
  aspectRatio,
  lowResSize = 320,
  highResSize = 1400,
  style,
  ...rest
}: ProgressiveImageProps) {
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Micro thumbnail (approx 15-25KB, decodes in <40ms)
  const lowResUrl = `https://lh3.googleusercontent.com/d/${fileId}=s${lowResSize}`;
  // High-res retina stream (approx 200-350KB, crisp 1080p/4K)
  const highResUrl = `https://lh3.googleusercontent.com/d/${fileId}=s${highResSize}`;
  // Fallback proxy
  const proxyUrl = `/api/drive/image?id=${fileId}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: aspectRatio || 'auto',
        ...style,
      }}
    >
      {/* Background skeleton while loading */}
      <div className="absolute inset-0 skeleton pointer-events-none" />

      {/* Tier 1: Micro-Thumbnail with progressive blur */}
      <img
        src={hasError ? proxyUrl : lowResUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isHighResLoaded ? 'opacity-0' : 'opacity-100 scale-102 filter blur-[2px]'
        }`}
        loading="eager"
        decoding="async"
        onError={() => setHasError(true)}
      />

      {/* Tier 2: Crisp Presentation Stream */}
      {!hasError && (
        <img
          src={highResUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={() => setIsHighResLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHighResLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          decoding="async"
          {...rest}
        />
      )}
    </div>
  );
}


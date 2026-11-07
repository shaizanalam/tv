'use client';

import { useEffect, useRef } from 'react';
import { DriveItem } from '@/lib/types';

/**
 * Memory-safe 3-image preloader tailored for Smart TV browsers (JioSphere).
 * Prevents exceeding the TV browser's ~300 MB heap cap while guaranteeing
 * instant, zero-lag transitions between photos.
 */
export function usePhotoPreloader(
  photos: DriveItem[],
  currentIndex: number,
  getImageUrl: (item: DriveItem) => string
) {
  const cacheRef = useRef<Map<number, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (!photos || photos.length === 0) return;

    // Window: [Previous, Current, Next 1, Next 2]
    const indicesToKeep = [
      (currentIndex - 1 + photos.length) % photos.length,
      currentIndex,
      (currentIndex + 1) % photos.length,
      (currentIndex + 2) % photos.length,
    ];

    // Preload next images into browser memory (skip videos)
    indicesToKeep.forEach(idx => {
      const item = photos[idx];
      const isVideo = item?.mimeType?.startsWith('video/') || item?.name?.match(/\.(mp4|mov|webm)$/i);
      if (item && !isVideo && !cacheRef.current.has(idx)) {
        const img = new Image();
        img.src = getImageUrl(item);
        cacheRef.current.set(idx, img);
      }
    });

    // Evict distant images from TV memory cache to avoid memory pressure
    for (const [key] of cacheRef.current.entries()) {
      if (!indicesToKeep.includes(key)) {
        const evicted = cacheRef.current.get(key);
        if (evicted) {
          evicted.src = ''; // Release image buffer
        }
        cacheRef.current.delete(key);
      }
    }
  }, [photos, currentIndex, getImageUrl]);
}


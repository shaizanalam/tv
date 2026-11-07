'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowLeft, Clock } from 'lucide-react';
import { DriveItem, TransitionStyle } from '@/lib/types';
import { usePhotoPreloader } from '@/hooks/usePhotoPreloader';

interface SlideshowPlayerProps {
  photos: DriveItem[];
  initialIndex?: number;
  intervalSeconds?: number;
  transitionStyle?: TransitionStyle;
  onExit: () => void;
}

export function SlideshowPlayer({
  photos,
  initialIndex = 0,
  intervalSeconds = 8,
  transitionStyle = 'ken_burns',
  onExit,
}: SlideshowPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [clockStr, setClockStr] = useState('');

  const currentPhoto = photos[currentIndex];

  // Helper to construct zero-lag image URL
  const getImageUrl = useCallback((item: DriveItem) => {
    // If Google thumbnailLink exists, modify to high-res 1080p preview directly from Google CDN
    if (item.thumbnailLink) {
      return item.thumbnailLink.replace(/=s\d+.*$/, '=s1920');
    }
    // Fallback to media proxy
    return `/api/media/${item.fileId}?variant=preview`;
  }, []);

  // Activate 3-image memory preloader
  usePhotoPreloader(photos, currentIndex, getImageUrl);

  // Advance photo
  const nextPhoto = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;

    const timer = setInterval(() => {
      nextPhoto();
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, intervalSeconds, nextPhoto, photos.length]);

  // Clock in Ambient HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide HUD after 4 seconds of inactivity
  useEffect(() => {
    if (!showHUD) return;
    const hideTimer = setTimeout(() => {
      setShowHUD(false);
    }, 4500);
    return () => clearTimeout(hideTimer);
  }, [showHUD, currentIndex]);

  // TV Remote & Keyboard Controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      setShowHUD(true); // Awaken HUD on any key press

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextPhoto();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevPhoto();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onExit();
          break;
        default:
          if (e.keyCode === 10009 || e.keyCode === 461) {
            e.preventDefault();
            onExit();
          }
          if (e.keyCode === 179 || e.keyCode === 415) {
            e.preventDefault();
            setIsPlaying(prev => !prev);
          }
          break;
      }
    },
    [nextPhoto, prevPhoto, onExit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Framer Motion Animation Variants
  const variants = useMemo(() => {
    if (transitionStyle === 'ken_burns') {
      return {
        initial: { opacity: 0, scale: 1.0 },
        animate: {
          opacity: 1,
          scale: 1.1,
          transition: {
            opacity: { duration: 1.4, ease: 'easeInOut' as const },
            scale: { duration: intervalSeconds + 1, ease: 'linear' as const },
          },
        },
        exit: {
          opacity: 0,
          transition: { duration: 1.2, ease: 'easeInOut' as const },
        },
      };
    }

    // Default Crossfade
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 1.4, ease: 'easeInOut' as const } },
      exit: { opacity: 0, transition: { duration: 1.2, ease: 'easeInOut' as const } },
    };
  }, [transitionStyle, intervalSeconds]);

  if (!currentPhoto) return null;

  const currentUrl = getImageUrl(currentPhoto);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Blurred Ambient Backdrop for non-16:9 images (The Frame style) */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 transform scale-110 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${currentUrl})` }}
      />

      {/* Main Photo Layer with Framer Motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhoto.fileId || currentPhoto.id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 flex items-center justify-center p-0"
        >
          <img
            src={currentUrl}
            alt={currentPhoto.name}
            className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle Ambient HUD (Auto-Hiding) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          showHUD ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Control Bar */}
        <div className="absolute top-10 left-12 right-12 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/80">
            <button
              onClick={onExit}
              className="pointer-events-auto flex items-center gap-2 text-stone-200 text-sm font-medium hover:text-amber-400"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Albums</span>
            </button>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{photos.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/80 text-stone-200">
            <div className="flex items-center gap-2 text-xs font-medium">
              {isPlaying ? (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Slideshow Playing</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Paused</span>
                </>
              )}
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1.5 text-sm font-light text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{clockStr}</span>
            </div>
          </div>
        </div>

        {/* Bottom Metadata Panel */}
        <div className="absolute bottom-12 left-12 max-w-2xl bg-zinc-950/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-zinc-800/80 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-light tracking-wide text-stone-100 truncate">
            {currentPhoto.name.replace(/\.[^/.]+$/, '')}
          </h2>
          {currentPhoto.driveCreatedTime && (
            <p className="text-sm md:text-base text-zinc-400 font-normal mt-1">
              {new Date(currentPhoto.driveCreatedTime).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

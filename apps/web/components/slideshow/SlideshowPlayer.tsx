'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowLeft, Clock, Shuffle, Film, Frame, ChevronRight, ChevronLeft } from 'lucide-react';
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
  photos: initialPhotos,
  initialIndex = 0,
  intervalSeconds: defaultInterval = 8,
  transitionStyle: defaultTransition = 'ken_burns',
  onExit,
}: SlideshowPlayerProps) {
  const [photos, setPhotos] = useState<DriveItem[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isArtFrame, setIsArtFrame] = useState(false); // Samsung The Frame museum mat mode
  const [duration, setDuration] = useState(defaultInterval);
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>(defaultTransition);
  const [showHUD, setShowHUD] = useState(true);
  const [clockStr, setClockStr] = useState('');

  const currentPhoto = photos[currentIndex];

  // Helper to construct zero-lag image or video URL
  const getImageUrl = useCallback((item: DriveItem) => {
    if (item.mimeType?.startsWith('video/')) {
      return `https://drive.google.com/uc?export=download&id=${item.fileId || item.id}`;
    }
    // High-res preview directly from Google CDN
    return `https://lh3.googleusercontent.com/d/${item.fileId || item.id}=s1920`;
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

  // Shuffle toggle
  const toggleShuffle = () => {
    if (!isShuffle) {
      // Shuffle array
      const shuffled = [...photos].sort(() => Math.random() - 0.5);
      setPhotos(shuffled);
      setCurrentIndex(0);
      setIsShuffle(true);
    } else {
      // Reset to original order
      setPhotos(initialPhotos);
      setCurrentIndex(0);
      setIsShuffle(false);
    }
  };

  // Slideshow interval timer
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;
    // For videos, let onEnded handle the transition to the next item
    if (currentPhoto?.mimeType?.startsWith('video/')) return;

    const timer = setInterval(() => {
      nextPhoto();
    }, duration * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, duration, nextPhoto, photos.length, currentPhoto]);

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

  // Auto-hide HUD after 5 seconds of inactivity
  useEffect(() => {
    if (!showHUD) return;
    const hideTimer = setTimeout(() => {
      setShowHUD(false);
    }, 5000);
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
        case 'f':
        case 'F':
          e.preventDefault();
          setIsArtFrame(prev => !prev);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          toggleShuffle();
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
    [nextPhoto, prevPhoto, onExit, isShuffle, initialPhotos, photos]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Framer Motion Animation Variants
  const variants = useMemo(() => {
    if (transitionStyle === 'ken_burns' && !isArtFrame) {
      return {
        initial: { opacity: 0, scale: 1.0 },
        animate: {
          opacity: 1,
          scale: 1.1,
          transition: {
            opacity: { duration: 1.4, ease: 'easeInOut' as const },
            scale: { duration: duration + 1, ease: 'linear' as const },
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
  }, [transitionStyle, duration, isArtFrame]);

  if (!currentPhoto) return null;

  const currentUrl = getImageUrl(currentPhoto);
  const isCurrentVideo = currentPhoto.mimeType?.startsWith('video/');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Blurred Ambient Backdrop for non-16:9 images */}
      {!isArtFrame && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 transform scale-110 transition-opacity duration-1000"
          style={{ backgroundImage: `url(${currentUrl})` }}
        />
      )}

      {/* Main Media Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhoto.fileId || currentPhoto.id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`absolute inset-0 flex items-center justify-center ${
            isArtFrame ? 'p-12 lg:p-16 bg-[#121214]' : 'p-0'
          }`}
        >
          {isArtFrame ? (
            /* Samsung The Frame Museum Matte Border */
            <div className="relative p-8 md:p-12 bg-[#1c1c1f] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-stone-800/80 max-h-[90vh] max-w-[90vw] flex items-center justify-center">
              {isCurrentVideo ? (
                <video
                  src={currentUrl}
                  autoPlay
                  controls={false}
                  playsInline
                  onEnded={nextPhoto}
                  className="max-h-[75vh] max-w-[80vw] object-contain shadow-2xl"
                />
              ) : (
                <img
                  src={currentUrl}
                  alt={currentPhoto.name}
                  className="max-h-[75vh] max-w-[80vw] object-contain shadow-2xl"
                />
              )}
            </div>
          ) : (
            /* Edge-to-Edge Clean Presentation */
            <>
              {isCurrentVideo ? (
                <video
                  src={currentUrl}
                  autoPlay
                  controls={false}
                  playsInline
                  onEnded={nextPhoto}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              ) : (
                <img
                  src={currentUrl}
                  alt={currentPhoto.name}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Subtle Ambient HUD (Auto-Hiding) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          showHUD ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Control Bar */}
        <div className="absolute top-8 left-10 right-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-zinc-950/85 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/80">
            <button
              onClick={onExit}
              className="pointer-events-auto flex items-center gap-2 text-stone-200 text-sm font-medium hover:text-amber-400 transition-colors"
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

          <div className="flex items-center gap-3 bg-zinc-950/85 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/80 text-stone-200">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="pointer-events-auto flex items-center gap-2 text-xs font-medium hover:text-amber-400 transition-colors"
            >
              {isPlaying ? (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Playing ({duration}s)</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Paused</span>
                </>
              )}
            </button>

            <span className="text-zinc-600">|</span>

            {/* Shuffle Button */}
            <button
              onClick={toggleShuffle}
              className={`pointer-events-auto p-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                isShuffle ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-stone-200'
              }`}
              title="Toggle Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>

            <span className="text-zinc-600">|</span>

            {/* Museum Art Frame Mode */}
            <button
              onClick={() => setIsArtFrame(f => !f)}
              className={`pointer-events-auto p-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                isArtFrame ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-stone-200'
              }`}
              title="The Frame Art Mat Mode"
            >
              <Frame className="w-3.5 h-3.5" />
              <span>Art Frame</span>
            </button>

            <span className="text-zinc-600">|</span>

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 text-sm font-light text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{clockStr}</span>
            </div>
          </div>
        </div>

        {/* Bottom Filmstrip Scrubber & Info */}
        <div className="absolute bottom-8 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Metadata Card */}
          <div className="max-w-xl bg-zinc-950/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-zinc-800/80 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-light tracking-wide text-stone-100 truncate">
              {currentPhoto.name.replace(/\.[^/.]+$/, '')}
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-normal mt-1">
              <span>{isCurrentVideo ? 'Video Clip (Plays full duration)' : 'High-Res Photograph'}</span>
              <span>·</span>
              <span>Use Left/Right to Navigate</span>
            </div>
          </div>

          {/* Interactive Filmstrip Scrubber */}
          <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md p-2 rounded-2xl border border-zinc-800/80 shadow-2xl overflow-x-auto max-w-2xl">
            <button
              onClick={prevPhoto}
              className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {photos.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((p, i) => {
              const actualIdx = photos.indexOf(p);
              const isSelected = actualIdx === currentIndex;
              return (
                <div
                  key={p.fileId || p.id}
                  onClick={() => setCurrentIndex(actualIdx)}
                  className={`cursor-pointer rounded-lg overflow-hidden shrink-0 transition-all duration-200 ${
                    isSelected
                      ? 'w-16 h-12 ring-2 ring-amber-400 scale-105 opacity-100 shadow-md'
                      : 'w-14 h-10 opacity-50 hover:opacity-90'
                  }`}
                >
                  <img
                    src={`https://lh3.googleusercontent.com/d/${p.fileId || p.id}=s200`}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}

            <button
              onClick={nextPhoto}
              className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  ArrowLeft,
  Clock,
  Shuffle,
  Frame,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
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
  intervalSeconds: defaultInterval = 7,
  transitionStyle: defaultTransition = 'ken_burns',
  onExit,
}: SlideshowPlayerProps) {
  const [photos, setPhotos] = useState<DriveItem[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isArtFrame, setIsArtFrame] = useState(false); // Samsung The Frame museum mat mode
  const [duration, setDuration] = useState(defaultInterval);
  const [transitionStyle] = useState<TransitionStyle>(defaultTransition);
  const [showHUD, setShowHUD] = useState(true);
  const [clockStr, setClockStr] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [filmstripFocused, setFilmstripFocused] = useState(false);
  const [scrubberIndex, setScrubberIndex] = useState(initialIndex);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentPhoto = photos[currentIndex];

  // Helper to construct high-speed Google CDN URLs
  const getImageUrl = useCallback((item: DriveItem) => {
    if (item.mimeType?.startsWith('video/')) {
      return `https://drive.google.com/uc?export=download&id=${item.fileId || item.id}`;
    }
    // High-res preview directly from Google CDN (1080p / 4K friendly)
    return `https://lh3.googleusercontent.com/d/${item.fileId || item.id}=s1920`;
  }, []);

  const getLowResUrl = useCallback((item: DriveItem) => {
    return `https://lh3.googleusercontent.com/d/${item.fileId || item.id}=s400`;
  }, []);

  // Safe video autoplay with TV browser unmuted autoplay fallback
  const isCurrentVideo = currentPhoto?.mimeType?.startsWith('video/') || !!currentPhoto?.name?.match(/\.(mp4|mov|webm)$/i);
  useEffect(() => {
    if (videoRef.current && isCurrentVideo) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [currentIndex, isCurrentVideo]);

  // Activate smart sliding-window memory preloader for JioSphere & TV browsers
  usePhotoPreloader(photos, currentIndex, getImageUrl);

  // Advance photo / video
  const nextPhoto = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % photos.length);
    setVideoProgress(0);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
    setVideoProgress(0);
  }, [photos.length]);

  // Shuffle toggle
  const toggleShuffle = useCallback(() => {
    if (!isShuffle) {
      const shuffled = [...photos].sort(() => Math.random() - 0.5);
      setPhotos(shuffled);
      setCurrentIndex(0);
      setIsShuffle(true);
    } else {
      setPhotos(initialPhotos);
      setCurrentIndex(0);
      setIsShuffle(false);
    }
  }, [isShuffle, photos, initialPhotos]);

  // Slideshow interval timer (Photos only; videos advance on ended)
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;
    const isVideo = currentPhoto?.mimeType?.startsWith('video/');
    if (isVideo) return; // Wait for video to finish

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

  // Auto-hide HUD after 4.5 seconds of inactivity
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
      setShowHUD(true); // Awaken HUD on any interaction

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (filmstripFocused) {
            setScrubberIndex(prev => Math.min(photos.length - 1, prev + 1));
          } else {
            nextPhoto();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (filmstripFocused) {
            setScrubberIndex(prev => Math.max(0, prev - 1));
          } else {
            prevPhoto();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFilmstripFocused(true);
          setScrubberIndex(currentIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFilmstripFocused(false);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (filmstripFocused) {
            setCurrentIndex(scrubberIndex);
            setFilmstripFocused(false);
          } else {
            setIsPlaying(prev => !prev);
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (filmstripFocused) {
            setFilmstripFocused(false);
          } else {
            onExit();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setIsArtFrame(prev => !prev);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(prev => !prev);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          toggleShuffle();
          break;
        default:
          // Samsung Tizen (10009) & LG WebOS (461) Return keys
          if (e.keyCode === 10009 || e.keyCode === 461) {
            e.preventDefault();
            onExit();
          }
          // TV Remote Media Play/Pause keys
          if (e.keyCode === 179 || e.keyCode === 415) {
            e.preventDefault();
            setIsPlaying(prev => !prev);
          }
          // TV Remote Media Next/Prev
          if (e.keyCode === 228) {
            e.preventDefault();
            nextPhoto();
          }
          if (e.keyCode === 227) {
            e.preventDefault();
            prevPhoto();
          }
          break;
      }
    },
    [nextPhoto, prevPhoto, onExit, toggleShuffle]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Subtle Cinematic Ken Burns or Crossfade
  const variants = useMemo(() => {
    if (transitionStyle === 'ken_burns' && !isArtFrame) {
      return {
        initial: { opacity: 0, scale: 1.0 },
        animate: {
          opacity: 1,
          scale: 1.08,
          transition: {
            opacity: { duration: 1.2, ease: 'easeInOut' as const },
            scale: { duration: duration + 1, ease: 'linear' as const },
          },
        },
        exit: {
          opacity: 0,
          transition: { duration: 0.9, ease: 'easeInOut' as const },
        },
      };
    }

    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 1.0, ease: 'easeInOut' as const } },
      exit: { opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' as const } },
    };
  }, [transitionStyle, duration, isArtFrame]);

  if (!currentPhoto) return null;

  const currentUrl = getImageUrl(currentPhoto);
  const lowResUrl = getLowResUrl(currentPhoto);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. Low-latency Blurred Ambient Glow Backdrop */}
      {!isArtFrame && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 transform scale-110 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${lowResUrl})` }}
        />
      )}

      {/* 2. Main Media Presentation Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhoto.fileId || currentPhoto.id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`absolute inset-0 flex items-center justify-center ${
            isArtFrame ? 'p-10 lg:p-14 bg-[#141416]' : 'p-0'
          }`}
        >
          {isArtFrame ? (
            /* Samsung "The Frame" Museum Mat Border Presentation */
            <div className="relative p-8 md:p-14 bg-[#f8f6f0] rounded-sm shadow-[0_30px_90px_rgba(0,0,0,0.85)] border-12 border-[#2b2b2e] max-h-[92vh] max-w-[92vw] flex items-center justify-center">
              {isCurrentVideo ? (
                <video
                  ref={videoRef}
                  src={currentUrl}
                  autoPlay
                  controls={false}
                  playsInline
                  muted={isMuted}
                  onEnded={nextPhoto}
                  onTimeUpdate={e => {
                    const v = e.currentTarget;
                    if (v.duration) {
                      setVideoProgress((v.currentTime / v.duration) * 100);
                      setVideoDuration(v.duration);
                    }
                  }}
                  className="max-h-[72vh] max-w-[80vw] object-contain shadow-2xl"
                />
              ) : (
                <img
                  src={currentUrl}
                  alt={currentPhoto.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="max-h-[72vh] max-w-[80vw] object-contain shadow-2xl"
                  loading="eager"
                />
              )}
            </div>
          ) : (
            /* Edge-to-Edge Cinematic Presentation */
            <div className="relative w-full h-full flex items-center justify-center">
              {isCurrentVideo ? (
                <video
                  ref={videoRef}
                  src={currentUrl}
                  autoPlay
                  controls={false}
                  playsInline
                  muted={isMuted}
                  onEnded={nextPhoto}
                  onTimeUpdate={e => {
                    const v = e.currentTarget;
                    if (v.duration) {
                      setVideoProgress((v.currentTime / v.duration) * 100);
                      setVideoDuration(v.duration);
                    }
                  }}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              ) : (
                <img
                  src={currentUrl}
                  alt={currentPhoto.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  loading="eager"
                />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 3. Subtle Ambient HUD (Auto-Hides after 4.5s) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          showHUD ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Floating Glass Navigation Bar */}
        <div className="absolute top-8 left-10 right-10 flex items-center justify-between">
          {/* Back Pill */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/15 shadow-xl">
            <button
              onClick={onExit}
              className="pointer-events-auto flex items-center gap-2 text-white/90 text-xs font-medium hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Library</span>
            </button>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-1.5 text-xs text-white/70 font-mono">
              <span className="text-white font-semibold">{currentIndex + 1}</span>
              <span>/</span>
              <span>{photos.length}</span>
            </div>
          </div>

          {/* Right Floating Control Cluster */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/15 shadow-xl text-white">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="pointer-events-auto flex items-center gap-2 text-xs font-medium hover:text-white transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Playing</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Paused</span>
                </>
              )}
            </button>

            {isCurrentVideo && (
              <>
                <span className="text-white/30">|</span>
                {/* Audio Mute/Unmute */}
                <button
                  onClick={() => setIsMuted(m => !m)}
                  className="pointer-events-auto flex items-center gap-1.5 text-xs font-medium hover:text-white transition-colors cursor-pointer"
                  title="Toggle Audio (M key)"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isMuted ? 'Muted' : 'Audio On'}</span>
                </button>
              </>
            )}

            <span className="text-white/30">|</span>

            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`pointer-events-auto p-1 rounded-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isShuffle ? 'text-amber-300 font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>

            <span className="text-white/30">|</span>

            {/* Museum Art Frame Toggle */}
            <button
              onClick={() => setIsArtFrame(f => !f)}
              className={`pointer-events-auto p-1 rounded-md text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isArtFrame ? 'text-amber-300 font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              <Frame className="w-3.5 h-3.5" />
              <span>Art Frame (F)</span>
            </button>

            <span className="text-white/30">|</span>

            {/* Ambient Clock */}
            <div className="flex items-center gap-1.5 text-xs font-light text-white/90">
              <Clock className="w-3 h-3 text-amber-300" />
              <span>{clockStr}</span>
            </div>
          </div>
        </div>

        {/* Video Scrubber (Appears when video is playing) */}
        {isCurrentVideo && (
          <div className="absolute top-22 left-10 right-10">
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="bg-amber-400 h-full transition-all duration-200"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Scrubber & Metadata Bar */}
        <div className="absolute bottom-8 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Item Meta Card */}
          <div className="max-w-lg bg-black/60 backdrop-blur-2xl px-6 py-4 rounded-2xl border border-white/15 shadow-xl">
            <h2 className="text-lg md:text-xl font-medium tracking-tight text-white truncate">
              {currentPhoto.name.replace(/\.[^/.]+$/, '')}
            </h2>
            <div className="flex items-center gap-2.5 text-xs text-white/60 font-light mt-1">
              <span className="uppercase tracking-wider font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded text-amber-300">
                {isCurrentVideo ? 'MP4 Video' : 'Original Photo'}
              </span>
              <span>·</span>
              <span>Item {currentIndex + 1} of {photos.length}</span>
              <span>·</span>
              <span className="text-white/60">
                {filmstripFocused ? 'Filmstrip Active: [< >] scrub, [OK] jump, [Up] exit' : 'D-pad [< >] skip, [Down] Filmstrip'}
              </span>
            </div>
          </div>

          {/* Interactive Filmstrip Scrubber */}
          <div className={`pointer-events-auto flex items-center gap-2 bg-black/75 backdrop-blur-2xl p-2.5 rounded-2xl border transition-all overflow-x-auto max-w-2xl ${
            filmstripFocused
              ? 'ring-3 ring-amber-400 border-amber-400/50 shadow-2xl scale-[1.02]'
              : 'border-white/15 shadow-xl'
          }`}>
            <button
              onClick={prevPhoto}
              className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {photos.slice(Math.max(0, (filmstripFocused ? scrubberIndex : currentIndex) - 4), (filmstripFocused ? scrubberIndex : currentIndex) + 5).map(p => {
              const actualIdx = photos.indexOf(p);
              const isSelected = filmstripFocused ? actualIdx === scrubberIndex : actualIdx === currentIndex;
              return (
                <div
                  key={p.fileId || p.id}
                  onClick={() => {
                    setCurrentIndex(actualIdx);
                    setFilmstripFocused(false);
                  }}
                  className={`cursor-pointer rounded-lg overflow-hidden shrink-0 transition-all duration-200 ${
                    isSelected
                      ? filmstripFocused
                        ? 'w-16 h-12 ring-3 ring-amber-400 scale-110 opacity-100 shadow-lg'
                        : 'w-16 h-12 ring-2 ring-white scale-105 opacity-100 shadow-md'
                      : 'w-13 h-9 opacity-45 hover:opacity-90'
                  }`}
                >
                  <img
                    src={`https://lh3.googleusercontent.com/d/${p.fileId || p.id}=s200`}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}

            <button
              onClick={nextPhoto}
              className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

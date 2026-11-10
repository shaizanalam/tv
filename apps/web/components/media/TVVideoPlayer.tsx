'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  ArrowLeft,
  SkipForward,
  SkipBack,
  RotateCcw,
  Film,
} from 'lucide-react';
import { TextShimmerWave } from '@/components/loading-ui/text-shimmer-wave';
import { DriveItem } from '@/lib/types';

interface TVVideoPlayerProps {
  video: DriveItem;
  playlist: DriveItem[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

export function TVVideoPlayer({
  video,
  playlist,
  currentIndex,
  onNext,
  onPrev,
  onExit,
}: TVVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHUD, setShowHUD] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [bufferPercent, setBufferPercent] = useState(0);
  const isPlayingRef = useRef(true);
  const lastTimeUpdate = useRef(0);
  const retryCount = useRef(0);

  // Same-origin stream route with direct disk cache + Google CDN streaming
  const videoFileId = video.fileId || video.id;
  const videoStreamSrc = `/api/drive/video?id=${videoFileId}`;

  // Instant High-Res Poster to eliminate any initial black frame
  const posterUrl = video.thumbnailLink
    ? video.thumbnailLink.replace(/=s\d+/, '=s1200')
    : `/api/drive/image?id=${videoFileId}`;

  // Background Preload next video in playlist into server disk cache
  useEffect(() => {
    if (playlist.length <= 1) return;
    const nextIdx = (currentIndex + 1) % playlist.length;
    const nextVid = playlist[nextIdx];
    if (nextVid) {
      const nextFileId = nextVid.fileId || nextVid.id;
      // Triggers background caching on the server so next clip starts instantly in one go
      fetch(`/api/drive/video?id=${nextFileId}`, { method: 'HEAD' }).catch(() => {});
    }
  }, [currentIndex, playlist]);

  // Buffer health check: ensures a 5-second cushion before unpausing so it plays in one continuous go
  const checkBufferThreshold = useCallback(() => {
    const v = videoRef.current;
    if (!v) return false;
    const ct = v.currentTime;
    let ahead = 0;
    for (let i = 0; i < v.buffered.length; i++) {
      if (ct >= v.buffered.start(i) && ct <= v.buffered.end(i)) {
        ahead = v.buffered.end(i) - ct;
        break;
      }
    }
    const dur = v.duration || 10;
    const remaining = dur - ct;
    // Require 5-second buffer cushion (or remaining duration if near end)
    const required = Math.min(5, Math.max(1.5, remaining * 0.8));
    const pct = Math.min(100, Math.round((ahead / required) * 100));
    setBufferPercent(pct);

    return ahead >= required || ahead >= remaining - 0.5;
  }, []);

  const resumePlaybackIfReady = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (checkBufferThreshold()) {
      setIsBuffering(false);
      if (v.paused && isPlayingRef.current) {
        v.play().catch(() => {});
      }
    }
  }, [checkBufferThreshold]);

  // Auto-hide HUD after 4.5 seconds of inactivity
  useEffect(() => {
    if (!showHUD) return;
    const timer = setTimeout(() => setShowHUD(false), 4500);
    return () => clearTimeout(timer);
  }, [showHUD, isPlaying]);

  // Reset player state & enforce Full Volume (1.0) with zero mute button
  useEffect(() => {
    retryCount.current = 0;
    setHasError(false);
    setIsBuffering(true);
    setBufferPercent(0);
    setCurrentTime(0);
    setIsPlaying(true);
    isPlayingRef.current = true;
    lastTimeUpdate.current = 0;

    if (videoRef.current) {
      videoRef.current.volume = 1.0;
      videoRef.current.muted = false;
      videoRef.current.load();
    }
  }, [videoFileId]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, []);

  // TV Remote controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setShowHUD(true);

      if (hasError) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          onNext();
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          setHasError(false);
          setIsBuffering(true);
          retryCount.current = 0;
          if (videoRef.current) {
            videoRef.current.src = `/api/drive/video?id=${videoFileId}&retry=${Date.now()}`;
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
          }
          return;
        }
        if (
          e.key === 'Escape' ||
          e.key === 'Backspace' ||
          e.keyCode === 10009 ||
          e.keyCode === 461 ||
          e.keyCode === 4
        ) {
          e.preventDefault();
          onExit();
          return;
        }
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = Math.min(1.0, videoRef.current.volume + 0.1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0.1, videoRef.current.volume - 0.1);
          }
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          onNext();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          onPrev();
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onExit();
          break;
        default:
          if (e.keyCode === 10009 || e.keyCode === 461 || e.keyCode === 4) {
            e.preventDefault();
            onExit();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, onNext, onPrev, onExit]);

  // Mobile Touch Gestures (Swipe Left/Right for Next/Prev, Tap for HUD)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold: 50px
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        onNext(); // swipe left -> next video
      } else {
        onPrev(); // swipe right -> prev video
      }
    } else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      setShowHUD(prev => !prev);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const cleanTitle = video.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-screen h-screen bg-[#0c0d10] select-none overflow-hidden flex items-center justify-center font-sans"
      onClick={() => setShowHUD(true)}
    >
      {/* Instant High-Res Poster Underlay (eliminates any black frame during buffer) */}
      <img
        src={posterUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300 z-0"
        style={{ opacity: isPlaying && currentTime > 0.2 ? 0 : 1 }}
      />

      {/* 100% Native Edge Streaming Video Element */}
      <video
        ref={videoRef}
        src={videoStreamSrc}
        poster={posterUrl}
        preload="auto"
        autoPlay
        playsInline
        onLoadStart={() => setIsBuffering(true)}
        onWaiting={() => {
          setIsBuffering(true);
          // Pause momentarily to accumulate buffer cushion so it can play in one go
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }}
        onProgress={resumePlaybackIfReady}
        onCanPlayThrough={() => {
          setIsBuffering(false);
          if (videoRef.current && videoRef.current.paused && isPlayingRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onCanPlay={resumePlaybackIfReady}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onTimeUpdate={() => {
          if (!videoRef.current) return;
          const ct = videoRef.current.currentTime;
          const dur = videoRef.current.duration || 0;

          // Direct DOM progress bar update for zero React render thrashing (smooth 60fps)
          if (progressBarRef.current && dur > 0) {
            progressBarRef.current.style.width = `${(ct / dur) * 100}%`;
          }

          // Throttle React state update to once per second for timer display
          if (Math.abs(ct - lastTimeUpdate.current) >= 1) {
            lastTimeUpdate.current = ct;
            setCurrentTime(ct);
            setDuration(dur);
            if (isBuffering) checkBufferThreshold();
          }
        }}
        onEnded={onNext}
        onError={() => {
          const mediaError = videoRef.current?.error;
          // Code 1: MEDIA_ERR_ABORTED - browser/user cancelled request during navigation (ignore)
          if (mediaError?.code === 1) {
            return;
          }

          // Auto-reconnect with cache busting up to 3 times before displaying notice
          if (retryCount.current < 3 && videoRef.current) {
            retryCount.current += 1;
            console.warn('Video streaming hiccup, reconnecting attempt', retryCount.current);
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.src = `/api/drive/video?id=${videoFileId}&retry=${Date.now()}`;
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }, 750);
            return;
          }

          console.warn('Video streaming notice:', mediaError);
          setHasError(true);
          setIsBuffering(false);
        }}
        className="w-full h-full object-contain"
      />

      {/* Shimmer Wave Buffering Badge with Buffer Percentage */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/40 backdrop-blur-[2px]">
          <div className="px-7 py-5 rounded-2xl bg-[#101113]/95 border border-[#303238] flex flex-col items-center gap-2.5 shadow-2xl">
            <TextShimmerWave className="text-2xl font-serif font-light text-[#D8C6A1]">
              Alam&apos;s
            </TextShimmerWave>
            <span className="text-[11px] font-mono text-[#A3A6AD] tracking-wider uppercase">
              {bufferPercent > 0
                ? `Buffering for Smooth Playback · ${bufferPercent}%`
                : 'Connecting Cinema Stream…'}
            </span>
          </div>
        </div>
      )}

      {/* Internal In-App Stream Notice Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-[#101113]/90 flex flex-col items-center justify-center text-center p-6 z-20">
          <div className="w-16 h-16 rounded-full bg-[#191B1F] border border-[#303238] flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-[#D8C6A1]" />
          </div>
          <h2 className="text-xl font-bold text-[#F5F5F2] tracking-tight">
            Stream Delay
          </h2>
          <p className="text-xs text-[#A3A6AD] max-w-sm mt-1.5 font-light">
            This clip experienced a temporary connection delay with Google Drive. You can retry playing or skip to the next clip.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => {
                setHasError(false);
                setIsBuffering(true);
                retryCount.current = 0;
                if (videoRef.current) {
                  videoRef.current.src = `/api/drive/video?id=${videoFileId}&retry=${Date.now()}`;
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-5 py-2.5 rounded-full bg-[#191B1F] hover:bg-[#22252A] text-[#F5F5F2] border border-[#303238] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Clip</span>
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2.5 rounded-full bg-[#D8C6A1] hover:bg-[#E4D5B5] text-[#101113] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-transform active:scale-95"
            >
              <span>Next Video</span>
              <SkipForward className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Ambient Cinema HUD (NO Mute Button - Auto Full Volume) */}
      <AnimatePresence>
        {showHUD && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 lg:p-12 z-10"
            style={{
              background:
                'linear-gradient(to bottom, rgba(12,13,16,0.85) 0%, transparent 25%, transparent 65%, rgba(12,13,16,0.95) 100%)',
            }}
          >
            {/* Top Bar with Exit and Clip Counter */}
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={onExit}
                className="flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] backdrop-blur-md text-[#F5F5F2] text-xs font-semibold cursor-pointer border border-[#303238] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#D8C6A1]" />
                <span className="hidden sm:inline">Exit Video</span>
                <span className="sm:hidden">Exit</span>
              </button>

              <div className="flex items-center gap-1.5 bg-[#191B1F]/80 backdrop-blur-md px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-[#303238]">
                <span className="text-[11px] sm:text-xs font-mono text-[#D8C6A1]">
                  Clip {currentIndex + 1} of {playlist.length}
                </span>
              </div>
            </div>

            {/* Bottom Scrubber & Metadata */}
            <div className="pointer-events-auto flex flex-col gap-2.5 sm:gap-3">
              <div>
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-[#F5F5F2] tracking-tight drop-shadow truncate">
                  {cleanTitle}
                </h1>
                <div className="hidden sm:flex items-center gap-2 mt-1 text-[11px] text-[#A3A6AD]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#191B1F] border border-[#303238] text-[#D8C6A1]">← / →</kbd>
                    <span>Prev / Next Video</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#191B1F] border border-[#303238] text-[#D8C6A1]">OK / Space</kbd>
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#191B1F] border border-[#303238] text-[#D8C6A1]">↑ / ↓</kbd>
                    <span>Volume</span>
                  </span>
                </div>
              </div>

              {/* Progress Scrubber */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#A3A6AD] min-w-10">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden cursor-pointer relative group"
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    if (videoRef.current && duration) {
                      videoRef.current.currentTime = pos * duration;
                    }
                  }}
                >
                  <div
                    ref={progressBarRef}
                    className="h-full bg-[#D8C6A1] group-hover:brightness-110 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(216,198,161,0.4)]"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-[#A3A6AD] min-w-10 text-right">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Center Playback Controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={onPrev}
                  className="p-2 text-[#A3A6AD] hover:text-[#F5F5F2] cursor-pointer transition-colors"
                  title="Previous Clip"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-[#D8C6A1] hover:bg-[#E4D5B5] text-[#101113] flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={onNext}
                  className="p-2 text-[#A3A6AD] hover:text-[#F5F5F2] cursor-pointer transition-colors"
                  title="Next Clip"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

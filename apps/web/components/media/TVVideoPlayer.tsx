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

const GOOGLE_CLIENT_KEY = 'AIzaSyAWGrfCCr7albM3lmCc937gx4uIphbpeKQ';

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
  const lastTimeUpdate = useRef(0);

  // Same-origin stream route with instant Google CDN resolution (zero CORS, hardware Range decode)
  const videoFileId = video.fileId || video.id;
  const videoStreamSrc = `/api/drive/video?id=${videoFileId}`;

  // Instant High-Res Poster to eliminate any initial black frame
  const posterUrl = video.thumbnailLink
    ? video.thumbnailLink.replace(/=s\d+/, '=s1200')
    : `/api/drive/image?id=${videoFileId}`;

  // Auto-hide HUD after 4.5 seconds of inactivity
  useEffect(() => {
    if (!showHUD) return;
    const timer = setTimeout(() => setShowHUD(false), 4500);
    return () => clearTimeout(timer);
  }, [showHUD, isPlaying]);

  // Reset player state & enforce Full Volume (1.0) with zero mute button
  useEffect(() => {
    setHasError(false);
    setIsBuffering(true);
    setCurrentTime(0);
    setIsPlaying(true);
    lastTimeUpdate.current = 0;

    if (videoRef.current) {
      videoRef.current.volume = 1.0;
      videoRef.current.muted = false;
      videoRef.current.load();

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsBuffering(false);
          })
          .catch(() => {
            // Autoplay fallback for strict browser audio policies:
            // Starts video muted, immediately unmuting on first TV remote click or keypress
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().then(() => {
                const unmuteHandler = () => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = 1.0;
                  }
                  window.removeEventListener('keydown', unmuteHandler);
                  window.removeEventListener('click', unmuteHandler);
                };
                window.addEventListener('keydown', unmuteHandler, { once: true });
                window.addEventListener('click', unmuteHandler, { once: true });
              }).catch(() => {});
            }
          });
      }
    }
  }, [videoFileId]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // TV Remote controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setShowHUD(true);

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

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const cleanTitle = video.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  return (
    <div
      className="relative w-screen h-screen bg-[#0c0d10] select-none overflow-hidden flex items-center justify-center font-sans"
      onClick={() => setShowHUD(true)}
    >
      {/* 100% Native Edge Streaming Video Element */}
      <video
        ref={videoRef}
        src={videoStreamSrc}
        poster={posterUrl}
        preload="auto"
        autoPlay
        playsInline
        onLoadStart={() => setIsBuffering(true)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
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
            if (isBuffering) setIsBuffering(false);
          }
        }}
        onEnded={onNext}
        onError={() => {
          console.warn('Video failed to stream directly:', videoRef.current?.error);
          setHasError(true);
          setIsBuffering(false);
        }}
        className="w-full h-full object-contain"
      />

      {/* Shimmer Wave Buffering Badge */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-black/35 backdrop-blur-[2px]">
          <div className="px-6 py-4 rounded-2xl bg-[#101113]/90 border border-[#303238] flex flex-col items-center gap-2.5 shadow-2xl">
            <TextShimmerWave className="text-xl font-medium text-[#D8C6A1]">
              Alam&apos;s
            </TextShimmerWave>
            <span className="text-[11px] font-mono text-[#A3A6AD] tracking-wider uppercase">
              Streaming Clip…
            </span>
          </div>
        </div>
      )}

      {/* Internal In-App Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-[#101113]/90 flex flex-col items-center justify-center text-center p-6 z-20">
          <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-800/40 flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-[#D8C6A1]" />
          </div>
          <h2 className="text-xl font-bold text-[#F5F5F2] tracking-tight">
            Video Format Notice
          </h2>
          <p className="text-xs text-[#A3A6AD] max-w-sm mt-1.5 font-light">
            This video codec is not directly streamable on this browser. You can skip to the next clip in this album.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => {
                setHasError(false);
                setIsBuffering(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-5 py-2.5 rounded-full bg-[#191B1F] hover:bg-[#22252A] text-[#F5F5F2] border border-[#303238] text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Clip</span>
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2.5 rounded-full bg-[#D8C6A1] hover:bg-[#E4D5B5] text-[#101113] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
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
            className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 lg:p-12 z-10"
            style={{
              background:
                'linear-gradient(to bottom, rgba(12,13,16,0.8) 0%, transparent 25%, transparent 70%, rgba(12,13,16,0.9) 100%)',
            }}
          >
            {/* Top Bar with Exit and Clip Counter */}
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={onExit}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] backdrop-blur-md text-[#F5F5F2] text-xs font-semibold cursor-pointer border border-[#303238] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#D8C6A1]" />
                <span>Exit Video</span>
              </button>

              <div className="flex items-center gap-2 bg-[#191B1F]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#303238]">
                <span className="text-xs font-mono text-[#D8C6A1]">
                  Clip {currentIndex + 1} of {playlist.length}
                </span>
              </div>
            </div>

            {/* Bottom Scrubber & Metadata */}
            <div className="pointer-events-auto flex flex-col gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#F5F5F2] tracking-tight drop-shadow truncate">
                  {cleanTitle}
                </h1>
                <p className="text-xs text-[#A3A6AD] font-light mt-0.5">
                  Remote D-pad: [Left/Right] Prev / Next Video · [OK] Pause · [Up/Down] Volume
                </p>
              </div>

              {/* Progress Scrubber */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#A3A6AD] min-w-10">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden cursor-pointer relative"
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
                    className="h-full bg-[#D8C6A1] rounded-full transition-all duration-75"
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

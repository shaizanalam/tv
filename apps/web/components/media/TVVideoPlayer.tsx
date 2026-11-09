'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  RotateCcw,
  Film,
  AlertCircle,
} from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHUD, setShowHUD] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 100% Native Same-Origin Stream (zero CORS/CORP blocking, zero external iframe redirects)
  const videoStreamSrc = `/api/drive/video?id=${video.fileId || video.id}`;

  // Auto-hide HUD after 4.5 seconds of inactivity
  useEffect(() => {
    if (!showHUD) return;
    const timer = setTimeout(() => setShowHUD(false), 4500);
    return () => clearTimeout(timer);
  }, [showHUD, isPlaying]);

  // Reset player state when video changes
  useEffect(() => {
    setHasError(false);
    setCurrentTime(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Handle TV browser autoplay policy (mute and play)
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [video.id, video.fileId]);

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
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setIsMuted(false);
          if (videoRef.current) videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(prev => !prev);
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
          if (e.keyCode === 10009 || e.keyCode === 461) {
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
      {/* 100% Native In-App Cinema Video Element */}
      <video
        ref={videoRef}
        src={videoStreamSrc}
        autoPlay
        playsInline
        muted={isMuted}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
          }
        }}
        onEnded={onNext}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
      />

      {/* Internal In-App Error Overlay (Never opens Google Drive) */}
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

      {/* Ambient Cinema HUD */}
      <AnimatePresence>
        {showHUD && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 lg:p-12 z-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(12,13,16,0.8) 0%, transparent 25%, transparent 70%, rgba(12,13,16,0.9) 100%)',
            }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={onExit}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] backdrop-blur-md text-[#F5F5F2] text-xs font-semibold cursor-pointer border border-[#303238]"
              >
                <ArrowLeft className="w-4 h-4 text-[#D8C6A1]" />
                <span>Exit Video</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#A3A6AD]">
                  Clip {currentIndex + 1} of {playlist.length}
                </span>

                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className="w-9 h-9 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] backdrop-blur-md flex items-center justify-center text-[#F5F5F2] cursor-pointer border border-[#303238]"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#D8C6A1]" />}
                </button>
              </div>
            </div>

            {/* Bottom Scrubber & Metadata */}
            <div className="pointer-events-auto flex flex-col gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#F5F5F2] tracking-tight drop-shadow truncate">
                  {cleanTitle}
                </h1>
                <p className="text-xs text-[#A3A6AD] font-light mt-0.5">
                  Remote D-pad: [Left/Right] seek 10s · [OK] Pause · [Down] Volume
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
                    className="h-full bg-[#D8C6A1] rounded-full transition-all duration-100"
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
                  className="p-2 text-[#A3A6AD] hover:text-[#F5F5F2] cursor-pointer"
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
                  className="p-2 text-[#A3A6AD] hover:text-[#F5F5F2] cursor-pointer"
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

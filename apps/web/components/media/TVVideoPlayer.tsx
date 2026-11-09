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
  ExternalLink,
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
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  // 1. High-Performance Range-Request Proxy Stream
  const videoStreamSrc = `/api/drive/video?id=${video.fileId || video.id}`;
  // 2. Google Drive native preview embed fallback (works 100% on any video, any codec)
  const iframePreviewSrc = `https://drive.google.com/file/d/${video.fileId || video.id}/preview`;

  // Auto-hide HUD after 4 seconds of inactivity
  useEffect(() => {
    if (!showHUD) return;
    const timer = setTimeout(() => setShowHUD(false), 4000);
    return () => clearTimeout(timer);
  }, [showHUD, isPlaying]);

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
      className="relative w-screen h-screen bg-black select-none overflow-hidden flex items-center justify-center font-sans"
      onClick={() => setShowHUD(true)}
    >
      {/* Primary Video Element or Native Embed */}
      {useIframeFallback ? (
        <iframe
          src={iframePreviewSrc}
          className="w-full h-full border-none"
          allow="autoplay"
        />
      ) : (
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
          onError={() => {
            // Auto switch to Google Drive's native web player if HTML5 video tag fails codec check
            setUseIframeFallback(true);
          }}
          className="w-full h-full object-contain"
        />
      )}

      {/* Ambient HUD */}
      <AnimatePresence>
        {showHUD && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 lg:p-12"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.85) 100%)',
            }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                onClick={onExit}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-semibold cursor-pointer border border-white/15"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Video</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/60">
                  Clip {currentIndex + 1} of {playlist.length}
                </span>

                {!useIframeFallback && (
                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer border border-white/15"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                )}

                <button
                  onClick={() => setUseIframeFallback(prev => !prev)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[11px] font-medium cursor-pointer border border-white/15 flex items-center gap-1.5"
                  title="Switch to Drive Player"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{useIframeFallback ? 'Stream Mode' : 'Drive Player'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Scrubber & Metadata */}
            <div className="pointer-events-auto flex flex-col gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight drop-shadow truncate">
                  {cleanTitle}
                </h1>
                <p className="text-xs text-white/70 font-light mt-0.5">
                  Remote D-pad: [Left/Right] seek 10s · [OK] Pause · [Down] Volume
                </p>
              </div>

              {!useIframeFallback && (
                <>
                  {/* Progress Scrubber */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white/70 min-w-10">
                      {formatTime(currentTime)}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full bg-white/25 overflow-hidden cursor-pointer relative"
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        if (videoRef.current && duration) {
                          videoRef.current.currentTime = pos * duration;
                        }
                      }}
                    >
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-100"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/70 min-w-10 text-right">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      onClick={onPrev}
                      className="p-2 text-white/70 hover:text-white cursor-pointer"
                      title="Previous Clip"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center cursor-pointer shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={onNext}
                      className="p-2 text-white/70 hover:text-white cursor-pointer"
                      title="Next Clip"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  SkipForward,
  SkipBack,
  CornerUpLeft,
  Tv,
  Film,
  Image as ImageIcon,
  Sliders,
  Volume2,
  Loader2,
  MousePointer,
  Grid,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';

const TRIP_COLLECTIONS = [
  { id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za', name: 'Dubai 2025' },
  { id: '17rjsvO8qP2dAime91juLLN1q68ADloZS', name: 'Ajmer Agra' },
  { id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs', name: 'Meccah & Madina' },
  { id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp', name: 'GoPro Action' },
  { id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC', name: 'Pachmari' },
];

function RemoteControllerContent() {
  const searchParams = useSearchParams();
  const pairCode = searchParams.get('pair') || searchParams.get('code') || '482917';

  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [controlMode, setControlMode] = useState<'trackpad' | 'dpad'>('trackpad');
  const [lastGesture, setLastGesture] = useState<string>('');

  // Touchpad touch tracking refs
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchPadRef = useRef<HTMLDivElement | null>(null);

  // Send Remote Command over sync channel
  const sendCommand = useCallback(
    async (type: string, payload?: any) => {
      // Gentle mobile haptic vibration
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {}
      }

      setLastGesture(type);
      setTimeout(() => setLastGesture(''), 500);

      try {
        await fetch('/api/remote/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: pairCode,
            command: {
              type,
              payload,
              timestamp: Date.now(),
            },
          }),
        });
      } catch (err) {
        console.error('Remote command failed:', err);
      }
    },
    [pairCode]
  );

  // Touchpad Gestures: Tap to OK, Swipe Up/Down/Left/Right
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const dt = Date.now() - touchStartPos.current.time;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const minSwipeDist = 35; // minimum distance in px for a gesture

    if (absX < 15 && absY < 15 && dt < 300) {
      // Tap detected -> Execute OK
      sendCommand('ok');
    } else if (absX > absY && absX > minSwipeDist) {
      // Horizontal swipe
      if (dx > 0) {
        sendCommand('dpad_right');
      } else {
        sendCommand('dpad_left');
      }
    } else if (absY > absX && absY > minSwipeDist) {
      // Vertical swipe
      if (dy > 0) {
        sendCommand('dpad_down');
      } else {
        sendCommand('dpad_up');
      }
    }

    touchStartPos.current = null;
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0d0e11] text-stone-100 flex flex-col justify-between p-4 sm:p-5 select-none font-sans">
      {/* 1. Header with prominent Back Button */}
      <header className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Prominent Back Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('back')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs cursor-pointer shadow-md active:bg-amber-300"
            title="Back / Exit on TV"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </motion.button>

          <div className="pl-1">
            <h1 className="text-xs font-semibold text-white tracking-tight">DriveFrame TV</h1>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected · #{pairCode}
            </p>
          </div>
        </div>

        {/* Mode Selector: Touchpad vs D-Pad */}
        <div className="flex items-center bg-zinc-900 border border-white/10 p-1 rounded-full gap-1">
          <button
            onClick={() => setControlMode('trackpad')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${
              controlMode === 'trackpad' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400'
            }`}
          >
            <MousePointer className="w-3 h-3" />
            <span>Touchpad</span>
          </button>
          <button
            onClick={() => setControlMode('dpad')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all ${
              controlMode === 'dpad' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>D-Pad</span>
          </button>
        </div>
      </header>

      {/* 2. Main Interactive Surface (Touchpad or D-Pad) */}
      <main className="my-auto flex flex-col items-center gap-4 py-2 w-full max-w-sm mx-auto">
        {controlMode === 'trackpad' ? (
          /* ============================================================ */
          /* TOUCHPAD CONTROLLER (Apple TV Remote Trackpad Style)          */
          /* ============================================================ */
          <div className="w-full flex flex-col items-center gap-2">
            <div
              ref={touchPadRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-72 rounded-3xl bg-gradient-to-b from-zinc-800/80 to-zinc-900/95 border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 cursor-pointer touch-none active:border-amber-400/50 transition-colors"
            >
              {/* Subtle Touchpad Grid Texture */}
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Center Touch Indicator */}
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-amber-400/10 border border-amber-400/30 flex flex-col items-center justify-center text-amber-300 pointer-events-none"
              >
                <MousePointer className="w-6 h-6 stroke-[1.8] mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider">TAP = OK</span>
              </motion.div>

              <div className="absolute bottom-4 text-center pointer-events-none">
                <p className="text-[11px] font-medium text-stone-300">
                  Swipe anywhere to navigate TV
                </p>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                  Tap anywhere to select · Fast gesture response
                </p>
              </div>

              {/* Dynamic Gesture Feedback Pill */}
              <AnimatePresence>
                {lastGesture && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-4 px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider shadow-lg"
                  >
                    {lastGesture.replace('_', ' ')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* CLASSIC SPATIAL D-PAD                                        */
          /* ============================================================ */
          <div className="relative w-64 h-64 rounded-full bg-zinc-900/90 border border-white/15 shadow-2xl flex items-center justify-center p-3">
            {/* UP */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_up')}
              className="absolute top-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
            >
              <ChevronUp className="w-7 h-7" />
            </motion.button>

            {/* DOWN */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_down')}
              className="absolute bottom-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
            >
              <ChevronDown className="w-7 h-7" />
            </motion.button>

            {/* LEFT */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_left')}
              className="absolute left-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
            >
              <ChevronLeft className="w-7 h-7" />
            </motion.button>

            {/* RIGHT */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_right')}
              className="absolute right-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
            >
              <ChevronRight className="w-7 h-7" />
            </motion.button>

            {/* CENTER OK BUTTON */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => sendCommand('ok')}
              className="w-22 h-22 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold text-base shadow-xl flex items-center justify-center cursor-pointer border-2 border-amber-200"
            >
              OK
            </motion.button>
          </div>
        )}

        {/* 3. Action Controls Deck */}
        <div className="flex items-center justify-center gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('back')}
            className="flex-1 py-3 px-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-300 active:text-amber-400 cursor-pointer shadow"
          >
            <CornerUpLeft className="w-4 h-4" />
            <span>Back</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('skip_prev')}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:text-amber-400 cursor-pointer shadow"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('play_pause')}
            className="w-14 h-12 rounded-2xl bg-amber-400 text-black font-semibold flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
            title="Play/Pause"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('skip_next')}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:text-amber-400 cursor-pointer shadow"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const nextTab = activeTab === 'photos' ? 'videos' : 'photos';
              setActiveTab(nextTab);
              sendCommand('switch_hub', { tab: nextTab });
            }}
            className="flex-1 py-3 px-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center gap-1 text-xs font-semibold text-zinc-300 active:text-amber-400 cursor-pointer shadow truncate"
          >
            {activeTab === 'photos' ? <Film className="w-4 h-4 text-amber-400" /> : <ImageIcon className="w-4 h-4 text-sky-400" />}
            <span className="capitalize">{activeTab === 'photos' ? 'Videos' : 'Photos'}</span>
          </motion.button>
        </div>

        {/* 4. Quick Trip Switcher */}
        <div className="w-full">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Jump to Album on TV
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TRIP_COLLECTIONS.map(trip => (
              <motion.button
                key={trip.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => sendCommand('select_album', { folderId: trip.id, title: trip.name })}
                className="py-2.5 px-3 rounded-xl bg-zinc-900/80 active:bg-amber-400 active:text-black border border-white/10 text-left text-xs font-medium text-stone-200 truncate cursor-pointer transition-colors shadow-sm"
              >
                {trip.name}
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-zinc-500 font-mono py-1">
        DriveFrame Phone Remote · {controlMode === 'trackpad' ? 'Touchpad Active' : 'D-Pad Active'}
      </footer>
    </div>
  );
}

export default function MobileRemotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0e11] text-stone-300 flex items-center justify-center font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400 mr-2" />
          Loading Remote Controller…
        </div>
      }
    >
      <RemoteControllerContent />
    </Suspense>
  );
}

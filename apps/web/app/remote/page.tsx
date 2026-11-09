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
  Pause,
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
  Navigation,
  LogOut,
} from 'lucide-react';
import { AlamsFrameLogo } from '@/components/brand/AlamsFrameLogo';

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
  const [controlMode, setControlMode] = useState<'cursor' | 'dpad'>('cursor');
  const [fingerFeedbackPos, setFingerFeedbackPos] = useState<{ x: number; y: number } | null>(null);

  // High-performance non-blocking movement accumulator
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchPadRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);

  // Delta accumulator and in-flight request protection
  const pendingDelta = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const isSendingDelta = useRef(false);

  // Send Remote Command over sync channel
  const sendCommand = useCallback(
    async (type: string, payload?: any) => {
      // Gentle mobile haptic vibration
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {}
      }

      try {
        await fetch('/api/remote/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: pairCode,
            command: {
              type,
              payload,
            },
          }),
        });
      } catch (err) {
        console.error('Remote command failed:', err);
      }
    },
    [pairCode]
  );

  // Flush buffered cursor movement with zero connection blockage
  const flushCursorDelta = useCallback(async () => {
    if (isSendingDelta.current) return;
    if (Math.abs(pendingDelta.current.dx) < 0.1 && Math.abs(pendingDelta.current.dy) < 0.1) return;

    const dxToSend = pendingDelta.current.dx;
    const dyToSend = pendingDelta.current.dy;
    pendingDelta.current = { dx: 0, dy: 0 };

    isSendingDelta.current = true;
    try {
      await fetch('/api/remote/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pairCode,
          command: {
            type: 'cursor_move',
            payload: { dx: dxToSend, dy: dyToSend },
          },
        }),
      });
    } catch (err) {
      console.error('Failed to sync cursor delta:', err);
    } finally {
      isSendingDelta.current = false;
      // If new delta arrived while sending, flush immediately
      if (Math.abs(pendingDelta.current.dx) >= 0.1 || Math.abs(pendingDelta.current.dy) >= 0.1) {
        flushCursorDelta();
      }
    }
  }, [pairCode]);

  // Mouse Cursor Touchpad Engine:
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = touchPadRef.current?.getBoundingClientRect();
    if (rect) {
      setFingerFeedbackPos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }

    lastTouchPos.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouchPos.current || !touchPadRef.current) return;
    const touch = e.touches[0];
    const rect = touchPadRef.current.getBoundingClientRect();

    setFingerFeedbackPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });

    const dx = touch.clientX - lastTouchPos.current.x;
    const dy = touch.clientY - lastTouchPos.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDragging.current = true;
    }

    // Convert pixel delta on phone into normalized TV movement multiplier (smooth glide)
    const sensitivity = 0.75;
    const deltaX = (dx / rect.width) * 100 * sensitivity;
    const deltaY = (dy / rect.height) * 100 * sensitivity;

    pendingDelta.current.dx += deltaX;
    pendingDelta.current.dy += deltaY;

    lastTouchPos.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    flushCursorDelta();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setFingerFeedbackPos(null);

    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const totalDist = Math.hypot(
      touch.clientX - touchStartPos.current.x,
      touch.clientY - touchStartPos.current.y
    );
    const dt = Date.now() - touchStartPos.current.time;

    // Fast tap with minimal travel (< 12px in under 320ms) = TV Cursor Click!
    if (!isDragging.current || (totalDist < 12 && dt < 320)) {
      sendCommand('cursor_click');
    }

    // Flush any remaining deltas
    flushCursorDelta();

    touchStartPos.current = null;
    lastTouchPos.current = null;
    isDragging.current = false;
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#101113] text-[#F5F5F2] flex flex-col justify-between p-4 sm:p-5 select-none font-sans">
      {/* 1. Header with prominent Back Button & Status */}
      <header className="flex items-center justify-between pb-3 border-b border-[#303238]">
        <div className="flex items-center gap-2.5">
          {/* Prominent Back Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('back')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D8C6A1] hover:bg-[#E4D5B5] text-[#101113] font-bold text-xs cursor-pointer shadow-md active:bg-[#E4D5B5] transition-colors"
            title="Back / Exit on TV"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>TV</span>
          </motion.button>

          <div>
            <AlamsFrameLogo className="h-4.5 w-auto text-[#D8C6A1]" />
            <p className="text-[10px] text-[#D8C6A1] font-mono flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8C6A1] animate-pulse" />
              Connected · #{pairCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector: Mouse Cursor vs D-Pad */}
          <div className="flex items-center bg-[#191B1F] border border-[#303238] p-1 rounded-full gap-1 shadow-inner">
            <button
              onClick={() => setControlMode('cursor')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                controlMode === 'cursor'
                  ? 'bg-[#D8C6A1] text-[#101113] shadow-sm'
                  : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
              }`}
            >
              <Navigation className="w-3 h-3 fill-current rotate-45" />
              <span>Mouse</span>
            </button>
            <button
              onClick={() => setControlMode('dpad')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                controlMode === 'dpad'
                  ? 'bg-[#D8C6A1] text-[#101113] shadow-sm'
                  : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>D-Pad</span>
            </button>
          </div>

          {/* Lock Vault / Sign Out */}
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="w-8 h-8 rounded-full bg-[#191B1F] border border-[#303238] flex items-center justify-center text-[#A3A6AD] hover:text-[#D8C6A1] cursor-pointer transition-colors shadow-sm"
            title="Lock Vault & Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Interactive Surface */}
      <main className="my-auto flex flex-col items-center gap-3.5 py-2 w-full max-w-sm mx-auto">
        {controlMode === 'cursor' ? (
          /* ============================================================ */
          /* MOUSE CURSOR TOUCHPAD (Smooth Delta Glide + Tap Click)       */
          /* ============================================================ */
          <div className="w-full flex flex-col items-center gap-2">
            <div
              ref={touchPadRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-80 rounded-3xl bg-[#191B1F] border border-[#303238] shadow-2xl flex flex-col items-center justify-center p-6 cursor-crosshair touch-none active:border-[#D8C6A1]/60 transition-colors overflow-hidden"
            >
              {/* Subtle Precision Grid Lines */}
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

              {/* Dynamic Finger Follower Glow */}
              {fingerFeedbackPos && (
                <div
                  className="absolute w-14 h-14 rounded-full bg-[#D8C6A1]/25 blur-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                  style={{
                    left: `${fingerFeedbackPos.x}px`,
                    top: `${fingerFeedbackPos.y}px`,
                  }}
                />
              )}

              {/* Center Guidance Icon */}
              <div className="flex flex-col items-center justify-center text-[#D8C6A1] pointer-events-none opacity-85">
                <div className="w-16 h-16 rounded-2xl bg-[#D8C6A1]/10 border border-[#D8C6A1]/25 flex items-center justify-center mb-2 shadow-inner">
                  <Navigation className="w-7 h-7 fill-[#D8C6A1] rotate-45" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-[#D8C6A1]">
                  Touchpad Mouse
                </span>
                <p className="text-[11px] text-[#F5F5F2] font-medium mt-1">
                  Glide finger to move TV cursor
                </p>
                <p className="text-[10px] text-[#A3A6AD] font-mono">
                  Tap anywhere = Click
                </p>
              </div>

              {/* Bottom Quick Click Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => sendCommand('cursor_click')}
                className="absolute bottom-3 left-4 right-4 py-2.5 rounded-2xl bg-[#D8C6A1] active:bg-[#E4D5B5] text-[#101113] font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Click Target [OK]</span>
              </motion.button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* CLASSIC SPATIAL D-PAD                                        */
          /* ============================================================ */
          <div className="relative w-68 h-68 rounded-full bg-[#191B1F] border border-[#303238] shadow-2xl flex items-center justify-center p-3">
            {/* UP */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_up')}
              className="absolute top-2 w-14 h-14 rounded-full bg-white/5 active:bg-[#D8C6A1]/30 flex items-center justify-center text-[#A3A6AD] active:text-[#D8C6A1] cursor-pointer transition-colors"
            >
              <ChevronUp className="w-7 h-7" />
            </motion.button>

            {/* DOWN */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_down')}
              className="absolute bottom-2 w-14 h-14 rounded-full bg-white/5 active:bg-[#D8C6A1]/30 flex items-center justify-center text-[#A3A6AD] active:text-[#D8C6A1] cursor-pointer transition-colors"
            >
              <ChevronDown className="w-7 h-7" />
            </motion.button>

            {/* LEFT */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_left')}
              className="absolute left-2 w-14 h-14 rounded-full bg-white/5 active:bg-[#D8C6A1]/30 flex items-center justify-center text-[#A3A6AD] active:text-[#D8C6A1] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </motion.button>

            {/* RIGHT */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendCommand('dpad_right')}
              className="absolute right-2 w-14 h-14 rounded-full bg-white/5 active:bg-[#D8C6A1]/30 flex items-center justify-center text-[#A3A6AD] active:text-[#D8C6A1] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-7 h-7" />
            </motion.button>

            {/* CENTER OK BUTTON */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => sendCommand('ok')}
              className="w-22 h-22 rounded-full bg-[#D8C6A1] active:bg-[#E4D5B5] text-[#101113] font-bold text-base shadow-xl flex items-center justify-center cursor-pointer border-2 border-[#E4D5B5]"
            >
              OK
            </motion.button>
          </div>
        )}

        {/* 3. Action Controls Deck */}
        <div className="flex items-center justify-center gap-2.5 w-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('back')}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#191B1F] border border-[#303238] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#F5F5F2] active:text-[#D8C6A1] cursor-pointer shadow-sm transition-colors"
          >
            <CornerUpLeft className="w-4 h-4 text-[#D8C6A1]" />
            <span>Back</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('skip_prev')}
            className="w-12 h-12 rounded-2xl bg-[#191B1F] border border-[#303238] flex items-center justify-center text-[#A3A6AD] active:text-[#D8C6A1] cursor-pointer shadow-sm transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('play_pause')}
            className="w-14 h-12 rounded-2xl bg-[#D8C6A1] text-[#101113] font-semibold flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform"
            title="Play/Pause"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('skip_next')}
            className="w-12 h-12 rounded-2xl bg-[#191B1F] border border-[#303238] flex items-center justify-center text-[#A3A6AD] active:text-[#D8C6A1] cursor-pointer shadow-sm transition-colors"
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
            className="flex-1 py-3 px-3 rounded-2xl bg-[#191B1F] border border-[#303238] flex items-center justify-center gap-1 text-xs font-semibold text-[#F5F5F2] active:text-[#D8C6A1] cursor-pointer shadow-sm truncate transition-colors"
          >
            {activeTab === 'photos' ? <Film className="w-4 h-4 text-[#D8C6A1]" /> : <ImageIcon className="w-4 h-4 text-[#D8C6A1]" />}
            <span className="capitalize">{activeTab === 'photos' ? 'Videos' : 'Photos'}</span>
          </motion.button>
        </div>

        {/* 4. Quick Trip Switcher */}
        <div className="w-full">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#A3A6AD] mb-1.5 px-1 font-semibold">
            Jump to Album on TV
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TRIP_COLLECTIONS.map(trip => (
              <motion.button
                key={trip.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => sendCommand('select_album', { folderId: trip.id, title: trip.name })}
                className="py-2.5 px-3 rounded-xl bg-[#191B1F] hover:bg-[#22252A] active:bg-[#D8C6A1] active:text-[#101113] border border-[#303238] text-left text-xs font-medium text-[#F5F5F2] truncate cursor-pointer transition-colors shadow-sm"
              >
                {trip.name}
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-[#A3A6AD]/70 font-mono py-1">
        Alam&apos;s Frame Mouse Touchpad · Glide to move cursor · Tap to click
      </footer>
    </div>
  );
}

export default function MobileRemotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101113] text-[#A3A6AD] flex items-center justify-center font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#D8C6A1] mr-2" />
          Loading Remote Controller…
        </div>
      }
    >
      <RemoteControllerContent />
    </Suspense>
  );
}

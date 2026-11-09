'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
  CheckCircle2,
  Sliders,
  Volume2,
  Loader2,
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
  const [lastSent, setLastSent] = useState<string>('');

  // Send Remote Command over sync channel
  const sendCommand = useCallback(
    async (type: string, payload?: any) => {
      // Gentle mobile haptic vibration
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch {}
      }

      setLastSent(type);
      setTimeout(() => setLastSent(''), 600);

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

  return (
    <div className="min-h-[100dvh] w-full bg-[#0d0e11] text-stone-100 flex flex-col justify-between p-5 select-none font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">DriveFrame TV</h1>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected · #{pairCode}
            </p>
          </div>
        </div>

        {/* Photos vs Videos Toggle */}
        <div className="flex items-center bg-zinc-900 border border-white/10 p-1 rounded-full">
          <button
            onClick={() => {
              setActiveTab('photos');
              sendCommand('switch_hub', { tab: 'photos' });
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'photos' ? 'bg-amber-400 text-black font-semibold shadow' : 'text-zinc-400'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => {
              setActiveTab('videos');
              sendCommand('switch_hub', { tab: 'videos' });
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
              activeTab === 'videos' ? 'bg-amber-400 text-black font-semibold shadow' : 'text-zinc-400'
            }`}
          >
            Videos
          </button>
        </div>
      </header>

      {/* Main Touch Trackpad & D-Pad */}
      <main className="my-auto flex flex-col items-center gap-6 py-4">
        {/* Spatial Circular D-Pad */}
        <div className="relative w-64 h-64 rounded-full bg-zinc-900/90 border border-white/15 shadow-2xl flex items-center justify-center p-3">
          {/* UP */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => sendCommand('dpad_up')}
            className="absolute top-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
          >
            <ChevronUp className="w-7 h-7" />
          </motion.button>

          {/* DOWN */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => sendCommand('dpad_down')}
            className="absolute bottom-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
          >
            <ChevronDown className="w-7 h-7" />
          </motion.button>

          {/* LEFT */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => sendCommand('dpad_left')}
            className="absolute left-2 w-14 h-14 rounded-full bg-white/5 active:bg-amber-400/30 flex items-center justify-center text-zinc-300 active:text-amber-300 cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7" />
          </motion.button>

          {/* RIGHT */}
          <motion.button
            whileTap={{ scale: 0.92 }}
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

        {/* Playback Action Controls */}
        <div className="flex items-center justify-center gap-4 w-full max-w-xs">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('skip_prev')}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:text-amber-400 cursor-pointer shadow"
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('play_pause')}
            className="w-16 h-14 rounded-2xl bg-white text-black font-semibold flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('skip_next')}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:text-amber-400 cursor-pointer shadow"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendCommand('back')}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:text-amber-400 cursor-pointer shadow"
            title="Back / Exit"
          >
            <CornerUpLeft className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Quick Album Switcher */}
        <div className="w-full max-w-sm">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Switch Trip on TV
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

      {/* Footer Info */}
      <footer className="text-center text-[10px] text-zinc-500 font-mono py-1">
        DriveFrame Phone Remote · Tap any button to control TV
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

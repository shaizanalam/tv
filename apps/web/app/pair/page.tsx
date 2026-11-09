'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tv, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

function PairContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get('code') || '482917';

  const [code, setCode] = useState(initialCode);
  const [deviceName, setDeviceName] = useState('Living Room JioFiber TV');
  const [status, setStatus] = useState<'idle' | 'approving' | 'success'>('idle');

  const handleApprove = async () => {
    setStatus('approving');
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle warm amber glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Tv className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-100">
            Alam&apos;s Frame TV
          </h1>
          <p className="text-xs text-zinc-400">Device Authorization</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-light text-stone-100">Television Connected!</h2>
          <p className="text-sm text-zinc-400">
            {deviceName} has been approved to display your family gallery. Your TV is now loading the photo library.
          </p>
          <button
            onClick={() => router.push('/tv')}
            className="mt-4 w-full py-3.5 px-4 rounded-xl bg-amber-400 text-zinc-950 font-medium text-sm hover:bg-amber-300 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>Go to TV View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-2">
              6-Digit Pairing Code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={7}
              placeholder="000 000"
              className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-zinc-950 border border-zinc-800 rounded-2xl py-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-zinc-400 mb-2">
              TV Device Nickname
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Authorizing allows this television to stream authorized photos and execute ambient slideshows. You can revoke access anytime.
            </span>
          </div>

          <button
            onClick={handleApprove}
            disabled={status === 'approving'}
            className="w-full py-4 px-6 rounded-2xl bg-amber-400 text-zinc-950 font-semibold text-base hover:bg-amber-300 transition-all duration-200 shadow-lg disabled:opacity-50"
          >
            {status === 'approving' ? 'Authorizing TV...' : 'Authorize Television'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MobilePairPage() {
  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-stone-100 flex items-center justify-center p-6 select-none">
      <Suspense fallback={<div className="text-zinc-500">Loading pairing screen...</div>}>
        <PairContent />
      </Suspense>
    </div>
  );
}

'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tv, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { AlamsFrameLogo } from '@/components/brand/AlamsFrameLogo';

function PairContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get('code') || '482917';

  const [code, setCode] = useState(initialCode);
  const [deviceName, setDeviceName] = useState('Living Room Smart TV');
  const [status, setStatus] = useState<'idle' | 'approving' | 'success'>('idle');

  const handleApprove = async () => {
    setStatus('approving');
    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  return (
    <div className="w-full max-w-md bg-[#191B1F] border border-[#303238] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle warm champagne glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D8C6A1]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#D8C6A1]/15 border border-[#D8C6A1]/30 flex items-center justify-center text-[#D8C6A1]">
          <Tv className="w-6 h-6" />
        </div>
        <div>
          <AlamsFrameLogo className="h-5 w-auto text-[#D8C6A1]" />
          <p className="text-xs text-[#A3A6AD] font-mono mt-0.5">Television Authorization</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-light text-[#F5F5F2]">Television Connected!</h2>
          <p className="text-sm text-[#A3A6AD]">
            {deviceName} has been approved to display your family gallery. Your TV is now loading the photo library.
          </p>
          <button
            onClick={() => router.push('/tv')}
            className="mt-4 w-full py-3.5 px-4 rounded-xl bg-[#D8C6A1] hover:bg-[#E4D5B5] text-[#101113] font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Go to TV View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-[#A3A6AD] mb-2 font-semibold">
              6-Digit Pairing Code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={7}
              placeholder="000 000"
              className="w-full text-center text-3xl font-mono font-bold tracking-widest bg-[#101113] border border-[#303238] rounded-2xl py-3 text-[#D8C6A1] focus:outline-none focus:ring-2 focus:ring-[#D8C6A1]/40"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-mono text-[#A3A6AD] mb-2 font-semibold">
              TV Device Nickname
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              className="w-full bg-[#101113] border border-[#303238] rounded-xl px-4 py-3 text-sm text-[#F5F5F2] focus:outline-none focus:ring-2 focus:ring-[#D8C6A1]/40"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#101113]/60 border border-[#303238] flex items-start gap-3 text-xs text-[#A3A6AD]">
            <ShieldCheck className="w-4 h-4 text-[#D8C6A1] shrink-0 mt-0.5" />
            <span>
              Authorizing allows this television to stream family memories and cinema clips securely.
            </span>
          </div>

          <button
            onClick={handleApprove}
            disabled={status === 'approving'}
            className="w-full py-4 px-6 rounded-2xl bg-[#D8C6A1] hover:bg-[#E4D5B5] text-[#101113] font-semibold text-base transition-all duration-200 shadow-lg disabled:opacity-50 cursor-pointer"
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
    <div className="min-h-[100dvh] bg-[#101113] text-[#F5F5F2] flex items-center justify-center p-6 select-none font-sans">
      <Suspense fallback={<div className="text-[#A3A6AD]">Loading pairing screen...</div>}>
        <PairContent />
      </Suspense>
    </div>
  );
}


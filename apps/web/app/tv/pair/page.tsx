'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { Tv, Sparkles, Smartphone, ArrowRight } from 'lucide-react';

export default function TVPairPage() {
  const router = useRouter();
  const [pairingCode] = useState('482 917');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    // Generate QR Code targeting the mobile pair approval URL
    const pairUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/pair?code=482917`;
    QRCode.toDataURL(pairUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#09090b',
        light: '#fafaf9',
      },
    }).then(setQrDataUrl);

    // 5-minute countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#09090b] text-stone-100 flex flex-col justify-between p-12 lg:p-20 select-none overflow-hidden">
      {/* Ambient background glow - warm museum gold */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Tv className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-100">
              Alam&apos;s Frame TV
            </h1>
            <p className="text-zinc-400 text-sm">Television Pairing</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-full text-zinc-300 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
      </header>

      {/* Main 2-Column TV Content */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center my-auto z-10 max-w-6xl mx-auto w-full">
        {/* Left: Pairing Code */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Zero-Password TV Setup
          </div>

          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-stone-100">
            Connect your TV to your family gallery
          </h2>

          <p className="text-lg text-zinc-400 font-normal leading-relaxed">
            No typing passwords with a TV remote. Scan the QR code with your phone or visit{' '}
            <span className="text-amber-400 font-mono font-medium">/pair</span> on any authorized device.
          </p>

          <div className="bg-zinc-900/90 border-2 border-zinc-800 rounded-3xl p-8 text-center space-y-2 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-mono">
              Your 6-Digit Pairing Code
            </p>
            <div className="text-6xl lg:text-7xl font-mono font-bold tracking-widest text-amber-400 drop-shadow-lg">
              {pairingCode}
            </div>
          </div>
        </div>

        {/* Right: QR Code & Quick Action */}
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl backdrop-blur-xl">
          <div className="p-4 bg-stone-100 rounded-2xl shadow-2xl mb-6">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Pairing QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 bg-zinc-800 animate-pulse rounded-xl" />
            )}
          </div>

          <div className="flex items-center gap-3 text-stone-200 text-base font-medium">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <span>Point your phone camera here to pair</span>
          </div>

          {/* Test / Dev Bypass Button */}
          <button
            onClick={() => router.push('/tv')}
            className="mt-6 flex items-center gap-2 text-xs text-zinc-400 hover:text-amber-400 transition-colors duration-200"
          >
            <span>Preview TV Gallery Directly</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="text-center text-sm text-zinc-500 z-10">
        JioSphere TV & Smart TV Compatible · Optimized for 1080p D-Pad Remote Navigation
      </footer>
    </div>
  );
}


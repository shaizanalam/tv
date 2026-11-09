'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { Tv, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { AlamsFrameLogo } from '@/components/brand/AlamsFrameLogo';

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
        dark: '#101113',
        light: '#F5F5F2',
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
    <div className="relative min-h-[100dvh] w-full bg-[#101113] text-[#F5F5F2] flex flex-col justify-between p-12 lg:p-20 select-none overflow-hidden font-sans">
      {/* Ambient background glow - warm champagne gold */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D8C6A1]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <AlamsFrameLogo className="h-8 lg:h-9 w-auto text-[#D8C6A1]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#A3A6AD] bg-[#191B1F] border border-[#303238] px-3 py-1 rounded-full">
            Television Pairing
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#191B1F] border border-[#303238] px-4 py-2 rounded-full text-[#A3A6AD] text-sm font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D8C6A1] animate-pulse" />
          <span>Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
      </header>

      {/* Main 2-Column TV Content */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center my-auto z-10 max-w-6xl mx-auto w-full">
        {/* Left: Pairing Code */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8C6A1]/10 border border-[#D8C6A1]/20 text-[#D8C6A1] text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Zero-Password TV Setup
          </div>

          <h2 className="text-4xl lg:text-5xl font-serif font-light tracking-tight text-[#F5F5F2] leading-tight">
            Connect your TV to your family gallery
          </h2>

          <p className="text-lg text-[#A3A6AD] font-light leading-relaxed">
            No typing passwords with a TV remote. Scan the QR code with your phone or visit{' '}
            <span className="text-[#D8C6A1] font-mono font-medium">/pair</span> on any authorized device.
          </p>

          <div className="bg-[#191B1F] border-2 border-[#303238] rounded-3xl p-8 text-center space-y-2 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-[#A3A6AD] font-mono font-semibold">
              Your 6-Digit Pairing Code
            </p>
            <div className="text-6xl lg:text-7xl font-mono font-bold tracking-widest text-[#D8C6A1] drop-shadow-lg">
              {pairingCode}
            </div>
          </div>
        </div>

        {/* Right: QR Code & Quick Action */}
        <div className="flex flex-col items-center justify-center p-8 bg-[#191B1F]/60 border border-[#303238] rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="p-4 bg-[#F5F5F2] rounded-2xl shadow-2xl mb-6">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Pairing QR Code" className="w-64 h-64 rounded-lg" />
            ) : (
              <div className="w-64 h-64 bg-[#101113] animate-pulse rounded-xl" />
            )}
          </div>

          <div className="flex items-center gap-3 text-[#F5F5F2] text-base font-medium">
            <Smartphone className="w-5 h-5 text-[#D8C6A1]" />
            <span>Point your phone camera here to pair</span>
          </div>

          {/* Test / Dev Bypass Button */}
          <button
            onClick={() => router.push('/tv')}
            className="mt-6 flex items-center gap-2 text-xs text-[#A3A6AD] hover:text-[#D8C6A1] transition-colors duration-200 cursor-pointer"
          >
            <span>Preview TV Gallery Directly</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="text-center text-sm text-[#A3A6AD]/70 z-10 font-mono">
        Smart TV & JioSphere Compatible · Optimized for D-Pad Remote Navigation
      </footer>
    </div>
  );
}



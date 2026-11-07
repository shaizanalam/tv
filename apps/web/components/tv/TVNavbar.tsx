'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, Disc3, ShieldCheck } from 'lucide-react';

interface TVNavbarProps {
  title?: string;
  subtitle?: string;
  activeSection?: string;
}

export function TVNavbar({
  title = 'DriveFrame TV',
  subtitle = 'Family Memories',
  activeSection = 'Home',
}: TVNavbarProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full flex items-center justify-between pb-6 mb-8 border-b border-zinc-800/60 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Disc3 className="w-5 h-5 text-amber-400 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-stone-100 flex items-center gap-3">
            {title}
            <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-zinc-800 text-zinc-300 uppercase tracking-widest">
              {activeSection}
            </span>
          </h1>
          <p className="text-sm text-zinc-400 font-light mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* STB TV Status Bar */}
      <div className="flex items-center gap-6 text-zinc-400">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Drive Connected</span>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-400">
          <Wifi className="w-4 h-4 text-zinc-400" />
          <span>STB Online</span>
        </div>

        {/* 10-Foot Readable Clock */}
        <div className="text-xl md:text-2xl font-light text-stone-200 tracking-wider pl-4 border-l border-zinc-800">
          {timeStr || '--:--'}
        </div>
      </div>
    </header>
  );
}


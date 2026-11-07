'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tv, Clock } from 'lucide-react';

interface TVNavbarProps {
  title?: string;
  subtitle?: string;
}

export function TVNavbar({
  title = 'DriveFrame',
  subtitle = 'Library',
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
    <header className="w-full flex items-center justify-between pb-6 select-none">
      {/* Brand Identity */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <Tv className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-semibold tracking-tight text-white">
            {title}
          </span>
          <span className="text-xs text-white/40 font-light tracking-wider uppercase">
            / {subtitle}
          </span>
        </div>
      </Link>

      {/* Minimal Apple Glass Clock */}
      <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-2xl border border-white/10 px-4 py-1.5 rounded-full text-white/90 text-sm font-medium tracking-wide">
        <Clock className="w-3.5 h-3.5 text-white/60" />
        <span>{timeStr || '--:--'}</span>
      </div>
    </header>
  );
}

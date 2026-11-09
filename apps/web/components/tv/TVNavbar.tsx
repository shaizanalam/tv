'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { AlamsFrameLogo } from '@/components/brand/AlamsFrameLogo';

interface TVNavbarProps {
  title?: string;
  subtitle?: string;
}

export function TVNavbar({
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
      <Link href="/" className="flex items-center gap-4 group">
        <AlamsFrameLogo className="h-7 w-auto text-[#F5F5F2] group-hover:text-[#D8C6A1] transition-colors" />
        <span className="text-xs text-[#A3A6AD] font-light tracking-wider uppercase pl-3 border-l border-[#303238]">
          {subtitle}
        </span>
      </Link>

      {/* Minimal Apple Glass Clock */}
      <div className="flex items-center gap-2 bg-[#191B1F] border border-[#303238] px-4 py-1.5 rounded-full text-[#F5F5F2] text-sm font-medium tracking-wide">
        <Clock className="w-3.5 h-3.5 text-[#A3A6AD]" />
        <span>{timeStr || '--:--'}</span>
      </div>
    </header>
  );
}

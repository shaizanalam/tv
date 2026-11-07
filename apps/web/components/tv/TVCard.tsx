'use client';

import React, { useEffect, useRef } from 'react';
import { TVFocusableNode } from '@/lib/types';

interface TVCardProps {
  id: string;
  row: number;
  col: number;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string | null;
  isActiveFocus?: boolean;
  onRegister: (node: TVFocusableNode) => () => void;
  onSelect: () => void;
  onBack?: () => void;
  className?: string;
}

export function TVCard({
  id,
  row,
  col,
  title,
  subtitle,
  badge,
  imageUrl,
  isActiveFocus,
  onRegister,
  onSelect,
  onBack,
  className = '',
}: TVCardProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    const cleanup = onRegister({
      id,
      ref: elementRef.current,
      row,
      col,
      onSelect,
      onBack,
    });
    return cleanup;
  }, [id, row, col, onRegister, onSelect, onBack]);

  return (
    <div
      ref={elementRef}
      tabIndex={-1}
      onClick={onSelect}
      className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ease-out outline-none select-none ${
        isActiveFocus
          ? 'scale-105 z-20 ring-4 ring-amber-400 shadow-[0_0_45px_rgba(251,191,36,0.45)] brightness-110'
          : 'scale-100 opacity-85 hover:opacity-100 border border-zinc-800/80 bg-zinc-900/60'
      } ${className}`}
    >
      {/* Background Image / Placeholder */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <span className="text-zinc-600 text-3xl font-light">DriveFrame</span>
          </div>
        )}

        {/* Ambient Dark Gradient Scrim for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        {/* Optional Badge */}
        {badge && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase bg-amber-400/90 text-zinc-950 backdrop-blur-md shadow-sm">
            {badge}
          </div>
        )}
      </div>

      {/* 10-Foot Readable Typography */}
      <div className="p-5 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800/40">
        <h3 className="text-xl md:text-2xl font-medium tracking-tight text-stone-100 truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm md:text-base text-zinc-400 font-normal mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

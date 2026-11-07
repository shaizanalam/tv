'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TVFocusableNode } from '@/lib/types';

interface TVCardProps {
  id: string;
  row: number;
  col: number;
  title: string;
  subtitle?: string;
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
    <motion.div
      ref={elementRef}
      tabIndex={-1}
      onClick={onSelect}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`group relative cursor-pointer rounded-2xl overflow-hidden select-none outline-none transition-all duration-300 ${
        isActiveFocus
          ? 'scale-105 -translate-y-2 z-20 ring-2 ring-white shadow-[0_25px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(255,255,255,0.2)]'
          : 'scale-100 opacity-85 hover:opacity-100 border border-white/10 shadow-lg'
      } ${className}`}
    >
      {/* 16:10 Cinematic Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <span className="text-zinc-600 text-xl font-light">Album</span>
          </div>
        )}

        {/* Ambient Bottom Scrim for Title Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Specular Liquid Glass Top Edge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Title Content Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5">
          <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow-md truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-white/70 font-normal mt-0.5 tracking-wide drop-shadow truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

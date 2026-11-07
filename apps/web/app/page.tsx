'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tv, Play, ArrowRight, Search } from 'lucide-react';

const FEATURED_ALBUMS = [
  {
    title: 'Dubai 2025',
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    cover: 'https://lh3.googleusercontent.com/d/1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz=s1000',
    type: '50 Photos & Videos',
  },
  {
    title: 'Ajmer Agra 25',
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    cover: 'https://lh3.googleusercontent.com/d/1GDyj4qioexLHWgWOow3johLzVJrt7DBi=s1000',
    type: '50 Photos',
  },
  {
    title: 'Meccah & Madina',
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    cover: 'https://lh3.googleusercontent.com/d/1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0=s1000',
    type: 'Family Journey',
  },
  {
    title: 'GoPro-Exports',
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    cover: 'https://lh3.googleusercontent.com/d/1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z=s1000',
    type: 'Action Videos',
  },
  {
    title: 'Pachmari',
    id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    cover: 'https://lh3.googleusercontent.com/d/17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91=s1000',
    type: 'Nature & Hills',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [folderInput, setFolderInput] = useState('');

  const handleLaunch = (folderId?: string) => {
    if (folderId) {
      router.push(`/tv?folder=${encodeURIComponent(folderId)}`);
    } else if (folderInput.trim()) {
      router.push(`/tv?folder=${encodeURIComponent(folderInput.trim())}`);
    } else {
      router.push('/tv');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#070709] text-white selection:bg-white selection:text-black flex flex-col justify-between">
      {/* Apple Minimalist Glass Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/15 flex items-center justify-center transition-transform group-hover:scale-105">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            DriveFrame
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/tv"
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all duration-200 shadow-lg"
          >
            Open TV Interface
          </Link>
        </div>
      </nav>

      {/* Main Showcase Hero */}
      <main className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-12 flex-1 flex flex-col justify-center text-center space-y-10">
        <div className="space-y-4 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-5xl sm:text-7xl font-semibold tracking-tight text-white leading-tight"
          >
            Your memories, on the big screen.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-lg sm:text-xl text-white/60 font-light"
          >
            A private television gallery for your Google Drive family photos and videos.
          </motion.p>
        </div>

        {/* Minimalist Liquid Glass Input Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="max-w-xl mx-auto w-full"
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleLaunch();
            }}
            className="flex items-center gap-2 p-2 rounded-full bg-white/[0.06] backdrop-blur-2xl border border-white/15 shadow-2xl transition-all focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/20"
          >
            <div className="pl-4 text-white/40">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={folderInput}
              onChange={e => setFolderInput(e.target.value)}
              placeholder="Paste Google Drive folder link..."
              className="flex-1 bg-transparent border-none text-white text-sm placeholder:text-white/40 focus:outline-none px-2"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:bg-white/90 transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>Play</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </form>
        </motion.div>

        {/* Real Album Showcase (From user's Drive) */}
        <div className="pt-8 space-y-4">
          <div className="text-xs uppercase tracking-widest text-white/40 font-mono">
            Featured Collections
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {FEATURED_ALBUMS.map(album => (
              <motion.div
                key={album.id}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLaunch(album.id)}
                className="group cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 relative aspect-[16/11] shadow-xl text-left"
              >
                <img
                  src={album.cover}
                  alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-semibold text-white drop-shadow truncate">
                    {album.title}
                  </p>
                  <p className="text-[11px] text-white/60 font-light truncate">
                    {album.type}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Clean Apple Minimal Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 flex items-center justify-between text-xs text-white/40 border-t border-white/[0.06]">
        <span>DriveFrame</span>
        <span className="font-mono">1080p Television Gallery</span>
      </footer>
    </div>
  );
}

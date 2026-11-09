'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tv, Play, Search, Moon, Sun, LogOut } from 'lucide-react';

const FEATURED_ALBUMS = [
  {
    title: 'Dubai 2025',
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    cover: '/api/drive/image?id=1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
    count: '351',
    type: 'Photos & Videos',
  },
  {
    title: 'Ajmer Agra 25',
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    cover: '/api/drive/image?id=1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
    count: '404',
    type: 'Photos & Videos',
  },
  {
    title: 'Meccah & Madina',
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    cover: '/api/drive/image?id=1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0',
    count: '593',
    type: 'Photos & Videos',
  },
  {
    title: 'GoPro-Exports',
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    cover: '/api/drive/image?id=1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
    count: '259',
    type: 'Action Clips',
  },
  {
    title: 'Pachmari',
    id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    cover: '/api/drive/image?id=17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
    count: '292',
    type: 'Photos & Videos',
  },
];

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains('dark'));
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    root.classList.toggle('dark', next);
    localStorage.setItem('driveframe-theme', next ? 'dark' : 'light');
    setIsDark(next);
  }, []);
  return { isDark, toggle };
}

export default function HomePage() {
  const router = useRouter();
  const [folderInput, setFolderInput] = useState('');
  const { isDark, toggle: toggleTheme } = useDarkMode();

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
    <div
      className="min-h-[100dvh] flex flex-col justify-between transition-colors duration-500"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-2xl glass flex items-center justify-center transition-transform group-hover:scale-105"
          >
            <Tv className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            DriveFrame
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full glass flex items-center justify-center cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? (
              <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            ) : (
              <Sun className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="w-9 h-9 rounded-full glass flex items-center justify-center cursor-pointer text-stone-400 hover:text-amber-400 transition-colors"
            title="Lock Vault & Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
          <Link
            href="/tv"
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-lg"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            Open TV
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-12 flex-1 flex flex-col justify-center text-center space-y-10">
        <div className="space-y-4 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-5xl sm:text-7xl font-semibold tracking-tight leading-tight"
          >
            Your memories,{' '}
            <span style={{ color: 'var(--accent)' }}>on the big screen.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-lg sm:text-xl font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            A private television gallery for your Google Drive photos and videos.
          </motion.p>
        </div>

        {/* Search Pill */}
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
            className="glass flex items-center gap-2 p-2 rounded-full transition-all focus-within:shadow-lg"
          >
            <div className="pl-4" style={{ color: 'var(--text-tertiary)' }}>
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={folderInput}
              onChange={e => setFolderInput(e.target.value)}
              placeholder="Paste Google Drive folder link…"
              className="flex-1 bg-transparent border-none text-sm focus:outline-none px-2"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full font-semibold text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              <span>Play</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </form>
        </motion.div>

        {/* Album Grid */}
        <div className="pt-8 space-y-4">
          <div
            className="text-xs uppercase tracking-widest font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Featured Collections
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {FEATURED_ALBUMS.map(album => (
              <motion.div
                key={album.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleLaunch(album.id)}
                className="group cursor-pointer rounded-2xl overflow-hidden relative aspect-[4/3] text-left card-surface"
              >
                <img
                  src={album.cover}
                  alt={album.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{ background: 'var(--scrim)' }} />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-semibold text-white drop-shadow truncate">
                    {album.title}
                  </p>
                  <p className="text-[11px] text-white/60 font-light truncate">
                    {album.count} {album.type}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 flex items-center justify-between text-xs"
        style={{ borderTop: '1px solid var(--separator)', color: 'var(--text-tertiary)' }}
      >
        <span>DriveFrame</span>
        <span className="font-mono">1,899 Photos & Videos</span>
      </footer>
    </div>
  );
}

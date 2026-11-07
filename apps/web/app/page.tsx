'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tv, HardDrive, Smartphone, Sparkles, ArrowRight, ShieldCheck, Zap, Search, Play } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [driveFolderInput, setDriveFolderInput] = useState('');

  const handleOpenFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveFolderInput.trim()) {
      router.push('/tv');
      return;
    }
    router.push(`/tv?folder=${encodeURIComponent(driveFolderInput.trim())}`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-stone-100 selection:bg-amber-400 selection:text-zinc-950">
      {/* Top Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Tv className="w-5 h-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-stone-100">
            DriveFrame TV
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/tv/pair"
            className="text-sm font-medium text-zinc-400 hover:text-stone-100 transition-colors duration-200"
          >
            Pair TV
          </Link>
          <Link
            href="/tv"
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors duration-200 shadow-sm"
          >
            Launch 1080p TV
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>No Database Needed · Direct Google Drive</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-stone-100 leading-[1.08]">
              Paste any Google Drive folder. Enjoy on your TV.
            </h1>

            <p className="text-lg lg:text-xl text-zinc-400 font-normal leading-relaxed max-w-[54ch]">
              No complicated database setup. Just paste your Google Drive folder link to instantly stream family photos and videos with zero lag and cinematic TV slideshow transitions.
            </p>

            {/* Direct Google Drive Folder Input */}
            <form
              onSubmit={handleOpenFolder}
              className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 shadow-2xl max-w-xl"
            >
              <div className="pl-3 text-zinc-500">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <input
                type="text"
                value={driveFolderInput}
                onChange={e => setDriveFolderInput(e.target.value)}
                placeholder="Paste Google Drive folder link or ID..."
                className="flex-1 bg-transparent border-none text-stone-100 text-sm md:text-base placeholder:text-zinc-500 focus:outline-none px-2"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-400 text-zinc-950 font-semibold text-sm hover:bg-amber-300 transition-colors flex items-center gap-2 shrink-0"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Play on TV</span>
              </button>
            </form>

            <div className="flex items-center gap-6 pt-2 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Free Tier
              </span>
              <span>·</span>
              <span>Works on JioFiber STB Browser</span>
              <span>·</span>
              <span>Zero Cloud Storage Cost</span>
            </div>
          </div>

          {/* Right Column: Visual TV Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl p-3 bg-zinc-900/90 border-2 border-zinc-800 shadow-2xl">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-950">
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80"
                  alt="DriveFrame Television Ambient Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-stone-100">
                  <div>
                    <p className="text-base font-medium">Alpine Sunsets</p>
                    <p className="text-xs text-zinc-400">Family Trips Album · 48 Photos</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-amber-400 text-zinc-950 text-xs font-mono font-bold">
                    1080p STB
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Bento Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 border-t border-zinc-800/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-light text-stone-100">No Database Needed</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Google Drive is already your database and file manager. DriveFrame reads directly from Drive so you don't have to configure or pay for database servers.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-light text-stone-100">Zero Password Pairing</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Never type passwords using a slow TV remote. Open DriveFrame on your TV and scan the QR code with your phone.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-light text-stone-100">Zero-Lag Memory Buffer</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The next 2 photos preload in the TV's local memory before the transition triggers. No waiting, no loading spinners, no lag.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 border-t border-zinc-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <p>DriveFrame TV · 100% Free · Open Source Television Digital Frame</p>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Server Storage · Direct Google Drive Streaming</span>
        </div>
      </footer>
    </div>
  );
}

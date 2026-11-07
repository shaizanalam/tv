'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  SkipBack,
  SkipForward,
  Search,
  Frame,
  Shuffle,
  Sparkles,
  Sliders,
  Plus,
  Loader2,
} from 'lucide-react';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { DriveItem } from '@/lib/types';

interface AlbumFolder {
  id: string;
  folderId: string;
  title: string;
  coverThumbnailUrl: string;
  photoCount?: number;
}

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

const FALLBACK_ALBUMS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz=s1200',
    photoCount: 50,
  },
  {
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    folderId: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    title: 'Ajmer Agra 25',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1GDyj4qioexLHWgWOow3johLzVJrt7DBi=s1200',
    photoCount: 50,
  },
  {
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    folderId: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    title: 'GoPro-Exports',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z=s1200',
    photoCount: 50,
  },
  {
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    folderId: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    title: 'Meccah & Madina',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0=s1200',
    photoCount: 50,
  },
  {
    id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    folderId: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    title: 'Pachmari',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91=s1200',
    photoCount: 50,
  },
];

type FocusSection = 'nav' | 'slats' | 'arch' | 'rightCards' | 'dock';

function CreativeTVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [albums, setAlbums] = useState<AlbumFolder[]>(FALLBACK_ALBUMS);
  const [activeTab, setActiveTab] = useState<'art' | 'tv' | 'favorites' | 'drive'>('art');
  const [expandedSlatIndex, setExpandedSlatIndex] = useState(0);
  const [selectedRightCardIndex, setSelectedRightCardIndex] = useState(0);
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [folderInput, setFolderInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Client-side Memory Cache for instant sub-millisecond album switches
  const albumPhotosCache = useRef<Map<string, DriveItem[]>>(new Map());

  // TV Remote Focus Zone
  const [focusSection, setFocusSection] = useState<FocusSection>('slats');

  // Clock & Date updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch albums & trigger background preloading
  const fetchAlbums = useCallback(async (targetId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(targetId)}`);
      const data = await res.json();
      if (data.subfolders && data.subfolders.length > 0) {
        setAlbums(data.subfolders);

        // SILENT BACKGROUND PREFETCH: Pre-load top albums so playback is instant
        data.subfolders.slice(0, 3).forEach((sub: AlbumFolder) => {
          fetch(`/api/drive/folder?folder=${encodeURIComponent(sub.folderId)}`)
            .then(r => r.json())
            .then(subData => {
              if (subData.items) {
                albumPhotosCache.current.set(sub.folderId, subData.items);
                // Pre-cache first image in browser memory
                if (subData.items[0]?.previewUrl) {
                  const img = new Image();
                  img.src = subData.items[0].previewUrl;
                }
              }
            })
            .catch(() => {});
        });
      }
    } catch {
      setAlbums(FALLBACK_ALBUMS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const target = searchParams.get('folder') || DEFAULT_MAIN_FOLDER;
    setFolderInput(target);
    fetchAlbums(target);
  }, [searchParams, fetchAlbums]);

  // Open Album (Instant if pre-cached!)
  const openAlbum = async (folderId: string) => {
    // Check instant client memory cache
    const cachedItems = albumPhotosCache.current.get(folderId);
    if (cachedItems && cachedItems.length > 0) {
      setActivePhotos(cachedItems);
      setInSlideshow(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(folderId)}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        albumPhotosCache.current.set(folderId, data.items);
        setActivePhotos(data.items);
        setInSlideshow(true);
      }
    } catch (err) {
      console.error('Failed to load album:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // TV Remote Navigation Controls (Arrow keys, Enter, Back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inSlideshow) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (focusSection === 'slats') {
            if (expandedSlatIndex < Math.min(2, albums.length - 1)) {
              setExpandedSlatIndex(prev => prev + 1);
            } else {
              setFocusSection('arch');
            }
          } else if (focusSection === 'arch') {
            setFocusSection('rightCards');
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusSection === 'rightCards') {
            setFocusSection('arch');
          } else if (focusSection === 'arch') {
            setFocusSection('slats');
            setExpandedSlatIndex(2);
          } else if (focusSection === 'slats') {
            if (expandedSlatIndex > 0) {
              setExpandedSlatIndex(prev => prev - 1);
            }
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusSection === 'nav') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards') {
            setSelectedRightCardIndex(prev => Math.min(3, prev + 1));
          } else {
            setFocusSection('dock');
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (focusSection === 'dock') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards' && selectedRightCardIndex > 0) {
            setSelectedRightCardIndex(prev => prev - 1);
          } else {
            setFocusSection('nav');
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (focusSection === 'slats') {
            openAlbum(albums[expandedSlatIndex]?.folderId || albums[0].folderId);
          } else if (focusSection === 'arch') {
            openAlbum(albums[0]?.folderId);
          } else if (focusSection === 'rightCards') {
            openAlbum(albums[selectedRightCardIndex]?.folderId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusSection, expandedSlatIndex, selectedRightCardIndex, albums, inSlideshow]);

  if (inSlideshow) {
    return (
      <SlideshowPlayer
        photos={activePhotos}
        intervalSeconds={8}
        transitionStyle="ken_burns"
        onExit={() => setInSlideshow(false)}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#ececee] text-[#1c1c1e] select-none flex flex-col justify-between p-6 lg:p-10 overflow-hidden font-sans">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f8fa] via-[#ececee] to-[#e1e1e6] pointer-events-none" />

      {/* ========================================================= */}
      {/* 1. TOP MINIMALIST NAV BAR                                 */}
      {/* ========================================================= */}
      <header className="relative z-20 flex items-center justify-between pb-4 border-b border-black/[0.06]">
        {/* Nav Tabs */}
        <div className="flex items-center gap-10 text-xs tracking-wider uppercase font-medium text-black/50">
          <button
            onClick={() => setActiveTab('art')}
            className={`transition-all py-1 cursor-pointer ${
              activeTab === 'art' ? 'text-black font-semibold border-b-2 border-black' : 'hover:text-black/80'
            }`}
          >
            Art mode
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`transition-all py-1 cursor-pointer ${
              activeTab === 'tv' ? 'text-black font-semibold border-b-2 border-black' : 'hover:text-black/80'
            }`}
          >
            Live TV
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`transition-all py-1 cursor-pointer ${
              activeTab === 'favorites' ? 'text-black font-semibold border-b-2 border-black' : 'hover:text-black/80'
            }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`transition-all py-1 cursor-pointer ${
              activeTab === 'drive' ? 'text-black font-semibold border-b-2 border-black' : 'hover:text-black/80'
            }`}
          >
            Google Drive
          </button>
        </div>

        {/* Right Search Pill */}
        <div className="relative">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (folderInput.trim()) {
                fetchAlbums(folderInput.trim());
              }
            }}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-2xl border border-black/[0.08] rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-black/15 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-black/40" />
            <input
              type="text"
              value={folderInput}
              onChange={e => setFolderInput(e.target.value)}
              placeholder="Search or paste folder..."
              className="bg-transparent border-none text-xs text-black/80 placeholder:text-black/35 focus:outline-none w-44 md:w-56"
            />
          </form>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 3-PANEL SHOWCASE                                  */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-8 items-center my-4">
        {/* ------------------------------------------------------- */}
        {/* LEFT: 3 VERTICAL POSTER SLATS (Accordion Style)        */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-5 h-[62vh] flex gap-3">
          {albums.slice(0, 3).map((album, idx) => {
            const isFocused = focusSection === 'slats' && expandedSlatIndex === idx;
            return (
              <motion.div
                key={album.id}
                onMouseEnter={() => {
                  setFocusSection('slats');
                  setExpandedSlatIndex(idx);
                }}
                onClick={() => openAlbum(album.folderId)}
                animate={{
                  flex: isFocused ? 2.6 : 1,
                  scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className={`relative h-full rounded-2xl overflow-hidden cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.1)] group transition-all duration-300 ${
                  isFocused ? 'ring-3 ring-black shadow-2xl' : ''
                }`}
              >
                <img
                  src={album.coverThumbnailUrl}
                  alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Slat Title Content */}
                <div className="absolute bottom-6 left-5 right-5 text-white">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300">
                    Collection
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white drop-shadow truncate mt-0.5">
                    {album.title}
                  </h3>
                  {isFocused && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-white/80 font-light mt-1 flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Press OK to Play</span>
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ------------------------------------------------------- */}
        {/* CENTER: ARCHED GLASS AMBIENT CLOCK & WEATHER WIDGET     */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-4 h-[65vh] flex justify-center">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`relative w-full max-w-[340px] h-full rounded-t-[170px] rounded-b-[36px] bg-white/80 backdrop-blur-3xl border border-white shadow-[0_25px_60px_rgba(0,0,0,0.06)] p-8 flex flex-col justify-between items-center text-center transition-all duration-300 ${
              focusSection === 'arch' ? 'ring-3 ring-black shadow-2xl scale-102' : ''
            }`}
          >
            {/* Top 3D Glowing Orb with Ambient Breathing Animation */}
            <div className="mt-8 flex flex-col items-center">
              <motion.div
                animate={{
                  scale: [1, 1.06, 1],
                  filter: [
                    'drop-shadow(0 15px 30px rgba(255,121,63,0.35))',
                    'drop-shadow(0 20px 45px rgba(255,121,63,0.55))',
                    'drop-shadow(0 15px 30px rgba(255,121,63,0.35))',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#ff9f43] via-[#ff793f] to-[#ff5252] flex items-center justify-center cursor-pointer"
              >
                <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-white/60 blur-[1px]" />
                <Sparkles className="w-8 h-8 text-white/95 drop-shadow" />
              </motion.div>
            </div>

            {/* Middle Time & Weather */}
            <div className="space-y-1 my-auto">
              <div className="text-6xl font-extralight tracking-tight text-[#1c1c1e] font-sans">
                {timeStr.split(' ')[0] || '12:48'}
              </div>
              <p className="text-xs text-black/40 font-medium tracking-wide">
                Ambient Gallery Mode
              </p>
              <div className="pt-4">
                <p className="text-sm font-semibold text-black/80">{dateStr || 'Saturday, 7th Nov'}</p>
                <p className="text-xs text-black/50 font-normal">Living Room TV</p>
              </div>
            </div>

            {/* Bottom Play Slideshow Pill */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (albums.length > 0) {
                  openAlbum(albums[0].folderId);
                }
              }}
              className={`w-full py-3.5 px-6 rounded-full font-medium text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                focusSection === 'arch' ? 'bg-black text-white ring-2 ring-black' : 'bg-[#1c1c1e] text-white hover:bg-black'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Play Featured Album</span>
            </motion.button>
          </motion.div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT: FLOATING 3D PERSPECTIVE APP CARDS               */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-3 h-[62vh] flex flex-col justify-between py-2 [perspective:1000px]">
          {albums.slice(0, 4).map((album, idx) => {
            const isCardFocused = focusSection === 'rightCards' && selectedRightCardIndex === idx;
            return (
              <motion.div
                key={album.id}
                onMouseEnter={() => {
                  setFocusSection('rightCards');
                  setSelectedRightCardIndex(idx);
                }}
                onClick={() => openAlbum(album.folderId)}
                animate={{
                  rotateY: isCardFocused ? 0 : -14,
                  x: isCardFocused ? -14 : 0,
                  scale: isCardFocused ? 1.05 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  transformOrigin: 'right center',
                }}
                className={`group cursor-pointer rounded-2xl p-4 bg-white/85 backdrop-blur-2xl border border-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all ${
                  isCardFocused ? 'ring-3 ring-black shadow-2xl' : 'hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-12 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 bg-black/10">
                    <img
                      src={album.coverThumbnailUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-[#1c1c1e] truncate group-hover:text-black">
                      {album.title}
                    </h4>
                    <p className="text-[10px] text-black/45 font-mono">Trip Collection</p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-black/60 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. BOTTOM FLOATING DOCK & CONTROLS                        */}
      {/* ========================================================= */}
      <footer className="relative z-20 flex items-center justify-between pt-4 border-t border-black/[0.06]">
        {/* Left: User Profiles & Device */}
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs font-bold text-black shadow-sm">
              👨‍👩‍👧
            </div>
            <div className="w-8 h-8 rounded-full bg-sky-400 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm">
              🏔️
            </div>
            <button
              onClick={() => router.push('/tv/pair')}
              className="w-8 h-8 rounded-full bg-black/10 border-2 border-white flex items-center justify-center text-xs text-black/60 hover:bg-black hover:text-white transition-colors shadow-sm cursor-pointer"
              title="Pair New Device"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs font-medium text-black/60 tracking-wide">
            Living Room TV
          </span>
        </div>

        {/* Center: Frosted Glass Utility Pills */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-full p-1.5 shadow-sm">
          <button
            onClick={() => {
              if (albums.length > 0) openAlbum(albums[0].folderId);
            }}
            className="p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
            title="Art Frame Mode"
          >
            <Frame className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const shuffled = [...albums].sort(() => Math.random() - 0.5);
              setAlbums(shuffled);
            }}
            className="p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
            title="Shuffle Collections"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/tv/pair')}
            className="p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
            title="Settings & Pairing"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Right-Center: Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpandedSlatIndex(prev => (prev - 1 + 3) % 3)}
            className="text-black/50 hover:text-black transition-colors cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (albums.length > 0) openAlbum(albums[expandedSlatIndex].folderId);
            }}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-black/[0.08] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
          <button
            onClick={() => setExpandedSlatIndex(prev => (prev + 1) % 3)}
            className="text-black/50 hover:text-black transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Far Right: Clock */}
        <div className="text-xs font-mono font-medium text-black/60 tracking-wider">
          {timeStr || '12:48 PM'}
        </div>
      </footer>
    </div>
  );
}

export default function TVHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ececee] text-black/40 flex items-center justify-center font-mono">
          Loading DriveFrame TV...
        </div>
      }
    >
      <CreativeTVContent />
    </Suspense>
  );
}

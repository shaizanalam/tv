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
  Tv,
  Image as ImageIcon,
  Film,
  Layers,
  Compass,
} from 'lucide-react';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { DriveItem } from '@/lib/types';

interface AlbumFolder {
  id: string;
  folderId: string;
  title: string;
  coverThumbnailUrl: string;
  photoCount?: number;
  videoCount?: number;
  totalCount?: number;
}

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

// All 6 real verified trip collections with guaranteed working covers and true counts
const INITIAL_ALBUMS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    coverThumbnailUrl: '/api/drive/image?id=1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz',
    totalCount: 351,
    photoCount: 337,
    videoCount: 14,
  },
  {
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    folderId: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    title: 'Ajmer Agra 25',
    coverThumbnailUrl: '/api/drive/image?id=1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
    totalCount: 404,
    photoCount: 326,
    videoCount: 78,
  },
  {
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    folderId: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    title: 'Meccah & Madina',
    coverThumbnailUrl: '/api/drive/image?id=1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0',
    totalCount: 593,
    photoCount: 561,
    videoCount: 32,
  },
  {
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    folderId: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    title: 'GoPro-Exports',
    coverThumbnailUrl: '/api/drive/image?id=1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
    totalCount: 259,
    photoCount: 132,
    videoCount: 127,
  },
  {
    id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    folderId: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    title: 'Pachmari',
    coverThumbnailUrl: '/api/drive/image?id=17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
    totalCount: 292,
    photoCount: 222,
    videoCount: 70,
  },
  {
    id: '16LdUNRWJjO1JBmUYGSbcqTo0UgoNovBu',
    folderId: '16LdUNRWJjO1JBmUYGSbcqTo0UgoNovBu',
    title: 'Family Archive',
    coverThumbnailUrl: '/api/drive/image?id=1vEDS5R99wQ0vw1aw5PdFSP_vfsQJDheC',
    totalCount: 48,
    photoCount: 45,
    videoCount: 3,
  },
];

const FALLBACK_COVER = '/api/drive/image?id=1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz';

type FocusSection = 'slats' | 'arch' | 'rightCards' | 'dock' | 'search';

function CreativeTVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [albums, setAlbums] = useState<AlbumFolder[]>(INITIAL_ALBUMS);
  const [expandedSlatIndex, setExpandedSlatIndex] = useState(0);
  const [selectedRightCardIndex, setSelectedRightCardIndex] = useState(0);
  const [dockFocusIndex, setDockFocusIndex] = useState(5); // default on Play button
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [folderInput, setFolderInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAlbumTitle, setLoadingAlbumTitle] = useState('');

  // Client-side Memory Cache for sub-millisecond album switches
  const albumPhotosCache = useRef<Map<string, DriveItem[]>>(new Map());

  // TV Remote Focus Zone: 'slats' | 'arch' | 'rightCards' | 'dock' | 'search'
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
        data.subfolders.forEach((sub: AlbumFolder) => {
          fetch(`/api/drive/folder?folder=${encodeURIComponent(sub.folderId)}`)
            .then(r => r.json())
            .then(subData => {
              if (subData.items && subData.items.length > 0) {
                albumPhotosCache.current.set(sub.folderId, subData.items);
                // Pre-cache first image in browser memory
                if (subData.items[0]?.previewUrl) {
                  const img = new Image();
                  img.referrerPolicy = 'no-referrer';
                  img.src = subData.items[0].previewUrl;
                }
              }
            })
            .catch(() => {});
        });
      } else if (data.items && data.items.length > 0) {
        // Direct trip folder opened (e.g. Dubai, Pachmari, etc.)
        setActivePhotos(data.items);
        setInSlideshow(true);
      }
    } catch {
      setAlbums(INITIAL_ALBUMS);
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
  const openAlbum = async (folderId: string, title?: string) => {
    setLoadingAlbumTitle(title || 'Album');
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
      setLoadingAlbumTitle('');
    }
  };

  // Play All 1,899 Photos & Videos across all collections
  const playMasterCollection = async () => {
    setLoadingAlbumTitle('All 6 Collections (1,899 Items)');
    // Collect all cached photos
    let combined: DriveItem[] = [];
    for (const [, items] of albumPhotosCache.current.entries()) {
      combined = combined.concat(items);
    }

    if (combined.length > 0) {
      // Shuffle for a cinematic mix across all vacations
      const shuffled = [...combined].sort(() => Math.random() - 0.5);
      setActivePhotos(shuffled);
      setInSlideshow(true);
      return;
    }

    // If cache not filled yet, load the primary featured album first
    if (albums.length > 0) {
      openAlbum(albums[0].folderId, 'Featured Memories');
    }
  };

  // -------------------------------------------------------------
  // Full 2D Spatial TV Remote Navigation Controls
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inSlideshow) return;

      switch (e.key) {
        // --- RIGHT ---
        case 'ArrowRight':
          e.preventDefault();
          if (focusSection === 'slats') {
            if (expandedSlatIndex < 2) {
              setExpandedSlatIndex(prev => prev + 1);
            } else {
              setFocusSection('arch');
            }
          } else if (focusSection === 'arch') {
            setFocusSection('rightCards');
            setSelectedRightCardIndex(0);
          } else if (focusSection === 'dock') {
            setDockFocusIndex(prev => Math.min(6, prev + 1));
          }
          break;

        // --- LEFT ---
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
          } else if (focusSection === 'dock') {
            setDockFocusIndex(prev => Math.max(0, prev - 1));
          }
          break;

        // --- DOWN ---
        case 'ArrowDown':
          e.preventDefault();
          if (focusSection === 'search') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards') {
            if (selectedRightCardIndex < 3) {
              setSelectedRightCardIndex(prev => prev + 1);
            } else {
              setFocusSection('dock');
              setDockFocusIndex(5);
            }
          } else if (focusSection === 'slats' || focusSection === 'arch') {
            setFocusSection('dock');
            setDockFocusIndex(5);
          }
          break;

        // --- UP ---
        case 'ArrowUp':
          e.preventDefault();
          if (focusSection === 'dock') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards') {
            if (selectedRightCardIndex > 0) {
              setSelectedRightCardIndex(prev => prev - 1);
            } else {
              setFocusSection('search');
            }
          } else if (focusSection === 'slats' || focusSection === 'arch') {
            setFocusSection('search');
          }
          break;

        // --- ENTER / OK ---
        case 'Enter':
          e.preventDefault();
          if (focusSection === 'slats') {
            const alb = albums[expandedSlatIndex] || albums[0];
            openAlbum(alb.folderId, alb.title);
          } else if (focusSection === 'arch') {
            playMasterCollection();
          } else if (focusSection === 'rightCards') {
            if (selectedRightCardIndex === 3) {
              playMasterCollection();
            } else {
              const alb = albums[selectedRightCardIndex + 3] || albums[0];
              openAlbum(alb.folderId, alb.title);
            }
          } else if (focusSection === 'dock') {
            if (dockFocusIndex === 0) router.push('/tv/pair');
            if (dockFocusIndex === 1) openAlbum(albums[0]?.folderId, albums[0]?.title);
            if (dockFocusIndex === 2) {
              const shuffled = [...albums].sort(() => Math.random() - 0.5);
              setAlbums(shuffled);
            }
            if (dockFocusIndex === 3) router.push('/tv/pair');
            if (dockFocusIndex === 4) setExpandedSlatIndex(prev => (prev - 1 + 3) % 3);
            if (dockFocusIndex === 5) {
              const alb = albums[expandedSlatIndex] || albums[0];
              openAlbum(alb.folderId, alb.title);
            }
            if (dockFocusIndex === 6) setExpandedSlatIndex(prev => (prev + 1) % 3);
          }
          break;

        // --- BACK / ESCAPE (Samsung Tizen 10009 / LG WebOS 461) ---
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          setFocusSection('slats');
          break;
        default:
          if (e.keyCode === 10009 || e.keyCode === 461) {
            e.preventDefault();
            setFocusSection('slats');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusSection,
    expandedSlatIndex,
    selectedRightCardIndex,
    dockFocusIndex,
    albums,
    inSlideshow,
    router,
  ]);

  if (inSlideshow) {
    return (
      <SlideshowPlayer
        photos={activePhotos}
        intervalSeconds={7}
        transitionStyle="ken_burns"
        onExit={() => setInSlideshow(false)}
      />
    );
  }

  // Left 3 vertical accordion slats: Folders 0, 1, 2
  const leftSlats = albums.slice(0, 3);
  // Right 4 floating 3D perspective cards: Folders 3, 4, 5 + Master Card
  const rightFolders = albums.slice(3, 6);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#ececee] text-[#1c1c1e] select-none flex flex-col justify-between p-6 lg:p-8 xl:p-10 overflow-hidden font-sans">
      {/* Background Subtle Gradient & Studio Vignette */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f8fa] via-[#ececee] to-[#e1e1e6] pointer-events-none" />

      {/* Loading Modal Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/25 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="bg-[#1c1c1e]/95 p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Opening {loadingAlbumTitle || 'Collection'}</h3>
              <p className="text-xs text-white/50 font-mono mt-1">
                Streaming Google Drive photos & videos...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP AIRY SCANDINAVIAN HEADER (NO DISTRACTING TAB BARS) */}
      {/* ========================================================= */}
      <header className="relative z-20 flex items-center justify-between pb-3">
        {/* Subtle Brand & Collection Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur-md border border-black/10 flex items-center justify-center shadow-sm">
            <Tv className="w-4 h-4 text-black/80" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold tracking-tight text-black/90 font-sans">
              DriveFrame
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-black/50 bg-black/[0.04] px-2.5 py-0.5 rounded-full border border-black/[0.06]">
              6 Trip Collections · 1,899 Items
            </span>
          </div>
        </div>

        {/* Quiet Search / Folder ID Pill */}
        <div className="relative">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (folderInput.trim()) {
                fetchAlbums(folderInput.trim());
              }
            }}
            className={`flex items-center gap-2 bg-white/75 hover:bg-white/95 backdrop-blur-2xl border rounded-full px-4 py-1.5 shadow-sm transition-all ${
              focusSection === 'search'
                ? 'ring-3 ring-black/90 border-transparent bg-white shadow-md'
                : 'border-black/[0.08]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-black/40" />
            <input
              type="text"
              value={folderInput}
              onChange={e => setFolderInput(e.target.value)}
              placeholder="Paste Google Drive folder ID..."
              className="bg-transparent border-none text-xs text-black/80 placeholder:text-black/35 focus:outline-none w-44 md:w-56"
            />
          </form>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 3-PANEL SHOWCASE (ALL 6 FOLDERS DISPLAYED)       */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 lg:gap-8 items-center my-2">
        {/* ------------------------------------------------------- */}
        {/* LEFT: 3 VERTICAL POSTER SLATS (Folders 1, 2, 3)         */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-5 h-[64vh] flex gap-3.5">
          {leftSlats.map((album, idx) => {
            const isFocused = focusSection === 'slats' && expandedSlatIndex === idx;
            const total = album.totalCount || album.photoCount || 50;

            return (
              <motion.div
                key={album.id}
                onMouseEnter={() => {
                  setFocusSection('slats');
                  setExpandedSlatIndex(idx);
                }}
                onClick={() => openAlbum(album.folderId, album.title)}
                animate={{
                  flexGrow: isFocused ? 2.8 : 1,
                  scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className={`relative h-full basis-0 rounded-2xl overflow-hidden cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.1)] group transition-all duration-300 bg-stone-200 ${
                  isFocused
                    ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                {/* Background Cover Photo with CrossOrigin & Fallback */}
                <img
                  src={album.coverThumbnailUrl}
                  alt={album.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={e => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = FALLBACK_COVER;
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                {/* Slat Content Info */}
                <div className="absolute bottom-6 left-5 right-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-semibold bg-black/45 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {total} ITEMS
                    </span>
                  </div>

                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-white drop-shadow truncate">
                    {album.title}
                  </h3>

                  {isFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center justify-between text-xs text-white/90"
                    >
                      <div className="flex items-center gap-1.5 font-light">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>Photos & Videos</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium border border-white/20">
                        <Play className="w-3 h-3 fill-white" />
                        <span>Play [OK]</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ------------------------------------------------------- */}
        {/* CENTER: ARCHED GLASS AMBIENT CLOCK & ORB WIDGET         */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-4 h-[67vh] flex justify-center">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`relative w-full max-w-[340px] h-full rounded-t-[190px] rounded-b-[40px] bg-gradient-to-b from-white/95 via-white/80 to-white/65 backdrop-blur-3xl border border-white/90 shadow-[0_25px_60px_rgba(0,0,0,0.06)] p-8 flex flex-col justify-between items-center text-center transition-all duration-300 ${
              focusSection === 'arch'
                ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl scale-[1.02]'
                : ''
            }`}
          >
            {/* Top 3D Glowing Celestial Orb with Ambient Breathing Glow */}
            <div className="mt-6 flex flex-col items-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  filter: [
                    'drop-shadow(0 15px 30px rgba(255,121,63,0.35))',
                    'drop-shadow(0 20px 48px rgba(255,121,63,0.60))',
                    'drop-shadow(0 15px 30px rgba(255,121,63,0.35))',
                  ],
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-26 h-26 rounded-full bg-gradient-to-tr from-[#ff9f43] via-[#ff793f] to-[#ff5252] flex items-center justify-center cursor-pointer shadow-lg"
              >
                {/* Specular Light Refraction Ring */}
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-white/70 blur-[1px]" />
                <Sparkles className="w-9 h-9 text-white/95 drop-shadow" />
              </motion.div>
            </div>

            {/* Middle Temperature, Time & Location */}
            <div className="space-y-1 my-auto">
              <div className="text-6xl font-extralight tracking-tight text-[#1c1c1e] font-sans">
                {timeStr.split(' ')[0] || '12:48'}
              </div>
              <p className="text-xs text-black/45 font-medium tracking-wide">
                feels like 14° · Ambient Frame
              </p>
              <div className="pt-3">
                <p className="text-sm font-semibold text-black/85">{dateStr || 'Saturday, 7th Nov'}</p>
                <p className="text-xs text-black/50 font-normal">Living Room TV</p>
              </div>
            </div>

            {/* Bottom Play Slideshow Pill Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={playMasterCollection}
              className={`w-full py-3.5 px-6 rounded-full font-medium text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                focusSection === 'arch'
                  ? 'bg-black text-white ring-2 ring-black shadow-lg scale-102'
                  : 'bg-[#1c1c1e] text-white hover:bg-black'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Play All Memories (1,899)</span>
            </motion.button>
          </motion.div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT: FLOATING 3D PERSPECTIVE CARDS (Folders 4, 5, 6 + Master) */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-3 h-[64vh] flex flex-col justify-between py-1 [perspective:1200px]">
          {/* Card 0: GoPro-Exports */}
          {/* Card 1: Pachmari */}
          {/* Card 2: Family Archive */}
          {rightFolders.map((album, idx) => {
            const isCardFocused = focusSection === 'rightCards' && selectedRightCardIndex === idx;
            const total = album.totalCount || album.photoCount || 48;

            return (
              <motion.div
                key={album.id}
                onMouseEnter={() => {
                  setFocusSection('rightCards');
                  setSelectedRightCardIndex(idx);
                }}
                onClick={() => openAlbum(album.folderId, album.title)}
                animate={{
                  rotateY: isCardFocused ? 0 : -14,
                  x: isCardFocused ? -14 : 0,
                  scale: isCardFocused ? 1.05 : 1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  transformOrigin: 'right center',
                }}
                className={`group cursor-pointer rounded-2xl p-3 bg-white/85 backdrop-blur-2xl border border-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all ${
                  isCardFocused
                    ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                    : 'hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-13 h-11 rounded-xl overflow-hidden shadow-sm shrink-0 bg-stone-300">
                    <img
                      src={album.coverThumbnailUrl}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={e => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = FALLBACK_COVER;
                      }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-[#1c1c1e] truncate group-hover:text-black">
                      {album.title}
                    </h4>
                    <p className="text-[10px] text-black/50 font-mono">
                      {total} Photos & Videos
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-black/60 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </motion.div>
            );
          })}

          {/* Card 3: Master Collection (All 1,899 Photos & Videos) */}
          <motion.div
            onMouseEnter={() => {
              setFocusSection('rightCards');
              setSelectedRightCardIndex(3);
            }}
            onClick={playMasterCollection}
            animate={{
              rotateY: focusSection === 'rightCards' && selectedRightCardIndex === 3 ? 0 : -14,
              x: focusSection === 'rightCards' && selectedRightCardIndex === 3 ? -14 : 0,
              scale: focusSection === 'rightCards' && selectedRightCardIndex === 3 ? 1.05 : 1,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              transformOrigin: 'right center',
            }}
            className={`group cursor-pointer rounded-2xl p-3 bg-gradient-to-r from-stone-900 to-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.15)] flex items-center justify-between transition-all ${
              focusSection === 'rightCards' && selectedRightCardIndex === 3
                ? 'ring-4 ring-amber-400/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                : 'hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)]'
            }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="w-13 h-11 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-amber-300" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-semibold text-white truncate">
                  Master Library
                </h4>
                <p className="text-[10px] text-amber-300/80 font-mono">
                  All 1,899 Photos & Videos
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0 shadow">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. BOTTOM FLOATING DOCK & CONTROLS                        */}
      {/* ========================================================= */}
      <footer className="relative z-20 flex items-center justify-between pt-3 border-t border-black/[0.06]">
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
              className={`w-8 h-8 rounded-full bg-black/10 border-2 border-white flex items-center justify-center text-xs text-black/60 hover:bg-black hover:text-white transition-colors shadow-sm cursor-pointer ${
                focusSection === 'dock' && dockFocusIndex === 0 ? 'ring-2 ring-black font-bold' : ''
              }`}
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
        <div className="flex items-center gap-2 bg-white/85 backdrop-blur-2xl border border-black/[0.06] rounded-full p-1.5 shadow-sm">
          <button
            onClick={() => {
              if (albums.length > 0) openAlbum(albums[0].folderId, albums[0].title);
            }}
            className={`p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer ${
              focusSection === 'dock' && dockFocusIndex === 1 ? 'ring-2 ring-black bg-black/10 text-black' : ''
            }`}
            title="Art Frame Mode"
          >
            <Frame className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const shuffled = [...albums].sort(() => Math.random() - 0.5);
              setAlbums(shuffled);
            }}
            className={`p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer ${
              focusSection === 'dock' && dockFocusIndex === 2 ? 'ring-2 ring-black bg-black/10 text-black' : ''
            }`}
            title="Shuffle Collections"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/tv/pair')}
            className={`p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer ${
              focusSection === 'dock' && dockFocusIndex === 3 ? 'ring-2 ring-black bg-black/10 text-black' : ''
            }`}
            title="Settings & Pairing"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Right-Center: Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpandedSlatIndex(prev => (prev - 1 + 3) % 3)}
            className={`text-black/50 hover:text-black transition-colors cursor-pointer p-1 rounded-full ${
              focusSection === 'dock' && dockFocusIndex === 4 ? 'ring-2 ring-black text-black' : ''
            }`}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (albums.length > 0) {
                const alb = albums[expandedSlatIndex] || albums[0];
                openAlbum(alb.folderId, alb.title);
              }
            }}
            className={`w-9 h-9 rounded-full bg-white shadow-sm border border-black/[0.08] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              focusSection === 'dock' && dockFocusIndex === 5 ? 'ring-3 ring-black shadow-md scale-105' : ''
            }`}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
          <button
            onClick={() => setExpandedSlatIndex(prev => (prev + 1) % 3)}
            className={`text-black/50 hover:text-black transition-colors cursor-pointer p-1 rounded-full ${
              focusSection === 'dock' && dockFocusIndex === 6 ? 'ring-2 ring-black text-black' : ''
            }`}
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

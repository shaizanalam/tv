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
  Image as ImageIcon,
  Film,
  Compass,
  FolderHeart,
  Layers,
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

// Real verified albums from user's Drive folder with true counts
const INITIAL_ALBUMS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz=s1200',
    totalCount: 351,
    photoCount: 337,
    videoCount: 14,
  },
  {
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    folderId: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    title: 'Ajmer Agra 25',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1GDyj4qioexLHWgWOow3johLzVJrt7DBi=s1200',
    totalCount: 404,
    photoCount: 400,
    videoCount: 4,
  },
  {
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    folderId: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    title: 'Meccah & Madina',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0=s1200',
    totalCount: 593,
    photoCount: 590,
    videoCount: 3,
  },
  {
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    folderId: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    title: 'GoPro-Exports',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z=s1200',
    totalCount: 259,
    photoCount: 230,
    videoCount: 29,
  },
  {
    id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    folderId: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    title: 'Pachmari',
    coverThumbnailUrl: 'https://lh3.googleusercontent.com/d/17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91=s1200',
    totalCount: 292,
    photoCount: 285,
    videoCount: 7,
  },
];

type FocusSection = 'nav' | 'slats' | 'arch' | 'rightCards' | 'dock';
type NavTab = 'art' | 'gallery' | 'favorites' | 'drive';

function CreativeTVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [albums, setAlbums] = useState<AlbumFolder[]>(INITIAL_ALBUMS);
  const [activeTab, setActiveTab] = useState<NavTab>('art');
  const [navTabIndex, setNavTabIndex] = useState(0);
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

  // Client-side Memory Cache for instant sub-millisecond album switches
  const albumPhotosCache = useRef<Map<string, DriveItem[]>>(new Map());

  // TV Remote Focus Zone: 'nav' | 'slats' | 'arch' | 'rightCards' | 'dock'
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
        data.subfolders.slice(0, 4).forEach((sub: AlbumFolder) => {
          fetch(`/api/drive/folder?folder=${encodeURIComponent(sub.folderId)}`)
            .then(r => r.json())
            .then(subData => {
              if (subData.items && subData.items.length > 0) {
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

  // -------------------------------------------------------------
  // Full 2D Spatial TV Remote Navigation Controls
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inSlideshow) return;

      const tabs: NavTab[] = ['art', 'gallery', 'favorites', 'drive'];

      switch (e.key) {
        // --- RIGHT ---
        case 'ArrowRight':
          e.preventDefault();
          if (focusSection === 'nav') {
            setNavTabIndex(prev => Math.min(tabs.length - 1, prev + 1));
            setActiveTab(tabs[Math.min(tabs.length - 1, navTabIndex + 1)]);
          } else if (focusSection === 'slats') {
            if (expandedSlatIndex < Math.min(2, albums.length - 1)) {
              setExpandedSlatIndex(prev => prev + 1);
            } else {
              setFocusSection('arch');
            }
          } else if (focusSection === 'arch') {
            setFocusSection('rightCards');
          } else if (focusSection === 'dock') {
            setDockFocusIndex(prev => Math.min(6, prev + 1));
          }
          break;

        // --- LEFT ---
        case 'ArrowLeft':
          e.preventDefault();
          if (focusSection === 'nav') {
            setNavTabIndex(prev => Math.max(0, prev - 1));
            setActiveTab(tabs[Math.max(0, navTabIndex - 1)]);
          } else if (focusSection === 'rightCards') {
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
          if (focusSection === 'nav') {
            if (navTabIndex <= 1) {
              setFocusSection('slats');
            } else if (navTabIndex === 2) {
              setFocusSection('arch');
            } else {
              setFocusSection('rightCards');
            }
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
              setFocusSection('nav');
              setNavTabIndex(3);
            }
          } else if (focusSection === 'slats' || focusSection === 'arch') {
            setFocusSection('nav');
            setNavTabIndex(focusSection === 'slats' ? expandedSlatIndex : 2);
          }
          break;

        // --- ENTER / OK ---
        case 'Enter':
          e.preventDefault();
          if (focusSection === 'slats') {
            const alb = albums[expandedSlatIndex] || albums[0];
            openAlbum(alb.folderId, alb.title);
          } else if (focusSection === 'arch') {
            const alb = albums[0];
            openAlbum(alb.folderId, alb.title);
          } else if (focusSection === 'rightCards') {
            const alb = albums[selectedRightCardIndex] || albums[0];
            openAlbum(alb.folderId, alb.title);
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
    navTabIndex,
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

  // Left 3 vertical accordion slats
  const leftSlats = albums.slice(0, 3);
  // Right 4 floating 3D perspective cards
  const rightCards = albums.slice(1, 5);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#ececee] text-[#1c1c1e] select-none flex flex-col justify-between p-6 lg:p-8 xl:p-10 overflow-hidden font-sans">
      {/* Background Subtle Gradient & Studio Vignette */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f8fa] via-[#ececee] to-[#e1e1e6] pointer-events-none" />

      {/* Loading Modal Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="bg-[#1c1c1e]/90 p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
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
      {/* 1. TOP MINIMALIST NAV BAR                                 */}
      {/* ========================================================= */}
      <header className="relative z-20 flex items-center justify-between pb-4 border-b border-black/[0.06]">
        {/* Nav Tabs */}
        <div className="flex items-center gap-8 lg:gap-12 text-xs tracking-wider uppercase font-medium text-black/50">
          {[
            { id: 'art', label: 'Art mode' },
            { id: 'gallery', label: 'Trip Gallery' },
            { id: 'favorites', label: 'Favorites' },
            { id: 'drive', label: 'Google Drive' },
          ].map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const isFocused = focusSection === 'nav' && navTabIndex === idx;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as NavTab);
                  setNavTabIndex(idx);
                }}
                className={`relative py-1 cursor-pointer transition-all ${
                  isActive ? 'text-black font-semibold' : 'hover:text-black/80'
                } ${isFocused ? 'ring-2 ring-black rounded-sm px-2 -mx-2 font-bold text-black' : ''}`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-4.5 left-0 right-0 h-0.5 bg-black"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Search / Folder Pill */}
        <div className="relative">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (folderInput.trim()) {
                fetchAlbums(folderInput.trim());
              }
            }}
            className="flex items-center gap-2 bg-white/85 backdrop-blur-2xl border border-black/[0.08] rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-black/20 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-black/40" />
            <input
              type="text"
              value={folderInput}
              onChange={e => setFolderInput(e.target.value)}
              placeholder="Search or paste folder ID..."
              className="bg-transparent border-none text-xs text-black/80 placeholder:text-black/35 focus:outline-none w-44 md:w-56"
            />
          </form>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 3-PANEL SHOWCASE                                  */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 lg:gap-8 items-center my-3">
        {/* ------------------------------------------------------- */}
        {/* LEFT: 3 VERTICAL POSTER SLATS (Accordion Style)        */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-5 h-[62vh] flex gap-3.5">
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
                  flex: isFocused ? 2.8 : 1,
                  scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className={`relative h-full rounded-2xl overflow-hidden cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.1)] group transition-all duration-300 ${
                  isFocused
                    ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                {/* Background Cover Photo */}
                <img
                  src={album.coverThumbnailUrl}
                  alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Slat Content Info */}
                <div className="absolute bottom-6 left-5 right-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-semibold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
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
        <div className="col-span-4 h-[65vh] flex justify-center">
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
                feels like 14° · Ambient Gallery
              </p>
              <div className="pt-3">
                <p className="text-sm font-semibold text-black/85">{dateStr || 'Saturday, 7th Nov'}</p>
                <p className="text-xs text-black/50 font-normal">Living Room TV</p>
              </div>
            </div>

            {/* Bottom Play Featured Album Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (albums.length > 0) {
                  openAlbum(albums[0].folderId, albums[0].title);
                }
              }}
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
              <span>Play Featured Album</span>
            </motion.button>
          </motion.div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT: FLOATING 3D PERSPECTIVE APP CARDS               */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-3 h-[62vh] flex flex-col justify-between py-2 [perspective:1200px]">
          {rightCards.map((album, idx) => {
            const isCardFocused = focusSection === 'rightCards' && selectedRightCardIndex === idx;
            const total = album.totalCount || album.photoCount || 50;

            return (
              <motion.div
                key={album.id + idx}
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
                className={`group cursor-pointer rounded-2xl p-3.5 bg-white/85 backdrop-blur-2xl border border-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all ${
                  isCardFocused
                    ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                    : 'hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-13 h-11 rounded-xl overflow-hidden shadow-sm shrink-0 bg-black/10">
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

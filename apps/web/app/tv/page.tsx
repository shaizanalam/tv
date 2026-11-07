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
  Compass,
  Check,
  ChevronRight,
} from 'lucide-react';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { DriveItem } from '@/lib/types';

export interface AlbumFolder {
  id: string;
  folderId: string;
  title: string;
  subtitle: string;
  coverThumbnailUrl: string;
  photoCount: number;
  videoCount: number;
  totalCount: number;
}

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

// The 6 official verified folders in the user's shared Google Drive
const ALL_SIX_COLLECTIONS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    subtitle: 'Desert & Skyline Memories',
    coverThumbnailUrl: '/api/drive/image?id=1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz',
    totalCount: 351,
    photoCount: 337,
    videoCount: 14,
  },
  {
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    folderId: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    title: 'Ajmer Agra 25',
    subtitle: 'Taj Mahal & Heritage Journey',
    coverThumbnailUrl: '/api/drive/image?id=1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
    totalCount: 404,
    photoCount: 326,
    videoCount: 78,
  },
  {
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    folderId: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    title: 'Meccah & Madina',
    subtitle: 'Holy Journey & Family Moments',
    coverThumbnailUrl: '/api/drive/image?id=1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0',
    totalCount: 593,
    photoCount: 561,
    videoCount: 32,
  },
  {
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    folderId: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    title: 'GoPro-Exports',
    subtitle: 'Action Clips & Travel Footage',
    coverThumbnailUrl: '/api/drive/image?id=1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
    totalCount: 259,
    photoCount: 132,
    videoCount: 127,
  },
  {
    id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    folderId: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC',
    title: 'Pachmari',
    subtitle: 'Hill Station & Nature Trails',
    coverThumbnailUrl: '/api/drive/image?id=17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
    totalCount: 292,
    photoCount: 222,
    videoCount: 70,
  },
  {
    id: '16LdUNRWJjO1JBmUYGSbcqTo0UgoNovBu',
    folderId: '16LdUNRWJjO1JBmUYGSbcqTo0UgoNovBu',
    title: 'Family Archive',
    subtitle: 'Classic Memories & Tours',
    coverThumbnailUrl: '/api/drive/image?id=1vEDS5R99wQ0vw1aw5PdFSP_vfsQJDheC',
    totalCount: 48,
    photoCount: 48,
    videoCount: 0,
  },
];

const FALLBACK_COVER = '/api/drive/image?id=1DOaXMzGoetWQVf4zaqTXlCnYjZQeQXyz';

type FocusSection = 'navTabs' | 'pills' | 'slats' | 'arch' | 'rightCards' | 'dock' | 'search';

function CreativeTVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [albums, setAlbums] = useState<AlbumFolder[]>(ALL_SIX_COLLECTIONS);
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [expandedSlatIndex, setExpandedSlatIndex] = useState(0);
  const [selectedRightCardIndex, setSelectedRightCardIndex] = useState(0);
  const [selectedPillIndex, setSelectedPillIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'art' | 'trips' | 'favorites' | 'ambient'>('art');
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
        // Filter and merge verified trips
        const matched = ALL_SIX_COLLECTIONS.map(trip => {
          const found = data.subfolders.find((s: AlbumFolder) => s.folderId === trip.folderId);
          return found
            ? {
                ...trip,
                ...found,
                subtitle: trip.subtitle,
                coverThumbnailUrl: trip.coverThumbnailUrl || found.coverThumbnailUrl,
              }
            : trip;
        });
        setAlbums(matched);

        // Preload photos for instant playback
        matched.forEach((sub: AlbumFolder) => {
          fetch(`/api/drive/folder?folder=${encodeURIComponent(sub.folderId)}`)
            .then(r => r.json())
            .then(subData => {
              if (subData.items && subData.items.length > 0) {
                albumPhotosCache.current.set(sub.folderId, subData.items);
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
      setAlbums(ALL_SIX_COLLECTIONS);
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

  // Play All 1,947 Photos & Videos across all 6 collections
  const playMasterCollection = async () => {
    setLoadingAlbumTitle('All 6 Collections (1,947 Items)');
    let combined: DriveItem[] = [];
    for (const [, items] of albumPhotosCache.current.entries()) {
      combined = combined.concat(items);
    }

    if (combined.length > 0) {
      const shuffled = [...combined].sort(() => Math.random() - 0.5);
      setActivePhotos(shuffled);
      setInSlideshow(true);
      return;
    }

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
          if (focusSection === 'pills') {
            setSelectedPillIndex(prev => Math.min(albums.length, prev + 1));
          } else if (focusSection === 'slats') {
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
          if (focusSection === 'pills') {
            setSelectedPillIndex(prev => Math.max(0, prev - 1));
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
          if (focusSection === 'navTabs') {
            setFocusSection('pills');
          } else if (focusSection === 'pills' || focusSection === 'search') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards') {
            if (selectedRightCardIndex < albums.length - 1) {
              const nextIdx = selectedRightCardIndex + 1;
              setSelectedRightCardIndex(nextIdx);
              setSelectedAlbumIndex(nextIdx);
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
              const prevIdx = selectedRightCardIndex - 1;
              setSelectedRightCardIndex(prevIdx);
              setSelectedAlbumIndex(prevIdx);
            } else {
              setFocusSection('pills');
            }
          } else if (focusSection === 'slats' || focusSection === 'arch') {
            setFocusSection('pills');
          } else if (focusSection === 'pills') {
            setFocusSection('navTabs');
          }
          break;

        // --- ENTER / OK ---
        case 'Enter':
          e.preventDefault();
          if (focusSection === 'pills') {
            if (selectedPillIndex === albums.length) {
              playMasterCollection();
            } else {
              const alb = albums[selectedPillIndex];
              setSelectedAlbumIndex(selectedPillIndex);
              setSelectedRightCardIndex(selectedPillIndex);
              openAlbum(alb.folderId, alb.title);
            }
          } else if (focusSection === 'slats') {
            const alb = activeFeaturedTrip;
            openAlbum(alb.folderId, alb.title);
          } else if (focusSection === 'arch') {
            openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title);
          } else if (focusSection === 'rightCards') {
            const alb = albums[selectedRightCardIndex];
            openAlbum(alb.folderId, alb.title);
          } else if (focusSection === 'dock') {
            if (dockFocusIndex === 0) router.push('/tv/pair');
            if (dockFocusIndex === 1) playMasterCollection();
            if (dockFocusIndex === 2) {
              const shuffled = [...albums].sort(() => Math.random() - 0.5);
              setAlbums(shuffled);
            }
            if (dockFocusIndex === 3) router.push('/tv/pair');
            if (dockFocusIndex === 4) {
              setSelectedAlbumIndex(prev => (prev - 1 + albums.length) % albums.length);
              setSelectedRightCardIndex(prev => (prev - 1 + albums.length) % albums.length);
            }
            if (dockFocusIndex === 5) {
              const alb = albums[selectedRightCardIndex] || albums[0];
              openAlbum(alb.folderId, alb.title);
            }
            if (dockFocusIndex === 6) {
              setSelectedAlbumIndex(prev => (prev + 1) % albums.length);
              setSelectedRightCardIndex(prev => (prev + 1) % albums.length);
            }
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
    selectedPillIndex,
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

  // Active highlighted trip (synced across pills, slats, arch, and right cards)
  const activeFeaturedTrip = albums[selectedRightCardIndex] || albums[0];

  // Dynamic left 3 slats featuring the active album and its neighbors
  const slatIndices = [
    (selectedRightCardIndex - 1 + albums.length) % albums.length,
    selectedRightCardIndex,
    (selectedRightCardIndex + 1) % albums.length,
  ];
  const dynamicSlats = slatIndices.map(i => albums[i]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#ececee] text-[#1c1c1e] select-none flex flex-col justify-between p-5 lg:p-7 xl:p-8 overflow-hidden font-sans">
      {/* Background Subtle Gradient & Studio Lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f8fa] via-[#ececee] to-[#e0e0e5] pointer-events-none" />

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
      {/* 1. SCANDINAVIAN / APPLE TV TOP NAVIGATION HEADER          */}
      {/* ========================================================= */}
      <header className="relative z-20 flex flex-col gap-2.5 pb-2">
        <div className="flex items-center justify-between">
          {/* Subtle Top Categories (Art Mode, Live TV, Favorites) - Clean text, NO underline! */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => setActiveTab('art')}
              className={`text-sm lg:text-base tracking-tight transition-colors cursor-pointer ${
                activeTab === 'art'
                  ? 'font-bold text-black'
                  : 'font-normal text-black/45 hover:text-black/80'
              }`}
            >
              Art mode
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`text-sm lg:text-base tracking-tight transition-colors cursor-pointer ${
                activeTab === 'trips'
                  ? 'font-bold text-black'
                  : 'font-normal text-black/45 hover:text-black/80'
              }`}
            >
              Trip Gallery
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`text-sm lg:text-base tracking-tight transition-colors cursor-pointer ${
                activeTab === 'favorites'
                  ? 'font-bold text-black'
                  : 'font-normal text-black/45 hover:text-black/80'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setActiveTab('ambient')}
              className={`text-sm lg:text-base tracking-tight transition-colors cursor-pointer ${
                activeTab === 'ambient'
                  ? 'font-bold text-black'
                  : 'font-normal text-black/45 hover:text-black/80'
              }`}
            >
              Ambient TV
            </button>
          </div>

          {/* Search / Google Drive Link Input Pill */}
          <div className="relative">
            <form
              onSubmit={e => {
                e.preventDefault();
                if (folderInput.trim()) {
                  fetchAlbums(folderInput.trim());
                }
              }}
              className={`flex items-center gap-2 bg-white/80 hover:bg-white/95 backdrop-blur-2xl border rounded-full px-4 py-1.5 shadow-sm transition-all ${
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
                placeholder="Search or paste Drive folder..."
                className="bg-transparent border-none text-xs text-black/80 placeholder:text-black/35 focus:outline-none w-44 md:w-56"
              />
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ALL 6 ALBUMS EXPLICITLY LISTED IN ELEGANT PILL STRIP      */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-black/45 mr-1 shrink-0 font-medium">
            All 6 Collections:
          </span>

          {albums.map((alb, idx) => {
            const isPillFocused = focusSection === 'pills' && selectedPillIndex === idx;
            const isSelected = selectedRightCardIndex === idx;

            return (
              <button
                key={alb.id}
                onClick={() => {
                  setSelectedRightCardIndex(idx);
                  setSelectedAlbumIndex(idx);
                  openAlbum(alb.folderId, alb.title);
                }}
                onMouseEnter={() => {
                  setSelectedRightCardIndex(idx);
                  setSelectedAlbumIndex(idx);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all shrink-0 ${
                  isPillFocused
                    ? 'bg-black text-white ring-2 ring-black shadow-md scale-105'
                    : isSelected
                    ? 'bg-white text-black shadow-sm border border-black/20 font-semibold'
                    : 'bg-white/60 text-black/70 hover:bg-white hover:text-black border border-black/[0.06]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-black/20'}`} />
                <span>{alb.title}</span>
                <span className="text-[10px] font-mono text-black/45">
                  ({alb.totalCount})
                </span>
              </button>
            );
          })}

          {/* Master Collection Pill: Play All 6 Collections (1,947 Items) */}
          <button
            onClick={playMasterCollection}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all shrink-0 ${
              focusSection === 'pills' && selectedPillIndex === albums.length
                ? 'bg-black text-amber-300 ring-2 ring-black shadow-md scale-105'
                : 'bg-stone-900 text-white hover:bg-black shadow-sm'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Play All 6 (1,947)</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 3-PANEL SHOWCASE                                  */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-5 lg:gap-7 items-center my-1">
        {/* ------------------------------------------------------- */}
        {/* LEFT: 3 VERTICAL POSTER SLATS (Accordion Style)        */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-5 h-[63vh] flex gap-3">
          {dynamicSlats.map((album, idx) => {
            const isCenterSlat = idx === 1;
            const isSlatFocused =
              focusSection === 'slats' ? expandedSlatIndex === idx : isCenterSlat;
            const total = album.totalCount || album.photoCount || 50;

            return (
              <motion.div
                key={album.id + idx}
                onMouseEnter={() => {
                  setFocusSection('slats');
                  setExpandedSlatIndex(idx);
                }}
                onClick={() => openAlbum(album.folderId, album.title)}
                animate={{
                  flexGrow: isSlatFocused ? 2.6 : 1,
                  scale: isSlatFocused ? 1.01 : 1,
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className={`relative h-full basis-0 rounded-2xl overflow-hidden cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.08)] group transition-all duration-300 bg-stone-300 ${
                  isSlatFocused
                    ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                {/* Background Cover Photo with Same-Origin Proxy */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Slat Content Info */}
                <div className="absolute bottom-5 left-4 right-4 text-white">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-wider text-amber-300 mb-1.5 font-semibold">
                    <span>{total} MEMORIES</span>
                  </div>

                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-white drop-shadow truncate">
                    {album.title}
                  </h3>
                  <p className="text-xs text-white/70 font-light truncate">
                    {album.subtitle}
                  </p>

                  {isSlatFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 flex items-center justify-between text-xs text-white/90"
                    >
                      <div className="flex items-center gap-1.5 font-light">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>Photos & Videos</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium border border-white/25">
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
            className={`relative w-full max-w-[330px] h-full rounded-t-[190px] rounded-b-[40px] bg-gradient-to-b from-white/95 via-white/80 to-white/65 backdrop-blur-3xl border border-white/90 shadow-[0_25px_60px_rgba(0,0,0,0.06)] p-7 flex flex-col justify-between items-center text-center transition-all duration-300 ${
              focusSection === 'arch'
                ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl scale-[1.02]'
                : ''
            }`}
          >
            {/* Top 3D Glowing Celestial Orb with Ambient Breathing Glow */}
            <div className="mt-4 flex flex-col items-center">
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
                className="relative w-22 h-22 rounded-full bg-gradient-to-tr from-[#ff9f43] via-[#ff793f] to-[#ff5252] flex items-center justify-center cursor-pointer shadow-lg"
              >
                {/* Specular Light Refraction Ring */}
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-white/70 blur-[1px]" />
                <Sparkles className="w-8 h-8 text-white/95 drop-shadow" />
              </motion.div>
            </div>

            {/* Middle Temperature, Time & Location */}
            <div className="space-y-1 my-auto">
              <div className="text-5xl font-extralight tracking-tight text-[#1c1c1e] font-sans">
                {timeStr.split(' ')[0] || '12:48'}
              </div>
              <p className="text-xs text-black/45 font-medium tracking-wide">
                feels like 14° · Ambient Frame
              </p>
              <div className="pt-2">
                <p className="text-sm font-semibold text-black/85">{activeFeaturedTrip.title}</p>
                <p className="text-[11px] text-black/50 font-normal">
                  {activeFeaturedTrip.totalCount} Photos & Videos
                </p>
              </div>
            </div>

            {/* Bottom Play Slideshow Pill Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title)}
              className={`w-full py-3 px-6 rounded-full font-medium text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
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
              <span>Play {activeFeaturedTrip.title}</span>
            </motion.button>
          </motion.div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT: ALL 6 TRIP ALBUMS LISTED (3D Floating Cards)    */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-3 h-[64vh] flex flex-col justify-between py-0.5 [perspective:1200px] gap-2 overflow-y-auto no-scrollbar">
          {albums.map((album, idx) => {
            const isCardFocused = focusSection === 'rightCards' && selectedRightCardIndex === idx;
            const isFeatured = selectedRightCardIndex === idx;

            return (
              <motion.div
                key={album.id}
                onMouseEnter={() => {
                  setFocusSection('rightCards');
                  setSelectedRightCardIndex(idx);
                  setSelectedAlbumIndex(idx);
                }}
                onClick={() => openAlbum(album.folderId, album.title)}
                animate={{
                  rotateY: isCardFocused ? 0 : -13,
                  x: isCardFocused ? -12 : 0,
                  scale: isCardFocused ? 1.04 : 1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{
                  transformOrigin: 'right center',
                }}
                className={`group cursor-pointer rounded-2xl p-2 bg-white/85 backdrop-blur-2xl border border-white shadow-[0_10px_24px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all ${
                  isCardFocused
                    ? 'ring-4 ring-black/90 ring-offset-2 ring-offset-[#ececee] shadow-2xl z-10'
                    : isFeatured
                    ? 'ring-2 ring-black/40 shadow-md'
                    : 'hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-11 h-9 rounded-xl overflow-hidden shadow-sm shrink-0 bg-stone-300">
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
                    <h4 className="text-xs font-semibold text-[#1c1c1e] truncate group-hover:text-black">
                      {album.title}
                    </h4>
                    <p className="text-[10px] text-black/50 font-mono">
                      {album.totalCount} Items
                    </p>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-black/60 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. BOTTOM FLOATING DOCK & CONTROLS                        */}
      {/* ========================================================= */}
      <footer className="relative z-20 flex items-center justify-between pt-2.5 border-t border-black/[0.06]">
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
            onClick={playMasterCollection}
            className={`p-2 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer ${
              focusSection === 'dock' && dockFocusIndex === 1 ? 'ring-2 ring-black bg-black/10 text-black' : ''
            }`}
            title="Play All 6 Collections"
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
            onClick={() => {
              setSelectedAlbumIndex(prev => (prev - 1 + albums.length) % albums.length);
              setSelectedRightCardIndex(prev => (prev - 1 + albums.length) % albums.length);
            }}
            className={`text-black/50 hover:text-black transition-colors cursor-pointer p-1 rounded-full ${
              focusSection === 'dock' && dockFocusIndex === 4 ? 'ring-2 ring-black text-black' : ''
            }`}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (albums.length > 0) {
                const alb = albums[selectedRightCardIndex] || albums[0];
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
            onClick={() => {
              setSelectedAlbumIndex(prev => (prev + 1) % albums.length);
              setSelectedRightCardIndex(prev => (prev + 1) % albums.length);
            }}
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

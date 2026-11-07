'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  SkipBack,
  SkipForward,
  Search,
  Shuffle,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Loader2,
  Image as ImageIcon,
  Film,
  Compass,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
} from 'lucide-react';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { DriveItem } from '@/lib/types';

/* ============================================================
   Type Definitions
   ============================================================ */

export interface HighlightShot {
  url: string;
  tag: string;
  title: string;
  subtitle: string;
}

export interface AlbumFolder {
  id: string;
  folderId: string;
  title: string;
  subtitle: string;
  coverThumbnailUrl: string;
  highlightShots: HighlightShot[];
  photoCount: number;
  videoCount: number;
  totalCount: number;
}

/* ============================================================
   Constants
   ============================================================ */

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

// The 5 official verified trip collections in the user's Google Drive with authentic highlight shots
const VERIFIED_TRIPS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    subtitle: 'Desert & Skyline Memories',
    coverThumbnailUrl: '/api/drive/image?id=1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
    totalCount: 351,
    photoCount: 337,
    videoCount: 14,
    highlightShots: [
      {
        url: '/api/drive/image?id=1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
        tag: 'DUBAI MALL',
        title: 'Dubai Mall Emaar',
        subtitle: 'City Center & Palm Boulevard',
      },
      {
        url: '/api/drive/image?id=1hGR38jxsBQrAbIdQmG8KqKnP8pN2Nilq',
        tag: 'ARCHITECTURE',
        title: 'Futuristic Skyline',
        subtitle: 'Geometric Glass & Palms',
      },
      {
        url: '/api/drive/image?id=1rNz-ddmnzBBGRUY1V1Xoef1Gm7Z4QZ_n',
        tag: 'CITY LIGHTS',
        title: 'Evening Boulevard',
        subtitle: 'Golden Hour Memories',
      },
    ],
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
    highlightShots: [
      {
        url: '/api/drive/image?id=1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
        tag: 'ROADTRIP',
        title: 'Expressway Highway',
        subtitle: 'Family Drive to the Taj',
      },
      {
        url: '/api/drive/image?id=1Ul1iyrpdoV7xUvy9G-t1aG9otBu2V12R',
        tag: 'HERITAGE',
        title: 'Ajmer Sharif Dargah',
        subtitle: 'Courtyard & Historic Dome',
      },
      {
        url: '/api/drive/image?id=12er1qFhLNpVuLyltGHlaG8AeulPRKhNn',
        tag: 'MUGHAL PALACE',
        title: 'Agra Fort Views',
        subtitle: 'Red Sandstone Pavilions',
      },
    ],
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
    highlightShots: [
      {
        url: '/api/drive/image?id=1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0',
        tag: 'IHRAM GARMENTS',
        title: 'Holy Pilgrimage',
        subtitle: 'Family Departure in White Ihram',
      },
      {
        url: '/api/drive/image?id=1SYevfhMSNcnJp5Kx-mRfcePA2pS5HQqQ',
        tag: 'HOLY MOSQUE',
        title: 'Sanctuary of Makkah',
        subtitle: 'Spiritual Peace & Prayers',
      },
      {
        url: '/api/drive/image?id=15-rV7xGt9IWRIhA7FPSKCs2UATsyk-Ma',
        tag: 'MADINA CITY',
        title: 'Streets of Madinah',
        subtitle: 'Family Gathering & Peace',
      },
    ],
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
    highlightShots: [
      {
        url: '/api/drive/image?id=1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
        tag: 'AIRPORT VIEW',
        title: 'Runway Flight Deck',
        subtitle: 'Watching the Airplanes',
      },
      {
        url: '/api/drive/image?id=1qWfYQ3RC3CUd7kDqXsUqDy7Lv8kOBm1a',
        tag: 'GOPRO 4K',
        title: 'Wide Angle Action',
        subtitle: 'Cinematic Travel Reels',
      },
      {
        url: '/api/drive/image?id=1DOqWLmLHH1-MfMTN7riOl7_IidSkx5NQ',
        tag: 'HIGHLIGHTS',
        title: 'Motion & Adventures',
        subtitle: 'Dynamic Travel Clips',
      },
    ],
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
    highlightShots: [
      {
        url: '/api/drive/image?id=17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
        tag: 'HILL RESORT',
        title: 'Heritage Bungalow',
        subtitle: 'Queen of Satpura Greens',
      },
      {
        url: '/api/drive/image?id=1q3f6-_peYW3KjdG0WRnhz0hrnpfgofH2',
        tag: 'MOUNTAIN VALLEY',
        title: 'Valley Vistas',
        subtitle: 'Pine Mist & Escarpments',
      },
      {
        url: '/api/drive/image?id=16jw0tKCVHKxbiLs-mErs7Qtm20DeDyIi',
        tag: 'PINE TRAILS',
        title: 'Forest Footpaths',
        subtitle: 'Nature Walks & Waterfalls',
      },
    ],
  },
];

const FALLBACK_COVER = '/api/drive/image?id=1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv';

type FocusSection = 'navTabs' | 'pills' | 'slats' | 'arch' | 'rightCards' | 'dock' | 'search';

/* ============================================================
   Spring Physics Constants (Apple HIG §2.A)
   ============================================================ */
const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 400, damping: 30 }; // ζ≈1.0, T≈0.25s — controls, toggles
const SPRING_SHEET  = { type: 'spring' as const, stiffness: 300, damping: 28 }; // ζ≈1.0, T≈0.35s — panels, sheets
const SPRING_CARD   = { type: 'spring' as const, stiffness: 260, damping: 24 }; // ζ≈0.9, T≈0.4s  — card repositioning

/* ============================================================
   Dark Mode Hook
   ============================================================ */
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
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

/* ============================================================
   Main TV Page Content
   ============================================================ */
function CreativeTVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, toggle: toggleTheme } = useDarkMode();

  const [albums, setAlbums] = useState<AlbumFolder[]>(VERIFIED_TRIPS);
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
  const [searchFocused, setSearchFocused] = useState(false);

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
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
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
        // Filter and merge verified trips while keeping our curated high-res highlight shots
        const matched = VERIFIED_TRIPS.map(trip => {
          const found = data.subfolders.find((s: AlbumFolder) => s.folderId === trip.folderId);
          return found
            ? {
                ...trip,
                ...found,
                subtitle: trip.subtitle,
                coverThumbnailUrl: trip.coverThumbnailUrl,
                highlightShots: trip.highlightShots,
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
      setAlbums(VERIFIED_TRIPS);
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

  // Play All 1,899 Photos & Videos across all 5 trip collections
  const playMasterCollection = async () => {
    setLoadingAlbumTitle('All 5 Trips (1,899 Items)');
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

  // Active highlighted trip (synced across pills, slats, arch, and right cards)
  const activeFeaturedTrip = albums[selectedRightCardIndex] || albums[0];
  const activeHighlights = activeFeaturedTrip.highlightShots || VERIFIED_TRIPS[0].highlightShots;

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
            openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title);
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
    activeFeaturedTrip,
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

  const tabs = [
    { key: 'art' as const, label: 'Art Mode' },
    { key: 'trips' as const, label: 'Trips' },
    { key: 'favorites' as const, label: 'Favorites' },
    { key: 'ambient' as const, label: 'Ambient' },
  ];

  return (
    <div
      className="relative min-h-[100dvh] w-full select-none flex flex-col justify-between p-5 lg:p-7 xl:p-8 overflow-hidden font-sans transition-colors duration-500"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Subtle ambient gradient background */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 30% 20%, rgba(255,160,48,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(28,28,30,0.5) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 30% 20%, rgba(232,134,12,0.04) 0%, transparent 60%), linear-gradient(135deg, #f8f8fa 0%, #ececee 50%, #e2e2e7 100%)',
        }}
      />

      {/* Loading Modal Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)', backdropFilter: 'blur(16px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={SPRING_SHEET}
              className="glass p-8 rounded-3xl flex flex-col items-center gap-4"
              style={{ minWidth: 220 }}
            >
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
              <div className="text-center">
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Opening {loadingAlbumTitle || 'Collection'}
                </h3>
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  Streaming from Google Drive…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 1. TOP NAVIGATION HEADER                                  */}
      {/* ========================================================= */}
      <header className="relative z-20 flex flex-col gap-3 pb-1">
        <div className="flex items-center justify-between">
          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 p-1 rounded-xl" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative px-4 py-1.5 text-sm tracking-tight cursor-pointer transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg -z-10"
                      style={{ background: 'var(--accent-soft)' }}
                      transition={SPRING_SNAPPY}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Theme toggle + Search */}
          <div className="flex items-center gap-3">
            {/* Dark/Light Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={SPRING_SNAPPY}
                >
                  {isDark ? (
                    <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Sun className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Search Input */}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (folderInput.trim()) {
                  fetchAlbums(folderInput.trim());
                }
              }}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 transition-all"
              style={{
                boxShadow: searchFocused ? '0 0 0 2px var(--accent)' : 'var(--glass-shadow)',
              }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={folderInput}
                onChange={e => setFolderInput(e.target.value)}
                onFocus={() => { setSearchFocused(true); setFocusSection('search'); }}
                onBlur={() => setSearchFocused(false)}
                placeholder="Paste Drive folder link…"
                className="bg-transparent border-none text-xs focus:outline-none w-36 md:w-48"
                style={{ color: 'var(--text-primary)' }}
              />
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ALL 5 TRIPS PILL STRIP                                    */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <span
            className="text-[10px] font-medium uppercase tracking-widest mr-1 shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Collections
          </span>

          {albums.map((alb, idx) => {
            const isPillFocused = focusSection === 'pills' && selectedPillIndex === idx;
            const isSelected = selectedRightCardIndex === idx;

            return (
              <motion.button
                key={alb.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedRightCardIndex(idx);
                  setSelectedAlbumIndex(idx);
                  openAlbum(alb.folderId, alb.title);
                }}
                onMouseEnter={() => {
                  setSelectedRightCardIndex(idx);
                  setSelectedAlbumIndex(idx);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all shrink-0"
                style={{
                  background: isPillFocused
                    ? 'var(--text-primary)'
                    : isSelected
                    ? 'var(--card-bg)'
                    : 'transparent',
                  color: isPillFocused
                    ? 'var(--bg-primary)'
                    : isSelected
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  border: `1px solid ${isPillFocused ? 'var(--text-primary)' : isSelected ? 'var(--card-border)' : 'var(--separator)'}`,
                  boxShadow: isPillFocused
                    ? '0 4px 16px rgba(0,0,0,0.15)'
                    : isSelected
                    ? 'var(--card-shadow)'
                    : 'none',
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: isSelected ? 'var(--accent)' : 'var(--text-tertiary)' }}
                />
                <span>{alb.title}</span>
                <span className="text-[10px] font-mono" style={{ opacity: 0.5 }}>
                  {alb.totalCount}
                </span>
              </motion.button>
            );
          })}

          {/* Master Collection Pill: Play All 5 Trips (1,899 Items) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={playMasterCollection}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0"
            style={{
              background: focusSection === 'pills' && selectedPillIndex === albums.length
                ? 'var(--accent)'
                : 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            <Compass className="w-3.5 h-3.5" style={{ opacity: 0.8 }} />
            <span>Play All · 1,899</span>
          </motion.button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 3-PANEL SHOWCASE                                  */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-4 lg:gap-6 items-center my-1">
        {/* ------------------------------------------------------- */}
        {/* LEFT: 3 DYNAMIC HIGHLIGHT SHOTS FOR THE SELECTED ALBUM  */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-5 h-[62vh] flex gap-2.5">
          {activeHighlights.map((shot, idx) => {
            const isCenterSlat = idx === 0;
            const isSlatFocused =
              focusSection === 'slats' ? expandedSlatIndex === idx : isCenterSlat;

            return (
              <motion.div
                key={shot.url + idx}
                onMouseEnter={() => {
                  setFocusSection('slats');
                  setExpandedSlatIndex(idx);
                }}
                onClick={() => openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title)}
                animate={{
                  flexGrow: isSlatFocused ? 2.8 : 1,
                  scale: isSlatFocused ? 1.0 : 0.98,
                }}
                transition={SPRING_CARD}
                className="relative h-full basis-0 rounded-2xl overflow-hidden cursor-pointer group"
                style={{
                  boxShadow: isSlatFocused
                    ? '0 20px 50px rgba(0,0,0,0.15)'
                    : '0 8px 24px rgba(0,0,0,0.06)',
                  outline: isSlatFocused ? '3px solid var(--focus-ring)' : 'none',
                  outlineOffset: '3px',
                }}
              >
                {/* Skeleton placeholder while image loads */}
                <div className="absolute inset-0 skeleton" />

                {/* Background Cover Photo with Same-Origin Proxy */}
                <img
                  src={shot.url}
                  alt={shot.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={e => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = FALLBACK_COVER;
                  }}
                  className="relative w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="eager"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0" style={{ background: 'var(--scrim)' }} />

                {/* Slat Content Info */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold mb-1.5"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {shot.tag}
                  </div>

                  <h3 className="text-lg lg:text-xl font-bold tracking-tight text-white drop-shadow-sm truncate">
                    {shot.title}
                  </h3>
                  <p className="text-[11px] text-white/65 font-light truncate">
                    {shot.subtitle}
                  </p>

                  <AnimatePresence>
                    {isSlatFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={SPRING_SNAPPY}
                        className="mt-3 flex items-center justify-between text-xs text-white/85"
                      >
                        <div className="flex items-center gap-1.5 font-light">
                          <ImageIcon className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                          <span>{activeFeaturedTrip.photoCount} photos</span>
                          {activeFeaturedTrip.videoCount > 0 && (
                            <>
                              <span className="text-white/30">·</span>
                              <Film className="w-3 h-3" style={{ color: 'var(--accent)', opacity: 0.7 }} />
                              <span>{activeFeaturedTrip.videoCount} videos</span>
                            </>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}
                        >
                          <Play className="w-2.5 h-2.5 fill-white" />
                          <span>Play</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ------------------------------------------------------- */}
        {/* CENTER: AMBIENT CLOCK & ORB WIDGET (Arched Glass)       */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-4 h-[64vh] flex justify-center">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_SHEET}
            className="relative w-full max-w-[320px] h-full rounded-t-[180px] rounded-b-[36px] glass flex flex-col justify-between items-center text-center transition-all duration-300"
            style={{
              padding: '1.75rem',
              outline: focusSection === 'arch' ? '3px solid var(--focus-ring)' : 'none',
              outlineOffset: '3px',
            }}
          >
            {/* Top: Breathing Celestial Orb */}
            <div className="mt-6 flex flex-col items-center">
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer animate-breathe"
                style={{
                  background: `linear-gradient(135deg, var(--orb-from), var(--orb-via), var(--orb-to))`,
                }}
              >
                {/* Specular Light Refraction Ring */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-transparent via-white/25 to-white/60 blur-[0.5px]" />
                <Sparkles className="w-7 h-7 text-white/90 drop-shadow" />
              </div>
            </div>

            {/* Middle: Time & Selected Trip Info */}
            <div className="space-y-1.5 my-auto">
              <div
                className="text-5xl font-extralight tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {timeStr.split(' ')[0] || '12:48'}
              </div>
              <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                {dateStr || 'Saturday, Nov 7'}
              </p>
              <div className="pt-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {activeFeaturedTrip.title}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {activeFeaturedTrip.photoCount} Photos · {activeFeaturedTrip.videoCount} Videos
                </p>
              </div>
            </div>

            {/* Bottom: Play Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title)}
              className="w-full py-3 px-6 rounded-full font-medium text-[13px] tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}
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
        {/* RIGHT: ALL 5 TRIP ALBUMS                                */}
        {/* ------------------------------------------------------- */}
        <div className="col-span-3 h-[62vh] flex flex-col justify-center py-1 gap-2.5 overflow-y-auto no-scrollbar [perspective:1200px]">
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
                  rotateY: isCardFocused ? 0 : -8,
                  x: isCardFocused ? -8 : 0,
                  scale: isCardFocused ? 1.03 : isFeatured ? 1.01 : 1,
                }}
                transition={SPRING_CARD}
                className="group cursor-pointer rounded-2xl p-2.5 flex items-center justify-between transition-all card-surface"
                style={{
                  transformOrigin: 'right center',
                  ...(isCardFocused
                    ? {
                        outline: '3px solid var(--focus-ring)',
                        outlineOffset: '2px',
                        boxShadow: 'var(--card-shadow-hover)',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                      }
                    : isFeatured
                    ? {
                        boxShadow: 'var(--card-shadow-hover)',
                        outline: '2px solid var(--accent)',
                        outlineOffset: '1px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                      }
                    : {}),
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  {/* Album Thumbnail */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 skeleton">
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
                  {/* Album Info */}
                  <div className="truncate">
                    <h4
                      className="text-[13px] font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {album.title}
                    </h4>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {album.photoCount} photos · {album.videoCount} videos
                    </p>
                  </div>
                </div>

                {/* Play Chevron */}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: isFeatured ? 'var(--accent)' : 'var(--accent-soft)',
                    color: isFeatured ? 'white' : 'var(--accent-text)',
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. BOTTOM FLOATING DOCK & CONTROLS                        */}
      {/* ========================================================= */}
      <footer
        className="relative z-20 flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--separator)' }}
      >
        {/* Left: User Profiles & Device */}
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
              style={{ background: 'var(--accent)', color: 'white', border: '2px solid var(--bg-primary)' }}
            >
              👨‍👩‍👧
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
              style={{ background: '#4AADE8', color: 'white', border: '2px solid var(--bg-primary)' }}
            >
              🏔️
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/tv/pair')}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--text-secondary)',
                border: '2px solid var(--bg-primary)',
                ...(focusSection === 'dock' && dockFocusIndex === 0 ? { outline: '2px solid var(--focus-ring)' } : {}),
              }}
              title="Pair New Device"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
          <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            Living Room TV
          </span>
        </div>

        {/* Center: Frosted Glass Utility Pills */}
        <div className="glass flex items-center gap-1 rounded-full p-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={playMasterCollection}
            className="p-2.5 rounded-full cursor-pointer transition-colors"
            style={{
              color: focusSection === 'dock' && dockFocusIndex === 1 ? 'var(--accent)' : 'var(--text-secondary)',
              background: focusSection === 'dock' && dockFocusIndex === 1 ? 'var(--accent-soft)' : 'transparent',
            }}
            title="Play All 5 Trips"
          >
            <Compass className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const shuffled = [...albums].sort(() => Math.random() - 0.5);
              setAlbums(shuffled);
            }}
            className="p-2.5 rounded-full cursor-pointer transition-colors"
            style={{
              color: focusSection === 'dock' && dockFocusIndex === 2 ? 'var(--accent)' : 'var(--text-secondary)',
              background: focusSection === 'dock' && dockFocusIndex === 2 ? 'var(--accent-soft)' : 'transparent',
            }}
            title="Shuffle Collections"
          >
            <Shuffle className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/tv/pair')}
            className="p-2.5 rounded-full cursor-pointer transition-colors"
            style={{
              color: focusSection === 'dock' && dockFocusIndex === 3 ? 'var(--accent)' : 'var(--text-secondary)',
              background: focusSection === 'dock' && dockFocusIndex === 3 ? 'var(--accent-soft)' : 'transparent',
            }}
            title="Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Right-Center: Playback Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              setSelectedAlbumIndex(prev => (prev - 1 + albums.length) % albums.length);
              setSelectedRightCardIndex(prev => (prev - 1 + albums.length) % albums.length);
            }}
            className="p-2 rounded-full cursor-pointer"
            style={{
              color: focusSection === 'dock' && dockFocusIndex === 4 ? 'var(--text-primary)' : 'var(--text-tertiary)',
              ...(focusSection === 'dock' && dockFocusIndex === 4 ? { outline: '2px solid var(--focus-ring)' } : {}),
            }}
          >
            <SkipBack className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (albums.length > 0) {
                const alb = albums[selectedRightCardIndex] || albums[0];
                openAlbum(alb.folderId, alb.title);
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              ...(focusSection === 'dock' && dockFocusIndex === 5 ? { outline: '3px solid var(--accent)', outlineOffset: '2px' } : {}),
            }}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              setSelectedAlbumIndex(prev => (prev + 1) % albums.length);
              setSelectedRightCardIndex(prev => (prev + 1) % albums.length);
            }}
            className="p-2 rounded-full cursor-pointer"
            style={{
              color: focusSection === 'dock' && dockFocusIndex === 6 ? 'var(--text-primary)' : 'var(--text-tertiary)',
              ...(focusSection === 'dock' && dockFocusIndex === 6 ? { outline: '2px solid var(--focus-ring)' } : {}),
            }}
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Far Right: Clock */}
        <div className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
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
        <div
          className="min-h-screen flex items-center justify-center font-mono text-sm"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}
        >
          <Loader2 className="w-6 h-6 animate-spin mr-3" style={{ color: 'var(--accent)' }} />
          Loading DriveFrame TV…
        </div>
      }
    >
      <CreativeTVContent />
    </Suspense>
  );
}

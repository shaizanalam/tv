'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Search,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Film,
  Compass,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Calendar,
  Clock,
  Volume2,
  VolumeX,
  X,
  Tv,
  LogOut,
} from 'lucide-react';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { TVVideoPlayer } from '@/components/media/TVVideoPlayer';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';
import { DriveItem } from '@/lib/types';

/* ============================================================
   Type Definitions
   ============================================================ */

export interface HighlightShot {
  fileId: string;
  tag: string;
  title: string;
  subtitle: string;
}

export interface AlbumFolder {
  id: string;
  folderId: string;
  title: string;
  year: string;
  location: string;
  subtitle: string;
  coverFileId: string;
  highlightShots: HighlightShot[];
  photoCount: number;
  videoCount: number;
  totalCount: number;
}

/* ============================================================
   Verified Collections (Memory / Cinema Catalog)
   ============================================================ */

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

const VERIFIED_TRIPS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    year: '2025',
    location: 'United Arab Emirates',
    subtitle: 'City of Gold, Desert Dunes & Palm Boulevard',
    coverFileId: '1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
    totalCount: 351,
    photoCount: 337,
    videoCount: 14,
    highlightShots: [
      {
        fileId: '1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
        tag: 'DUBAI MALL',
        title: 'Dubai Mall Emaar',
        subtitle: 'City Center & Downtown Fountains',
      },
      {
        fileId: '1hGR38jxsBQrAbIdQmG8KqKnP8pN2Nilq',
        tag: 'ARCHITECTURE',
        title: 'Futuristic Skyline',
        subtitle: 'Geometric Glass & Palms',
      },
      {
        fileId: '1rNz-ddmnzBBGRUY1V1Xoef1Gm7Z4QZ_n',
        tag: 'CITY LIGHTS',
        title: 'Evening Boulevard',
        subtitle: 'Golden Hour Reflections',
      },
    ],
  },
  {
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    folderId: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    title: 'Ajmer Agra 25',
    year: '2025',
    location: 'Rajasthan & Uttar Pradesh',
    subtitle: 'Taj Mahal Vistas & Heritage Expressways',
    coverFileId: '1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
    totalCount: 404,
    photoCount: 326,
    videoCount: 78,
    highlightShots: [
      {
        fileId: '1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
        tag: 'ROADTRIP',
        title: 'Yamuna Expressway',
        subtitle: 'Family Drive to the Taj',
      },
      {
        fileId: '1Ul1iyrpdoV7xUvy9G-t1aG9otBu2V12R',
        tag: 'HERITAGE',
        title: 'Ajmer Sharif Dargah',
        subtitle: 'Historic Marble Pavilions',
      },
      {
        fileId: '12er1qFhLNpVuLyltGHlaG8AeulPRKhNn',
        tag: 'MUGHAL PALACE',
        title: 'Agra Fort Views',
        subtitle: 'Red Sandstone Courtyards',
      },
    ],
  },
  {
    id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    folderId: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs',
    title: 'Meccah & Madina',
    year: '2024',
    location: 'Saudi Arabia',
    subtitle: 'Holy Pilgrimage & Sacred Sanctuary Prayers',
    coverFileId: '1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0',
    totalCount: 593,
    photoCount: 561,
    videoCount: 32,
    highlightShots: [
      {
        fileId: '1GXYdHksps-F99oQpQHIwPUiEb8eg2XO0',
        tag: 'IHRAM GARMENTS',
        title: 'Holy Pilgrimage',
        subtitle: 'Family Departure in White Ihram',
      },
      {
        fileId: '1SYevfhMSNcnJp5Kx-mRfcePA2pS5HQqQ',
        tag: 'HOLY MOSQUE',
        title: 'Sanctuary of Makkah',
        subtitle: 'Spiritual Peace & Evening Prayers',
      },
      {
        fileId: '15-rV7xGt9IWRIhA7FPSKCs2UATsyk-Ma',
        tag: 'MADINA CITY',
        title: 'Streets of Madinah',
        subtitle: 'Historic Minarets & Palms',
      },
    ],
  },
  {
    id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    folderId: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp',
    title: 'GoPro-Exports',
    year: '2024-2025',
    location: 'Action & Travel Reels',
    subtitle: '4K Ultra-Wide Cinema Footage & Motion Adventures',
    coverFileId: '1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
    totalCount: 259,
    photoCount: 132,
    videoCount: 127,
    highlightShots: [
      {
        fileId: '1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
        tag: 'AIRPORT VIEW',
        title: 'Runway Flight Deck',
        subtitle: 'Watching the Airplanes Take Off',
      },
      {
        fileId: '1qWfYQ3RC3CUd7kDqXsUqDy7Lv8kOBm1a',
        tag: 'GOPRO 4K',
        title: 'Wide Angle Action',
        subtitle: 'High Framerate Travel Reels',
      },
      {
        fileId: '1DOqWLmLHH1-MfMTN7riOl7_IidSkx5NQ',
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
    year: '2023',
    location: 'Madhya Pradesh',
    subtitle: 'Queen of Satpura Greens & Forest Waterfalls',
    coverFileId: '17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
    totalCount: 292,
    photoCount: 222,
    videoCount: 70,
    highlightShots: [
      {
        fileId: '17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
        tag: 'HILL RESORT',
        title: 'Heritage Bungalow',
        subtitle: 'Satpura Mist & Forest Bungalows',
      },
      {
        fileId: '1q3f6-_peYW3KjdG0WRnhz0hrnpfgofH2',
        tag: 'MOUNTAIN VALLEY',
        title: 'Valley Vistas',
        subtitle: 'Pine Escarpments & Fog',
      },
      {
        fileId: '16jw0tKCVHKxbiLs-mErs7Qtm20DeDyIi',
        tag: 'PINE TRAILS',
        title: 'Forest Footpaths',
        subtitle: 'Nature Walks & Waterfalls',
      },
    ],
  },
];

type MainTab = 'featured' | 'photos' | 'videos' | 'collections';

function CinematicTVPlatform() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('featured');
  const [featuredIndex, setFeaturedIndex] = useState(0); // 0 to 4
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  // Player States
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);
  const [inVideoPlayer, setInVideoPlayer] = useState(false);
  const [activeVideoPlaylist, setActiveVideoPlaylist] = useState<DriveItem[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Loading & Cache
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('');
  const [folderInput, setFolderInput] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const albumPhotosCache = useRef<Map<string, DriveItem[]>>(new Map());

  // Virtual Mouse Cursor for Phone Remote
  const [tvCursor, setTvCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });
  const cursorHideTimer = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedSeq = useRef(0);

  const activeFeaturedTrip = VERIFIED_TRIPS[featuredIndex];

  // Generate QR Code for Phone Remote
  useEffect(() => {
    import('qrcode').then(QRCode => {
      const remoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/remote?pair=482917`;
      QRCode.default
        .toDataURL(remoteUrl, {
          width: 260,
          margin: 2,
          color: { dark: '#101113', light: '#F5F5F2' },
        })
        .then(setQrDataUrl);
    });
  }, []);

  // Preload subfolder metadata silently in background
  useEffect(() => {
    VERIFIED_TRIPS.forEach(trip => {
      fetch(`/api/drive/folder?folder=${encodeURIComponent(trip.folderId)}`)
        .then(r => r.json())
        .then(data => {
          if (data.items && data.items.length > 0) {
            albumPhotosCache.current.set(trip.folderId, data.items);
          }
        })
        .catch(() => {});
    });
  }, []);

  // Phone Remote Polling Relay (Hyper-responsive 50ms queue polling with zero dropped commands)
  useEffect(() => {
    let isMounted = true;
    const processedIds = new Set<string>();

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/remote/sync?code=482917&seq=${lastProcessedSeq.current}`, {
          cache: 'no-store',
        });
        if (!res.ok || !isMounted) return;
        const data = await res.json();

        if (data.latestSeq && data.latestSeq > lastProcessedSeq.current) {
          lastProcessedSeq.current = data.latestSeq;
        }

        if (data.commands && Array.isArray(data.commands) && data.commands.length > 0) {
          for (const cmd of data.commands) {
            if (processedIds.has(cmd.id)) continue;
            processedIds.add(cmd.id);

            // Dispatch command
            if (cmd.type === 'dpad_right') {
              setFeaturedIndex(prev => (prev + 1) % VERIFIED_TRIPS.length);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            } else if (cmd.type === 'dpad_left') {
              setFeaturedIndex(prev => (prev - 1 + VERIFIED_TRIPS.length) % VERIFIED_TRIPS.length);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            } else if (cmd.type === 'dpad_up') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            } else if (cmd.type === 'dpad_down') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            } else if (cmd.type === 'ok') {
              openCollection(
                activeFeaturedTrip.folderId,
                activeFeaturedTrip.title,
                activeTab === 'videos' ? 'videos' : 'photos'
              );
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            } else if (cmd.type === 'back') {
              setActiveTab('featured');
              setInSlideshow(false);
              setInVideoPlayer(false);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            } else if (cmd.type === 'play_pause') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
            } else if (cmd.type === 'skip_next') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
            } else if (cmd.type === 'skip_prev') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
            } else if (cmd.type === 'switch_hub') {
              if (cmd.payload?.tab === 'videos') setActiveTab('videos');
              else setActiveTab('photos');
            } else if (cmd.type === 'select_album') {
              if (cmd.payload?.folderId) {
                const idx = VERIFIED_TRIPS.findIndex(a => a.folderId === cmd.payload.folderId);
                if (idx !== -1) setFeaturedIndex(idx);
                openCollection(cmd.payload.folderId, cmd.payload.title, 'photos');
              }
            } else if (cmd.type === 'cursor_move') {
              // High sensitivity direct glide
              setTvCursor(prev => {
                const newX = Math.min(98, Math.max(2, prev.x + (cmd.payload?.dx || 0)));
                const newY = Math.min(98, Math.max(2, prev.y + (cmd.payload?.dy || 0)));
                return { x: newX, y: newY, visible: true };
              });

              if (cursorHideTimer.current) clearTimeout(cursorHideTimer.current);
              cursorHideTimer.current = setTimeout(() => {
                setTvCursor(c => ({ ...c, visible: false }));
              }, 6000);
            } else if (cmd.type === 'cursor_click') {
              setTvCursor(prev => {
                if (typeof window !== 'undefined') {
                  const clickX = (prev.x / 100) * window.innerWidth;
                  const clickY = (prev.y / 100) * window.innerHeight;
                  const rawTarget = document.elementFromPoint(clickX, clickY) as HTMLElement | null;
                  const clickable = rawTarget?.closest('button, a, [role="button"], input, select') as HTMLElement | null;
                  
                  if (clickable) {
                    clickable.click();
                  } else if (rawTarget) {
                    rawTarget.click();
                  } else {
                    openCollection(
                      activeFeaturedTrip.folderId,
                      activeFeaturedTrip.title,
                      activeTab === 'videos' ? 'videos' : 'photos'
                    );
                  }
                }
                return { ...prev, visible: true };
              });
            }
          }
        }
      } catch {}
    }, 50);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeFeaturedTrip, activeTab]);

  // Open Collection for playback
  const openCollection = async (folderId: string, title: string, mode: 'photos' | 'videos') => {
    setLoadingTitle(title);
    const cachedItems = albumPhotosCache.current.get(folderId);

    if (cachedItems && cachedItems.length > 0) {
      if (mode === 'videos') {
        const videos = cachedItems.filter(i => i.mimeType?.startsWith('video/') || i.name?.match(/\.(mp4|mov|webm)$/i));
        if (videos.length > 0) {
          setActiveVideoPlaylist(videos);
          setActiveVideoIndex(0);
          setInVideoPlayer(true);
          return;
        }
      }
      const photos = cachedItems.filter(i => !i.mimeType?.startsWith('video/'));
      setActivePhotos(photos.length > 0 ? photos : cachedItems);
      setInSlideshow(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(folderId)}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        albumPhotosCache.current.set(folderId, data.items);
        if (mode === 'videos') {
          const videos = data.items.filter((i: DriveItem) => i.mimeType?.startsWith('video/') || i.name?.match(/\.(mp4|mov|webm)$/i));
          if (videos.length > 0) {
            setActiveVideoPlaylist(videos);
            setActiveVideoIndex(0);
            setInVideoPlayer(true);
            return;
          }
        }
        const photos = data.items.filter((i: DriveItem) => !i.mimeType?.startsWith('video/'));
        setActivePhotos(photos.length > 0 ? photos : data.items);
        setInSlideshow(true);
      }
    } catch (err) {
      console.error('Failed to open collection:', err);
    } finally {
      setIsLoading(false);
      setLoadingTitle('');
    }
  };

  // TV Remote Spatial Navigation (D-Pad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inSlideshow || inVideoPlayer) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFeaturedIndex(prev => (prev + 1) % VERIFIED_TRIPS.length);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFeaturedIndex(prev => (prev - 1 + VERIFIED_TRIPS.length) % VERIFIED_TRIPS.length);
          break;
        case 'Enter':
          e.preventDefault();
          openCollection(
            activeFeaturedTrip.folderId,
            activeFeaturedTrip.title,
            activeTab === 'videos' ? 'videos' : 'photos'
          );
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          setActiveTab('featured');
          break;
        default:
          if (e.keyCode === 10009 || e.keyCode === 461) {
            e.preventDefault();
            setActiveTab('featured');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inSlideshow, inVideoPlayer, activeFeaturedTrip, activeTab]);

  // Video Player Overlay
  if (inVideoPlayer && activeVideoPlaylist.length > 0) {
    return (
      <TVVideoPlayer
        video={activeVideoPlaylist[activeVideoIndex]}
        playlist={activeVideoPlaylist}
        currentIndex={activeVideoIndex}
        onNext={() => setActiveVideoIndex(prev => (prev + 1) % activeVideoPlaylist.length)}
        onPrev={() => setActiveVideoIndex(prev => (prev - 1 + activeVideoPlaylist.length) % activeVideoPlaylist.length)}
        onExit={() => setInVideoPlayer(false)}
      />
    );
  }

  // Slideshow Player Overlay
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

  const totalPhotos = VERIFIED_TRIPS.reduce((a, b) => a + b.photoCount, 0);
  const totalVideos = VERIFIED_TRIPS.reduce((a, b) => a + b.videoCount, 0);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#101113] text-[#F5F5F2] select-none font-sans overflow-x-hidden flex flex-col justify-between">
      {/* ========================================================= */}
      {/* 1. CINEMATIC HERO SPOTLIGHT BACKGROUND                    */}
      {/* ========================================================= */}
      <div className="absolute inset-0 h-[72vh] w-full overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeaturedTrip.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative w-full h-full"
          >
            {/* Progressive Image: =s320 micro-blurup to =s1400 crisp */}
            <ProgressiveImage
              fileId={activeFeaturedTrip.coverFileId}
              alt={activeFeaturedTrip.title}
              className="w-full h-full object-cover"
              highResSize={1600}
            />

            {/* Apple TV-style Multi-Layer Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101113] via-[#101113]/70 to-[#101113]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#101113] via-[#101113]/60 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* 2. REFINED TOP CINEMA NAVIGATION                          */}
      {/* ========================================================= */}
      <header className="relative z-30 flex items-center justify-between px-8 lg:px-14 pt-7 pb-4">
        {/* Brandmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#191B1F] border border-[#303238] flex items-center justify-center text-[#D8C6A1] shadow-md">
            <Tv className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-[#F5F5F2]">
              DriveFrame
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase block text-[#A3A6AD]">
              Personal Cinema
            </span>
          </div>
        </div>

        {/* Minimal Category Switcher */}
        <nav className="flex items-center gap-1.5 bg-[#191B1F]/90 backdrop-blur-md px-2 py-1 rounded-full border border-[#303238]">
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'featured'
                ? 'bg-[#D8C6A1] text-[#101113] shadow-md'
                : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
            }`}
          >
            Spotlight
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-[#D8C6A1] text-[#101113] shadow-md'
                : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
            }`}
          >
            Photos ({totalPhotos})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-[#D8C6A1] text-[#101113] shadow-md'
                : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
            }`}
          >
            Cinema ({totalVideos})
          </button>
        </nav>

        {/* Right Utility: QR Remote Pill & Lock Button */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] border border-[#303238] text-xs font-medium text-[#D8C6A1] cursor-pointer shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone Remote</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="w-8 h-8 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] border border-[#303238] flex items-center justify-center text-[#A3A6AD] hover:text-[#D8C6A1] cursor-pointer shadow-sm transition-colors"
            title="Lock Vault & Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 3. HERO CONTENT METADATA & ACTIONS                        */}
      {/* ========================================================= */}
      <main className="relative z-20 flex-1 flex flex-col justify-end px-8 lg:px-14 pb-4 max-w-5xl">
        <div className="space-y-3">
          {/* Metadata Badges */}
          <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-[#A3A6AD]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#22252A] border border-[#303238] text-[#D8C6A1] font-semibold">
              {activeFeaturedTrip.year}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span>{activeFeaturedTrip.location}</span>
            </span>
            <span>·</span>
            <span>{activeFeaturedTrip.photoCount} Photos</span>
            <span>·</span>
            <span>{activeFeaturedTrip.videoCount} Videos</span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-[#F5F5F2] leading-tight drop-shadow-md">
            {activeFeaturedTrip.title}
          </h1>

          <p className="text-sm lg:text-base text-[#A3A6AD] max-w-2xl font-light leading-relaxed">
            {activeFeaturedTrip.subtitle}
          </p>

          {/* Action Deck (Apple TV / Netflix Pill Buttons) */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                openCollection(
                  activeFeaturedTrip.folderId,
                  activeFeaturedTrip.title,
                  activeTab === 'videos' ? 'videos' : 'photos'
                )
              }
              className="px-6 py-3 rounded-full bg-[#F5F5F2] hover:bg-[#E5D7B8] text-[#101113] font-semibold text-xs tracking-wide shadow-xl flex items-center gap-2 cursor-pointer transition-transform"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#101113]" />
              ) : (
                <Play className="w-4 h-4 fill-[#101113]" />
              )}
              <span>Play Collection [OK]</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                openCollection(activeFeaturedTrip.folderId, activeFeaturedTrip.title, 'videos')
              }
              className="px-5 py-3 rounded-full bg-[#191B1F]/90 hover:bg-[#22252A] text-[#F5F5F2] border border-[#303238] font-medium text-xs tracking-wide flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Film className="w-3.5 h-3.5 text-[#D8C6A1]" />
              <span>Watch Videos ({activeFeaturedTrip.videoCount})</span>
            </motion.button>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. NETFLIX-STYLE HORIZONTAL TRIP CAROUSEL                 */}
      {/* ========================================================= */}
      <section className="relative z-20 px-8 lg:px-14 pb-8 pt-4">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#A3A6AD]">
              Curated Trips
            </h3>
            <span className="text-[11px] text-[#6B6E76] font-mono">
              Use D-pad [&larr; &rarr;] to navigate
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#A3A6AD]">
            <span>{featuredIndex + 1}</span>
            <span className="text-[#6B6E76]">/</span>
            <span>{VERIFIED_TRIPS.length}</span>
          </div>
        </div>

        {/* 5 Landscape Collection Cards */}
        <div className="grid grid-cols-5 gap-4">
          {VERIFIED_TRIPS.map((trip, idx) => {
            const isSelected = featuredIndex === idx;

            return (
              <motion.div
                key={trip.id}
                onMouseEnter={() => setFeaturedIndex(idx)}
                onClick={() => {
                  setFeaturedIndex(idx);
                  openCollection(trip.folderId, trip.title, activeTab === 'videos' ? 'videos' : 'photos');
                }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`relative rounded-2xl overflow-hidden aspect-[16/10] cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-[#D8C6A1] shadow-[0_12px_32px_rgba(216,198,161,0.2)] scale-[1.03] z-10'
                    : 'opacity-70 hover:opacity-100 ring-1 ring-[#303238]'
                }`}
              >
                {/* Progressive Card Thumbnail */}
                <ProgressiveImage
                  fileId={trip.coverFileId}
                  alt={trip.title}
                  className="w-full h-full object-cover"
                  lowResSize={320}
                  highResSize={600}
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101113] via-[#101113]/30 to-transparent" />

                {/* Card Title & Counts */}
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <h4 className="text-sm font-semibold tracking-tight text-[#F5F5F2] truncate">
                    {trip.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-[#A3A6AD] font-mono mt-0.5">
                    <span>{trip.year}</span>
                    <span>{trip.totalCount} items</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. PHONE REMOTE QR MODAL OVERLAY                          */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#191B1F] p-8 rounded-3xl max-w-sm w-full flex flex-col items-center text-center relative border border-[#303238] shadow-2xl"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#22252A] hover:bg-[#303238] text-[#F5F5F2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#D8C6A1]/15 border border-[#D8C6A1]/30 flex items-center justify-center text-[#D8C6A1] mb-3">
                <Smartphone className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-bold text-[#F5F5F2] tracking-tight">
                Phone as TV Remote
              </h2>
              <p className="text-xs text-[#A3A6AD] mt-1 max-w-xs font-light">
                Scan with your camera to touch-control photos, videos, and albums with virtual mouse gestures.
              </p>

              <div className="mt-4 p-3 rounded-2xl bg-[#F5F5F2] shadow-xl flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pairing QR Code" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#101113]" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-[#D8C6A1] bg-[#D8C6A1]/10 px-3 py-1 rounded-full border border-[#D8C6A1]/20">
                <span>Code: 482917</span>
                <span>·</span>
                <span>No app required</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 6. VIRTUAL MOUSE CURSOR OVERLAY (Controllable via Phone)  */}
      {/* ========================================================= */}
      {tvCursor.visible && (
        <motion.div
          animate={{
            left: `${tvCursor.x}%`,
            top: `${tvCursor.y}%`,
          }}
          transition={{ type: 'spring', stiffness: 550, damping: 32 }}
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <svg
              className="w-8 h-8 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 3l7 18 3-7 7-3L3 3z"
                fill="#D8C6A1"
                stroke="#101113"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-[#D8C6A1] animate-ping opacity-60" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TVHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101113] text-[#A3A6AD] flex items-center justify-center font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#D8C6A1] mr-2" />
          Opening DriveFrame Cinema…
        </div>
      }
    >
      <CinematicTVPlatform />
    </Suspense>
  );
}

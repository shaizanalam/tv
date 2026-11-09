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
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { TVVideoPlayer } from '@/components/media/TVVideoPlayer';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';
import { AlamsFrameLogo } from '@/components/brand/AlamsFrameLogo';
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

type MainTab = 'featured' | 'photos' | 'videos';
type FocusZone = 'tabs' | 'hero' | 'cards' | 'highlights';

function CinematicTVPlatform() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('featured');
  const [featuredIndex, setFeaturedIndex] = useState(0); // 0 to 4
  const [focusZone, setFocusZone] = useState<FocusZone>('cards');
  const [heroActionFocus, setHeroActionFocus] = useState<'primary' | 'secondary'>('primary');
  const [highlightFocusIndex, setHighlightFocusIndex] = useState(0);

  // Player States
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);
  const [inVideoPlayer, setInVideoPlayer] = useState(false);
  const [activeVideoPlaylist, setActiveVideoPlaylist] = useState<DriveItem[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Time & Utilities
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('');
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

  // Update Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

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

  // Hierarchical Back Navigation Handler (Ensures we never leave /tv)
  const handleBack = useCallback(() => {
    if (inVideoPlayer) {
      setInVideoPlayer(false);
      return;
    }
    if (inSlideshow) {
      setInSlideshow(false);
      return;
    }
    if (showQRModal) {
      setShowQRModal(false);
      return;
    }
    if (activeTab !== 'featured') {
      setActiveTab('featured');
      setFocusZone('cards');
      return;
    }
    // If already on featured cards, reset focus zone to cards and remain safely in /tv
    setFocusZone('cards');
  }, [inVideoPlayer, inSlideshow, showQRModal, activeTab]);

  // Trap Browser History Back (Keeps TV and Mobile strictly inside /tv)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Push initial history state so back button can be trapped
    window.history.pushState({ screen: 'tv' }, '', window.location.href);

    const onPopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Immediately push state back to keep URL on /tv
      window.history.pushState({ screen: 'tv' }, '', window.location.href);
      handleBack();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBack]);

  // Open Collection for playback
  const openCollection = useCallback(
    async (folderId: string, title: string, mode: 'photos' | 'videos') => {
      setLoadingTitle(title);
      const cachedItems = albumPhotosCache.current.get(folderId);

      if (cachedItems && cachedItems.length > 0) {
        if (mode === 'videos') {
          const videos = cachedItems.filter(
            i => i.mimeType?.startsWith('video/') || i.name?.match(/\.(mp4|mov|webm)$/i)
          );
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
            const videos = data.items.filter(
              (i: DriveItem) =>
                i.mimeType?.startsWith('video/') || i.name?.match(/\.(mp4|mov|webm)$/i)
            );
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
    },
    []
  );

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
            } else if (cmd.type === 'dpad_left') {
              setFeaturedIndex(prev => (prev - 1 + VERIFIED_TRIPS.length) % VERIFIED_TRIPS.length);
            } else if (cmd.type === 'dpad_up') {
              setFocusZone(prev => (prev === 'cards' ? 'hero' : prev === 'hero' ? 'tabs' : prev));
            } else if (cmd.type === 'dpad_down') {
              setFocusZone(prev => (prev === 'tabs' ? 'hero' : prev === 'hero' ? 'cards' : prev));
            } else if (cmd.type === 'ok') {
              openCollection(
                activeFeaturedTrip.folderId,
                activeFeaturedTrip.title,
                activeTab === 'videos' ? 'videos' : 'photos'
              );
            } else if (cmd.type === 'back') {
              handleBack();
            } else if (cmd.type === 'play_pause') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
            } else if (cmd.type === 'skip_next') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
            } else if (cmd.type === 'skip_prev') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
            } else if (cmd.type === 'switch_hub') {
              if (cmd.payload?.tab === 'videos') setActiveTab('videos');
              else if (cmd.payload?.tab === 'photos') setActiveTab('photos');
              else setActiveTab('featured');
            } else if (cmd.type === 'select_album') {
              if (cmd.payload?.folderId) {
                const idx = VERIFIED_TRIPS.findIndex(a => a.folderId === cmd.payload.folderId);
                if (idx !== -1) setFeaturedIndex(idx);
                openCollection(
                  cmd.payload.folderId,
                  cmd.payload.title,
                  activeTab === 'videos' ? 'videos' : 'photos'
                );
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
                  const clickable = rawTarget?.closest(
                    'button, a, [role="button"], input, select'
                  ) as HTMLElement | null;

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
  }, [activeFeaturedTrip, activeTab, handleBack, openCollection]);

  // TV Remote Spatial Navigation (D-Pad Keyboard Handler)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inSlideshow || inVideoPlayer) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (focusZone === 'cards') {
            setFeaturedIndex(prev => (prev + 1) % VERIFIED_TRIPS.length);
          } else if (focusZone === 'tabs') {
            setActiveTab(prev =>
              prev === 'featured' ? 'photos' : prev === 'photos' ? 'videos' : 'featured'
            );
          } else if (focusZone === 'hero') {
            setHeroActionFocus(prev => (prev === 'primary' ? 'secondary' : 'primary'));
          } else if (focusZone === 'highlights') {
            setHighlightFocusIndex(prev => (prev + 1) % activeFeaturedTrip.highlightShots.length);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusZone === 'cards') {
            setFeaturedIndex(prev => (prev - 1 + VERIFIED_TRIPS.length) % VERIFIED_TRIPS.length);
          } else if (focusZone === 'tabs') {
            setActiveTab(prev =>
              prev === 'videos' ? 'photos' : prev === 'photos' ? 'featured' : 'videos'
            );
          } else if (focusZone === 'hero') {
            setHeroActionFocus(prev => (prev === 'secondary' ? 'primary' : 'secondary'));
          } else if (focusZone === 'highlights') {
            setHighlightFocusIndex(
              prev =>
                (prev - 1 + activeFeaturedTrip.highlightShots.length) %
                activeFeaturedTrip.highlightShots.length
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (focusZone === 'highlights') setFocusZone('cards');
          else if (focusZone === 'cards') setFocusZone('hero');
          else if (focusZone === 'hero') setFocusZone('tabs');
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusZone === 'tabs') setFocusZone('hero');
          else if (focusZone === 'hero') setFocusZone('cards');
          else if (focusZone === 'cards' && activeTab === 'featured') setFocusZone('highlights');
          break;

        case 'Enter':
          e.preventDefault();
          if (focusZone === 'hero') {
            if (heroActionFocus === 'secondary') {
              openCollection(
                activeFeaturedTrip.folderId,
                activeFeaturedTrip.title,
                activeTab === 'videos' ? 'photos' : 'videos'
              );
            } else {
              openCollection(
                activeFeaturedTrip.folderId,
                activeFeaturedTrip.title,
                activeTab === 'videos' ? 'videos' : 'photos'
              );
            }
          } else if (focusZone === 'cards') {
            openCollection(
              activeFeaturedTrip.folderId,
              activeFeaturedTrip.title,
              activeTab === 'videos' ? 'videos' : 'photos'
            );
          } else if (focusZone === 'highlights') {
            openCollection(activeFeaturedTrip.folderId, activeFeaturedTrip.title, 'photos');
          }
          break;

        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          handleBack();
          break;

        default:
          // Samsung Tizen (10009), LG webOS (461), Android TV Back (4)
          if (e.keyCode === 10009 || e.keyCode === 461 || e.keyCode === 4) {
            e.preventDefault();
            handleBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inSlideshow, inVideoPlayer, focusZone, heroActionFocus, activeFeaturedTrip, activeTab, handleBack, openCollection]);

  // Video Player Overlay
  if (inVideoPlayer && activeVideoPlaylist.length > 0) {
    return (
      <TVVideoPlayer
        video={activeVideoPlaylist[activeVideoIndex]}
        playlist={activeVideoPlaylist}
        currentIndex={activeVideoIndex}
        onNext={() => setActiveVideoIndex(prev => (prev + 1) % activeVideoPlaylist.length)}
        onPrev={() =>
          setActiveVideoIndex(
            prev => (prev - 1 + activeVideoPlaylist.length) % activeVideoPlaylist.length
          )
        }
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
      {/* 1. CINEMATIC HERO SPOTLIGHT BACKGROUND (54vh)             */}
      {/* ========================================================= */}
      <div className="absolute top-0 left-0 right-0 h-[56vh] md:h-[58vh] max-h-[580px] w-full overflow-hidden pointer-events-none z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeaturedTrip.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative w-full h-full"
          >
            {/* Progressive Image: Micro-blurup to High-Res Crisp */}
            <ProgressiveImage
              fileId={activeFeaturedTrip.coverFileId}
              alt={activeFeaturedTrip.title}
              className="w-full h-full object-cover"
              highResSize={1800}
            />

            {/* Apple TV-style Multi-Layer Gradient Scrim (Natural contrast without muddy shadows) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101113] via-[#101113]/75 to-[#101113]/25" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#101113] via-[#101113]/60 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* 2. REFINED TOP CINEMA NAVIGATION HEADER                   */}
      {/* ========================================================= */}
      <header className="relative z-30 flex items-center justify-between px-6 lg:px-12 pt-6 pb-2">
        {/* Brandmark */}
        <div
          onClick={() => {
            setActiveTab('featured');
            setFocusZone('cards');
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <AlamsFrameLogo className="h-7 lg:h-8 w-auto text-[#D8C6A1] filter drop-shadow-md group-hover:brightness-110 transition-all" />
        </div>

        {/* Minimal Category Switcher */}
        <nav
          className={`flex items-center gap-1.5 bg-[#191B1F]/90 backdrop-blur-md px-2 py-1.5 rounded-full border transition-all ${
            focusZone === 'tabs' ? 'border-[#D8C6A1] ring-2 ring-[#D8C6A1]/40' : 'border-[#303238]'
          }`}
        >
          <button
            onClick={() => {
              setActiveTab('featured');
              setFocusZone('cards');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'featured'
                ? 'bg-[#D8C6A1] text-[#101113] shadow-md'
                : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
            }`}
          >
            Spotlight
          </button>
          <button
            onClick={() => {
              setActiveTab('photos');
              setFocusZone('cards');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-[#D8C6A1] text-[#101113] shadow-md'
                : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
            }`}
          >
            Photos ({totalPhotos.toLocaleString()})
          </button>
          <button
            onClick={() => {
              setActiveTab('videos');
              setFocusZone('cards');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-[#D8C6A1] text-[#101113] shadow-md'
                : 'text-[#A3A6AD] hover:text-[#F5F5F2]'
            }`}
          >
            Cinema ({totalVideos.toLocaleString()})
          </button>
        </nav>

        {/* Right Utility Deck: Clock, Phone Remote, Logout */}
        <div className="flex items-center gap-2.5">
          {/* Live Apple Glass Clock */}
          <div className="hidden sm:flex items-center gap-2 bg-[#191B1F]/80 border border-[#303238] px-3.5 py-1.5 rounded-full text-xs font-medium text-[#F5F5F2] shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#A3A6AD]" />
            <span>{currentTimeStr || '--:--'}</span>
          </div>

          {/* Phone Remote Pill */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#191B1F]/80 hover:bg-[#22252A] border border-[#303238] text-xs font-medium text-[#D8C6A1] cursor-pointer shadow-sm transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone Remote</span>
          </motion.button>

          {/* Vault Lock / Sign Out */}
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
      <main className="relative z-20 flex flex-col justify-end px-6 lg:px-12 pt-1 pb-4 max-w-4xl">
        <div className="space-y-2.5">
          {/* Metadata Badges */}
          <div className="flex items-center gap-2.5 text-xs font-mono tracking-wider text-[#A3A6AD]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#191B1F] border border-[#303238] text-[#D8C6A1] font-semibold text-[11px]">
              {activeFeaturedTrip.year}
            </span>
            <span>·</span>
            <span>{activeFeaturedTrip.location}</span>
            <span>·</span>
            <span className="text-[#F5F5F2] font-semibold">
              {activeTab === 'videos'
                ? `${activeFeaturedTrip.videoCount} Video Clips`
                : `${activeFeaturedTrip.photoCount} Photographs`}
            </span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-[#F5F5F2] leading-tight drop-shadow-md">
            {activeFeaturedTrip.title}
          </h1>

          <p className="text-xs md:text-sm text-[#A3A6AD] max-w-xl font-light leading-relaxed">
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
              className={`px-6 py-2.5 rounded-full font-semibold text-xs tracking-wide shadow-xl flex items-center gap-2 cursor-pointer transition-all ${
                focusZone === 'hero' && heroActionFocus === 'primary'
                  ? 'bg-[#D8C6A1] text-[#101113] ring-2 ring-[#D8C6A1] ring-offset-2 ring-offset-[#101113] scale-[1.02]'
                  : 'bg-[#F5F5F2] hover:bg-[#E5D7B8] text-[#101113]'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#101113]" />
              ) : activeTab === 'videos' ? (
                <Film className="w-4 h-4 fill-current text-[#101113]" />
              ) : (
                <Play className="w-4 h-4 fill-[#101113]" />
              )}
              <span>
                {activeTab === 'videos' ? 'Play Cinema Clips [OK]' : 'Play Collection [OK]'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                openCollection(
                  activeFeaturedTrip.folderId,
                  activeFeaturedTrip.title,
                  activeTab === 'videos' ? 'photos' : 'videos'
                )
              }
              className={`px-5 py-2.5 rounded-full text-[#F5F5F2] border font-medium text-xs tracking-wide flex items-center gap-2 cursor-pointer shadow-md transition-all ${
                focusZone === 'hero' && heroActionFocus === 'secondary'
                  ? 'bg-[#22252A] border-[#D8C6A1] ring-2 ring-[#D8C6A1] ring-offset-2 ring-offset-[#101113]'
                  : 'bg-[#191B1F]/90 hover:bg-[#22252A] border-[#303238]'
              }`}
            >
              {activeTab === 'videos' ? (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-[#D8C6A1]" />
                  <span>Explore Photos ({activeFeaturedTrip.photoCount})</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5 text-[#D8C6A1]" />
                  <span>Watch Videos ({activeFeaturedTrip.videoCount})</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. CURATED TRIPS CAROUSEL (Aspect 16:10, TV-First Focus) */}
      {/* ========================================================= */}
      <section className="relative z-20 px-6 lg:px-12 pb-5 pt-3">
        <div className="flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#D8C6A1] font-semibold">
              {activeTab === 'videos'
                ? 'Video Collections'
                : activeTab === 'photos'
                ? 'Curated Photo Albums'
                : 'Curated Trips'}
            </h3>
            <span className="text-[11px] text-[#A3A6AD]/70 font-mono hidden sm:inline">
              D-pad [&larr; &rarr;] to select · [OK] to launch
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#A3A6AD]">
            <span className="text-[#F5F5F2] font-semibold">{featuredIndex + 1}</span>
            <span className="text-[#303238]">/</span>
            <span>{VERIFIED_TRIPS.length}</span>
          </div>
        </div>

        {/* 5 Landscape Collection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 lg:gap-4.5">
          {VERIFIED_TRIPS.map((trip, idx) => {
            const isSelected = featuredIndex === idx;
            const isFocused = focusZone === 'cards' && isSelected;

            return (
              <motion.div
                key={trip.id}
                onMouseEnter={() => {
                  setFeaturedIndex(idx);
                  setFocusZone('cards');
                }}
                onClick={() => {
                  setFeaturedIndex(idx);
                  openCollection(
                    trip.folderId,
                    trip.title,
                    activeTab === 'videos' ? 'videos' : 'photos'
                  );
                }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`relative rounded-2xl overflow-hidden aspect-[16/10] cursor-pointer transition-all border ${
                  isFocused
                    ? 'ring-2 ring-[#D8C6A1] ring-offset-2 ring-offset-[#101113] shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(216,198,161,0.18)] scale-[1.03] z-10 border-[#D8C6A1]'
                    : isSelected
                    ? 'ring-1 ring-[#D8C6A1]/60 border-[#D8C6A1]/40'
                    : 'opacity-75 hover:opacity-100 border-[#303238]'
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

                {/* Soft Bottom-Only Scrim (Keeps imagery bright, text 100% legible) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101113]/90 via-[#101113]/30 to-transparent" />

                {/* Card Title & Counts */}
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <h4 className="text-xs sm:text-sm font-semibold tracking-tight text-[#F5F5F2] truncate">
                    {trip.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-[#A3A6AD] font-mono mt-0.5">
                    <span>{trip.year}</span>
                    <span>
                      {activeTab === 'videos'
                        ? `${trip.videoCount} videos`
                        : `${trip.photoCount} photos`}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. EDITORIAL HIGHLIGHT MOMENTS (Spotlight Mode Only)       */}
      {/* ========================================================= */}
      {activeTab === 'featured' && (
        <section className="relative z-20 px-6 lg:px-12 pb-7 pt-1">
          <div className="flex items-center justify-between pb-2.5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#A3A6AD] font-semibold">
              Highlight Moments · {activeFeaturedTrip.title}
            </h3>
            <span className="text-[11px] text-[#A3A6AD]/60 font-mono">
              Curated Shots
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {activeFeaturedTrip.highlightShots.map((shot, sIdx) => {
              const isHighlightFocused = focusZone === 'highlights' && highlightFocusIndex === sIdx;

              return (
                <motion.div
                  key={shot.fileId}
                  onClick={() =>
                    openCollection(activeFeaturedTrip.folderId, activeFeaturedTrip.title, 'photos')
                  }
                  whileHover={{ y: -2 }}
                  className={`group relative rounded-xl overflow-hidden bg-[#191B1F] border p-3 flex items-center gap-3.5 cursor-pointer transition-all ${
                    isHighlightFocused
                      ? 'border-[#D8C6A1] ring-2 ring-[#D8C6A1]/40 bg-[#22252A]'
                      : 'border-[#303238] hover:border-[#D8C6A1]/40 hover:bg-[#22252A]/60'
                  }`}
                >
                  <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 relative">
                    <ProgressiveImage
                      fileId={shot.fileId}
                      alt={shot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      lowResSize={180}
                      highResSize={360}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] font-mono uppercase text-[#D8C6A1] tracking-wider block font-semibold">
                      {shot.tag}
                    </span>
                    <h5 className="text-xs font-semibold text-[#F5F5F2] truncate mt-0.5">
                      {shot.title}
                    </h5>
                    <p className="text-[10px] text-[#A3A6AD] truncate font-light">
                      {shot.subtitle}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 6. PHONE REMOTE QR MODAL OVERLAY                          */}
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
      {/* 7. VIRTUAL MOUSE CURSOR OVERLAY (Controllable via Phone)  */}
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
          Opening Alam&apos;s Frame Cinema…
        </div>
      }
    >
      <CinematicTVPlatform />
    </Suspense>
  );
}

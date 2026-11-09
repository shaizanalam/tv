'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
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
  Video,
  Smartphone,
  X,
  QrCode,
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
  subtitle: string;
  coverFileId: string;
  highlightShots: HighlightShot[];
  photoCount: number;
  videoCount: number;
  totalCount: number;
}

/* ============================================================
   Constants
   ============================================================ */

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

// 5 verified collections with stable Google Drive File IDs
const VERIFIED_TRIPS: AlbumFolder[] = [
  {
    id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    folderId: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za',
    title: 'Dubai 2025',
    subtitle: 'Desert & Skyline Memories',
    coverFileId: '1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
    totalCount: 351,
    photoCount: 337,
    videoCount: 14,
    highlightShots: [
      {
        fileId: '1f0R4cGah8w1taWaCLgCXwVvC4Qo-4uPv',
        tag: 'DUBAI MALL',
        title: 'Dubai Mall Emaar',
        subtitle: 'City Center & Palm Boulevard',
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
        subtitle: 'Golden Hour Memories',
      },
    ],
  },
  {
    id: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    folderId: '17rjsvO8qP2dAime91juLLN1q68ADloZS',
    title: 'Ajmer Agra 25',
    subtitle: 'Taj Mahal & Heritage Journey',
    coverFileId: '1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
    totalCount: 404,
    photoCount: 326,
    videoCount: 78,
    highlightShots: [
      {
        fileId: '1GDyj4qioexLHWgWOow3johLzVJrt7DBi',
        tag: 'ROADTRIP',
        title: 'Expressway Highway',
        subtitle: 'Family Drive to the Taj',
      },
      {
        fileId: '1Ul1iyrpdoV7xUvy9G-t1aG9otBu2V12R',
        tag: 'HERITAGE',
        title: 'Ajmer Sharif Dargah',
        subtitle: 'Courtyard & Historic Dome',
      },
      {
        fileId: '12er1qFhLNpVuLyltGHlaG8AeulPRKhNn',
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
        subtitle: 'Spiritual Peace & Prayers',
      },
      {
        fileId: '15-rV7xGt9IWRIhA7FPSKCs2UATsyk-Ma',
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
    coverFileId: '1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
    totalCount: 259,
    photoCount: 132,
    videoCount: 127,
    highlightShots: [
      {
        fileId: '1IYhsZ6Y1jbaBolp4_U38QfDzaRUnwz6Z',
        tag: 'AIRPORT VIEW',
        title: 'Runway Flight Deck',
        subtitle: 'Watching the Airplanes',
      },
      {
        fileId: '1qWfYQ3RC3CUd7kDqXsUqDy7Lv8kOBm1a',
        tag: 'GOPRO 4K',
        title: 'Wide Angle Action',
        subtitle: 'Cinematic Travel Reels',
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
    subtitle: 'Hill Station & Nature Trails',
    coverFileId: '17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
    totalCount: 292,
    photoCount: 222,
    videoCount: 70,
    highlightShots: [
      {
        fileId: '17Z3gnh-D9jrhm94oLyJySnX4k0bA-t91',
        tag: 'HILL RESORT',
        title: 'Heritage Bungalow',
        subtitle: 'Queen of Satpura Greens',
      },
      {
        fileId: '1q3f6-_peYW3KjdG0WRnhz0hrnpfgofH2',
        tag: 'MOUNTAIN VALLEY',
        title: 'Valley Vistas',
        subtitle: 'Pine Mist & Escarpments',
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

type FocusSection = 'slats' | 'arch' | 'rightCards' | 'dock' | 'search';
type MediaHubTab = 'photos' | 'videos';

/* ============================================================
   Apple Motion Springs
   ============================================================ */
const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 420, damping: 32 };
const SPRING_SHEET  = { type: 'spring' as const, stiffness: 320, damping: 28 };
const SPRING_CARD   = { type: 'spring' as const, stiffness: 280, damping: 26 };

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

function CreativeTVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, toggle: toggleTheme } = useDarkMode();

  // Media Hub View Mode: 'photos' | 'videos'
  const [activeMediaTab, setActiveMediaTab] = useState<MediaHubTab>('photos');

  const [albums, setAlbums] = useState<AlbumFolder[]>(VERIFIED_TRIPS);
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [expandedSlatIndex, setExpandedSlatIndex] = useState(0);
  const [dockFocusIndex, setDockFocusIndex] = useState(5);

  // Slideshow Player State (Photos)
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);

  // Video Player State (Videos)
  const [inVideoPlayer, setInVideoPlayer] = useState(false);
  const [activeVideoPlaylist, setActiveVideoPlaylist] = useState<DriveItem[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [folderInput, setFolderInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAlbumTitle, setLoadingAlbumTitle] = useState('');

  const albumPhotosCache = useRef<Map<string, DriveItem[]>>(new Map());
  const [focusSection, setFocusSection] = useState<FocusSection>('slats');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const lastProcessedCmdTime = useRef(0);

  // TV Mouse Cursor Position from Phone Remote (normalized 0-100%)
  const [tvCursor, setTvCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });
  const cursorHideTimer = useRef<NodeJS.Timeout | null>(null);

  // Generate QR Code targeting the /remote page
  useEffect(() => {
    import('qrcode').then(QRCode => {
      const remoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/remote?pair=482917`;
      QRCode.default.toDataURL(remoteUrl, {
        width: 260,
        margin: 2,
        color: { dark: '#111215', light: '#fafaf9' },
      }).then(setQrDataUrl);
    });
  }, []);

  // Open Album (Instant if pre-cached!)
  const openAlbum = useCallback(async (folderId: string, title?: string) => {
    setLoadingAlbumTitle(title || 'Album');
    const cachedItems = albumPhotosCache.current.get(folderId);

    if (cachedItems && cachedItems.length > 0) {
      if (activeMediaTab === 'videos') {
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
        if (activeMediaTab === 'videos') {
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
      console.error('Failed to load album:', err);
    } finally {
      setIsLoading(false);
      setLoadingAlbumTitle('');
    }
  }, [activeMediaTab]);

  // Realtime Polling Listener for Phone Remote Commands
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/remote/sync?code=482917&since=${lastProcessedCmdTime.current}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.command && data.command.timestamp > lastProcessedCmdTime.current) {
          lastProcessedCmdTime.current = data.command.timestamp;
          const cmd = data.command;

          // Dispatch command to active view
          if (cmd.type === 'dpad_right') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
          } else if (cmd.type === 'dpad_left') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
          } else if (cmd.type === 'dpad_up') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
          } else if (cmd.type === 'dpad_down') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
          } else if (cmd.type === 'ok') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
          } else if (cmd.type === 'back') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          } else if (cmd.type === 'play_pause') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
          } else if (cmd.type === 'skip_next') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
          } else if (cmd.type === 'skip_prev') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
          } else if (cmd.type === 'switch_hub') {
            if (cmd.payload?.tab) setActiveMediaTab(cmd.payload.tab);
          } else if (cmd.type === 'select_album') {
            if (cmd.payload?.folderId) {
              const idx = albums.findIndex(a => a.folderId === cmd.payload.folderId);
              if (idx !== -1) setSelectedAlbumIndex(idx);
              openAlbum(cmd.payload.folderId, cmd.payload.title);
            }
          } else if (cmd.type === 'cursor_move') {
            // Smoothly move mouse cursor on TV
            setTvCursor(prev => {
              const newX = Math.min(98, Math.max(2, prev.x + (cmd.payload?.dx || 0)));
              const newY = Math.min(98, Math.max(2, prev.y + (cmd.payload?.dy || 0)));
              return { x: newX, y: newY, visible: true };
            });

            if (cursorHideTimer.current) clearTimeout(cursorHideTimer.current);
            cursorHideTimer.current = setTimeout(() => {
              setTvCursor(c => ({ ...c, visible: false }));
            }, 5000);
          } else if (cmd.type === 'cursor_click') {
            // Trigger click at cursor coordinates
            setTvCursor(prev => {
              if (typeof window !== 'undefined') {
                const clickX = (prev.x / 100) * window.innerWidth;
                const clickY = (prev.y / 100) * window.innerHeight;
                const targetElement = document.elementFromPoint(clickX, clickY) as HTMLElement | null;
                if (targetElement) {
                  targetElement.click();
                }
              }
              return { ...prev, visible: true };
            });
          }
        }
      } catch {}
    }, 120);

    return () => clearInterval(pollInterval);
  }, [albums, openAlbum]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch albums & preload metadata
  const fetchAlbums = useCallback(async (targetId: string) => {
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(targetId)}`);
      const data = await res.json();
      if (data.subfolders && data.subfolders.length > 0) {
        const matched = VERIFIED_TRIPS.map(trip => {
          const found = data.subfolders.find((s: AlbumFolder) => s.folderId === trip.folderId);
          return found
            ? {
                ...trip,
                ...found,
                subtitle: trip.subtitle,
                coverFileId: trip.coverFileId,
                highlightShots: trip.highlightShots,
              }
            : trip;
        });
        setAlbums(matched);

        // Preload subfolders in the background quietly without blocking UI
        matched.forEach((sub: AlbumFolder) => {
          fetch(`/api/drive/folder?folder=${encodeURIComponent(sub.folderId)}`)
            .then(r => r.json())
            .then(subData => {
              if (subData.items && subData.items.length > 0) {
                albumPhotosCache.current.set(sub.folderId, subData.items);
                // Preload first 2 images into browser cache immediately
                for (let i = 0; i < Math.min(2, subData.items.length); i++) {
                  const it = subData.items[i];
                  if (!it.mimeType?.startsWith('video/')) {
                    const preload = new Image();
                    preload.referrerPolicy = 'no-referrer';
                    preload.src = `https://lh3.googleusercontent.com/d/${it.fileId || it.id}=s1400`;
                  }
                }
              }
            })
            .catch(() => {});
        });
      } else if (data.items && data.items.length > 0) {
        // Direct folder opened
        const photosOnly = data.items.filter((item: DriveItem) => !item.mimeType?.startsWith('video/'));
        const videosOnly = data.items.filter((item: DriveItem) => item.mimeType?.startsWith('video/') || item.name?.match(/\.(mp4|mov|webm)$/i));

        if (activeMediaTab === 'videos' && videosOnly.length > 0) {
          setActiveVideoPlaylist(videosOnly);
          setActiveVideoIndex(0);
          setInVideoPlayer(true);
        } else {
          setActivePhotos(photosOnly.length > 0 ? photosOnly : data.items);
          setInSlideshow(true);
        }
      }
    } catch {
      setAlbums(VERIFIED_TRIPS);
    }
  }, [activeMediaTab]);

  useEffect(() => {
    const target = searchParams.get('folder') || DEFAULT_MAIN_FOLDER;
    setFolderInput(target);
    fetchAlbums(target);
  }, [searchParams, fetchAlbums]);

  // Play Master Collection (All 1,899 Photos or all Videos)
  const playMasterCollection = async () => {
    let combined: DriveItem[] = [];
    for (const [, items] of albumPhotosCache.current.entries()) {
      combined = combined.concat(items);
    }

    if (combined.length > 0) {
      if (activeMediaTab === 'videos') {
        const allVideos = combined.filter(i => i.mimeType?.startsWith('video/') || i.name?.match(/\.(mp4|mov|webm)$/i));
        if (allVideos.length > 0) {
          setActiveVideoPlaylist(allVideos);
          setActiveVideoIndex(0);
          setInVideoPlayer(true);
          return;
        }
      }
      const allPhotos = combined.filter(i => !i.mimeType?.startsWith('video/'));
      const shuffled = [...(allPhotos.length > 0 ? allPhotos : combined)].sort(() => Math.random() - 0.5);
      setActivePhotos(shuffled);
      setInSlideshow(true);
      return;
    }

    if (albums.length > 0) {
      openAlbum(albums[0].folderId, 'Featured Memories');
    }
  };

  const activeFeaturedTrip = albums[selectedAlbumIndex] || albums[0];
  const activeHighlights = activeFeaturedTrip.highlightShots || VERIFIED_TRIPS[0].highlightShots;

  // TV Remote controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inSlideshow || inVideoPlayer) return;

      switch (e.key) {
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
          } else if (focusSection === 'dock') {
            setDockFocusIndex(prev => Math.min(6, prev + 1));
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
          } else if (focusSection === 'dock') {
            setDockFocusIndex(prev => Math.max(0, prev - 1));
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusSection === 'search') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards') {
            if (selectedAlbumIndex < albums.length - 1) {
              setSelectedAlbumIndex(prev => prev + 1);
            } else {
              setFocusSection('dock');
              setDockFocusIndex(5);
            }
          } else if (focusSection === 'slats' || focusSection === 'arch') {
            setFocusSection('dock');
            setDockFocusIndex(5);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (focusSection === 'dock') {
            setFocusSection('slats');
          } else if (focusSection === 'rightCards') {
            if (selectedAlbumIndex > 0) {
              setSelectedAlbumIndex(prev => prev - 1);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (focusSection === 'slats' || focusSection === 'arch') {
            openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title);
          } else if (focusSection === 'rightCards') {
            const alb = albums[selectedAlbumIndex];
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
            }
            if (dockFocusIndex === 5) {
              openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title);
            }
            if (dockFocusIndex === 6) {
              setSelectedAlbumIndex(prev => (prev + 1) % albums.length);
            }
          }
          break;

        case 'v':
        case 'V':
          // Remote hotkey: Toggle between Photos and Videos hub
          e.preventDefault();
          setActiveMediaTab(prev => (prev === 'photos' ? 'videos' : 'photos'));
          break;

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
    selectedAlbumIndex,
    dockFocusIndex,
    albums,
    activeFeaturedTrip,
    inSlideshow,
    inVideoPlayer,
    router,
  ]);

  // Video Player View (Full TV Experience)
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

  // Slideshow Player View (Photos)
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

  // Total counts across all 5 collections
  const totalPhotos = albums.reduce((acc, alb) => acc + (alb.photoCount || 0), 0);
  const totalVideos = albums.reduce((acc, alb) => acc + (alb.videoCount || 0), 0);

  return (
    <div
      className="relative h-[100dvh] w-full select-none flex flex-col justify-between p-6 lg:p-8 xl:p-10 overflow-hidden font-sans transition-colors duration-500"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Subtle ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 30%, rgba(240,160,48,0.03) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 30%, rgba(232,134,12,0.03) 0%, transparent 70%)',
        }}
      />

      {/* Loading Modal Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)', backdropFilter: 'blur(16px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={SPRING_SHEET}
              className="glass p-7 rounded-3xl flex flex-col items-center gap-3.5"
            >
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--accent)' }} />
              <div className="text-center">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Opening {loadingAlbumTitle || 'Collection'}
                </h3>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Loading {activeMediaTab === 'videos' ? 'videos' : 'photos'}…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 1. CLEAN MINIMAL HEADER WITH DEDICATED MEDIA HUBS         */}
      {/* ========================================================= */}
      <header className="relative z-20 flex items-center justify-between pb-2">
        {/* Brand & Media Hub Selector (Photos vs Videos) */}
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            DriveFrame
          </span>

          {/* Netflix-Style Segregated Hub Tabs */}
          <div className="glass flex items-center p-1 rounded-full gap-1">
            <button
              onClick={() => setActiveMediaTab('photos')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                activeMediaTab === 'photos'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos ({totalPhotos})</span>
            </button>

            <button
              onClick={() => setActiveMediaTab('videos')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                activeMediaTab === 'videos'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos ({totalVideos})</span>
            </button>
          </div>
        </div>

        {/* Right: QR Remote Badge, Theme Toggle & Search */}
        <div className="flex items-center gap-2.5">
          {/* Phone Remote QR Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowQRModal(true)}
            className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer text-amber-400 hover:text-amber-300 transition-colors"
            title="Control TV from Phone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Phone Remote</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full glass flex items-center justify-center cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            ) : (
              <Sun className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            )}
          </motion.button>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (folderInput.trim()) fetchAlbums(folderInput.trim());
            }}
            className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5"
          >
            <Search className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={folderInput}
              onChange={e => setFolderInput(e.target.value)}
              placeholder="Paste folder link…"
              className="bg-transparent border-none text-xs focus:outline-none w-32 md:w-44"
              style={{ color: 'var(--text-primary)' }}
            />
          </form>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 3-PANEL SHOWCASE (Roomy, Airy Layout)              */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 items-center my-auto">
        {/* LEFT: 3 Highlight Slats with Progressive Image Decodes */}
        <div className="col-span-6 h-[66vh] flex gap-3">
          {activeHighlights.map((shot, idx) => {
            const isCenterSlat = idx === 0;
            const isSlatFocused =
              focusSection === 'slats' ? expandedSlatIndex === idx : isCenterSlat;

            return (
              <motion.div
                key={shot.fileId + idx}
                onMouseEnter={() => {
                  setFocusSection('slats');
                  setExpandedSlatIndex(idx);
                }}
                onClick={() => openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title)}
                animate={{
                  flexGrow: isSlatFocused ? 2.5 : 1,
                  scale: isSlatFocused ? 1.0 : 0.985,
                }}
                transition={SPRING_CARD}
                className="relative h-full basis-0 rounded-3xl overflow-hidden cursor-pointer group"
                style={{
                  boxShadow: isSlatFocused
                    ? '0 24px 60px rgba(0,0,0,0.18)'
                    : '0 4px 16px rgba(0,0,0,0.04)',
                  outline: isSlatFocused ? '3px solid var(--focus-ring)' : 'none',
                  outlineOffset: '3px',
                }}
              >
                {/* 2-Tier Progressive Blur-Up Engine (Instant micro-thumbnail -> Crisp Retina Stream) */}
                <ProgressiveImage
                  fileId={shot.fileId}
                  alt={shot.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0" style={{ background: 'var(--scrim)' }} />

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold mb-2"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(12px)',
                      color: 'var(--accent)',
                    }}
                  >
                    {activeMediaTab === 'videos' ? (
                      <span className="flex items-center gap-1">
                        <Video className="w-2.5 h-2.5" /> VIDEO REEL
                      </span>
                    ) : (
                      shot.tag
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white drop-shadow truncate">
                    {shot.title}
                  </h3>
                  <p className="text-xs text-white/70 font-light truncate mt-0.5">
                    {shot.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CENTER: Arched Ambient Widget */}
        <div className="col-span-3 h-[66vh] flex justify-center">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_SHEET}
            className="relative w-full max-w-[280px] h-full rounded-t-[140px] rounded-b-[32px] glass flex flex-col justify-between items-center text-center p-6"
            style={{
              outline: focusSection === 'arch' ? '3px solid var(--focus-ring)' : 'none',
              outlineOffset: '3px',
            }}
          >
            {/* Ambient Orb */}
            <div className="mt-4 flex flex-col items-center">
              <div
                className="relative w-18 h-18 rounded-full flex items-center justify-center cursor-pointer animate-breathe"
                style={{
                  background: `linear-gradient(135deg, var(--orb-from), var(--orb-via), var(--orb-to))`,
                }}
              >
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-transparent via-white/25 to-white/60 blur-[0.5px]" />
                <Sparkles className="w-6 h-6 text-white/95 drop-shadow" />
              </div>
            </div>

            {/* Time & Active Collection */}
            <div className="space-y-1 my-auto">
              <div
                className="text-4xl font-light tracking-tight font-sans"
                style={{ color: 'var(--text-primary)' }}
              >
                {timeStr.split(' ')[0] || '12:48'}
              </div>
              <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                {dateStr || 'Saturday, Nov 7'}
              </p>
              <div className="pt-2">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {activeFeaturedTrip.title}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {activeMediaTab === 'videos'
                    ? `${activeFeaturedTrip.videoCount} Videos`
                    : `${activeFeaturedTrip.photoCount} Photos`}
                </p>
              </div>
            </div>

            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title)}
              className="w-full py-2.5 px-4 rounded-full font-medium text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>
                {activeMediaTab === 'videos' ? 'Watch Videos' : `Play ${activeFeaturedTrip.title}`}
              </span>
            </motion.button>
          </motion.div>
        </div>

        {/* RIGHT: Floating Cards for the 5 Trips with Badge Counts */}
        <div className="col-span-3 h-[66vh] flex flex-col justify-center gap-2.5 py-1">
          {albums.map((album, idx) => {
            const isSelected = selectedAlbumIndex === idx;

            return (
              <motion.div
                key={album.id}
                onMouseEnter={() => {
                  setFocusSection('rightCards');
                  setSelectedAlbumIndex(idx);
                }}
                onClick={() => {
                  setSelectedAlbumIndex(idx);
                  openAlbum(album.folderId, album.title);
                }}
                whileHover={{ x: -4 }}
                transition={SPRING_SNAPPY}
                className="group cursor-pointer rounded-2xl p-2 flex items-center justify-between transition-all"
                style={{
                  background: isSelected ? 'var(--card-bg)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                  boxShadow: isSelected ? 'var(--card-shadow-hover)' : 'none',
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  {/* Progressive Micro-Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 skeleton relative">
                    <ProgressiveImage
                      fileId={album.coverFileId}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      lowResSize={200}
                      highResSize={400}
                    />
                    {activeMediaTab === 'videos' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-3 h-3 fill-white text-white opacity-80" />
                      </div>
                    )}
                  </div>

                  <div className="truncate">
                    <h4
                      className="text-xs font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {album.title}
                    </h4>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {activeMediaTab === 'videos' ? (
                        <span className="text-amber-400 font-semibold">{album.videoCount} Videos</span>
                      ) : (
                        <span>{album.photoCount} Photos</span>
                      )}
                    </p>
                  </div>
                </div>

                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--text-tertiary)',
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. MINIMAL BOTTOM BAR                                     */}
      {/* ========================================================= */}
      <footer
        className="relative z-20 flex items-center justify-between pt-2"
        style={{ borderTop: '1px solid var(--separator)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Living Room TV
          </span>
          <span className="text-[10px] font-mono text-stone-500">
            · Press [V] to switch Hub
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSelectedAlbumIndex(prev => (prev - 1 + albums.length) % albums.length);
            }}
            className="p-1.5 rounded-full cursor-pointer"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <SkipBack className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => openAlbum(activeFeaturedTrip.folderId, activeFeaturedTrip.title)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSelectedAlbumIndex(prev => (prev + 1) % albums.length);
            }}
            className="p-1.5 rounded-full cursor-pointer"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>

          <span className="text-xs px-2" style={{ color: 'var(--separator)' }}>|</span>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={playMasterCollection}
            className="px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
          >
            {activeMediaTab === 'videos' ? `Play All Videos (${totalVideos})` : `Play All Photos (${totalPhotos})`}
          </motion.button>
        </div>

        <div className="text-xs font-mono font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {timeStr || '12:48 PM'}
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 4. PHONE REMOTE QR MODAL POPUP                            */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={SPRING_SHEET}
              onClick={e => e.stopPropagation()}
              className="glass p-8 rounded-3xl max-w-sm w-full flex flex-col items-center text-center relative shadow-2xl border border-white/20"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-bold text-white tracking-tight">
                Use Phone as TV Remote
              </h2>
              <p className="text-xs text-stone-300/80 mt-1 max-w-xs">
                Scan with your phone camera to touch-control photos, videos, and albums.
              </p>

              {/* QR Code Canvas Frame */}
              <div className="mt-5 p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pairing QR Code" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                <span>Code: 482917</span>
                <span>·</span>
                <span>No app required</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 5. VIRTUAL MOUSE CURSOR OVERLAY (Controllable via Phone)  */}
      {/* ========================================================= */}
      {tvCursor.visible && (
        <motion.div
          animate={{
            left: `${tvCursor.x}%`,
            top: `${tvCursor.y}%`,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
        >
          {/* Glowing Cursor Pointer */}
          <div className="relative">
            <svg
              className="w-8 h-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter drop-shadow"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 3l7 18 3-7 7-3L3 3z"
                fill="#fbbf24"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-60" />
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
        <div
          className="min-h-screen flex items-center justify-center font-mono text-xs"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}
        >
          <Loader2 className="w-5 h-5 animate-spin mr-2" style={{ color: 'var(--accent)' }} />
          Loading DriveFrame TV…
        </div>
      }
    >
      <CreativeTVContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Sparkles, FolderHeart, Search, Loader2 } from 'lucide-react';
import { TVNavbar } from '@/components/tv/TVNavbar';
import { TVCard } from '@/components/tv/TVCard';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { useSpatialNav } from '@/hooks/useSpatialNav';
import { Album, DriveItem } from '@/lib/types';

const SAMPLE_ALBUMS: Album[] = [
  {
    id: 'alb-1',
    folderId: 'folder-trips',
    title: 'Family Trips & Vacations',
    description: 'Summer holidays, road trips & mountain retreats',
    photoCount: 48,
    coverFileId: 'photo-1',
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
    isHidden: false,
    customOrder: 1,
  },
  {
    id: 'alb-2',
    folderId: 'folder-celebrations',
    title: 'Birthdays & Celebrations',
    description: 'Milestones, festivals & family gatherings',
    photoCount: 36,
    coverFileId: 'photo-2',
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    isHidden: false,
    customOrder: 2,
  },
  {
    id: 'alb-3',
    folderId: 'folder-nature',
    title: 'Nature & Landscapes',
    description: 'Golden hour sunsets, coastlines and scenic trails',
    photoCount: 52,
    coverFileId: 'photo-3',
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    isHidden: false,
    customOrder: 3,
  },
  {
    id: 'alb-4',
    folderId: 'folder-old',
    title: 'Old Memories & Heritage',
    description: 'Scanned vintage photographs and childhood memories',
    photoCount: 64,
    coverFileId: 'photo-4',
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    isHidden: false,
    customOrder: 4,
  },
];

const SAMPLE_PHOTOS: DriveItem[] = [
  {
    id: 'p-1',
    fileId: 'photo-1',
    name: 'Mountain Sunrise.jpg',
    mimeType: 'image/jpeg',
    parentId: 'folder-trips',
    size: 4200000,
    thumbnailLink: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=85',
    width: 3840,
    height: 2160,
    isFolder: false,
    trashed: false,
    driveCreatedTime: '2025-08-14T06:30:00Z',
    driveModifiedTime: '2025-08-14T06:30:00Z',
  },
  {
    id: 'p-2',
    fileId: 'photo-2',
    name: 'Family Celebration at Sunset.jpg',
    mimeType: 'image/jpeg',
    parentId: 'folder-celebrations',
    size: 3800000,
    thumbnailLink: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=85',
    width: 3840,
    height: 2160,
    isFolder: false,
    trashed: false,
    driveCreatedTime: '2025-10-22T18:45:00Z',
    driveModifiedTime: '2025-10-22T18:45:00Z',
  },
  {
    id: 'p-3',
    fileId: 'photo-3',
    name: 'Misty Alpine Lake.jpg',
    mimeType: 'image/jpeg',
    parentId: 'folder-nature',
    size: 4500000,
    thumbnailLink: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=85',
    width: 3840,
    height: 2160,
    isFolder: false,
    trashed: false,
    driveCreatedTime: '2025-11-04T09:15:00Z',
    driveModifiedTime: '2025-11-04T09:15:00Z',
  },
  {
    id: 'p-4',
    fileId: 'photo-4',
    name: 'Snowy Peak Panorama.jpg',
    mimeType: 'image/jpeg',
    parentId: 'folder-old',
    size: 5100000,
    thumbnailLink: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85',
    width: 3840,
    height: 2160,
    isFolder: false,
    trashed: false,
    driveCreatedTime: '2025-12-25T14:20:00Z',
    driveModifiedTime: '2025-12-25T14:20:00Z',
  },
];

function TVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>(SAMPLE_PHOTOS);
  const [folderInput, setFolderInput] = useState('');
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const { activeFocusId, registerNode } = useSpatialNav('hero-play');

  const startSlideshow = (photos = SAMPLE_PHOTOS) => {
    setActivePhotos(photos);
    setInSlideshow(true);
  };

  // Auto-play folder if passed in URL
  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam) {
      setFolderInput(folderParam);
      setIsLoadingFolder(true);
      fetch(`/api/drive/folder?folder=${encodeURIComponent(folderParam)}`)
        .then(res => res.json())
        .then(data => {
          if (data.items && data.items.length > 0) {
            startSlideshow(data.items);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingFolder(false));
    }
  }, [searchParams]);

  const loadCustomFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!folderInput.trim()) return;

    setIsLoadingFolder(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(folderInput.trim())}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        startSlideshow(data.items);
      } else {
        startSlideshow(SAMPLE_PHOTOS);
      }
    } catch {
      startSlideshow(SAMPLE_PHOTOS);
    } finally {
      setIsLoadingFolder(false);
    }
  };

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
    <div className="min-h-[100dvh] w-full bg-[#09090b] text-stone-100 p-8 lg:p-14 select-none overflow-x-hidden">
      {/* 10-Foot Navigation Bar */}
      <TVNavbar activeSection="Gallery" />

      {/* Row 0: Quick Direct Folder Open Bar */}
      <section className="mb-10">
        <form
          onSubmit={loadCustomFolder}
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 shadow-xl max-w-4xl"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={folderInput}
            onChange={e => setFolderInput(e.target.value)}
            placeholder="Paste any Google Drive Folder Link or Folder ID to open immediately..."
            className="flex-1 bg-transparent border-none text-base md:text-lg text-stone-200 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoadingFolder}
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-semibold text-sm hover:bg-amber-300 transition-colors flex items-center gap-2"
          >
            {isLoadingFolder ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-950" />
            )}
            <span>Open Folder</span>
          </button>
        </form>
      </section>

      {/* Row 1: Quick Action Banner */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 0,0: Play All Slideshow */}
          <div
            id="hero-play"
            onClick={() => startSlideshow()}
            className={`col-span-2 relative cursor-pointer rounded-3xl p-8 overflow-hidden transition-all duration-300 ease-out ${
              activeFocusId === 'hero-play'
                ? 'ring-4 ring-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.4)] scale-[1.02] bg-zinc-900'
                : 'border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
            }`}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-48">
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Ambient Frame Ready</span>
              </div>

              <div>
                <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-stone-100">
                  Play All Family Memories
                </h2>
                <p className="text-zinc-400 text-base mt-2">
                  Continuous cinematic slideshow with Ken Burns transitions and Ambient clock.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 text-amber-400 font-medium text-lg">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                </div>
                <span>Press OK on Remote to Play</span>
              </div>
            </div>
          </div>

          {/* Card 0,1: TV Pairing / Settings */}
          <div
            id="hero-pair"
            onClick={() => router.push('/tv/pair')}
            className={`cursor-pointer rounded-3xl p-8 transition-all duration-300 ease-out flex flex-col justify-between ${
              activeFocusId === 'hero-pair'
                ? 'ring-4 ring-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.4)] scale-[1.02] bg-zinc-900'
                : 'border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 mb-4">
                <FolderHeart className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-2xl font-medium text-stone-100">Zero-Password Pairing</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Pair new phones or family members via 6-digit code.
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Pair Status: Active
            </div>
          </div>
        </div>
      </section>

      {/* Row 2: Google Drive Albums */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl lg:text-3xl font-light tracking-tight text-stone-200">
            Google Drive Albums
          </h2>
          <span className="text-sm font-mono text-zinc-400">
            {SAMPLE_ALBUMS.length} Collections Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_ALBUMS.map((album, idx) => (
            <TVCard
              key={album.id}
              id={`album-${album.id}`}
              row={1}
              col={idx}
              title={album.title}
              subtitle={`${album.photoCount} photographs`}
              badge={idx === 0 ? 'Recently Synced' : undefined}
              imageUrl={album.coverThumbnailUrl}
              isActiveFocus={activeFocusId === `album-${album.id}`}
              onRegister={registerNode}
              onSelect={() => startSlideshow()}
            />
          ))}
        </div>
      </section>

      {/* Footer D-Pad Helper for Couch Viewers */}
      <footer className="mt-16 pt-8 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400">
        <div>USE REMOTE ARROWS TO NAVIGATE · PRESS ENTER/OK TO PLAY</div>
        <div>DRIVEFRAME TV · NO DATABASE REQUIRED · ZERO CLOUD COST</div>
      </footer>
    </div>
  );
}

export default function TVHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] text-zinc-500 flex items-center justify-center font-mono text-lg">
          Loading DriveFrame TV...
        </div>
      }
    >
      <TVContent />
    </Suspense>
  );
}

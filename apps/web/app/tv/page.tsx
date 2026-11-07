'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Sparkles, FolderHeart, Search, Loader2, ArrowLeft } from 'lucide-react';
import { TVNavbar } from '@/components/tv/TVNavbar';
import { TVCard } from '@/components/tv/TVCard';
import { SlideshowPlayer } from '@/components/slideshow/SlideshowPlayer';
import { useSpatialNav } from '@/hooks/useSpatialNav';
import { DriveItem } from '@/lib/types';

interface AlbumFolder {
  id: string;
  folderId: string;
  title: string;
  coverThumbnailUrl?: string;
  photoCount?: number;
}

const DEFAULT_MAIN_FOLDER = '1qCPS0mAatpr5Yil7t2Zc7hcO9Lbt2ufi';

function TVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mainFolderTitle, setMainFolderTitle] = useState('Trip');
  const [albums, setAlbums] = useState<AlbumFolder[]>([]);
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);
  const [folderInput, setFolderInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentAlbumTitle, setCurrentAlbumTitle] = useState('');

  const { activeFocusId, registerNode, setFocus } = useSpatialNav('hero-play');

  // Load Main Folder & Discover All Subfolders
  const fetchMainFolder = useCallback(async (folderTarget: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(folderTarget)}`);
      const data = await res.json();

      if (data.title) {
        setMainFolderTitle(data.title);
      }

      if (data.subfolders && data.subfolders.length > 0) {
        setAlbums(data.subfolders);
      }

      // If the folder directly contains photos/videos (no subfolders)
      if (data.items && data.items.length > 0) {
        setActivePhotos(data.items);
      }
    } catch (err) {
      console.error('Failed to load Google Drive folder:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On Mount: Load user's trip folder or query folder
  useEffect(() => {
    const target = searchParams.get('folder') || DEFAULT_MAIN_FOLDER;
    setFolderInput(target);
    fetchMainFolder(target);
  }, [searchParams, fetchMainFolder]);

  // Open a specific Subfolder and play its photos & videos
  const openAlbum = async (subfolderId: string, albumTitle: string) => {
    setIsLoading(true);
    setCurrentAlbumTitle(albumTitle);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(subfolderId)}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setActivePhotos(data.items);
        setInSlideshow(true);
      }
    } catch (err) {
      console.error('Failed to load subfolder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderInput.trim()) return;
    fetchMainFolder(folderInput.trim());
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
      <TVNavbar title="DriveFrame TV" subtitle={`${mainFolderTitle} Collection`} activeSection="Albums" />

      {/* Row 0: Quick Direct Folder Search / Input Bar */}
      <section className="mb-10">
        <form
          onSubmit={handleCustomFolderSubmit}
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 shadow-xl max-w-4xl"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={folderInput}
            onChange={e => setFolderInput(e.target.value)}
            placeholder="Paste any Google Drive Folder Link or ID..."
            className="flex-1 bg-transparent border-none text-base md:text-lg text-stone-200 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-semibold text-sm hover:bg-amber-300 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-950" />
            )}
            <span>Load Folder</span>
          </button>
        </form>
      </section>

      {/* Row 1: Quick Action Banner */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 0,0: Play Slideshow */}
          <div
            id="hero-play"
            onClick={() => {
              if (albums.length > 0) {
                openAlbum(albums[0].folderId, albums[0].title);
              }
            }}
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
                <span>Live Google Drive Connected</span>
              </div>

              <div>
                <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-stone-100">
                  {mainFolderTitle} Photo & Video Library
                </h2>
                <p className="text-zinc-400 text-base mt-2">
                  {albums.length} Subfolders Discovered · Photos & Videos stream directly from Google Drive.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 text-amber-400 font-medium text-lg">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                </div>
                <span>Press OK to Play {albums[0]?.title || 'Slideshow'}</span>
              </div>
            </div>
          </div>

          {/* Card 0,1: TV Pairing */}
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

      {/* Row 2: Subfolder Albums */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl lg:text-3xl font-light tracking-tight text-stone-200">
            {mainFolderTitle} Subfolder Albums
          </h2>
          <span className="text-sm font-mono text-zinc-400">
            {albums.length} Collections Ready
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-20 text-zinc-500 font-mono text-lg">
            <Loader2 className="w-6 h-6 animate-spin mr-3 text-amber-400" />
            <span>Scanning Google Drive folder...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {albums.map((album, idx) => (
              <TVCard
                key={album.id}
                id={`album-${album.id}`}
                row={1}
                col={idx}
                title={album.title}
                subtitle="Google Drive Album"
                badge={idx === 0 ? 'Primary' : undefined}
                imageUrl={album.coverThumbnailUrl}
                isActiveFocus={activeFocusId === `album-${album.id}`}
                onRegister={registerNode}
                onSelect={() => openAlbum(album.folderId, album.title)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer D-Pad Helper */}
      <footer className="mt-16 pt-8 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400">
        <div>USE REMOTE ARROWS TO NAVIGATE · PRESS ENTER/OK TO PLAY</div>
        <div>DRIVEFRAME TV · NO DATABASE REQUIRED · DIRECT GOOGLE DRIVE</div>
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

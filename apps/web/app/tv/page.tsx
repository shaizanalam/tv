'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, Loader2 } from 'lucide-react';
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

  const [albums, setAlbums] = useState<AlbumFolder[]>([]);
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [inSlideshow, setInSlideshow] = useState(false);
  const [activePhotos, setActivePhotos] = useState<DriveItem[]>([]);
  const [folderInput, setFolderInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const { activeFocusId, registerNode } = useSpatialNav('hero-play');

  // Load Main Folder & Subfolders
  const fetchMainFolder = useCallback(async (folderTarget: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(folderTarget)}`);
      const data = await res.json();

      if (data.subfolders && data.subfolders.length > 0) {
        setAlbums(data.subfolders);
      } else if (data.items && data.items.length > 0) {
        setActivePhotos(data.items);
      }
    } catch (err) {
      console.error('Failed to load Google Drive folder:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const target = searchParams.get('folder') || DEFAULT_MAIN_FOLDER;
    setFolderInput(target);
    fetchMainFolder(target);
  }, [searchParams, fetchMainFolder]);

  // Open Album and play
  const openAlbum = async (subfolderId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/folder?folder=${encodeURIComponent(subfolderId)}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setActivePhotos(data.items);
        setInSlideshow(true);
      }
    } catch (err) {
      console.error('Failed to load album items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeAlbum = albums[selectedAlbumIndex] || albums[0];

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
    <div className="relative min-h-[100dvh] w-full bg-[#070709] text-white p-8 lg:p-14 select-none overflow-x-hidden">
      {/* Dynamic Ambient Backdrop Blur (Apple TV Top Shelf style) */}
      {activeAlbum?.coverThumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[120px] opacity-25 scale-120 transition-all duration-1000 pointer-events-none"
          style={{ backgroundImage: `url(${activeAlbum.coverThumbnailUrl})` }}
        />
      )}

      {/* Floating Header */}
      <div className="relative z-10">
        <TVNavbar title="DriveFrame" subtitle="Family Library" />
      </div>

      {/* Hero Cover Shelf */}
      <section className="relative z-10 my-6">
        <div className="relative h-[48vh] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] bg-zinc-950">
          {activeAlbum?.coverThumbnailUrl && (
            <motion.img
              key={activeAlbum.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              src={activeAlbum.coverThumbnailUrl}
              alt={activeAlbum.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Liquid Glass Bottom Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/40 to-transparent" />

          {/* Shelf Content */}
          <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">
                Featured Album
              </span>
              <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight text-white drop-shadow-lg">
                {activeAlbum?.title || 'Trip Memories'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                id="hero-play"
                onClick={() => {
                  if (activeAlbum) {
                    openAlbum(activeAlbum.folderId);
                  }
                }}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-base transition-all duration-200 outline-none ${
                  activeFocusId === 'hero-play'
                    ? 'bg-white text-black scale-105 shadow-[0_0_35px_rgba(255,255,255,0.4)]'
                    : 'bg-white/90 text-black hover:bg-white'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                <span>Play Slideshow</span>
              </button>

              <button
                onClick={() => setShowSearch(s => !s)}
                className="p-4 rounded-full bg-black/40 backdrop-blur-2xl border border-white/15 text-white hover:bg-white/10 transition-colors"
                title="Change Folder"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Search / Custom Folder Drawer */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 mb-8 max-w-2xl"
          >
            <form
              onSubmit={e => {
                e.preventDefault();
                if (folderInput.trim()) {
                  fetchMainFolder(folderInput.trim());
                  setShowSearch(false);
                }
              }}
              className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/15"
            >
              <input
                type="text"
                value={folderInput}
                onChange={e => setFolderInput(e.target.value)}
                placeholder="Paste Google Drive folder link or ID..."
                className="flex-1 bg-transparent border-none text-white px-3 focus:outline-none text-sm placeholder:text-white/40"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90"
              >
                Load
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Albums Shelf Row */}
      <section className="relative z-10 space-y-4">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Albums
        </h2>

        {isLoading && albums.length === 0 ? (
          <div className="flex items-center justify-center p-16 text-white/40 font-light">
            <Loader2 className="w-6 h-6 animate-spin mr-3 text-white" />
            <span>Loading albums...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {albums.map((album, idx) => (
              <div
                key={album.id}
                onMouseEnter={() => setSelectedAlbumIndex(idx)}
              >
                <TVCard
                  id={`album-${album.id}`}
                  row={1}
                  col={idx}
                  title={album.title}
                  imageUrl={album.coverThumbnailUrl}
                  isActiveFocus={activeFocusId === `album-${album.id}`}
                  onRegister={registerNode}
                  onSelect={() => {
                    setSelectedAlbumIndex(idx);
                    openAlbum(album.folderId);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TVHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] text-white/40 flex items-center justify-center font-light">
          Loading...
        </div>
      }
    >
      <TVContent />
    </Suspense>
  );
}

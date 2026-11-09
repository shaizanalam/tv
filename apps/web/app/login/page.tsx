'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/tv';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus password input on mount (for TV remotes and desktop)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password.trim(),
          from,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Incorrect password. Please try again.');
        setIsLoading(false);
        // Refocus input for immediate retry
        inputRef.current?.select();
        return;
      }

      // Successful server-side authentication
      // Redirect to target gallery route
      router.replace(data.redirect || from || '/tv');
      router.refresh();
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#101113] text-[#F5F5F2] flex flex-col justify-between items-center p-6 lg:p-12 relative overflow-hidden font-sans select-none">
      {/* Ambient Cinema Backdrop Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
          style={{ background: 'radial-gradient(circle, #D8C6A1 0%, rgba(216,198,161,0.05) 50%, transparent 70%)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
      </div>

      {/* Top Brand Tag */}
      <header className="relative z-10 w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#A3A6AD] uppercase">
          <span className="w-2 h-2 rounded-full bg-[#D8C6A1]" />
          <span>DriveFrame TV</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#A3A6AD]/80 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D8C6A1]" />
          <span>Encrypted Archive</span>
        </div>
      </header>

      {/* Center Entrance Card */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md my-auto flex flex-col items-center text-center"
      >
        {/* Subtle Vault Halo Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl bg-[#191B1F] border border-[#303238] flex items-center justify-center shadow-2xl relative z-10">
            <Lock className="w-7 h-7 text-[#D8C6A1] stroke-[1.75]" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-[#D8C6A1]/20 blur-xl -z-0" />
        </div>

        {/* Required Headings */}
        <h1 className="text-3xl lg:text-4xl font-serif font-light text-[#F5F5F2] tracking-tight">
          Private Memories
        </h1>
        <p className="text-sm lg:text-base text-[#A3A6AD] mt-2 max-w-xs font-light">
          A little corner of our family&apos;s memories.
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full mt-8 flex flex-col gap-4">
          <div className="relative w-full">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter family password"
              disabled={isLoading}
              autoComplete="current-password"
              className="w-full px-5 py-4 pr-12 rounded-2xl bg-[#191B1F] border border-[#303238] text-[#F5F5F2] placeholder-[#A3A6AD]/50 text-sm lg:text-base focus:outline-none focus:border-[#D8C6A1] focus:ring-2 focus:ring-[#D8C6A1]/20 transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A6AD] hover:text-[#F5F5F2] p-1 cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Friendly Error Display */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enter Gallery Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-[#D8C6A1] hover:bg-[#E4D5B5] disabled:opacity-50 disabled:cursor-not-allowed text-[#101113] font-semibold text-sm lg:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D8C6A1]/10 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#101113]" />
                <span>Verifying Vault…</span>
              </>
            ) : (
              <>
                <span>Enter Gallery</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-[11px] text-[#A3A6AD]/60 font-mono mt-5">
          TV Remote: Press OK/Enter to submit
        </p>
      </motion.main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-[#A3A6AD]/50 font-mono">
        DriveFrame · Private Google Drive Cloud Cinema
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101113] text-[#A3A6AD] flex items-center justify-center font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#D8C6A1] mr-2" />
          Loading Private Memories…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NKLogo } from './NKLogo';

export const LoadingScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading screen once per session. Navigating back or between pages should never re-trigger it.
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return !window.sessionStorage.getItem('nitesh_portfolio_has_loaded');
    }
    return false;
  });

  useEffect(() => {
    if (!isLoading) return;

    // Ultra-fast entrance on first visit only (200ms) so the portfolio feels instantaneous
    const timer = setTimeout(() => {
      setIsLoading(false);
      try {
        window.sessionStorage.setItem('nitesh_portfolio_has_loaded', 'true');
      } catch {
        // ignore
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[10] flex flex-col items-center justify-center bg-slate-950 text-white select-none pointer-events-none"
        >
          {/* Subtle ambient background glow */}
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/20 to-purple-600/15 blur-3xl pointer-events-none" />

          {/* Logo container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            <div className="relative mb-5">
              <NKLogo className="w-20 h-20 sm:w-24 sm:h-24" size={96} showGlow={true} animated={false} />
            </div>

            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Nitesh Kumar
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Full-Stack Developer
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

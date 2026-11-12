import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NKLogo } from './NKLogo';

export const LoadingScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading screen once per session. Navigating back or between pages should never re-trigger it.
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return !window.sessionStorage.getItem('nitesh_portfolio_has_loaded');
    }
    return true;
  });

  useEffect(() => {
    if (!isLoading) return;

    // Fast, elegant entrance on first visit only
    const timer = setTimeout(() => {
      setIsLoading(false);
      try {
        window.sessionStorage.setItem('nitesh_portfolio_has_loaded', 'true');
      } catch {
        // ignore
      }
    }, 650);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[10] flex flex-col items-center justify-center bg-slate-950 text-white select-none pointer-events-auto"
        >
          {/* Subtle ambient background glow */}
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/20 to-purple-600/15 blur-3xl pointer-events-none" />

          {/* Logo container with scale and pulse effect */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            <div className="relative mb-6">
              <NKLogo className="w-20 h-20 sm:w-24 sm:h-24" size={96} showGlow={true} animated={true} />
              
              {/* Outer pulsing ring */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.6, 0.1, 0.6],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-3xl border border-cyan-400/40 pointer-events-none"
              />
            </div>

            {/* Brand text */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-center"
            >
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Nitesh Kumar
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Full-Stack Developer
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              </div>
            </motion.div>

            {/* Subtle progress indicator line */}
            <div className="w-36 h-1 mt-6 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

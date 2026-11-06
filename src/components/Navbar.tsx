import { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { SITE_CONFIG, NAV_LINKS } from '../data/portfolio';
import { NKLogo } from './NKLogo';

interface NavbarProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (val: 'light' | 'dark' | 'system') => void;
  onOpenResume: () => void;
}

export const Navbar: FC<NavbarProps> = ({ theme, setTheme, onOpenResume }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = NAV_LINKS;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group whitespace-nowrap shrink-0">
          <div className="relative group-hover:scale-105 transition-transform duration-300">
            <NKLogo className="w-10 h-10" showGlow={true} animated={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                {SITE_CONFIG.name}
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded bg-gradient-to-r from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 border border-blue-500/30 text-blue-600 dark:text-cyan-400">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Full-Stack Developer
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={onOpenResume}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            Resume
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-90"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-20 left-0 right-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-8 shadow-2xl overflow-hidden"
          >
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-4 px-6 text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-900">
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenResume(); }}
                  className="w-full py-4 text-center text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-600 rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  Download Resume
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

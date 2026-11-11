import { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { NKLogo } from './NKLogo';

interface NavbarProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (val: 'light' | 'dark' | 'system') => void;
  onOpenResume: () => void;
}

export const Navbar: FC<NavbarProps> = ({ theme, setTheme, onOpenResume }) => {
  const { settings } = usePortfolio();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navLinks = NAV_LINKS;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = navLinks.map(link => link.href.replace(/^#/, '')).filter(Boolean);
    const sections = sectionIds.map(id => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.15, 0.35, 0.6] });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Brand */}
        <div className="flex items-center justify-start min-w-0">
          <a href="#" className="flex items-center gap-2 sm:gap-3 group select-none">
            <div className="relative group-hover:scale-105 transition-transform duration-300 shrink-0">
              <NKLogo className="w-8 h-8 sm:w-10 sm:h-10" showGlow={true} animated={false} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-tight truncate">
                  {settings.name}
                </span>
                <span className="inline-flex px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest rounded bg-gradient-to-r from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 border border-blue-500/30 text-blue-600 dark:text-cyan-400 shrink-0">
                  PRO
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block truncate">
                Full-Stack Developer
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center justify-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className={`text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeSection === link.href.replace(/^#/, '') ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`} aria-current={activeSection === link.href.replace(/^#/, '') ? 'location' : undefined}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Theme"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={onOpenResume}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
          >
            Resume
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-90"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="portfolio-mobile-navigation"
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
            id="portfolio-mobile-navigation"
            className="lg:hidden absolute top-16 sm:top-20 left-0 right-0 max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-5 sm:py-8 shadow-2xl overflow-y-auto overscroll-contain"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full py-3.5 px-5 text-sm font-bold uppercase tracking-widest rounded-2xl transition-all ${activeSection === link.href.replace(/^#/, '') ? 'text-indigo-600 bg-indigo-50 dark:text-cyan-300 dark:bg-slate-900' : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
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

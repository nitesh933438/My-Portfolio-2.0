import React, { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon,
  Sun,
  Monitor,
  Menu,
  X,
  User,
  GraduationCap,
  Cpu,
  Briefcase,
  Award,
  Mail,
  FileText,
  ChevronRight
} from 'lucide-react';
import { NAV_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { NKLogo } from './NKLogo';
import { useModalHistory } from '../hooks/useModalHistory';

interface NavbarProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (val: 'light' | 'dark' | 'system') => void;
  onOpenResume: () => void;
}

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  about: User,
  education: GraduationCap,
  skills: Cpu,
  projects: Briefcase,
  certifications: Award,
  contact: Mail
};

export const Navbar: FC<NavbarProps> = ({ theme, setTheme, onOpenResume }) => {
  const { settings } = usePortfolio();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const navLinks = NAV_LINKS;
  const { closeModal: closeMobileDrawer } = useModalHistory(
    mobileMenuOpen,
    'mobile-nav-drawer',
    () => setMobileMenuOpen(false)
  );

  const cycleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = navLinks.map(link => link.href.replace(/^#/, '')).filter(Boolean);
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [navLinks]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileDrawer();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen, closeMobileDrawer]);

  const scrollToSection = (href: string) => {
    const targetId = href.replace(/^#/, '');
    const wasDrawerOpen = mobileMenuOpen;
    if (wasDrawerOpen) {
      closeMobileDrawer();
    }
    const performScroll = () => {
      if (!targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const element = document.getElementById(targetId);
      if (element) {
        setActiveSection(targetId);
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    if (wasDrawerOpen) {
      window.setTimeout(performScroll, 40);
    } else {
      performScroll();
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm'
          : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => scrollToSection('#')}
          className="flex items-center gap-2 sm:gap-3 group select-none text-left min-w-0 shrink-0 cursor-pointer"
        >
          <div className="relative group-hover:scale-105 transition-transform duration-200 shrink-0">
            <NKLogo className="w-8 h-8 sm:w-10 sm:h-10" showGlow={true} animated={false} />
          </div>
          <span className="text-sm sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-none">
            {settings.name}
          </span>
        </button>

        {/* Zone 2: Interactive Animated Navigation Buttons (Tablet & Desktop) */}
        <nav
          aria-label="Primary Navigation"
          onMouseLeave={() => setHoveredSection(null)}
          className="hidden md:flex items-center gap-0.5 lg:gap-1 p-1 lg:p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-x-auto no-scrollbar max-w-full"
        >
          {navLinks.map(link => {
            const sectionId = link.href.replace(/^#/, '');
            const isActive = activeSection === sectionId;
            const isHovered = hoveredSection === sectionId;
            const Icon = SECTION_ICONS[sectionId] || Award;

            return (
              <button
                key={link.name}
                type="button"
                onClick={() => scrollToSection(link.href)}
                onMouseEnter={() => setHoveredSection(sectionId)}
                aria-current={isActive ? 'location' : undefined}
                className={`relative px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-[11px] lg:text-xs font-bold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-button"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-600 dark:to-cyan-500 shadow-md shadow-indigo-600/25"
                  />
                )}
                {!isActive && isHovered && (
                  <motion.span
                    layoutId="navbar-hover-button"
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-xs"
                  />
                )}
                <Icon
                  className={`relative z-10 w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                    isActive
                      ? 'text-white scale-105'
                      : isHovered
                      ? 'text-indigo-600 dark:text-cyan-400 scale-105'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="relative z-10">{link.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Switcher (Light / Dark / System) & Resume Action */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Segmented 3-Mode Theme Switcher on XL screens */}
          <div
            role="group"
            aria-label="Theme Mode Switcher"
            className="hidden xl:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
          >
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const active = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  title={`Switch to ${mode} mode`}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold capitalize flex items-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mode === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  {mode === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                  {mode === 'system' && <Monitor className="w-3.5 h-3.5 text-cyan-500" />}
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>

          {/* Compact Theme Cycle Button on Mobile/Tablet/Laptop (< XL) */}
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}. Click to switch mode`}
            title={`Current Mode: ${theme.toUpperCase()} (Click to switch Light / Dark / System)`}
            className="xl:hidden p-2 sm:px-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-90 cursor-pointer flex items-center gap-1.5"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Monitor className="w-4 h-4 text-cyan-500" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold capitalize">{theme}</span>
          </button>

          <button
            type="button"
            onClick={onOpenResume}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={() => (mobileMenuOpen ? closeMobileDrawer() : setMobileMenuOpen(true))}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:scale-90 cursor-pointer"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="portfolio-mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.16 }}
            id="portfolio-mobile-navigation"
            className="md:hidden absolute top-16 sm:top-20 left-0 right-0 max-h-[calc(100dvh-4rem)] bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-5 shadow-2xl overflow-y-auto overscroll-contain z-50"
          >
            <nav className="grid grid-cols-2 gap-2.5" aria-label="Mobile Navigation">
              {navLinks.map(link => {
                const sectionId = link.href.replace(/^#/, '');
                const isActive = activeSection === sectionId;
                const Icon = SECTION_ICONS[sectionId] || Award;
                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => scrollToSection(link.href)}
                    className={`w-full py-3.5 px-3.5 text-xs font-bold rounded-2xl border transition-all flex items-center justify-between gap-2 active:scale-95 cursor-pointer ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-indigo-600 to-cyan-600 border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{link.name}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </button>
                );
              })}
            </nav>

            {/* Theme Mode Selector in Mobile Drawer */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                Appearance Mode (Light / Dark / System)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 capitalize transition-all cursor-pointer ${
                      theme === mode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {mode === 'light' && <Sun className="w-3.5 h-3.5" />}
                    {mode === 'dark' && <Moon className="w-3.5 h-3.5" />}
                    {mode === 'system' && <Monitor className="w-3.5 h-3.5" />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  closeMobileDrawer({ skipHistoryBack: true });
                  window.setTimeout(() => onOpenResume(), 30);
                }}
                className="w-full py-3.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View Official Resume / CV</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

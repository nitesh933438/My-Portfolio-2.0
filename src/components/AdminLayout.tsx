import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Award, 
  GraduationCap, 
  MessageSquare, 
  Settings, 
  Sparkles, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Monitor,
  ExternalLink, 
  RefreshCw,
  ChevronLeft,
  Wrench,
  Briefcase
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/academicFirebase';
import { AdminToastProvider } from './admin/AdminToastContext';
import { AIScanner } from './admin/AIScanner';
import { NKLogo } from './NKLogo';

interface AdminLayoutProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ theme, setTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const mobileTabsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    // Keep active mobile tab pill centered in horizontal strip
    if (mobileTabsRef.current) {
      const activeEl = mobileTabsRef.current.querySelector('[aria-current="page"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('keydown', onEscape);
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
    { path: '/admin/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/admin/certificates', icon: Award, label: 'Certificates' },
    { path: '/admin/education', icon: GraduationCap, label: 'Education' },
    { path: '/admin/skills', icon: Wrench, label: 'Skills' },
    { path: '/admin/experience', icon: Briefcase, label: 'Experience' },
    { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/ai', icon: Sparkles, label: 'AI Assistant' },
  ];

  const activeNavItem = navItems.find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  ) || navItems[0];

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 select-none">
      {/* Top Brand Header (Fixed inside Sidebar) */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0 min-h-16">
        {(sidebarOpen || isMobile) && (
          <div className="flex items-center gap-2.5 min-w-0">
            <NKLogo className="w-8 h-8 shrink-0" size={32} showGlow={true} />
            <div className="min-w-0">
              <span className="font-black text-slate-900 dark:text-white tracking-tight block truncate text-sm">
                Portfolio CMS
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                Admin Console
              </span>
            </div>
          </div>
        )}
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto cursor-pointer"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Independent Scrollable Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overscroll-contain custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            onClick={() => setMobileMenuOpen(false)}
            title={!sidebarOpen && !isMobile ? item.label : undefined}
            className={({ isActive }) => `
              flex items-center ${!sidebarOpen && !isMobile ? 'justify-center' : ''} gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all
              ${isActive 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {(sidebarOpen || isMobile) && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Theme Mode Selector inside Sidebar when expanded or mobile */}
      {(sidebarOpen || isMobile) && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
            Display Theme
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold capitalize flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                  theme === mode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                {mode === 'light' && <Sun size={11} />}
                {mode === 'dark' && <Moon size={11} />}
                {mode === 'system' && <Monitor size={11} />}
                <span>{mode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sign Out & Portfolio Link (Fixed inside Sidebar) */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 shrink-0">
        {isMobile && (
          <a
            href="#/"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>View Public Portfolio</span>
          </a>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          title={!sidebarOpen && !isMobile ? 'Sign Out' : undefined}
          className={`w-full flex items-center ${!sidebarOpen && !isMobile ? 'justify-center' : ''} gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(sidebarOpen || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <AdminToastProvider>
      <div className="h-dvh w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden">
        {/* Desktop Sidebar: Fixed full viewport height with its own internal scroll */}
        <aside
          className={`hidden lg:flex flex-col h-full shrink-0 transition-all duration-200 overflow-hidden z-20 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <SidebarContent isMobile={false} />
        </aside>

        {/* Mobile & Tablet Sidebar Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl overflow-hidden"
              >
                <SidebarContent isMobile={true} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Right Side Column: Fixed Header + Independently Scrollable Main Viewport */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="shrink-0 min-h-14 sm:min-h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-6 py-2 flex items-center justify-between gap-2 z-30">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
                aria-label="Open sidebar navigation"
              >
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {activeNavItem.label}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:block truncate">
                  Real-Time Portfolio CMS • {theme.toUpperCase()} Mode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href="#/"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                title="Open Public Portfolio"
              >
                <ExternalLink size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden md:inline">Portfolio</span>
              </a>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
                title="Universal AI Scanner & Auto-Fill"
              >
                <Sparkles size={14} className="shrink-0" />
                <span className="hidden xs:inline sm:inline">AI Scan</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw size={15} />
              </button>

              {/* Segmented 3-Mode Theme Switcher on Tablet/Desktop (md+) */}
              <div
                role="group"
                aria-label="Admin Theme Switcher"
                className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80"
              >
                {(['light', 'dark', 'system'] as const).map((mode) => {
                  const active = theme === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTheme(mode)}
                      title={`Switch to ${mode} mode`}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize flex items-center gap-1 transition-all cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-2xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mode === 'light' && <Sun size={12} className="text-amber-500" />}
                      {mode === 'dark' && <Moon size={12} className="text-indigo-400" />}
                      {mode === 'system' && <Monitor size={12} className="text-cyan-500" />}
                      <span className="hidden xl:inline">{mode}</span>
                    </button>
                  );
                })}
              </div>

              {/* Compact Cycle Theme Button on Mobile (< md) */}
              <button
                type="button"
                onClick={cycleTheme}
                className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                title={`Theme Mode: ${theme.toUpperCase()} (Tap to switch Light / Dark / System)`}
              >
                {theme === 'dark' ? (
                  <Moon size={15} className="text-indigo-400" />
                ) : theme === 'light' ? (
                  <Sun size={15} className="text-amber-500" />
                ) : (
                  <Monitor size={15} className="text-cyan-500" />
                )}
              </button>
            </div>
          </header>

          {/* Mobile & Tablet Quick Navigation Strip (Scrolls horizontally, stays fixed above main content) */}
          <div
            ref={mobileTabsRef}
            className="lg:hidden shrink-0 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap shrink-0 transition-all
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Independently Scrollable Right Content Area */}
          <main
            ref={mainScrollRef}
            className="flex-1 p-3 sm:p-5 lg:p-7 xl:p-8 overflow-y-auto overflow-x-hidden overscroll-contain min-w-0 custom-scrollbar"
          >
            <div className="w-full max-w-[1600px] mx-auto pb-12">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Universal AI Scanner Modal */}
        <AIScanner 
          isOpen={isScannerOpen} 
          onClose={() => setIsScannerOpen(false)} 
        />
      </div>
    </AdminToastProvider>
  );
};

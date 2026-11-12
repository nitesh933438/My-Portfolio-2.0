import React, { useState, useEffect } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
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
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all
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
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(sidebarOpen || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-x-hidden">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block transition-all duration-300 shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="sticky top-0 h-screen">
            <SidebarContent isMobile={false} />
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <aside className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
              <SidebarContent isMobile={true} />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="min-h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sticky top-0 z-30">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
                aria-label="Open sidebar navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {activeNavItem.label}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:block">
                  Real-Time Portfolio CMS • {theme.toUpperCase()} Mode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <a
                href="#/"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Open Public Portfolio"
              >
                <ExternalLink size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden md:inline">View Portfolio</span>
              </a>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer"
                title="Universal AI Scanner & Auto-Fill"
              >
                <Sparkles size={14} className="shrink-0" />
                <span className="hidden sm:inline">AI Scan</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw size={16} />
              </button>

              <button
                type="button"
                onClick={cycleTheme}
                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title={`Theme Mode: ${theme.toUpperCase()} (Click to cycle Light / Dark / System)`}
              >
                {theme === 'dark' ? (
                  <Moon size={16} className="text-indigo-400" />
                ) : theme === 'light' ? (
                  <Sun size={16} className="text-amber-500" />
                ) : (
                  <Monitor size={16} className="text-cyan-500" />
                )}
                <span className="hidden xl:inline capitalize">{theme}</span>
              </button>
            </div>
          </header>

          {/* Main Area */}
          <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  filter: 'blur(0px)',
                  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } 
                }}
                exit={{ 
                  opacity: 0, 
                  y: -6, 
                  filter: 'blur(2px)',
                  transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } 
                }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
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

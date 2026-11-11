import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Award, Menu, X, BookOpen, Briefcase, Mail, Sun, Moon, Monitor, RefreshCw, LogOut, ShieldCheck, ChevronLeft, ChevronRight, User, Sparkles, GraduationCap } from 'lucide-react';
import { auth } from '../services/academicFirebase';
import { AdminToastProvider } from './admin/AdminToastContext';
import { AIScanner } from './admin/AIScanner';

interface AdminLayoutProps {
  theme?: string;
  setTheme?: (theme: any) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ theme = 'dark', setTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem('portfolio_admin_sidebar_collapsed') !== 'true'; } catch { return true; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const location = useLocation();

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

  const navSections = [
    {
      title: 'Overview',
      items: [{ path: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
      title: 'Portfolio',
      items: [
        { path: '/admin/settings', label: 'Profile', icon: User },
        { path: '/admin/projects', label: 'Projects', icon: Briefcase },
        { path: '/admin/certificates', label: 'Certificates', icon: Award },
        { path: '/admin/education', label: 'Education', icon: BookOpen },
        { path: '/admin/experience', label: 'Experience', icon: Briefcase },
        { path: '/admin/skills', label: 'Skills', icon: GraduationCap },
      ]
    },
    {
      title: 'Content',
      items: [{ path: '/admin/messages', label: 'Messages', icon: Mail }]
    },
    {
      title: 'AI Tools',
      items: [{ path: '/admin/ai', label: 'AI Assistant', icon: Sparkles }]
    }
  ];

  const toggleSidebar = () => setSidebarOpen((current) => {
    const next = !current;
    try { localStorage.setItem('portfolio_admin_sidebar_collapsed', String(!next)); } catch {}
    return next;
  });

  const handleRefresh = () => window.location.reload();

  const toggleTheme = () => {
    if (setTheme) setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
    else document.documentElement.classList.toggle('dark');
  };

  return (
    <AdminToastProvider>
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex relative overflow-x-hidden">
        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)} 
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:sticky inset-y-0 left-0 z-40 ${mobileMenuOpen ? 'w-72 translate-x-0' : sidebarOpen ? 'w-72' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 h-screen top-0`}>
          <div className="p-6 flex items-center justify-between">
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
                <span className="font-black text-slate-900 dark:text-white">Admin CMS</span>
              </div>
            )}
            <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:block">
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <X size={18} />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-4 space-y-6">
            {navSections.map(section => (
              <div key={section.title}>
                {(sidebarOpen || mobileMenuOpen) && <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{section.title}</h4>}
                <div className="space-y-1">
                  {section.items.map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link 
                        key={item.path} 
                        to={item.path} 
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                        <item.icon size={20} />
                        {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen h-[100dvh]">
          <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} aria-label="Open admin navigation" aria-expanded={mobileMenuOpen} className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={18} /></button>
              <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop()?.toUpperCase()}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button onClick={() => setScannerOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700" title="Open Universal AI Scanner"><Sparkles size={16} /><span className="hidden sm:inline">AI Scan</span></button>
              <button onClick={handleRefresh} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={18} /></button>
              <button onClick={toggleTheme} title={`Theme: ${theme}. Click to change.`} aria-label={`Current theme ${theme}; click to cycle theme`} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun size={18} /> : theme === 'light' ? <Moon size={18} /> : <Monitor size={18} />}</button>
              <button onClick={() => signOut(auth)} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">Sign Out</button>
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <AIScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </AdminToastProvider>
  );
};

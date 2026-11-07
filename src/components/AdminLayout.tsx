import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, Award, FileText, Settings, Menu, X, ArrowLeft,
  BookOpen, Users, Briefcase, Mail, Sun, Moon, RefreshCw, LogOut, ShieldCheck,
  ChevronLeft, ChevronRight, User, Image as ImageIcon, Sparkles, Database, LayoutGrid
} from 'lucide-react';
import { auth } from '../services/academicFirebase';
import { AdminToastProvider } from './admin/AdminToastContext';

interface AdminLayoutProps {
  theme?: string;
  setTheme?: (theme: any) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ theme = 'dark', setTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const location = useLocation();

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

  const handleRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
    window.location.reload();
  };

  const toggleTheme = () => {
    if (setTheme) setTheme(theme === 'dark' ? 'light' : 'dark');
    else document.documentElement.classList.toggle('dark');
  };

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky inset-y-0 left-0 z-40 ${sidebarOpen ? 'w-72' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 h-screen top-0`}>
          <div className="p-6 flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
                <span className="font-black text-slate-900 dark:text-white">Admin CMS</span>
              </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hidden lg:block">
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-4 space-y-6">
            {/* ... navigation remains same ... */}
            {navSections.map(section => (
              <div key={section.title}>
                {sidebarOpen && <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{section.title}</h4>}
                <div className="space-y-1">
                  {section.items.map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <item.icon size={20} />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={18} /></button>
              <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                {location.pathname === '/admin' ? 'Dashboard' : location.pathname.split('/').pop()?.toUpperCase()}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleRefresh} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={18} /></button>
              <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
              <button onClick={() => signOut(auth)} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold">Sign Out</button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
};

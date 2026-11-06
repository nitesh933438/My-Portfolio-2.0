import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, Award, FileText, Settings, Menu, X, ArrowLeft,
  BookOpen, Users, Briefcase, Mail, Sun, Moon, RefreshCw, LogOut, ShieldCheck
} from 'lucide-react';
import { auth } from '../services/academicFirebase';
import { AdminToastProvider } from './admin/AdminToastContext';

interface AdminLayoutProps {
  theme?: string;
  setTheme?: (theme: any) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ theme = 'dark', setTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/certificates', label: 'Certificates', icon: Award },
    { path: '/admin/education', label: 'Education', icon: BookOpen },
    { path: '/admin/projects', label: 'Projects', icon: Briefcase },
    { path: '/admin/messages', label: 'Messages', icon: Mail },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
    window.location.reload();
  };

  const toggleTheme = () => {
    if (setTheme) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    } else {
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
        localStorage.setItem('nitesh_portfolio_theme', 'light');
      } else {
        root.classList.add('dark');
        localStorage.setItem('nitesh_portfolio_theme', 'dark');
      }
    }
  };

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-300">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)} 
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Admin CMS</h1>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Secured Session</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1.5 pt-4">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                      active 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px]">
              <span className="text-slate-400 block font-medium">Logged in as</span>
              <strong className="text-slate-800 dark:text-slate-200 truncate block mt-0.5">{auth.currentUser?.email || 'nitesh933438@gmail.com'}</strong>
            </div>
            <Link 
              to="/" 
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Live Portfolio
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                  {location.pathname === '/admin' ? 'Dashboard Overview' : location.pathname.split('/').pop()}
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">Last synced at {lastRefreshed}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                title="Refresh Data"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
              </button>

              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
};

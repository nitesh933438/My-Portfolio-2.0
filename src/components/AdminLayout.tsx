import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Award, FileText, Settings, Menu, X, ArrowLeft,
  BookOpen, Users, Briefcase, Mail
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/certificates', label: 'Certificates', icon: Award },
    { path: '/admin/education', label: 'Education', icon: BookOpen },
    { path: '/admin/projects', label: 'Projects', icon: Briefcase },
    { path: '/admin/messages', label: 'Messages', icon: Mail },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <span className="text-sm font-black">Admin Panel</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden"><X /></button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 mt-8">
            <ArrowLeft className="w-5 h-5" /> Back to Portfolio
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <button className="lg:hidden p-2 mb-4" onClick={() => setSidebarOpen(true)}><Menu /></button>
        <Outlet />
      </main>
    </div>
  );
};

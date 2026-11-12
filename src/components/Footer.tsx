import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, Github, Linkedin, MessageSquare, FileText } from 'lucide-react';
import { SOCIAL_LINKS, NAV_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { NKLogo } from './NKLogo';

interface FooterProps {
  onOpenResume?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenResume }) => {
  const { settings } = usePortfolio();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin Hotkey: Ctrl+Shift+Z or Cmd+Shift+Z (also supports Ctrl+Shift+A)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        window.location.href = '#/admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const whatsappLink = SOCIAL_LINKS.find(s => s.platform === 'WhatsApp');
  const whatsappUrl = `https://wa.me/${settings.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(settings.whatsappPrefilledMessage || "Hello Nitesh! I visited your portfolio and I'm interested in discussing a project with you.")}`;


  return (
    <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 items-start pb-12 border-b border-slate-200 dark:border-slate-800"
        >
          
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <NKLogo className="w-10 h-10" showGlow={true} />
              <div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight block leading-none">{settings.name}</span>
                <span className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold uppercase tracking-widest mt-1 block">Full-Stack Developer</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              {settings.title}. Pursuing B.Tech CSE at Arka Jain University. Building robust, scalable, and intelligent digital solutions with a focus on impact.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Navigation</h4>
              <nav className="flex flex-col space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {NAV_LINKS.map(link => (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => {
                      const id = link.href.replace(/^#/, '');
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-left hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {link.name}
                  </button>
                ))}
                {onOpenResume && (
                  <button 
                    onClick={onOpenResume} 
                    className="text-left hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Resume / CV</span>
                  </button>
                )}
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Connect</h4>
              <nav className="flex flex-col space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {SOCIAL_LINKS.map(link => (
                  <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-white transition-colors">{link.platform}</a>
                ))}
              </nav>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Location</h4>
              <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {settings.location}<br />
                Bihar, India
              </div>
            </div>
          </div>

        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center sm:text-left flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span>© {new Date().getFullYear()} {settings.name}. Built with React & Tailwind CSS.</span>
            <a
              href="#/admin"
              tabIndex={-1}
              className="text-slate-300 dark:text-slate-800 hover:text-indigo-500 dark:hover:text-cyan-400 transition-colors p-1"
              title="Admin Portal (Access restricted to authorized administrator)"
              aria-label="Admin Portal"
            >
              •
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Back to Top</span>
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ArrowUp className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

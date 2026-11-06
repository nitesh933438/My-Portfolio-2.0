import React from 'react';
import { motion } from 'motion/react';
import { ArrowUp, Github, Linkedin, MessageSquare } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS, NAV_LINKS } from '../data/portfolio';
import { NKLogo } from './NKLogo';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappLink = SOCIAL_LINKS.find(s => s.platform === 'WhatsApp');
  const whatsappUrl = whatsappLink?.url || `https://wa.me/${SITE_CONFIG.whatsappNumberDigits}`;

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
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight block leading-none">{SITE_CONFIG.name}</span>
                <span className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold uppercase tracking-widest mt-1 block">Full-Stack Developer</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              {SITE_CONFIG.title}. Pursuing B.Tech CSE at Arka Jain University. Building robust, scalable, and intelligent digital solutions with a focus on impact.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Navigation</h4>
              <nav className="flex flex-col space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                {NAV_LINKS.map(link => (
                  <a key={link.name} href={link.href} className="hover:text-indigo-600 dark:hover:text-white transition-colors">{link.name}</a>
                ))}
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
                {SITE_CONFIG.location}<br />
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} {SITE_CONFIG.name}. Built with React & Tailwind CSS.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all active:scale-95 shadow-sm"
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

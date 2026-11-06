import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, MessageSquare, ArrowRight, Download, Code, Sparkles, MapPin, GraduationCap } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/portfolio';

interface HeroProps {
  onOpenResume: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenResume }) => {
  const whatsappLink = SOCIAL_LINKS.find(s => s.platform === 'WhatsApp');
  const githubLink = SOCIAL_LINKS.find(s => s.platform === 'GitHub');
  const linkedinLink = SOCIAL_LINKS.find(s => s.platform === 'LinkedIn');
  
  const whatsappUrl = whatsappLink?.url || `https://wa.me/${SITE_CONFIG.whatsappNumberDigits}`;

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Typographic Hierarchy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack MERN & AI Developer</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Hi, I'm <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{SITE_CONFIG.name}</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed text-wrap-balance">
              {SITE_CONFIG.title}. Pursuing B.Tech CSE at <span className="text-slate-900 dark:text-white font-semibold">Arka Jain University</span>. Crafting high-performance web applications, intelligent bots, and enterprise platforms.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{SITE_CONFIG.location}</span>
              </div>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Arka Jain University</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <span>Explore Projects</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={onOpenResume}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>View / Download Resume</span>
              </button>
            </div>

            {/* Social Links Row */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={githubLink?.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
              >
                <Github className="w-5 h-5" />
              </a>

              <a
                href={linkedinLink?.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
              >
                <Linkedin className="w-5 h-5" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Chat"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-all shadow-sm active:scale-90"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>

          </motion.div>

          {/* Right Column: Profile Photo / Visual Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl rotate-3 opacity-20 blur-xl" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900">
                <img
                  src={SITE_CONFIG.profilePhoto}
                  alt={SITE_CONFIG.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">8+ Projects</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Full-Stack & AI</div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Full-width KPI / Highlights Strip below split */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center"
        >
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">B.Tech CSE</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Education</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">8+</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Projects</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">MERN</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Core Stack</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">100%</div>
            <div className="text-[10px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Responsive</div>
          </div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Scroll</span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 flex justify-center p-1"
          >
            <div className="w-1 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, MessageSquare, ArrowRight, Download, Code, Sparkles, MapPin, GraduationCap } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { resolveAssetUrl } from '../services/supabaseStorage';

interface HeroProps {
  onOpenResume: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenResume }) => {
  const { settings, university, projects, certificates } = usePortfolio();
  const githubUrl = settings.github || SOCIAL_LINKS.find(s => s.platform === 'GitHub')?.url || '#';
  const linkedinUrl = settings.linkedin || SOCIAL_LINKS.find(s => s.platform === 'LinkedIn')?.url || '#';
  const whatsappDigits = (settings.whatsapp || '').replace(/[^0-9]/g, '') || '919334387983';
  
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(settings.whatsappPrefilledMessage || "Hello Nitesh! I visited your portfolio and I'm interested in discussing a project with you.")}`;


  return (
    <section className="relative pt-[var(--section-py)] pb-[calc(var(--section-py)/2)] overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Typographic Hierarchy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left"
          >
            
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[11px] sm:text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack MERN & AI Developer</span>
            </div>

            <h1 className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] sm:leading-[1.1]" style={{ fontSize: 'var(--text-5xl)' }}>
              Hi, I'm <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{settings.name}</span>
            </h1>

            <p className="text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed text-wrap-balance">
              {settings.title}. Pursuing {university.degree} in {university.branch} at <span className="text-slate-900 dark:text-white font-semibold">{university.institution}</span>. Crafting high-performance web applications, intelligent bots, and enterprise platforms.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{settings.location}</span>
              </div>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{university.institution}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2 sm:pt-4 w-full sm:w-auto max-w-xl mx-auto lg:mx-0">
              <button
                type="button"
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 whitespace-nowrap min-h-[44px] cursor-pointer"
              >
                <span>Explore Projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => document.getElementById('certifications')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-cyan-300 font-semibold text-xs sm:text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 whitespace-nowrap shadow-xs min-h-[44px] cursor-pointer"
              >
                <span>{certificates.length}+ Certifications</span>
              </button>

              <button
                type="button"
                onClick={onOpenResume}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 whitespace-nowrap shadow-sm min-h-[44px] cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Resume</span>
              </button>
            </div>

            {/* Social Links Row */}
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 sm:pt-2">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
                className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
              >
                <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Chat"
                className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-all shadow-sm active:scale-90"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>

          </motion.div>

          {/* Right Column: Profile Photo / Visual Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center order-first lg:order-last"
          >
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl rotate-3 opacity-20 blur-xl" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
                <img
                  src={resolveAssetUrl(settings.profilePhoto, 'profile')}
                  alt={settings.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = '1';
                      img.src = './assets/aistudio/Any_Profile_Photo_0559445a.png';
                    } else {
                      img.style.display = 'none';
                    }
                  }}
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 md:-bottom-4 md:-right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-3.5 shadow-xl flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-900 dark:text-white">{projects.length}+ Projects</div>
                  <div className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">Full-Stack & AI</div>
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
          className="mt-10 sm:mt-16 pt-6 sm:pt-10 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 text-center"
        >
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">{university.degree}</div>
            <div className="text-[9px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider font-semibold">Education</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">{projects.length}+</div>
            <div className="text-[9px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider font-semibold">Projects</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">MERN</div>
            <div className="text-[9px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider font-semibold">Core Stack</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">100%</div>
            <div className="text-[9px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 uppercase tracking-wider font-semibold">Responsive</div>
          </div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8 hidden md:flex flex-col items-center gap-2"
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

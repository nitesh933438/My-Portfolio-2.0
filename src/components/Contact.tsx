import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Github, Linkedin, Instagram, Copy, Check, Send } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS, EDUCATION_DATA } from '../data/portfolio';
import { ScrollReveal } from './ScrollReveal';

export const Contact: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SITE_CONFIG.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const whatsappLink = SOCIAL_LINKS.find(s => s.platform === 'WhatsApp');
  const githubLink = SOCIAL_LINKS.find(s => s.platform === 'GitHub');
  const linkedinLink = SOCIAL_LINKS.find(s => s.platform === 'LinkedIn');
  const instagramLink = SOCIAL_LINKS.find(s => s.platform === 'Instagram');

  const whatsappUrl = whatsappLink?.url || `https://wa.me/${SITE_CONFIG.whatsappNumberDigits}`;

  return (
    <section id="contact" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Get in Touch</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Let's Connect & Build Together</h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 text-wrap-balance">
              Have a project, collaboration opportunity, or question? Reach out directly via email or WhatsApp.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Direct Contact Cards */}
          <div className="lg:col-span-1">
            <ScrollReveal direction="right" delay={0.2}>
              <div className="space-y-6">
                
                {/* Email Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Me</div>
                      <a href={`mailto:${SITE_CONFIG.email}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:underline truncate block">
                        {SITE_CONFIG.email}
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyEmail}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold active:scale-95 shrink-0"
                    title="Copy Email"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* WhatsApp Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">WhatsApp Chat</div>
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {SITE_CONFIG.whatsapp}
                      </span>
                    </div>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center gap-2 active:scale-95 shrink-0"
                  >
                    <span>Chat Now</span>
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Social Links Grid */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Social Profiles</div>
                  <div className="flex items-center gap-4">
                    <a
                      href={githubLink?.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
                      title="GitHub"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href={linkedinLink?.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href={instagramLink?.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-pink-600 hover:border-pink-300 transition-all shadow-sm active:scale-90"
                      title="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Quick Info Box */}
          <div className="lg:col-span-1">
            <ScrollReveal direction="left" delay={0.4}>
              <div className="h-full p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white shadow-2xl flex flex-col justify-between space-y-10">
                <div className="space-y-6">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                    Available for Opportunities
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-extrabold leading-tight">Let's build something exceptional together.</h4>
                  <p className="text-slate-300 text-base leading-relaxed">
                    Whether you are looking for a skilled MERN stack developer, collaboration on an AI project, or technical consultation, my inbox is always open.
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10 text-xs font-medium text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider">Location</span>
                    <span className="font-bold text-white text-right">{SITE_CONFIG.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider">Education</span>
                    <span className="font-bold text-white text-right">{EDUCATION_DATA[0].college}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider">Response Time</span>
                    <span className="font-bold text-white">Within 24 Hours</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};

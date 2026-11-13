import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MessageSquare, Github, Linkedin, Instagram, Copy, Check, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/academicFirebase';
import { SOCIAL_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';

import { ScrollReveal } from './ScrollReveal';

export const Contact: React.FC = () => {
  const { settings } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(settings.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = settings.email;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
          return;
        }
      } catch {
        // Fallback also unavailable
      }
      setSubmitStatus({ type: 'error', message: 'Clipboard access is unavailable. Please copy the email address manually.' });
    }
  };

  const githubUrl = settings.github || SOCIAL_LINKS.find(s => s.platform === 'GitHub')?.url || '';
  const linkedinUrl = settings.linkedin || SOCIAL_LINKS.find(s => s.platform === 'LinkedIn')?.url || '';
  const instagramUrl = settings.instagram || SOCIAL_LINKS.find(s => s.platform === 'Instagram')?.url || '';
  const githubLink = githubUrl ? { url: githubUrl } : null;
  const linkedinLink = linkedinUrl ? { url: linkedinUrl } : null;
  const instagramLink = instagramUrl ? { url: instagramUrl } : null;

  // Use encoded prefilled message for WhatsApp
  const whatsappDigits = (settings.whatsapp || '').replace(/[^0-9]/g, '') || '919334387983';
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(settings.whatsappPrefilledMessage || "Hello Nitesh! I visited your portfolio and I'm interested in discussing a project with you.")}`;

  // Use encoded prefilled subject and body for Email
  const emailUrl = `mailto:${settings.email}?subject=${encodeURIComponent(settings.emailPrefilledSubject || "Project Inquiry – Portfolio Contact")}&body=${encodeURIComponent(settings.emailPrefilledBody || "Hello Nitesh,\n\nI visited your portfolio and I'm interested in discussing a project with you.\n\nBest regards,")}`;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setSending(true);
    setSubmitStatus(null);

    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || 'General Inquiry',
        message: form.message.trim(),
        createdAt: new Date().toISOString(),
        read: false,
      });

      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Your message has been sent successfully. I will respond within 24 hours.',
      });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setSubmitStatus({
        type: 'error',
        message: 'Could not send message. Please try again or reach out directly via email or WhatsApp.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-[var(--section-py)] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Get in Touch</h2>
            <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: 'var(--text-4xl)' }}>Let's Connect & Build Together</h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 text-wrap-balance">
              Have a project, collaboration opportunity, or inquiry? Send a message directly or connect via email and WhatsApp.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl mx-auto items-start">
          
          {/* Direct Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal direction="right" delay={0.2}>
              <div className="space-y-5">
                
                {/* Email Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-500/50 transition-all duration-300">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Me</div>
                      <a href={emailUrl} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:underline truncate block">
                        {settings.email}
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyEmail}
                    className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold active:scale-95 shrink-0"
                    title="Copy Email"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* WhatsApp Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-emerald-500/50 transition-all duration-300">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">WhatsApp Chat</div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                        {settings.whatsapp}
                      </span>
                    </div>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center gap-1.5 active:scale-95 shrink-0"
                  >
                    <span className="text-[11px]">Chat</span>
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Social Links Grid */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Social Profiles</div>
                  <div className="flex items-center gap-3">
                    {githubLink?.url && <a
                      href={githubLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
                      title="GitHub"
                    >
                      <Github className="w-5 h-5" />
                    </a>}
                    {linkedinLink?.url && <a
                      href={linkedinLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm active:scale-90"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>}
                    {instagramLink?.url && <a
                      href={instagramLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-pink-600 hover:border-pink-300 transition-all shadow-sm active:scale-90"
                      title="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>}
                  </div>
                </div>

                {/* Quick Availability Badge */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-transparent dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-950 border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Quick Response Guaranteed</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Available for full-stack engineering roles, internships, and freelance projects. Inquiries are responded to within 24 hours.
                  </p>
                </div>

              </div>
            </ScrollReveal>
          </div>

          {/* Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="left" delay={0.3}>
              <form 
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
              >
                <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">Send a Direct Message</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fill out this quick form and I will get back to you promptly.</p>
                </div>

                {submitStatus && (
                  <div className={`p-4 rounded-2xl flex items-start gap-2.5 text-xs font-bold ${
                    submitStatus.type === 'success' 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {submitStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{submitStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Alex Johnson"
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      maxLength={150}
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. alex@example.com"
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Subject</label>
                  <input
                    type="text"
                    maxLength={200}
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Full-Stack Project Inquiry"
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Message *</label>
                  <textarea
                    rows={4}
                    required
                    maxLength={5000}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell me about your project, timeline, or question..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};

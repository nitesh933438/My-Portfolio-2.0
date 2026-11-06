import { FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, CheckCircle, ExternalLink, Printer } from 'lucide-react';
import { SITE_CONFIG, SOCIAL_LINKS } from '../data/portfolio';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-950/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">Curriculum Vitae</h3>
                  <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 truncate">{SITE_CONFIG.name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">Official Document</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="p-2 sm:p-3 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                  title="Print Resume"
                >
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Resume Content Container */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* Sidebar Info */}
              <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-950 p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 space-y-8 overflow-y-auto">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3" />
                    Verified Document
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Professional Summary</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Full-stack MERN developer specialized in building scalable web solutions and AI integrations.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Quick Links</h4>
                  <div className="space-y-3">
                    <a href={SOCIAL_LINKS.find(s => s.platform === 'LinkedIn')?.url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group hover:border-indigo-500 transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">LinkedIn</span>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                    </a>
                    <a href={SOCIAL_LINKS.find(s => s.platform === 'GitHub')?.url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group hover:border-indigo-500 transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">GitHub</span>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                    </a>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-medium">Last Updated: Nov 2024</p>
                </div>
              </div>

              {/* PDF Preview Area */}
              <div className="flex-1 bg-slate-200 dark:bg-slate-800 relative group min-h-[400px] flex items-center justify-center">
                <div className="hidden sm:block w-full h-full">
                  <iframe
                    src={`${SITE_CONFIG.resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-none"
                    title="Resume Preview"
                  />
                </div>
                
                {/* Mobile Preview Placeholder */}
                <div className="sm:hidden flex flex-col items-center gap-6 p-10 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-lg font-bold text-slate-900 dark:text-white">PDF Preview</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">PDF preview is optimized for larger screens. Tap below to view or download the full document.</p>
                  </div>
                  <a
                    href={SITE_CONFIG.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open PDF Fullscreen
                  </a>
                </div>
                
                {/* PDF Toolbar Overlay (Desktop only) */}
                <div className="hidden sm:flex absolute top-4 right-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={SITE_CONFIG.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 shadow-xl text-slate-900 dark:text-white hover:text-indigo-600 transition-all"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Sticky Actions */}
            <div className="px-4 sm:px-8 py-3.5 sm:py-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">File Type</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">PDF Document</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-800 sm:border-transparent text-center"
                >
                  Close
                </button>
                <a
                  href={SITE_CONFIG.resumeUrl}
                  download="Nitesh_Kumar_Resume.pdf"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider sm:tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-center"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Download CV</span>
                </a>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

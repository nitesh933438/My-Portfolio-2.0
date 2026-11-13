import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getProjectMetrics, getCertificateMetrics } from '../utils/portfolioMetrics';
import { 
  X, 
  Download, 
  Printer, 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Linkedin, 
  ExternalLink, 
  Award, 
  BookOpen, 
  Code2, 
  Briefcase, 
  Copy, 
  Check, 
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Eye,
  Loader2
} from 'lucide-react';
import { SOCIAL_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { useResolvedResume } from '../utils/resumeAsset';
import { useModalHistory } from '../hooks/useModalHistory';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  const { settings, university, schooling, projects, certificates, skills, experience } = usePortfolio();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'document' | 'interactive'>('document');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printing, setPrinting] = useState(false);
  const atsResumeRef = useRef<HTMLDivElement>(null);
  const resumeImgRef = useRef<HTMLImageElement>(null);

  const { closeModal } = useModalHistory(isOpen, 'resume-modal', onClose);

  const {
    pdfUrl: officialPdfUrl,
    fallbackPdfUrl,
    resumeImageUrl: officialResumePageImg,
  } = useResolvedResume(settings.resumeUrl);

  useEffect(() => {
    setImageError(false);
    if (resumeImgRef.current?.complete && resumeImgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [isOpen, officialResumePageImg, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(settings.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = settings.email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      let response = await fetch(officialPdfUrl);
      if (!response.ok && officialPdfUrl !== fallbackPdfUrl) {
        response = await fetch(fallbackPdfUrl);
      }
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Nitesh_Kumar_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch {
      // Direct fallback download if cross-origin blob fetch is restricted
      const link = document.createElement('a');
      link.href = fallbackPdfUrl;
      link.download = 'Nitesh_Kumar_Resume.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (printing) return;
    setPrinting(true);

    try {
      const existingFrame = document.getElementById('resume-print-iframe');
      if (existingFrame) existingFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'resume-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        setPrinting(false);
        return;
      }

      if (activeTab === 'document') {
        const imgSrc = officialResumePageImg;
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${settings.name} - Official Resume</title>
              <style>
                @page { size: A4 portrait; margin: 0; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body {
                  width: 100%;
                  height: 100%;
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                img {
                  width: 100%;
                  max-width: 210mm;
                  max-height: 297mm;
                  height: auto;
                  object-fit: contain;
                  display: block;
                }
              </style>
            </head>
            <body>
              <img id="resume-img" src="${imgSrc}" alt="${settings.name} Official Resume" />
              <script>
                const img = document.getElementById('resume-img');
                function triggerPrint() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 150);
                }
                if (img.complete) {
                  triggerPrint();
                } else {
                  img.onload = triggerPrint;
                  img.onerror = triggerPrint;
                }
              </script>
            </body>
          </html>
        `);
        doc.close();
      } else {
        const atsHtml = atsResumeRef.current?.innerHTML || '';
        const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
          .map((node) => node.outerHTML)
          .join('\n');

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${settings.name} - ATS Resume</title>
              ${styleSheets}
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                html, body {
                  background: #ffffff !important;
                  color: #0f172a !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  font-family: Inter, system-ui, -apple-system, sans-serif;
                }
                .print-wrapper {
                  width: 100%;
                  max-width: 190mm;
                  margin: 0 auto;
                }
              </style>
            </head>
            <body>
              <div class="print-wrapper">${atsHtml}</div>
              <script>
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 250);
              </script>
            </body>
          </html>
        `);
        doc.close();
      }

      setTimeout(() => setPrinting(false), 1200);
    } catch {
      window.print();
      setPrinting(false);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setZoomLevel(1);

  const githubLink = settings.github || SOCIAL_LINKS.find(s => s.platform === 'GitHub')?.url || 'https://github.com/nitesh933438';
  const linkedinLink = settings.linkedin || SOCIAL_LINKS.find(s => s.platform === 'LinkedIn')?.url || 'https://www.linkedin.com/in/nitesh933438/';

  const class12 = schooling.find(s => s.id === 'bseb-12th' || String(s.standard).includes('12'));
  const class10 = schooling.find(s => s.id === 'bseb-10th' || String(s.standard).includes('10'));
  const declaredSemesters = university.semesters
    .filter((s) => s.isDeclared && typeof s.sgpa === 'number')
    .sort((a, b) => a.semesterNumber - b.semesterNumber);
  const semSummary = declaredSemesters.length
    ? declaredSemesters.map((s) => `Sem ${s.semesterNumber}: ${s.sgpa?.toFixed(2)}`).join(' | ') + ' / 10.0'
    : 'Results Scheduled';
  const projectMetrics = getProjectMetrics(projects);
  const certMetrics = getCertificateMetrics(certificates);
  const featuredProjectsList = projectMetrics.resumeFeatured;
  const featuredCertificatesList = certMetrics.resumeFeatured;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
        
        {/* Global Print-Only Stylesheet so Ctrl+P / Cmd+P also works in BOTH tabs */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-resume-surface,
            #printable-resume-surface * {
              visibility: visible !important;
            }
            #printable-resume-surface {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
              overflow: visible !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
          }
        `}</style>

        {/* Backdrop Click to Close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => closeModal()}
          className="fixed inset-0 no-print"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-6xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col z-10"
        >
          {/* Sticky Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 no-print shrink-0">
            
            {/* Left: Branding & View Mode Switcher */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>{settings.name} — Official Resume</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified CV
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    B.Tech CSE • Full-Stack MERN & AI Developer
                  </p>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('document')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'document'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Document View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('interactive')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'interactive'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive ATS</span>
                </button>
              </div>
            </div>

            {/* Right: Zoom Controls & Download / Print Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              {/* Zoom Controls (Only in Document View) */}
              {activeTab === 'document' && (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mr-1">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 min-w-[38px] text-center tabular-nums">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {zoomLevel !== 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      title="Reset Zoom"
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyEmail}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Copy Email Address"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                title={activeTab === 'document' ? 'Print Official Resume' : 'Print ATS Resume'}
              >
                {printing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                <span className="hidden xs:inline sm:inline">{printing ? 'Printing...' : 'Print'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer disabled:opacity-60"
                title="Download Official PDF Resume"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloading ? 'Saving...' : downloadSuccess ? 'Downloaded!' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => closeModal()}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Close Resume Modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-auto p-2 sm:p-6 md:p-8 bg-slate-200/70 dark:bg-slate-950/90 custom-scrollbar">
            
            {/* TAB 1: OFFICIAL UPLOADED RESUME DOCUMENT VIEW */}
            {activeTab === 'document' && (
              <div className="w-full flex flex-col items-center">
                
                {/* Mobile Zoom & Quick Action Strip */}
                <div className="flex md:hidden items-center justify-between w-full max-w-[850px] mb-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs no-print">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Zoom Document:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      aria-label="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[38px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      aria-label="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    {zoomLevel !== 1 && (
                      <button
                        type="button"
                        onClick={handleResetZoom}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                        aria-label="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* High-Resolution Official Resume Page Container */}
                <div className="w-full overflow-x-auto pb-2">
                  <div
                    id="printable-resume-surface"
                    className="mx-auto relative bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden transition-all duration-200 origin-top"
                    style={{
                      width: zoomLevel === 1 ? '100%' : `${Math.round(zoomLevel * 850)}px`,
                      maxWidth: zoomLevel === 1 ? '850px' : 'none',
                    }}
                  >
                  {!imageLoaded && !imageError && (
                    <div className="w-full aspect-[1/1.414] min-h-[420px] flex flex-col items-center justify-center bg-white text-slate-400 gap-3 p-8">
                      <div className="w-10 h-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold text-slate-500">Loading Official Resume Document...</span>
                    </div>
                  )}
                  {imageError ? (
                    <div className="w-full min-h-[420px] flex flex-col items-center justify-center bg-white text-slate-700 gap-4 p-8 text-center">
                      <FileText className="w-12 h-12 text-indigo-600" />
                      <div className="space-y-1 max-w-md">
                        <p className="text-sm font-bold text-slate-900">Document preview image unavailable</p>
                        <p className="text-xs text-slate-500">You can open the official PDF directly, download it, or switch to Interactive ATS view.</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <a
                          href={officialPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Official PDF</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setActiveTab('interactive')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Switch to Interactive ATS</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      ref={resumeImgRef}
                      src={officialResumePageImg}
                      alt={`${settings.name} Official Resume`}
                      onLoad={() => {
                        setImageError(false);
                        setImageLoaded(true);
                      }}
                      onError={() => {
                        setImageError(true);
                        setImageLoaded(true);
                      }}
                      className={`w-full h-auto block select-none ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                  </div>
                </div>

                {/* Quick Bottom Action Strip */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 no-print pb-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={printing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Print Official Resume</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official Resume (PDF)</span>
                  </button>

                  <a
                    href={officialPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Open PDF in New Tab</span>
                  </a>

                  <a
                    href="#/resume"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Open Full Page</span>
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE ATS LIVE DATA RESUME */}
            {activeTab === 'interactive' && (
              <div 
                id="printable-resume-surface"
                ref={atsResumeRef}
                className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 md:p-12 space-y-7"
              >
                {/* Resume Header */}
                <header className="border-b-2 border-slate-900 dark:border-slate-700 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                      {settings.name}
                    </h1>
                    <p className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {settings.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {university.degree} in {university.branch} • {university.institution} ({university.session})
                    </p>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right">
                    <a href={`mailto:${settings.email}`} className="inline-flex md:justify-end items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{settings.email}</span>
                    </a>
                    <a href={`tel:${settings.whatsapp}`} className="inline-flex md:justify-end items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{settings.whatsapp}</span>
                    </a>
                    <div className="inline-flex md:justify-end items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{settings.location}</span>
                    </div>
                    <div className="inline-flex md:justify-end items-center gap-3 pt-0.5">
                      <a href={githubLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-semibold">
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                      <span>•</span>
                      <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-semibold">
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                      </a>
                    </div>
                  </div>
                </header>

                {/* 1. Career Objective / Summary */}
                <section className="space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Executive Summary</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {settings.bio} Experienced in architecting end-to-end full-stack web applications using the MERN stack (MongoDB, Express.js, React, Node.js), TypeScript, Tailwind CSS, Firebase, and Google Gemini AI APIs with a strong focus on scalable architecture, clean code, and production readiness.
                  </p>
                </section>

                {/* 2. Academic Qualifications */}
                <section className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Education & Academic Record</span>
                  </h2>

                  <div className="space-y-3">
                    {/* University */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {university.degree} — {university.branch}
                          </h3>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {university.institution}, {university.location}
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{university.session}</span>
                          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                            {semSummary}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Class 12 & Class 10 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {class12 && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {class12.qualificationTitle} (Class XII - PCM)
                            </h4>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              {class12.percentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {class12.boardFullName} • {class12.board} ({class12.passingYear})
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 mt-1">
                            Marks: {class12.totalMarks}/{class12.maxMarks} ({class12.division})
                          </p>
                        </div>
                      )}

                      {class10 && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {class10.qualificationTitle} (Class X)
                            </h4>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                              {class10.percentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {class10.boardFullName} • {class10.board} ({class10.passingYear})
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 mt-1">
                            Marks: {class10.totalMarks}/{class10.maxMarks} ({class10.division})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. Technical Skills */}
                <section className="space-y-2.5">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Technical Skills & Stack</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {skills.map((group) => (
                      <div key={group.category} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-bold text-slate-900 dark:text-white shrink-0 min-w-[145px]">
                          {group.category}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {group.skills.map(s => s.name).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. Experience */}
                <section className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Development Experience</span>
                  </h2>
                  {experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{exp.role}</h3>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{exp.company} • {exp.type}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{exp.period} | {exp.location}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {exp.highlights.map((item, i) => (
                          <li key={i} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>

                {/* 5. Key Full-Stack & AI Projects */}
                <section className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Featured Engineering Projects ({projectMetrics.active.length} Active)</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featuredProjectsList.map((proj) => (
                      <div key={proj.id} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white">{proj.title}</h3>
                            <div className="flex items-center gap-1.5 shrink-0 no-print">
                              {proj.githubUrl && (
                                <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600" title="GitHub Code">
                                  <Github className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {proj.liveDemoUrl && (
                                <a href={proj.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600" title="Live Demo">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {proj.shortDescription}
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          Stack: {proj.techStack.slice(0, 5).join(' • ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 6. Highlighted Certifications & Achievements */}
                <section className="space-y-2.5">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Key Certifications &amp; Recognitions ({certMetrics.published.length} Verified)</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {featuredCertificatesList.map((cert) => (
                      <div key={cert.id} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{cert.title}</span>
                          <span className="text-slate-500 dark:text-slate-400"> — {cert.issuer} ({cert.issueDate})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            )}
          </div>

          {/* Bottom Bar (No-print) */}
          <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 no-print shrink-0">
            <span className="truncate">
              Viewing <strong>{activeTab === 'document' ? 'Official Original Resume' : 'Interactive ATS Summary'}</strong>
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:ml-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <span className="hidden sm:inline">•</span>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <span className="hidden sm:inline">•</span>
              <a
                href={officialPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Open PDF</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="#/resume"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>New Tab View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

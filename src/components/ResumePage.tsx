import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjectMetrics, getCertificateMetrics } from '../utils/portfolioMetrics';
import {
  ArrowLeft,
  Download,
  Printer,
  ExternalLink,
  FileText,
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  BookOpen,
  Code2,
  Briefcase,
  Award,
  Loader2,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { SOCIAL_LINKS } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { useResolvedResume } from '../utils/resumeAsset';

export const ResumePage: React.FC = () => {
  const { settings, university, schooling, projects, certificates, skills, experience } = usePortfolio();
  const { pdfUrl, fallbackPdfUrl, resumeImageUrl } = useResolvedResume(settings.resumeUrl);

  const [activeTab, setActiveTab] = useState<'document' | 'pdf' | 'interactive'>('document');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [printing, setPrinting] = useState<boolean>(false);
  const atsResumeRef = useRef<HTMLDivElement>(null);
  const resumeImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImageError(false);
    if (resumeImgRef.current?.complete && resumeImgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [resumeImageUrl, activeTab]);

  const githubLink =
    settings.github ||
    SOCIAL_LINKS.find((s) => s.platform === 'GitHub')?.url ||
    'https://github.com/nitesh933438';
  const linkedinLink =
    settings.linkedin ||
    SOCIAL_LINKS.find((s) => s.platform === 'LinkedIn')?.url ||
    'https://www.linkedin.com/in/nitesh933438/';

  const class12 = schooling.find((s) => s.id === 'bseb-12th' || String(s.standard).includes('12'));
  const class10 = schooling.find((s) => s.id === 'bseb-10th' || String(s.standard).includes('10'));
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

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      let response = await fetch(pdfUrl);
      if (!response.ok && pdfUrl !== fallbackPdfUrl) {
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

      if (activeTab !== 'interactive') {
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
                  width: 100%; height: 100%; background: #ffffff;
                  display: flex; align-items: center; justify-content: center;
                  -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                img { width: 100%; max-width: 210mm; max-height: 297mm; height: auto; object-fit: contain; display: block; }
              </style>
            </head>
            <body>
              <img id="resume-img" src="${resumeImageUrl}" alt="${settings.name} Official Resume" />
              <script>
                const img = document.getElementById('resume-img');
                function triggerPrint() { setTimeout(function() { window.focus(); window.print(); }, 150); }
                if (img.complete) triggerPrint();
                else { img.onload = triggerPrint; img.onerror = triggerPrint; }
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
                html, body { background: #ffffff !important; color: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .print-wrapper { width: 100%; max-width: 190mm; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="print-wrapper">${atsHtml}</div>
              <script>setTimeout(function() { window.focus(); window.print(); }, 250);</script>
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Sticky Action Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to Portfolio"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Portfolio</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black leading-tight flex items-center gap-1.5">
                  <span>{settings.name}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Resume
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Full-Stack MERN & AI Developer
                </p>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
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
              <span>Document</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="sm:hidden">PDF</span>
              <span className="hidden sm:inline">PDF Embed</span>
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
              <span>ATS View</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeTab === 'document' && (
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold min-w-[38px] text-center tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.2))}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-indigo-600 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              {printing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Printer className="w-3.5 h-3.5 text-indigo-600" />}
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : downloadSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloading ? 'Saving...' : downloadSuccess ? 'Saved!' : 'Download PDF'}</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400"
              title="Open Raw PDF File"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Raw PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-x-auto">
        {activeTab === 'document' && (
          <div className="flex flex-col items-center">
            {/* Mobile & Tablet Zoom Strip */}
            <div className="flex lg:hidden items-center justify-between w-full max-w-[850px] mb-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300">Zoom Document:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[38px] text-center tabular-nums">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.2))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                    aria-label="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-2">
              <div
                className="mx-auto relative bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200"
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
                    <p className="text-xs text-slate-500">Open the embedded PDF viewer, open the raw PDF in a new tab, or switch to ATS View.</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pdf')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open PDF Embed</span>
                    </button>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Open Raw PDF</span>
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  ref={resumeImgRef}
                  src={resumeImageUrl}
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
          </div>
        )}

        {activeTab === 'pdf' && (
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[82vh]">
            <div className="px-3 sm:px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                PDF preview not displaying on mobile? Switch to Document View or open the full PDF directly.
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('document')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  HD Document View
                </button>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  <span>Open Full PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <iframe
              src={pdfUrl}
              title={`${settings.name} PDF Resume`}
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        )}

        {activeTab === 'interactive' && (
          <div
            ref={atsResumeRef}
            className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 md:p-12 space-y-7"
          >
            <header className="border-b-2 border-slate-900 dark:border-slate-700 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">{settings.name}</h2>
                <p className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{settings.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {university.degree} in {university.branch} • {university.institution} ({university.session})
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right">
                <a href={`mailto:${settings.email}`} className="inline-flex md:justify-end items-center gap-1.5 hover:text-indigo-600">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{settings.email}</span>
                </a>
                <a href={`tel:${settings.whatsapp}`} className="inline-flex md:justify-end items-center gap-1.5 hover:text-indigo-600">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{settings.whatsapp}</span>
                </a>
                <div className="inline-flex md:justify-end items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{settings.location}</span>
                </div>
                <div className="inline-flex md:justify-end items-center gap-3 pt-0.5">
                  <a href={githubLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-indigo-600 font-semibold">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                  <span>•</span>
                  <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-indigo-600 font-semibold">
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </header>

            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{settings.bio}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Education & Academic Record</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-baseline justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold">{university.degree} — {university.branch}</h4>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{university.institution}, {university.location}</p>
                </div>
                <div className="text-left lg:text-right">
                  <span className="text-xs font-bold block">{university.session}</span>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">{semSummary}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[class12, class10].filter(Boolean).map((item) => (
                  <div key={item!.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-bold">{item!.qualificationTitle}</h4>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{item!.percentage}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{item!.boardFullName} • {item!.board} ({item!.passingYear})</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Technical Skills & Stack</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {skills.map((group) => (
                  <div key={group.category}>
                    <span className="font-bold">{group.category}: </span>
                    <span className="text-slate-600 dark:text-slate-300">{group.skills.map((s) => s.name).join(', ')}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Development Experience</span>
              </h3>
              {experience.map((exp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold">{exp.role}</h4>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{exp.company} • {exp.type}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{exp.period} | {exp.location}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {exp.highlights.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Featured Projects ({projectMetrics.active.length} Active)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featuredProjectsList.map((proj) => (
                  <div key={proj.id} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
                    <h4 className="text-xs font-bold">{proj.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{proj.shortDescription}</p>
                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Stack: {proj.techStack.slice(0, 5).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Key Certifications ({certMetrics.published.length} Verified)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {featuredCertificatesList.map((cert) => (
                  <div key={cert.id} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold">{cert.title}</span>
                      <span className="text-slate-500 dark:text-slate-400"> — {cert.issuer} ({cert.issueDate})</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ExternalLink,
  FileText,
  Search,
  ShieldCheck,
  X,
  Eye,
  Copy,
  Check,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Star,
  Calendar,
  Hash,
  GraduationCap,
  CheckCircle2,
  Image as ImageIcon,
  ArrowUpDown
} from 'lucide-react';
import {
  resolveCertificatePreviewImageUrl,
  resolveCertificateOriginalFileUrl
} from '../services/certificateFirebase';
import { CERTIFICATE_CATEGORIES, type PortfolioCertificate } from '../types/certificate';
import { ScrollReveal } from './ScrollReveal';
import { usePortfolio } from '../context/PortfolioContext';
import {
  isIndividualVerificationUrl,
  isExternalLiveVerificationUrl,
  detectVerificationUrl
} from '../services/verificationDetection';
import { useModalHistory } from '../hooks/useModalHistory';
import { downloadAssetFile } from '../utils/fileDownload';

const formatIssueDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
};

export const Certifications: React.FC = () => {
  const { certificates: items } = usePortfolio();
  const [category, setCategory] = useState('All');
  const [quickFilter, setQuickFilter] = useState<'all' | 'featured' | 'verified'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'date-desc' | 'date-asc' | 'issuer' | 'title'>('recommended');
  const [selected, setSelected] = useState<PortfolioCertificate | null>(null);
  const [viewerMode, setViewerMode] = useState<'image' | 'pdf'>('image');
  const [zoom, setZoom] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [failedPreviewUrls, setFailedPreviewUrls] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { closeModal } = useModalHistory(Boolean(selected), 'certificate-modal', () =>
    setSelected(null)
  );

  useEffect(() => {
    if (!selected) return;
    setViewerMode('image');
    setZoom(1);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [selected, closeModal]);

  const getInternalVerifyRoute = (cert: PortfolioCertificate): string => {
    const token = cert.credentialId || cert.verificationCode || cert.id;
    return `/verify/${encodeURIComponent(token)}`;
  };

  const getEffectiveVerifyUrl = (cert: PortfolioCertificate): string => {
    const raw = cert.credentialUrl || detectVerificationUrl(cert) || '';
    if (isIndividualVerificationUrl(raw) && cert.verificationStatus !== 'rejected') {
      return raw;
    }
    return `#${getInternalVerifyRoute(cert)}`;
  };

  const getShareableVerifyUrl = (cert: PortfolioCertificate): string => {
    const url = getEffectiveVerifyUrl(cert);
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const hash = url.startsWith('#') ? url : `#${url}`;
    return `${window.location.origin}${window.location.pathname}${hash}`;
  };

  const handleCopy = async (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) {
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
        }
      } catch {
        // Ignore if clipboard access blocked
      }
    }
  };

  const publishedItems = useMemo(
    () =>
      [...items]
        .filter(x => x.published !== false)
        .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)),
    [items]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: publishedItems.length };
    for (const cat of CERTIFICATE_CATEGORIES) {
      counts[cat] = publishedItems.filter(x => x.category === cat).length;
    }
    return counts;
  }, [publishedItems]);

  const visible = useMemo(() => {
    let result = publishedItems
      .filter(x => category === 'All' || x.category === category)
      .filter(x => {
        if (quickFilter === 'featured') return Boolean(x.featured);
        if (quickFilter === 'verified') return Boolean(getEffectiveVerifyUrl(x));
        return true;
      })
      .filter(x => {
        if (!search.trim()) return true;
        const haystack = `${x.title} ${x.issuer} ${x.credentialId || ''} ${x.verificationCode || ''} ${x.category} ${(x.skills || []).join(' ')} ${x.description || ''}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      });

    if (sortBy === 'date-desc') {
      result = [...result].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
    } else if (sortBy === 'date-asc') {
      result = [...result].sort((a, b) => (a.issueDate || '').localeCompare(b.issueDate || ''));
    } else if (sortBy === 'issuer') {
      result = [...result].sort((a, b) => a.issuer.localeCompare(b.issuer));
    } else if (sortBy === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
    }

    return result;
  }, [publishedItems, category, quickFilter, search, sortBy]);

  const verifiedCount = useMemo(
    () => publishedItems.filter(x => Boolean(getEffectiveVerifyUrl(x))).length,
    [publishedItems]
  );

  const nptelFeatured = useMemo(
    () =>
      visible.find(
        x => x.id === 'nptel-programming-in-java-2026' || x.credentialId === 'NPTEL26CS153S1262000875'
      ),
    [visible]
  );

  return (
    <section
      id="certifications"
      className="py-[var(--section-py)] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-600 dark:text-cyan-400">
              Verified Credentials · Academic & Industry Certifications
            </span>
            <h2
              className="mt-3 font-black text-slate-900 dark:text-white tracking-tight"
              style={{ fontSize: 'var(--text-4xl)' }}
            >
              Certifications{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                & Achievements
              </span>
            </h2>
            <p
              className="mt-3 text-slate-600 dark:text-slate-400"
              style={{ fontSize: 'var(--text-base)' }}
            >
              {publishedItems.length} original certificates · {verifiedCount} direct credential verification links · IIT Kharagpur NPTEL, Microsoft, IBM, Coursera, AWS & NASSCOM.
            </p>
          </div>
        </ScrollReveal>

        {/* Primary NPTEL Elite Spotlight Banner when visible */}
        {nptelFeatured && category === 'All' && !search.trim() && (
          <div className="mb-10 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/30 p-5 sm:p-7 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Certificate Preview Image */}
              <div className="lg:col-span-5">
                {(() => {
                  const spotlightPreviewUrl = resolveCertificatePreviewImageUrl(nptelFeatured);
                  return (
                    <div
                      onClick={() => setSelected(nptelFeatured)}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md cursor-pointer aspect-[1.414/1] flex items-center justify-center"
                    >
                      {spotlightPreviewUrl && !failedPreviewUrls[spotlightPreviewUrl] ? (
                        <img
                          src={spotlightPreviewUrl}
                          alt={nptelFeatured.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedPreviewUrls(prev => ({ ...prev, [spotlightPreviewUrl]: true }))
                          }
                          className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-indigo-500 p-4 text-center">
                          <FileText className="w-12 h-12" />
                          <span className="text-[10px] font-black tracking-widest uppercase">Official Certificate</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/35 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-indigo-600" /> Click to Inspect Full Certificate
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Certificate Complete Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" /> #1 FEATURED CREDENTIAL
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
                    {nptelFeatured.grade || 'ELITE'} GRADE ({nptelFeatured.score || '78%'})
                  </span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Official NPTEL / IIT Kharagpur Verified
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {nptelFeatured.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {nptelFeatured.issuer}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {nptelFeatured.description}
                </p>

                {/* Structured Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Consolidated Score
                    </span>
                    <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-cyan-400 tabular-nums">
                      {nptelFeatured.score || '78%'} {nptelFeatured.grade ? `(${nptelFeatured.grade})` : '(Elite)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Online Assignments
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                      {nptelFeatured.assignmentScore || '24.94 / 25'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Proctored Exam
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                      {nptelFeatured.examScore || '52.5 / 75'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Course Credits
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {nptelFeatured.credits || '4 Credits'}
                    </span>
                  </div>
                </div>

                {/* Metadata Row: Roll No, Verification ID, Duration, Candidates */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-sans font-bold text-slate-700 dark:text-slate-300">Roll No:</span>
                    <span>{nptelFeatured.credentialId}</span>
                    <button
                      type="button"
                      onClick={e => handleCopy(nptelFeatured.credentialId || '', 'nptel-roll', e)}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-600 dark:text-cyan-400 transition-colors"
                      title="Copy Roll Number"
                      aria-label="Copy Roll Number"
                    >
                      {copiedKey === 'nptel-roll' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">Session:</strong> {nptelFeatured.duration || 'Jul–Oct 2026 (12 Weeks)'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">Candidates:</strong> {nptelFeatured.totalCandidates || '42,917'}
                  </span>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(nptelFeatured)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-indigo-600/20 min-h-[42px] whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>View Certificate & Details</span>
                  </button>

                  <Link
                    to={getInternalVerifyRoute(nptelFeatured)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-emerald-600/20 min-h-[42px] whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Verify Official Credential</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </Link>

                  <a
                    href={resolveCertificateOriginalFileUrl(nptelFeatured)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-2 min-h-[42px] whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
                    <span>Original PDF</span>
                  </a>

                  <button
                    type="button"
                    disabled={downloadingId === nptelFeatured.id}
                    onClick={async () => {
                      setDownloadingId(nptelFeatured.id);
                      try {
                        await downloadAssetFile(
                          resolveCertificateOriginalFileUrl(nptelFeatured),
                          nptelFeatured.title,
                          {
                            explicitFilename: 'Nitesh_Kumar_NPTEL_Programming_in_Java_Certificate.pdf',
                            defaultExt: 'pdf',
                          }
                        );
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-2 min-h-[42px] whitespace-nowrap cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
                    <span>{downloadingId === nptelFeatured.id ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Interactive Filter Controls */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-3">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by certificate title, issuer, credential ID (e.g. NPTEL26CS153S1262000875), or skill..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-3 pl-11 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>

            {/* Segmented Quick Filters */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setQuickFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  quickFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({publishedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('verified')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  quickFilter === 'verified'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Links ({verifiedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('featured')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  quickFilter === 'featured'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Featured</span>
              </button>
            </div>
          </div>

          {/* Horizontal Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {['All', ...CERTIFICATE_CATEGORIES].map(cat => {
              const count = categoryCounts[cat] ?? 0;
              if (cat !== 'All' && count === 0) return null;
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`ml-1.5 text-[10px] tabular-nums ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {visible.length ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-900 dark:text-white tabular-nums">{visible.length}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white tabular-nums">{publishedItems.length}</strong> certificates
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" /> Sort By:
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                >
                  <option value="recommended">Official Serial Order (Prestige & Merit)</option>
                  <option value="date-desc">Issue Date (Newest First)</option>
                  <option value="date-asc">Issue Date (Oldest First)</option>
                  <option value="issuer">Organization / Issuer (A–Z)</option>
                  <option value="title">Certificate Title (A–Z)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((item, idx) => {
                const previewImgUrl = resolveCertificatePreviewImageUrl(item);
                const originalFileUrl = resolveCertificateOriginalFileUrl(item);
                const verifyUrl = getEffectiveVerifyUrl(item);
                const isPdf = item.fileType === 'pdf' || (item.fileUrl || '').toLowerCase().endsWith('.pdf');

                return (
                  <article
                    key={item.id}
                    className={`group rounded-3xl border transition-all duration-200 flex flex-col justify-between p-5 hover:-translate-y-1 hover:shadow-xl ${
                      idx === 0 && item.id === 'nptel-programming-in-java-2026'
                        ? 'border-indigo-500/50 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-slate-900/90 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 hover:border-indigo-400/50 dark:hover:border-indigo-500/40'
                    }`}
                  >
                    <div>
                      {/* Certificate Preview Box */}
                      <div
                        onClick={() => setSelected(item)}
                        className="relative h-48 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center cursor-pointer"
                      >
                        {previewImgUrl && !failedPreviewUrls[previewImgUrl] ? (
                          <img
                            src={previewImgUrl}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedPreviewUrls(prev => ({ ...prev, [previewImgUrl]: true }))
                            }
                            className="w-full h-full object-contain p-1 group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-indigo-500 p-4 text-center">
                            <FileText className="w-12 h-12" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Certificate Document</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3.5 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-indigo-600" /> Inspect Certificate
                          </span>
                        </div>
                      </div>

                      {/* Clean Metadata Kicker with Serial Number Badge */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <span 
                            title={`Official Serial Index #${String((item.displayOrder !== undefined ? item.displayOrder : idx) + 1).padStart(2, '0')}`}
                            className="inline-flex items-center justify-center font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20 shadow-2xs"
                          >
                            #{String((item.displayOrder !== undefined ? item.displayOrder : idx) + 1).padStart(2, '0')}
                          </span>
                          <span className="uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          {item.grade && (
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                              {item.grade}{item.score ? ` · ${item.score}` : ''}
                            </span>
                          )}
                          {item.featured && !item.grade && (
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">FEATURED</span>
                          )}
                          {isPdf && (
                            <span className="text-indigo-500 dark:text-indigo-400 font-mono">· PDF</span>
                          )}
                        </div>
                      </div>

                      {/* Title & Issuer */}
                      <h3
                        onClick={() => setSelected(item)}
                        className="mt-1.5 font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                        {item.issuer}
                      </p>

                      {/* Date, Duration & Expiry */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.issueDate && <span>Issued {formatIssueDate(item.issueDate)}</span>}
                        {item.duration && (
                          <>
                            {item.issueDate && <span aria-hidden="true">·</span>}
                            <span>{item.duration}</span>
                          </>
                        )}
                        {item.expiryDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Valid until {formatIssueDate(item.expiryDate)}</span>
                          </>
                        )}
                      </div>

                      {/* Score / Credits Breakdown if available */}
                      {(item.assignmentScore || item.examScore || item.credits) && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                          {item.assignmentScore && (
                            <span>
                              <strong>Assignments:</strong> {item.assignmentScore}
                            </span>
                          )}
                          {item.examScore && (
                            <span>
                              <strong>Exam:</strong> {item.examScore}
                            </span>
                          )}
                          {item.credits && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {item.credits}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Credential ID with 1-Click Copy */}
                      {item.credentialId && (
                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-white/80 dark:bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
                          <span className="truncate" title={item.credentialId}>
                            <strong className="font-sans text-slate-600 dark:text-slate-300">ID:</strong> {item.credentialId}
                          </span>
                          <button
                            type="button"
                            onClick={e => handleCopy(item.credentialId || '', `id-${item.id}`, e)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors shrink-0"
                            title="Copy Credential ID"
                            aria-label={`Copy Credential ID for ${item.title}`}
                          >
                            {copiedKey === `id-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Skills Line */}
                      {item.skills && item.skills.length > 0 && (
                        <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {item.skills.join(' · ')}
                        </p>
                      )}

                      {/* Verification Status Line */}
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold">
                        {isExternalLiveVerificationUrl(verifyUrl) ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Live Issuer Verification Link Ready</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Official Verification Record & Original Document</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row (Details, Verify, PDF/File, Download) */}
                    <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-3 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 min-h-[42px] whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Details</span>
                      </button>

                      {isExternalLiveVerificationUrl(verifyUrl) ? (
                        <a
                          href={verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[42px] whitespace-nowrap"
                          title="Verify official credential on issuer server"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                        </a>
                      ) : (
                        <Link
                          to={getInternalVerifyRoute(item)}
                          className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[42px] whitespace-nowrap"
                          title="Open Official Credential Verification Record"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Verify</span>
                        </Link>
                      )}

                      <a
                        href={originalFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 shadow-xs min-h-[42px] whitespace-nowrap"
                        title={isPdf ? 'Open original PDF certificate' : 'Open original certificate file'}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{isPdf ? 'PDF' : 'File'}</span>
                      </a>

                      <button
                        type="button"
                        disabled={downloadingId === item.id}
                        onClick={async () => {
                          setDownloadingId(item.id);
                          try {
                            await downloadAssetFile(originalFileUrl, item.title, {
                              defaultExt: isPdf ? 'pdf' : 'jpg',
                            });
                          } finally {
                            setDownloadingId(null);
                          }
                        }}
                        className="px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 text-xs font-bold flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 shadow-xs min-h-[42px] shrink-0 cursor-pointer disabled:opacity-60"
                        title={isPdf ? 'Download original PDF certificate' : 'Download original certificate image'}
                        aria-label={`Download ${item.title}`}
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-14 text-center">
            <Award className="w-10 h-10 mx-auto text-indigo-500" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              No matching certificates found
            </h3>
            <p className="mt-2 max-w-xl mx-auto text-sm text-slate-500 dark:text-slate-400">
              Try clearing your search query or switching the category filter to view all {publishedItems.length} credentials.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('All');
                setQuickFilter('all');
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Full Interactive Certificate Inspection Modal */}
      {selected && (() => {
        const previewImgUrl = resolveCertificatePreviewImageUrl(selected);
        const originalFileUrl = resolveCertificateOriginalFileUrl(selected);
        const verifyUrl = getEffectiveVerifyUrl(selected);
        const hasPdf =
          selected.fileType === 'pdf' ||
          (selected.fileUrl || '').toLowerCase().endsWith('.pdf') ||
          (selected.sourceAsset || '').toLowerCase().endsWith('.pdf');

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={() => closeModal()}
            className="fixed inset-0 z-[100] bg-slate-950/75 dark:bg-slate-950/90 backdrop-blur-md p-2 sm:p-6 flex flex-col overflow-y-auto overscroll-contain"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-6xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[94dvh] text-slate-900 dark:text-slate-100"
            >
              {/* Modal Top Bar */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-950/60 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/30">
                      Record #{String((selected.displayOrder !== undefined ? selected.displayOrder : 0) + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate">{selected.category}</span>
                    {selected.grade && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 dark:text-amber-400">{selected.grade}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-black text-base sm:text-xl text-slate-900 dark:text-white truncate mt-0.5">{selected.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{selected.issuer}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
                  {hasPdf && previewImgUrl && (
                    <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/80 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setViewerMode('image')}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          viewerMode === 'image' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>HD Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewerMode('pdf')}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          viewerMode === 'pdf' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF Reader</span>
                      </button>
                    </div>
                  )}

                  {viewerMode === 'image' && previewImgUrl && (
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/80 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setZoom(z => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                        className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                        title="Zoom Out"
                        aria-label="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-mono text-slate-800 dark:text-slate-200 px-1.5 tabular-nums font-bold">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                        className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                        title="Zoom In"
                        aria-label="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoom(1)}
                        className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                        title="Reset Zoom"
                        aria-label="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => closeModal()}
                    className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-rose-500/15 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    aria-label="Close certificate viewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Split or Stacked Preview + Metadata */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5 sm:space-y-6 custom-scrollbar">
                {/* Media Viewport */}
                <div
                  className={`rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 sm:p-4 min-h-[30vh] sm:min-h-[48vh] max-h-[64vh] overflow-auto ${
                    viewerMode === 'pdf' || !previewImgUrl || failedPreviewUrls[previewImgUrl]
                      ? 'flex flex-col gap-3'
                      : zoom <= 1
                      ? 'flex items-center justify-center'
                      : 'block'
                  }`}
                >
                  {(viewerMode === 'pdf' && hasPdf) || (!previewImgUrl && hasPdf) ? (
                    <>
                      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          PDF inline preview not visible on your device?
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {previewImgUrl && !failedPreviewUrls[previewImgUrl] && (
                            <button
                              type="button"
                              onClick={() => setViewerMode('image')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              HD Image View
                            </button>
                          )}
                          <a
                            href={originalFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          >
                            <span>Open Full PDF</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <iframe
                        title={selected.title}
                        src={originalFileUrl}
                        className="w-full h-[42vh] sm:h-[52vh] rounded-xl bg-white border border-slate-200 dark:border-slate-800"
                      />
                    </>
                  ) : previewImgUrl && !failedPreviewUrls[previewImgUrl] ? (
                    <img
                      src={previewImgUrl}
                      alt={selected.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedPreviewUrls(prev => ({ ...prev, [previewImgUrl]: true }))
                      }
                      style={{
                        width: zoom === 1 ? 'auto' : `${Math.round(zoom * 100)}%`,
                        maxWidth: zoom > 1 ? 'none' : '100%',
                        maxHeight: zoom > 1 ? 'none' : '56vh',
                        height: 'auto',
                      }}
                      className="mx-auto block object-contain rounded-lg shadow-xl bg-white transition-all duration-200"
                    />
                  ) : (
                    <div className="w-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-3">
                      <FileText className="w-12 h-12 text-indigo-600 dark:text-cyan-400" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Certificate preview unavailable
                      </p>
                      <a
                        href={originalFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        <span>Open Original File</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Detailed Credential Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Credential Summary
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{selected.description}</p>

                    {selected.skills && selected.skills.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Verified Competencies & Skills
                        </span>
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          {selected.skills.join(' · ')}
                        </p>
                      </div>
                    )}

                    {selected.coordinator && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-300">Authority / Signatory:</strong> {selected.coordinator}
                      </p>
                    )}
                  </div>

                  {/* Metadata Key-Value Box */}
                  <div className="lg:col-span-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                      Official Record Details
                    </h4>

                    {selected.credentialId && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                          <Hash className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Roll / Credential ID:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-900 dark:text-white font-bold min-w-0">
                          <span className="truncate">{selected.credentialId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(selected.credentialId || '', 'modal-id')}
                            className="p-1 rounded bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-indigo-600 dark:text-cyan-400 shrink-0 cursor-pointer"
                            title="Copy Credential ID"
                            aria-label="Copy Credential ID"
                          >
                            {copiedKey === 'modal-id' ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {selected.verificationCode && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Verification Code:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 truncate">{selected.verificationCode}</span>
                      </div>
                    )}

                    {selected.issueDate && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Issue Date:
                        </span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">{formatIssueDate(selected.issueDate)}</span>
                      </div>
                    )}

                    {selected.duration && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Course Duration:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">{selected.duration}</span>
                      </div>
                    )}

                    {selected.expiryDate && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Valid Until:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatIssueDate(selected.expiryDate)}</span>
                      </div>
                    )}

                    {selected.score && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Consolidated Score:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-black tabular-nums">
                          {selected.score} {selected.grade ? `(${selected.grade})` : ''}
                        </span>
                      </div>
                    )}

                    {selected.assignmentScore && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Online Assignments:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-bold tabular-nums">{selected.assignmentScore}</span>
                      </div>
                    )}

                    {selected.examScore && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Proctored Exam:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-bold tabular-nums">{selected.examScore}</span>
                      </div>
                    )}

                    {selected.credits && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Academic Credits:
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selected.credits}</span>
                      </div>
                    )}

                    {selected.totalCandidates && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Candidates Registered:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-bold tabular-nums">{selected.totalCandidates}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Bottom Action Bar */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  {isExternalLiveVerificationUrl(verifyUrl) ? (
                    <>
                      <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial justify-center text-center inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 sm:whitespace-nowrap"
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Verify on External Issuer Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      <Link
                        to={getInternalVerifyRoute(selected)}
                        onClick={() => closeModal({ skipHistoryBack: true })}
                        className="flex-1 sm:flex-initial justify-center text-center inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors sm:whitespace-nowrap"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Verification Registry Page</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={getInternalVerifyRoute(selected)}
                      onClick={() => closeModal({ skipHistoryBack: true })}
                      className="flex-1 sm:flex-initial justify-center text-center inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 sm:whitespace-nowrap"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Open Official Verification Registry</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopy(getShareableVerifyUrl(selected), 'modal-verify-url')}
                    className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors sm:whitespace-nowrap cursor-pointer"
                  >
                    {copiedKey === 'modal-verify-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                        <span>Copy Verify Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={originalFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-colors sm:whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Open Original {hasPdf ? 'PDF' : 'File'}</span>
                  </a>
                  <button
                    type="button"
                    disabled={downloadingId === selected.id}
                    onClick={async () => {
                      setDownloadingId(selected.id);
                      try {
                        await downloadAssetFile(originalFileUrl, selected.title, {
                          defaultExt: hasPdf ? 'pdf' : 'jpg',
                        });
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors sm:whitespace-nowrap cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadingId === selected.id
                        ? 'Downloading...'
                        : `Download ${hasPdf ? 'PDF' : 'Certificate'}`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

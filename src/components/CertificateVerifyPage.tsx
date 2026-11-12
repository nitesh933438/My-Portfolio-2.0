import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Hash,
  Image as ImageIcon,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { BUNDLED_CERTIFICATES } from '../data/certificates';
import {
  resolveCertificateOriginalFileUrl,
  resolveCertificatePreviewImageUrl,
  subscribeToPublicCertificates
} from '../services/certificateFirebase';
import { isExternalLiveVerificationUrl } from '../services/verificationDetection';
import type { PortfolioCertificate } from '../types/certificate';

const formatIssueDate = (value?: string) => {
  if (!value) return 'Verified Record';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
};

const normalizeToken = (val?: string) =>
  decodeURIComponent(val || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const CertificateVerifyPage: React.FC = () => {
  const { certId } = useParams<{ certId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<PortfolioCertificate[]>(BUNDLED_CERTIFICATES);
  const [lookupInput, setLookupInput] = useState('');
  const [viewerMode, setViewerMode] = useState<'image' | 'pdf'>('image');
  const [zoom, setZoom] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return subscribeToPublicCertificates(merged => {
      if (merged.length) setItems(merged);
    });
  }, []);

  const queryToken = certId || searchParams.get('id') || searchParams.get('q') || '';

  const matchedCert = useMemo(() => {
    if (!queryToken) return items[0] || BUNDLED_CERTIFICATES[0];
    const target = normalizeToken(queryToken);
    return (
      items.find(
        c =>
          normalizeToken(c.id) === target ||
          normalizeToken(c.credentialId) === target ||
          normalizeToken(c.verificationCode) === target ||
          normalizeToken(c.sourceAsset) === target
      ) || null
    );
  }, [items, queryToken]);

  useEffect(() => {
    setViewerMode('image');
    setZoom(1);
    if (matchedCert) {
      setLookupInput(matchedCert.credentialId || matchedCert.id);
    } else if (queryToken) {
      setLookupInput(queryToken);
    }
  }, [matchedCert, queryToken]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 2000);
    } catch {
      // ignore
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupInput.trim();
    if (!cleaned) return;
    navigate(`/verify/${encodeURIComponent(cleaned)}`);
  };

  const previewImgUrl = matchedCert ? resolveCertificatePreviewImageUrl(matchedCert) : '';
  const originalFileUrl = matchedCert ? resolveCertificateOriginalFileUrl(matchedCert) : '';
  const isPdf =
    matchedCert &&
    (matchedCert.fileType === 'pdf' || (matchedCert.fileUrl || '').toLowerCase().endsWith('.pdf'));
  const externalIssuerUrl =
    matchedCert && isExternalLiveVerificationUrl(matchedCert.credentialUrl)
      ? matchedCert.credentialUrl
      : '';

  const getOfficialIssuerPortal = (cert: PortfolioCertificate): { label: string; url: string } => {
    const issuer = (cert.issuer || '').toLowerCase();
    if (issuer.includes('nptel') || issuer.includes('kharagpur')) {
      return { label: 'Official NPTEL / SWAYAM Portal', url: 'https://swayam.gov.in/' };
    }
    if (issuer.includes('microsoft')) {
      return {
        label: 'Microsoft Learn Transcript',
        url: externalIssuerUrl || 'https://learn.microsoft.com/en-us/users/niteshkumar-7537/'
      };
    }
    if (issuer.includes('coursera')) {
      return { label: 'Coursera Verification Portal', url: externalIssuerUrl || 'https://www.coursera.org/' };
    }
    if (issuer.includes('analytics vidhya')) {
      return {
        label: 'Analytics Vidhya Credentials',
        url: externalIssuerUrl || 'https://courses.analyticsvidhya.com/'
      };
    }
    if (issuer.includes('credly') || issuer.includes('ibm')) {
      return { label: 'Credly Official Badge Portal', url: externalIssuerUrl || 'https://www.credly.com/' };
    }
    if (issuer.includes('nasscom') || issuer.includes('futureskills')) {
      return { label: 'NASSCOM FutureSkills Prime Portal', url: 'https://futureskillsprime.in/' };
    }
    if (issuer.includes('henry harvin')) {
      return { label: 'Henry Harvin Education Portal', url: 'https://www.henryharvin.com/' };
    }
    if (issuer.includes('arka jain')) {
      return { label: 'Arka Jain University Official Site', url: 'https://arkajainuniversity.ac.in/' };
    }
    return { label: 'Official Issuer Portal', url: externalIssuerUrl || originalFileUrl };
  };

  const shareableVerifyLink = matchedCert
    ? `${window.location.origin}${window.location.pathname}#/verify/${encodeURIComponent(
        matchedCert.credentialId || matchedCert.id
      )}`
    : window.location.href;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Verification Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('certifications')?.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>Back to Portfolio</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Official Portfolio Credential Verification Registry</span>
            </div>
          </div>

          {/* Live Credential ID Search Form */}
          <form onSubmit={handleLookupSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={lookupInput}
                onChange={e => setLookupInput(e.target.value)}
                placeholder="Enter Roll No / Credential ID (e.g. NPTEL26CS153S1262000875)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all whitespace-nowrap shrink-0"
            >
              Verify ID
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {!matchedCert ? (
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center max-w-2xl mx-auto space-y-4">
            <Award className="w-12 h-12 text-amber-500 mx-auto" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              No Matching Credential Found for &ldquo;{queryToken}&rdquo;
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select any of Nitesh Kumar&apos;s {items.length} verified credentials below or enter a valid Credential ID / Roll No.
            </p>
            <div className="pt-2">
              <Link
                to="/verify/NPTEL26CS153S1262000875"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>View #1 NPTEL Programming in Java Credential</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Verified Status Banner */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-cyan-500/10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/25">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                      Record #{String((matchedCert.displayOrder !== undefined ? matchedCert.displayOrder : 0) + 1).padStart(2, '0')}
                    </span>
                    <span>AUTHENTIC & VERIFIED CREDENTIAL</span>
                    <span>·</span>
                    <span>STATUS: ACTIVE & APPROVED</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {matchedCert.title}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                    Issued to <strong className="text-slate-900 dark:text-white">NITESH KUMAR</strong> by{' '}
                    <strong className="text-slate-900 dark:text-white">{matchedCert.issuer}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {externalIssuerUrl && (
                  <a
                    href={externalIssuerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Verify on External Issuer Server</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                <a
                  href={originalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all whitespace-nowrap"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{isPdf ? 'Open Original Signed PDF' : 'Open Original Certificate'}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <a
                  href={originalFileUrl}
                  download={`${matchedCert.title.replace(/[^a-z0-9]/gi, '_')}.${isPdf ? 'pdf' : 'jpg'}`}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
                  <span>Download {isPdf ? 'PDF' : 'Certificate'}</span>
                </a>
              </div>
            </div>

            {/* Main 2-Column Verification Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Columns: Original Certificate Visual & PDF Inspector */}
              <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewerMode('image')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                        viewerMode === 'image'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Original Certificate Image (HD)</span>
                    </button>

                    {isPdf && (
                      <button
                        type="button"
                        onClick={() => setViewerMode('pdf')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                          viewerMode === 'pdf'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Embedded PDF Reader</span>
                      </button>
                    )}
                  </div>

                  {viewerMode === 'image' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoom(z => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold px-2 tabular-nums">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoom(1)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/60 min-h-[420px] flex items-center justify-center overflow-auto">
                  {viewerMode === 'pdf' && isPdf ? (
                    <iframe
                      src={originalFileUrl}
                      title={matchedCert.title}
                      className="w-full h-[560px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                    />
                  ) : (
                    <img
                      src={previewImgUrl}
                      alt={matchedCert.title}
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center'
                      }}
                      className="max-w-full max-h-[600px] object-contain rounded-xl shadow-md transition-transform duration-200 bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Right 5 Columns: Complete Official Verification Record Details */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-400 block">
                        Official Verification Record
                      </span>
                      <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        Credential Metadata & Scores
                      </h2>
                    </div>
                    {matchedCert.grade && (
                      <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black">
                        {matchedCert.grade}
                        {matchedCert.score ? ` · ${matchedCert.score}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Score Breakdown Box (if present, e.g. NPTEL Java or NASSCOM) */}
                  {(matchedCert.score ||
                    matchedCert.assignmentScore ||
                    matchedCert.examScore ||
                    matchedCert.credits) && (
                    <div className="grid grid-cols-2 gap-3">
                      {matchedCert.score && (
                        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Consolidated Score
                          </span>
                          <span className="text-lg font-black text-indigo-600 dark:text-cyan-400 tabular-nums">
                            {matchedCert.score} {matchedCert.grade ? `(${matchedCert.grade})` : ''}
                          </span>
                        </div>
                      )}
                      {matchedCert.assignmentScore && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Online Assignments
                          </span>
                          <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                            {matchedCert.assignmentScore}
                          </span>
                        </div>
                      )}
                      {matchedCert.examScore && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Proctored Exam
                          </span>
                          <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                            {matchedCert.examScore}
                          </span>
                        </div>
                      )}
                      {matchedCert.credits && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Recommended Credits
                          </span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {matchedCert.credits}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Key-Value Table */}
                  <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Candidate Name</span>
                      </dt>
                      <dd className="font-black text-slate-900 dark:text-white">NITESH KUMAR</dd>
                    </div>

                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Roll No / Credential ID</span>
                      </dt>
                      <dd className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{matchedCert.credentialId || matchedCert.id}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(matchedCert.credentialId || matchedCert.id, 'verify-id')
                          }
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-cyan-400"
                          title="Copy Credential ID"
                        >
                          {copiedKey === 'verify-id' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </dd>
                    </div>

                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Issue Date</span>
                      </dt>
                      <dd className="font-bold text-slate-900 dark:text-white">
                        {formatIssueDate(matchedCert.issueDate)}
                      </dd>
                    </div>

                    {matchedCert.expiryDate && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400 font-medium">Valid Until</dt>
                        <dd className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatIssueDate(matchedCert.expiryDate)}
                        </dd>
                      </div>
                    )}

                    {matchedCert.duration && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400 font-medium">Course Duration</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{matchedCert.duration}</dd>
                      </div>
                    )}

                    {matchedCert.totalCandidates && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400 font-medium">
                          Registered Candidates
                        </dt>
                        <dd className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {matchedCert.totalCandidates}
                        </dd>
                      </div>
                    )}

                    {matchedCert.coordinator && (
                      <div className="py-2.5 flex items-start justify-between gap-4">
                        <dt className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                          Coordinator / Signatory
                        </dt>
                        <dd className="font-bold text-slate-900 dark:text-white text-right">
                          {matchedCert.coordinator}
                        </dd>
                      </div>
                    )}

                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400 font-medium">Category</dt>
                      <dd className="font-bold text-indigo-600 dark:text-cyan-400">
                        {matchedCert.category}
                      </dd>
                    </div>
                  </dl>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    {matchedCert.description}
                  </p>

                  {matchedCert.skills && matchedCert.skills.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Verified Competencies & Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedCert.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shareable Verification Link & Issuer Portal Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(shareableVerifyLink, 'share-url')}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      {copiedKey === 'share-url' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Verification Link Copied to Clipboard!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                          <span>Copy Direct Verification URL</span>
                        </>
                      )}
                    </button>

                    {(() => {
                      const portal = getOfficialIssuerPortal(matchedCert);
                      return (
                        <a
                          href={portal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <GraduationCap className="w-4 h-4 shrink-0" />
                          <span>{portal.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Switcher for All 43 Verified Credentials */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>All {items.length} Verified Credentials in Registry</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Click any credential to inspect its verification record
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item, idx) => {
              const active = matchedCert?.id === item.id;
              return (
                <Link
                  key={item.id}
                  to={`/verify/${encodeURIComponent(item.credentialId || item.id)}`}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                    active
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-cyan-400">
                      <span>#{idx + 1}</span>
                      <span>·</span>
                      <span className="truncate">{item.issuer}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      ID: {item.credentialId || item.id}
                    </p>
                  </div>
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-indigo-600 dark:text-cyan-400' : 'text-emerald-500'
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

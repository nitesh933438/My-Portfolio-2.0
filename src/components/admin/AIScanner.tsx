import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  FileText,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clipboard,
  ShieldBan,
  CopyCheck,
  RefreshCw,
  ArrowRight,
  Zap,
  AlertTriangle,
  Save,
  Tag,
} from 'lucide-react';
import { auth, isUserAdmin } from '../../services/academicFirebase';
import { subscribeToCertificates } from '../../services/certificateFirebase';
import { useAIScanner } from '../../context/AIScannerContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { analyzeAndExtractSmart } from '../../services/api';
import { evaluateScanDecision, ScanDecision } from '../../utils/scannerDecisions';
import { autoApplyScanDecision, AutoApplyResult } from '../../services/autoApplyScan';
import type { PortfolioCertificate } from '../../types/certificate';

interface AIScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TargetCategory =
  | 'auto'
  | 'certificate'
  | 'project'
  | 'education'
  | 'experience'
  | 'skills'
  | 'settings'
  | 'profile_photo';

interface ScanReportItem {
  id: string;
  label: string;
  file?: File;
  decision: ScanDecision;
  applyResult?: AutoApplyResult;
  applying?: boolean;
}

const TARGET_CATEGORY_OPTIONS: Array<{ id: TargetCategory; label: string }> = [
  { id: 'auto', label: 'Auto-Detect' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'project', label: 'Project' },
  { id: 'education', label: 'Marksheet' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'settings', label: 'Resume / Bio' },
  { id: 'profile_photo', label: 'Profile Photo' },
];

export const AIScanner: React.FC<AIScannerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'url'>('file');
  const [targetCategory, setTargetCategory] = useState<TargetCategory>('auto');
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [autoApply, setAutoApply] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ScanReportItem[]>([]);
  const [allCertificates, setAllCertificates] = useState<PortfolioCertificate[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPendingResult } = useAIScanner();
  const portfolio = usePortfolio();
  const navigate = useNavigate();

  const isAdminSignedIn = isUserAdmin(auth.currentUser);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const unsub = subscribeToCertificates((items) => setAllCertificates(items), true);
    return () => unsub();
  }, [isOpen]);

  const addSelectedFiles = (incomingList: FileList | File[]) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const valid: File[] = [];
    const rejectedNames: string[] = [];

    Array.from(incomingList).forEach((f) => {
      if (!allowedTypes.includes(f.type)) {
        rejectedNames.push(`${f.name} (unsupported format)`);
      } else if (f.size > 25 * 1024 * 1024) {
        rejectedNames.push(`${f.name} (>25MB limit)`);
      } else {
        valid.push(f);
      }
    });

    if (rejectedNames.length > 0) {
      setError(`Skipped invalid file(s): ${rejectedNames.join(', ')}. Supported: PDF, JPG, PNG, WEBP up to 25MB.`);
    } else {
      setError(null);
    }

    if (valid.length > 0) {
      setReports([]);
      setFiles((prev) => {
        const seen = new Set(prev.map((x) => `${x.name}:${x.size}`));
        return [...prev, ...valid.filter((v) => !seen.has(`${v.name}:${v.size}`))];
      });
    }
  };

  // Support Ctrl+V / Cmd+V screenshot or PDF paste while scanner modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const pastedFiles = e.clipboardData?.files;
      if (pastedFiles && pastedFiles.length > 0) {
        e.preventDefault();
        setActiveTab('file');
        addSelectedFiles(pastedFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addSelectedFiles(e.target.files);
    }
    e.target.value = '';
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const routeMap: Record<string, string> = {
    project: '/admin/projects',
    certificate: '/admin/certificates',
    education: '/admin/education',
    settings: '/admin/settings',
    experience: '/admin/experience',
    skills: '/admin/skills',
  };

  const buildPortfolioSnapshot = () => {
    const certsForCheck = allCertificates ?? portfolio.certificates;
    return {
      projects: portfolio.projects,
      certificates: certsForCheck,
      allCertificates: certsForCheck,
      university: portfolio.university,
      schooling: portfolio.schooling,
      skills: portfolio.skills,
      experience: portfolio.experience,
      settings: portfolio.settings,
    };
  };

  const openReportInManager = (item: ScanReportItem) => {
    const target = routeMap[item.decision.detectedModule] || '/admin';
    setPendingResult({
      detectedModule: item.decision.detectedModule,
      detectedType: item.decision.detectedType,
      sourceFile: item.file,
      data: item.decision.normalizedData,
      confidence: item.decision.confidence,
      action: item.decision.action,
      matchedId: item.decision.matchedId,
      matchedLabel: item.decision.matchedLabel,
      reason: item.decision.reason,
    });
    navigate(target);
    onClose();
  };

  const applySingleReport = async (reportId: string) => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;

    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, applying: true } : r)));
    try {
      const result = await autoApplyScanDecision({
        decision: target.decision,
        file: target.file || null,
        portfolio: buildPortfolioSnapshot(),
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, applying: false, applyResult: result } : r))
      );
    } catch (applyErr: any) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                applying: false,
                applyResult: {
                  applied: false,
                  status: 'error',
                  message: applyErr.message || 'Save failed. Click Review in Form to save manually.',
                  targetRoute: routeMap[target.decision.detectedModule] || '/admin',
                },
              }
            : r
        )
      );
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setReports([]);

    try {
      if (activeTab === 'file' && files.length === 0) {
        throw new Error('Please choose one or more PDF/image files to scan.');
      }
      if (activeTab === 'text' && !text.trim()) {
        throw new Error('Please paste text to analyze.');
      }
      if (activeTab === 'url' && !url.trim()) {
        throw new Error('Please enter a GitHub repository or web URL.');
      }

      const idToken = (await auth.currentUser?.getIdToken().catch(() => '')) || '';
      const hintModule = targetCategory === 'auto' ? '' : targetCategory;
      const portfolioSnapshot = buildPortfolioSnapshot();

      const scanTargets: Array<{ label: string; file?: File; text?: string; url?: string }> =
        activeTab === 'file'
          ? files.map((f) => ({ label: f.name, file: f }))
          : activeTab === 'text'
          ? [{ label: 'Pasted Content', text }]
          : [{ label: url.trim(), url: url.trim() }];

      const nextReports: ScanReportItem[] = [];
      const failedFiles = new Set<File>();

      for (let i = 0; i < scanTargets.length; i++) {
        const item = scanTargets[i];
        setProgressLabel(`Scanning (${i + 1}/${scanTargets.length}): ${item.label}`);

        const rawResponse = await analyzeAndExtractSmart({
          file: item.file || null,
          text: item.text || '',
          url: item.url || '',
          idToken,
          hintModule,
        });

        const rawPayload = rawResponse?.data || {};
        const decision = evaluateScanDecision({
          raw: rawPayload,
          portfolio: portfolioSnapshot,
          fileName: item.file?.name || '',
          text: item.text || '',
          url: item.url || '',
          mimeType: item.file?.type || '',
        });

        let applyResult: AutoApplyResult | undefined;

        if (autoApply && (decision.action === 'create_new' || decision.action === 'update_existing')) {
          setProgressLabel(`Auto-syncing (${i + 1}/${scanTargets.length}): ${item.label}`);
          try {
            applyResult = await autoApplyScanDecision({
              decision,
              file: item.file || null,
              portfolio: portfolioSnapshot,
            });
            if (applyResult.status === 'error' && item.file) {
              failedFiles.add(item.file);
            }
          } catch (applyErr: any) {
            if (item.file) failedFiles.add(item.file);
            applyResult = {
              applied: false,
              status: 'error',
              message: applyErr.message || 'Auto-save failed; click Review in Form to save manually.',
              targetRoute: routeMap[decision.detectedModule] || '/admin',
            };
          }
        }

        nextReports.push({
          id: `${Date.now()}-${i}`,
          label: item.label,
          file: item.file,
          decision,
          applyResult,
        });
      }

      setReports(nextReports);

      if (!autoApply && nextReports.length === 1) {
        const single = nextReports[0];
        if (single.decision.action === 'create_new' || single.decision.action === 'update_existing') {
          window.setTimeout(() => {
            openReportInManager(single);
            setFiles([]);
            setText('');
            setUrl('');
          }, 550);
        }
      } else if (autoApply && activeTab === 'file') {
        // Retain only files that errored during Auto-Apply so user never loses failed items
        setFiles((prev) => prev.filter((f) => failedFiles.has(f)));
      }
    } catch (err: any) {
      setError(err.message || 'Scan failed.');
    } finally {
      setLoading(false);
      setProgressLabel('');
    }
  };

  const renderExtractedPreview = (d: ScanDecision) => {
    const data = d.normalizedData || {};
    const fields: Array<{ label: string; value: string }> = [];

    if (d.detectedModule === 'certificate') {
      if (data.title) fields.push({ label: 'Title', value: String(data.title) });
      if (data.issuer) fields.push({ label: 'Issuer', value: String(data.issuer) });
      if (data.credentialId) fields.push({ label: 'Cred ID', value: String(data.credentialId) });
      if (data.issueDate) fields.push({ label: 'Date', value: String(data.issueDate) });
      if (data.score) fields.push({ label: 'Score', value: String(data.score) });
    } else if (d.detectedModule === 'project') {
      if (data.title) fields.push({ label: 'Project', value: String(data.title) });
      if (data.category) fields.push({ label: 'Category', value: String(data.category) });
      if (Array.isArray(data.techStack) && data.techStack.length) {
        fields.push({ label: 'Stack', value: data.techStack.slice(0, 5).join(', ') });
      }
      if (data.liveDemoUrl) fields.push({ label: 'Live URL', value: String(data.liveDemoUrl) });
    } else if (d.detectedModule === 'education') {
      if (data.qualificationTitle || data.standard) {
        fields.push({ label: 'Record', value: String(data.qualificationTitle || data.standard) });
      } else if (data.semesterNumber) {
        fields.push({ label: 'Semester', value: `Semester ${data.semesterNumber}` });
      }
      if (typeof data.sgpa === 'number') fields.push({ label: 'SGPA', value: data.sgpa.toFixed(2) });
      if (typeof data.percentage === 'number') fields.push({ label: 'Percentage', value: `${data.percentage}%` });
      if (data.board || data.institution) fields.push({ label: 'Institution', value: String(data.board || data.institution) });
    } else if (d.detectedModule === 'experience') {
      if (data.role) fields.push({ label: 'Role', value: String(data.role) });
      if (data.company) fields.push({ label: 'Company', value: String(data.company) });
      if (data.period) fields.push({ label: 'Period', value: String(data.period) });
    } else if (d.detectedModule === 'skills') {
      if (data.category) fields.push({ label: 'Group', value: String(data.category) });
      if (Array.isArray(data.skills) && data.skills.length) {
        fields.push({
          label: 'Skills',
          value: data.skills.map((s: any) => s?.name).filter(Boolean).slice(0, 6).join(', '),
        });
      }
    } else if (d.detectedModule === 'settings') {
      if (data.name) fields.push({ label: 'Name', value: String(data.name) });
      if (data.email) fields.push({ label: 'Email', value: String(data.email) });
      if (data.title) fields.push({ label: 'Headline', value: String(data.title) });
    }

    if (fields.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-baseline gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[11px] min-w-0"
          >
            <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">{f.label}:</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate">{f.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'file', label: 'Files / Batch', icon: Upload },
    { id: 'text', label: 'Paste Text', icon: Clipboard },
    { id: 'url', label: 'Web / GitHub URL', icon: LinkIcon },
  ] as const;

  const summaryCounts = {
    applied: reports.filter((r) => r.applyResult?.status === 'created' || r.applyResult?.status === 'updated').length,
    ready: reports.filter((r) => !r.applyResult && (r.decision.action === 'create_new' || r.decision.action === 'update_existing')).length,
    skipped: reports.filter((r) => r.decision.action === 'skip_duplicate').length,
    blocked: reports.filter((r) => r.decision.action === 'reject_irrelevant' || r.applyResult?.status === 'error').length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain shadow-2xl mx-auto my-auto"
          >
            {/* Header */}
            <div className="p-5 sm:p-7 pb-0 flex justify-between items-start gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={16} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Smart Portfolio Auto-Scanner</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  Auto-Detect, Deduplicate &amp; Sync
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Reads real text via OCR/PDF &amp; GitHub API, deduplicates against your live portfolio, and blocks private files.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close scanner"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs, Category Override & Auto-Sync Toggle */}
            <div className="px-5 sm:px-7 mt-5 space-y-3">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setActiveTab(tab.id); setError(null); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon size={13} className="shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explicit Category Override Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={12} className="text-indigo-500" />
                    Target Category
                  </span>
                  <span className="text-[10px] font-medium">
                    {targetCategory === 'auto' ? 'Smart Auto-Detect (Recommended)' : `Forced: ${targetCategory}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetCategory(opt.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        targetCategory === opt.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Zap size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Auto-Apply Safe Changes to Portfolio</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoApply}
                  onClick={() => setAutoApply((prev) => !prev)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    autoApply
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {autoApply ? 'Auto ON' : 'Review in Form'}
                </button>
              </div>

              {autoApply && !isAdminSignedIn && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Admin sign-in session is inactive — switch to <strong>Review in Form</strong> or sign in as Admin so Auto-Sync can write to Firebase.
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-5 sm:p-7 space-y-5">
              {activeTab === 'file' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer.files?.length) {
                        addSelectedFiles(event.dataTransfer.files);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
                      files.length > 0
                        ? 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Upload size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
                      Click, Drag &amp; Drop, or Paste (Ctrl+V) files
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                      Certificates, Marksheets, Project Screenshots, Profile Photo, or Resume (PDF, JPG, PNG, WEBP)
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {files.map((f, idx) => (
                        <div
                          key={`${f.name}-${f.size}-${idx}`}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={15} className="text-indigo-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">{f.name}</div>
                              <div className="text-[10px] text-slate-500">{(f.size / 1024).toFixed(0)} KB</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFileAt(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste certificate details, project README/stack, marksheet SGPA text, internship description, or skills list..."
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium resize-y focus:outline-none focus:border-indigo-500 transition-colors min-h-[150px]"
                />
              )}

              {activeTab === 'url' && (
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/username/repository or live project URL"
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                />
              )}

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleScan}
                disabled={
                  loading ||
                  (activeTab === 'file' && files.length === 0) ||
                  (activeTab === 'text' && !text.trim()) ||
                  (activeTab === 'url' && !url.trim())
                }
                className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  loading
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>{progressLabel || 'Analyzing & checking duplicates...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{autoApply ? 'Scan & Auto-Sync Smartly' : 'Scan & Preview in Editor'}</span>
                  </>
                )}
              </button>

              {/* Scan Decision Report */}
              {reports.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="uppercase tracking-wider text-slate-500">Scan Decision Report</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {summaryCounts.applied > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          {summaryCounts.applied} Auto-Synced
                        </span>
                      )}
                      {summaryCounts.ready > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                          {summaryCounts.ready} Ready
                        </span>
                      )}
                      {summaryCounts.skipped > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          {summaryCounts.skipped} Duplicate Skipped
                        </span>
                      )}
                      {summaryCounts.blocked > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300">
                          {summaryCounts.blocked} Needs Attention
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {reports.map((rep) => {
                      const d = rep.decision;
                      const res = rep.applyResult;
                      const isBlocked = d.action === 'reject_irrelevant' || res?.status === 'rejected';
                      const isErrored = res?.status === 'error';
                      const isSkipped = d.action === 'skip_duplicate' || res?.status === 'skipped';
                      const isUpdated = !isErrored && (d.action === 'update_existing' || res?.status === 'updated');

                      const cardTone =
                        isBlocked || isErrored
                          ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20'
                          : isSkipped
                          ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20'
                          : isUpdated
                          ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20'
                          : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20';

                      return (
                        <div key={rep.id} className={`p-3.5 rounded-xl border ${cardTone} space-y-2`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isBlocked || isErrored ? (
                                <ShieldBan size={16} className="text-rose-600 shrink-0" />
                              ) : isSkipped ? (
                                <CopyCheck size={16} className="text-amber-600 shrink-0" />
                              ) : isUpdated ? (
                                <RefreshCw size={16} className="text-indigo-600 shrink-0" />
                              ) : (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              )}
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate">{rep.label}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                              <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {d.detectedModule} • {Math.round(d.confidence * 100)}%
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {res?.message || d.reason}
                          </p>

                          {!isBlocked && renderExtractedPreview(d)}

                          {d.warnings && d.warnings.length > 0 && !isBlocked && (
                            <div className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                              <span>{d.warnings.join(' ')}</span>
                            </div>
                          )}

                          {!isBlocked && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {!res?.applied && !isSkipped && (
                                <button
                                  type="button"
                                  disabled={rep.applying}
                                  onClick={() => applySingleReport(rep.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {rep.applying ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Save size={12} />
                                  )}
                                  <span>{isErrored ? 'Retry Save' : 'Apply & Save Now'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openReportInManager(rep)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                <span>{res?.applied ? 'View in Manager' : isSkipped ? 'Open Existing Entry' : 'Review in Form'}</span>
                                <ArrowRight size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

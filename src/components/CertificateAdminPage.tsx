import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Upload, LogOut, Trash2, Edit2, Eye, EyeOff, Loader2, Plus, Save, Search, Award, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { auth, googleProvider, isUserAdmin } from '../services/academicFirebase';
import { markBundledCertificatesImported, removeCertificate, saveCertificate, subscribeToCertificates, uploadCertificateFile, uploadCertificateBlob } from '../services/certificateFirebase';
import { CERTIFICATE_CATEGORIES, type PortfolioCertificate } from '../types/certificate';
import { BUNDLED_CERTIFICATES } from '../data/certificates';

interface Props {
  onBack: () => void;
}

const blank = (): Omit<PortfolioCertificate, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  issuer: '',
  category: CERTIFICATE_CATEGORIES[0],
  description: '',
  issueDate: '',
  credentialId: '',
  credentialUrl: '',
  imageUrl: '',
  fileUrl: '',
  fileType: 'image',
  skills: [],
  featured: false,
  published: true,
  displayOrder: 100
});

export const CertificateAdminPage: React.FC<Props> = ({ onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<PortfolioCertificate[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Bulk import state with accurate progress tracking & stats
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [importStats, setImportStats] = useState({ total: 42, completed: 0, skipped: 0, failed: 0 });
  const [failedCertificates, setFailedCertificates] = useState<{ item: PortfolioCertificate; error: string }[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; imported: number; skipped: number; failed: number } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingCert, setDeletingCert] = useState<PortfolioCertificate | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !isUserAdmin(user)) {
      setItems([]);
      return;
    }
    return subscribeToCertificates(setItems, true);
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const change = (key: string, value: unknown) => setForm(old => ({ ...old, [key]: value }));

  const edit = (item: PortfolioCertificate) => {
    setEditing(item.id);
    setForm({ ...item, skills: item.skills || [] });
    setFile(null);
    showToast(`Editing "${item.title}"`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Defensive asset resolver that tries multiple path candidates to avoid subpath or SPA HTML fallback errors.
   */
  const fetchCertificateBlob = async (item: PortfolioCertificate): Promise<Blob> => {
    const cleanPath = (item.fileUrl || '').replace(/^\/+/, '');
    const baseUrl = import.meta.env.BASE_URL || '/';
    const prefixedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const assetFile = item.sourceAsset || `${item.id}.jpg`;

    const candidates = [
      `${prefixedBase}${cleanPath}`,
      item.fileUrl,
      `./certificates/${assetFile}`,
      `/certificates/${assetFile}`,
      `certificates/${assetFile}`
    ];

    const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));
    let lastError: any = null;

    for (const url of uniqueCandidates) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const cType = response.headers.get('content-type') || '';
        // If server returned index.html SPA fallback, that's not our image binary
        if (cType.includes('text/html')) continue;

        const blob = await response.blob();
        if (blob && blob.size > 500) {
          return blob;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Could not load local asset "${assetFile}".`);
  };

  /**
   * Processes a list of certificates in batches of 3 with duplicate detection,
   * granular progress tracking, and error isolation.
   */
  const processImportList = async (targetItems: PortfolioCertificate[]) => {
    if (!targetItems.length) return;
    setImporting(true);
    setImportSummary(null);
    setImportProgress(0);

    const totalCount = targetItems.length;
    let completedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const newFailures: { item: PortfolioCertificate; error: string }[] = [];

    setImportStats({
      total: totalCount,
      completed: 0,
      skipped: 0,
      failed: 0
    });

    const BATCH_SIZE = 3;

    try {
      for (let i = 0; i < targetItems.length; i += BATCH_SIZE) {
        const batch = targetItems.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(targetItems.length / BATCH_SIZE);

        setImportStage(`Processing batch ${batchNum} of ${totalBatches}...`);

        await Promise.all(
          batch.map(async item => {
            const fileName = item.sourceAsset || `${item.id}.jpg`;
            setCurrentFileName(fileName);

            // 1. Check for duplicates in existing items (Idempotent)
            const isDuplicate = items.some(x =>
              (x.id && x.id === item.id) ||
              (x.title?.trim().toLowerCase() === item.title?.trim().toLowerCase() &&
               x.issuer?.trim().toLowerCase() === item.issuer?.trim().toLowerCase()) ||
              (x.sourceAsset && item.sourceAsset && x.sourceAsset === item.sourceAsset)
            );

            if (isDuplicate) {
              skippedCount++;
              setImportStats(prev => ({ ...prev, skipped: skippedCount }));
              return;
            }

            // 2. Fetch local asset & Upload to Firebase Storage
            try {
              setImportStage(`Fetching asset ${fileName}...`);
              const blob = await fetchCertificateBlob(item);

              setImportStage(`Uploading ${fileName} to Storage...`);
              const downloadUrl = await uploadCertificateBlob(blob, fileName);

              setImportStage(`Saving ${item.title} to Firestore...`);
              const { id, createdAt, updatedAt, ...payload } = item;
              await saveCertificate(
                {
                  ...payload,
                  imageUrl: downloadUrl,
                  fileUrl: downloadUrl,
                  sourceAsset: fileName
                },
                item.id
              );

              completedCount++;
              setImportStats(prev => ({ ...prev, completed: completedCount }));
            } catch (err: any) {
              console.error(`Failed to import ${item.title}:`, err);
              const errMsg = err?.message || 'Upload failed';
              failedCount++;
              newFailures.push({ item, error: errMsg });
              setImportStats(prev => ({ ...prev, failed: failedCount }));
            } finally {
              const processedSoFar = completedCount + skippedCount + failedCount;
              setImportProgress(Math.min(99, Math.round((processedSoFar / totalCount) * 100)));
            }
          })
        );
      }

      // Mark metadata if any items were saved
      if (completedCount > 0) {
        try {
          await markBundledCertificatesImported();
        } catch (metaErr) {
          console.warn('Metadata mark failed:', metaErr);
        }
      }

      // Settle progress at 100% ONLY when entire batch loop finishes
      setImportProgress(100);
      setFailedCertificates(newFailures);

      const summary = {
        total: totalCount,
        imported: completedCount,
        skipped: skippedCount,
        failed: failedCount
      };
      setImportSummary(summary);

      if (failedCount === 0) {
        showToast(`Import completed successfully! ${completedCount} imported, ${skippedCount} skipped.`, 'success');
      } else {
        showToast(`Import finished: ${completedCount} imported, ${skippedCount} skipped, ${failedCount} failed. Review errors below.`, 'error');
      }
    } catch (globalErr: any) {
      console.error('Bulk import encountered a fatal error:', globalErr);
      showToast(globalErr?.message || 'Bulk import failed.', 'error');
    } finally {
      setImporting(false);
      setCurrentFileName('');
    }
  };

  const importBundled = async () => {
    if (!confirm(`Import ${BUNDLED_CERTIFICATES.length} bundled certificates into Firebase Storage and Firestore? Existing records will be skipped automatically.`)) return;
    await processImportList(BUNDLED_CERTIFICATES);
  };

  const retryFailedImports = async () => {
    if (!failedCertificates.length) return;
    const toRetry = failedCertificates.map(f => f.item);
    await processImportList(toRetry);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let url = form.fileUrl;
      if (file) {
        url = await uploadCertificateFile(file, setProgress);
      }
      if (!url) throw new Error('Please upload a certificate image or PDF.');
      await saveCertificate({ ...form, fileUrl: url, imageUrl: form.fileType === 'image' ? url : '', skills: form.skills }, editing);
      showToast(editing ? 'Certificate updated successfully.' : 'Certificate saved successfully.', 'success');
      setForm(blank());
      setEditing(undefined);
      setFile(null);
      setProgress(0);
    } catch (err: any) {
      showToast(err instanceof Error ? err.message : 'Could not save certificate.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCert) return;
    try {
      await removeCertificate(deletingCert);
      showToast(`Deleted "${deletingCert.title}" successfully.`, 'success');
      setDeletingCert(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete certificate.', 'error');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (!user) return (
    <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Award className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black">Certificate Manager</h1>
        <p className="text-slate-400 text-xs">Sign in with the authorized administrator Google account to manage professional certificates.</p>
        <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold shadow-lg shadow-indigo-600/30">Continue with Google</button>
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-white underline block mx-auto">Back to portfolio</button>
      </div>
    </main>
  );

  if (!isUserAdmin(user)) return (
    <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-slate-400 text-xs">This Google account is not authorized as an administrator.</p>
        <button onClick={() => signOut(auth)} className="text-xs underline text-indigo-400 font-bold">Sign out</button>
      </div>
    </main>
  );

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-xl border bg-slate-900/95 border-slate-700 text-white backdrop-blur-md">
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 mb-2 font-bold hover:underline">
            <ArrowLeft size={14} /> Back to Dashboard Overview
          </button>
          <h1 className="text-2xl font-black">Certificates Manager</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage professional credentials, categories, and public display visibility.</p>
        </div>
        <div className="flex items-center gap-3">
          {failedCertificates.length > 0 && !importing && (
            <button
              type="button"
              onClick={retryFailedImports}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Retry {failedCertificates.length} Failed</span>
            </button>
          )}
          <button
            type="button"
            disabled={importing}
            onClick={importBundled}
            className="rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {importing ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            <span>{importing ? `Importing ${importProgress}%` : items.length >= 42 ? 'Re-sync 42 Bundled Certificates' : 'Import 42 Bundled Certificates'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Import Progress Card */}
      {importing && (
        <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5 sm:p-6 space-y-4 shadow-sm animate-pulse-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-5 h-5 text-cyan-500 animate-spin shrink-0" />
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Bulk Import in Progress
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {importStage || 'Processing certificate catalog in safe batches of 3...'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                {importProgress}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">
                {importStats.completed + importStats.skipped + importStats.failed} of {importStats.total} processed
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${importProgress}%` }}
            />
          </div>

          {/* Granular Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Batch</span>
              <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{importStats.total}</span>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-emerald-500 block text-[10px] uppercase font-bold">Uploaded</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{importStats.completed}</span>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
              <span className="text-amber-500 block text-[10px] uppercase font-bold">Skipped (Existed)</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{importStats.skipped}</span>
            </div>
            <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20">
              <span className="text-rose-500 block text-[10px] uppercase font-bold">Errors</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{importStats.failed}</span>
            </div>
          </div>

          {currentFileName && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-cyan-500/10">
              <FileText size={12} className="text-cyan-500" />
              <span>Current file:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentFileName}</span>
            </div>
          )}
        </div>
      )}

      {/* Import Result Summary Card */}
      {importSummary && !importing && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {importSummary.failed === 0 ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {importSummary.failed === 0 ? 'Bulk Import Complete' : 'Bulk Import Completed with Warnings'}
                </h3>
                <p className="text-xs text-slate-500">
                  {importSummary.imported} certificates newly imported, {importSummary.skipped} already in database.
                </p>
              </div>
            </div>
            <button
              onClick={() => setImportSummary(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Catalog</span>
              <span className="font-black text-slate-900 dark:text-white text-lg">{importSummary.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50">
              <span className="text-emerald-500 block text-[10px] uppercase font-bold">Imported</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{importSummary.imported}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
              <span className="text-amber-500 block text-[10px] uppercase font-bold">Skipped (Duplicate)</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-lg">{importSummary.skipped}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/50">
              <span className="text-rose-500 block text-[10px] uppercase font-bold">Failed</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-lg">{importSummary.failed}</span>
            </div>
          </div>

          {failedCertificates.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-500">
                  {failedCertificates.length} certificate(s) failed to upload or save:
                </span>
                <button
                  type="button"
                  onClick={retryFailedImports}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw size={12} />
                  <span>Retry Failed Items</span>
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {failedCertificates.map((f, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{f.item.title}</span>
                    <span className="text-rose-500 font-mono text-[11px] shrink-0">{f.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
        {/* Form */}
        <form onSubmit={submit} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-sm h-fit">
          <h2 className="text-lg font-black">{editing ? 'Edit Certificate' : 'Add New Certificate'}</h2>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Title *</label>
              <input required value={form.title} onChange={e => change('title', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold" placeholder="e.g. AWS Certified Solutions Architect" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Issuer *</label>
              <input required value={form.issuer} onChange={e => change('issuer', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold" placeholder="e.g. Amazon Web Services" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Category *</label>
              <select value={form.category} onChange={e => change('category', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold">
                {CERTIFICATE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Issue Date</label>
              <input type="date" value={form.issueDate} onChange={e => change('issueDate', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Skills (comma separated)</label>
            <input value={form.skills.join(', ')} onChange={e => change('skills', e.target.value.split(',').map(v => v.trim()).filter(Boolean))} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-medium" placeholder="Python, TensorFlow, Cloud" />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => change('description', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-medium" placeholder="Summary of learning outcomes..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Credential ID</label>
              <input value={form.credentialId || ''} onChange={e => change('credentialId', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Verification URL</label>
              <input type="url" value={form.credentialUrl || ''} onChange={e => change('credentialUrl', e.target.value)} className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-medium" placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Certificate File (JPG, PNG, WEBP or PDF; max 15 MB) *</label>
            <input
              required={!form.fileUrl}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) {
                  if (f.size > 15 * 1024 * 1024) {
                    showToast('File must be smaller than 15 MB.', 'error');
                    setFile(null);
                    e.currentTarget.value = '';
                    return;
                  }
                  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)) {
                    showToast('Only JPG, PNG, WEBP or PDF files are accepted.', 'error');
                    setFile(null);
                    e.currentTarget.value = '';
                    return;
                  }
                  setProgress(0);
                  change('fileType', f.type === 'application/pdf' ? 'pdf' : 'image');
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-slate-800 dark:file:text-indigo-400"
            />
            {progress > 0 && (
              <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-bold pt-2">
            <label className="flex gap-2 items-center cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => change('featured', e.target.checked)} className="rounded text-indigo-600" />
              Featured Certificate
            </label>
            <label className="flex gap-2 items-center cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={e => change('published', e.target.checked)} className="rounded text-indigo-600" />
              Publish Publicly
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button disabled={busy} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 flex justify-center gap-2 items-center disabled:opacity-50">
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{busy ? 'Saving...' : 'Save Certificate'}</span>
            </button>
            {editing && (
              <button type="button" onClick={() => { setForm(blank()); setEditing(undefined); setFile(null); }} className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Saved List */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Saved Certificates</h2>
              <span className="text-xs text-slate-400">{filteredItems.length} of {items.length} records</span>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search saved..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', ...CERTIFICATE_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400">No certificates match your search.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredItems.map(item => (
                <article key={item.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    {item.fileUrl && item.fileType === 'image' && (
                      <img src={item.fileUrl} alt={item.title} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800" />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs truncate text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="text-[11px] text-slate-500 truncate">{item.issuer} · {item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black uppercase rounded-full px-2.5 py-1 ${item.published ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                    <button onClick={() => edit(item)} title="Edit" className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => saveCertificate({ ...item, published: !item.published }, item.id)} title={item.published ? 'Unpublish' : 'Publish'} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
                      {item.published ? <EyeOff size={13} className="text-amber-500" /> : <Eye size={13} className="text-emerald-500" />}
                    </button>
                    <button onClick={() => setDeletingCert(item)} title="Delete" className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingCert && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Delete Certificate?</h3>
              <p className="text-xs text-slate-500">Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deletingCert.title}"</strong>?</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeletingCert(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">Confirm Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Terminal,
  ExternalLink,
  Database,
  CloudUpload,
  Plus,
  ShieldCheck,
  Zap,
  Check,
  XCircle,
  Sparkles,
  Star,
  ChevronsUp
} from 'lucide-react';
import { AIScanner } from './admin/AIScanner';
import { useAIScanner } from '../context/AIScannerContext';
import { auth, googleProvider, isUserAdmin } from '../services/academicFirebase';
import { bulkScanCertificates, detectVerificationUrl, isIndividualVerificationUrl } from '../services/verificationDetection';
import {
  markBundledCertificatesImported,
  removeCertificate,
  saveCertificate,
  reindexCertificatesInFirestore,
  subscribeToCertificates,
  testSingleCertificateDiagnostic,
  resolveCertificateUrl,
  resolveCertificatePreviewImageUrl,
  resolveCertificateOriginalFileUrl,
  type ImportDiagnostic
} from '../services/certificateFirebase';
import { uploadFileProxy, validateFile } from '../services/supabaseStorage';
import { CERTIFICATE_CATEGORIES, type PortfolioCertificate } from '../types/certificate';
import { BUNDLED_CERTIFICATES } from '../data/certificates';

interface Props {
  onBack: () => void;
}

const blank = (nextOrder = 0): Omit<PortfolioCertificate, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  issuer: '',
  category: CERTIFICATE_CATEGORIES[0],
  description: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  verificationCode: '',
  credentialUrl: '',
  suggestedCredentialUrl: '',
  verificationStatus: 'approved',
  imageUrl: '',
  fileUrl: '',
  fileType: 'image',
  grade: '',
  score: '',
  assignmentScore: '',
  examScore: '',
  credits: '',
  duration: '',
  totalCandidates: '',
  coordinator: '',
  skills: [],
  featured: false,
  published: true,
  displayOrder: nextOrder
});

export const CertificateAdminPage: React.FC<Props> = ({ onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<PortfolioCertificate[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Bulk import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState('');
  const [importStats, setImportStats] = useState({ total: BUNDLED_CERTIFICATES.length, completed: 0, skipped: 0, failed: 0 });
  const [failedCertificates, setFailedCertificates] = useState<{ item: PortfolioCertificate; error: string }[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; imported: number; skipped: number; failed: number } | null>(null);

  // Diagnostic Test state
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<ImportDiagnostic | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingCert, setDeletingCert] = useState<PortfolioCertificate | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);
  const { pendingResult, setPendingResult } = useAIScanner();

  useEffect(() => {
    if (pendingResult && (pendingResult.detectedModule === 'certificate' || pendingResult.detectedModule === 'certificates')) {
      handleAIExtractedData(pendingResult);
      if (pendingResult.sourceFile) setFile(pendingResult.sourceFile);
      setPendingResult(null);
    }
  }, [pendingResult]);

  const handleAIExtractedData = (result: any) => {
    if (!result || !result.data) return;
    const data = result.data;
    setForm(prev => {
      const next = {
        ...prev,
        title: data.title || prev.title,
        issuer: data.issuer || prev.issuer,
        category: data.category || prev.category,
        issueDate: data.issueDate || prev.issueDate,
        credentialId: data.credentialId || prev.credentialId,
        credentialUrl: data.credentialUrl || prev.credentialUrl,
        skills: data.skills || prev.skills,
        description: data.description || prev.description
      };
      if (!next.credentialUrl && next.credentialId) {
        const autoUrl = detectVerificationUrl({ ...next, id: 'temp' } as PortfolioCertificate);
        if (autoUrl) next.credentialUrl = autoUrl;
      }
      return next;
    });
    showToast('AI extracted certificate data and auto-linked verification URL.', 'success');
  };

  const runBulkScan = async () => {
    setScanning(true);
    try {
      const suggestions = bulkScanCertificates(items);
      if (suggestions.length === 0) {
        showToast('All verifiable certificates already have approved verification links.', 'info');
        return;
      }

      let count = 0;
      for (const update of suggestions) {
        await saveCertificate(update as any, update.id);
        count++;
      }
      showToast(`Auto-linked and approved ${count} verification URLs.`, 'success');
    } catch (err: any) {
      showToast(`Scan failed: ${err.message}`, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleApproveLink = async (item: PortfolioCertificate) => {
    if (!item.suggestedCredentialUrl || !isIndividualVerificationUrl(item.suggestedCredentialUrl)) {
      showToast('This is not a credential-specific verification URL. Please verify the official link manually.', 'error');
      return;
    }
    try {
      await saveCertificate(
        {
          ...item,
          credentialUrl: item.suggestedCredentialUrl,
          suggestedCredentialUrl: '',
          verificationStatus: 'approved'
        } as any,
        item.id
      );
      showToast('Link approved and published.', 'success');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    }
  };

  const handleRejectLink = async (item: PortfolioCertificate) => {
    try {
      await saveCertificate(
        {
          ...item,
          suggestedCredentialUrl: '',
          verificationStatus: 'rejected'
        } as any,
        item.id
      );
      showToast('Suggestion rejected.', 'info');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !isUserAdmin(user)) {
      setItems([]);
      return;
    }
    return subscribeToCertificates(loaded => {
      setItems(loaded);
      setForm(prev => (!editing && !prev.title ? { ...prev, displayOrder: loaded.length } : prev));
    }, true);
  }, [user, editing]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const change = (key: string, value: unknown) => {
    setForm(old => {
      const next = { ...old, [key]: value };
      if ((key === 'credentialId' || key === 'issuer' || key === 'verificationCode') && !next.credentialUrl) {
        const auto = detectVerificationUrl({ ...next, id: 'preview' } as PortfolioCertificate);
        if (auto) {
          next.credentialUrl = auto;
          next.verificationStatus = 'approved';
        }
      }
      return next;
    });
  };

  const edit = (item: PortfolioCertificate) => {
    setEditing(item.id);
    setForm({
      ...blank(),
      ...item,
      skills: item.skills || []
    });
    setFile(null);
    showToast(`Editing "${item.title}"`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runSingleCertificateTest = async () => {
    setDiagnosticOpen(true);
    setDiagnosticRunning(true);
    setDiagnosticResult(null);
    try {
      const result = await testSingleCertificateDiagnostic(user);
      setDiagnosticResult(result);
      if (result.success) {
        showToast('Supabase + Firestore bridge verified!', 'success');
      } else {
        showToast('Diagnostic failed. Check report.', 'error');
      }
    } catch (err: any) {
      showToast(`System error: ${err.message}`, 'error');
    } finally {
      setDiagnosticRunning(false);
    }
  };

  /**
   * Syncs all 43 bundled certificates (including NPTEL Programming in Java Elite at #1)
   * and their enriched metadata/verification links into Firestore.
   */
  const processImportList = async (targetItems: PortfolioCertificate[]) => {
    if (!targetItems.length) return;
    const idToken = await user?.getIdToken();
    if (!idToken) {
      showToast('Session expired. Please sign in again.', 'error');
      return;
    }

    setImporting(true);
    setImportSummary(null);
    setImportProgress(0);

    const totalCount = targetItems.length;
    let completedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const newFailures: { item: PortfolioCertificate; error: string }[] = [];

    setImportStats({ total: totalCount, completed: 0, skipped: 0, failed: 0 });

    const BATCH_SIZE = 4;

    try {
      for (let i = 0; i < targetItems.length; i += BATCH_SIZE) {
        const batch = targetItems.slice(i, i + BATCH_SIZE);
        setImportStage(`Syncing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(targetItems.length / BATCH_SIZE)}...`);

        await Promise.all(
          batch.map(async item => {
            const duplicate = items.find(
              x =>
                x.id === item.id ||
                (x.sourceAsset && item.sourceAsset && x.sourceAsset === item.sourceAsset) ||
                (x.title.toLowerCase() === item.title.toLowerCase() && x.issuer.toLowerCase() === item.issuer.toLowerCase())
            );

            try {
              const { id, createdAt, updatedAt, ...payload } = item;
              await saveCertificate(
                {
                  ...payload,
                  imageUrl: duplicate?.imageUrl && !duplicate.imageUrl.endsWith('.pdf') ? duplicate.imageUrl : item.imageUrl,
                  fileUrl: duplicate?.fileUrl || item.fileUrl,
                  sourceAsset: item.sourceAsset || `${item.id}.jpg`,
                  published: duplicate ? duplicate.published !== false : true
                },
                duplicate?.id || item.id
              );

              completedCount++;
              setImportStats(prev => ({ ...prev, completed: completedCount }));
            } catch (err: any) {
              failedCount++;
              newFailures.push({ item, error: err.message || 'Sync failed' });
              setImportStats(prev => ({ ...prev, failed: failedCount }));
            } finally {
              const processed = completedCount + skippedCount + failedCount;
              setImportProgress(Math.round((processed / totalCount) * 100));
            }
          })
        );
      }

      if (completedCount > 0) await markBundledCertificatesImported();

      setFailedCertificates(newFailures);
      setImportSummary({ total: totalCount, imported: completedCount, skipped: skippedCount, failed: failedCount });
      showToast(
        failedCount === 0
          ? `Successfully synced all ${completedCount} certificates & verification links!`
          : 'Sync completed with warnings.',
        failedCount === 0 ? 'success' : 'error'
      );
    } catch (err: any) {
      showToast(err.message || 'Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const importBundled = () => {
    processImportList(BUNDLED_CERTIFICATES);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToken = await user?.getIdToken();
    if (!idToken) return showToast('Session expired.', 'error');

    if (form.credentialUrl) {
      let parsed: URL;
      try {
        parsed = new URL(form.credentialUrl);
      } catch {
        return showToast('Enter a valid credential verification URL.', 'error');
      }
      if (parsed.protocol !== 'https:') return showToast('Credential verification links must use HTTPS.', 'error');
    }
    if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate) {
      return showToast('Expiry date cannot be earlier than issue date.', 'error');
    }

    setBusy(true);
    try {
      let imageUrl = form.imageUrl;
      let fileUrl = form.fileUrl;

      if (file) {
        validateFile(file, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], 15 * 1024 * 1024);
        const { path, url } = await uploadFileProxy(file, 'certificates', idToken);
        imageUrl = url;
        fileUrl = path;
      }

      if (!fileUrl && !form.sourceAsset && !imageUrl) {
        throw new Error('Please upload a file or specify a source asset / image URL.');
      }

      const payload = {
        ...form,
        imageUrl: imageUrl || resolveCertificateUrl(form.sourceAsset || ''),
        fileUrl: fileUrl || form.sourceAsset || imageUrl || '',
        fileType: file ? (file.type === 'application/pdf' ? 'pdf' : 'image') : form.fileType
      };

      const savedId = await saveCertificate(payload, editing);

      // Automatically insert at requested displayOrder and re-sequence all serial numbers (0, 1, 2... N-1)
      const currentOrdered = [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
      const withoutSaved = currentOrdered.filter(c => c.id !== savedId);
      const targetIndex = Math.max(0, Math.min(withoutSaved.length, Number(form.displayOrder) ?? withoutSaved.length));
      const savedRecord: PortfolioCertificate = {
        ...(currentOrdered.find(c => c.id === savedId) || {}),
        ...payload,
        id: savedId,
        displayOrder: targetIndex
      };

      withoutSaved.splice(targetIndex, 0, savedRecord);
      const reindexed = withoutSaved.map((c, idx) => ({ ...c, displayOrder: idx }));
      setItems(reindexed);
      await reindexCertificatesInFirestore(reindexed);

      showToast(
        editing
          ? `Certificate updated at Serial #${String(targetIndex + 1).padStart(2, '0')}.`
          : `Certificate added at Serial #${String(targetIndex + 1).padStart(2, '0')}.`,
        'success'
      );
      setForm(blank(reindexed.length));
      setEditing(undefined);
      setFile(null);
    } catch (err: any) {
      showToast(err.message || 'Save failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCert) return;
    const target = deletingCert;
    const prevOrdered = [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
    const remaining = prevOrdered
      .filter(c => c.id !== target.id)
      .map((c, idx) => ({ ...c, displayOrder: idx }));

    // Optimistic UI update with recalculated serial numbers
    setItems(remaining);
    setDeletingCert(null);

    try {
      await removeCertificate(target, remaining);
      showToast('Certificate deleted and all serial numbers automatically updated.', 'success');
    } catch (err: any) {
      setItems(prevOrdered);
      showToast(err.message || 'Delete failed.', 'error');
    }
  };

  const toggleFeatured = async (item: PortfolioCertificate) => {
    const newFeatured = !item.featured;
    setItems(prev => prev.map(c => c.id === item.id ? { ...c, featured: newFeatured } : c));
    try {
      const { id, ...data } = item;
      await saveCertificate({ ...data, featured: newFeatured }, id);
      showToast(newFeatured ? `"${item.title}" marked as Featured ⭐` : `"${item.title}" unfeatured.`, 'success');
    } catch (err: any) {
      setItems(prev => prev.map(c => c.id === item.id ? { ...c, featured: item.featured } : c));
      showToast(err.message || 'Could not update featured status.', 'error');
    }
  };

  const togglePublished = async (item: PortfolioCertificate) => {
    const newPub = !item.published;
    setItems(prev => prev.map(c => c.id === item.id ? { ...c, published: newPub } : c));
    try {
      const { id, ...data } = item;
      await saveCertificate({ ...data, published: newPub }, id);
      showToast(newPub ? `"${item.title}" is now visible.` : `"${item.title}" hidden from public view.`, 'success');
    } catch (err: any) {
      setItems(prev => prev.map(c => c.id === item.id ? { ...c, published: item.published } : c));
      showToast(err.message || 'Could not update visibility.', 'error');
    }
  };

  const moveCertificate = async (item: PortfolioCertificate, direction: -1 | 1) => {
    const ordered = [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
    const index = ordered.findIndex(entry => entry.id === item.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;

    const list = [...ordered];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    const reindexed = list.map((c, idx) => ({ ...c, displayOrder: idx }));

    // Optimistic UI update for immediate response
    setItems(reindexed);

    try {
      const a = reindexed[index];
      const b = reindexed[targetIndex];
      const { id: aId, ...aData } = a;
      const { id: bId, ...bData } = b;
      await Promise.all([
        saveCertificate({ ...aData, displayOrder: a.displayOrder }, aId),
        saveCertificate({ ...bData, displayOrder: b.displayOrder }, bId)
      ]);
      showToast(
        `Moved "${item.title}" to Serial #${String(targetIndex + 1).padStart(2, '0')}.`,
        'success'
      );
    } catch (err: any) {
      setItems(ordered);
      showToast(err.message || 'Could not update certificate order.', 'error');
    }
  };

  const moveToFirst = async (item: PortfolioCertificate) => {
    const ordered = [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
    const index = ordered.findIndex(entry => entry.id === item.id);
    if (index <= 0) return;

    const remaining = ordered.filter(c => c.id !== item.id);
    const next = [item, ...remaining].map((c, idx) => ({ ...c, displayOrder: idx }));

    // Optimistic UI update
    setItems(next);

    try {
      await reindexCertificatesInFirestore(next);
      showToast(`"${item.title}" moved to #01 Start position and all serial numbers updated!`, 'success');
    } catch (err: any) {
      setItems(ordered);
      showToast(err.message || 'Could not pin certificate to start.', 'error');
    }
  };

  const orderedItems = [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
  const filteredItems = orderedItems.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.credentialId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (selectedCategory === 'All' || item.category === selectedCategory);
  });

  if (!user || !isUserAdmin(user))
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white grid place-items-center p-6 text-center">
        {!user ? (
          <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4 shadow-xl">
            <Award className="w-12 h-12 text-indigo-400 mx-auto" />
            <h1 className="text-2xl font-black">Admin Access Required</h1>
            <button
              onClick={async () => {
                try {
                  await signInWithPopup(auth, googleProvider);
                } catch (err: any) {
                  console.error('Sign-in error:', err);
                  showToast(`Sign-in failed: ${err.message}`, 'error');
                }
              }}
              className="w-full rounded-xl bg-indigo-600 text-white py-3 font-bold"
            >
              Sign in with Google
            </button>
            <button onClick={onBack} className="text-xs text-slate-400 underline">
              Back to portfolio
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-rose-500">Access Denied</h1>
            <p className="text-slate-400 text-xs">Account {user.email} is not authorized.</p>
            <button onClick={() => signOut(auth)} className="text-xs font-bold text-indigo-400 underline">
              Sign out
            </button>
          </div>
        )}
      </main>
    );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-xl border bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white backdrop-blur-md max-w-[90vw]">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 font-bold hover:underline mb-2"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Certificate CMS</h1>
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold">
            <Database size={14} />
            <span>{items.length} Total Credentials · Auto-Linked Verification System</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={runBulkScan}
            disabled={scanning || importing}
            className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            {scanning ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
            Auto-Detect Links
          </button>
          <button
            onClick={runSingleCertificateTest}
            disabled={diagnosticRunning || importing}
            className="rounded-2xl border border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-3 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            {diagnosticRunning ? <Loader2 className="animate-spin" size={14} /> : <Terminal size={14} />}
            Test Bridge
          </button>
          <button
            onClick={importBundled}
            disabled={importing}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            {importing ? <Loader2 className="animate-spin" size={14} /> : <CloudUpload size={14} />}
            Sync All {BUNDLED_CERTIFICATES.length} Certificates & Links
          </button>
        </div>
      </div>

      {/* Progress Card */}
      {importing && (
        <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-6 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-widest">
                Firestore Synchronization
              </span>
              <p className="text-xs text-slate-900 dark:text-white font-bold">{importStage}</p>
            </div>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">{importProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
          </div>
        </div>
      )}

      {importSummary && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            Synced {importSummary.imported} of {importSummary.total} certificates to Firestore ({failedCertificates.length} errors).
          </span>
          <button onClick={() => setImportSummary(null)} className="text-slate-400 hover:text-white font-bold">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.95fr] gap-8">
        {/* Form */}
        <form
          onSubmit={submit}
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-5 h-fit xl:sticky xl:top-2 xl:max-h-[calc(100dvh-6.5rem)] xl:overflow-y-auto xl:overscroll-contain custom-scrollbar shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {editing ? 'Edit Certificate' : 'Add Certificate'}
            </h2>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {editing ? <Edit2 size={18} /> : <Plus size={18} />}
            </div>
          </div>

          {/* AI Auto-Fill Trigger */}
          <div className="bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  AI Certificate Scanner
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Scan certificate image/PDF to auto-extract details & verification link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAIScannerOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Scan
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => change('title', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="Programming in Java — NPTEL Elite"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Issuer *</label>
                <input
                  required
                  value={form.issuer}
                  onChange={e => change('issuer', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="NPTEL · IIT Kharagpur"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category *</label>
                <select
                  value={form.category}
                  onChange={e => change('category', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                >
                  {CERTIFICATE_CATEGORIES.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={e => change('issueDate', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Serial # (Position)</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, items.length + (editing ? 0 : 1))}
                  step="1"
                  value={(form.displayOrder ?? items.length) + 1}
                  onChange={e => change('displayOrder', Math.max(0, (Number(e.target.value) || 1) - 1))}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Roll No / Credential ID
                </label>
                <input
                  value={form.credentialId || ''}
                  onChange={e => change('credentialId', e.target.value.trim())}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white font-mono"
                  placeholder="NPTEL26CS153S1262000875"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Verification Code (Optional)
                </label>
                <input
                  value={form.verificationCode || ''}
                  onChange={e => change('verificationCode', e.target.value.trim())}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white font-mono"
                  placeholder="NOC-TYQF-10FH-WWG48"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Credential Verification URL
                </label>
                <input
                  type="url"
                  value={form.credentialUrl || ''}
                  onChange={e => change('credentialUrl', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="https://nptel.ac.in/verify/NOC-TYQF-10FH-WWG48"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Verification Status
                </label>
                <select
                  value={form.verificationStatus || 'approved'}
                  onChange={e => change('verificationStatus', e.target.value || undefined)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="approved">Approved / Verified</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected / Unverified</option>
                </select>
              </div>
            </div>

            {/* Academic / NPTEL Score & Credits Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Grade / Badge</label>
                <input
                  value={form.grade || ''}
                  onChange={e => change('grade', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  placeholder="ELITE"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Score</label>
                <input
                  value={form.score || ''}
                  onChange={e => change('score', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  placeholder="78%"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Credits</label>
                <input
                  value={form.credits || ''}
                  onChange={e => change('credits', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  placeholder="4 Credits"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Assignments</label>
                <input
                  value={form.assignmentScore || ''}
                  onChange={e => change('assignmentScore', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  placeholder="24.94/25"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Proctored Exam</label>
                <input
                  value={form.examScore || ''}
                  onChange={e => change('examScore', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  placeholder="52.5/75"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Duration</label>
                <input
                  value={form.duration || ''}
                  onChange={e => change('duration', e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  placeholder="12 Weeks (Jul–Oct 2026)"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Certificate File (Image or PDF)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-slate-800 dark:file:text-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Skills (Comma Separated)
              </label>
              <input
                value={form.skills.join(', ')}
                onChange={e =>
                  change(
                    'skills',
                    e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                placeholder="Java, Object-Oriented Programming, Data Structures"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => change('description', e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-white"
                placeholder="Achievement summary..."
              />
            </div>

            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => change('featured', e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-600"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={e => change('published', e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-600"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Published</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={busy}
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-black text-white shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{editing ? 'Update Certificate' : 'Save Certificate'}</span>
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setForm(blank());
                  setEditing(undefined);
                  setFile(null);
                }}
                className="px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Certificates ({filteredItems.length} / {items.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search title, issuer, ID..."
                  className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white w-full sm:w-56"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="All">All Categories</option>
                {CERTIFICATE_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredItems.map((item) => {
              const previewUrl = resolveCertificatePreviewImageUrl(item);
              const originalUrl = resolveCertificateOriginalFileUrl(item);
              const verifyUrl = item.credentialUrl || detectVerificationUrl(item) || '';
              const trueIndex = orderedItems.findIndex(c => c.id === item.id);
              const serialNumber = trueIndex >= 0 ? trueIndex + 1 : (item.displayOrder ?? 0) + 1;

              return (
                <article
                  key={item.id}
                  className={`group rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                    serialNumber === 1
                      ? 'border-indigo-500/60 bg-indigo-50/20 dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-16 h-14 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center"
                      title="Open original file"
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt={item.title} className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="text-indigo-500" size={22} />
                      )}
                    </a>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-cyan-400 px-1.5 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 tabular-nums">
                          #{String(serialNumber).padStart(2, '0')}
                        </span>
                        {item.featured && (
                          <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            ★ FEATURED
                          </span>
                        )}
                        {orderedItems[0]?.id === item.id && (
                          <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-cyan-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            TOP #1 START
                          </span>
                        )}
                        {item.grade && (
                          <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                            · {item.grade} {item.score || ''}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-slate-500">
                        <span className="truncate">{item.issuer}</span>
                        <span>·</span>
                        <span className="text-indigo-500 dark:text-indigo-400">{item.category}</span>
                        {item.credentialId && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">ID: {item.credentialId}</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-0.5">
                        {verifyUrl && (
                          <a
                            href={verifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <ShieldCheck size={12} />
                            <span>Verify Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                        <a
                          href={originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
                        >
                          <FileText size={12} />
                          <span>Original File</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>

                      {item.suggestedCredentialUrl && (
                        <div className="mt-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-widest flex items-center gap-1">
                              <Zap size={9} /> Suggested Link
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleApproveLink(item)}
                                className="p-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                title="Approve & Publish"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectLink(item)}
                                className="p-1 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30 transition-colors"
                                title="Reject Suggestion"
                              >
                                <XCircle size={11} />
                              </button>
                            </div>
                          </div>
                          <a
                            href={item.suggestedCredentialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white truncate block"
                          >
                            {item.suggestedCredentialUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Item Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* 1. Star / Featured Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleFeatured(item)}
                      title={item.featured ? 'Featured Certificate (Click to remove star)' : 'Star as Featured Certificate'}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        item.featured
                          ? 'text-amber-500 bg-amber-500/20 hover:bg-amber-500/30 ring-1 ring-amber-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-amber-500 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10'
                      }`}
                    >
                      <Star size={15} className={item.featured ? 'fill-amber-400 text-amber-500' : ''} />
                    </button>

                    {/* 2. Move to Start / Top (#1 Position) Button */}
                    {orderedItems[0]?.id !== item.id && (
                      <button
                        type="button"
                        onClick={() => moveToFirst(item)}
                        title="Move to Start (#1 Top Position)"
                        className="p-2 rounded-xl text-indigo-600 dark:text-cyan-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer transition-all"
                      >
                        <ChevronsUp size={15} />
                      </button>
                    )}

                    {/* 3. Move Up (Idhar) */}
                    <button
                      type="button"
                      onClick={() => moveCertificate(item, -1)}
                      disabled={orderedItems[0]?.id === item.id}
                      title="Move up one position"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-25 cursor-pointer transition-all"
                    >
                      <ArrowUp size={15} />
                    </button>

                    {/* 4. Move Down (Udhar) */}
                    <button
                      type="button"
                      onClick={() => moveCertificate(item, 1)}
                      disabled={orderedItems[orderedItems.length - 1]?.id === item.id}
                      title="Move down one position"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-25 cursor-pointer transition-all"
                    >
                      <ArrowDown size={15} />
                    </button>

                    {/* 5. Publish / Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => togglePublished(item)}
                      title={item.published !== false ? 'Published (Click to hide from public)' : 'Hidden (Click to publish)'}
                      className={`p-2 rounded-xl cursor-pointer transition-all ${
                        item.published !== false
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      }`}
                    >
                      {item.published !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => edit(item)}
                      title="Edit Certificate"
                      className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCert(item)}
                      title="Delete Certificate"
                      className="p-2 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Diagnostic Modal */}
      <AnimatePresence>
        {diagnosticOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Supabase + Firestore Diagnostic</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Verifying Storage proxy and Firestore persistence.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDiagnosticOpen(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              {diagnosticRunning ? (
                <div className="py-12 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Testing End-to-End Bridge...</p>
                </div>
              ) : diagnosticResult ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-2xl flex items-start gap-3 ${
                      diagnosticResult.success
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {diagnosticResult.success ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                    <div>
                      <p className="text-sm font-bold">
                        {diagnosticResult.success ? 'System Operational' : 'Diagnostic Report'}
                      </p>
                      <p className="text-xs opacity-90 mt-1">{diagnosticResult.details}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingCert && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Delete Certificate?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Removing <span className="text-slate-900 dark:text-white font-bold">"{deletingCert.title}"</span> will delete the record from Firestore.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCert(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIScanner isOpen={isAIScannerOpen} onClose={() => setIsAIScannerOpen(false)} />
    </div>
  );
};

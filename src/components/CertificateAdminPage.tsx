import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
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
  RefreshCw,
  FileText,
  Terminal,
  ExternalLink,
  Info,
  Database,
  CloudUpload,
  Plus
} from 'lucide-react';
import { auth, googleProvider, isUserAdmin, ADMIN_EMAIL } from '../services/academicFirebase';
import {
  markBundledCertificatesImported,
  removeCertificate,
  saveCertificate,
  subscribeToCertificates,
  testSingleCertificateDiagnostic,
  resolveCertificateUrl,
  type ImportDiagnostic
} from '../services/certificateFirebase';
import { uploadFileProxy, validateFile } from '../services/supabaseStorage';
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
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Bulk import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState('');
  const [importStats, setImportStats] = useState({ total: 42, completed: 0, skipped: 0, failed: 0 });
  const [failedCertificates, setFailedCertificates] = useState<{ item: PortfolioCertificate; error: string }[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; imported: number; skipped: number; failed: number } | null>(null);

  // Diagnostic Test state
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<ImportDiagnostic | null>(null);

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
   * Imports certificates into Supabase Storage and Firestore.
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

    const BATCH_SIZE = 3; // Smaller batches for storage uploads

    try {
      for (let i = 0; i < targetItems.length; i += BATCH_SIZE) {
        const batch = targetItems.slice(i, i + BATCH_SIZE);
        setImportStage(`Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        await Promise.all(
          batch.map(async item => {
            // Check for duplicates in Firestore
            const isDuplicate = items.some(x => x.id === item.id || (x.title === item.title && x.issuer === item.issuer));
            if (isDuplicate) {
              skippedCount++;
              setImportStats(prev => ({ ...prev, skipped: skippedCount }));
              return;
            }

            try {
              // 1. Fetch local asset
              const assetUrl = `/certificates/${item.sourceAsset || `${item.id}.jpg`}`;
              const response = await fetch(assetUrl);
              if (!response.ok) throw new Error(`Local asset not found: ${assetUrl}`);
              const blob = await response.blob();
              const file = new File([blob], item.sourceAsset || `${item.id}.jpg`, { type: 'image/jpeg' });

              // 2. Upload to Supabase
              const { path, url } = await uploadFileProxy(file, 'certificates', idToken);

              // 3. Save to Firestore
              const { id, createdAt, updatedAt, ...payload } = item;
              await saveCertificate({
                ...payload,
                imageUrl: url,
                fileUrl: path, // Save the path for future deletion/signed-urls
                sourceAsset: item.sourceAsset || `${item.id}.jpg`,
                published: true
              }, item.id);

              completedCount++;
              setImportStats(prev => ({ ...prev, completed: completedCount }));
            } catch (err: any) {
              failedCount++;
              newFailures.push({ item, error: err.message || 'Import failed' });
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
      showToast(failedCount === 0 ? 'Sync completed successfully!' : 'Sync completed with warnings.', failedCount === 0 ? 'success' : 'error');
    } catch (err: any) {
      showToast(err.message || 'Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const importBundled = () => {
    if (!confirm(`Import ${BUNDLED_CERTIFICATES.length} certificates into Supabase and Firestore? Existing records will be skipped.`)) return;
    processImportList(BUNDLED_CERTIFICATES);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToken = await user?.getIdToken();
    if (!idToken) return showToast('Session expired.', 'error');

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

      if (!fileUrl && !form.sourceAsset) {
        throw new Error('Please upload a file or specify a source asset.');
      }

      await saveCertificate({ 
        ...form, 
        imageUrl: imageUrl || resolveCertificateUrl(form.sourceAsset || ''), 
        fileUrl: fileUrl || form.sourceAsset || '' 
      }, editing);
      
      showToast(editing ? 'Certificate updated.' : 'Certificate saved.', 'success');
      setForm(blank());
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
    try {
      await removeCertificate(deletingCert);
      showToast('Record and storage asset removed.', 'success');
      setDeletingCert(null);
    } catch (err: any) {
      showToast(err.message || 'Delete failed.', 'error');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (selectedCategory === 'All' || item.category === selectedCategory);
  });

  if (!user || !isUserAdmin(user)) return (
    <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6 text-center">
      {!user ? (
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-4">
          <Award className="w-12 h-12 text-indigo-400 mx-auto" />
          <h1 className="text-2xl font-black">Admin Access Required</h1>
          <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full rounded-xl bg-indigo-600 py-3 font-bold">Sign in with Google</button>
          <button onClick={onBack} className="text-xs text-slate-400 underline">Back to portfolio</button>
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-rose-500">Access Denied</h1>
          <p className="text-slate-400 text-xs">Account {user.email} is not authorized.</p>
          <button onClick={() => signOut(auth)} className="text-xs font-bold text-indigo-400 underline">Sign out</button>
        </div>
      )}
    </main>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-xl border bg-slate-900/95 border-slate-700 text-white backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button onClick={onBack} className="text-xs text-indigo-400 flex items-center gap-1.5 font-bold hover:underline mb-2">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black">Certificate CMS</h1>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
            <Database size={14} />
            <span>Supabase Storage + Firestore Bridge</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={runSingleCertificateTest} disabled={diagnosticRunning || importing} className="rounded-2xl border border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 px-4 py-3 text-xs font-bold flex items-center gap-2">
            {diagnosticRunning ? <Loader2 className="animate-spin" size={14} /> : <Terminal size={14} />}
            Test Supabase Bridge
          </button>
          <button onClick={importBundled} disabled={importing} className="rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 text-xs font-bold shadow-lg flex items-center gap-2">
            {importing ? <Loader2 className="animate-spin" size={14} /> : <CloudUpload size={14} />}
            {items.length >= 42 ? 'Migrate 42 Certificates to Supabase' : 'Bulk Import to Supabase'}
          </button>
        </div>
      </div>

      {/* Progress Card */}
      {importing && (
        <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-6 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Supabase Migration</span>
              <p className="text-xs text-white font-bold">{importStage}</p>
            </div>
            <span className="text-2xl font-black text-cyan-400">{importProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8">
        {/* Form */}
        <form onSubmit={submit} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 h-fit sticky top-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">{editing ? 'Edit Certificate' : 'Add Certificate'}</h2>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              {editing ? <Edit2 size={18} /> : <Plus size={18} />}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Title *</label>
                <input required value={form.title} onChange={e => change('title', e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" placeholder="Certificate Name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Issuer *</label>
                <input required value={form.issuer} onChange={e => change('issuer', e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" placeholder="Provider" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Category *</label>
                <select value={form.category} onChange={e => change('category', e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white">
                  {CERTIFICATE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Issue Date</label>
                <input type="date" value={form.issueDate} onChange={e => change('issueDate', e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Certificate File (Supabase Storage) *</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-slate-800 dark:file:text-indigo-400"
              />
              {editing && !file && (
                <p className="text-[10px] text-slate-500 italic">Leave empty to keep existing file.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Skills (Comma Separated)</label>
              <input value={form.skills.join(', ')} onChange={e => change('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" placeholder="React, Node.js, AWS" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Description</label>
              <textarea rows={3} value={form.description} onChange={e => change('description', e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-white" placeholder="achievement summary..." />
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={form.featured} onChange={e => change('featured', e.target.checked)} className="rounded border-slate-700 bg-slate-950 text-indigo-600" />
                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={form.published} onChange={e => change('published', e.target.checked)} className="rounded border-slate-700 bg-slate-950 text-indigo-600" />
                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Published</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-800">
            <button disabled={busy} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{editing ? 'Update Certificate' : 'Save Certificate'}</span>
            </button>
            {editing && (
              <button type="button" onClick={() => { setForm(blank()); setEditing(undefined); setFile(null); }} className="px-6 rounded-xl border border-slate-800 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
            )}
          </div>
        </form>

        {/* List Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-white">Certificates ({items.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search certificates..." className="pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white w-full sm:w-64" />
            </div>
          </div>

          <div className="grid gap-3">
            {filteredItems.map(item => {
              const displayUrl = resolveCertificateUrl(item.fileUrl || item.sourceAsset || '');
              return (
                <article key={item.id} className="group rounded-2xl border border-slate-800 bg-slate-900 p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.fileType === 'pdf' ? (
                        <FileText className="text-blue-400" size={24} />
                      ) : (
                        <img src={displayUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/100x100?text=Error')} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-white truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="truncate">{item.issuer}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-indigo-400">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.fileUrl?.includes('/') ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter">Supabase</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 text-[8px] font-black uppercase tracking-tighter">Local</span>
                        )}
                        <code className="text-[9px] text-slate-600 truncate max-w-[150px]">{item.fileUrl || item.sourceAsset}</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => saveCertificate({ ...item, published: !item.published }, item.id)} title={item.published ? 'Unpublish' : 'Publish'} className={`p-2 rounded-xl ${item.published ? 'text-emerald-400 bg-emerald-400/5' : 'text-amber-400 bg-amber-400/5'}`}>
                      {item.published ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => edit(item)} className="p-2 rounded-xl text-indigo-400 bg-indigo-400/5 hover:bg-indigo-400/10"><Edit2 size={16} /></button>
                    <button onClick={() => setDeletingCert(item)} className="p-2 rounded-xl text-rose-400 bg-rose-400/5 hover:bg-rose-400/10"><Trash2 size={16} /></button>
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
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Supabase Diagnostic</h3>
                  <p className="text-xs text-slate-400">Verifying Storage proxy and Firestore persistence.</p>
                </div>
                <button onClick={() => setDiagnosticOpen(false)} className="text-slate-500 hover:text-white font-bold text-xs">Dismiss</button>
              </div>

              {diagnosticRunning ? (
                <div className="py-12 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-300">Testing End-to-End Bridge...</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Auth → Local Fetch → Supabase Proxy → Firestore</p>
                </div>
              ) : diagnosticResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl flex items-start gap-3 ${diagnosticResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {diagnosticResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <div>
                      <p className="text-sm font-bold">{diagnosticResult.success ? 'System Operational' : 'Diagnostic Failure'}</p>
                      <p className="text-xs opacity-80 mt-1">{diagnosticResult.details}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block uppercase mb-1">Stage</span>
                      <span className="text-white font-bold">{diagnosticResult.stage}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block uppercase mb-1">Supabase Path</span>
                      <span className="text-white font-bold truncate block">{diagnosticResult.storagePath || '---'}</span>
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Delete Certificate?</h3>
                <p className="text-xs text-slate-400">Removing <span className="text-white font-bold">"{deletingCert.title}"</span> will delete the Firestore record and the file from Supabase Storage.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeletingCert(null)} className="flex-1 py-3 rounded-xl border border-slate-800 text-sm font-bold text-slate-400">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-black">Delete Everywhere</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

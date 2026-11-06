import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Upload, LogOut, Trash2, Edit2, Eye, EyeOff, Loader2, Plus, Save, Search, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth, googleProvider, isUserAdmin } from '../services/academicFirebase';
import { markBundledCertificatesImported, removeCertificate, saveCertificate, subscribeToCertificates, uploadCertificateFile } from '../services/certificateFirebase';
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
  
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
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
    setTimeout(() => setToast(null), 4000);
  };

  const change = (key: string, value: unknown) => setForm(old => ({ ...old, [key]: value }));

  const edit = (item: PortfolioCertificate) => {
    setEditing(item.id);
    setForm({ ...item, skills: item.skills || [] });
    setFile(null);
    showToast(`Editing "${item.title}"`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const importBundled = async () => {
    if (!confirm(`Import ${BUNDLED_CERTIFICATES.length} supplied certificate files into Firebase Storage and Firestore? Existing matching titles will be skipped.`)) return;
    setImporting(true);
    let done = 0;
    try {
      for (const item of BUNDLED_CERTIFICATES) {
        if (items.some(x => x.title === item.title && x.issuer === item.issuer)) {
          done++;
          setImportProgress(Math.round((done / BUNDLED_CERTIFICATES.length) * 100));
          continue;
        }
        const response = await fetch(item.fileUrl);
        if (!response.ok) throw new Error(`Could not read ${item.title}`);
        const blob = await response.blob();
        const fileObj = new File([blob], item.sourceAsset || `${item.id}.jpg`, { type: blob.type || 'image/jpeg' });
        const url = await uploadCertificateFile(fileObj, () => {});
        const { id, sourceAsset, createdAt, updatedAt, ...payload } = item;
        await saveCertificate({ ...payload, imageUrl: url, fileUrl: url }, undefined);
        done++;
        setImportProgress(Math.round((done / BUNDLED_CERTIFICATES.length) * 100));
      }
      await markBundledCertificatesImported();
      showToast(`Import finished successfully: ${done} certificates processed.`, 'success');
    } catch (err: any) {
      showToast(err instanceof Error ? err.message : 'Import failed.', 'error');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
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
        <button
          type="button"
          disabled={importing}
          onClick={importBundled}
          className="rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          {importing ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
          <span>{importing ? `Importing ${importProgress}%` : `Import 42 Bundled Certificates`}</span>
        </button>
      </div>

      {importing && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-cyan-500 transition-all" style={{ width: `${importProgress}%` }} />
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

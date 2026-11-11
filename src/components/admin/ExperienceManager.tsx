import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience } from '../../data/portfolio';
import { saveExperience, subscribeToExperience } from '../../services/portfolioContentFirebase';
import { useAdminToast } from './AdminToastContext';
import { useAIScanner } from '../../context/AIScannerContext';

const blankExperience = (): Experience => ({ role: '', company: '', location: '', period: '', description: '', highlights: [], type: 'Professional' });

export const ExperienceManager: React.FC = () => {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Experience>(blankExperience());
  const { showToast } = useAdminToast();
  const { pendingResult, setPendingResult } = useAIScanner();
  useEffect(() => subscribeToExperience((data) => { setItems(data); setLoading(false); }), []);
  useEffect(() => {
    if (!pendingResult || pendingResult.detectedModule !== 'experience') return;
    const data = pendingResult.data || {};
    setEditingIndex(null);
    setForm({
      role: data.role || '', company: data.company || '', location: data.location || '',
      period: data.period || '', description: data.description || '',
      type: ['Professional', 'Independent', 'Internship'].includes(data.type) ? data.type : 'Professional',
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
    });
    setFormOpen(true);
    showToast('AI experience details loaded. Review and apply, then Save All.', 'success');
    setPendingResult(null);
  }, [pendingResult, setPendingResult, showToast]);

  const openAdd = () => { setEditingIndex(null); setForm(blankExperience()); setFormOpen(true); };
  const openEdit = (index: number) => { setEditingIndex(index); setForm({ ...items[index], highlights: [...items[index].highlights] }); setFormOpen(true); };
  const saveForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.role.trim() || !form.company.trim()) { showToast('Role and company are required.', 'error'); return; }
    setItems((current) => editingIndex === null ? [...current, form] : current.map((item, index) => index === editingIndex ? form : item));
    setFormOpen(false);
  };
  const saveAll = async () => {
    setSaving(true);
    try { await saveExperience(items); showToast('Experience updated and synced to the public portfolio.', 'success'); setEditingIndex(null); setFormOpen(false); }
    catch (error: any) { showToast(error.message || 'Could not save experience.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading experience…</div>;
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-slate-900 dark:text-white">Experience Manager</h1><p className="mt-1 text-sm text-slate-500">Add, edit, reorder and remove experience entries. Public portfolio updates live.</p></div><div className="flex gap-2"><button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold dark:border-slate-700"><Plus size={15}/> Add Experience</button><button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={15}/> : <Save size={15}/>} Save All</button></div></div>
    <AnimatePresence>
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={saveForm} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl max-w-xl sm:max-w-2xl w-full"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editingIndex === null ? 'Add Experience' : 'Edit Experience'}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400">Role<input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[44px]"/></label>
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400">Company<input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[44px]"/></label>
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400">Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[44px]"/></label>
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400">Period<input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2025 – Present" className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[44px]"/></label>
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400 sm:col-span-2">Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Experience['type'] })} className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[44px]"><option>Professional</option><option>Independent</option><option>Internship</option></select></label>
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400 sm:col-span-2">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[80px]"/></label>
              <label className="space-y-1.5 text-xs font-bold uppercase text-slate-400 sm:col-span-2">Highlights (one per line)<textarea value={form.highlights.join('\n')} onChange={(e) => setForm({ ...form, highlights: e.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })} rows={4} className="w-full rounded-xl border bg-slate-50 dark:bg-slate-950 px-4 py-3 dark:border-slate-700 min-h-[100px]"/></label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border px-6 py-3 text-xs font-bold dark:border-slate-700 min-h-[44px]">Cancel</button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white min-h-[44px]">Apply Changes</button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
    {items.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">No experience entries yet.</div>}
    <div className="space-y-3">{items.map((item, index) => <article key={`${item.role}-${index}`} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600"><Briefcase size={19}/></div><div className="min-w-0"><h3 className="font-bold text-slate-900 dark:text-white">{item.role}</h3><p className="text-sm text-indigo-600">{item.company}</p><p className="mt-1 text-xs text-slate-500">{[item.period, item.location, item.type].filter(Boolean).join(' • ')}</p><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.description}</p></div></div><div className="flex shrink-0 gap-2"><button onClick={() => openEdit(index)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-500/10" aria-label="Edit experience"><Pencil size={16}/></button><button onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10" aria-label="Delete experience"><Trash2 size={16}/></button></div></article>)}</div>
    <p className="text-xs text-slate-500">Edits are staged in this screen until you click Save All. Removing an entry also requires Save All to publish the change.</p>
  </div>;
};

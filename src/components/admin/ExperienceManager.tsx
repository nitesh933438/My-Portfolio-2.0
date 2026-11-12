import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, Save, X, Loader2, ArrowUp, ArrowDown, ChevronsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Experience } from '../../data/portfolio';
import { saveExperience, subscribeToExperience } from '../../services/portfolioContentFirebase';
import { useAdminToast } from './AdminToastContext';
import { useAIScanner } from '../../context/AIScannerContext';

const blankExperience = (): Experience => ({
  role: '',
  company: '',
  location: '',
  period: '',
  description: '',
  highlights: [],
  type: 'Professional'
});

export const ExperienceManager: React.FC = () => {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [targetPosition, setTargetPosition] = useState<number>(1);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Experience>(blankExperience());
  const { showToast } = useAdminToast();
  const { pendingResult, setPendingResult } = useAIScanner();

  useEffect(() => subscribeToExperience((data) => {
    setItems(data);
    setLoading(false);
  }), []);

  useEffect(() => {
    if (!pendingResult || pendingResult.detectedModule !== 'experience') return;
    const data = pendingResult.data || {};
    setEditingIndex(null);
    setTargetPosition(items.length + 1);
    setForm({
      role: data.role || '',
      company: data.company || '',
      location: data.location || '',
      period: data.period || '',
      description: data.description || '',
      type: ['Professional', 'Independent', 'Internship'].includes(data.type) ? data.type : 'Professional',
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
    });
    setFormOpen(true);
    showToast('AI experience details loaded. Review and save.', 'success');
    setPendingResult(null);
  }, [pendingResult, items.length, setPendingResult, showToast]);

  const persistList = async (nextList: Experience[], message: string) => {
    const prev = [...items];
    setItems(nextList);
    setSaving(true);
    try {
      await saveExperience(nextList);
      showToast(message, 'success');
    } catch (error: any) {
      setItems(prev);
      showToast(error.message || 'Could not sync experience.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    setTargetPosition(items.length + 1);
    setForm(blankExperience());
    setFormOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setTargetPosition(index + 1);
    setForm({ ...items[index], highlights: [...(items[index].highlights || [])] });
    setFormOpen(true);
  };

  const saveForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.role.trim() || !form.company.trim()) {
      showToast('Role and company are required.', 'error');
      return;
    }

    const baseList = editingIndex === null
      ? [...items]
      : items.filter((_, i) => i !== editingIndex);

    const insertIdx = Math.max(0, Math.min(baseList.length, (Number(targetPosition) || baseList.length + 1) - 1));
    baseList.splice(insertIdx, 0, form);

    setFormOpen(false);
    setEditingIndex(null);
    await persistList(
      baseList,
      editingIndex === null
        ? `Experience added at Serial #${String(insertIdx + 1).padStart(2, '0')} & synced!`
        : `Experience updated at Serial #${String(insertIdx + 1).padStart(2, '0')} & synced!`
    );
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    await persistList(next, `Moved "${moved.role}" to Serial #${String(targetIndex + 1).padStart(2, '0')}.`);
  };

  const moveToTop = async (index: number) => {
    if (index <= 0) return;
    const moved = items[index];
    const remaining = items.filter((_, i) => i !== index);
    const next = [moved, ...remaining];
    await persistList(next, `Moved "${moved.role}" to #01 Start position and updated all serial numbers!`);
  };

  const removeItem = async (index: number) => {
    const removed = items[index];
    const next = items.filter((_, i) => i !== index);
    await persistList(next, `Removed "${removed?.role || 'Experience'}" and recalculated serial numbers.`);
  };

  const saveAll = async () => {
    await persistList(items, 'Experience updated and synced to the public portfolio.');
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading experience…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Experience Manager</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Add, edit, reorder and remove experience entries. Serial numbers (#01, #02...) adjust automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold cursor-pointer"
          >
            <Plus size={15} /> Add Experience
          </button>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Save All
          </button>
        </div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={saveForm}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl max-w-xl sm:max-w-2xl w-full my-auto max-h-[90dvh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingIndex === null ? 'Add Experience' : 'Edit Experience'}
                </h2>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Role *
                  <input
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[44px]"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Company *
                  <input
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[44px]"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Location
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[44px]"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Period
                  <input
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder="2025 – Present"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[44px]"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Type
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as Experience['type'] })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[44px]"
                  >
                    <option>Professional</option>
                    <option>Independent</option>
                    <option>Internship</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Serial # (Position)
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, items.length + (editingIndex === null ? 1 : 0))}
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[44px] font-mono font-bold"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 sm:col-span-2">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[80px]"
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 sm:col-span-2">
                  Highlights (one per line)
                  <textarea
                    value={form.highlights.join('\n')}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        highlights: e.target.value.split('\n').map((value) => value.trim()).filter(Boolean)
                      })
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 min-h-[100px]"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-6 py-3 text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs font-bold text-white min-h-[44px] cursor-pointer"
                >
                  Save & Auto-Order
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
          No experience entries yet.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <article
            key={`${item.role}-${item.company}-${index}`}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-start sm:justify-between shadow-xs"
          >
            <div className="flex min-w-0 gap-3.5">
              <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 shrink-0 h-fit">
                <Briefcase size={19} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20 tabular-nums">
                    #{String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white">{item.role}</h3>
                </div>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{item.company}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {[item.period, item.location, item.type].filter(Boolean).join(' • ')}
                </p>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap shrink-0 items-center gap-1.5 self-end sm:self-start">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveToTop(index)}
                  title="Move to #01 Start Position"
                  className="rounded-xl p-2 bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-500/20 cursor-pointer"
                >
                  <ChevronsUp size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                title="Move Up"
                className="rounded-xl p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                title="Move Down"
                className="rounded-xl p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                onClick={() => openEdit(index)}
                className="rounded-xl p-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                aria-label="Edit experience"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-xl p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer"
                aria-label="Delete experience"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

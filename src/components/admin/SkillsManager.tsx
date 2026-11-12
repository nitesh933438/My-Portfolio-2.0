import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Sparkles } from 'lucide-react';
import { SkillCategory, ICONS } from '../../data/portfolio';
import { saveSkills, subscribeToSkills } from '../../services/portfolioContentFirebase';
import { useAdminToast } from './AdminToastContext';
import { useAIScanner } from '../../context/AIScannerContext';

export const SkillsManager: React.FC = () => {
  const [items, setItems] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useAdminToast();
  const { pendingResult, setPendingResult } = useAIScanner();

  useEffect(() => {
    if (!pendingResult || pendingResult.detectedModule !== 'skills') return;
    const data = pendingResult.data || {};
    const detectedSkills = Array.isArray(data.skills) ? data.skills : [];
    const categoryName = String(data.category || 'Extracted Skills');
    if (detectedSkills.length) {
      const draft: SkillCategory = { category: categoryName, iconName: 'Code2', skills: detectedSkills.filter((skill: any) => skill && skill.name).map((skill: any) => ({ name: String(skill.name), level: Math.max(0, Math.min(100, Number(skill.level) || 70)) })) };
      setItems((current) => [...current, draft]);
      showToast('AI skills loaded as a draft category. Review and click Save All.', 'success');
    } else { showToast('AI did not find a usable skills list.', 'error'); }
    setPendingResult(null);
  }, [pendingResult, setPendingResult, showToast]);

  useEffect(() => subscribeToSkills((data) => { setItems(data); setLoading(false); }), []);

  const updateCategory = (index: number, patch: Partial<SkillCategory>) => setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateSkill = (categoryIndex: number, skillIndex: number, patch: { name?: string; level?: number }) => setItems((current) => current.map((item, i) => i === categoryIndex ? { ...item, skills: item.skills.map((skill, j) => j === skillIndex ? { ...skill, ...patch } : skill) } : item));
  const save = async () => {
    setSaving(true);
    try {
      const cleaned = items.map((item) => ({ ...item, category: item.category.trim(), skills: item.skills.filter((skill) => skill.name.trim()).map((skill) => ({ ...skill, name: skill.name.trim(), level: Math.max(0, Math.min(100, Number(skill.level) || 0)) })) })).filter((item) => item.category);
      await saveSkills(cleaned);
      showToast('Skills updated and synced to the public portfolio.', 'success');
    } catch (error: any) { showToast(error.message || 'Could not save skills.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading skills…</div>;

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-black text-slate-900 dark:text-white">Skills Manager</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage skill groups and proficiency levels. Changes sync live to the public Skills section.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setItems((current) => [...current, { category: 'New Category', iconName: 'Code2', skills: [] }])} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 text-xs font-bold cursor-pointer"><Plus size={15}/> Add Category</button><button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">{saving ? <Loader2 className="animate-spin" size={15}/> : <Save size={15}/>} Save All</button></div>
    </div>
    {items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center text-sm text-slate-500">No skill groups yet. Add a category to begin.</div>}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {items.map((category, categoryIndex) => <section key={`${category.category}-${categoryIndex}`} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Skill category" value={category.category} onChange={(e) => updateCategory(categoryIndex, { category: e.target.value })} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 min-h-[44px]"/><select aria-label="Skill category icon" value={String(category.iconName)} onChange={(e) => updateCategory(categoryIndex, { iconName: e.target.value as keyof typeof ICONS })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 sm:w-40 min-h-[44px]">{Object.keys(ICONS).map((iconName) => <option key={iconName} value={iconName}>{iconName}</option>)}</select><button type="button" aria-label="Delete category" onClick={() => setItems((current) => current.filter((_, i) => i !== categoryIndex))} className="rounded-xl p-2.5 text-rose-500 hover:bg-rose-500/10 min-h-[44px] flex items-center justify-center cursor-pointer"><Trash2 size={17}/></button></div>
        <div className="space-y-3">{category.skills.map((skill, skillIndex) => <div key={`${skill.name}-${skillIndex}`} className="grid grid-cols-[minmax(0,1fr)_82px_44px] items-center gap-2"><input aria-label="Skill name" value={skill.name} onChange={(e) => updateSkill(categoryIndex, skillIndex, { name: e.target.value })} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 min-h-[44px]"/><div className="relative"><input aria-label="Skill proficiency percentage" type="number" min="0" max="100" value={skill.level} onChange={(e) => updateSkill(categoryIndex, skillIndex, { level: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 pr-7 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 min-h-[44px]"/><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span></div><button type="button" aria-label="Delete skill" onClick={() => updateCategory(categoryIndex, { skills: category.skills.filter((_, i) => i !== skillIndex) })} className="rounded-lg p-2.5 text-rose-500 hover:bg-rose-500/10 min-h-[44px] flex items-center justify-center cursor-pointer"><Trash2 size={15}/></button></div>)}</div>
        <button type="button" onClick={() => updateCategory(categoryIndex, { skills: [...category.skills, { name: '', level: 70 }] })} className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 min-h-[44px] px-1 cursor-pointer"><Plus size={14}/> Add Skill</button>
      </section>)}
    </div>
    <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><Sparkles size={14} className="mt-0.5 shrink-0"/> Choose an icon from the provided list so the public Skills section can render it safely.</p>
  </div>;
};

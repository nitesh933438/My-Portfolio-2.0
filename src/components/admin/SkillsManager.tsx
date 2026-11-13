import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Sparkles, ArrowUp, ArrowDown, ChevronsUp, CheckCircle2 } from 'lucide-react';
import { SkillCategory, SKILLS_DATA, ICONS } from '../../data/portfolio';
import { saveSkills, subscribeToSkills } from '../../services/portfolioContentFirebase';
import { useAdminToast } from './AdminToastContext';
import { useAIScanner } from '../../context/AIScannerContext';

export const SkillsManager: React.FC = () => {
  const [items, setItems] = useState<SkillCategory[]>(SKILLS_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestItemsRef = useRef<SkillCategory[]>(SKILLS_DATA);
  const { showToast } = useAdminToast();
  const { pendingResult, setPendingResult } = useAIScanner();

  const cleanCategories = (list: SkillCategory[]): SkillCategory[] =>
    list
      .map((item) => ({
        ...item,
        category: item.category.trim(),
        skills: item.skills
          .filter((skill) => skill.name.trim())
          .map((skill) => ({
            ...skill,
            name: skill.name.trim(),
            level: Math.max(0, Math.min(100, Number(skill.level) || 0)),
          })),
      }))
      .filter((item) => item.category);

  const scheduleAutoSave = (nextItems: SkillCategory[]) => {
    latestItemsRef.current = nextItems;
    dirtyRef.current = true;
    setSyncStatus('syncing');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const cleaned = cleanCategories(latestItemsRef.current);
        await saveSkills(cleaned);
        dirtyRef.current = false;
        setSyncStatus('synced');
      } catch (error: any) {
        dirtyRef.current = false;
        setSyncStatus('idle');
        showToast(error.message || 'Auto-sync failed.', 'error');
      }
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const persistSkills = async (nextItems: SkillCategory[], message?: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    dirtyRef.current = false;
    latestItemsRef.current = nextItems;
    setItems(nextItems);
    setSyncStatus('syncing');
    try {
      const cleaned = cleanCategories(nextItems);
      await saveSkills(cleaned);
      setSyncStatus('synced');
      if (message) showToast(message, 'success');
    } catch (error: any) {
      setSyncStatus('idle');
      showToast(error.message || 'Could not save skills.', 'error');
    }
  };

  useEffect(() => {
    if (!pendingResult || pendingResult.detectedModule !== 'skills') return;
    const data = pendingResult.data || {};
    const detectedSkills = Array.isArray(data.skills) ? data.skills : [];
    const categoryName = String(data.category || 'Extracted Skills');
    if (detectedSkills.length) {
      const incoming = detectedSkills
        .filter((skill: any) => skill && skill.name)
        .map((skill: any) => ({
          name: String(skill.name).trim(),
          level: Math.max(0, Math.min(100, Number(skill.level) || 75)),
        }));
      const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const targetKey = norm(pendingResult.matchedId || categoryName);

      setItems((current) => {
        const matchIdx = current.findIndex((g) => {
          const gKey = norm(g.category);
          return targetKey && (gKey === targetKey || gKey.includes(targetKey) || targetKey.includes(gKey));
        });
        let next: SkillCategory[];
        if (matchIdx >= 0) {
          const existingGroup = current[matchIdx];
          const skillMap = new Map(existingGroup.skills.map((s) => [s.name.toLowerCase(), s]));
          incoming.forEach((s: { name: string; level: number }) => {
            if (!skillMap.has(s.name.toLowerCase())) {
              skillMap.set(s.name.toLowerCase(), s);
            }
          });
          next = current.map((g, i) =>
            i === matchIdx ? { ...g, skills: Array.from(skillMap.values()) } : g
          );
        } else {
          const draft: SkillCategory = {
            category: categoryName,
            iconName: 'Code2',
            skills: incoming,
          };
          next = [...current, draft];
        }
        latestItemsRef.current = next;
        saveSkills(cleanCategories(next)).catch(() => {});
        return next;
      });
      setSyncStatus('synced');
      showToast('AI skills merged and synced automatically without duplicates!', 'success');
    } else {
      showToast('AI did not find a usable skills list.', 'error');
    }
    setPendingResult(null);
  }, [pendingResult, setPendingResult, showToast]);

  useEffect(
    () =>
      subscribeToSkills((data) => {
        if (!dirtyRef.current) {
          latestItemsRef.current = data;
          setItems(data);
        }
        setLoading(false);
      }),
    []
  );

  const updateCategory = (index: number, patch: Partial<SkillCategory>) =>
    setItems((current) => {
      const next = current.map((item, i) => (i === index ? { ...item, ...patch } : item));
      scheduleAutoSave(next);
      return next;
    });

  const updateSkill = (categoryIndex: number, skillIndex: number, patch: { name?: string; level?: number }) =>
    setItems((current) => {
      const next = current.map((item, i) =>
        i === categoryIndex
          ? {
              ...item,
              skills: item.skills.map((skill, j) => (j === skillIndex ? { ...skill, ...patch } : skill)),
            }
          : item
      );
      scheduleAutoSave(next);
      return next;
    });

  const moveCategory = async (index: number, direction: 'up' | 'down' | 'top') => {
    const next = [...items];
    const targetIndex =
      direction === 'top' ? 0 : direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length || targetIndex === index) return;
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    await persistSkills(next, 'Category order & serial numbers updated!');
  };

  const deleteCategory = async (categoryIndex: number) => {
    const next = items.filter((_, i) => i !== categoryIndex);
    await persistSkills(next, 'Category deleted & serial numbers re-indexed!');
  };

  const moveSkill = async (categoryIndex: number, skillIndex: number, direction: 'up' | 'down') => {
    const category = items[categoryIndex];
    if (!category) return;
    const nextSkills = [...category.skills];
    const targetIndex = direction === 'up' ? skillIndex - 1 : skillIndex + 1;
    if (targetIndex < 0 || targetIndex >= nextSkills.length) return;
    const [moved] = nextSkills.splice(skillIndex, 1);
    nextSkills.splice(targetIndex, 0, moved);
    const next = items.map((item, idx) =>
      idx === categoryIndex ? { ...item, skills: nextSkills } : item
    );
    await persistSkills(next, 'Skill order updated!');
  };

  const deleteSkill = async (categoryIndex: number, skillIndex: number) => {
    const category = items[categoryIndex];
    if (!category) return;
    const next = items.map((item, idx) =>
      idx === categoryIndex
        ? { ...item, skills: item.skills.filter((_, i) => i !== skillIndex) }
        : item
    );
    await persistSkills(next, 'Skill removed & serial numbers adjusted!');
  };

  const save = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    dirtyRef.current = false;
    setSaving(true);
    setSyncStatus('syncing');
    try {
      const cleaned = cleanCategories(items);
      await saveSkills(cleaned);
      setSyncStatus('synced');
      showToast('Skills updated and synced to the public portfolio.', 'success');
    } catch (error: any) {
      setSyncStatus('idle');
      showToast(error.message || 'Could not save skills.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading skills…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Skills Manager ({items.length})
            </h1>
            {syncStatus === 'syncing' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Loader2 size={12} className="animate-spin" /> Auto-syncing…
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} /> Synced Live
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage skill groups and proficiency levels. Edits auto-sync to your live portfolio and serial numbers (#01, #02...) adjust automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setItems((current) => {
                const next: SkillCategory[] = [
                  ...current,
                  { category: `New Category #${current.length + 1}`, iconName: 'Code2' as const, skills: [{ name: 'New Skill', level: 80 }] },
                ];
                scheduleAutoSave(next);
                return next;
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 text-xs font-bold cursor-pointer"
          >
            <Plus size={15} /> Add Category
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Save All
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
          No skill groups yet. Add a category to begin.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {items.map((category, categoryIndex) => (
          <section
            key={`skill-cat-${categoryIndex}`}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white text-[11px] font-black tracking-wider">
                  #{String(categoryIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {category.skills.length} {category.skills.length === 1 ? 'Skill' : 'Skills'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {categoryIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => moveCategory(categoryIndex, 'top')}
                    title="Move Category to #01 Start"
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer"
                  >
                    <ChevronsUp size={15} />
                  </button>
                )}
                <button
                  type="button"
                  disabled={categoryIndex === 0}
                  onClick={() => moveCategory(categoryIndex, 'up')}
                  title="Move Category Up"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={categoryIndex === items.length - 1}
                  onClick={() => moveCategory(categoryIndex, 'down')}
                  title="Move Category Down"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Delete category"
                  onClick={() => deleteCategory(categoryIndex)}
                  title="Delete Category"
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Skill category"
                value={category.category}
                onChange={(e) => updateCategory(categoryIndex, { category: e.target.value })}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 min-h-[44px]"
              />
              <select
                aria-label="Skill category icon"
                value={String(category.iconName)}
                onChange={(e) => updateCategory(categoryIndex, { iconName: e.target.value as keyof typeof ICONS })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 sm:w-40 min-h-[44px]"
              >
                {Object.keys(ICONS).map((iconName) => (
                  <option key={iconName} value={iconName}>
                    {iconName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              {category.skills.map((skill, skillIndex) => (
                <div
                  key={`skill-row-${categoryIndex}-${skillIndex}`}
                  className="grid grid-cols-[28px_minmax(0,1fr)_76px_auto] items-center gap-1.5 sm:gap-2"
                >
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 text-center">
                    #{String(skillIndex + 1).padStart(2, '0')}
                  </span>
                  <input
                    aria-label="Skill name"
                    value={skill.name}
                    placeholder="Skill name"
                    onChange={(e) => updateSkill(categoryIndex, skillIndex, { name: e.target.value })}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 min-h-[40px]"
                  />
                  <div className="relative">
                    <input
                      aria-label="Skill proficiency percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={skill.level}
                      onChange={(e) => updateSkill(categoryIndex, skillIndex, { level: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 pr-6 text-xs font-bold text-slate-900 dark:text-white dark:border-slate-700 dark:bg-slate-950 min-h-[40px]"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={skillIndex === 0}
                      onClick={() => moveSkill(categoryIndex, skillIndex, 'up')}
                      title="Move Skill Up"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 cursor-pointer"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={skillIndex === category.skills.length - 1}
                      onClick={() => moveSkill(categoryIndex, skillIndex, 'down')}
                      title="Move Skill Down"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 cursor-pointer"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete skill"
                      onClick={() => deleteSkill(categoryIndex, skillIndex)}
                      title="Delete Skill"
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                updateCategory(categoryIndex, {
                  skills: [...category.skills, { name: '', level: 75 }],
                })
              }
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 min-h-[40px] px-1 cursor-pointer"
            >
              <Plus size={14} /> Add Skill (#{String(category.skills.length + 1).padStart(2, '0')})
            </button>
          </section>
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Sparkles size={14} className="mt-0.5 shrink-0" /> Choose an icon from the provided list so the public Skills section can render it safely.
      </p>
    </div>
  );
};

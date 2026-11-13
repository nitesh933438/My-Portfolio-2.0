import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectScreenshot } from '../../data/portfolio';
import { 
  saveProjectScreenshots, 
  resolveProjectImageUrl, 
  isScreenshotUrlInUse,
  isUploadedStoragePath
} from '../../services/projectFirebase';
import { auth } from '../../services/academicFirebase';
import { uploadFileProxy, deleteFileProxy, validateFile } from '../../services/supabaseStorage';
import { useAdminToast } from './AdminToastContext';
import { ImageViewer } from '../ImageViewer';
import { getProjectScreenshotMetadata, isExcludedProjectScreenshot } from '../../data/projectScreenshotCatalog';
import { 
  X, 
  Upload, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Star, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  Save, 
  CheckSquare, 
  Square, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon, 
  RefreshCw, 
  Grid, 
  Layers, 
  Tag, 
  Maximize2,
  Sparkles,
  Info
} from 'lucide-react';

interface ProjectScreenshotManagerProps {
  project: Project;
  allProjects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated?: () => void;
}

export const ProjectScreenshotManager: React.FC<ProjectScreenshotManagerProps> = ({
  project,
  allProjects,
  isOpen,
  onClose,
  onProjectUpdated
}) => {
  const { showToast } = useAdminToast();

  // Local state for screenshots list
  const [screenshots, setScreenshots] = useState<ProjectScreenshot[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, text: '' });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Edit Metadata Sub-Modal state
  const [editingItem, setEditingItem] = useState<ProjectScreenshot | null>(null);

  // Replace Image state
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  // Delete Confirmation Modal state
  const [deletingItem, setDeletingItem] = useState<ProjectScreenshot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Live Gallery Preview
  const [previewViewerOpen, setPreviewViewerOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Refs to prevent stale closures during drag/save and preserve local edits from background snapshots
  const screenshotsRef = useRef<ProjectScreenshot[]>([]);
  const isDraggingRef = useRef(false);
  const savingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const initializedProjectIdRef = useRef<string | null>(null);

  const commitScreenshotsState = (next: ProjectScreenshot[]) => {
    screenshotsRef.current = next;
    setScreenshots(next);
  };

  // Initialize screenshots list from project data
  useEffect(() => {
    if (!isOpen || !project) {
      initializedProjectIdRef.current = null;
      setSelectedIds([]);
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      return;
    }

    const isNewProject = initializedProjectIdRef.current !== project.id;
    if (!isNewProject && (isDraggingRef.current || savingRef.current || hasUnsavedChangesRef.current)) {
      return;
    }

    const projectKey = project.slug || project.id;

    if (project.screenshotMetadata && project.screenshotMetadata.length > 0) {
      const seenUrls = new Set<string>();
      const filtered = [...project.screenshotMetadata]
        .filter((s) => {
          if (!s.url || isExcludedProjectScreenshot(s.url)) return false;
          if (seenUrls.has(s.url)) return false;
          seenUrls.add(s.url);
          return true;
        })
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

      const hasMain = filtered.some((s) => s.url === project.mainScreenshot);
      const ordered = hasMain
        ? filtered
        : project.mainScreenshot
        ? [
            {
              id: `scr_cover_${Date.now()}`,
              url: project.mainScreenshot,
              title: '',
              caption: '',
              altText: `${project.title} Poster Cover`,
              category: 'Poster Cover',
              displayOrder: 1,
              published: true,
              isCover: true
            },
            ...filtered.map((s) => ({ ...s, isCover: false }))
          ]
        : filtered;

      const explicitCoverId =
        ordered.find((s) => s.isCover)?.id ||
        ordered.find((s) => s.url === project.mainScreenshot)?.id ||
        ordered[0]?.id;

      const upgraded = ordered.map((item, idx) => {
        const catalogMeta = getProjectScreenshotMetadata(projectKey, idx, item.url);
        const isGenericTitle =
          !item.title ||
          item.title.includes('Application Screenshot') ||
          item.title.includes('Cover View') ||
          item.title.includes('Application Screen View');
        const isGenericCategory =
          !item.category || item.category === 'Workflow' || item.category === 'Cover';

        return {
          ...item,
          displayOrder: idx + 1,
          isCover: item.id === explicitCoverId,
          title: isGenericTitle ? catalogMeta.title : item.title,
          category: isGenericCategory ? catalogMeta.category : item.category,
          caption:
            item.caption && !item.caption.includes('workflow screenshot view')
              ? item.caption
              : catalogMeta.caption
        };
      });
      commitScreenshotsState(upgraded);
    } else {
      const allUrls = Array.from(
        new Set(
          [project.mainScreenshot, ...(project.additionalScreenshots || [])]
            .filter(Boolean)
            .filter((u) => !isExcludedProjectScreenshot(u))
        )
      );
      const initial: ProjectScreenshot[] = allUrls.map((url, idx) => {
        const meta = getProjectScreenshotMetadata(projectKey, idx, url);
        return {
          id: `scr_legacy_${idx}_${project.id}`,
          url,
          title: meta.title,
          caption: meta.caption,
          altText: `${project.title} – ${meta.title}`,
          category: meta.category,
          displayOrder: idx + 1,
          published: true,
          isCover: idx === 0
        };
      });
      commitScreenshotsState(initial);
    }

    hasUnsavedChangesRef.current = false;
    setHasUnsavedChanges(false);
    if (isNewProject) {
      initializedProjectIdRef.current = project.id;
      setSelectedIds([]);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  // Re-calculate sequential numbers (1, 2, 3... N) and sync title prefix (01 – ..., 02 – ...)
  const resequence = (list: ProjectScreenshot[]): ProjectScreenshot[] => {
    if (list.length === 0) return [];
    const coverId = list.find((item) => item.isCover)?.id || list[0].id;
    return list.map((item, idx) => {
      const orderNum = idx + 1;
      const cleanTitle = (item.title || '').replace(/^\d+\s*[–-]\s*/, '').trim();
      const prefix = String(orderNum).padStart(2, '0');
      return {
        ...item,
        displayOrder: orderNum,
        isCover: item.id === coverId,
        title: cleanTitle ? `${prefix} – ${cleanTitle}` : `${prefix} – Screenshot`
      };
    });
  };

  // Helper to mark changes and auto-persist sequential order to Firestore
  const updateList = async (newList: ProjectScreenshot[], successToast?: string): Promise<boolean> => {
    const resequenced = resequence(newList);
    commitScreenshotsState(resequenced);
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    savingRef.current = true;
    setSaving(true);
    try {
      await saveProjectScreenshots(project.id, resequenced);
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      if (successToast) showToast(successToast, 'success');
      if (onProjectUpdated) onProjectUpdated();
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Could not auto-save screenshot changes. Click Save Changes to retry.', 'error');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // 1. UPLOAD MULTIPLE SCREENSHOTS
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return showToast('Unauthorized: Please sign in as admin.', 'error');

    const fileArray = Array.from(files);
    setUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length, text: `Uploading 0 of ${fileArray.length}...` });

    const newScreenshots: ProjectScreenshot[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress({ current: i + 1, total: fileArray.length, text: `Uploading file ${i + 1} of ${fileArray.length}: ${file.name}` });

        validateFile(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 20 * 1024 * 1024);
        const { path } = await uploadFileProxy(file, 'projects', idToken);

        const nextOrder = screenshots.length + newScreenshots.length + 1;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

        newScreenshots.push({
          id: `scr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          url: path,
          title: `${String(nextOrder).padStart(2, '0')} – ${cleanName}`,
          caption: `${project.title} screenshot: ${cleanName}`,
          altText: `${project.title} screenshot ${cleanName}`,
          category: 'Workflow',
          displayOrder: nextOrder,
          published: true,
          isCover: screenshots.length === 0 && newScreenshots.length === 1
        });
      }

      const ok = await updateList([...screenshotsRef.current, ...newScreenshots]);
      if (ok) {
        showToast(`Successfully uploaded ${newScreenshots.length} screenshot(s)`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Error uploading screenshots', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 2. REPLACING AN EXISTING SCREENSHOT
  const handleReplaceImage = async (file: File, targetId: string) => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return showToast('Unauthorized', 'error');

    const previousItem = screenshotsRef.current.find((item) => item.id === targetId);
    try {
      validateFile(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 20 * 1024 * 1024);
      const { path } = await uploadFileProxy(file, 'projects', idToken);

      const updated = screenshotsRef.current.map(item => {
        if (item.id === targetId) {
          return { ...item, url: path, updatedAt: new Date().toISOString() };
        }
        return item;
      });

      const ok = await updateList(updated, 'Screenshot image replaced successfully');
      if (ok && previousItem && isUploadedStoragePath(previousItem.url)) {
        const inUse = isScreenshotUrlInUse(previousItem.url, project.id, allProjects);
        if (!inUse) {
          deleteFileProxy(previousItem.url, idToken).catch(() => undefined);
        }
      }
      setReplacingItemId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to replace image', 'error');
    }
  };

  // 3. SET PRIMARY COVER SCREENSHOT (promotes chosen screenshot to #01 & marks isCover)
  const handleSetCover = async (id: string) => {
    const target = screenshotsRef.current.find((item) => item.id === id);
    if (!target) return;
    const others = screenshotsRef.current
      .filter((item) => item.id !== id)
      .map((item) => ({ ...item, isCover: false }));
    const promoted = [{ ...target, isCover: true, published: true }, ...others];
    await updateList(promoted, 'Primary cover screenshot updated to #01!');
  };

  // 4. TOGGLE PUBLISH / UNPUBLISH VISIBILITY
  const handleTogglePublish = async (id: string) => {
    const updated = screenshotsRef.current.map(item => {
      if (item.id === id) {
        return { ...item, published: !item.published };
      }
      return item;
    });
    await updateList(updated);
  };

  // 5. DRAG AND DROP REORDERING
  const handleDragStart = (e: any, index: number) => {
    isDraggingRef.current = true;
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: any, index: number) => {
    if (e.preventDefault) e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...screenshotsRef.current];
    const draggedItem = list[draggedIndex];
    if (!draggedItem) return;
    list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    const resequenced = resequence(list);
    commitScreenshotsState(resequenced);
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = async () => {
    isDraggingRef.current = false;
    setDraggedIndex(null);
    await updateList(screenshotsRef.current, 'Screenshot order & serial numbers updated automatically!');
  };

  // ACCESSIBLE MOVE CONTROLS
  const moveItem = async (fromIndex: number, toIndex: number) => {
    const current = screenshotsRef.current;
    if (toIndex < 0 || toIndex >= current.length) return;
    const list = [...current];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    await updateList(list);
  };

  // 6. DELETE SCREENSHOT
  const confirmDeleteIndividual = async () => {
    if (!deletingItem) return;
    setDeleting(true);

    try {
      const remaining = screenshotsRef.current.filter(s => s.id !== deletingItem.id);
      const ok = await updateList(remaining, 'Screenshot removed and serial numbers recalculated');

      if (ok) {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken && isUploadedStoragePath(deletingItem.url)) {
          const inUse = isScreenshotUrlInUse(deletingItem.url, project.id, allProjects);
          if (!inUse) {
            deleteFileProxy(deletingItem.url, idToken).catch((e) => {
              console.warn('Could not delete storage file:', e);
            });
          }
        }
        setDeletingItem(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete screenshot', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // BULK ACTIONS
  const toggleSelectAll = () => {
    if (selectedIds.length === screenshots.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(screenshots.map(s => s.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = async (published: boolean) => {
    const count = selectedIds.length;
    const updated = screenshotsRef.current.map(s => 
      selectedIds.includes(s.id) ? { ...s, published } : s
    );
    await updateList(updated, `Updated visibility for ${count} screenshot(s)`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    const idsToRemove = [...selectedIds];
    const targets = screenshotsRef.current.filter(s => idsToRemove.includes(s.id));

    try {
      const remaining = screenshotsRef.current.filter(s => !idsToRemove.includes(s.id));
      const ok = await updateList(remaining, `Deleted ${idsToRemove.length} screenshot(s) and updated numbering`);

      if (ok) {
        setSelectedIds([]);
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) {
          for (const target of targets) {
            if (isUploadedStoragePath(target.url)) {
              const inUse = isScreenshotUrlInUse(target.url, project.id, allProjects);
              if (!inUse) {
                deleteFileProxy(target.url, idToken).catch((e) => {
                  console.warn('Could not delete bulk asset:', e);
                });
              }
            }
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Bulk delete failed', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  // 7. SAVE ALL CHANGES TO FIRESTORE
  const handleSaveChanges = async () => {
    savingRef.current = true;
    setSaving(true);
    try {
      await saveProjectScreenshots(project.id, screenshotsRef.current);
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      showToast('All screenshot metadata and order saved permanently!', 'success');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to save screenshot gallery', 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // SAVE METADATA FROM SUB-MODAL
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = screenshotsRef.current.map(s => 
      s.id === editingItem.id ? editingItem : s
    );
    await updateList(updated, 'Screenshot metadata updated');
    setEditingItem(null);
  };

  const publishedScreenshots = screenshots.filter(s => s.published);
  const resolvedUrls = publishedScreenshots.map(s => resolveProjectImageUrl(s.url));
  const resolvedTitles = publishedScreenshots.map(s => s.title);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
        onClick={() => onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-8 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Grid className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  Screenshot Manager
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate mt-0.5">
                  {project.title} &bull; {screenshots.length} Screenshots
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {publishedScreenshots.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewIndex(0);
                    setPreviewViewerOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  title="Preview Public Gallery Lightbox"
                >
                  <Maximize2 size={14} />
                  <span className="hidden sm:inline">Preview Gallery</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || saving}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                  hasUnsavedChanges 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>{saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                aria-label="Close Screenshot Manager"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Unsaved Changes Banner */}
          {hasUnsavedChanges && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
              <span className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>You have unsaved reordering or screenshot metadata edits. Click "Save Changes" to save permanently.</span>
              </span>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                Save Now
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-8">
            
            {/* 1. Batch Upload Section */}
            <section className="bg-slate-50 dark:bg-slate-950/60 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Batch Upload Screenshots</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Drag & drop multiple PNG, JPG, or WEBP images or browse files. Images will be automatically assigned sequential numbers.
                </p>
              </div>

              {uploading ? (
                <div className="max-w-xs mx-auto space-y-2">
                  <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <Loader2 className="animate-spin" size={16} />
                    <span>{uploadProgress.text}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / (uploadProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                  <Upload size={16} />
                  <span>Select Screenshots from Computer</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      handleFileUpload(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </section>

            {/* 2. Bulk Actions Bar */}
            {screenshots.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                  >
                    {selectedIds.length === screenshots.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {selectedIds.length === screenshots.length ? 'Deselect All' : 'Select All'} ({selectedIds.length})
                    </span>
                  </button>
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkPublish(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={14} /> Publish Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkPublish(false)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <EyeOff size={14} /> Unpublish Selected
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {bulkDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                      Delete Selected ({selectedIds.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Reorderable Screenshots List */}
            {screenshots.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs font-bold uppercase tracking-wider">No Screenshots Added Yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                  <span>Drag or use arrows to reorder (Auto-numbered 1 to {screenshots.length})</span>
                  <span>{screenshots.length} Screenshots</span>
                </div>

                <div className="space-y-3">
                  {screenshots.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                        draggedIndex === index 
                          ? 'border-indigo-500 shadow-xl opacity-60' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm'
                      }`}
                    >
                      {/* Left: Drag Handle, Selection Checkbox & Serial Number */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div 
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 p-1"
                          title="Drag to reorder"
                        >
                          <GripVertical size={18} />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSelectId(item.id)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          {selectedIds.includes(item.id) ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-black min-w-[2.8rem] text-center border border-slate-200 dark:border-slate-700">
                          #{String(item.displayOrder).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800">
                        <img 
                          src={resolveProjectImageUrl(item.url)} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        {item.isCover && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider shadow">
                            Cover
                          </span>
                        )}
                        {!item.published && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-amber-400 font-bold text-[8px] uppercase tracking-wider">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Metadata Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          {item.category && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold uppercase tracking-widest">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.caption && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {item.caption}
                          </p>
                        )}
                      </div>

                      {/* Controls Actions */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Cover Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleSetCover(item.id)}
                          className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            item.isCover 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={item.isCover ? 'Primary Cover Image' : 'Set as Primary Cover'}
                        >
                          <Star className={`w-4 h-4 ${item.isCover ? 'fill-amber-500' : ''}`} />
                          <span className="hidden sm:inline text-[10px] uppercase font-bold">{item.isCover ? 'Cover' : 'Make Cover'}</span>
                        </button>

                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(item.id)}
                          className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            item.published 
                              ? 'text-emerald-500 hover:bg-emerald-500/10' 
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={item.published ? 'Published (Click to Unpublish)' : 'Draft (Click to Publish)'}
                        >
                          {item.published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>

                        {/* Reorder Arrows */}
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => moveItem(index, index - 1)}
                            disabled={index === 0}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(index, index + 1)}
                            disabled={index === screenshots.length - 1}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Edit Metadata Button */}
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...item })}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                          title="Edit Title, Caption & Alt Text"
                        >
                          <Edit3 size={16} />
                        </button>

                        {/* Replace Image Button */}
                        <label 
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 cursor-pointer"
                          title="Replace Image File"
                        >
                          <RefreshCw size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleReplaceImage(file, item.id);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 cursor-pointer"
                          title="Delete Screenshot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Changes to display order update public project gallery immediately upon saving.
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || saving}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                  hasUnsavedChanges 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-95' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>{saving ? 'Saving...' : 'Save Gallery Changes'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* METADATA EDITOR SUB-MODAL */}
        <AnimatePresence>
          {editingItem && (
            <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Edit Screenshot Details</h4>
                  <button type="button" onClick={() => setEditingItem(null)} className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveMetadata} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Category / Section</label>
                    <input
                      type="text"
                      value={editingItem.category || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Core Overview, Mobile View, Settings"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Caption / Description</label>
                    <textarea
                      rows={3}
                      value={editingItem.caption || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      placeholder="Describe what this screenshot demonstrates..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Alt Text (Accessibility)</label>
                    <input
                      type="text"
                      value={editingItem.altText || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, altText: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      placeholder="Screen reader description"
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                    >
                      Update Metadata
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRMATION SUB-MODAL */}
        <AnimatePresence>
          {deletingItem && (
            <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-950 mx-auto border border-slate-200 dark:border-slate-800">
                  <img 
                    src={resolveProjectImageUrl(deletingItem.url)} 
                    alt={deletingItem.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Delete Screenshot?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">"{deletingItem.title}"</strong>? Serial numbers will automatically update.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingItem(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteIndividual}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* LIVE PUBLIC GALLERY LIGHTBOX PREVIEW */}
        <ImageViewer
          isOpen={previewViewerOpen}
          images={resolvedUrls}
          currentIndex={previewIndex}
          titles={resolvedTitles}
          projectTitle={project.title}
          onClose={() => setPreviewViewerOpen(false)}
          onIndexChange={(idx) => setPreviewIndex(idx)}
        />
      </div>
    </AnimatePresence>
  );
};

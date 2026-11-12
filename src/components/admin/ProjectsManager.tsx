import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Github, 
  Loader2, 
  X, 
  Save, 
  Upload,
  Sparkles,
  Grid,
  RefreshCw,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronsUp
} from 'lucide-react';
import { Project, ProjectCategory, ProjectStatus, ProjectScreenshot, PROJECTS } from '../../data/portfolio';
import { 
  subscribeToProjects, 
  saveProject, 
  deleteProject, 
  reindexProjectsInFirestore,
  resolveProjectImageUrl
} from '../../services/projectFirebase';
import { getProjectScreenshotMetadata, isExcludedProjectScreenshot } from '../../data/projectScreenshotCatalog';
import { validateFile, uploadFileProxy } from '../../services/supabaseStorage';
import { auth } from '../../services/academicFirebase';
import { useAdminToast } from './AdminToastContext';
import { useAIScanner } from '../../context/AIScannerContext';
import { ProjectScreenshotManager } from './ProjectScreenshotManager';
import { generateProjectDescriptionSmart } from '../../services/api';

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Full-Stack Development',
  'AI & Automation',
  'Web Applications',
  'SaaS & Management',
  'E-Commerce',
  'Productivity & Tools',
  'Education & LMS',
  'Security & Storage',
  'Other Projects'
];

const PROJECT_STATUSES: ProjectStatus[] = [
  'Completed',
  'In Progress',
  'Planning',
  'Coming Soon',
  'Archived'
];

const buildProjectScreenshotGallery = (project: Project): ProjectScreenshot[] => {
  const projectKey = project.slug || project.id;
  if (project.screenshotMetadata && project.screenshotMetadata.length > 0) {
    return [...project.screenshotMetadata]
      .filter(s => !isExcludedProjectScreenshot(s.url))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const orderedUrls = Array.from(
    new Set(
      [project.mainScreenshot, ...(project.additionalScreenshots || [])]
        .filter((url): url is string => Boolean(url) && !isExcludedProjectScreenshot(url))
    )
  );

  return orderedUrls.map((url, idx) => {
    const info = getProjectScreenshotMetadata(projectKey, idx, url);
    return {
      id: `scr_${idx}_${project.id}`,
      url,
      title: info.title,
      category: info.category,
      caption: info.caption,
      altText: info.title,
      displayOrder: idx + 1,
      published: true,
      isCover: idx === 0
    };
  });
};

export const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() =>
    PROJECTS.map((p, idx) => ({ ...p, displayOrder: idx + 1 }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [managingScreenshotsProject, setManagingScreenshotsProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncingDefaults, setSyncingDefaults] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [techStackInput, setTechStackInput] = useState('');
  const [keyFeaturesInput, setKeyFeaturesInput] = useState('');
  const { showToast } = useAdminToast();
  const { pendingResult, setPendingResult } = useAIScanner();

  useEffect(() => {
    const unsub = subscribeToProjects(setProjects);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (editingProject) {
      setTechStackInput((editingProject.techStack || []).join(', '));
      setKeyFeaturesInput((editingProject.keyFeatures || []).join('\n'));
    }
  }, [editingProject?.id]);

  // Listen for AI Scanner Auto-fill results
  useEffect(() => {
    if (pendingResult && pendingResult.detectedModule === 'project') {
      const { data } = pendingResult;
      const newProj: Project = {
        id: '',
        slug: (data.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: data.title || '',
        category: data.category || 'Full-Stack Development',
        shortDescription: data.shortDescription || '',
        detailedDescription: data.detailedDescription || data.fullDescription || '',
        techStack: Array.isArray(data.techStack) ? data.techStack : ['React', 'TypeScript'],
        keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures : [],
        githubUrl: data.githubUrl || '',
        liveDemoUrl: data.liveDemoUrl || '',
        featured: false,
        status: 'Completed',
        displayOrder: projects.length + 1,
        mainScreenshot: '',
        additionalScreenshots: []
      };
      setEditingProject(newProj);
      setTechStackInput(newProj.techStack.join(', '));
      setKeyFeaturesInput(newProj.keyFeatures.join('\n'));
      showToast('AI Scanner auto-filled new project details!', 'info');
      setPendingResult(null);
    }
  }, [pendingResult, projects.length, showToast, setPendingResult]);

  const orderedProjects = [...projects].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));

  const filteredProjects = orderedProjects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenEditProject = (project: Project) => {
    setEditingProject({ ...project });
    setTechStackInput((project.techStack || []).join(', '));
    setKeyFeaturesInput((project.keyFeatures || []).join('\n'));
  };

  const handleOpenNewProject = () => {
    const newProj: Project = {
      id: '',
      slug: '',
      title: '',
      category: 'Full-Stack Development',
      shortDescription: '',
      detailedDescription: '',
      techStack: ['React', 'TypeScript', 'Node.js'],
      keyFeatures: [],
      githubUrl: '',
      liveDemoUrl: '',
      featured: false,
      status: 'Completed',
      displayOrder: projects.length + 1,
      mainScreenshot: '',
      additionalScreenshots: []
    };
    setEditingProject(newProj);
    setTechStackInput(newProj.techStack.join(', '));
    setKeyFeaturesInput('');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setLoading(true);
    try {
      const parsedTech = techStackInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const parsedFeatures = keyFeaturesInput
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      const normalizedSlug = (editingProject.slug || editingProject.title || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { id, ...projectPayload } = editingProject;
      const cleanData = {
        ...projectPayload,
        slug: normalizedSlug,
        techStack: parsedTech.length > 0 ? parsedTech : ['React', 'TypeScript'],
        keyFeatures: parsedFeatures
      };

      const savedId = await saveProject(cleanData, id || undefined);

      // Automatically insert at requested displayOrder and re-sequence all serial numbers (1, 2, 3... N)
      const withoutSaved = orderedProjects.filter(p => p.id !== savedId);
      const targetIndex = Math.max(
        0,
        Math.min(withoutSaved.length, (Number(editingProject.displayOrder) || withoutSaved.length + 1) - 1)
      );
      const savedRecord: Project = {
        ...(orderedProjects.find(p => p.id === savedId) || {}),
        ...cleanData,
        id: savedId,
        displayOrder: targetIndex + 1
      };
      withoutSaved.splice(targetIndex, 0, savedRecord);
      const reindexed = withoutSaved.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
      setProjects(reindexed);
      await reindexProjectsInFirestore(reindexed);

      showToast(
        id
          ? `Project updated at Serial #${String(targetIndex + 1).padStart(2, '0')}!`
          : `Project added at Serial #${String(targetIndex + 1).padStart(2, '0')}!`,
        'success'
      );
      setEditingProject(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (project: Project) => {
    const nextFeatured = !project.featured;
    setProjects(prev => prev.map(p => (p.id === project.id ? { ...p, featured: nextFeatured } : p)));
    try {
      const { id, ...data } = project;
      await saveProject({ ...data, featured: nextFeatured }, id);
      showToast(
        nextFeatured ? `"${project.title}" marked as Featured ⭐` : `"${project.title}" unfeatured.`,
        'success'
      );
    } catch (err: any) {
      setProjects(prev => prev.map(p => (p.id === project.id ? { ...p, featured: project.featured } : p)));
      showToast(err.message || 'Could not update featured status', 'error');
    }
  };

  const handleMoveProject = async (project: Project, direction: -1 | 1) => {
    const index = orderedProjects.findIndex(p => p.id === project.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= orderedProjects.length) return;

    const list = [...orderedProjects];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    const reindexed = list.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));

    setProjects(reindexed);
    try {
      await reindexProjectsInFirestore(reindexed);
      showToast(
        `Moved "${project.title}" to Serial #${String(targetIndex + 1).padStart(2, '0')}.`,
        'success'
      );
    } catch (err: any) {
      setProjects(orderedProjects);
      showToast(err.message || 'Failed to reorder project', 'error');
    }
  };

  const handleMoveProjectToFirst = async (project: Project) => {
    const index = orderedProjects.findIndex(p => p.id === project.id);
    if (index <= 0) return;

    const remaining = orderedProjects.filter(p => p.id !== project.id);
    const reindexed = [project, ...remaining].map((p, idx) => ({ ...p, displayOrder: idx + 1 }));

    setProjects(reindexed);
    try {
      await reindexProjectsInFirestore(reindexed);
      showToast(`"${project.title}" moved to #01 Start position and all serial numbers updated!`, 'success');
    } catch (err: any) {
      setProjects(orderedProjects);
      showToast(err.message || 'Failed to move project to top', 'error');
    }
  };

  const handleSyncDefaultProjects = async () => {
    if (syncingDefaults) return;
    setSyncingDefaults(true);
    try {
      for (let i = 0; i < PROJECTS.length; i++) {
        const defaultProj = PROJECTS[i];
        const existing = projects.find(
          p => p.slug === defaultProj.slug || p.id === defaultProj.id || p.title.toLowerCase() === defaultProj.title.toLowerCase()
        );
        const normalizedGallery = buildProjectScreenshotGallery(defaultProj);
        const { id: _defaultId, ...payload } = defaultProj;
        await saveProject(
          {
            ...payload,
            displayOrder: existing?.displayOrder || i + 1,
            mainScreenshot: normalizedGallery[0]?.url || defaultProj.mainScreenshot,
            additionalScreenshots: normalizedGallery.slice(1).map(s => s.url),
            screenshotMetadata: normalizedGallery
          },
          existing?.id
        );
      }
      showToast(`Synchronized all ${PROJECTS.length} projects & poster covers!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to sync default projects', 'error');
    } finally {
      setSyncingDefaults(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deletingProject) return;
    setDeleting(true);
    const target = deletingProject;
    const prevOrdered = [...orderedProjects];
    const remaining = prevOrdered
      .filter(p => p.id !== target.id)
      .map((p, idx) => ({ ...p, displayOrder: idx + 1 }));

    try {
      const allItems = buildProjectScreenshotGallery(target);
      const assetPaths = [
        target.mainScreenshot,
        ...(target.additionalScreenshots || []),
        ...allItems.map(s => s.url)
      ].filter(Boolean);

      setProjects(remaining);
      await deleteProject(target.id, assetPaths, projects, remaining);
      showToast(`Project "${target.title}" deleted and serial numbers updated automatically!`, 'success');
      setDeletingProject(null);
    } catch (err: any) {
      setProjects(prevOrdered);
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!editingProject?.title) {
      showToast('Please enter a project title first', 'error');
      return;
    }
    setAiGenerating(true);
    try {
      const idToken = (await auth.currentUser?.getIdToken()) || '';

      const result = await generateProjectDescriptionSmart({
        title: editingProject.title,
        category: editingProject.category,
        techStack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
        idToken
      });

      if (!result || result.success === false) throw new Error(result?.error || 'AI generation failed');

      setEditingProject({
        ...editingProject,
        shortDescription: result.data.shortDescription || editingProject.shortDescription,
        detailedDescription: result.data.detailedDescription || result.data.fullDescription || editingProject.detailedDescription,
        keyFeatures: result.data.keyFeatures || editingProject.keyFeatures
      });
      if (Array.isArray(result.data.keyFeatures)) {
        setKeyFeaturesInput(result.data.keyFeatures.join('\n'));
      }
      showToast('Generated descriptions with AI!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!editingProject) return;
    try {
      validateFile(file, ['image/jpeg', 'image/png', 'image/webp'], 15 * 1024 * 1024);
      setUploadStatus('Uploading screenshot...');
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');
      const { path } = await uploadFileProxy(file, 'projects', idToken);
      setEditingProject({ ...editingProject, mainScreenshot: path });
      setUploadStatus(null);
      showToast('Screenshot uploaded!', 'success');
    } catch (err: any) {
      setUploadStatus(null);
      showToast(err.message, 'error');
    }
  };

  const categories = ['All', ...Array.from(new Set([...PROJECT_CATEGORIES, ...projects.map(p => p.category)]))];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by title, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncDefaultProjects}
            disabled={syncingDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Sync all projects, Poster Covers (#01), and screenshots to Firestore"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${syncingDefaults ? 'animate-spin' : ''}`} />
            <span>{syncingDefaults ? 'Syncing...' : 'Sync All Projects & Covers'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewProject}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {filteredProjects.map((project) => {
          const normalizedScreenshots = buildProjectScreenshotGallery(project);
          const coverUrl = normalizedScreenshots.find(s => s.isCover)?.url || normalizedScreenshots[0]?.url || project.mainScreenshot;
          const trueIndex = orderedProjects.findIndex(p => p.id === project.id);
          const serialNumber = trueIndex >= 0 ? trueIndex + 1 : (project.displayOrder || 1);

          return (
            <div
              key={project.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
                serialNumber === 1
                  ? 'border-indigo-500/60 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="aspect-video bg-slate-950 relative overflow-hidden group">
                <img
                  src={resolveProjectImageUrl(coverUrl)}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-slate-950" /> Featured
                    </span>
                  )}
                </div>

                {/* Screenshot Counter Badge Overlay */}
                <button
                  type="button"
                  onClick={() => setManagingScreenshotsProject(project)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-indigo-600 text-white backdrop-blur-md text-[10px] font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                >
                  <Grid size={12} />
                  <span>{normalizedScreenshots.length} Screenshots</span>
                </button>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{project.title}</h3>
                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20 shrink-0 tabular-nums">
                    #{String(serialNumber).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">{project.shortDescription}</p>
                
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {project.techStack.slice(0, 4).map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {t}
                    </span>
                  ))}
                  {project.techStack.length > 4 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-[10px] font-semibold text-slate-400">
                      +{project.techStack.length - 4}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Star / Featured Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(project)}
                      title={project.featured ? 'Featured Project (Click to unstar)' : 'Mark as Featured Project'}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        project.featured
                          ? 'text-amber-500 bg-amber-500/20 hover:bg-amber-500/30 ring-1 ring-amber-500/40'
                          : 'text-slate-400 hover:text-amber-500 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${project.featured ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>

                    {/* Move to Top (#01) */}
                    {serialNumber > 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveProjectToFirst(project)}
                        title="Move to #01 Start Position"
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => handleMoveProject(project, -1)}
                      disabled={serialNumber <= 1}
                      title="Move Up"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveProject(project, 1)}
                      disabled={serialNumber >= orderedProjects.length}
                      title="Move Down"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="GitHub Repository"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {project.liveDemoUrl && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setManagingScreenshotsProject(project)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Manage Project Screenshots"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>Screenshots ({normalizedScreenshots.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditProject(project)}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Edit Project Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProject(project)}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Project Modal */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 md:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {editingProject.title ? `Edit: ${editingProject.title}` : 'Add New Project'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure project details, links, tech stack, and cover banner
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProject.title}
                      onChange={e => setEditingProject({ ...editingProject, title: e.target.value })}
                      placeholder="e.g. AttendX AI"
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Category *</label>
                    <select
                      value={editingProject.category}
                      onChange={e => setEditingProject({ ...editingProject, category: e.target.value as ProjectCategory })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      {PROJECT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Status</label>
                    <select
                      value={editingProject.status}
                      onChange={e => setEditingProject({ ...editingProject, status: e.target.value as ProjectStatus })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      {PROJECT_STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={editingProject.displayOrder || 1}
                      onChange={e => setEditingProject({ ...editingProject, displayOrder: Number(e.target.value) || 1 })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProject.featured)}
                        onChange={e => setEditingProject({ ...editingProject, featured: e.target.checked })}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Featured Masterpiece</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">GitHub Repository URL</label>
                    <input
                      type="url"
                      value={editingProject.githubUrl || ''}
                      onChange={e => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                      placeholder="https://github.com/nitesh933438/..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Live Demo URL</label>
                    <input
                      type="url"
                      value={editingProject.liveDemoUrl || ''}
                      onChange={e => setEditingProject({ ...editingProject, liveDemoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Tech Stack (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={techStackInput}
                    onChange={e => setTechStackInput(e.target.value)}
                    placeholder="React, TypeScript, Node.js, MongoDB, Tailwind CSS"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Descriptions & Features</label>
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{aiGenerating ? 'Generating...' : 'Write with Gemini AI'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Short Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={editingProject.shortDescription}
                    onChange={e => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    value={editingProject.detailedDescription}
                    onChange={e => setEditingProject({ ...editingProject, detailedDescription: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Key Features (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={keyFeaturesInput}
                    onChange={e => setKeyFeaturesInput(e.target.value)}
                    placeholder="Real-time attendance tracking&#10;Role-based access control&#10;Automated analytics dashboard"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Primary Poster Cover / Screenshot</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-xs font-bold transition-colors shrink-0">
                      <Upload className="w-4 h-4" />
                      <span>{uploadStatus || 'Upload Cover Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={editingProject.mainScreenshot}
                      onChange={e => setEditingProject({ ...editingProject, mainScreenshot: e.target.value })}
                      placeholder="/images/banners/... or storage path"
                      className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Project</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Confirmation Modal */}
      <AnimatePresence>
        {deletingProject && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Project Permanently?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingProject.title}"</strong>? 
                  This will remove the project and its screenshot gallery from the public portfolio.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingProject(null)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProject}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{deleting ? 'Deleting...' : 'Delete Project'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dedicated Screenshot Manager Modal */}
      {managingScreenshotsProject && (
        <ProjectScreenshotManager
          isOpen={true}
          project={managingScreenshotsProject}
          allProjects={projects}
          onClose={() => setManagingScreenshotsProject(null)}
          onProjectUpdated={() => {
            const refreshed = projects.find(p => p.id === managingScreenshotsProject.id);
            if (refreshed) setManagingScreenshotsProject(refreshed);
          }}
        />
      )}
    </div>
  );
};

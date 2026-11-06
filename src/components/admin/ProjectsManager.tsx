import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectCategory } from '../../data/portfolio';
import { subscribeToProjects, saveProject, deleteProject, resolveProjectImageUrl } from '../../services/projectFirebase';
import { auth, isUserAdmin } from '../../services/academicFirebase';
import { uploadFileProxy, validateFile } from '../../services/supabaseStorage';
import { Plus, Trash2, Edit2, Loader2, Save, X, Search, ExternalLink, Github, Eye, EyeOff, Info, Database, FileText, AlertCircle } from 'lucide-react';
import { useAdminToast } from './AdminToastContext';

const categories: ProjectCategory[] = [
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

const blankProject = (): Omit<Project, 'id'> => ({
  slug: '',
  title: '',
  shortDescription: '',
  detailedDescription: '',
  category: 'Full-Stack Development',
  techStack: [],
  mainScreenshot: '',
  additionalScreenshots: [],
  githubUrl: '',
  liveDemoUrl: '',
  status: 'Completed',
  featured: false,
  displayOrder: 100,
  keyFeatures: [],
});

export const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankProject());
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useAdminToast();

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (key: string, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(blankProject());
    setMainImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingId(proj.id);
    setForm({
      slug: proj.slug || proj.id,
      title: proj.title,
      shortDescription: proj.shortDescription,
      detailedDescription: proj.detailedDescription,
      category: proj.category,
      techStack: proj.techStack || [],
      mainScreenshot: proj.mainScreenshot,
      additionalScreenshots: proj.additionalScreenshots || [],
      githubUrl: proj.githubUrl,
      liveDemoUrl: proj.liveDemoUrl,
      status: proj.status,
      featured: proj.featured,
      displayOrder: proj.displayOrder,
      keyFeatures: proj.keyFeatures || [],
    });
    setMainImageFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return showToast('Unauthorized: Please sign in.', 'error');

    setSaving(true);
    try {
      let mainScreenshot = form.mainScreenshot;

      if (mainImageFile) {
        validateFile(mainImageFile, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 20 * 1024 * 1024);
        const { path } = await uploadFileProxy(mainImageFile, 'projects', idToken);
        mainScreenshot = path;
      }

      if (!mainScreenshot) {
        throw new Error('Project screenshot is required.');
      }

      const generatedSlug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      await saveProject({
        ...form,
        slug: generatedSlug,
        mainScreenshot,
      }, editingId || undefined);

      showToast(editingId ? 'Project metadata updated' : 'Project created with Supabase storage', 'success');
      setIsModalOpen(false);
      setForm(blankProject());
      setEditingId(null);
      setMainImageFile(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      // Include all Supabase assets for deletion
      const assets = [deletingProject.mainScreenshot, ...(deletingProject.additionalScreenshots || [])];
      await deleteProject(deletingProject.id, assets);
      showToast(`Deleted "${deletingProject.title}" and its assets`, 'success');
      setDeletingProject(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Projects Manager</h1>
          <div className="flex items-center gap-2 text-[11px] text-blue-500 font-bold uppercase tracking-wider mt-1">
            <Database size={12} />
            <span>Supabase Storage Integration</span>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus size={16} /> Add New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Full-Stack Development', 'AI & Automation', 'Web Applications', 'SaaS & Management'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-16 text-center space-y-3 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Create your first project metadata and upload screenshots to Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-all"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                  <img 
                    src={resolveProjectImageUrl(project.mainScreenshot)} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={e => (e.currentTarget.src = 'https://placehold.co/400x300?text=Asset+Error')} 
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-emerald-500/90 text-white">
                      {project.status}
                    </span>
                    {project.featured && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white">
                        Featured
                      </span>
                    )}
                  </div>
                  {project.mainScreenshot.includes('/') && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[8px] font-black uppercase">Supabase</span>
                  )}
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{project.category}</span>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">{project.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{project.shortDescription}</p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                <div className="flex gap-1.5">
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                      <Github size={14} />
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingProject(project)}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-black">{editingId ? 'Edit Project' : 'Add New Project'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={e => handleChange('title', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                      placeholder="e.g. Enterprise AI SaaS"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category *</label>
                    <select
                      value={form.category}
                      onChange={e => handleChange('category', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Main Screenshot (Supabase Storage) *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setMainImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-slate-800 dark:file:text-indigo-400"
                  />
                  {editingId && !mainImageFile && (
                    <p className="text-[10px] text-slate-500 italic mt-1">Leave empty to keep current screenshot.</p>
                  )}
                  {form.mainScreenshot && (
                    <code className="text-[9px] text-blue-500 block mt-1 truncate">Current: {form.mainScreenshot}</code>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Short Description *</label>
                    <input
                      type="text"
                      required
                      value={form.shortDescription}
                      onChange={e => handleChange('shortDescription', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                      placeholder="Brief overview"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Detailed Description *</label>
                    <textarea
                      rows={4}
                      required
                      value={form.detailedDescription}
                      onChange={e => handleChange('detailedDescription', e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    <span>{saving ? 'Saving...' : 'Save Project'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingProject && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Delete Project?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deletingProject.title}"</strong> and all its Supabase assets?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeletingProject(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

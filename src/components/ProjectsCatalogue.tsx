import { useState, useMemo, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ExternalLink, Github, ArrowRight, FolderGit2, XCircle, LayoutGrid, Clock, Rocket, Beaker, Archive } from 'lucide-react';
import { PROJECTS, Project, ProjectCategory, ProjectStatus, getDerivedData } from '../data/portfolio';

interface ProjectsCatalogueProps {
  onSelectProject: (project: Project) => void;
}

export const ProjectsCatalogue: FC<ProjectsCatalogueProps> = ({ onSelectProject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All Projects'>('All Projects');
  const [showArchived, setShowArchived] = useState(false);

  const { categories: dynamicCategories } = useMemo(() => getDerivedData(), []);
  const categories = ['All Projects', ...dynamicCategories] as const;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Projects');
    setShowArchived(false);
  };

  const filteredProjects = useMemo(() => {
    return PROJECTS.filter((project) => {
      // Basic filtering by search query
      const matchesSearch = 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filtering (Primary or Secondary)
      const matchesCategory = 
        selectedCategory === 'All Projects' || 
        project.category === selectedCategory || 
        (project.secondaryCategories && project.secondaryCategories.includes(selectedCategory as ProjectCategory));

      // Status filtering (Archived is hidden by default)
      const matchesStatus = showArchived ? project.status === 'Archived' : project.status !== 'Archived';

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, showArchived]);

  // Split into sections
  const completedProjects = filteredProjects.filter(p => p.status === 'Completed');
  const upcomingProjects = filteredProjects.filter(p => 
    p.status === 'In Progress' || p.status === 'Planning' || p.status === 'Coming Soon'
  );

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'Completed': return <Rocket className="w-3 h-3" />;
      case 'In Progress': return <Clock className="w-3 h-3" />;
      case 'Planning': return <LayoutGrid className="w-3 h-3" />;
      case 'Coming Soon': return <Beaker className="w-3 h-3" />;
      case 'Archived': return <Archive className="w-3 h-3" />;
      default: return null;
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => onSelectProject(project)}>
        <img
          src={project.mainScreenshot}
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <p className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            View Details <ArrowRight className="w-4 h-4" />
          </p>
        </div>
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest shadow-sm">
            {project.category}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-[8px] font-black uppercase tracking-widest ${
            project.status === 'Completed' 
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          }`}>
            {getStatusIcon(project.status)}
            {project.status}
          </span>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col space-y-4">
        <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{project.title}</h4>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
          {project.shortDescription}
        </p>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {project.techStack.slice(0, 4).map((tech) => (
            <span key={tech} className="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span className="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-dotted border-slate-300 dark:border-slate-700">
              +{project.techStack.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onSelectProject(project)}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
        >
          Explore Case Study
        </button>
        <div className="flex items-center gap-3">
          {project.githubUrl && project.githubUrl !== "" && (
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {project.liveDemoUrl && project.liveDemoUrl !== "" ? (
            <a 
              href={project.liveDemoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
              aria-label="Live Demo"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          ) : (
            <div className="px-3 py-1.5 rounded-xl text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-default border border-slate-200 dark:border-slate-800" title="Live demo coming soon">
              Coming Soon
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <section id="projects" className="py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 block mb-4"
          >
            My Work
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-8"
          >
            Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Catalogue</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-lg text-slate-600 dark:text-slate-400 font-medium"
          >
            A curated collection of {PROJECTS.length} projects across {categories.length - 1} categories, ranging from full-stack applications to AI integrations.
          </motion.p>
        </div>

        {/* Filters */}
        <div className="mb-20 space-y-10">
          <div className="flex flex-col lg:flex-row gap-6 items-end justify-between">
            <div className="w-full lg:max-w-md relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search technologies, titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Showing:</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{filteredProjects.length} Projects</span>
              </div>
              {(searchQuery || selectedCategory !== 'All Projects' || showArchived) && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter by category</span>
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${showArchived ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 border ${
                    selectedCategory === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-32">
          {/* Completed Projects Section */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
              <h3 className="text-sm font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600">
                {showArchived ? 'Archived Records' : 'Completed Projects'}
              </h3>
              <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
              <AnimatePresence mode="popLayout">
                {completedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </AnimatePresence>
            </div>

            {completedProjects.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <FolderGit2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">No matching projects found</p>
              </div>
            )}
          </div>

          {/* Upcoming Projects Section (Hidden when Archived filter is on) */}
          {!showArchived && upcomingProjects.length > 0 && (
            <div className="space-y-12">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600">Future Roadmap & Lab</h3>
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
                <AnimatePresence mode="popLayout">
                  {upcomingProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

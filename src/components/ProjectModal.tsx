import { useState, FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Github, ExternalLink, Calendar, CheckCircle, Tag, Clock, Rocket, Beaker, LayoutGrid, Archive, Maximize2, Grid } from 'lucide-react';
import { Project, ProjectStatus } from '../data/portfolio';
import { ImageViewer } from './ImageViewer';
import { resolveProjectImageUrl } from '../services/projectFirebase';
import { getProjectScreenshotMetadata, isExcludedProjectScreenshot } from '../data/projectScreenshotCatalog';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

// Unique banner color schemes per project
const getProjectBannerTheme = (id: string) => {
  switch (id) {
    case 'money-details':
      return {
        gradient: 'from-emerald-950 via-teal-950 to-slate-950',
        badgeBg: 'bg-emerald-400/10 border-emerald-300/30 text-emerald-200',
        accentGlow: 'bg-emerald-500/20',
        secondaryGlow: 'bg-teal-400/10',
        categoryColor: 'text-emerald-300'
      };
    case 'whatsapp-personal-ai-bot':
      return {
        gradient: 'from-emerald-950 via-green-950 to-slate-950',
        badgeBg: 'bg-green-400/10 border-green-300/30 text-green-200',
        accentGlow: 'bg-green-500/20',
        secondaryGlow: 'bg-emerald-400/10',
        categoryColor: 'text-green-300'
      };
    case 'worksphere-hrms':
      return {
        gradient: 'from-blue-950 via-indigo-950 to-slate-950',
        badgeBg: 'bg-blue-400/10 border-blue-300/30 text-blue-200',
        accentGlow: 'bg-blue-500/20',
        secondaryGlow: 'bg-indigo-400/10',
        categoryColor: 'text-blue-300'
      };
    case 'nova-ai-assistant':
      return {
        gradient: 'from-violet-950 via-purple-950 to-slate-950',
        badgeBg: 'bg-purple-400/10 border-purple-300/30 text-purple-200',
        accentGlow: 'bg-purple-500/20',
        secondaryGlow: 'bg-violet-400/10',
        categoryColor: 'text-purple-300'
      };
    case 'digital-vault':
      return {
        gradient: 'from-slate-950 via-zinc-900 to-amber-950/40',
        badgeBg: 'bg-amber-400/10 border-amber-300/30 text-amber-200',
        accentGlow: 'bg-amber-500/20',
        secondaryGlow: 'bg-zinc-500/10',
        categoryColor: 'text-amber-300'
      };
    case 'golden-road-safety':
    case 'road-safety':
      return {
        gradient: 'from-amber-950 via-orange-950 to-slate-950',
        badgeBg: 'bg-amber-400/10 border-amber-300/30 text-amber-200',
        accentGlow: 'bg-amber-500/20',
        secondaryGlow: 'bg-orange-400/10',
        categoryColor: 'text-amber-300'
      };
    case 'attendx-ai':
      return {
        gradient: 'from-cyan-950 via-indigo-950 to-slate-950',
        badgeBg: 'bg-cyan-400/10 border-cyan-300/30 text-cyan-200',
        accentGlow: 'bg-cyan-500/20',
        secondaryGlow: 'bg-indigo-400/10',
        categoryColor: 'text-cyan-300'
      };
    default:
      return {
        gradient: 'from-slate-950 via-slate-900 to-indigo-950/75',
        badgeBg: 'bg-white/10 border-white/20 text-indigo-100',
        accentGlow: 'bg-indigo-500/20',
        secondaryGlow: 'bg-cyan-400/10',
        categoryColor: 'text-cyan-200'
      };
  }
};

export const ProjectModal: FC<ProjectModalProps> = ({ project, onClose }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Reset image index and category filter when project changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsViewerOpen(false);
    setSelectedCategory('All');
  }, [project]);

  const projectKey = project ? (project.slug || project.id) : '';
  const bannerTheme = project ? getProjectBannerTheme(projectKey) : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!project) return;
      if (e.key === 'Escape' && !isViewerOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, isViewerOpen, onClose]);

  if (!project || !bannerTheme) return null;

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'Completed': return <Rocket className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Planning': return <LayoutGrid className="w-4 h-4 text-blue-500" />;
      case 'Coming Soon': return <Beaker className="w-4 h-4 text-purple-500" />;
      case 'Archived': return <Archive className="w-4 h-4 text-slate-500" />;
      default: return null;
    }
  };

  // Build public gallery items with Poster Cover (mainScreenshot) ALWAYS First (#01), followed by application screenshots
  let screenshotItems: Array<{
    url: string;
    rawPath: string;
    index: number;
    title: string;
    category: string;
    caption?: string;
    altText?: string;
    isCover?: boolean;
  }> = [];

  if (project.screenshotMetadata && project.screenshotMetadata.length > 0) {
    const published = project.screenshotMetadata
      .filter(s => s.published !== false && !isExcludedProjectScreenshot(s.url))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Ensure the project's Poster Cover (mainScreenshot) is always at position #01 (index 0)
    const hasMainInPublished = published.some(s => s.url === project.mainScreenshot);
    const orderedPublished = hasMainInPublished
      ? [
          ...published.filter(s => s.url === project.mainScreenshot),
          ...published.filter(s => s.url !== project.mainScreenshot)
        ]
      : project.mainScreenshot
      ? [
          {
            id: 'scr_cover_0',
            url: project.mainScreenshot,
            title: '',
            category: 'Poster Cover',
            displayOrder: 1,
            published: true,
            isCover: true
          },
          ...published
        ]
      : published;

    screenshotItems = orderedPublished.map((item, idx) => {
      const catalogMeta = getProjectScreenshotMetadata(projectKey, idx, item.url);
      const isGenericTitle =
        !item.title ||
        item.title.includes('Application Screenshot') ||
        item.title.includes('Cover View') ||
        item.title.includes('Application Screen View');
      const isGenericCategory =
        !item.category || item.category === 'Workflow' || item.category === 'Cover';

      return {
        url: resolveProjectImageUrl(item.url),
        rawPath: item.url,
        index: idx,
        title: isGenericTitle ? catalogMeta.title : (item.title || catalogMeta.title),
        category: isGenericCategory ? catalogMeta.category : (item.category || catalogMeta.category),
        caption: item.caption && !item.caption.includes('workflow screenshot view') ? item.caption : catalogMeta.caption,
        altText: item.altText || catalogMeta.title,
        isCover: idx === 0 || item.isCover
      };
    });
  }

  // Fallback to [mainScreenshot (Poster Cover), ...additionalScreenshots] deduplicated
  if (screenshotItems.length === 0) {
    const rawUrls = Array.from(
      new Set(
        [project.mainScreenshot, ...(project.additionalScreenshots || [])]
          .filter(Boolean)
          .filter(u => !isExcludedProjectScreenshot(u))
      )
    );

    screenshotItems = rawUrls.map((img, idx) => {
      const meta = getProjectScreenshotMetadata(projectKey, idx, img);
      return {
        url: resolveProjectImageUrl(img),
        rawPath: img,
        index: idx,
        title: meta.title,
        category: meta.category,
        caption: meta.caption,
        altText: meta.title,
        isCover: idx === 0
      };
    });
  }

  const screenshots = screenshotItems.map(i => i.url);
  const distinctCategories = ['All', ...Array.from(new Set(screenshotItems.map(i => i.category)))];
  const filteredScreenshotItems =
    selectedCategory === 'All'
      ? screenshotItems
      : screenshotItems.filter(i => i.category === selectedCategory);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {project.title}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    {project.category}
                  </span>
                  {project.secondaryCategories?.map(cat => (
                    <span key={cat} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      • {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 shrink-0"
              title="Close Modal (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto custom-scrollbar flex-1 p-4 sm:p-10 space-y-8 sm:space-y-12">
            
            {/* 1. Premium Project Cover Banner (Always First) */}
            <section className="relative isolate min-h-[280px] overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 sm:min-h-[340px] shadow-xl">
              <img
                src={resolveProjectImageUrl(project.mainScreenshot)}
                alt={`${project.title} cover`}
                className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35 filter saturate-125"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${bannerTheme.gradient}`} />
              <div className={`absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full blur-3xl ${bannerTheme.accentGlow}`} />
              <div className={`absolute -bottom-24 left-1/3 -z-10 h-64 w-64 rounded-full blur-3xl ${bannerTheme.secondaryGlow}`} />
              
              <div className="flex min-h-[280px] flex-col justify-between gap-8 p-6 sm:min-h-[340px] sm:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur ${bannerTheme.badgeBg}`}>
                    Featured Project Showcase
                  </span>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                    {project.status}
                  </span>
                </div>

                <div className="max-w-3xl space-y-3">
                  <p className={`text-xs font-bold uppercase tracking-[0.28em] ${bannerTheme.categoryColor}`}>
                    {project.category}
                  </p>
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                    {project.title}
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                    {project.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-white/90 backdrop-blur">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs font-semibold text-slate-300">
                  <span>{screenshots.length} Verified Screenshots & Workflow Views</span>
                  <span className={`uppercase tracking-[0.2em] font-bold ${bannerTheme.categoryColor}`}>
                    Row-Wise Gallery Below
                  </span>
                </div>
              </div>
            </section>

            {/* Detailed Description & Key Features */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-2">
              <div className="lg:col-span-2 space-y-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Detailed Overview
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed font-medium">
                    {project.detailedDescription}
                  </p>
                </div>

                {project.keyFeatures && project.keyFeatures.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Key Capabilities & Highlights
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.keyFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-colors">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Technology Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(project.status)}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      project.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                      {project.creationDate || '2025'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2 & 3. Premium Row-Wise Image Grid Gallery */}
            <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                    <Grid className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">Complete Screenshot Collection</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Row-Wise Gallery Walkthrough
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Browse all application screenshots in logical user-flow order. Click any image to open full-screen.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {filteredScreenshotItems.length} of {screenshots.length} Screenshots
                </span>
              </div>

              {/* Category Filter Tabs (when project has multiple categories like Desktop Web, Mobile App, PDF Report, Admin Console) */}
              {distinctCategories.length > 2 && (
                <div className="flex flex-wrap items-center gap-2">
                  {distinctCategories.map((cat) => {
                    const count =
                      cat === 'All'
                        ? screenshotItems.length
                        : screenshotItems.filter((i) => i.category === cat).length;
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Responsive Row-Wise CSS Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredScreenshotItems.map((item) => {
                  const fileNameOnly = item.rawPath.split('/').pop() || '';
                  return (
                    <article 
                      key={`${item.url}-${item.index}`}
                      onClick={() => { 
                        setActiveImageIndex(item.index); 
                        setIsViewerOpen(true); 
                      }}
                      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 cursor-pointer"
                    >
                      {/* Thumbnail Preview Area */}
                      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                        <img 
                          src={item.url} 
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).style.opacity = '0.3'; 
                          }} 
                        />
                        {/* Hover Overlay with Icon */}
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                            <Maximize2 className="w-4 h-4" />
                          </span>
                        </div>
                        {/* Index Badge */}
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 text-white font-mono text-[10px] font-bold backdrop-blur border border-white/10">
                          {String(item.index + 1).padStart(2, '0')}
                        </span>
                        {/* Category Badge on Top Right */}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-indigo-950/85 text-indigo-200 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur border border-indigo-400/20">
                          {item.category}
                        </span>
                      </div>

                      {/* Card Footer Info */}
                      <div className="p-4 flex flex-col justify-between flex-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h4>
                          {item.caption && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {item.caption}
                            </p>
                          )}
                        </div>
                        {fileNameOnly && (
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60" title={fileNameOnly}>
                            {fileNameOnly}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sticky Actions Footer */}
          <div className="px-6 py-5 sm:px-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
            {project.githubUrl && project.githubUrl !== "" && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 order-2 sm:order-1"
              >
                <Github className="w-5 h-5" />
                <span>Explore Source</span>
              </a>
            )}

            {project.liveDemoUrl && project.liveDemoUrl !== "" ? (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/20 active:scale-95 order-1 sm:order-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Launch Experience</span>
              </a>
            ) : (
              <div className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] text-center flex items-center justify-center gap-3 cursor-not-allowed order-1 sm:order-2">
                <Rocket className="w-5 h-5 opacity-50" />
                Experience Coming Soon
              </div>
            )}
          </div>
        </motion.div>

        {/* Fullscreen ImageViewer Component */}
        <ImageViewer
          isOpen={isViewerOpen}
          images={screenshots}
          currentIndex={activeImageIndex}
          titles={screenshotItems.map(i => i.title)}
          projectTitle={project.title}
          onClose={() => setIsViewerOpen(false)}
          onIndexChange={(idx) => setActiveImageIndex(idx)}
        />
      </div>
    </AnimatePresence>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Github, ArrowRight, Sparkles, Rocket } from 'lucide-react';
import { PROJECTS, Project } from '../data/portfolio';
import { ScrollReveal } from './ScrollReveal';
import { resolveProjectImageUrl } from '../services/projectFirebase';

interface FeaturedProjectsProps {
  onSelectProject: (project: Project) => void;
}

export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({ onSelectProject }) => {
  const featuredList = PROJECTS.filter((p) => p.featured).slice(0, 6);

  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 overflow-hidden relative">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal>
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Elite Selection</span>
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Masterpieces</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
              Hand-picked projects that demonstrate advanced problem solving, high-performance architecture, and seamless user experiences.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {featuredList.map((project, idx) => (
            <ScrollReveal key={project.id} delay={idx * 0.1} direction="up">
              <div className="group h-full flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700">
                
                {/* Visual Area */}
                <div 
                  className="relative aspect-[16/10] overflow-hidden cursor-pointer bg-slate-900"
                  onClick={() => onSelectProject(project)}
                >
                  <img
                    src={resolveProjectImageUrl(project.mainScreenshot)}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop';
                    }}
                  />
                  
                  {/* Glass Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="flex flex-wrap gap-2 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest text-white">
                        {project.category}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black text-white leading-tight mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      {project.title}
                    </h4>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-8 flex-1 flex flex-col space-y-6">
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 font-medium">
                    {project.shortDescription}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        +{project.techStack.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Area */}
                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onSelectProject(project)}
                    className="group/btn text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>

                  <div className="flex items-center gap-2">
                    {project.githubUrl && project.githubUrl !== "" && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-110 active:scale-95"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {project.liveDemoUrl && project.liveDemoUrl !== "" && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-110 active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.5}>
          <div className="mt-20 text-center">
            <a 
              href="#projects" 
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>Explore All Projects</span>
            </a>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};

// Simple LayoutGrid icon for the link
const LayoutGrid = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
  </svg>
);

import React from 'react';
import { motion } from 'motion/react';
import { Github, ExternalLink, GitBranch, GitCommit, Code, Star } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { ScrollReveal } from './ScrollReveal';
import { getProjectMetrics } from '../utils/portfolioMetrics';

export const GithubSection: React.FC = () => {
  const { settings, projects } = usePortfolio();
  const { githubRepoCount } = getProjectMetrics(projects);
  const githubUser = (settings.github || '').replace(/\/+$/, '').split('/').pop() || 'nitesh933438';
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="up" delay={0.2}>
          <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl text-white relative overflow-hidden group">
          
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Github className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
              <Github className="w-3.5 h-3.5" />
              <span>Open Source & Repositories</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Explore my GitHub Activity & Codebase
            </h3>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              All my projects, source code, and version-controlled repositories are publicly accessible on GitHub. Feel free to explore, star repositories, or review my contributions.
            </p>

            <div className="flex flex-wrap gap-6 pt-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>{githubRepoCount}+ Public Repositories</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Full-Stack & AI</span>
              </div>
            </div>

            <div className="pt-4">
              <a
                href={settings.github || 'https://github.com/nitesh933438'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
              >
                <Github className="w-5 h-5" />
                <span>Visit @{githubUser} on GitHub</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};

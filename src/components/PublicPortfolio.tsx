import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { About } from './About';
import { Education } from './Education';
import { Skills } from './Skills';
import { FeaturedProjects } from './FeaturedProjects';
import { ProjectsCatalogue } from './ProjectsCatalogue';
import { EducationExperience } from './EducationExperience';
import { GithubSection } from './GithubSection';
import { Contact } from './Contact';
import { Footer } from './Footer';
import { ProjectModal } from './ProjectModal';
import { ResumeModal } from './ResumeModal';
import { ScrollProgressBar } from './ScrollProgressBar';
import { LoadingScreen } from './LoadingScreen';
import { Certifications } from './Certifications';
import { usePortfolio } from '../context/PortfolioContext';
import { parsePortfolioSectionTarget } from '../utils/navigationHelpers';

export const PublicPortfolio: React.FC<{ theme: any, setTheme: any }> = ({ theme, setTheme }) => {
  const { projects } = usePortfolio();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const location = useLocation();
  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  // Handle section navigation (e.g. returning to ?section=certifications, #projects, or { scrollTo })
  useEffect(() => {
    const targetSection = parsePortfolioSectionTarget({
      pathname: location.pathname,
      hash: window.location.hash,
      search: location.search,
      state: location.state,
    });

    if (!targetSection) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 16;
    let timerId: number | undefined;

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(targetSection);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        timerId = window.setTimeout(tryScroll, 50);
      }
    };

    // Wait briefly so AnimatePresence exit/enter finishes mounting the target section
    timerId = window.setTimeout(tryScroll, 50);
    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [location.pathname, location.search, location.hash, location.state, location.key]);

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <LoadingScreen />
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={setTheme} onOpenResume={() => setResumeModalOpen(true)} />
      <main className="relative">
        <Hero onOpenResume={() => setResumeModalOpen(true)} />
        <About onOpenResume={() => setResumeModalOpen(true)} />
        <Education />
        <Skills />
        <FeaturedProjects onSelectProject={(p) => setSelectedProjectId(p.id)} />
        <ProjectsCatalogue onSelectProject={(p) => setSelectedProjectId(p.id)} />
        <EducationExperience />
        <Certifications />
        <GithubSection />
        <Contact />
      </main>
      <Footer onOpenResume={() => setResumeModalOpen(true)} />
      <ProjectModal project={selectedProject} onClose={() => setSelectedProjectId(null)} />
      <ResumeModal isOpen={resumeModalOpen} onClose={() => setResumeModalOpen(false)} />
    </div>
  );
};

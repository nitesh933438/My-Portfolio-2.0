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
import { Project } from '../data/portfolio';

export const PublicPortfolio: React.FC<{ theme: any, setTheme: any }> = ({ theme, setTheme }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const location = useLocation();

  // Handle hash navigation (e.g. returning to #certifications or #projects)
  useEffect(() => {
    const rawHash = window.location.hash;
    // Extract section if present after public route, e.g. #/certifications or #certifications
    const match = rawHash.match(/#\/?([a-zA-Z0-9_-]+)$/);
    const targetSection = match ? match[1] : '';

    if (targetSection && targetSection !== 'admin' && !targetSection.startsWith('verify')) {
      const el = document.getElementById(targetSection);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }
  }, [location.pathname]);

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
        <FeaturedProjects onSelectProject={(p) => setSelectedProject(p)} />
        <ProjectsCatalogue onSelectProject={(p) => setSelectedProject(p)} />
        <EducationExperience />
        <Certifications />
        <GithubSection />
        <Contact />
      </main>
      <Footer onOpenResume={() => setResumeModalOpen(true)} />
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      <ResumeModal isOpen={resumeModalOpen} onClose={() => setResumeModalOpen(false)} />
    </div>
  );
};

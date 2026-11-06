import React, { useState } from 'react';
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

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <LoadingScreen />
      <ScrollProgressBar />
      <Navbar theme={theme} setTheme={setTheme} onOpenResume={() => setResumeModalOpen(true)} />
      <main className="relative">
        <Hero onOpenResume={() => setResumeModalOpen(true)} />
        <About />
        <Education />
        <Skills />
        <FeaturedProjects onSelectProject={(p) => setSelectedProject(p)} />
        <ProjectsCatalogue onSelectProject={(p) => setSelectedProject(p)} />
        <EducationExperience />
        <Certifications />
        <GithubSection />
        <Contact />
      </main>
      <Footer />
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      <ResumeModal isOpen={resumeModalOpen} onClose={() => setResumeModalOpen(false)} />
    </div>
  );
};

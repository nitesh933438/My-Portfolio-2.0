import { useState, useEffect, FC } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Education } from './components/Education';
import { Skills } from './components/Skills';
import { FeaturedProjects } from './components/FeaturedProjects';
import { ProjectsCatalogue } from './components/ProjectsCatalogue';
import { EducationExperience } from './components/EducationExperience';
import { GithubSection } from './components/GithubSection';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { ProjectModal } from './components/ProjectModal';
import { ResumeModal } from './components/ResumeModal';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { ScrollReveal } from './components/ScrollReveal';
import { LoadingScreen } from './components/LoadingScreen';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { Certifications } from './components/Certifications';
import { CertificateAdminPage } from './components/CertificateAdminPage';
import { Project, validatePortfolioData } from './data/portfolio';
import { ACADEMIC_DATA, UniversityRecord } from './data/education';
import { subscribeToUniversityRecord, initializeAcademicDataInFirestore } from './services/academicFirebase';

const App: FC = () => {
  type ThemeMode = 'light' | 'dark' | 'system';
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('nitesh_portfolio_theme') as ThemeMode) || 'system';
  });

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.hash;
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [liveUniversity, setLiveUniversity] = useState<UniversityRecord>(ACADEMIC_DATA.university);

  useEffect(() => {
    initializeAcademicDataInFirestore();
    const unsub = subscribeToUniversityRecord((data) => {
      setLiveUniversity(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname + window.location.hash);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('nitesh_portfolio_theme', theme);
    
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (t: ThemeMode) => {
      const isDark = t === 'dark' || (t === 'system' && mediaQuery.matches);
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };

    applyTheme(theme);
    
    const listener = () => applyTheme(theme);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const errors = validatePortfolioData();
      if (errors.length > 0) {
        console.warn('Portfolio Data Validation Errors:', errors);
      }
    }
  }, []);

  const isCertificateAdminRoute = currentPath.includes('#admin-certificates') || currentPath.includes('/admin/certificates');

  if (isCertificateAdminRoute) {
    return <CertificateAdminPage onBack={() => { window.location.hash = ''; window.history.pushState(null, '', '/'); setCurrentPath('/'); }} />;
  }

  const isAdminRoute = 
    currentPath.includes('/admin/academic') || 
    currentPath.includes('#admin-academic') || 
    currentPath.includes('#/admin/academic');

  if (isAdminRoute) {
    return (
      <AdminDashboardPage
        theme={theme}
        setTheme={setTheme}
        onNavigateHome={() => {
          window.location.hash = '';
          window.history.pushState(null, '', '/');
          setCurrentPath('/');
        }}
        currentUniversity={liveUniversity}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <LoadingScreen />
      <ScrollProgressBar />
      
      <Navbar 
        theme={theme} 
        setTheme={setTheme} 
        onOpenResume={() => setResumeModalOpen(true)} 
      />

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

      <ProjectModal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />

      <ResumeModal 
        isOpen={resumeModalOpen} 
        onClose={() => setResumeModalOpen(false)} 
      />
    </div>
  );
};

export default App;

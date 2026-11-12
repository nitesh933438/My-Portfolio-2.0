import { useState, useEffect, FC } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PublicPortfolio } from './components/PublicPortfolio';
import { PortfolioProvider } from './context/PortfolioContext';
import { AIScannerProvider } from './context/AIScannerContext';

import { ACADEMIC_DATA, UniversityRecord } from './data/education';
import { 
  subscribeToUniversityRecord, 
  initializeAcademicDataInFirestore,
  subscribeToSiteSettings,
  initializeSiteSettingsInFirestore,
  SiteSettings
} from './services/academicFirebase';
import { initializeProjectsInFirestore } from './services/projectFirebase';
import { initializeCertificatesInFirestore } from './services/certificateFirebase';

// Admin & Verification Components (Eagerly loaded for 0ms instant navigation)
import { AdminAuthGuard } from './components/AdminAuthGuard';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { CertificateAdminPage } from './components/CertificateAdminPage';
import { ProjectsManager } from './components/admin/ProjectsManager';
import { EducationManager } from './components/admin/EducationManager';
import { MessagesManager } from './components/admin/MessagesManager';
import { SettingsManager } from './components/admin/SettingsManager';
import { AIAssistantPage } from './components/admin/AIAssistantPage';
import { SkillsManager } from './components/admin/SkillsManager';
import { ExperienceManager } from './components/admin/ExperienceManager';
import { CertificateVerifyPage } from './components/CertificateVerifyPage';
import { SITE_CONFIG } from './data/portfolio';

type ThemeMode = 'light' | 'dark' | 'system';

interface AnimatedAppRoutesProps {
  theme: ThemeMode;
  setTheme: (val: ThemeMode) => void;
  liveUniversity: UniversityRecord;
}

const AnimatedAppRoutes: FC<AnimatedAppRoutesProps> = ({ theme, setTheme, liveUniversity }) => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/verify')) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const routeTransitionKey = location.pathname.startsWith('/admin')
    ? 'admin-root'
    : location.pathname.startsWith('/verify')
    ? location.pathname
    : 'public-portfolio';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeTransitionKey}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
        }}
        exit={{ 
          opacity: 0,
          transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] }
        }}
        className={
          location.pathname.startsWith('/admin')
            ? 'w-full h-dvh overflow-hidden'
            : 'w-full min-h-screen'
        }
      >
        <Routes location={location}>
          <Route path="/verify/:certId" element={<CertificateVerifyPage />} />
          <Route path="/verify" element={<CertificateVerifyPage />} />
          <Route path="/*" element={<PublicPortfolio theme={theme} setTheme={setTheme} />} />
          <Route path="/admin" element={
            <AdminAuthGuard>
              <AdminLayout theme={theme} setTheme={setTheme} />
            </AdminAuthGuard>
          }>
            <Route index element={
              <AdminDashboardPage theme={theme} setTheme={setTheme} onNavigateHome={() => window.location.href = '#/'} currentUniversity={liveUniversity} />
            } />
            <Route path="certificates" element={
              <CertificateAdminPage onBack={() => window.location.href = '#/admin'} />
            } />
            <Route path="projects" element={<ProjectsManager />} />
            <Route path="education" element={<EducationManager />} />
            <Route path="messages" element={<MessagesManager />} />
            <Route path="skills" element={<SkillsManager />} />
            <Route path="experience" element={<ExperienceManager />} />
            <Route path="settings" element={<SettingsManager />} />
            <Route path="ai" element={<AIAssistantPage />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App: FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('nitesh_portfolio_theme') as ThemeMode) || 'system';
  });

  const [liveUniversity, setLiveUniversity] = useState<UniversityRecord>(ACADEMIC_DATA.university);
  const [liveSettings, setLiveSettings] = useState<SiteSettings>(SITE_CONFIG as SiteSettings);

  useEffect(() => {
    const unsubUniversity = subscribeToUniversityRecord((data) => {
      setLiveUniversity(data);
    });
    
    const unsubSettings = subscribeToSiteSettings((data) => {
      setLiveSettings(data);
    });

    // Defer background initialization checks so initial render & scrolling are 100% unblocked
    const seedTimer = window.setTimeout(() => {
      initializeAcademicDataInFirestore();
      initializeSiteSettingsInFirestore();
      initializeProjectsInFirestore();
      initializeCertificatesInFirestore();
    }, 1200);
    
    return () => {
      window.clearTimeout(seedTimer);
      unsubUniversity();
      unsubSettings();
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

  return (
    <AIScannerProvider>
      <PortfolioProvider settings={liveSettings}>
        <HashRouter>
          <AnimatedAppRoutes 
            theme={theme} 
            setTheme={setTheme} 
            liveUniversity={liveUniversity} 
          />
        </HashRouter>
      </PortfolioProvider>
    </AIScannerProvider>
  );
};

export default App;

import { useState, useEffect, FC, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './components/LoadingScreen';
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


// Admin Components
import { AdminAuthGuard } from './components/AdminAuthGuard';
import { AdminLayout } from './components/AdminLayout';
const AdminDashboardPage = lazy(() => import('./components/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const CertificateAdminPage = lazy(() => import('./components/CertificateAdminPage').then(m => ({ default: m.CertificateAdminPage })));
const ProjectsManager = lazy(() => import('./components/admin/ProjectsManager').then(m => ({ default: m.ProjectsManager })));
const EducationManager = lazy(() => import('./components/admin/EducationManager').then(m => ({ default: m.EducationManager })));
const MessagesManager = lazy(() => import('./components/admin/MessagesManager').then(m => ({ default: m.MessagesManager })));
const SettingsManager = lazy(() => import('./components/admin/SettingsManager').then(m => ({ default: m.SettingsManager })));
const AIAssistantPage = lazy(() => import('./components/admin/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const SkillsManager = lazy(() => import('./components/admin/SkillsManager').then(m => ({ default: m.SkillsManager })));
const ExperienceManager = lazy(() => import('./components/admin/ExperienceManager').then(m => ({ default: m.ExperienceManager })));
const CertificateVerifyPage = lazy(() => import('./components/CertificateVerifyPage').then(m => ({ default: m.CertificateVerifyPage })));
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
        }}
        exit={{ 
          opacity: 0, 
          y: -6,
          transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
        }}
        className="w-full min-h-screen"
      >
        <Routes location={location}>
          <Route path="/verify/:certId" element={
            <Suspense fallback={<LoadingScreen />}>
              <CertificateVerifyPage />
            </Suspense>
          } />
          <Route path="/verify" element={
            <Suspense fallback={<LoadingScreen />}>
              <CertificateVerifyPage />
            </Suspense>
          } />
          <Route path="/*" element={<PublicPortfolio theme={theme} setTheme={setTheme} />} />
          <Route path="/admin" element={
            <AdminAuthGuard>
              <AdminLayout theme={theme} setTheme={setTheme} />
            </AdminAuthGuard>
          }>
            <Route index element={
              <Suspense fallback={<LoadingScreen />}>
                <AdminDashboardPage theme={theme} setTheme={setTheme} onNavigateHome={() => window.location.href = '#/'} currentUniversity={liveUniversity} />
              </Suspense>
            } />
            <Route path="certificates" element={
              <Suspense fallback={<LoadingScreen />}>
                <CertificateAdminPage onBack={() => window.location.href = '#/admin'} />
              </Suspense>
            } />
            <Route path="projects" element={
              <Suspense fallback={<LoadingScreen />}>
                <ProjectsManager />
              </Suspense>
            } />
            <Route path="education" element={
              <Suspense fallback={<LoadingScreen />}>
                <EducationManager />
              </Suspense>
            } />
            <Route path="messages" element={
              <Suspense fallback={<LoadingScreen />}>
                <MessagesManager />
              </Suspense>
            } />
            <Route path="skills" element={
              <Suspense fallback={<LoadingScreen />}>
                <SkillsManager />
              </Suspense>
            } />
            <Route path="experience" element={
              <Suspense fallback={<LoadingScreen />}>
                <ExperienceManager />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LoadingScreen />}>
                <SettingsManager />
              </Suspense>
            } />
            <Route path="ai" element={
              <Suspense fallback={<LoadingScreen />}>
                <AIAssistantPage />
              </Suspense>
            } />
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
    initializeAcademicDataInFirestore();
    initializeSiteSettingsInFirestore();
    initializeProjectsInFirestore();
    initializeCertificatesInFirestore();
    
    const unsubUniversity = subscribeToUniversityRecord((data) => {
      setLiveUniversity(data);
    });
    
    const unsubSettings = subscribeToSiteSettings((data) => {
      setLiveSettings(data);
    });
    
    return () => {
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

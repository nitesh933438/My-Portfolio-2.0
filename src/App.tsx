import { useState, useEffect, FC, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { PublicPortfolio } from './components/PublicPortfolio';
import { ACADEMIC_DATA, UniversityRecord } from './data/education';
import { subscribeToUniversityRecord, initializeAcademicDataInFirestore } from './services/academicFirebase';

// Admin Components
import { AdminAuthGuard } from './components/AdminAuthGuard';
import { AdminLayout } from './components/AdminLayout';
const AdminDashboardPage = lazy(() => import('./components/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const CertificateAdminPage = lazy(() => import('./components/CertificateAdminPage').then(m => ({ default: m.CertificateAdminPage })));
const ProjectsManager = lazy(() => import('./components/admin/ProjectsManager').then(m => ({ default: m.ProjectsManager })));
const EducationManager = lazy(() => import('./components/admin/EducationManager').then(m => ({ default: m.EducationManager })));
const MessagesManager = lazy(() => import('./components/admin/MessagesManager').then(m => ({ default: m.MessagesManager })));
const SettingsManager = lazy(() => import('./components/admin/SettingsManager').then(m => ({ default: m.SettingsManager })));

const App: FC = () => {
  type ThemeMode = 'light' | 'dark' | 'system';
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('nitesh_portfolio_theme') as ThemeMode) || 'system';
  });

  const [liveUniversity, setLiveUniversity] = useState<UniversityRecord>(ACADEMIC_DATA.university);

  useEffect(() => {
    initializeAcademicDataInFirestore();
    const unsub = subscribeToUniversityRecord((data) => {
      setLiveUniversity(data);
    });
    return () => unsub();
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
    <HashRouter>
      <Routes>
        <Route path="/*" element={<PublicPortfolio theme={theme} setTheme={setTheme} />} />
        <Route path="/admin" element={
          <AdminAuthGuard>
            <AdminLayout />
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
          <Route path="settings" element={
            <Suspense fallback={<LoadingScreen />}>
              <SettingsManager />
            </Suspense>
          } />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;

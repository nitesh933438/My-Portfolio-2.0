import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  LogOut, 
  Lock, 
  Building2, 
  Calendar, 
  Layers, 
  FileCheck,
  ShieldCheck,
  Edit3,
  Eye,
  RefreshCw,
  Clock,
  History,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Settings,
  Menu,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Camera,
  Sun,
  Moon,
  ArrowLeft,
  Award
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  isUserAdmin, 
  ADMIN_EMAIL, 
  publishSemesterResult,
  fetchAuditHistory,
  rollbackSemesterResult,
  AuditRecordItem
} from '../services/academicFirebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { SemesterResult, UniversityRecord, ACADEMIC_DATA } from '../data/education';

interface AdminDashboardPageProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  onNavigateHome: () => void;
  currentUniversity: UniversityRecord;
}

type TabKey = 
  | 'overview' 
  | 'upload' 
  | 'records' 
  | 'semesters' 
  | 'ai-extraction' 
  | 'approvals' 
  | 'history' 
  | 'settings';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  theme,
  setTheme,
  onNavigateHome,
  currentUniversity,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Upload & Extraction states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  // Form editable states before publishing
  const [targetSemester, setTargetSemester] = useState<number>(3);
  const [sgpaInput, setSgpaInput] = useState<string>('');
  const [cgpaInput, setCgpaInput] = useState<string>('');
  const [declarationDateInput, setDeclarationDateInput] = useState<string>('');
  const [statusInput, setStatusInput] = useState<'PASS' | 'FAIL'>('PASS');
  const [academicYearInput, setAcademicYearInput] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Audit history
  const [auditList, setAuditList] = useState<AuditRecordItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(isUserAdmin(currentUser));
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'overview') {
      loadAuditRecords();
    }
  }, [activeTab]);

  const loadAuditRecords = async () => {
    setAuditLoading(true);
    const records = await fetchAuditHistory();
    setAuditList(records);
    setAuditLoading(false);
  };

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setExtractionError('File size exceeds 20MB limit.');
      return;
    }

    setSelectedFile(file);
    setExtractionError(null);
    setExtractedData(null);
    setPublishSuccess(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractWithAI = async () => {
    if (!selectedFile || !fileBase64) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const response = await fetch('/api/academic/extract-marksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      const extracted = result.extractedData;
      setExtractedData(extracted);
      setActiveTab('approvals');

      // Pre-populate editable fields from AI extraction
      if (extracted.semesterNumber) {
        setTargetSemester(Number(extracted.semesterNumber));
      }
      if (extracted.sgpa !== undefined && extracted.sgpa !== null) {
        setSgpaInput(String(extracted.sgpa));
      }
      if (extracted.officialCGPA) {
        setCgpaInput(String(extracted.officialCGPA));
      }
      if (extracted.resultDeclarationDate) {
        setDeclarationDateInput(extracted.resultDeclarationDate);
      }
      if (extracted.passFailStatus) {
        setStatusInput(extracted.passFailStatus.toUpperCase().includes('FAIL') ? 'FAIL' : 'PASS');
      }
      if (extracted.academicSession) {
        setAcademicYearInput(extracted.academicSession);
      }
    } catch (err: any) {
      console.error('Document extraction error:', err);
      setExtractionError(err.message || 'Error communicating with AI extraction backend');
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePublish = async () => {
    if (!sgpaInput || isNaN(parseFloat(sgpaInput))) {
      setExtractionError('Please provide a valid SGPA value before approving.');
      return;
    }

    setIsPublishing(true);
    try {
      const semesterPayload: SemesterResult = {
        semesterNumber: targetSemester,
        semesterLabel: `Semester ${targetSemester}`,
        academicYear: academicYearInput || '2026–2027',
        sgpa: parseFloat(sgpaInput),
        resultDeclarationDate: declarationDateInput || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: statusInput,
        statusLabel: statusInput === 'PASS' ? 'Pass' : 'Fail',
        isDeclared: true,
      };

      await publishSemesterResult(semesterPayload, {
        fileName: selectedFile?.name || `Semester_${targetSemester}_Manual_Update`,
        adminEmail: user?.email || ADMIN_EMAIL,
        extractedData: extractedData || {},
        officialCGPA: cgpaInput ? parseFloat(cgpaInput) : undefined,
      });

      setPublishSuccess(true);
      setActionMessage(`Semester ${targetSemester} result published successfully!`);
      loadAuditRecords();
      setTimeout(() => {
        setPublishSuccess(false);
        setActionMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setExtractionError(err.message || 'Failed to publish to database');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (semNumber: number) => {
    if (!window.confirm(`Are you sure you want to rollback Semester ${semNumber} back to upcoming status?`)) {
      return;
    }

    const success = await rollbackSemesterResult(semNumber, user?.email || ADMIN_EMAIL);
    if (success) {
      setActionMessage(`Semester ${semNumber} rolled back successfully.`);
      loadAuditRecords();
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Metrics for overview
  const declaredSemesters = currentUniversity.semesters.filter(s => s.isDeclared && s.sgpa);
  const latestSem = [...declaredSemesters].sort((a, b) => b.semesterNumber - a.semesterNumber)[0];
  const upcomingCount = currentUniversity.semesters.filter(s => !s.isDeclared).length;

  const navItems = [
    { key: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { key: 'upload' as const, label: 'Upload Marksheet', icon: Upload },
    { key: 'records' as const, label: 'Academic Records', icon: BookOpen },
    { key: 'semesters' as const, label: 'Semester Management', icon: Layers },
    { key: 'ai-extraction' as const, label: 'AI Extraction', icon: Sparkles },
    { key: 'approvals' as const, label: 'Pending Approvals', icon: FileCheck },
    { key: 'history' as const, label: 'Document History', icon: History },
    { key: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Portfolio</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight block leading-tight">
                Academic Management System
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold block">
                Private Admin Console
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-xs font-semibold text-slate-500">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar for Desktop / Drawer for Mobile */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Dashboard Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => { window.location.hash = 'admin-certificates'; }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Certificates Manager</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">Authorized Admin</div>
            <div className="text-slate-400 font-mono text-[10px] truncate">{ADMIN_EMAIL}</div>
            <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Firestore Real-Time Sync
            </div>
          </div>
        </aside>

        {/* Overlay for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/60 lg:hidden"
          />
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* Action Notification Banner */}
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMessage}</span>
            </motion.div>
          )}

          {/* Auth Guard Screen */}
          {authLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-xs text-slate-500">Checking credentials & security permissions...</p>
            </div>
          ) : !user ? (
            <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin Authentication Required</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  This console is private. Please sign in with your authorized administrator Google account (<strong>{ADMIN_EMAIL}</strong>).
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Sign In with Google (Admin)
              </button>
            </div>
          ) : !isAdmin ? (
            <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current account <strong>{user.email}</strong> is not granted academic administrative rights.
              </p>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            /* Authenticated Admin Views by Tab */
            <div className="space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Completed Semesters
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                        {declaredSemesters.length} <span className="text-xs font-normal text-slate-400">/ 8</span>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold mt-1 block">
                        {upcomingCount} Upcoming Semesters
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Latest SGPA
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                        {latestSem?.sgpa?.toFixed(2) || '—'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        {latestSem?.semesterLabel || 'No Semesters'}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Academic Qualifications
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-cyan-400 mt-1 tabular-nums">
                        3
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        B.Tech, 12th, 10th
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Audit Logs
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                        {auditList.length}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        Recorded Transactions
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border border-indigo-200 dark:border-indigo-800/80 text-left hover:scale-[1.02] transition-transform space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Upload New Marksheet</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Upload semester PDF or image to extract and publish.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('semesters')}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:scale-[1.02] transition-transform space-y-2 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Semester Dashboard</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage active and upcoming semester cards.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('history')}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:scale-[1.02] transition-transform space-y-2 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <History className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Document History</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Audit trail, rollback accidental changes.
                      </p>
                    </button>
                  </div>

                  {/* Recent Activity Table */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Recent Academic Events & Updates
                    </h4>
                    {auditList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4">No audit transactions recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="pb-3">Action / File</th>
                              <th className="pb-3">Semester</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Date</th>
                              <th className="pb-3">Admin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {auditList.slice(0, 5).map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{rec.fileName}</td>
                                <td className="py-3">Semester {rec.semesterNumber}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    rec.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500">{new Date(rec.approvedAt).toLocaleDateString()}</td>
                                <td className="py-3 text-slate-500 truncate max-w-[120px]">{rec.approvedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2 & 5: UPLOAD & AI EXTRACTION */}
              {(activeTab === 'upload' || activeTab === 'ai-extraction') && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Upload & Parse Official Marksheet
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Upload semester grade card (PDF, PNG, JPG). Server-side Gemini AI model automatically extracts grades, SGPA, and subject lists.
                      </p>
                    </div>

                    <div className="p-8 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
                        <Upload className="w-8 h-8" />
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf,image/png,image/jpeg,image/jpg"
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white shadow-sm hover:border-indigo-500 transition-colors"
                        >
                          {selectedFile ? selectedFile.name : 'Choose File (PDF/Image)'}
                        </button>

                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture Photo</span>
                        </button>

                        {selectedFile && (
                          <button
                            onClick={handleExtractWithAI}
                            disabled={isExtracting}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                          >
                            {isExtracting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Processing with Gemini OCR...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-cyan-300" />
                                <span>Extract Academic Data</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {selectedFile && (
                        <p className="text-xs text-slate-500">
                          File: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    {extractionError && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{extractionError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4 & 6: APPROVALS & VERIFICATION */}
              {activeTab === 'approvals' && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          Verify & Approve Marksheet Result
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Review extracted values. You can make adjustments before approving to the public portfolio.
                        </p>
                      </div>
                      {extractedData && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                          AI Verified
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Target Semester
                        </label>
                        <select
                          value={targetSemester}
                          onChange={(e) => setTargetSemester(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              Semester {num} {currentUniversity.semesters.find(s => s.semesterNumber === num)?.isDeclared ? '(Already Declared)' : '(Upcoming)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Official SGPA (e.g. 8.50)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sgpaInput}
                          onChange={(e) => setSgpaInput(e.target.value)}
                          placeholder="e.g. 8.50"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Declaration Date
                        </label>
                        <input
                          type="text"
                          value={declarationDateInput}
                          onChange={(e) => setDeclarationDateInput(e.target.value)}
                          placeholder="e.g. 15 December 2026"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Academic Session
                        </label>
                        <input
                          type="text"
                          value={academicYearInput}
                          onChange={(e) => setAcademicYearInput(e.target.value)}
                          placeholder="e.g. 2026–2027"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Semester Status
                        </label>
                        <select
                          value={statusInput}
                          onChange={(e) => setStatusInput(e.target.value as 'PASS' | 'FAIL')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Official CGPA (Optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={cgpaInput}
                          onChange={(e) => setCgpaInput(e.target.value)}
                          placeholder="Leave blank if not on marksheet"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Extracted Subjects Table */}
                    {extractedData?.subjectWisePerformance && extractedData.subjectWisePerformance.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                          Parsed Subjects ({extractedData.subjectWisePerformance.length})
                        </h5>
                        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-[10px] font-bold uppercase">
                              <tr>
                                <th className="p-3">Code</th>
                                <th className="p-3">Subject Name</th>
                                <th className="p-3">Grade/Marks</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {extractedData.subjectWisePerformance.map((sub: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="p-3 font-mono text-indigo-500">{sub.subjectCode || '—'}</td>
                                  <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{sub.subjectName}</td>
                                  <td className="p-3 font-bold">{sub.grade || sub.marksObtained || '—'}</td>
                                  <td className="p-3">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600">
                                      {sub.status || 'PASS'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400">
                        Approving updates the live Firestore database and triggers public portfolio refresh.
                      </p>
                      <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Publishing to Firestore...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Publish Result</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3 & 4: ACADEMIC RECORDS & SEMESTERS */}
              {(activeTab === 'records' || activeTab === 'semesters') && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          B.Tech CSE Semester Control
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Directly inspect, edit, or rollback any semester result.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {currentUniversity.semesters.map((sem) => (
                        <div
                          key={sem.semesterNumber}
                          className={`p-5 rounded-2xl border flex flex-col justify-between ${
                            sem.isDeclared
                              ? 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                                {sem.semesterLabel}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                sem.isDeclared ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {sem.statusLabel}
                              </span>
                            </div>

                            {sem.isDeclared ? (
                              <div className="my-2">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">SGPA</span>
                                <div className="text-2xl font-black text-indigo-600 dark:text-cyan-400 tabular-nums">
                                  {sem.sgpa?.toFixed(2)}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  Declared: {sem.resultDeclarationDate}
                                </span>
                              </div>
                            ) : (
                              <div className="my-3 text-xs text-slate-400 font-semibold">
                                Result Not Declared
                              </div>
                            )}
                          </div>

                          {sem.isDeclared && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  setTargetSemester(sem.semesterNumber);
                                  setSgpaInput(String(sem.sgpa || ''));
                                  setDeclarationDateInput(sem.resultDeclarationDate || '');
                                  setActiveTab('approvals');
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleRollback(sem.semesterNumber)}
                                className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Rollback</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: DOCUMENT HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          Academic Document Audit Trail
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Immutable log of marksheet extractions, approvals, and rollback events.
                        </p>
                      </div>
                      <button
                        onClick={loadAuditRecords}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {auditLoading ? (
                      <div className="py-12 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      </div>
                    ) : auditList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6">No audit history found.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="p-3">File / Action</th>
                              <th className="p-3">Semester</th>
                              <th className="p-3">SGPA</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Admin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {auditList.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.fileName}</td>
                                <td className="p-3">Semester {item.semesterNumber}</td>
                                <td className="p-3 font-bold">{item.sgpa?.toFixed(2) || '—'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                    item.status === 'APPROVED' 
                                      ? 'bg-emerald-500/10 text-emerald-600' 
                                      : item.status === 'ROLLED_BACK'
                                      ? 'bg-amber-500/10 text-amber-600'
                                      : 'bg-rose-500/10 text-rose-600'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500">{new Date(item.approvedAt).toLocaleString()}</td>
                                <td className="p-3 text-slate-500 font-mono text-[10px]">{item.approvedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        System Configuration & Permissions
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Backend services, security policies, and environment information.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">AI OCR Model</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">Gemini 3.8 Flash (Multimodal)</div>
                        <p className="text-[10px] text-slate-500">Extracts marksheets on server-side without client key exposure.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Primary Database</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">Google Cloud Firestore</div>
                        <p className="text-[10px] text-slate-500">Live snapshot updates push approved grades to visitors.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Admin Email</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{ADMIN_EMAIL}</div>
                        <p className="text-[10px] text-slate-500">Only this Google identity can perform modifications.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Security Rules</span>
                        <div className="font-bold text-emerald-500">ABAC Enforced (Zero-Trust)</div>
                        <p className="text-[10px] text-slate-500">Private audit trails & public read-only academic projection.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

    </div>
  );
};

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
  History
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  isUserAdmin, 
  ADMIN_EMAIL, 
  publishSemesterResult 
} from '../services/academicFirebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { SemesterResult, UniversityRecord } from '../data/education';

interface AcademicAdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUniversity: UniversityRecord;
}

export const AcademicAdminDashboard: React.FC<AcademicAdminDashboardProps> = ({
  isOpen,
  onClose,
  currentUniversity,
}) => {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(isUserAdmin(currentUser));
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

    // Check size limit: 20MB
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
        fileName: selectedFile?.name || 'manual-entry',
        adminEmail: user?.email || ADMIN_EMAIL,
        extractedData: extractedData || {},
      });

      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setExtractionError(err.message || 'Failed to publish to database');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Academic Management System
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Private Administration & AI Marksheet Extraction
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Authentication Barrier */}
          {authLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Verifying administrative access...</p>
            </div>
          ) : !user ? (
            <div className="py-16 text-center max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Admin Sign-In Required
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Academic record updates and marksheet uploads are strictly restricted to the authorized portfolio administrator.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Sign In with Google (Admin)
              </button>
            </div>
          ) : !isAdmin ? (
            <div className="py-16 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Access Denied
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are currently signed in as <strong>{user.email}</strong>, which is not authorized as the academic administrator.
              </p>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign Out & Switch Account
              </button>
            </div>
          ) : (
            /* Authenticated Admin View */
            <div className="mt-6 space-y-8">
              
              {/* Admin status pill */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Signed in as <strong>{user.email}</strong> (Authorized Admin)
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Upload & Extraction Zone */}
              <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/80">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Upload Official Marksheet Document
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                      Supports PDF, PNG, JPG, and JPEG. Gemini multimodal AI will parse university grades, SGPA, credits, and subject breakdown automatically.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf,image/png,image/jpeg,image/jpg"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-sm hover:border-indigo-500 transition-colors"
                    >
                      {selectedFile ? selectedFile.name : 'Select Marksheet File'}
                    </button>

                    {selectedFile && (
                      <button
                        onClick={handleExtractWithAI}
                        disabled={isExtracting}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Extracting with Gemini AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Extract Information</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {extractionError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{extractionError}</span>
                  </div>
                )}
              </div>

              {/* Extraction Preview & Verification Form */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Review & Approve Academic Record
                    </h4>
                  </div>
                  {extractedData && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Extracted
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Result Declaration Date
                    </label>
                    <input
                      type="text"
                      value={declarationDateInput}
                      onChange={(e) => setDeclarationDateInput(e.target.value)}
                      placeholder="e.g. 15 December 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Academic Session / Year
                    </label>
                    <input
                      type="text"
                      value={academicYearInput}
                      onChange={(e) => setAcademicYearInput(e.target.value)}
                      placeholder="e.g. 2026–2027"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Semester Status
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value as 'PASS' | 'FAIL')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Subject-Wise Performance Table if Extracted */}
                {extractedData?.subjectWisePerformance && extractedData.subjectWisePerformance.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                      Extracted Subject Performance ({extractedData.subjectWisePerformance.length} Subjects)
                    </h5>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Subject</th>
                            <th className="p-2.5">Grade / Marks</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {extractedData.subjectWisePerformance.map((sub: any, sIdx: number) => (
                            <tr key={sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="p-2.5 font-mono text-indigo-500">{sub.subjectCode || '—'}</td>
                              <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">{sub.subjectName}</td>
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">{sub.grade || sub.marksObtained || '—'}</td>
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  sub.status === 'PASS' 
                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}>
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

                {/* Publish Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Approving updates Firestore in real-time without requiring a new Git commit or deployment.
                  </div>

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
                        <span>Approve & Update Portfolio</span>
                      </>
                    )}
                  </button>
                </div>

                {publishSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Academic record published successfully! Public Education section refreshed in real-time.</span>
                  </motion.div>
                )}
              </div>

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

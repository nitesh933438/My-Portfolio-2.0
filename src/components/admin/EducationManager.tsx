import React, { useState, useEffect } from 'react';
import { ACADEMIC_DATA, UniversityRecord, SchoolRecord, SemesterResult } from '../../data/education';
import { subscribeToUniversityRecord, publishSemesterResult, rollbackSemesterResult } from '../../services/academicFirebase';
import { db, auth, isUserAdmin } from '../../services/academicFirebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { GraduationCap, School, BookOpen, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Loader2, Save, X } from 'lucide-react';

export const EducationManager: React.FC = () => {
  const [university, setUniversity] = useState<UniversityRecord>(ACADEMIC_DATA.university);
  const [schooling, setSchooling] = useState<SchoolRecord[]>(ACADEMIC_DATA.schooling);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'university' | 'schooling'>('university');
  const [message, setMessage] = useState<string | null>(null);

  // Modal states for editing semester
  const [editingSemester, setEditingSemester] = useState<SemesterResult | null>(null);
  const [sgpaInput, setSgpaInput] = useState('');
  const [declDateInput, setDeclDateInput] = useState('');
  const [statusInput, setStatusInput] = useState<'PASS' | 'FAIL' | 'UPCOMING'>('PASS');

  // Modal states for editing school record
  const [editingSchool, setEditingSchool] = useState<SchoolRecord | null>(null);

  useEffect(() => {
    const unsub = subscribeToUniversityRecord((data) => {
      setUniversity(data);
      setLoading(false);
    });

    // Fetch school records
    const fetchSchools = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'academic_records'));
        const schools: SchoolRecord[] = [];
        querySnapshot.forEach((d) => {
          const data = d.data();
          if (data.type === 'school') {
            schools.push(data as SchoolRecord);
          }
        });
        if (schools.length > 0) {
          setSchooling(schools);
        }
      } catch (e) {
        console.warn('Could not fetch school records from Firestore, using local default:', e);
      }
    };
    fetchSchools();

    return () => unsub();
  }, []);

  const handleSaveSemester = async () => {
    if (!editingSemester) return;
    try {
      const updatedSem: SemesterResult = {
        ...editingSemester,
        sgpa: sgpaInput ? parseFloat(sgpaInput) : undefined,
        resultDeclarationDate: declDateInput || new Date().toLocaleDateString(),
        status: statusInput,
        statusLabel: statusInput === 'PASS' ? 'Pass' : statusInput === 'FAIL' ? 'Fail' : 'Upcoming',
        isDeclared: statusInput !== 'UPCOMING',
      };

      await publishSemesterResult(updatedSem, {
        fileName: `Semester_${updatedSem.semesterNumber}_Manual_CMS`,
        adminEmail: auth.currentUser?.email || 'admin@portfolio.com',
        extractedData: updatedSem,
      });

      setMessage(`Semester ${updatedSem.semesterNumber} updated successfully!`);
      setEditingSemester(null);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleRollbackSem = async (semNum: number) => {
    if (!confirm(`Rollback Semester ${semNum} to upcoming?`)) return;
    await rollbackSemesterResult(semNum, auth.currentUser?.email || 'admin@portfolio.com');
    setMessage(`Semester ${semNum} rolled back.`);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    try {
      const docRef = doc(db, 'academic_records', editingSchool.id);
      await setDoc(docRef, { ...editingSchool, updatedAt: new Date().toISOString() }, { merge: true });
      setSchooling(schooling.map(s => s.id === editingSchool.id ? editingSchool : s));
      setMessage('School record updated successfully!');
      setEditingSchool(null);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Error saving school record: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Education & Academic CMS</h2>
          <p className="text-sm text-slate-500">Manage university B.Tech semesters and school credentials.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('university')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'university' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
          >
            University (B.Tech)
          </button>
          <button
            onClick={() => setActiveTab('schooling')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'schooling' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Schooling (10th & 12th)
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* UNIVERSITY TAB */}
      {activeTab === 'university' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">{university.degree} — {university.branch}</h3>
                <p className="text-xs text-slate-500">{university.institution} ({university.session})</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
                {university.status}
              </span>
            </div>

            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Semester Results Management</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {university.semesters.map((sem) => (
                <div key={sem.semesterNumber} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{sem.semesterLabel}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sem.isDeclared ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        {sem.statusLabel}
                      </span>
                    </div>
                    {sem.isDeclared ? (
                      <div className="text-xl font-black text-indigo-600 dark:text-cyan-400 my-2">
                        SGPA: {sem.sgpa?.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 my-2">Result Upcoming</div>
                    )}
                    <div className="text-[11px] text-slate-500">Date: {sem.resultDeclarationDate || 'TBD'}</div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setEditingSemester(sem);
                        setSgpaInput(sem.sgpa ? String(sem.sgpa) : '');
                        setDeclDateInput(sem.resultDeclarationDate || '');
                        setStatusInput(sem.status === 'FAIL' ? 'FAIL' : sem.status === 'PASS' ? 'PASS' : 'UPCOMING');
                      }}
                      className="flex-1 py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {sem.isDeclared && (
                      <button
                        onClick={() => handleRollbackSem(sem.semesterNumber)}
                        className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold"
                        title="Rollback to Upcoming"
                      >
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCHOOLING TAB */}
      {activeTab === 'schooling' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schooling.map((school) => (
            <div key={school.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-indigo-500">{school.standard} — {school.board}</span>
                    <h3 className="text-lg font-bold mt-1">{school.qualificationTitle}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-sm">
                    {school.percentage}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{school.boardFullName} ({school.passingYear})</p>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs mb-4">
                  <div>Marks: <strong>{school.totalMarks} / {school.maxMarks}</strong></div>
                  <div>Division: <strong>{school.division}</strong></div>
                </div>
              </div>
              <button
                onClick={() => setEditingSchool(school)}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Edit2 size={14} /> Edit School Record
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SEMESTER EDIT MODAL */}
      {editingSemester && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit {editingSemester.semesterLabel}</h3>
              <button onClick={() => setEditingSemester(null)} className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Status</label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold"
              >
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="UPCOMING">UPCOMING</option>
              </select>
            </div>
            {statusInput !== 'UPCOMING' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">SGPA (e.g. 8.50)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={sgpaInput}
                    onChange={(e) => setSgpaInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Declaration Date</label>
                  <input
                    type="text"
                    value={declDateInput}
                    onChange={(e) => setDeclDateInput(e.target.value)}
                    placeholder="e.g. 20 July 2026"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold"
                  />
                </div>
              </>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingSemester(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleSaveSemester} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOL EDIT MODAL */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveSchool} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit {editingSchool.qualificationTitle}</h3>
              <button type="button" onClick={() => setEditingSchool(null)} className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={editingSchool.percentage}
                onChange={(e) => setEditingSchool({ ...editingSchool, percentage: parseFloat(e.target.value) })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Total Marks Obtained</label>
              <input
                type="number"
                value={editingSchool.totalMarks}
                onChange={(e) => setEditingSchool({ ...editingSchool, totalMarks: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Passing Year</label>
              <input
                type="text"
                value={editingSchool.passingYear}
                onChange={(e) => setEditingSchool({ ...editingSchool, passingYear: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingSchool(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

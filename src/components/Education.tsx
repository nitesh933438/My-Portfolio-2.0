import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Award, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  School,
  ChevronDown,
  Building2,
  Binary,
  Layers,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { ACADEMIC_DATA, SemesterResult, UniversityRecord, SchoolRecord } from '../data/education';
import { ScrollReveal } from './ScrollReveal';
import { subscribeToUniversityRecord, subscribeToSchoolRecords, initializeAcademicDataInFirestore } from '../services/academicFirebase';

export const Education: React.FC = () => {
  const [university, setUniversity] = useState<UniversityRecord>(ACADEMIC_DATA.university);
  const [schooling, setSchooling] = useState<SchoolRecord[]>(ACADEMIC_DATA.schooling);
  const [showAllSemesters, setShowAllSemesters] = useState(false);

  useEffect(() => {
    // Subscribe to live Firestore updates
    const unsubscribeUniversity = subscribeToUniversityRecord((liveData) => setUniversity(liveData));
    const unsubscribeSchools = subscribeToSchoolRecords(setSchooling);

    return () => { unsubscribeUniversity(); unsubscribeSchools(); };
  }, []);

  // Semesters 1-4 shown initially, or all 8 on toggle
  const visibleSemesters = showAllSemesters 
    ? university.semesters 
    : university.semesters.slice(0, 4);

  // Derive latest declared semester
  const declaredSemesters = university.semesters.filter(s => s.isDeclared && typeof s.sgpa === 'number').sort((a, b) => a.semesterNumber - b.semesterNumber);
  const latestDeclared = declaredSemesters[declaredSemesters.length - 1];
  const semesterTrend = declaredSemesters.map(s => `Sem ${s.semesterNumber}: ${s.sgpa?.toFixed(2)}`).join(' → ');

  return (
    <section 
      id="education" 
      className="py-24 sm:py-32 bg-slate-50/60 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden transition-colors duration-300"
    >
      {/* Decorative Ambient Background Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -right-48 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with Admin Launcher */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 sm:mb-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/70 dark:border-indigo-800/70 text-indigo-600 dark:text-cyan-400 text-xs font-black uppercase tracking-[0.25em] mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                <span>{ACADEMIC_DATA.title}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-5">
                Academic & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-300">University Records</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed font-medium">
                {ACADEMIC_DATA.overview}
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Public academic summary cross-checked against the supplied marksheets. Original documents and personal identification details are kept private.</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Master Container: University Showcase + School Timeline */}
        <div className="space-y-12">
          
          {/* ======================================================== */}
          {/* 1. UNIVERSITY EDUCATION: B.Tech CSE (Arka Jain University) */}
          {/* ======================================================== */}
          <ScrollReveal direction="up">
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-white dark:bg-slate-900/90 border-2 border-indigo-500/20 dark:border-indigo-500/30 shadow-xl dark:shadow-2xl dark:shadow-indigo-950/20 p-6 sm:p-10 lg:p-12 overflow-hidden transition-all duration-300">
              
              {/* Subtle top accent gradient */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

              {/* Header: University Identity & Badges */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800/80">
                
                {/* Left: University Logo Badge + Course Info */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                    <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                        {university.session}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {university.status}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {university.degree}
                    </h3>
                    <div className="text-sm sm:text-base font-bold text-indigo-600 dark:text-cyan-400 mt-1 flex items-center gap-2">
                      <Binary className="w-4 h-4 shrink-0" />
                      <span>{university.branch}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-3">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <strong className="text-slate-700 dark:text-slate-200">{university.institution}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{university.location}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Academic Performance Trajectory Card */}
                <div className="lg:text-right flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Latest SGPA ({latestDeclared ? `Sem ${latestDeclared.semesterNumber}` : 'Not declared'})
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {latestDeclared?.sgpa?.toFixed(2) ?? '—'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ 10</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{semesterTrend || 'No declared results yet'}</span>
                  </div>
                </div>

              </div>

              {/* Course Overview Description */}
              <p className="mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                {university.description}
              </p>

              {/* ======================================================== */}
              {/* DEDICATED SEMESTER RESULTS DASHBOARD                     */}
              {/* ======================================================== */}
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Semester-Wise Academic Dashboard
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Official university semester evaluations and academic progression across the 4-year degree (2025–2029).
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAllSemesters(!showAllSemesters)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:text-indigo-700 dark:hover:text-cyan-300 transition-colors self-start sm:self-auto py-1 px-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800"
                  >
                    <span>{showAllSemesters ? 'Show 1st & 2nd Year Only' : 'View All 8 Semesters'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllSemesters ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Semesters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {visibleSemesters.map((sem: SemesterResult) => (
                      <motion.div
                        key={sem.semesterNumber}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                          sem.isDeclared
                            ? 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/30 border-indigo-300/60 dark:border-indigo-700/60 shadow-md hover:shadow-lg hover:border-indigo-500'
                            : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                        }`}
                      >
                        {/* Top: Semester label & Status */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {sem.semesterLabel}
                            </span>
                            
                          </div>

                          {/* Academic Year */}
                          {sem.academicYear && (
                            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-2">
                              Academic Session: {sem.academicYear}
                            </div>
                          )}

                          {/* SGPA Score or Placeholder */}
                          {sem.isDeclared ? (
                            <div className="my-2 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-950">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Semester SGPA
                              </span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-2xl font-black text-indigo-600 dark:text-cyan-400 tabular-nums">
                                  {sem.sgpa?.toFixed(2)}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">/ 10.00</span>
                              </div>
                            </div>
                          ) : (
                            <div className="my-2 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Result Status
                              </span>
                              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                                Result Not Declared
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Declaration Date */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Result Announced:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {sem.resultDeclarationDate || 'Scheduled'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Academic Highlights Bullet Points */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {university.highlights.map((highlight, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </ScrollReveal>


          {/* ======================================================== */}
          {/* 2. SCHOOL EDUCATION: BSEB Class 12th & Class 10th        */}
          {/* ======================================================== */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <School className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Secondary & Higher Secondary Education
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {schooling.map((item, idx) => (
                <ScrollReveal key={item.id} delay={idx * 0.15} direction="up">
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="h-full flex flex-col bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden group"
                  >
                    {/* Top gradient highlight on hover */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Card Header: Icon + Percentage Badge */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-cyan-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 block">
                            {item.board} — {item.standard}
                          </span>
                          <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                            {item.qualificationTitle}
                          </h4>
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <Award className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-base sm:text-lg font-black tabular-nums">{item.percentage}%</span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest block text-emerald-700 dark:text-emerald-300">
                          {item.division}
                        </span>
                      </div>
                    </div>

                    {/* Meta info: Board, Year, Location */}
                    <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Passing Year: <strong className="text-slate-700 dark:text-slate-300">{item.passingYear}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{item.location}</span>
                      </div>
                      {item.stream && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Stream: {item.stream}
                        </span>
                      )}
                    </div>

                    {/* Detailed Marks Breakdown strip */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 mb-5">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total Marks</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums">
                          {item.totalMarks} <span className="text-[10px] font-medium text-slate-400">/ {item.maxMarks}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Percentage</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {item.percentage}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Result</span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-5 flex-1">
                      {item.description}
                    </p>

                    {/* Highlights bullet points */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                      {item.highlights.map((hl, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-cyan-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {hl}
                          </span>
                        </div>
                      ))}
                    </div>

                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};

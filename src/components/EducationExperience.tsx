import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Briefcase, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { EXPERIENCE_DATA, Experience } from '../data/portfolio';
import { subscribeToExperience } from '../services/portfolioContentFirebase';
import { ScrollReveal } from './ScrollReveal';

export const EducationExperience: React.FC = () => {
  const [experience, setExperience] = useState<Experience[]>(EXPERIENCE_DATA);
  useEffect(() => subscribeToExperience(setExperience), []);
  return (
    <section id="experience" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Professional Growth</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Development Experience</h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 text-wrap-balance">
              Independent software engineering work, practical projects and ongoing technical growth.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 max-w-4xl mx-auto gap-10">
          
          {/* Experience / Independent Development Column */}
          <div className="lg:col-span-1">
            <ScrollReveal direction="left" delay={0.4}>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                    <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Experience</h4>
                </div>

                <div className="space-y-6">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 hover:shadow-2xl transition-all duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                          {exp.type}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {exp.location}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{exp.role}</h5>
                        <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-2">{exp.company}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {exp.period}
                        </div>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        {exp.description}
                      </p>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                        {exp.highlights.map((highlight, hIdx) => (
                          <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};

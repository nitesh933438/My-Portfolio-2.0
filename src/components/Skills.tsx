import React from 'react';
import { motion } from 'motion/react';
import { SKILLS_DATA, ICONS } from '../data/portfolio';
import { ScrollReveal } from './ScrollReveal';

export const Skills: React.FC = () => {
  const renderIcon = (iconName: keyof typeof ICONS) => {
    const IconComponent = ICONS[iconName];
    return <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <section id="skills" className="py-[var(--section-py)] bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Technical Expertise</h2>
            <h3 className="font-extrabold text-slate-900 dark:text-white" style={{ fontSize: 'var(--text-4xl)' }}>Skills & Technologies</h3>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-wrap-balance" style={{ fontSize: 'var(--text-lg)' }}>
              Tools and technologies I use to build robust, scalable, and responsive software applications.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SKILLS_DATA.map((group, idx) => (
            <ScrollReveal key={group.category} delay={idx * 0.1}>
              <div className="p-6 sm:p-8 h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                    {renderIcon(group.iconName)}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{group.category}</h4>
                </div>

                <div className="space-y-5">
                  {group.skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{skill.name}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{skill.level}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                Focusing on performance and maintainability.
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};

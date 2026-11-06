import React from 'react';
import { motion } from 'motion/react';
import { User, MapPin, GraduationCap, Briefcase, Mail, Phone } from 'lucide-react';
import { EDUCATION_DATA } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { ScrollReveal } from './ScrollReveal';

export const About: React.FC = () => {
  const { settings } = usePortfolio();

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Get to Know Me</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">About {settings.name}</h3>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              A dedicated software engineering student and full-stack developer committed to building impactful applications.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6">
            <ScrollReveal direction="right" delay={0.2}>
              <div className="space-y-6 text-center lg:text-left">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Building intelligent, user-centric web systems from Rohtas, Bihar.
                </h4>
                
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                  {settings.bio}
                </p>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                  My core expertise spans the MERN stack (MongoDB, Express.js, React, Node.js), TypeScript, Tailwind CSS, and integrating generative AI APIs (such as Gemini). I enjoy transforming complex requirements into clean, scalable, and responsive software solutions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Location</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{settings.location}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Education</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{EDUCATION_DATA[0].college}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-6">
            <ScrollReveal direction="left" delay={0.4}>
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900 shadow-xl space-y-6">
              <h5 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Quick Profile Summary</span>
              </h5>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Full Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{settings.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Degree</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none text-right">B.Tech in CSE</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{EDUCATION_DATA[0].status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Currently Learning</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-right">MERN Stack</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <a href={`mailto:${settings.email}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[150px] sm:max-w-none">{settings.email}</a>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="#contact"
                  className="w-full inline-block text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs transition-colors active:scale-95"
                >
                  Get in Touch
                </a>
              </div>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Award, BookOpen, Briefcase, Mail, Settings, TrendingUp, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { PROJECTS } from '../../data/portfolio';
import { ACADEMIC_DATA } from '../../data/education';
import { subscribeToCertificates } from '../../services/certificateFirebase';
import { fetchAuditHistory, AuditRecordItem } from '../../services/academicFirebase';

export const AdminOverview: React.FC = () => {
  const [certCount, setCertCount] = useState(42);
  const [auditList, setAuditList] = useState<AuditRecordItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToCertificates((items) => {
      setCertCount(items.length);
    }, true);
    fetchAuditHistory().then(setAuditList);
    return () => unsub();
  }, []);

  const stats = [
    { label: 'Total Projects', value: PROJECTS.length, icon: Briefcase, color: 'text-indigo-600 bg-indigo-500/10' },
    { label: 'Certificates', value: certCount, icon: Award, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Education Records', value: ACADEMIC_DATA.schooling.length + 1, icon: BookOpen, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Contact Messages', value: 0, icon: Mail, color: 'text-purple-600 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Manage portfolio content, certificates, academic records, and settings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <div className="text-3xl font-black mt-1 tabular-nums">{stat.value}</div>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/projects" className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border border-indigo-200 dark:border-indigo-800/80 hover:scale-[1.02] transition-transform space-y-3 block">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold">Manage Projects</h3>
          <p className="text-xs text-slate-500">Add, edit, and publish full-stack and AI web applications.</p>
        </Link>

        <Link to="/admin/certificates" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform space-y-3 shadow-sm block">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold">Certificates Manager</h3>
          <p className="text-xs text-slate-500">Import 42 bundled professional credentials and manage visibility.</p>
        </Link>

        <Link to="/admin/education" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform space-y-3 shadow-sm block">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold">Education Records</h3>
          <p className="text-xs text-slate-500">Manage B.Tech semesters, SGPA results, and school marks.</p>
        </Link>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Recent Audit & Activity Log</h3>
        {auditList.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No recent audit events recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditList.slice(0, 5).map(item => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">{item.fileName}</strong>
                  <span className="text-slate-400">Approved by {item.approvedBy}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

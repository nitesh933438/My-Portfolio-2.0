import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Briefcase,
  Mail,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Layers,
  CheckCircle2,
  EyeOff,
  Star,
  Sparkles,
} from 'lucide-react';
import { subscribeToCertificates } from '../../services/certificateFirebase';
import { subscribeToProjects } from '../../services/projectFirebase';
import { subscribeToAuditHistory, AuditRecordItem, db } from '../../services/academicFirebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { usePortfolio } from '../../context/PortfolioContext';
import { getPortfolioMetricsSnapshot } from '../../utils/portfolioMetrics';
import type { Project } from '../../data/portfolio';
import type { PortfolioCertificate } from '../../types/certificate';

export const AdminOverview: React.FC = () => {
  const portfolio = usePortfolio();
  const [allProjects, setAllProjects] = useState<Project[]>(portfolio.projects);
  const [allCertificates, setAllCertificates] = useState<PortfolioCertificate[]>(portfolio.certificates);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [auditList, setAuditList] = useState<AuditRecordItem[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    const unsubProj = subscribeToProjects((items) => setAllProjects(items));
    const unsubCert = subscribeToCertificates((items) => setAllCertificates(items), true);

    let unsubMsgCount = () => {};
    let unsubRecentMsg = () => {};
    try {
      unsubMsgCount = onSnapshot(
        collection(db, 'contact_messages'),
        (snap) => {
          setMessageCount(snap.size);
          setUnreadCount(snap.docs.filter((d) => !d.data().read).length);
        },
        (err) => console.warn('Messages count listener:', err)
      );
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'), limit(5));
      unsubRecentMsg = onSnapshot(
        q,
        (snap) => {
          setRecentMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => console.warn('Recent messages listener:', err)
      );
    } catch (e) {
      console.warn('Could not subscribe to messages:', e);
    }

    const unsubAudit = subscribeToAuditHistory(setAuditList);

    return () => {
      unsubProj();
      unsubCert();
      unsubMsgCount();
      unsubRecentMsg();
      unsubAudit();
    };
  }, []);

  const snap = getPortfolioMetricsSnapshot({
    projects: allProjects,
    certificates: allCertificates,
    university: portfolio.university,
    schooling: portfolio.schooling,
    skills: portfolio.skills,
    experience: portfolio.experience,
    messageTotal: messageCount,
    messageUnread: unreadCount,
  });

  const stats = [
    {
      label: 'Active Projects',
      value: snap.projects.active.length,
      sub: `${snap.projects.featured.length} Featured · ${snap.projects.archivedCount} Archived`,
      icon: Briefcase,
      color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400',
      link: '/admin/projects',
    },
    {
      label: 'Published Certificates',
      value: snap.certificates.published.length,
      sub: `${snap.certificates.verifiedCount} Verified · ${snap.certificates.draftCount} Hidden`,
      icon: Award,
      color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
      link: '/admin/certificates',
    },
    {
      label: 'Education & Semesters',
      value: `${snap.education.declaredSemesters.length}/${snap.education.totalSemesters} Sem`,
      sub: `${snap.education.latestSgpa ? `Latest SGPA ${snap.education.latestSgpa.toFixed(2)}` : 'SGPA Pending'} · ${snap.education.schoolingCount} School`,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
      link: '/admin/education',
    },
    {
      label: 'Skills & Experience',
      value: snap.skills.totalSkills,
      sub: `${snap.skills.categoryCount} Skill Groups · ${snap.experienceCount} Roles`,
      icon: Wrench,
      color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
      link: '/admin/skills',
    },
    {
      label: unreadCount > 0 ? `Messages (${unreadCount} New)` : 'Contact Messages',
      value: messageCount,
      sub: unreadCount > 0 ? `${unreadCount} unread inquiry waiting` : 'All inquiries reviewed',
      icon: Mail,
      color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400',
      link: '/admin/messages',
    },
  ];

  const allocationRows = [
    {
      module: 'Projects',
      adminTotal: `${snap.projects.total} in CMS`,
      publicShown: `${snap.projects.active.length} on Portfolio (${snap.projects.featured.length} Featured)`,
      hiddenOrDraft: `${snap.projects.archivedCount} Archived`,
      link: '/admin/projects',
    },
    {
      module: 'Certificates',
      adminTotal: `${snap.certificates.total} in CMS`,
      publicShown: `${snap.certificates.published.length} Published (#01–#${String(snap.certificates.published.length).padStart(2, '0')})`,
      hiddenOrDraft: `${snap.certificates.draftCount} Hidden Drafts`,
      link: '/admin/certificates',
    },
    {
      module: 'Education',
      adminTotal: `${snap.education.totalRecords} Records (${snap.education.totalSemesters} Sem Slots)`,
      publicShown: `${snap.education.declaredSemesters.length} Declared + ${snap.education.schoolingCount} School`,
      hiddenOrDraft: `${snap.education.upcomingSemesters.length} Upcoming Semesters`,
      link: '/admin/education',
    },
    {
      module: 'Skills',
      adminTotal: `${snap.skills.categoryCount} Categories`,
      publicShown: `${snap.skills.totalSkills} Skills Synced`,
      hiddenOrDraft: '0 Hidden',
      link: '/admin/skills',
    },
    {
      module: 'Experience',
      adminTotal: `${snap.experienceCount} Roles`,
      publicShown: `${snap.experienceCount} Synced on Timeline & Resume`,
      hiddenOrDraft: '0 Hidden',
      link: '/admin/experience',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Admin Dashboard Overview</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time live allocation across Admin CMS and Public Portfolio with automatic cross-device sync.
        </p>
      </div>

      {/* Live Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {stats.map((stat, idx) => (
          <Link
            key={idx}
            to={stat.link}
            className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-indigo-500/50 hover:shadow-md transition-all group"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">{stat.label}</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {stat.value}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate mt-0.5">{stat.sub}</span>
            </div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Live Admin vs Public Portfolio Allocation Matrix */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Admin vs Public Portfolio Allocation
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Real-time Firestore Auto-Sync Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {allocationRows.map((row) => (
            <Link
              key={row.module}
              to={row.link}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-colors space-y-2 block"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">{row.module}</span>
                <ArrowRight size={13} className="text-indigo-500" />
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">
                  Admin: <span className="text-slate-800 dark:text-slate-200 font-bold">{row.adminTotal}</span>
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Portfolio: <span className="font-bold">{row.publicShown}</span>
                </div>
                <div className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                  <EyeOff size={11} className="shrink-0" />
                  <span className="truncate">{row.hiddenOrDraft}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/projects"
          className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/80 hover:scale-[1.01] transition-transform space-y-2.5 block shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
              <Star size={12} /> {snap.projects.featured.length} Featured
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Projects ({snap.projects.total})</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {snap.projects.active.length} active on Portfolio · {snap.projects.githubRepoCount} with GitHub links · {snap.projects.archivedCount} archived.
          </p>
        </Link>

        <Link
          to="/admin/certificates"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-[1.01] transition-transform space-y-2.5 shadow-sm block hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {snap.certificates.published.length} Published
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Certificates Manager ({snap.certificates.total})</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Organize {snap.certificates.published.length} published credentials, {snap.certificates.featured.length} pinned featured, and {snap.certificates.draftCount} drafts.
          </p>
        </Link>

        <Link
          to="/admin/ai"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-[1.01] transition-transform space-y-2.5 shadow-sm block hover:border-purple-500/40"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Auto-Scan Active
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Scanner &amp; Assistant</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Auto-detects, merges duplicates, and blocks non-portfolio files automatically via AI Scan in top bar.
          </p>
        </Link>
      </div>

      {/* Two Column Section: Recent Inquiries & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Recent Inquiries</h3>
            </div>
            <Link to="/admin/messages" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No inquiries received yet. Visitors can send messages through the contact section.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{msg.name}</span>
                    <p className="text-slate-400 line-clamp-1 mt-0.5">{msg.message}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${msg.read ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-purple-500/15 text-purple-600'}`}>
                    {msg.read ? 'Read' : 'New'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Academic Audit History */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Academic Audit Log</h3>
            </div>
            <Link to="/admin/education" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>

          {auditList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent audit events recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditList.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs gap-3">
                  <div className="min-w-0">
                    <strong className="text-slate-800 dark:text-slate-200 block truncate">{item.fileName}</strong>
                    <span className="text-slate-400 text-[11px]">Approved by {item.approvedBy}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Award, BookOpen, Briefcase, Mail, Settings, TrendingUp, CheckCircle2, Clock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { PROJECTS } from '../../data/portfolio';
import { ACADEMIC_DATA } from '../../data/education';
import { subscribeToCertificates } from '../../services/certificateFirebase';
import { subscribeToProjects } from '../../services/projectFirebase';
import { fetchAuditHistory, AuditRecordItem, db } from '../../services/academicFirebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';

export const AdminOverview: React.FC = () => {
  const [projectCount, setProjectCount] = useState<number>(PROJECTS.length);
  const [certCount, setCertCount] = useState<number>(42);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [auditList, setAuditList] = useState<AuditRecordItem[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    // 1. Projects subscription
    const unsubProj = subscribeToProjects((items) => {
      if (items.length > 0) {
        setProjectCount(items.length);
      }
    });

    // 2. Certificates subscription
    const unsubCert = subscribeToCertificates((items) => {
      setCertCount(items.length);
    }, true);

    // 3. Contact messages subscription
    let unsubMsg = () => {};
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'), limit(5));
      unsubMsg = onSnapshot(q, (snap) => {
        setMessageCount(snap.size);
        const unread = snap.docs.filter(d => !d.data().read).length;
        setUnreadCount(unread);
        setRecentMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn('Messages listener fallback:', err);
      });
    } catch (e) {
      console.warn('Could not subscribe to messages:', e);
    }

    // 4. Audit history
    fetchAuditHistory().then(setAuditList);

    return () => {
      unsubProj();
      unsubCert();
      unsubMsg();
    };
  }, []);

  const stats = [
    { label: 'Total Projects', value: projectCount, icon: Briefcase, color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400', link: '/admin/projects' },
    { label: 'Certificates', value: certCount, icon: Award, color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400', link: '/admin/certificates' },
    { label: 'Education Records', value: ACADEMIC_DATA.schooling.length + 1, icon: BookOpen, color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400', link: '/admin/education' },
    { label: unreadCount > 0 ? `Messages (${unreadCount} New)` : 'Contact Messages', value: messageCount, icon: Mail, color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400', link: '/admin/messages' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Admin Dashboard Overview</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time metrics, content management controls, and recent activity logs.
        </p>
      </div>

      {/* Real Firebase Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Link 
            key={idx} 
            to={stat.link}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-indigo-500/50 hover:shadow-md transition-all group"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{stat.label}</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {stat.value}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/admin/projects" 
          className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/80 hover:scale-[1.02] transition-transform space-y-3 block shadow-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Projects</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Add new portfolio projects, upload screenshots to Firebase Storage, and toggle publication.</p>
        </Link>

        <Link 
          to="/admin/certificates" 
          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform space-y-3 shadow-sm block hover:border-emerald-500/40"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Certificates Manager</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Organize 42 professional credentials, manage categories, and verify document integrity.</p>
        </Link>

        <Link 
          to="/admin/education" 
          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform space-y-3 shadow-sm block hover:border-blue-500/40"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Education & Semesters</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Update B.Tech semester SGPA evaluations, declaration status, and schooling details.</p>
        </Link>
      </div>

      {/* Two Column Section: Recent Inquiries & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Inquiries */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
              {auditList.slice(0, 5).map(item => (
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

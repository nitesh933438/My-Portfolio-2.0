import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth, isUserAdmin } from '../../services/academicFirebase';
import { Mail, Trash2, CheckCircle, Clock, Loader2, User, Calendar, CheckCircle2 } from 'lucide-react';
import { useAdminToast } from './AdminToastContext';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export const MessagesManager: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useAdminToast();

  useEffect(() => {
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage));
        setMessages(msgs);
        setLoading(false);
      }, (err) => {
        console.warn('Could not fetch messages:', err);
        setLoading(false);
      });
      return () => unsub();
    } catch {
      setLoading(false);
    }
  }, []);

  const toggleRead = async (id: string, currentRead: boolean) => {
    if (!isUserAdmin(auth.currentUser)) return;
    try {
      await updateDoc(doc(db, 'contact_messages', id), { read: !currentRead });
      showToast(currentRead ? 'Marked as unread' : 'Marked as read', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error updating status', 'error');
    }
  };

  const deleteMsg = async (id: string, name: string) => {
    if (!isUserAdmin(auth.currentUser)) return;
    if (confirm(`Delete message from ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'contact_messages', id));
        showToast('Message deleted successfully', 'success');
      } catch (e: any) {
        showToast(e.message || 'Error deleting message', 'error');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Contact Messages</h1>
        <p className="text-sm text-slate-500">Inbox of inquiries received from visitors through your portfolio.</p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-16 text-center space-y-3 bg-white dark:bg-slate-900">
          <Mail className="w-12 h-12 mx-auto text-slate-400" />
          <h3 className="font-bold text-lg">No Messages Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">When visitors send inquiries through your contact section, they will appear here securely.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`p-6 sm:p-8 rounded-3xl border transition-all ${msg.read ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-black text-sm text-slate-900 dark:text-white block">{msg.name}</span>
                    <a href={`mailto:${msg.email}`} className="text-xs text-indigo-500 hover:underline font-medium">{msg.email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Recent'}</span>
                  {!msg.read && <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white animate-pulse">New</span>}
                </div>
              </div>
              {msg.subject && <h4 className="font-black text-sm text-slate-800 dark:text-slate-200 mb-2">Subject: {msg.subject}</h4>}
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-3 text-xs">
                <button onClick={() => toggleRead(msg.id, msg.read)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  {msg.read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
                <button onClick={() => deleteMsg(msg.id, msg.name)} className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold flex items-center gap-1.5 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

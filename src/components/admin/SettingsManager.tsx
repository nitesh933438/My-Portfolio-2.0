import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, isUserAdmin } from '../../services/academicFirebase';
import { SITE_CONFIG } from '../../data/portfolio';
import { Settings, Save, CheckCircle2, Loader2, User, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { useAdminToast } from './AdminToastContext';

export const SettingsManager: React.FC = () => {
  const [form, setForm] = useState({
    name: SITE_CONFIG.name,
    title: SITE_CONFIG.title,
    email: SITE_CONFIG.email,
    whatsapp: SITE_CONFIG.whatsapp,
    location: SITE_CONFIG.location,
    bio: SITE_CONFIG.bio,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useAdminToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'site_metadata', 'portfolio_config'));
        if (snap.exists()) {
          setForm(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {
        console.warn('Could not load site metadata:', e);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserAdmin(auth.currentUser)) {
      showToast('Admin access required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_metadata', 'portfolio_config'), {
        ...form,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showToast('Portfolio settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(`Error saving settings: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black">Portfolio Settings & Profile</h1>
        <p className="text-sm text-slate-500">Update global portfolio profile information and contact details.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Professional Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">WhatsApp Number *</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={e => handleChange('whatsapp', e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Location *</label>
          <input
            type="text"
            value={form.location}
            onChange={e => handleChange('location', e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Professional Bio *</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={e => handleChange('bio', e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium leading-relaxed"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>{saving ? 'Saving Changes...' : 'Save Portfolio Settings'}</span>
        </button>
      </form>
    </div>
  );
};

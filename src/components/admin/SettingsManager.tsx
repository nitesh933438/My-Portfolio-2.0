import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth, isUserAdmin, subscribeToSiteSettings } from '../../services/academicFirebase';
import { SITE_CONFIG, SOCIAL_LINKS } from '../../data/portfolio';

import { 
  Settings, 
  Save, 
  CheckCircle2, 
  Loader2, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Image as ImageIcon, 
  FileText, 
  Upload, 
  X 
} from 'lucide-react';
import { useAdminToast } from './AdminToastContext';
import { 
  uploadFileProxy, 
  deleteFileProxy, 
  resolveAssetUrl, 
  validateFile 
} from '../../services/supabaseStorage';
import { AIScanner } from './AIScanner';
import { useAIScanner } from '../../context/AIScannerContext';
import { Sparkles } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [form, setForm] = useState({
    name: SITE_CONFIG.name,
    title: SITE_CONFIG.title,
    email: SITE_CONFIG.email,
    whatsapp: SITE_CONFIG.whatsapp,
    location: SITE_CONFIG.location,
    bio: SITE_CONFIG.bio,
    profilePhoto: SITE_CONFIG.profilePhoto,
    resumeUrl: SITE_CONFIG.resumeUrl,
    github: SOCIAL_LINKS.find(s => s.platform === 'GitHub')?.url || '',
    linkedin: SOCIAL_LINKS.find(s => s.platform === 'LinkedIn')?.url || '',
    instagram: SOCIAL_LINKS.find(s => s.platform === 'Instagram')?.url || '',
  });
  const [saving, setSaving] = useState(false);
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'unsaved'>('synced');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestFormRef = useRef(form);
  const { showToast } = useAdminToast();
  const { pendingResult, setPendingResult } = useAIScanner();

  const isFormValidForAutoSave = (candidate: typeof form) =>
    Boolean(
      candidate.name.trim() &&
      candidate.title.trim() &&
      candidate.email.trim() &&
      candidate.whatsapp.trim() &&
      candidate.location.trim() &&
      candidate.bio.trim()
    );

  const scheduleAutoSave = (nextForm: typeof form) => {
    latestFormRef.current = nextForm;
    dirtyRef.current = true;
    setSyncState('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!isUserAdmin(auth.currentUser) || !isFormValidForAutoSave(nextForm)) return;

    setSyncState('syncing');
    saveTimerRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'site_metadata', 'portfolio_config'), {
          ...latestFormRef.current,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        dirtyRef.current = false;
        setSyncState('synced');
      } catch (err) {
        console.warn('Auto-save settings deferred:', err);
        setSyncState('unsaved');
      }
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (pendingResult && (pendingResult.detectedModule === 'settings' || pendingResult.detectedModule === 'profile' || pendingResult.detectedModule === 'profile_photo')) {
      handleAIExtractedData(pendingResult);
      if (pendingResult.sourceFile) {
        if (pendingResult.sourceFile.type === 'application/pdf') {
          setPendingResumeFile(pendingResult.sourceFile);
        } else if (pendingResult.sourceFile.type.startsWith('image/') && isUserAdmin(auth.currentUser)) {
          const scannedImg = pendingResult.sourceFile;
          setUploadingPhoto(true);
          (auth.currentUser?.getIdToken() || Promise.resolve(''))
            .then((token) => uploadFileProxy(scannedImg, 'profile', token || ''))
            .then((res) => {
              handleChange('profilePhoto', res.url);
              showToast('Profile photo uploaded & synced cleanly!', 'success');
            })
            .catch(() => {})
            .finally(() => setUploadingPhoto(false));
        }
      }
      setPendingResult(null);
    }
  }, [pendingResult]);

  const handleAIExtractedData = (result: any) => {
    if (!result || !result.data) return;
    const data = result.data;
    setForm(prev => {
      const next = {
        ...prev,
        name: data.name || prev.name,
        title: data.title || prev.title,
        email: data.email || prev.email,
        whatsapp: data.whatsapp || prev.whatsapp,
        location: data.location || prev.location,
        bio: data.bio || prev.bio,
        github: data.github || prev.github,
        linkedin: data.linkedin || prev.linkedin,
      };
      scheduleAutoSave(next);
      return next;
    });
    showToast('AI extracted profile details and synced them automatically!', 'success');
  };
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSiteSettings((live) => {
      if (!dirtyRef.current) {
        setForm(prev => {
          const merged = { ...prev, ...live };
          latestFormRef.current = merged;
          return merged;
        });
        setSyncState('synced');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (key: string, val: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      scheduleAutoSave(next);
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) {
      showToast('You must be logged in to upload files.', 'error');
      return;
    }

    const isPhoto = type === 'profile';
    const setUploading = isPhoto ? setUploadingPhoto : setUploadingResume;
    
    try {
      setUploading(true);
      
      // Validate file
      const allowedTypes = isPhoto 
        ? ['image/jpeg', 'image/png', 'image/webp'] 
        : ['application/pdf'];
      const maxSize = isPhoto ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for photo, 5MB for resume
      
      validateFile(file, allowedTypes, maxSize);

      const idToken = await auth.currentUser.getIdToken();
      const { path } = await uploadFileProxy(file, type, idToken);
      const fieldKey = isPhoto ? 'profilePhoto' : 'resumeUrl';

      setForm(prev => {
        const next = { ...prev, [fieldKey]: path };
        latestFormRef.current = next;
        return next;
      });

      if (isUserAdmin(auth.currentUser)) {
        await setDoc(doc(db, 'site_metadata', 'portfolio_config'), {
          [fieldKey]: path,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        if (!dirtyRef.current) setSyncState('synced');
      }
      
      showToast(`${isPhoto ? 'Photo' : 'Resume'} uploaded and synced live!`, 'success');
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserAdmin(auth.currentUser)) {
      showToast('Admin access required.', 'error');
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    setSyncState('syncing');
    try {
      let settingsToSave = { ...form };
      if (pendingResumeFile) {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error('Your admin session expired. Please sign in again.');
        const { path } = await uploadFileProxy(pendingResumeFile, 'resume', idToken);
        settingsToSave = { ...settingsToSave, resumeUrl: path };
      }
      await setDoc(doc(db, 'site_metadata', 'portfolio_config'), {
        ...settingsToSave,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      dirtyRef.current = false;
      latestFormRef.current = settingsToSave;
      setForm(settingsToSave);
      setPendingResumeFile(null);
      setSyncState('synced');
      showToast('Portfolio settings saved successfully!', 'success');
    } catch (err: any) {
      setSyncState('unsaved');
      showToast(`Error saving settings: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Portfolio Settings & Profile</h1>
          {syncState === 'syncing' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Loader2 size={12} className="animate-spin" /> Auto-syncing…
            </span>
          )}
          {syncState === 'synced' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} /> Synced Live
            </span>
          )}
          {syncState === 'unsaved' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Unsaved edits
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update global portfolio profile information, assets, and contact details. Changes sync live across your site.</p>
      </div>

      {/* AI Trigger */}
      <div className="bg-indigo-600/5 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Magic AI Profile Sync</h3>
            <p className="text-[11px] text-slate-500 max-w-xs">Upload your resume or paste your bio to instantly update your portfolio profile.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAIScannerOpen(true)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          Scan Resume
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Assets Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <ImageIcon size={14} /> Profile Photo
              </h2>
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 transition-transform group-hover:scale-[1.02]">
                    <img 
                      src={resolveAssetUrl(form.profilePhoto, 'profile')} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(form.name) + '&background=6366f1&color=fff';
                      }}
                    />
                  </div>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-2xl">
                      <Loader2 className="animate-spin text-indigo-600" size={24} />
                    </div>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={photoInputRef}
                  onChange={(e) => handleFileUpload(e, 'profile')}
                  accept="image/*"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={14} />
                  Change Photo
                </button>
                <p className="text-[10px] text-center text-slate-400 leading-tight">
                  Recommended: Square image, max 2MB.<br/>(JPEG, PNG, WEBP)
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <FileText size={14} /> Professional Resume
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                    <FileText size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                      {pendingResumeFile ? pendingResumeFile.name : form.resumeUrl.split('/').pop() || 'No resume uploaded'}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{pendingResumeFile ? 'AI scanned • Save settings to upload' : 'PDF Format Required'}</p>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={resumeInputRef}
                  onChange={(e) => handleFileUpload(e, 'resume')}
                  accept=".pdf"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {uploadingResume ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  {form.resumeUrl ? 'Update Resume' : 'Upload Resume'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Professional Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">WhatsApp Number *</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={e => handleChange('whatsapp', e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Location *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => handleChange('location', e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">GitHub URL</label>
                  <input
                    type="url"
                    value={form.github}
                    onChange={e => handleChange('github', e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">LinkedIn URL</label>
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={e => handleChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Instagram URL</label>
                  <input
                    type="url"
                    value={form.instagram}
                    onChange={e => handleChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Professional Bio *</label>
                <textarea
                  rows={6}
                  value={form.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>{saving ? 'Saving Changes...' : 'Save Portfolio Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <AIScanner 
        isOpen={isAIScannerOpen}
        onClose={() => setIsAIScannerOpen(false)}
      />
    </div>
  );
};


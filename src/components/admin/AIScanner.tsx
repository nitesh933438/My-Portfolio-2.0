import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clipboard,
  Search
} from 'lucide-react';
import { auth } from '../../services/academicFirebase';
import { useAIScanner } from '../../context/AIScannerContext';
import { apiUrl, readJsonResponse } from '../../services/api';

interface AIScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIScanner: React.FC<AIScannerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPendingResult } = useAIScanner();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) { setError(null); setSuccess(false); }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) { setError('Supported formats: PDF, JPG, PNG and WEBP.'); return; }
      if (selectedFile.size > 25 * 1024 * 1024) { setError('File is larger than the 25MB limit.'); return; }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Unauthorized: Please sign in again.');

      const formData = new FormData();
      
      if (activeTab === 'file' && file) {
        formData.append('file', file);
      } else if (activeTab === 'text' && text) {
        formData.append('text', text);
      } else if (activeTab === 'url' && url) {
        formData.append('url', url);
      } else {
        throw new Error(`Please provide a source to scan.`);
      }

      const response = await fetch(apiUrl('/api/ai/analyze-and-extract'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      const result = await readJsonResponse<any>(response);
      if (!response.ok || result.success === false) {
        throw new Error(result.error || `AI extraction failed (${response.status})`);
      }

      const payload = result.data || {};
      const detectedModule = String(payload.detectedModule || '').trim().toLowerCase();
      const data = payload.data;
      const routeMap: Record<string, string> = {
        project: '/admin/projects', projects: '/admin/projects',
        certificate: '/admin/certificates', certificates: '/admin/certificates',
        education: '/admin/education', academic: '/admin/education',
        settings: '/admin/settings', profile: '/admin/settings',
        experience: '/admin/experience', skills: '/admin/skills',
      };

      if (!data || typeof data !== 'object') throw new Error('AI did not extract structured form data. Please try a clearer file.');
      if ((Number(payload.confidence) || 0) < 0.55) throw new Error(payload.suggestion || 'AI is not confident enough to choose a destination. Please try a clearer file or enter the details manually.');
      if (!routeMap[detectedModule]) {
        throw new Error(payload.suggestion || `AI detected “${payload.detectedType || 'unknown'}”, but could not safely match it to an existing editable module. Please open the correct manager and enter the details manually.`);
      }

      setPendingResult({
        detectedModule: detectedModule === 'projects' ? 'project' : detectedModule === 'certificates' ? 'certificate' : detectedModule === 'academic' ? 'education' : detectedModule === 'profile' ? 'settings' : detectedModule,
        detectedType: String(payload.detectedType || 'unknown'),
        sourceFile: activeTab === 'file' ? file || undefined : undefined,
        data,
        confidence: Number(payload.confidence) || 0,
      });
      setSuccess(true);
      window.setTimeout(() => {
        navigate(routeMap[detectedModule]);
        onClose();
        setFile(null);
        setText('');
        setUrl('');
        setSuccess(false);
      }, 650);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'file', label: 'Document / Image', icon: Upload },
    { id: 'text', label: 'Paste Text', icon: Clipboard },
    { id: 'url', label: 'Web URL / GitHub', icon: LinkIcon },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] w-full max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain shadow-2xl mx-auto my-auto"
          >
            <div className="p-5 sm:p-8 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={16} className="sm:w-5 sm:h-5 animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">AI Intelligence</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                  Universal AI Auto-Fill
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="px-5 sm:px-8 mt-4 sm:mt-8">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[11px] font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span>{tab.label.split(' / ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
              <div className="min-h-[120px] sm:min-h-[160px] flex flex-col">
                {activeTab === 'file' && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => { event.preventDefault(); const dropped = event.dataTransfer.files?.[0]; if (dropped) handleFileChange({ target: { files: [dropped] } } as any); }}
                    className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                      file 
                        ? 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                    />
                    {file ? (
                      <div className="text-center p-3 flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        {file.type.startsWith('image/') ? (
                          <div className="relative mb-3 group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Upload preview"
                              className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-600/20"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                              }}
                              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                              title="Remove file"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="relative mb-3">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
                              <FileText size={32} />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                              }}
                              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                              title="Remove file"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[240px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Document'}
                        </p>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 mt-1 inline-block">
                          Click to choose a different photo / document
                        </span>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                          <Upload size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Click to upload or drag & drop photo / document
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Certificates, marksheets, project screenshots, or resumes (PDF, JPG, PNG, WEBP)
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'text' && (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste text to extract details from..."
                    className="flex-1 w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium resize-none focus:outline-none focus:border-indigo-500 transition-colors min-h-[160px]"
                  />
                )}
                {activeTab === 'url' && (
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/owner/repository"
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><AlertCircle size={16} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
              {success && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 size={16}/><span>Detected successfully. Opening the matching admin form…</span></div>}
              <button
                onClick={handleScan}
                disabled={loading || success || (activeTab === 'file' && !file) || (activeTab === 'text' && !text) || (activeTab === 'url' && !url)}
                className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                  success
                    ? 'bg-emerald-500 text-white'
                    : loading
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20'
                }`}
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> <span>Gemini is analyzing...</span></> : 'Start AI Extraction'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

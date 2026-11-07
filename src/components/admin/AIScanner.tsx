import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

interface AIScannerProps {
  module: 'project' | 'certificate' | 'education' | 'settings';
  onDataExtracted: (data: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AIScanner: React.FC<AIScannerProps> = ({ module, onDataExtracted, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
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
      formData.append('module', module);
      
      if (activeTab === 'file' && file) {
        formData.append('file', file);
      } else if (activeTab === 'text' && text) {
        formData.append('text', text);
      } else if (activeTab === 'url' && url) {
        formData.append('url', url);
      } else {
        throw new Error(`Please provide ${activeTab === 'file' ? 'a file' : activeTab === 'text' ? 'some text' : 'a URL'} to scan.`);
      }

      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      // Handle non-JSON responses (like HTML 404/500 pages)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Unexpected server response:', text);
        
        if (response.status === 404) {
          throw new Error('API endpoint not found (404). Please ensure the backend is running and the route is registered.');
        } else if (response.status === 500) {
          throw new Error('Internal Server Error (500). Check server logs for details.');
        } else {
          throw new Error(`Server returned an unexpected response (${response.status}). It might be an HTML error page instead of JSON.`);
        }
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract data');
      }

      setSuccess(true);
      setTimeout(() => {
        onDataExtracted(result.data);
        onClose();
        // Reset state
        setFile(null);
        setText('');
        setUrl('');
        setSuccess(false);
      }, 1000);

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
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={20} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Intelligence</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Universal AI Auto-Fill
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scan documents, URLs or text to instantly populate this form.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-8 mt-8">
              <div className="flex p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 space-y-6">
              <div className="min-h-[160px] flex flex-col">
                {activeTab === 'file' && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
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
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {file ? (
                      <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/20">
                          <FileText size={32} />
                        </div>
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                          <Upload size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Drop certificate, resume or marksheet
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PDF, JPG, or PNG (Max 25MB)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'text' && (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste project description, experience highlights or any text to extract details from..."
                    className="flex-1 w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium resize-none focus:outline-none focus:border-indigo-500 transition-colors min-h-[160px]"
                  />
                )}

                {activeTab === 'url' && (
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <LinkIcon size={16} />
                      </div>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/user/project"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed px-2">
                      <span className="font-bold text-indigo-500 uppercase tracking-wider mr-1">Note:</span>
                      AI will analyze the provided URL to extract titles, tech stacks, and descriptions for your portfolio.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="flex flex-col gap-4">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500"
                  >
                    <AlertCircle size={16} />
                    <span className="text-[11px] font-bold">{error}</span>
                  </motion.div>
                )}

                <button
                  onClick={handleScan}
                  disabled={loading || success || (activeTab === 'file' && !file) || (activeTab === 'text' && !text) || (activeTab === 'url' && !url)}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
                    success
                      ? 'bg-emerald-500 text-white'
                      : loading
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Gemini is analyzing...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Data Extracted Successfully</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Start AI Extraction</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Trusted by 500+ Scans
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                <span>Powered by Gemini 1.5 Flash</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

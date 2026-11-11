import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Scan, 
  Search, 
  FileText, 
  Zap, 
  ShieldCheck, 
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { auth } from '../../services/academicFirebase';
import { useAdminToast } from './AdminToastContext';
import { AIScanner } from './AIScanner';
import { apiUrl, readJsonResponse } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your Portfolio CMS AI Assistant. Ask me about your portfolio, project descriptions, certificates or CMS workflows.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useAdminToast();

  React.useEffect(() => {
    let active = true;
    fetch(apiUrl('/api/health'))
      .then(readJsonResponse<any>)
      .then((health) => { if (active) setAiStatus(health.geminiConfigured ? 'online' : 'offline'); })
      .catch(() => { if (active) setAiStatus('offline'); });
    return () => { active = false; };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setTimeout(scrollToBottom, 100);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Unauthorized. Please sign in again.');

      const response = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await readJsonResponse<any>(response);
      if (!response.ok || data.success === false) throw new Error(data.error || 'AI Chat failed');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Request processed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      showToast(err.message || 'AI assistant error', 'error');
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Sorry, I encountered an error: ${err.message}. Please verify backend status and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Summarize my portfolio projects & tech stack",
    "How do I add a new certificate verification link?",
    "Suggest key features for an AI MERN platform project",
    "How does the Universal AI Scanner auto-fill forms?"
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner with Universal AI Scanner trigger */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-200 uppercase tracking-wider">
            <Sparkles size={14} className="animate-pulse text-amber-300" />
            <span>Universal AI Scanner & Auto-Fill</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black">Scan Documents or URLs with Gemini AI</h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
            Upload a certificate, marksheet, project document, paste profile text, or provide a public GitHub repository URL. Supported document types are routed to the existing matching forms; unsupported items are flagged instead of being sent to the wrong module.
          </p>
        </div>
        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-6 py-4 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Scan size={18} />
          <span>Launch AI Scanner</span>
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100dvh-10rem)] min-h-[360px] max-h-[760px]">
        {/* Chat Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Gemini Portfolio Assistant</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${aiStatus === 'online' ? 'bg-emerald-500' : aiStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                {aiStatus === 'online' ? 'Backend reachable • Gemini configured' : aiStatus === 'checking' ? 'Checking AI connection…' : 'AI backend unavailable or not configured'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages([{
              id: '1',
              sender: 'ai',
              text: 'Conversation reset. How can I assist you with your CMS today?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Chat"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-800 dark:bg-slate-700'
              }`}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
              }`}>
                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                <span className={`text-[9px] block text-right opacity-60 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs italic">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
              <span>Gemini is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 sm:px-6 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/30 flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputMessage(prompt);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold whitespace-nowrap transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder="Ask AI Assistant anything about your portfolio or CMS..."
            className="flex-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-600/20 active:scale-95 shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

      {/* AIScanner Modal */}
      <AIScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};

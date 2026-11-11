import React, { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  FileText, 
  CheckCircle, 
  ExternalLink, 
  Printer, 
  Mail, 
  Phone, 
  Globe,
  Github, 
  Linkedin, 
  Copy, 
  Check, 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  Code, 
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { resolveAssetUrl } from '../services/supabaseStorage';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  const { settings } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'document' | 'interactive'>('document');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Official resume PDF path specified by user attachment
  const officialPdfUrl = '/assets/aistudio/Nitesh_Kumar_-_Resume_8ce55380.pdf';
  const officialPreviewImg = '/assets/nitesh_resume_page.png';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setZoomLevel(100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPdf = () => {
    const link = document.createElement('a');
    link.href = officialPdfUrl;
    link.download = 'Nitesh_Kumar_-_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden resume-modal-backdrop"
          onClick={onClose}
        >
          {/* Printable Resume CSS Styling */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-ats-resume, #printable-ats-resume * {
                visibility: visible !important;
              }
              #printable-ats-resume {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 16px !important;
                background: white !important;
                color: #0f172a !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print, .resume-modal-backdrop, header, footer {
                display: none !important;
              }
            }
          `}</style>

          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94dvh] max-h-[94dvh] border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar / Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shrink-0">
              
              {/* Left Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      Nitesh Kumar — Resume
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Official 2025
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Full-Stack Developer | MERN Stack Developer
                  </p>
                </div>
              </div>

              {/* Center: View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl order-last sm:order-none w-full sm:w-auto justify-center">
                <button
                  onClick={() => setActiveTab('document')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'document'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Document View
                </button>
                <button
                  onClick={() => setActiveTab('interactive')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'interactive'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Interactive ATS
                </button>
              </div>

              {/* Right Action Icons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={handlePrint}
                  className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Print Resume"
                  aria-label="Print Resume"
                >
                  <Printer className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
                  title="Download Resume PDF"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Download</span>
                  <span className="xs:hidden">PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close Modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 lg:p-6 flex flex-col items-center">
              
              {activeTab === 'document' ? (
                /* Document View: Crisp High-Resolution Page View that works 100% on phones + Desktop Embed */
                <div className="w-full flex flex-col items-center max-w-3xl space-y-3">
                  
                  {/* Zoom Controls Bar */}
                  <div className="flex items-center justify-between w-full px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-medium">Original Resume Page (1 / 1)</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-blue-600"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono px-1.5">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-blue-600"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(100)}
                        className="text-[10px] font-medium px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-blue-600 ml-1"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Rendered Document Container */}
                  <div className="w-full flex justify-center overflow-x-auto pb-6 custom-scrollbar">
                    <div 
                      style={{ 
                        width: `${zoomLevel}%`, 
                        minWidth: zoomLevel > 100 ? `${zoomLevel}%` : '280px',
                        maxWidth: zoomLevel > 100 ? 'none' : '100%'
                      }}
                      className="transition-all duration-200 shadow-2xl rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white shrink-0"
                    >
                      <img 
                        src={officialPreviewImg} 
                        alt="Nitesh Kumar Resume Document" 
                        className="w-full h-auto block select-none"
                      />
                    </div>
                  </div>

                  {/* Desktop Native PDF embed option toggle */}
                  <div className="hidden lg:flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
                    <span>Prefer raw browser PDF viewer?</span>
                    <a
                      href={officialPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Open PDF in new tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                </div>
              ) : (
                /* Interactive ATS View (Exact 2-column layout from uploaded resume) */
                <div 
                  id="printable-ats-resume"
                  className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm"
                >
                  {/* Top Header Row with Name & Profile Photo */}
                  <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div className="space-y-1.5 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        NITESH KUMAR
                      </h1>
                      <div className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                        Full-Stack Developer | MERN Stack Developer
                      </div>

                      {/* Contact & Links Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        <a 
                          href="mailto:nitesh933438@gmail.com" 
                          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">nitesh933438@gmail.com</span>
                        </a>

                        <a 
                          href="https://nitesh.me/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">https://nitesh.me/</span>
                        </a>

                        <a 
                          href="https://github.com/nitesh933438" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Github className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200 shrink-0" />
                          <span className="truncate">github.com/nitesh933438</span>
                        </a>

                        <a 
                          href="https://www.linkedin.com/in/nitesh933438/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Linkedin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">linkedin.com/in/nitesh933438</span>
                        </a>
                      </div>
                    </div>

                    {/* Photo Container */}
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-md shrink-0 bg-slate-900">
                      <img 
                        src="/assets/aistudio/Any_Profile_Photo_0559445a.png" 
                        alt="Nitesh Kumar" 
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  </div>

                  {/* 2-Column Body Layout matching the resume */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column (5 cols): Technical Skills, Education, Additional Info */}
                    <div className="md:col-span-5 space-y-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 md:pr-6 pb-6 md:pb-0">
                      
                      {/* Technical Skills */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-600 pb-1">
                          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            TECHNICAL SKILLS
                          </h2>
                          <div className="w-8 h-0.5 bg-blue-600" />
                        </div>

                        <div className="space-y-2 text-[11px]">
                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-400 block">Frontend</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              React.js, HTML5, CSS3, JavaScript (ES6+), Tailwind CSS, Responsive Web Design.
                            </span>
                          </div>

                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-400 block">Backend</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              Node.js, Express.js, RESTful APIs, Authentication, Webhooks.
                            </span>
                          </div>

                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-400 block">Database</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              MongoDB, Mongoose, Cloud Storage Integration.
                            </span>
                          </div>

                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-400 block">Programming</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              JavaScript, C, C++.
                            </span>
                          </div>

                          <div>
                            <span className="font-bold text-blue-700 dark:text-blue-400 block">Tools</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              Git, GitHub, VS Code, Postman, Vercel, Render.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Education */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-600 pb-1">
                          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            EDUCATION
                          </h2>
                          <div className="w-8 h-0.5 bg-blue-600" />
                        </div>

                        <div className="space-y-3 text-[11px]">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                              B.Tech – Computer Science and Engineering
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                              Arka Jain University | 2025–2029 | Pursuing
                            </p>
                            <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 font-semibold text-blue-800 dark:text-blue-300 text-[10px] mt-1">
                              Semester 1: SGPA 7.91 | Semester 2: SGPA 9.23
                            </div>
                          </div>

                          <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                              12th – Science
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                              Bihar Board | 2025 | 78.6%
                            </p>
                          </div>

                          <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                              10th
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                              Bihar Board | 2023 | 79.8%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-600 pb-1">
                          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            ADDITIONAL INFORMATION
                          </h2>
                          <div className="w-8 h-0.5 bg-blue-600" />
                        </div>

                        <div className="space-y-2 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">Currently Learning:</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              MERN Stack Architecture & Scalable Web Systems.
                            </span>
                          </div>

                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">Core Focus:</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              Full-Stack Web Applications, REST API Design & Practical Software Engineering.
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Column (7 cols): Summary & Featured Projects */}
                    <div className="md:col-span-7 space-y-6">
                      
                      {/* Professional Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-blue-600 pb-1">
                          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            PROFESSIONAL SUMMARY
                          </h2>
                          <div className="w-8 h-0.5 bg-blue-600" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                          Computer Science and Engineering undergraduate specializing in full-stack web development and MERN Stack technologies. Focused on practical software development—building responsive, user-centric web applications with clean code and scalable RESTful architectures.
                        </p>
                      </div>

                      {/* Featured Projects */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between border-b border-blue-600 pb-1">
                          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            FEATURED PROJECTS
                          </h2>
                          <div className="w-8 h-0.5 bg-blue-600" />
                        </div>

                        <div className="space-y-3">
                          {/* Digital Vault */}
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs">Digital Vault</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Secure cloud-based document storage and management platform.
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <strong className="text-slate-700 dark:text-slate-200">Tech:</strong> React.js, Node.js, Express.js, MongoDB, Cloud Storage.
                            </p>
                            <a 
                              href="https://github.com/nitesh933438/Digital-Vault-Demo" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                            >
                              <span>GitHub: Digital-Vault-Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* WorkSphere HRMS */}
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs">WorkSphere HRMS</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Employee management, attendance, leave tracking and analytics system.
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <strong className="text-slate-700 dark:text-slate-200">Tech:</strong> MERN Stack, REST APIs.
                            </p>
                            <a 
                              href="https://github.com/nitesh933438/WorkSphere-HRMS-Demo" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                            >
                              <span>GitHub: WorkSphere-HRMS-Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* AttendX AI */}
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs">AttendX AI</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Smart attendance tracking, automated logging and reporting platform.
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <strong className="text-slate-700 dark:text-slate-200">Tech:</strong> React.js, Node.js, Express.js, AI Integration.
                            </p>
                            <a 
                              href="https://github.com/nitesh933438/AttendX-AI" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                            >
                              <span>GitHub: AttendX-AI</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* WhatsApp Personal AI Bot */}
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs">WhatsApp Personal AI Bot</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              AI-powered WhatsApp automation and intelligent conversational messaging assistant.
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <strong className="text-slate-700 dark:text-slate-200">Tech:</strong> Node.js, Express.js, JavaScript, Webhooks, REST APIs.
                            </p>
                            <a 
                              href="https://github.com/nitesh933438/WhatsApp-Personal-AI-Bot-Demo" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                            >
                              <span>GitHub: WhatsApp-Personal-AI-Bot-Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* Money Details */}
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs">Money Details</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Personal income, expense tracking and financial transaction management application.
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <strong className="text-slate-700 dark:text-slate-200">Tech:</strong> React.js, Node.js, Express.js, MongoDB, JavaScript.
                            </p>
                            <a 
                              href="https://github.com/nitesh933438/Money-Details-Demo" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                            >
                              <span>GitHub: Money-Details-Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Document Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>Nitesh Kumar · Full-Stack Developer</span>
                    <span>Arka Jain University (2025–2029) · BSEB 2025</span>
                  </div>

                </div>
              )}

            </div>

            {/* Sticky Bottom Actions */}
            <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => handleCopy('nitesh933438@gmail.com', 'email')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-medium">{copiedField === 'email' ? 'Copied Email' : 'Copy Email'}</span>
                </button>
                <a
                  href={officialPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">Open in New Tab</span>
                </a>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Close
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CV (PDF)</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

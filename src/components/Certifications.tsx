import React, { useEffect, useMemo, useState } from 'react';
import { Award, ExternalLink, FileText, Search, ShieldCheck, X } from 'lucide-react';
import { subscribeToPublicCertificates, resolveCertificateUrl } from '../services/certificateFirebase';
import { CERTIFICATE_CATEGORIES, type PortfolioCertificate } from '../types/certificate';
import { ScrollReveal } from './ScrollReveal';
import { BUNDLED_CERTIFICATES } from '../data/certificates';

const formatIssueDate = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const Certifications: React.FC = () => {
  const [items, setItems] = useState<PortfolioCertificate[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PortfolioCertificate | null>(null);

  useEffect(() => subscribeToPublicCertificates((remoteItems, catalogImported) => {
    setItems(catalogImported ? remoteItems : (remoteItems.length ? remoteItems : BUNDLED_CERTIFICATES));
  }), []);

  const visible = useMemo(() => items
    .filter(x => x.published)
    .filter(x => category === 'All' || x.category === category)
    .filter(x => `${x.title} ${x.issuer} ${x.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
  , [items, category, search]);

  return (
    <section id="certifications" className="py-[var(--section-py)] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-black uppercase tracking-[.25em] text-indigo-600 dark:text-cyan-400">
              Learning • Credentials • Growth
            </span>
            <h2 className="mt-3 font-black text-slate-900 dark:text-white" style={{ fontSize: 'var(--text-4xl)' }}>
              Certifications <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">& Achievements</span>
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400" style={{ fontSize: 'var(--text-lg)' }}>
              Professional learning, certificates and documented milestones.
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search certificate, issuer or skill..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
          >
            <option>All</option>
            {CERTIFICATE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {visible.length ? (
          <>
            <p className="mb-5 text-center text-xs text-slate-500 dark:text-slate-400">
              {visible.length} credentials · Original certificate previews · Details shown only when available on the document
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map(item => (
                <article key={item.id} className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-5 hover:-translate-y-1 hover:shadow-xl transition-all">
                  <div className="h-40 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                    {item.fileType === 'image' ? (
                      <img src={resolveCertificateUrl(item.sourceAsset || item.imageUrl || item.fileUrl || '')} alt={item.title} className="w-full h-full object-contain" />
                    ) : (
                      <FileText className="w-12 h-12 text-indigo-500" />
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                      {item.category}
                    </span>
                    {item.featured && <span className="text-[10px] font-bold text-amber-600">FEATURED</span>}
                  </div>
                  <h3 className="mt-2 font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.issuer}{item.issueDate ? ` • ${formatIssueDate(item.issueDate)}` : ''}
                  </p>
                  {item.credentialId && (
                    <p className="mt-1 text-[11px] text-slate-400">Credential ID: {item.credentialId}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelected(item)}
                      className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition-all active:scale-95"
                    >
                      View Certificate
                    </button>
                    {item.credentialUrl && (item.verificationStatus === 'approved' || !item.verificationStatus) && (
                      <a
                        href={item.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Verify</span>
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-14 text-center">
            <Award className="w-10 h-10 mx-auto text-indigo-500" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Certificates are being organized</h3>
            <p className="mt-2 max-w-xl mx-auto text-sm text-slate-500 dark:text-slate-400">
              Verified certificates and achievements will appear here once they have been added and published. No sample or unverified credentials are displayed.
            </p>
          </div>
        )}
      </div>

      {selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] bg-slate-950/95 p-4 sm:p-8 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center text-white mb-4">
            <div>
              <h3 className="font-bold text-lg">{selected.title}</h3>
              <p className="text-xs text-slate-300">
                {selected.issuer}{selected.issueDate ? ` · ${formatIssueDate(selected.issueDate)}` : ''}
              </p>
              {selected.credentialId && (
                <p className="text-[11px] text-slate-400 mt-1 font-mono">Credential ID: {selected.credentialId}</p>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close viewer">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {selected.fileType === 'pdf' ? (
              <iframe title={selected.title} src={resolveCertificateUrl(selected.sourceAsset || selected.fileUrl || '')} className="w-full h-full rounded-2xl bg-white" />
            ) : (
              <img src={resolveCertificateUrl(selected.sourceAsset || selected.imageUrl || selected.fileUrl || '')} alt={selected.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            )}
          </div>
          <div className="mt-4 mx-auto max-w-4xl w-full text-center">
            <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
            {selected.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {selected.skills.map(skill => (
                  <span key={skill} className="rounded-full bg-white/10 border border-white/5 px-3 py-1 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          {selected.credentialUrl && (selected.verificationStatus === 'approved' || !selected.verificationStatus) && (
            <div className="mt-6 mx-auto">
              <a
                href={selected.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-black transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Verify Original Credential</span>
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

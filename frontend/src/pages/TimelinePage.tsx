import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import type { Timeline } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const CAT_STYLES: Record<string, { color: string; icon: ReactNode }> = {
    incident: { color: 'bg-red-500 text-white shadow-red-500/30', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
    action: { color: 'bg-blue-500 text-white shadow-blue-500/30', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
    response: { color: 'bg-amber-500 text-white shadow-amber-500/30', icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></> },
    deadline: { color: 'bg-purple-500 text-white shadow-purple-500/30', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
    evidence: { color: 'bg-emerald-500 text-white shadow-emerald-500/30', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></> },
};

export default function TimelinePage() {
    const { t } = useLanguage();
    const { session } = useSession();
    const [text, setText] = useState('');
    const [tl, setTl] = useState<Timeline | null>(null);
    const [loading, setLoading] = useState(false);
    const [pdfBusy, setPdfBusy] = useState(false);
    const [error, setError] = useState('');

    const generate = async () => {
        if (text.trim().length < 30) { setError('Please provide more details (at least 30 characters) so AI can understand completely.'); return; }
        setLoading(true); setError('');
        try {
            const { data } = await axios.post(`${API}/v1/timeline/extract`, {
                narrative_text: text, session_id: session?.session_id, user_id: session?.user_id || 'guest'
            });
            setTl(data);
        } catch { setError(t('common.error')); }
        finally { setLoading(false); }
    };

    const exportPdf = async () => {
        if (!tl) return;
        setPdfBusy(true);
        try {
            const { data } = await axios.post(`${API}/v1/timeline/export`, { timeline_id: tl.timeline_id });
            window.open(data.download_url, '_blank');
        } catch { setError('PDF export failed. Please try again.'); }
        finally { setPdfBusy(false); }
    };

    return (
        <div className="p-4 sm:p-8 max-w-3xl mx-auto pb-32 space-y-8 animate-fade-in relative z-10">

            <div className="pt-2">
                <h1 className="text-3xl font-black text-slate-800 font-display flex items-center gap-3">
                    <span className="text-brand-600"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></span>
                    {t('timeline.title')}
                </h1>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed">Type your story or incident description in plain language, and our AI will automatically structure it into a chronologically grouped legal timeline.</p>
            </div>

            {/* Input Glass Card */}
            <div className="glass-panel p-2 rounded-[2rem] shadow-glass-sm ring-1 ring-black/5">
                <div className="bg-white rounded-[1.5rem] p-5 shadow-sm">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={t('timeline.placeholder')}
                        rows={7}
                        className="w-full text-[15px] sm:text-[16px] text-slate-700 bg-transparent resize-none focus:outline-none placeholder:text-slate-300 leading-relaxed font-medium"
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{text.length} chars</span>
                        <button onClick={generate} disabled={loading || text.length < 30}
                            className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white rounded-full text-[15px] font-bold shadow-md hover:shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:scale-100 transition-all font-display">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Analyzing Chronology...
                                </span>
                            ) : 'Generate Legal Timeline'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="px-5 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold shadow-sm">
                    {error}
                </div>
            )}

            {/* Resulting Timeline */}
            {tl && (
                <div className="animate-slide-up space-y-6 mt-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-slate-800 font-display">Detected Events <span className="text-slate-400 font-sans text-sm ml-2">({tl.timeline.length} found)</span></h2>
                        <button onClick={exportPdf} disabled={pdfBusy}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white text-emerald-600 text-[14px] font-bold rounded-xl ring-1 ring-emerald-200 hover:bg-emerald-50 hover:shadow-sm disabled:opacity-60 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            {pdfBusy ? 'Exporting PDF...' : t('timeline.export_pdf')}
                        </button>
                    </div>

                    <div className="relative pl-6 sm:pl-10 pb-8">
                        <div className="absolute left-11 top-6 bottom-0 w-[3px] bg-slate-200/50 rounded-full" />

                        <div className="space-y-8">
                            {tl.timeline.map((ev, i) => {
                                const s = CAT_STYLES[ev.category] || CAT_STYLES.incident;
                                return (
                                    <div key={i} className="flex gap-4 sm:gap-6 relative group">
                                        <div className={`w-12 h-12 rounded-full ${s.color} shadow-lg flex items-center justify-center shrink-0 z-10 transform group-hover:scale-110 transition-transform`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                                        </div>
                                        <div className="flex-1 glass-panel rounded-[1.5rem] p-5 sm:p-6 shadow-sm group-hover:shadow-md transition-shadow group-hover:-translate-y-1 duration-300">
                                            <div className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-[11px] font-black uppercase tracking-widest rounded-md mb-3">{ev.date}</div>
                                            <div className="text-[16px] font-bold text-slate-800 leading-relaxed font-display">{ev.event}</div>
                                            <div className="text-[13px] text-slate-500 font-medium mt-3 border-l-2 border-slate-200 pl-3 leading-relaxed">{ev.legal_significance}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

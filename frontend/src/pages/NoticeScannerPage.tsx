import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import type { NoticeAnalysis } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export default function NoticeScannerPage() {
    const { t } = useLanguage();
    const { session } = useSession();
    const inputRef = useRef<HTMLInputElement>(null);

    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<Status>('idle');
    const [analysis, setAnalysis] = useState<NoticeAnalysis | null>(null);
    const [error, setError] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Converts file → base64 string
    const toBase64 = (file: File): Promise<string> =>
        new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res((r.result as string).split(',')[1]);
            r.onerror = rej;
            r.readAsDataURL(file);
        });

    const pollForResult = useCallback((noticeId: string) => {
        let attempts = 0;
        pollRef.current = setInterval(async () => {
            attempts++;
            try {
                const { data } = await axios.get(`${API}/v1/notices/${noticeId}/analysis`);
                if (data.processing_status === 'completed') {
                    clearInterval(pollRef.current!);
                    setAnalysis(data);
                    setStatus('done');
                } else if (data.processing_status === 'failed') {
                    clearInterval(pollRef.current!);
                    setError('Document too blurry. Please rescan and upload.');
                    setStatus('error');
                }
            } catch { /* polling */ }

            if (attempts >= 30) {
                clearInterval(pollRef.current!);
                setError('Engine timed out. Your connection might be restricted.');
                setStatus('error');
            }
        }, 3000);
    }, []);

    const processFile = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) return setError('File limit is 5MB.');
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowed.includes(file.type)) return setError('Use PDF, JPG, or PNG only.');

        setStatus('uploading'); setError('');

        try {
            const b64 = await toBase64(file);
            const { data } = await axios.post(`${API}/v1/notices/upload`, {
                file_data: b64, file_name: file.name, file_type: file.type,
                user_id: session?.user_id || 'guest', session_id: session?.session_id
            });
            setStatus('analyzing'); pollForResult(data.notice_id);
        } catch { setError('Connection lost to AWS Server.'); setStatus('error'); }
    };

    const reset = () => { if (pollRef.current) clearInterval(pollRef.current); setStatus('idle'); setAnalysis(null); };

    return (
        <div className="p-4 sm:p-8 max-w-3xl mx-auto pb-32 space-y-8 animate-fade-in relative z-10">

            <div className="pt-2">
                <h1 className="text-3xl font-black text-slate-800 font-display flex items-center gap-3">
                    <span className="text-purple-600"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21" /><path d="M16 16l-4-4-4 4" /></svg></span>
                    Smart Notice Scanner
                </h1>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed">Upload any legal document, scanned photo, or police notice. AWS Textract will break it down to explain deadlines, risk factors, and legal citations.</p>
            </div>

            {status === 'idle' && (
                <label
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    className={`cursor-pointer glass-panel mt-10 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center min-h-[350px] transition-all duration-300 ring-2 ring-dashed outline-none
            ${dragging ? 'bg-brand-50/80 ring-brand-500 scale-105 shadow-glass-lg' : 'bg-white/60 ring-slate-300 hover:bg-white hover:ring-brand-400 hover:shadow-glass'}`}
                >
                    <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
                    <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-4xl mb-6 shadow-sm">
                        <svg className="text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21" /><path d="M16 16l-4-4-4 4" /></svg>
                    </div>
                    <p className="font-bold text-slate-800 text-xl font-display">{t('notice.upload')}</p>
                    <p className="text-slate-500 font-medium mt-2">Maximum file limit is 5MB in highly readable format.</p>
                    <div className="mt-8 bg-slate-100 text-slate-500 font-bold tracking-widest text-[10px] uppercase px-4 py-2 rounded-lg">High Contrast Scans Work Best</div>
                </label>
            )}

            {(status === 'uploading' || status === 'analyzing') && (
                <div className="mt-10 bg-white rounded-[2.5rem] p-16 text-center shadow-glass ring-1 ring-slate-100 min-h-[350px] flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-8 animate-pulse shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" /><path d="M12 2A10 10 0 0 0 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </div>
                    <p className="font-black text-2xl text-slate-800 font-display tracking-tight mb-2">
                        {status === 'uploading' ? 'Extracting text (OCR)...' : 'AI analyzing clauses...'}
                    </p>
                    <p className="text-slate-400 font-medium">Please wait. Do not close this application window.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="mt-10 bg-red-50 border border-red-200 rounded-[2rem] p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <p className="text-red-700 font-bold text-lg mb-8 tracking-wide">{error}</p>
                    <button onClick={reset} className="px-8 py-3.5 bg-red-600 text-white rounded-full font-bold shadow-md hover:bg-red-700 transition-colors uppercase tracking-widest text-xs">Upload New Document</button>
                </div>
            )}

            {status === 'done' && analysis && (
                <div className="space-y-6 animate-slide-up bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-glass border border-slate-100">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <h2 className="font-black text-2xl text-slate-800 font-display flex items-center gap-3"><span className="text-emerald-500"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span> Extracted Report</h2>
                        <button onClick={reset} className="text-[11px] uppercase tracking-widest font-black text-slate-400 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-2 rounded-lg">Rescan</button>
                    </div>

                    {/* Key Facts */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-5 rounded-3xl ${analysis.deadline_status === 'CRITICAL' ? 'bg-red-50 text-red-800' : 'bg-slate-50 text-slate-800'}`}>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-1">Time Actionable</p>
                            <p className="font-display font-black text-2xl">{analysis.response_deadline_date || 'Unknown'}</p>
                        </div>
                        <div className={`p-5 rounded-3xl ${analysis.risk_level === 'HIGH' ? 'bg-orange-50 text-orange-800' : 'bg-emerald-50 text-emerald-800'}`}>
                            <p className="text-[10px] uppercase tracking-widest opacity-60 font-black mb-1">Calculated Risk Index</p>
                            <p className="font-display font-black text-2xl">{analysis.risk_score || '0'}/100 {analysis.risk_level}</p>
                        </div>
                    </div>

                    {/* Important Clauses */}
                    {analysis.demands && (
                        <div className="pt-4">
                            <h3 className="font-bold text-slate-800 text-lg mb-3">Key Demands Noticed</h3>
                            <ul className="space-y-3 pl-2 border-l-2 border-slate-200">
                                {analysis.demands.map((d, i) => (
                                    <li key={i} className="text-slate-600 font-medium pl-3 text-sm leading-relaxed">{d}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* AI Recommended Guidance */}
                    {analysis.recommended_actions && (
                        <div className="pt-4 mt-6 border-t border-slate-100">
                            <h3 className="font-bold text-brand-700 text-lg mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> Suggested Actions</h3>
                            <div className="bg-brand-50 p-6 rounded-[2rem]">
                                {typeof analysis.recommended_actions === 'string' ? (
                                    <p className="text-slate-700">{analysis.recommended_actions}</p>
                                ) : (
                                    <ul className="space-y-4">
                                        {((analysis.recommended_actions as unknown) as any[]).map((a, i) => (
                                            <li key={i}>
                                                <div className="font-bold text-slate-800">{a.action}</div>
                                                <div className="text-sm text-slate-500">{a.reason}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

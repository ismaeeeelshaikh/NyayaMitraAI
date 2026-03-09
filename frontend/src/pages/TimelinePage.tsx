import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import type { Timeline } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION PARTICLES (Opacity Increased to 0.8)
   ═══════════════════════════════════════════════════════════ */
function ConstellationParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[]>([]);
    const animFrame = useRef(0);

    const init = useCallback(() => {
        const count = window.innerWidth < 768 ? 40 : 80;
        const colors = ['#E87D20', '#138808', '#FFFFFF', '#FFB366'];
        particles.current = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize(); init();
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill();
            });
            animFrame.current = requestAnimationFrame(draw);
        };
        draw();
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animFrame.current);
            window.removeEventListener('resize', resize);
        };
    }, [init]);

    // Opacity increased to 0.8 for better visibility as requested
    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-80" />;
}

const CAT_STYLES: Record<string, { color: string; icon: ReactNode; glow: string }> = {
    incident: { color: 'bg-rose-500', glow: 'shadow-rose-500/20', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
    action: { color: 'bg-blue-500', glow: 'shadow-blue-500/20', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
    response: { color: 'bg-amber-500', glow: 'shadow-amber-500/20', icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></> },
    deadline: { color: 'bg-purple-500', glow: 'shadow-purple-500/20', icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
    evidence: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/20', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></> },
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
        if (text.trim().length < 30) { setError(t('timeline.min_chars_error')); return; }
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
        } catch { setError(t('timeline.pdf_export_failed')); }
        finally { setPdfBusy(false); }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-slate-300 font-sans selection:bg-[#E87D20]/30 overflow-x-hidden relative">

            {/* ═══════════════════════════════════════════════════════════
               BACKGROUND THEME (Consistent with Dashboard/Chat)
               ═══════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="fixed top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#E87D20]/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

            <div className="relative z-10 p-4 sm:p-8 max-w-4xl mx-auto pb-32 space-y-10">
                {/* Header Section */}
                <header className="pt-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-[#E87D20]/10 border border-[#E87D20]/20 rounded-2xl text-[#E87D20] shadow-[0_0_20px_rgba(232,125,32,0.1)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight font-display uppercase">
                                {t('timeline.title')}
                            </h1>
                            <p className="text-[#8B95A5] font-black text-[10px] tracking-[0.3em] uppercase">{t('timeline.engine_badge')}</p>
                        </div>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">{t('timeline.desc')}</p>
                </header>

                {/* Input Card (Dark Glass) */}
                <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E87D20]/20 to-orange-500/20 rounded-[2.5rem] blur opacity-75 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative bg-[#0D1220]/80 backdrop-blur-xl border border-[#1E293B] p-2 rounded-2xl sm:rounded-[2.5rem] shadow-2xl">
                        <div className="bg-[#050505]/40 rounded-xl sm:rounded-[2rem] p-4 sm:p-6">
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={t('timeline.placeholder')}
                                rows={8}
                                className="w-full text-[16px] text-white bg-transparent resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed font-medium"
                            />
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 border-t border-[#1E293B] gap-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{text.length} {t('timeline.characters_analyzed')}</span>

                                {/* ═══════════════════════════════════════════════════════════
                                   DASHBOARD STYLE BUTTON (Updated to Match Dashboard)
                                   ═══════════════════════════════════════════════════════════ */}
                                <button
                                    onClick={generate}
                                    disabled={loading || text.length < 30}
                                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-br from-[#E87D20] to-[#FF512F] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#E87D20]/20 hover:shadow-[#E87D20]/40 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
                                >
                                    {loading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {loading ? t('timeline.generate_loading') : t('timeline.generate')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in">
                        ⚠️ {error}
                    </div>
                )}

                {/* Resulting Timeline Section */}
                {tl && (
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-8 mt-16">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-2">
                            <h2 className="text-xl font-black text-white font-display uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-8 bg-gradient-to-b from-[#E87D20] to-orange-600 rounded-full"></span>
                                {t('timeline.events_detected')} <span className="text-[#E87D20] bg-[#E87D20]/10 px-3 py-1 rounded-full text-xs ml-2 border border-[#E87D20]/20">{tl.timeline.length}</span>
                            </h2>
                            <button
                                onClick={exportPdf}
                                disabled={pdfBusy}
                                className="flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-[#0D1220] text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 hover:bg-emerald-500/5 transition-all disabled:opacity-40"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                {pdfBusy ? t('timeline.export_loading') : t('timeline.export_pdf')}
                            </button>
                        </div>

                        {/* Timeline Visualizer */}
                        <div className="relative pl-4 sm:pl-12 pb-20">
                            {/* Vertical Line */}
                            <div className="absolute left-[34px] sm:left-[66px] top-8 bottom-0 w-[2px] bg-gradient-to-b from-[#E87D20]/50 via-[#1E293B] to-transparent rounded-full" />

                            <div className="space-y-12">
                                {tl.timeline.map((ev, i) => {
                                    const s = CAT_STYLES[ev.category] || CAT_STYLES.incident;
                                    return (
                                        <div key={i} className="flex gap-6 sm:gap-10 relative group">
                                            {/* Category Icon & Connector */}
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[1.5rem] ${s.color} ${s.glow} shadow-2xl flex items-center justify-center shrink-0 z-10 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 border-4 border-[#050505]`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">{s.icon}</svg>
                                            </div>

                                            {/* Event Content Card */}
                                            <div className="flex-1 bg-[#0D1220]/60 backdrop-blur-md border border-[#1E293B] rounded-[2rem] p-6 sm:p-8 shadow-2xl group-hover:border-[#E87D20]/30 transition-all duration-500 relative overflow-hidden">
                                                {/* Date Badge */}
                                                <div className="inline-block px-4 py-1.5 bg-[#E87D20]/10 text-[#E87D20] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg mb-4 border border-[#E87D20]/20">
                                                    {ev.date}
                                                </div>

                                                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight font-display mb-3 group-hover:text-[#E87D20] transition-colors">
                                                    {ev.event}
                                                </h3>

                                                <div className="relative mt-4">
                                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E87D20]/30 rounded-full" />
                                                    <div className="pl-5 leading-relaxed">
                                                        <span className="text-[#E87D20]/60 font-black text-[9px] uppercase block mb-1 tracking-[0.2em]">{t('timeline.legal_significance')}</span>
                                                        <p className="text-[14px] text-slate-400 font-medium italic">
                                                            {ev.legal_significance}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Decorative background glow for card */}
                                                <div className={`absolute -right-4 -top-4 w-24 h-24 ${s.color} opacity-[0.03] blur-3xl rounded-full transition-opacity group-hover:opacity-[0.08]`}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <style>{`
                .font-display { font-family: 'Space Grotesk', 'Noto Sans Devanagari', sans-serif; }
                .scrollbar-custom::-webkit-scrollbar { width: 4px; }
                .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(232, 125, 32, 0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import type { NoticeAnalysis } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

/* ═══════════════════════════════════════════════════════════
   NYAYA MITRA CONSTELLATION (Orange & Green Palette)
   ═══════════════════════════════════════════════════════════ */
function ConstellationParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[]>([]);
    const mouse = useRef({ x: -1000, y: -1000 });
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
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize(); init();
        const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouse);
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current.forEach((p, i) => {
                const dx = p.x - mouse.current.x; const dy = p.y - mouse.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) { p.vx += dx / dist * 0.05; p.vy += dy / dist * 0.05; }
                p.vx *= 0.99; p.vy *= 0.99;
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill();
                for (let j = i + 1; j < particles.current.length; j++) {
                    const p2 = particles.current[j];
                    const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (d < 150) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(232, 125, 32, ${0.2 * (1 - d / 150)})`;
                        ctx.stroke();
                    }
                }
            });
            animFrame.current = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animFrame.current); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMouse); };
    }, [init]);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-80" />;
}

/* ═══════════════════════════════════════════════════════════
   MAIN SCANNER PAGE
   ═══════════════════════════════════════════════════════════ */
export default function NoticeScannerPage() {
    const { language } = useLanguage();
    const { session } = useSession();
    const inputRef = useRef<HTMLInputElement>(null);

    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<Status>('idle');
    const [analysis, setAnalysis] = useState<NoticeAnalysis | null>(null);
    const [error, setError] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
                    setError(language === 'en' ? 'Scanning failed. Document is too blurry or unreadable.' : 'स्कैन विफल रहा। दस्तावेज़ धुंधला या अपठनीय है।');
                    setStatus('error');
                }
            } catch { /* polling */ }
            if (attempts >= 30) {
                clearInterval(pollRef.current!);
                setError(language === 'en' ? 'Analysis engine timeout. Please check your file quality.' : 'एनालिसिस इंजन टाइमआउट। कृपया अपनी फ़ाइल गुणवत्ता जांचें।');
                setStatus('error');
            }
        }, 3000);
    }, [language]);

    const processFile = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) return setError('File size limit: 5MB.');
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowed.includes(file.type)) return setError('Please upload PDF, JPG, or PNG only.');
        setStatus('uploading'); setError('');
        try {
            const b64 = await toBase64(file);
            const { data } = await axios.post(`${API}/v1/notices/upload`, {
                file_data: b64, file_name: file.name, file_type: file.type,
                user_id: session?.user_id || 'guest', session_id: session?.session_id
            });
            setStatus('analyzing'); pollForResult(data.notice_id);
        } catch { setError('Secure connection lost. Retry upload.'); setStatus('error'); }
    };

    const reset = () => { if (pollRef.current) clearInterval(pollRef.current); setStatus('idle'); setAnalysis(null); };

    let parsedActions: any[] = [];
    if (analysis?.recommended_actions) {
        if (typeof analysis.recommended_actions === 'string') {
            try {
                const parsed = JSON.parse(analysis.recommended_actions);
                parsedActions = Array.isArray(parsed) ? parsed : [{ action: analysis.recommended_actions, reason: '' }];
            } catch { parsedActions = [{ action: analysis.recommended_actions, reason: '' }]; }
        } else if (Array.isArray(analysis.recommended_actions)) {
            parsedActions = analysis.recommended_actions;
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans flex flex-col selection:bg-[#E87D20]/30 selection:text-white">

            {/* ════════════ BACKGROUND ARCHITECTURE ════════════ */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="fixed top-[-15%] right-[-5%] w-[500px] h-[500px] bg-[#E87D20]/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none z-0 animate-pulse-slow"></div>

            <main className="flex-1 relative z-10 p-4 sm:p-8 max-w-4xl mx-auto w-full pb-32 space-y-8 animate-fade-in">

                {/* Header Section */}
                <section className="relative overflow-hidden bg-[#0D1220] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[2.5rem] p-8 sm:p-10 mt-4">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#E87D20]/10 rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <h2 className="text-xs font-bold tracking-[0.3em] text-[#E87D20] uppercase mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-[#E87D20]/50"></span> OCR Clause Analysis
                        </h2>
                        <h1 className="text-4xl font-extrabold text-white font-display leading-tight mb-3">Notice Scanner</h1>
                        <p className="text-[#8B95A5] font-medium text-lg max-w-2xl leading-relaxed">
                            Process legal documents to extract key obligations, critical deadlines, and risk profiles.
                        </p>
                    </div>
                </section>

                {/* --- STATE: IDLE (Upload) --- */}
                {status === 'idle' && (
                    <div className="animate-slide-up">
                        <label
                            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            className={`group relative cursor-pointer bg-[#0D1220]/50 backdrop-blur-xl border-2 border-dashed rounded-[3rem] p-16 text-center flex flex-col items-center justify-center min-h-[400px] transition-all duration-500
                            ${dragging ? 'border-[#E87D20] bg-[#E87D20]/5 scale-[1.01]' : 'border-[#1E293B] hover:border-[#E87D20]/50 hover:bg-[#0D1220]'}`}
                        >
                            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E87D20] to-[#FF512F] flex items-center justify-center mb-8 shadow-[0_10px_25px_-5px_rgba(232,125,32,0.4)] group-hover:scale-110 transition-transform duration-500">
                                <svg className="text-white" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>

                            <h3 className="font-bold text-white text-2xl font-display mb-2">Upload Legal Instrument</h3>
                            <p className="text-[#8B95A5] font-medium max-w-sm mx-auto leading-relaxed">Drag files here or tap to browse. Optimized for high-fidelity OCR scanning.</p>

                            <div className="mt-10 px-6 py-2 bg-[#121827] text-[#8B95A5] font-black tracking-widest text-[10px] uppercase rounded-full border border-[#1E293B]">
                                PDF • JPG • PNG
                            </div>
                        </label>
                    </div>
                )}

                {/* --- STATE: LOADING --- */}
                {(status === 'uploading' || status === 'analyzing') && (
                    <div className="mt-10 bg-[#0D1220] border border-[#1E293B] rounded-[3rem] p-20 text-center shadow-2xl min-h-[400px] flex flex-col items-center justify-center animate-pulse">
                        <div className="relative mb-10">
                            <div className="w-20 h-20 rounded-full border-4 border-[#E87D20]/20 border-t-[#E87D20] animate-spin"></div>
                        </div>
                        <h2 className="font-black text-3xl text-white font-display mb-3 tracking-tight">
                            {status === 'uploading' ? 'Extracting Data...' : 'Executing Clause Mapping...'}
                        </h2>
                        <p className="text-[#8B95A5] font-medium">Processing through secure enterprise protocol.</p>
                    </div>
                )}

                {/* --- STATE: ERROR --- */}
                {status === 'error' && (
                    <div className="mt-10 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-12 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <p className="text-red-400 font-bold text-xl mb-8">{error}</p>
                        <button onClick={reset} className="px-10 py-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg">
                            Retry Process
                        </button>
                    </div>
                )}

                {/* --- STATE: DONE (Results) --- */}
                {status === 'done' && analysis && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="bg-[#0D1220] rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-[#1E293B] relative overflow-hidden">
                            <div className="absolute top-8 right-8">
                                <button onClick={reset} className="text-[10px] uppercase tracking-[0.2em] font-black text-[#8B95A5] hover:text-[#E87D20] transition-colors bg-[#121827] px-5 py-2 rounded-full border border-[#1E293B]">
                                    New Scan
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#1E293B]">
                                <div className="w-12 h-12 rounded-2xl bg-[#E87D20]/10 text-[#E87D20] flex items-center justify-center border border-[#E87D20]/20">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                </div>
                                <h2 className="font-black text-3xl text-white font-display">Compliance Summary</h2>
                            </div>

                            {/* Risk & Deadline Dashboard */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                <div className={`p-8 rounded-[2rem] border ${analysis.deadline_status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-[#121827] border-[#1E293B]'}`}>
                                    <p className="text-[10px] uppercase tracking-widest text-[#8B95A5] font-black mb-2">Notice Deadline</p>
                                    <p className="font-display font-black text-3xl text-white">{analysis.response_deadline_date || 'N/A'}</p>
                                </div>
                                <div className={`p-8 rounded-[2rem] border ${analysis.risk_level === 'HIGH' ? 'bg-[#E87D20]/10 border-[#E87D20]/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                    <p className="text-[10px] uppercase tracking-widest text-[#8B95A5] font-black mb-2">Legal Risk Index</p>
                                    <p className="font-display font-black text-3xl text-white">{analysis.risk_score || '0'}/100 <span className="text-sm font-medium opacity-60 ml-2">({analysis.risk_level})</span></p>
                                </div>
                            </div>

                            {/* Demands */}
                            {analysis.demands && (
                                <div className="space-y-4 mb-10">
                                    <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-[#E87D20] rounded-full"></span> Mapped Clauses
                                    </h3>
                                    <div className="grid gap-3">
                                        {analysis.demands.map((d, i) => (
                                            <div key={i} className="bg-[#121827] p-5 rounded-2xl border border-[#1E293B] text-[#BCC4D0] font-medium text-sm leading-relaxed flex gap-4 hover:border-[#E87D20]/30 transition-colors">
                                                <span className="text-[#E87D20] font-black">#0{i + 1}</span> {d}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expert Recommendations Section */}
                            {parsedActions.length > 0 && (
                                <div className="pt-10 border-t border-[#1E293B]">
                                    <h3 className="font-bold text-white text-2xl mb-6 flex items-center gap-3">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E87D20" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                        Strategic Recommendations
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {parsedActions.map((a, i) => (
                                            <div key={i} className="bg-[#090C15] border border-[#1E293B] rounded-[2rem] p-6 hover:border-[#E87D20]/40 transition-all group relative overflow-hidden">
                                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#E87D20]/5 rounded-full blur-xl group-hover:bg-[#E87D20]/10 transition-all"></div>
                                                <div className="font-bold text-white text-lg leading-snug mb-3 group-hover:text-[#E87D20] transition-colors">{a.action}</div>
                                                {a.reason && <div className="text-sm text-[#8B95A5] font-medium leading-relaxed">{a.reason}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
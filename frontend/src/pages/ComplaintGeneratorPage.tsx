import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

/* ═══════════════════════════════════════════════════════════
   DATA & ICONS
   ═══════════════════════════════════════════════════════════ */
const TYPES = [
    { id: 'police', icon: <path d="M11 15v2m-6-2v2m12-2v2M4 11v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4m-12-3h8m-9-4h10a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2z" />, key: 'complaint.police', color: 'from-blue-500 to-cyan-500' },
    { id: 'rti', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></>, key: 'complaint.rti', color: 'from-emerald-500 to-green-500' },
    { id: 'legal_notice', icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>, key: 'complaint.legal_notice', color: 'from-purple-500 to-indigo-500' },
    { id: 'consumer', icon: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>, key: 'complaint.consumer', color: 'from-orange-500 to-amber-500' },
    { id: 'womens_cell', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.2 0-2 .8-2 2v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>, key: 'complaint.womens_cell', color: 'from-pink-500 to-rose-500' },
    { id: 'cyber', icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>, key: 'complaint.cyber', color: 'from-red-500 to-rose-600' },
];

const FIELDS = [
    { key: 'name', type: 'text', i18n: 'complaint.name', required: true },
    { key: 'phone', type: 'tel', i18n: 'complaint.phone', required: false },
    { key: 'address', type: 'text', i18n: 'complaint.address', required: false },
    { key: 'email', type: 'email', i18n: 'Email Address', required: false },
];

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION PARTICLES (Exact Dashboard Background)
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

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        init();

        const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouse);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const pts = particles.current;
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                const dx = p.x - mouse.current.x;
                const dy = p.y - mouse.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    p.vx += dx / dist * 0.05;
                    p.vy += dy / dist * 0.05;
                }
                p.vx *= 0.99; p.vy *= 0.99;
                if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.1;
                if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * 0.1;
                p.x += p.vx; p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();

                for (let j = i + 1; j < pts.length; j++) {
                    const p2 = pts[j];
                    const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (d < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * (1 - d / 150)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
                ctx.globalAlpha = 1.0;
            }
            animFrame.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animFrame.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouse);
        };
    }, [init]);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-80" />;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPLAINT GENERATOR PAGE
   ═══════════════════════════════════════════════════════════ */
type Step = 'type' | 'form' | 'done';

export default function ComplaintGeneratorPage() {
    const { t, language } = useLanguage();
    const { session } = useSession();

    const [step, setStep] = useState<Step>('type');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ tracking_number: string; pdf_url: string } | null>(null);
    const [form, setForm] = useState({
        name: '', phone: '', address: '', email: '', incident: '', relief: '', state: '', district: ''
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const generate = async () => {
        if (!form.name.trim() || !form.incident.trim()) {
            setError('Name and incident details are compulsory fields.');
            return;
        }
        setLoading(true); setError('');
        try {
            const { data } = await axios.post(`${API}/v1/complaints/generate`, {
                complaint_type: type, language,
                user_id: session?.user_id || 'guest',
                user_inputs: {
                    complainant: { name: form.name, phone: form.phone, address: form.address, email: form.email },
                    incident_description: form.incident,
                    relief_sought: form.relief,
                    location: { state: form.state, district: form.district }
                }
            });
            setResult(data);
            setStep('done');
        } catch { setError('Connection error. Please wait and try again.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-[#E87D20]/30 selection:text-white flex flex-col">

            {/* ════════════ BACKGROUND EFFECTS (Same as Dashboard) ════════════ */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#E87D20]/20 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-slow pointer-events-none z-0"></div>

            {/* ════════════ MAIN CONTENT ════════════ */}
            <main className="flex-1 relative z-10 px-4 py-8 sm:py-12 max-w-3xl mx-auto w-full space-y-8 animate-fade-in">

                {/* Hero Greeting Section (Dashboard Style) */}
                <section className="relative overflow-hidden bg-[#0D1220] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[2.5rem] p-8 sm:p-10">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#E87D20]/10 rounded-full mix-blend-screen blur-[60px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <h2 className="text-sm font-bold tracking-widest text-[#E87D20] uppercase mb-3 flex items-center gap-2">
                            📝 Professional Drafter
                        </h2>
                        <h1 className="text-4xl font-extrabold text-white font-display leading-tight mb-3">AI Legal Drafter</h1>
                        <p className="text-[#8B95A5] font-medium text-lg max-w-xl">
                            Automatically write professional, watertight legal drafts in minutes. Approved formats accepted directly by authorities.
                        </p>
                    </div>
                </section>

                {/* --- STEP 1: SELECT TYPE --- */}
                {step === 'type' && (
                    <section className="space-y-6 animate-slide-up">
                        <div className="flex items-center gap-3 px-2">
                            <span className="w-2 h-6 bg-[#E87D20] rounded-full shadow-[0_0_15px_rgba(232,125,32,0.3)]"></span>
                            <h3 className="text-2xl font-bold text-white font-display">Select Document Category</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {TYPES.map((tp, i) => (
                                <button key={tp.id} onClick={() => { setType(tp.id); setStep('form'); }}
                                    className="group relative bg-[#0D1220] border border-[#1E293B] hover:border-[#E87D20]/50 rounded-[2rem] p-6 shadow-lg transition-all duration-300 text-left overflow-hidden hover:-translate-y-1.5"
                                    style={{ transitionDelay: `${i * 50}ms` }}>
                                    <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br ${tp.color} opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>

                                    <div className={`w-14 h-14 rounded-[1.2rem] bg-gradient-to-br ${tp.color} text-white flex items-center justify-center mb-5 shadow-lg transform group-hover:scale-110 transition-transform`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            {tp.icon}
                                        </svg>
                                    </div>
                                    <span className="font-bold text-lg text-white font-display group-hover:text-[#E87D20] transition-colors">{t(tp.key)}</span>
                                    <div className="absolute bottom-6 right-6 text-[#8B95A5] group-hover:text-[#E87D20] transform group-hover:translate-x-1 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- STEP 2: FORM --- */}
                {step === 'form' && (
                    <div className="animate-slide-up space-y-6">
                        <button onClick={() => setStep('type')} className="text-[#8B95A5] hover:text-[#E87D20] text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Change Category
                        </button>

                        <div className="bg-[#090C15]/80 backdrop-blur-2xl border border-[#1E293B] p-8 sm:p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                            <h2 className="text-2xl font-bold text-white font-display">Required Details</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {FIELDS.map(f => (
                                    <div key={f.key} className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[#8B95A5] ml-1">
                                            {f.i18n.startsWith('complaint.') ? t(f.i18n) : f.i18n}{f.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <input type={f.type} value={(form as any)[f.key]}
                                            onChange={e => set(f.key, e.target.value)}
                                            className="w-full px-5 py-4 bg-[#050505] border border-[#1E293B] rounded-2xl text-white focus:outline-none focus:border-[#E87D20] focus:ring-1 focus:ring-[#E87D20] transition-all" />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#1E293B]/50">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-[#8B95A5] ml-1">State / Zone</label>
                                    <input type="text" value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Maharashtra"
                                        className="w-full px-5 py-4 bg-[#050505] border border-[#1E293B] rounded-2xl text-white focus:outline-none focus:border-[#E87D20] transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-[#8B95A5] ml-1">City / District</label>
                                    <input type="text" value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Mumbai"
                                        className="w-full px-5 py-4 bg-[#050505] border border-[#1E293B] rounded-2xl text-white focus:outline-none focus:border-[#E87D20] transition-all" />
                                </div>
                            </div>

                            <div className="space-y-2 pt-6 border-t border-[#1E293B]/50">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#8B95A5] ml-1">Incident Description <span className="text-red-500 ml-1">*</span></label>
                                <textarea value={form.incident} onChange={e => set('incident', e.target.value)} rows={5} placeholder="Describe exactly what happened chronologically..."
                                    className="w-full px-5 py-4 bg-[#050505] border border-[#1E293B] rounded-2xl text-white focus:outline-none focus:border-[#E87D20] transition-all resize-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#8B95A5] ml-1">Expected Relief / Demands</label>
                                <input type="text" value={form.relief} onChange={e => set('relief', e.target.value)} placeholder="What outcome do you want?"
                                    className="w-full px-5 py-4 bg-[#050505] border border-[#1E293B] rounded-2xl text-white focus:outline-none focus:border-[#E87D20] transition-all" />
                            </div>

                            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-sm text-center animate-pulse">{error}</div>}

                            <button onClick={generate} disabled={loading}
                                className="w-full py-5 bg-[linear-gradient(to_right,#E87D20,#FF512F)] hover:bg-[linear-gradient(to_right,#FF512F,#E87D20)] text-white shadow-[0_10px_30px_-5px_rgba(232,125,32,0.4)] rounded-2xl font-bold text-lg font-display active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Drafting via Bedrock AI...</>
                                ) : 'Draft Legal Document 📄'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 3: DONE --- */}
                {step === 'done' && result && (
                    <div className="space-y-6 animate-fade-in pt-10">
                        <div className="bg-gradient-to-br from-emerald-600 to-green-800 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden border border-emerald-500/30">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <svg className="mx-auto text-white drop-shadow-md mb-6" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <h2 className="font-black text-3xl font-display leading-tight mb-2 text-white">Ready to File</h2>
                            <p className="font-medium text-emerald-100">Your professional draft is securely formatted as PDF.</p>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 mt-8 inline-block border border-white/20">
                                <p className="text-[10px] uppercase font-black tracking-widest text-green-100/60 mb-1">Secure Tracking Ref</p>
                                <p className="font-mono font-bold text-2xl tracking-widest text-white">{result.tracking_number}</p>
                            </div>
                        </div>

                        <a href={result.pdf_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-5 bg-[#0D1220] text-white border-2 border-[#1E293B] hover:border-[#E87D20] rounded-[1.5rem] font-bold text-lg transition-all group">
                            <svg className="group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            Review & Download PDF
                        </a>

                        <button onClick={() => { setStep('type'); setResult(null); }}
                            className="w-full text-[13px] font-bold text-[#8B95A5] hover:text-white uppercase tracking-widest mt-4 transition-colors">
                            Create Another Document
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
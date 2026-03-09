import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import type { DashboardData } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

/* DATA & ICONS */
const ACTIONS = [
    { key: 'ask_question', icon: '\u{1F4AC}', route: '/chat', theme: 'from-blue-500 to-indigo-600', bg: 'bg-[#0D1220]' },
    { key: 'build_timeline', icon: '\u23F3', route: '/timeline', theme: 'from-emerald-400 to-green-600', bg: 'bg-[#0D1220]' },
    { key: 'generate_complaint', icon: '\u{1F4DD}', route: '/complaint-generator', theme: 'from-orange-400 to-amber-600', bg: 'bg-[#0D1220]' },
    { key: 'scan_notice', icon: '\u{1F4C4}', route: '/notice-scanner', theme: 'from-purple-500 to-fuchsia-600', bg: 'bg-[#0D1220]' },
];

const ISSUE_ICONS: Record<string, { emoji: string, color: string }> = {
    property: { emoji: '\u{1F3E0}', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    family: { emoji: '\u{1F469}\u200D\u{1F467}\u200D\u{1F466}', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    consumer: { emoji: '\u{1F6D2}', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    criminal: { emoji: '\u2696\uFE0F', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    labor: { emoji: '\u{1F4BC}', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    cyber: { emoji: '\u{1F4BB}', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
};

/* CONSTELLATION PARTICLES (Background Animation) */
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

                p.vx *= 0.99;
                p.vy *= 0.99;

                if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.1;
                if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * 0.1;

                p.x += p.vx;
                p.y += p.vy;

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

/* MAIN DASHBOARD COMPONENT */
export default function DashboardPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Add 1s artificial delay to show sleek loading state
        const timer = setTimeout(() => {
            axios.get(`${API}/v1/dashboard/widgets?state=MH&district=MUMBAI`)
                .then(r => setData(r.data))
                .catch(() => { })
                .finally(() => setLoading(false));
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-[#E87D20]/30 selection:text-white flex flex-col">

            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#E87D20]/20 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-slow pointer-events-none z-0"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#121827] rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-pulse-slow pointer-events-none z-0" style={{ animationDelay: '3s' }}></div>

            {/* MAIN DASHBOARD CONTENT */}
            <main className="flex-1 relative z-10 px-4 py-8 sm:py-12 max-w-5xl mx-auto w-full space-y-10 animate-fade-in">

                {/* Hero Greeting Section */}
                <section className="relative overflow-hidden bg-[#0D1220] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[2.5rem] p-8 sm:p-12">
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#E87D20]/10 rounded-full mix-blend-screen blur-[80px] pointer-events-none"></div>
                    <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full mix-blend-screen blur-[80px] pointer-events-none"></div>

                    <div className="relative z-10">
                        <h2 className="text-sm font-bold tracking-widest text-[#E87D20] uppercase mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                            {t('dashboard.engine_badge')}
                        </h2>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-display leading-tight mb-4">
                            {t('dashboard.title')}
                        </h1>
                        <p className="text-[#8B95A5] font-medium text-lg max-w-xl">
                            {t('dashboard.subtitle')}
                        </p>
                    </div>
                </section>

                {/* Premium Quick Actions Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                            <span className="w-2 h-6 bg-[#E87D20] rounded-full shadow-[0_0_15px_rgba(232,125,32,0.3)]"></span>
                            {t('dashboard.actions_title')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {ACTIONS.map((a, i) => (
                            <button
                                key={a.key}
                                onClick={() => navigate(a.route)}
                                className="group relative bg-[#0D1220] border border-[#1E293B] hover:border-[#E87D20]/50 rounded-[2rem] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-500 text-left overflow-hidden hover:-translate-y-1.5 block w-full"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                {/* Micro background gradient element */}
                                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${a.theme} opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>

                                <div className={`w-14 h-14 rounded-[1.2rem] bg-gradient-to-br ${a.theme} text-white flex items-center justify-center text-2xl shadow-lg mb-5 transform group-hover:scale-110 transition-transform duration-500`}>
                                    <span className="drop-shadow-md">{a.icon}</span>
                                </div>

                                <span className="font-bold text-[17px] text-white leading-tight font-display group-hover:text-[#E87D20] transition-colors block mt-2">
                                    {t(`dashboard.${a.key}`)}
                                </span>

                                {/* Arrow indicator */}
                                <div className="absolute bottom-5 right-5 text-[#8B95A5] group-hover:text-[#E87D20] transform group-hover:translate-x-1.5 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Popular Issues */}
                <section>
                    <div className="flex items-center mb-6 px-2">
                        <h3 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                            <span className="w-2 h-6 bg-[#E87D20] rounded-full shadow-[0_0_15px_rgba(232,125,32,0.3)]"></span>
                            {t('dashboard.popular_title')}
                        </h3>
                    </div>

                    <div className="bg-[#090C15]/80 backdrop-blur-2xl border border-[#1E293B] rounded-[2rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                        {loading ? (
                            <div className="p-8 space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-5 items-center animate-pulse">
                                        <div className="w-14 h-14 bg-[#121827] border border-[#1E293B] rounded-[1.2rem]"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 bg-[#1E293B] rounded-full w-1/3"></div>
                                            <div className="h-3 bg-[#121827] rounded-full w-1/4"></div>
                                        </div>
                                        <div className="w-20 h-7 bg-[#1E293B] rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-[#1E293B]/50">
                                {data?.popular_issues?.map(issue => {
                                    const style = ISSUE_ICONS[issue.issue_type] || ISSUE_ICONS.criminal;
                                    return (
                                        <button
                                            key={issue.issue_type}
                                            onClick={() => navigate(`/chat?topic=${issue.issue_type}`)}
                                            className="w-full flex items-center gap-5 px-8 py-6 hover:bg-[#121827] transition-colors text-left group"
                                        >
                                            <div className={`w-14 h-14 border rounded-[1.2rem] flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform duration-300 ${style.color}`}>
                                                <span className="relative z-10">{style.emoji}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white text-[17px] font-display group-hover:text-[#E87D20] transition-colors">{issue.display_name}</div>
                                                <div className="text-sm font-medium text-[#8B95A5] mt-1 tracking-wide">{issue.count} {t('dashboard.cases_verified')}</div>
                                            </div>
                                            <span className={`text-[12px] px-4 py-1.5 rounded-full font-bold shadow-sm uppercase tracking-wider
                                                ${issue.trend === 'up' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                                    issue.trend === 'down' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#121827] text-[#8B95A5] border border-[#1E293B]'}`}>
                                                {issue.trend === 'up' ? t('dashboard.trend_up') : issue.trend === 'down' ? t('dashboard.trend_down') : t('dashboard.trend_stable')}
                                            </span>
                                        </button>
                                    )
                                })}

                                {(!data?.popular_issues || data.popular_issues.length === 0) && (
                                    <div className="p-12 text-center text-[#8B95A5] font-medium flex flex-col items-center">
                                        <span className="text-5xl mb-4 grayscale opacity-30">{'\u2696\uFE0F'}</span>
                                        {t('dashboard.live_data_loading')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Floating Call to Action for Find Legal Aid */}
                <section className="relative overflow-hidden group rounded-[2.5rem] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] mt-8">
                    <div className="absolute inset-0 bg-[#0D1220] rounded-[2.5rem] z-0"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E87D20]/20 to-purple-600/20 rounded-[2.5rem] z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#E87D20]/10 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10 p-10 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="text-left">
                            <h3 className="text-3xl font-black text-white font-display leading-tight mb-3">{t('dashboard.legal_aid_cta_title')}</h3>
                            <p className="text-[#8B95A5] font-medium text-lg">{t('dashboard.legal_aid_cta_desc')}</p>
                        </div>

                        <button onClick={() => navigate('/legal-aid')} className="w-full sm:w-auto px-8 py-4 bg-[linear-gradient(to_right,#E87D20,#FF512F)] hover:bg-[linear-gradient(to_right,#FF512F,#E87D20)] text-white shadow-[0_4px_20px_-2px_rgba(232,125,32,0.5)] rounded-2xl font-bold text-lg font-display hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex items-center justify-center gap-3">
                            {t('dashboard.legal_aid_cta_button')} <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}


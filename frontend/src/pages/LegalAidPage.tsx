import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { LegalAidPartner } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

/* ═══════════════════════════════════════════════════════════
   DATA & CONFIG
   ═══════════════════════════════════════════════════════════ */
const HELPLINES = [
    { name: 'Legal Aid Helpline', number: '15100', emoji: '⚖️' },
    { name: 'Women Helpline', number: '181', emoji: '👩' },
    { name: 'Child Helpline', number: '1098', emoji: '👧' },
    { name: 'Police', number: '100', emoji: '🚔' },
    { name: 'Cyber Crime', number: '1930', emoji: '💻' },
    { name: 'Consumer Helpline', number: '1915', emoji: '🛒' },
];

const STATES = ['MH', 'DL', 'UP', 'KA', 'TN', 'RJ', 'GJ', 'WB', 'MP', 'TG'];

const SPECIALIZATION_ICONS: Record<string, string> = {
    property: '🏠', family: '👩‍👧‍👦', consumer: '🛒',
    criminal: '⚖️', labor: '💼', cyber: '💻'
};

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION PARTICLES (Background Animation)
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
   LEGAL AID PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function LegalAidPage() {
    const { t } = useLanguage();
    const [partners, setPartners] = useState<LegalAidPartner[]>([]);
    const [state, setState] = useState('MH');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API}/v1/legal-aid/referrals?state=${state}`)
            .then(r => setPartners(r.data.partners || []))
            .catch(() => setPartners([]))
            .finally(() => setLoading(false));
    }, [state]);

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans flex flex-col">

            {/* Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#E87D20]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <main className="relative z-10 p-4 max-w-3xl mx-auto pb-24 w-full space-y-8 animate-fade-in">

                {/* Header Section */}
                <div className="pt-6">
                    <h2 className="text-sm font-bold tracking-widest text-[#E87D20] uppercase mb-2 flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-[#E87D20]"></span>
                        {t('legal_aid.title')}
                    </h2>
                    <h1 className="text-3xl font-extrabold text-white mb-2">{t('legal_aid.desc')}</h1>
                </div>

                {/* State Filter */}
                <section className="bg-[#0D1220]/60 backdrop-blur-xl border border-[#1E293B] rounded-3xl p-6 shadow-2xl">
                    <p className="text-xs font-bold text-[#8B95A5] uppercase tracking-widest mb-4">{t('legal_aid.filter_state')}</p>
                    <div className="flex flex-wrap gap-2">
                        {STATES.map(s => (
                            <button
                                key={s}
                                onClick={() => setState(s)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 border
                                    ${state === s
                                        ? 'bg-[#E87D20] text-white border-[#E87D20] shadow-[0_0_15px_rgba(232,125,32,0.4)]'
                                        : 'bg-[#121827] border-[#1E293B] text-[#8B95A5] hover:border-[#E87D20]/50'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Partners List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-[#E87D20] border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-[#8B95A5] font-medium">{t('common.loading')}</p>
                        </div>
                    ) : partners.length === 0 ? (
                        <div className="bg-[#0D1220]/40 border border-[#1E293B] rounded-[2.5rem] p-12 text-center">
                            <div className="text-5xl mb-4 opacity-40">🔍</div>
                            <p className="text-xl font-bold text-white">No partners found for {state}</p>
                            <p className="text-[#8B95A5] mt-2">Try another state or check national helplines below</p>
                        </div>
                    ) : (
                        partners.map(partner => (
                            <div key={partner.partner_id}
                                className="bg-[#0D1220]/80 backdrop-blur-2xl border border-[#1E293B] hover:border-[#E87D20]/30 rounded-[2rem] p-6 shadow-xl transition-all duration-300 group">

                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black tracking-tighter
                                                ${partner.type === 'govt' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                {partner.type === 'govt' ? '🏛 GOVERNMENT' : '🤝 NGO'}
                                            </span>
                                            {partner.free_service && (
                                                <span className="text-[10px] px-2.5 py-1 bg-[#E87D20]/10 text-[#E87D20] border border-[#E87D20]/20 rounded-lg font-black">
                                                    ✓ {t('legal_aid.free')}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-xl text-white group-hover:text-[#E87D20] transition-colors">{partner.organization_name}</h3>
                                        <p className="text-sm text-[#8B95A5] mt-1 flex items-center gap-1">
                                            <span>📍</span> {partner.district}, {partner.state}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[#E87D20] text-lg font-bold">{'★'.repeat(Math.round(partner.rating))}</div>
                                        <div className="text-[10px] font-bold text-[#8B95A5] tracking-widest">{partner.rating} / 5.0</div>
                                    </div>
                                </div>

                                {/* Specializations */}
                                {partner.specializations?.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {partner.specializations.map(s => (
                                                <span key={s} className="text-[11px] px-3 py-1.5 bg-[#121827] text-white border border-[#1E293B] rounded-xl flex items-center gap-1.5 font-medium">
                                                    {SPECIALIZATION_ICONS[s] || '⚖️'} {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Capacity Bar */}
                                {partner.max_capacity > 0 && (
                                    <div className="mb-6 bg-[#050505] p-3 rounded-2xl border border-[#1E293B]/50">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-[#8B95A5] mb-2 uppercase tracking-tight">
                                            <span>Live Case Load</span>
                                            <span className="text-white">{partner.current_case_load} / {partner.max_capacity}</span>
                                        </div>
                                        <div className="bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 
                                                    ${(partner.current_case_load / partner.max_capacity) > 0.8 ? 'bg-red-500' :
                                                        (partner.current_case_load / partner.max_capacity) > 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, (partner.current_case_load / partner.max_capacity) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {partner.phone && (
                                        <a href={`tel:${partner.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-black rounded-2xl text-sm font-black hover:bg-[#E87D20] hover:text-white transition-all active:scale-95 shadow-lg">
                                            📞 CALL NOW
                                        </a>
                                    )}
                                    {partner.email && (
                                        <a href={`mailto:${partner.email}`}
                                            className="px-5 py-3.5 bg-[#121827] border border-[#1E293B] text-white rounded-2xl hover:border-[#E87D20]/50 transition-colors active:scale-95">
                                            ✉️
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* National Helplines */}
                <section>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <span className="w-2 h-6 bg-[#E87D20] rounded-full"></span>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                            {t('legal_aid.national_helplines')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {HELPLINES.map(h => (
                            <a key={h.number} href={`tel:${h.number}`}
                                className="group flex items-center gap-4 bg-[#0D1220]/60 backdrop-blur-md border border-[#1E293B] p-4 rounded-2xl hover:border-[#E87D20]/50 hover:bg-[#121827] transition-all duration-300">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{h.emoji}</span>
                                <div>
                                    <div className="text-[10px] font-bold text-[#8B95A5] uppercase tracking-tighter">{h.name}</div>
                                    <div className="font-black text-[#E87D20] text-lg">{h.number}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
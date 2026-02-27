import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect, useRef } from 'react';

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = performance.now();
                const step = (now: number) => {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.floor(eased * target));
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }
        }, { threshold: 0.3 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
}

const FEATURES = [
    {
        icon: '💬', gradient: 'from-blue-500 to-indigo-600',
        titleKey: 'landing.feat_chat', descKey: 'landing.feat_chat_desc',
    },
    {
        icon: '📋', gradient: 'from-emerald-500 to-teal-600',
        titleKey: 'landing.feat_timeline', descKey: 'landing.feat_timeline_desc',
    },
    {
        icon: '📄', gradient: 'from-orange-500 to-pink-600',
        titleKey: 'landing.feat_complaint', descKey: 'landing.feat_complaint_desc',
    },
    {
        icon: '📜', gradient: 'from-violet-500 to-purple-600',
        titleKey: 'landing.feat_notice', descKey: 'landing.feat_notice_desc',
    },
    {
        icon: '🗺️', gradient: 'from-cyan-500 to-blue-600',
        titleKey: 'landing.feat_legal_aid', descKey: 'landing.feat_legal_aid_desc',
    },
    {
        icon: '🌐', gradient: 'from-amber-500 to-orange-600',
        titleKey: 'landing.feat_multilingual', descKey: 'landing.feat_multilingual_desc',
    },
];

const STEPS = [
    { num: '01', titleKey: 'landing.step1_title', descKey: 'landing.step1_desc', icon: '🗣️', color: 'from-brand-500 to-indigo-500' },
    { num: '02', titleKey: 'landing.step2_title', descKey: 'landing.step2_desc', icon: '🤖', color: 'from-indigo-500 to-purple-500' },
    { num: '03', titleKey: 'landing.step3_title', descKey: 'landing.step3_desc', icon: '📝', color: 'from-purple-500 to-pink-500' },
];

const STATS = [
    { value: 6, suffix: '', label: 'AI Tools Built' },
    { value: 2, suffix: '', label: 'Languages Supported' },
    { value: 50, suffix: '+', label: 'Legal Topics Covered' },
    { value: 24, suffix: '/7', label: 'Always Available' },
];

const POWERED_BY = [
    { icon: '🤖', name: 'Amazon Bedrock', desc: 'AI-powered legal analysis' },
    { icon: '🗣️', name: 'Amazon Polly', desc: 'Voice interaction in Hindi & English' },
    { icon: '🔍', name: 'Amazon Comprehend', desc: 'Legal document understanding' },
    { icon: '🔒', name: 'End-to-End Encrypted', desc: 'Your data stays private' },
];

/* ─── StatCard — each one uses its own hook instance ─── */
function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
    const { count, ref } = useCountUp(value);
    return (
        <div ref={ref} className="glass-panel p-5 rounded-2xl text-center group hover:shadow-glass transition-all duration-300 hover:scale-[1.03]">
            <div className="text-3xl sm:text-4xl font-extrabold font-display text-gradient">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-sm font-semibold text-slate-500 mt-1">{label}</div>
        </div>
    );
}

export default function LandingPage() {
    const { t, toggleLang, language } = useLanguage();

    return (
        <div className="min-h-screen bg-surface-50 overflow-hidden relative">

            {/* ═══ Animated background blobs ═══ */}
            <div className="absolute top-[-25%] left-[-15%] w-[600px] h-[600px] bg-gradient-to-br from-brand-200/50 to-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-80 animate-blob"></div>
            <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-gradient-to-br from-purple-200/50 to-pink-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[-15%] left-[30%] w-[700px] h-[700px] bg-gradient-to-br from-indigo-100/50 to-cyan-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" style={{ animationDelay: '4s' }}></div>

            {/* ═══ Header ═══ */}
            <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-[0.9rem] flex items-center justify-center text-lg shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-transform hover:scale-110 hover:rotate-3 duration-300">
                        <span className="drop-shadow-sm">⚖️</span>
                    </div>
                    <span className="text-xl font-bold font-display text-slate-800 tracking-tight">{t('app_name')}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleLang}
                        className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white transition-all ring-1 ring-black/5 hover:scale-105"
                    >
                        {language === 'en' ? 'हिंदी' : 'English'}
                    </button>
                    <Link
                        to="/login"
                        className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)] transition-all hover:scale-105 active:scale-95"
                    >
                        {t('landing.get_started')}
                    </Link>
                </div>
            </header>

            {/* ═══ Hero Section ═══ */}
            <section className="relative z-10 text-center px-6 pt-16 pb-10 sm:pt-24 sm:pb-14 max-w-3xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 text-green-700 text-sm font-semibold mb-8 animate-fade-in shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {t('landing.badge')}
                </div>

                {/* Title with gradient */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display text-slate-900 leading-[1.1] tracking-tight animate-slide-up">
                    {t('landing.hero_title_1')}
                    <span className="block mt-2 bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        {t('landing.hero_title_2')}
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-500 mt-6 max-w-xl mx-auto leading-relaxed animate-fade-in font-medium">
                    {t('landing.hero_subtitle')}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-fade-in">
                    <Link
                        to="/login"
                        className="group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] hover:shadow-[0_16px_32px_-6px_rgba(37,99,235,0.7)] transition-all hover:scale-[1.04] active:scale-[0.98] duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] group-hover:bg-[position:right_center] transition-all duration-700"></div>
                        <span className="relative flex items-center justify-center gap-2">
                            {t('landing.cta_start')}
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </span>
                    </Link>
                    <Link
                        to="/login?guest=true"
                        className="group px-8 py-4 rounded-2xl font-bold text-lg text-slate-700 bg-white/70 backdrop-blur-sm border-2 border-white/50 shadow-glass-sm hover:bg-white hover:shadow-glass hover:border-brand-200 transition-all ring-1 ring-black/5 hover:scale-[1.03] active:scale-[0.98]"
                    >
                        <span className="flex items-center justify-center gap-2">
                            {t('landing.cta_guest')}
                            <span className="text-brand-500 group-hover:translate-x-0.5 transition-transform">→</span>
                        </span>
                    </Link>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-400 font-medium animate-fade-in">
                    <span className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm ring-1 ring-black/5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        {t('landing.trust_encrypted')}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm ring-1 ring-black/5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        {t('landing.trust_anonymous')}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm ring-1 ring-black/5">🇮🇳 {t('landing.trust_indian')}</span>
                </div>
            </section>

            {/* ═══ Animated Stats ═══ */}
            <section className="relative z-10 px-6 py-12 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {STATS.map((stat, i) => (
                        <StatCard key={i} value={stat.value} suffix={stat.suffix} label={stat.label} />
                    ))}
                </div>
            </section>

            {/* ═══ Features Grid ═══ */}
            <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold tracking-widest uppercase mb-4">Features</span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-800">
                        {t('landing.features_title')}
                    </h2>
                    <p className="text-slate-500 mt-3 max-w-lg mx-auto">
                        {t('landing.features_subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                        <div
                            key={i}
                            className="group relative glass-panel p-7 rounded-[1.8rem] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 cursor-default overflow-hidden"
                        >
                            {/* Subtle gradient overlay on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-[1.8rem]`}></div>

                            <div className={`relative w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                <span className="drop-shadow-sm">{f.icon}</span>
                            </div>
                            <h3 className="relative text-lg font-bold font-display text-slate-800 mb-2">{t(f.titleKey)}</h3>
                            <p className="relative text-sm text-slate-500 leading-relaxed">{t(f.descKey)}</p>

                            {/* Arrow on hover */}
                            <div className="relative mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                <span className="text-brand-500 text-sm font-bold flex items-center gap-1">
                                    Learn more <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ How It Works ═══ */}
            <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
                <div className="text-center mb-14">
                    <span className="inline-block px-4 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-4">Simple Process</span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-800">
                        {t('landing.how_title')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden sm:block absolute top-[3.5rem] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-brand-200 via-indigo-200 to-purple-200"></div>

                    {STEPS.map((s, i) => (
                        <div key={i} className="text-center relative group">
                            <div className={`w-[4.5rem] h-[4.5rem] mx-auto bg-gradient-to-tr ${s.color} rounded-[1.2rem] flex items-center justify-center text-3xl text-white shadow-[0_8px_24px_-6px_rgba(99,102,241,0.4)] mb-5 animate-float group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                                style={{ animationDelay: `${i * 0.7}s` }}>
                                {s.icon}
                            </div>
                            <div className="text-[11px] font-bold text-brand-500 tracking-[0.2em] mb-2">STEP {s.num}</div>
                            <h3 className="text-lg font-bold font-display text-slate-800 mb-2">{t(s.titleKey)}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{t(s.descKey)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Powered By ═══ */}
            <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <span className="inline-block px-4 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold tracking-widest uppercase mb-4">Technology</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-800">
                        Powered by Trusted Technology
                    </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {POWERED_BY.map((tech, i) => (
                        <div key={i} className="glass-panel p-5 rounded-2xl text-center group hover:shadow-glass transition-all duration-300 hover:scale-[1.03]">
                            <div className="text-3xl mb-3">{tech.icon}</div>
                            <div className="text-sm font-bold text-slate-800">{tech.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{tech.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Footer CTA ═══ */}
            <section className="relative z-10 px-6 py-16 text-center">
                <div className="relative max-w-2xl mx-auto overflow-hidden rounded-[2.5rem]">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700"></div>
                    {/* Decorative circles */}
                    <div className="absolute top-[-40%] right-[-20%] w-[300px] h-[300px] bg-white/10 rounded-full"></div>
                    <div className="absolute bottom-[-30%] left-[-10%] w-[200px] h-[200px] bg-white/5 rounded-full"></div>

                    <div className="relative p-10 sm:p-14">
                        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white mb-4">
                            {t('landing.footer_title')}
                        </h2>
                        <p className="text-blue-100 mb-8 max-w-md mx-auto">{t('landing.footer_desc')}</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-brand-700 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.04] active:scale-[0.98]"
                        >
                            {t('landing.cta_start')}
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400">
                    <p>&copy; 2026 Nyaya Mitra &mdash; AI for Bharat</p>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                        <span>Built with</span>
                        <span className="text-red-400">❤️</span>
                        <span>for India</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

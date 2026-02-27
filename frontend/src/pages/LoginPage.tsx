import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const LEGAL_TOPICS = [
    { icon: '💰', label: 'Salary Issues' },
    { icon: '🏠', label: 'Property' },
    { icon: '👨‍👩‍👧', label: 'Family' },
    { icon: '🛒', label: 'Consumer' },
    { icon: '💻', label: 'Cyber Crime' },
    { icon: '📋', label: 'RTI' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, language, setLang } = useLanguage();
    const { setSession } = useSession();

    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (searchParams.get('guest') === 'true') handleGuestStart();
    }, []);

    const handleGuestStart = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await axios.post(`${API}/v1/entry/session`, {
                language_code: language,
                mode_selection: 'chat',
                anonymous_mode: true,
            });
            setSession(data);
            navigate('/dashboard');
        } catch {
            setSession({
                session_id: `guest_${Date.now()}`,
                user_id: `guest_${Date.now().toString(36)}`,
                language: language,
                anonymous_mode: true,
                stealth_mode: false,
                queries_count: 0,
                query_limit_remaining: 5,
            });
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            setSession({
                session_id: `user_${Date.now()}`,
                user_id: email,
                language: language,
                anonymous_mode: false,
                stealth_mode: false,
                queries_count: 0,
                query_limit_remaining: 999,
            });
            navigate('/dashboard');
        } catch {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-50 flex relative overflow-hidden">

            {/* ═══ Background blobs ═══ */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-brand-200/40 to-indigo-200/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-purple-200/40 to-pink-200/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob" style={{ animationDelay: '3s' }}></div>

            {/* ═══ Left Panel — Info (hidden on mobile) ═══ */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-white/5 rounded-full"></div>
                <div className="absolute bottom-[-15%] right-[-15%] w-[400px] h-[400px] bg-white/5 rounded-full"></div>
                <div className="absolute top-[40%] right-[-5%] w-[200px] h-[200px] bg-white/[0.03] rounded-full"></div>

                {/* Logo */}
                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-[1rem] flex items-center justify-center text-xl border border-white/20 group-hover:scale-110 transition-transform">
                            <span className="drop-shadow-sm">⚖️</span>
                        </div>
                        <span className="text-2xl font-bold font-display text-white/90">{t('app_name')}</span>
                    </Link>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white leading-tight">
                            Your Rights,<br />
                            <span className="text-blue-200">Made Simple.</span>
                        </h2>
                        <p className="text-blue-100/80 mt-4 text-lg leading-relaxed max-w-sm">
                            AI-powered legal guidance in Hindi and English. Free, anonymous, and available 24/7.
                        </p>
                    </div>

                    {/* Legal topics pills */}
                    <div className="flex flex-wrap gap-2">
                        {LEGAL_TOPICS.map((topic, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80 border border-white/10 font-medium"
                            >
                                {topic.icon} {topic.label}
                            </span>
                        ))}
                    </div>

                    {/* Product highlights */}
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg border border-white/30">
                                🤖
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg border border-white/30">
                                📚
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg border border-white/30">
                                🔒
                            </div>
                        </div>
                        <div>
                            <div className="text-white font-bold">6 AI Tools · 50+ Topics</div>
                            <div className="text-blue-200/70 text-sm">Built for Indian legal system</div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="relative z-10 text-blue-200/50 text-sm">
                    <p>&copy; 2026 Nyaya Mitra &mdash; AI for Bharat Hackathon</p>
                </div>
            </div>

            {/* ═══ Right Panel — Login Form ═══ */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-[420px] animate-slide-up">

                    {/* Logo + Back (mobile) */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block group">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-[1.2rem] shadow-[0_8px_24px_-6px_rgba(37,99,235,0.4)] flex items-center justify-center text-2xl transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                                <span className="drop-shadow-sm">⚖️</span>
                            </div>
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-4 font-display">
                            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">{t('tagline')}</p>
                    </div>

                    {/* Glass Card */}
                    <div className="glass-panel p-7 sm:p-9 rounded-[2rem]">

                        {/* Tabs */}
                        <div className="flex rounded-2xl bg-slate-100/80 p-1 mb-7">
                            {(['login', 'register'] as const).map(t_tab => (
                                <button
                                    key={t_tab}
                                    onClick={() => { setTab(t_tab); setError(''); }}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
                                        ${tab === t_tab
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {t_tab === 'login' ? t('login.login_tab') : t('login.register_tab')}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name (register only) */}
                            {tab === 'register' && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{t('login.name')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder={t('login.name_placeholder')}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5">{t('login.email')}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t('login.email_placeholder')}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5">{t('login.password')}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" x2="23" y1="1" y2="23" /></svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-fade-in flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative group overflow-hidden w-full py-3.5 rounded-2xl font-bold text-base text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.8)] transition-all disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98] mt-1"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] group-hover:bg-[position:right_center] transition-all duration-500"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                            {t('common.loading')}
                                        </>
                                    ) : (
                                        tab === 'login' ? t('login.login_btn') : t('login.register_btn')
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-5">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('login.or')}</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                        </div>

                        {/* Guest */}
                        <button
                            onClick={handleGuestStart}
                            disabled={loading}
                            className="group w-full py-3.5 rounded-2xl font-bold text-sm text-slate-600 bg-white/60 border-2 border-slate-200 hover:border-brand-300 hover:bg-white hover:text-brand-700 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 group-hover:text-brand-500 transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            {t('login.guest_btn')}
                        </button>

                        {/* Language toggle */}
                        <div className="mt-5 flex items-center justify-center gap-3">
                            {[
                                { code: 'en' as const, flag: '🇬🇧', label: 'English' },
                                { code: 'hi' as const, flag: '🇮🇳', label: 'हिंदी' },
                            ].map(l => (
                                <button
                                    key={l.code}
                                    onClick={() => setLang(l.code)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${language === l.code
                                        ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-300 shadow-sm'
                                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                        }`}
                                >
                                    {l.flag} {l.label}
                                </button>
                            ))}
                        </div>

                        {/* Security */}
                        <div className="mt-5 flex items-center justify-center gap-4 text-[11px] font-medium text-slate-400">
                            <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                Encrypted
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Anonymous
                            </span>
                            <span>•</span>
                            <span>🇮🇳 Made for India</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

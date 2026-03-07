import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import axios from 'axios';
import {
    confirmForgotPassword,
    confirmSignUpCode,
    parseIdTokenClaims,
    saveAuthTokens,
    signInWithPassword,
    signUpWithPassword,
    startForgotPassword,
} from '../auth/cognito';

const API = import.meta.env.VITE_HTTP_API_URL;

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

/* ═══════════════════════════════════════════════════════════
   MAIN LOGIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, language, setLang } = useLanguage();
    const { setSession } = useSession();

    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verificationRequired, setVerificationRequired] = useState(false);
    const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
    const [pendingVerificationUsername, setPendingVerificationUsername] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotStage, setForgotStage] = useState<'request' | 'confirm'>('request');
    const [forgotCode, setForgotCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    useEffect(() => {
        if (searchParams.get('guest') === 'true') handleGuestStart();
    }, []);

    const resetRegisterVerification = () => {
        setVerificationRequired(false);
        setPendingVerificationEmail('');
        setPendingVerificationUsername('');
        setConfirmationCode('');
    };

    const resetForgotFlow = () => {
        setForgotMode(false);
        setForgotStage('request');
        setForgotCode('');
        setNewPassword('');
        setConfirmNewPassword('');
    };

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
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const startRegisteredSession = async (userId: string) => {
        const { data } = await axios.post(`${API}/v1/entry/session`, {
            language_code: language,
            mode_selection: 'chat',
            anonymous_mode: false,
            user_id: userId,
        });
        setSession(data);
        navigate('/dashboard');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfo('');

        try {
            const identifier = email.trim().toLowerCase();
            if (!identifier) {
                throw new Error('Please enter your email.');
            }

            if (forgotMode) {
                if (forgotStage === 'request') {
                    const result = await startForgotPassword(identifier);
                    setForgotStage('confirm');
                    setInfo(
                        result.deliveryDestination
                            ? `Password reset code sent to ${result.deliveryDestination}.`
                            : 'Password reset code sent. Check your email.'
                    );
                    return;
                }

                if (!forgotCode.trim()) {
                    throw new Error('Please enter the reset code.');
                }
                if (!newPassword) {
                    throw new Error('Please enter the new password.');
                }
                if (newPassword !== confirmNewPassword) {
                    throw new Error('New password and confirm password do not match.');
                }

                await confirmForgotPassword(identifier, forgotCode.trim(), newPassword);
                resetForgotFlow();
                setPassword('');
                setConfirmPassword('');
                setInfo('Password changed successfully. Please sign in with your new password.');
                return;
            }

            if (!password) {
                throw new Error('Please enter your password.');
            }

            if (tab === 'register') {
                if (verificationRequired) {
                    if (!confirmationCode.trim()) {
                        throw new Error('Please enter the verification code sent to your email.');
                    }
                    const verificationIdentity = pendingVerificationUsername || pendingVerificationEmail || identifier;
                    await confirmSignUpCode(verificationIdentity, confirmationCode.trim());
                    resetRegisterVerification();
                } else {
                    if (!confirmPassword) {
                        throw new Error('Please confirm your password.');
                    }
                    if (password !== confirmPassword) {
                        throw new Error('Password and confirm password do not match.');
                    }

                    const result = await signUpWithPassword({
                        email: identifier,
                        password,
                        name,
                    });

                    if (!result.userConfirmed) {
                        setVerificationRequired(true);
                        setPendingVerificationEmail(identifier);
                        setPendingVerificationUsername(result.username);
                        setInfo(
                            result.deliveryDestination
                                ? `Verification code sent to ${result.deliveryDestination}. Enter it below to continue.`
                                : 'Verification code sent to your email. Enter it below to continue.'
                        );
                        return;
                    }
                }
            }

            const tokens = await signInWithPassword(identifier, password);
            saveAuthTokens(tokens);

            const claims = parseIdTokenClaims(tokens.id_token);
            const claimEmail = typeof claims.email === 'string' ? claims.email : '';
            const claimSub = typeof claims.sub === 'string' ? claims.sub : '';
            const userId = claimEmail || claimSub || identifier;

            await startRegisteredSession(userId);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    // ─── DYNAMIC LEFT PANEL DATA BASED ON LANGUAGE ───
    const leftTexts = {
        title1: language === 'en' ? 'Your Rights,' : 'आपके अधिकार,',
        title2: language === 'en' ? 'Made Simple.' : 'अब आसान।',
        desc: language === 'en'
            ? 'AI-powered legal guidance in Hindi and English. Free, anonymous, and available 24/7.'
            : 'हिंदी और अंग्रेजी में AI कानूनी मार्गदर्शन। मुफ़्त, अनाम और 24/7 उपलब्ध।',
        toolsTitle: language === 'en' ? '6 AI Tools · 50+ Topics' : '6 AI टूल्स · 50+ विषय',
        toolsDesc: language === 'en' ? 'Built for Indian legal system' : 'भारतीय कानूनी प्रणाली के लिए निर्मित',
        backToHome: language === 'en' ? 'Back to Home' : 'मुख्य पृष्ठ'
    };

    const LEGAL_TOPICS = [
        { icon: '💰', en: 'Salary Issues', hi: 'वेतन विवाद' },
        { icon: '🏠', en: 'Property', hi: 'प्रॉपर्टी' },
        { icon: '👨‍👩‍👧', en: 'Family', hi: 'पारिवारिक मामले' },
        { icon: '🛒', en: 'Consumer', hi: 'उपभोक्ता' },
        { icon: '💻', en: 'Cyber Crime', hi: 'साइबर अपराध' },
        { icon: '📋', en: 'RTI', hi: 'RTI' },
    ];

    const emailLabel = language === 'en' ? 'Email' : 'ईमेल';
    const emailPlaceholder = 'email@example.com';
    const confirmPasswordLabel = language === 'en' ? 'Confirm Password' : 'पासवर्ड दोबारा डालें';
    const forgotPasswordLabel = language === 'en' ? 'Forgot Password?' : 'पासवर्ड भूल गए?';
    const backToSignInLabel = language === 'en' ? 'Back to Sign In' : 'वापस साइन इन पर जाएं';
    const resetCodeLabel = language === 'en' ? 'Reset Code' : 'रीसेट कोड';
    const sendResetCodeLabel = language === 'en' ? 'Send Reset Code' : 'रीसेट कोड भेजें';
    const resetPasswordLabel = language === 'en' ? 'Reset Password' : 'पासवर्ड रीसेट करें';
    const newPasswordLabel = language === 'en' ? 'New Password' : 'नया पासवर्ड';

    return (
        <div className="min-h-screen bg-[#050505] text-white flex relative overflow-hidden font-sans selection:bg-[#E87D20]/30 selection:text-white">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#E87D20]/20 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-slow pointer-events-none z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#121827] rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-pulse-slow pointer-events-none z-0" style={{ animationDelay: '3s' }}></div>

            {/* ═══ Left Panel — Info (hidden on mobile) ═══ */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-[#090C15]/50 border-r border-[#1E293B] p-12 flex-col justify-between overflow-hidden backdrop-blur-md z-10">

                {/* Logo */}
                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-[#121827] border border-[#1E293B] rounded-xl flex items-center justify-center text-xl group-hover:border-[#E87D20] shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all">
                            <span className="drop-shadow-sm">⚖️</span>
                        </div>
                        <span className="text-2xl font-extrabold font-display tracking-tight text-white">{t('app_name')}</span>
                    </Link>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-8 mt-10">
                    <div className="transition-all duration-300">
                        <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-white leading-tight">
                            {leftTexts.title1}<br />
                            <span className="text-[#E87D20]">{leftTexts.title2}</span>
                        </h2>
                        <p className="text-[#8B95A5] mt-4 text-lg leading-relaxed max-w-sm font-medium">
                            {leftTexts.desc}
                        </p>
                    </div>

                    {/* Legal topics pills */}
                    <div className="flex flex-wrap gap-2 transition-all duration-300">
                        {LEGAL_TOPICS.map((topic, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#121827] backdrop-blur-sm rounded-full text-sm text-[#8B95A5] border border-[#1E293B] font-medium hover:border-[#E87D20] hover:text-white transition-colors cursor-default"
                            >
                                {topic.icon} {language === 'en' ? topic.en : topic.hi}
                            </span>
                        ))}
                    </div>

                    {/* Product highlights */}
                    <div className="flex items-center gap-4 bg-[#0D1220] backdrop-blur-md rounded-2xl p-5 border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-[#121827] rounded-xl flex items-center justify-center text-lg border border-[#1E293B] shadow-inner">🤖</div>
                            <div className="w-10 h-10 bg-[#121827] rounded-xl flex items-center justify-center text-lg border border-[#1E293B] shadow-inner">📚</div>
                            <div className="w-10 h-10 bg-[#121827] rounded-xl flex items-center justify-center text-lg border border-[#1E293B] shadow-inner">🔒</div>
                        </div>
                        <div>
                            <div className="text-white font-bold tracking-wide">{leftTexts.toolsTitle}</div>
                            <div className="text-[#8B95A5] text-sm mt-0.5">{leftTexts.toolsDesc}</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative z-10 text-[#8B95A5]/70 text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#E87D20] rounded-full animate-pulse shadow-[0_0_8px_rgba(232,125,32,0.8)]"></span>
                    <p>&copy; 2026 Nyaya Mitra &mdash; AI for Bharat</p>
                </div>
            </div>

            {/* ═══ Right Panel — Login Form ═══ */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 z-10">

                {/* Back to Home Button */}
                <div className="w-full max-w-[420px] mb-6 flex justify-start">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[#8B95A5] hover:text-white font-bold text-sm transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#121827] border border-[#1E293B] flex items-center justify-center group-hover:border-[#E87D20] group-hover:bg-[#E87D20]/10 transition-all shadow-lg">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </div>
                        <span>{leftTexts.backToHome}</span>
                    </Link>
                </div>

                <div className="w-full max-w-[420px] animate-slide-up">

                    {/* Mobile Logo & Title */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block group lg:hidden mb-4">
                            <div className="mx-auto w-14 h-14 bg-[#121827] border border-[#1E293B] rounded-2xl flex items-center justify-center text-2xl transform group-hover:scale-105 group-hover:border-[#E87D20] shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all duration-300">
                                <span>⚖️</span>
                            </div>
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
                            {forgotMode ? resetPasswordLabel : tab === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-sm text-[#8B95A5] font-medium mt-2">{t('tagline')}</p>
                    </div>

                    {/* Glass Form Card */}
                    <div className="bg-[#090C15]/80 backdrop-blur-2xl border border-[#1E293B] p-7 sm:p-9 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">

                        {/* Tabs */}
                        <div className="flex rounded-2xl bg-[#121827] p-1.5 mb-8 border border-[#1E293B] shadow-inner relative z-10">
                            {(['login', 'register'] as const).map(t_tab => (
                                <button
                                    key={t_tab}
                                    onClick={() => {
                                        setTab(t_tab);
                                        setError('');
                                        setInfo('');
                                        resetRegisterVerification();
                                        resetForgotFlow();
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
                                        ${tab === t_tab
                                            ? 'bg-[#0D1220] text-[#E87D20] border border-[#1E293B] shadow-[0_0_15px_rgba(232,125,32,0.15)]'
                                            : 'text-[#8B95A5] hover:text-white'
                                        }`}
                                >
                                    {t_tab === 'login' ? t('login.login_tab') : t('login.register_tab')}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            {/* Name (register only) */}
                            {tab === 'register' && !verificationRequired && !forgotMode && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{t('login.name')}</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5] group-focus-within:text-[#E87D20] transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder={t('login.name_placeholder')}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{emailLabel}</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5] group-focus-within:text-[#E87D20] transition-colors">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={emailPlaceholder}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            {!forgotMode && (
                                <div>
                                    <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{t('login.password')}</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5] group-focus-within:text-[#E87D20] transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="********"
                                            className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A5] hover:text-white transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" x2="23" y1="1" y2="23" /></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password (register only) */}
                            {tab === 'register' && !verificationRequired && !forgotMode && (
                                <div>
                                    <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{confirmPasswordLabel}</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B95A5] group-focus-within:text-[#E87D20] transition-colors">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="********"
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner tracking-widest"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Register verification */}
                            {tab === 'register' && verificationRequired && !forgotMode && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                                        {language === 'en' ? 'Verification Code' : 'Verification Code'}
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmationCode}
                                        onChange={e => setConfirmationCode(e.target.value)}
                                        placeholder={language === 'en' ? 'Enter OTP from email' : 'Enter OTP from email'}
                                        className="w-full px-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner"
                                    />
                                </div>
                            )}

                            {/* Forgot password fields */}
                            {forgotMode && forgotStage === 'confirm' && (
                                <>
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{resetCodeLabel}</label>
                                        <input
                                            type="text"
                                            value={forgotCode}
                                            onChange={e => setForgotCode(e.target.value)}
                                            placeholder={language === 'en' ? 'Enter reset code' : 'Enter reset code'}
                                            className="w-full px-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{newPasswordLabel}</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="********"
                                            className="w-full px-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner tracking-widest"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">{confirmPasswordLabel}</label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmNewPassword}
                                            onChange={e => setConfirmNewPassword(e.target.value)}
                                            placeholder="********"
                                            className="w-full px-4 py-3.5 rounded-xl border border-[#1E293B] bg-[#121827] focus:ring-1 focus:ring-[#E87D20] focus:border-[#E87D20] outline-none transition-all text-white placeholder:text-[#8B95A5] shadow-inner tracking-widest"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Forgot/Back action */}
                            {tab === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError('');
                                        setInfo('');
                                        if (forgotMode) {
                                            resetForgotFlow();
                                            return;
                                        }
                                        setForgotMode(true);
                                        setForgotStage('request');
                                        setForgotCode('');
                                        setNewPassword('');
                                        setConfirmNewPassword('');
                                        setPassword('');
                                    }}
                                    className="text-sm font-bold text-[#8B95A5] hover:text-[#E87D20] transition-colors"
                                >
                                    {forgotMode ? backToSignInLabel : forgotPasswordLabel}
                                </button>
                            )}

                            {/* Info Message */}
                            {info && (
                                <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium animate-fade-in">
                                    {info}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium animate-fade-in flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-2 rounded-xl font-bold text-base text-white bg-[linear-gradient(to_right,#E87D20,#FF512F)] hover:bg-[linear-gradient(to_right,#FF512F,#E87D20)] shadow-[0_4px_20px_-2px_rgba(232,125,32,0.5)] transition-all disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        {t('common.loading')}
                                    </>
                                ) : forgotMode ? (
                                    forgotStage === 'request' ? sendResetCodeLabel : resetPasswordLabel
                                ) : tab === 'register' && verificationRequired ? (
                                    language === 'en' ? 'Verify & Continue' : 'Verify & Continue'
                                ) : tab === 'login' ? (
                                    t('login.login_btn')
                                ) : (
                                    t('login.register_btn')
                                )}
                            </button>
                        </form>

                        {!forgotMode && (
                            <>
                                {/* Divider */}
                                <div className="flex items-center gap-4 my-6 relative z-10">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1E293B] to-transparent"></div>
                                    <span className="text-xs font-bold text-[#8B95A5] uppercase tracking-widest">{t('login.or')}</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1E293B] to-transparent"></div>
                                </div>

                                {/* Guest Button */}
                                <button
                                    onClick={handleGuestStart}
                                    disabled={loading}
                                    className="relative z-10 group w-full py-3.5 rounded-xl font-bold text-sm text-[#8B95A5] bg-[#121827] border border-[#1E293B] hover:border-[#E87D20] hover:text-[#E87D20] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8B95A5] group-hover:text-[#E87D20] transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    {t('login.guest_btn')}
                                </button>
                            </>
                        )}

                        {/* Language toggle */}
                        <div className="mt-8 flex items-center justify-center gap-3 relative z-10">
                            {[
                                { code: 'en' as const, label: 'English' },
                                { code: 'hi' as const, label: 'हिंदी' },
                            ].map(l => (
                                <button
                                    key={l.code}
                                    onClick={() => setLang(l.code)}
                                    className={`px-6 py-2 rounded-[1.5rem] text-sm font-bold border transition-all duration-300 ${language === l.code
                                        ? 'border-[#E87D20] text-[#E87D20] shadow-[0_0_15px_rgba(232,125,32,0.15)] bg-[#E87D20]/10'
                                        : 'border-transparent text-[#8B95A5] hover:text-white hover:bg-[#121827]'
                                        }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>

                        {/* Security Icons */}
                        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-bold text-[#8B95A5] uppercase tracking-wider relative z-10">
                            <span className="flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                Encrypted
                            </span>
                            <span className="text-[#1E293B]">•</span>
                            <span className="flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Anonymous
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
}

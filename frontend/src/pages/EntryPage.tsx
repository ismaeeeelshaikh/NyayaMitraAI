import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useStealth } from '../context/StealthContext';
import StealthCalculator from '../components/shared/StealthCalculator';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

export default function EntryPage() {
    const navigate = useNavigate();
    const { language, t, setLang } = useLanguage();
    const { setSession } = useSession();
    const { isStealthMode, handleLogoTap } = useStealth();

    const [step, setStep] = useState<'language' | 'mode'>('language');
    const [mode, setMode] = useState<'chat' | 'voice'>('chat');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (isStealthMode) return <StealthCalculator />;

    const handleGuestStart = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await axios.post(`${API}/v1/entry/session`, {
                language_code: language,
                mode_selection: mode,
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

    return (
        <div className="relative min-h-screen overflow-hidden bg-surface-50 flex flex-col items-center justify-center p-6 sm:p-10 font-sans">

            {/* Dynamic Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-200/50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-200/50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ animationDelay: '4s' }}></div>

            {/* Floating Logo */}
            <div className="relative z-10 w-full max-w-[420px] animate-slide-up">
                <button onClick={handleLogoTap} className="w-full mb-12 text-center select-none group focus:outline-none" aria-label="Logo">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-[2rem] shadow-glass-lg flex items-center justify-center text-4xl transform transition-transform group-hover:scale-105 group-hover:rotate-3 duration-300">
                        <span className="drop-shadow-sm">⚖️</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight mt-6 font-display">
                        {t('app_name')}
                    </h1>
                    <p className="text-base text-slate-500 font-medium mt-2 tracking-wide">{t('tagline')}</p>
                </button>

                <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] relative z-20 transition-all duration-500">

                    {/* STEP 1: Language */}
                    {step === 'language' && (
                        <div className="animate-fade-in space-y-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center font-display mb-8">
                                {t('entry.select_language')}
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { code: 'en' as const, flag: '🇬🇧', name: 'English', sub: 'Continue in English' },
                                    { code: 'hi' as const, flag: '🇮🇳', name: 'हिंदी', sub: 'हिंदी में जारी रखें' },
                                ].map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLang(l.code); setStep('mode'); }}
                                        className={`relative p-6 rounded-[2rem] border-2 text-center transition-all duration-300
                      ${language === l.code
                                                ? 'border-brand-500 bg-brand-50/50 shadow-glass-sm scale-105'
                                                : 'border-white/50 bg-white/40 ring-1 ring-black/5 hover:bg-white hover:border-brand-300 hover:scale-[1.03] hover:shadow-sm'}`}
                                    >
                                        <div className="text-4xl mb-3 drop-shadow-sm">{l.flag}</div>
                                        <div className={`text-[17px] font-bold ${language === l.code ? 'text-brand-700 font-display' : 'text-slate-800'}`}>
                                            {l.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{l.sub}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Mode */}
                    {step === 'mode' && (
                        <div className="animate-fade-in space-y-7">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setStep('language')} className="w-10 h-10 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-slate-600 transition-colors shadow-sm ring-1 ring-black/5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                </button>
                                <h2 className="text-xl font-bold text-slate-800 font-display">{t('entry.choose_mode')}</h2>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 'chat' as const, icon: '💬', nameKey: 'entry.chat_mode', descKey: 'entry.chat_desc' },
                                    { id: 'voice' as const, icon: '🎙️', nameKey: 'entry.voice_mode', descKey: 'entry.voice_desc' },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`w-full p-5 rounded-[1.5rem] border-2 text-left flex items-center gap-5 transition-all duration-300
                      ${mode === m.id
                                                ? 'border-brand-500 bg-white shadow-glass-sm scale-[1.02]'
                                                : 'border-white/50 bg-white/40 ring-1 ring-black/5 hover:bg-white hover:border-brand-200'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm
                                    ${mode === m.id ? 'bg-brand-50' : 'bg-surface-100/80'}`}>
                                            {m.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`text-lg font-bold font-display ${mode === m.id ? 'text-brand-900' : 'text-slate-800'}`}>
                                                {t(m.nameKey)}
                                            </div>
                                            <div className="text-sm font-medium text-slate-500 mt-0.5">{t(m.descKey)}</div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                   ${mode === m.id ? 'border-brand-500 bg-brand-500' : 'border-slate-300 bg-transparent'}`}>
                                            <svg className={`w-3.5 h-3.5 text-white transform transition-transform ${mode === m.id ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2 animate-fade-in shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleGuestStart}
                                    disabled={loading}
                                    className="relative group overflow-hidden w-full py-4.5 rounded-[1.5rem] font-bold text-lg text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.8)] transition-all duration-300 disabled:opacity-70 disabled:scale-100 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 bg-[length:200%_auto] group-hover:animate-[none] group-hover:bg-[position:100%_center] transition-all duration-500"></div>
                                    <div className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                {t('entry.guest_note')} <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                            </>
                                        )}
                                    </div>
                                </button>
                                <div className="mt-5 flex items-center justify-center gap-2 text-[13px] font-medium text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    Verified secure & encrypted
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

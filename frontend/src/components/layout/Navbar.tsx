import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useStealth } from '../../context/StealthContext';
import { useState } from 'react';
import { clearStoredSession, useSession } from '../../context/SessionContext';
import { clearAuthTokens } from '../../auth/cognito';

const NAV_LINKS = [
    { path: '/dashboard', label: 'nav.dashboard', icon: '🏠' },
    { path: '/chat', label: 'nav.chat', icon: '💬' },
    { path: '/timeline', label: 'nav.timeline', icon: '📋' },
    { path: '/complaint-generator', label: 'nav.complaint', icon: '📄' },
    { path: '/notice-scanner', label: 'nav.notice', icon: '📜' },
    { path: '/legal-aid', label: 'nav.legal_aid', icon: '🗺️' },
];

export default function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t, toggleLang, language } = useLanguage();
    const { handleLogoTap } = useStealth();
    const { setSession } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        clearStoredSession();
        clearAuthTokens();

        setSession(null);
        navigate('/login', { replace: true });
    };

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090C15]/90 border-b border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-[72px]">

                    {/* Logo */}
                    <button onClick={handleLogoTap} className="flex items-center gap-3 group select-none">
                        <div className="w-10 h-10 bg-[#121827] border border-[#1E293B] rounded-xl flex items-center justify-center text-lg shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:scale-110 group-hover:border-[#E87D20] transition-all duration-300">
                            <span className="drop-shadow-sm">⚖️</span>
                        </div>
                        <span className="text-xl font-extrabold font-display tracking-tight text-white hidden sm:inline">{t('app_name')}</span>
                    </button>

                    {/* Desktop Nav Links */}
                    <nav className="hidden lg:flex items-center gap-6">
                        {NAV_LINKS.map(link => {
                            const active = pathname === link.path;
                            return (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className={`text-sm font-semibold tracking-wide transition-all duration-200 flex items-center gap-2
                                        ${active
                                            ? 'text-[#E87D20]'
                                            : 'text-[#8B95A5] hover:text-white'
                                        }`}
                                >
                                    <span className="text-base">{link.icon}</span>
                                    <span>{t(link.label)}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right side: Language + Logout */}
                    <div className="flex items-center gap-4">
                        {/* Language Toggle */}
                        <div className="hidden sm:flex items-center gap-2 bg-[#121827]/50 p-1 rounded-full border border-[#1E293B]">
                            <button
                                onClick={toggleLang}
                                className={`px-4 py-1.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${language === 'en' ? 'bg-[#E87D20]/10 text-[#E87D20] border border-[#E87D20]/50 shadow-[0_0_15px_rgba(232,125,32,0.15)]' : 'border border-transparent text-[#8B95A5] hover:text-white'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={toggleLang}
                                className={`px-4 py-1.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${language === 'hi' ? 'bg-[#E87D20]/10 text-[#E87D20] border border-[#E87D20]/50 shadow-[0_0_15px_rgba(232,125,32,0.15)]' : 'border border-transparent text-[#8B95A5] hover:text-white'}`}
                            >
                                हिंदी
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-5 py-2 rounded-full text-white font-bold text-sm bg-[#121827] border border-[#1E293B] hover:border-[#E87D20] hover:text-[#E87D20] shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all hover:scale-105 active:scale-95 hidden sm:flex"
                        >
                            {t('nav.logout')}
                        </button>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden w-10 h-10 rounded-xl bg-[#121827] border border-[#1E293B] flex items-center justify-center text-[#8B95A5] hover:text-white transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav Dropdown */}
                {mobileMenuOpen && (
                    <div className="lg:hidden pb-4 pt-2 border-t border-[#1E293B] animate-slide-up">
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {NAV_LINKS.map(link => {
                                const active = pathname === link.path;
                                return (
                                    <button
                                        key={link.path}
                                        onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all border
                                            ${active
                                                ? 'bg-[#E87D20]/10 text-[#E87D20] border-[#E87D20]/30 shadow-[0_0_15px_rgba(232,125,32,0.15)]'
                                                : 'text-[#8B95A5] hover:text-white hover:bg-[#121827] border-transparent'
                                            }`}
                                    >
                                        <span className="text-xl">{link.icon}</span>
                                        {t(link.label)}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-4 px-2">
                            <button onClick={toggleLang} className="text-[#8B95A5] hover:text-white text-sm font-bold bg-[#121827] px-4 py-2 rounded-lg border border-[#1E293B]">
                                {language === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
                            </button>
                            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                                {t('nav.logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

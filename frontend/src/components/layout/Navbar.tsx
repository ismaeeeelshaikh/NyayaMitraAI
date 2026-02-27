import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useStealth } from '../../context/StealthContext';
import { useState } from 'react';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <button onClick={handleLogoTap} className="flex items-center gap-2.5 group select-none">
                        <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center text-sm shadow-[0_2px_8px_rgba(37,99,235,0.25)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <span className="drop-shadow-sm">⚖️</span>
                        </div>
                        <span className="text-lg font-bold font-display text-slate-800 tracking-tight hidden sm:inline">{t('app_name')}</span>
                    </button>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(link => {
                            const active = pathname === link.path;
                            return (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                                        ${active
                                            ? 'bg-brand-50 text-brand-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="text-base">{link.icon}</span>
                                    <span className="hidden lg:inline">{t(link.label)}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right side: Language + Logout */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleLang}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all ring-1 ring-black/5"
                        >
                            {language === 'en' ? 'हिंदी' : 'EN'}
                        </button>

                        <Link
                            to="/"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                            {t('nav.logout')}
                        </Link>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 pt-2 border-t border-slate-100 animate-slide-up">
                        <div className="grid grid-cols-3 gap-2">
                            {NAV_LINKS.map(link => {
                                const active = pathname === link.path;
                                return (
                                    <button
                                        key={link.path}
                                        onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-semibold transition-all
                                            ${active
                                                ? 'bg-brand-50 text-brand-700'
                                                : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="text-xl">{link.icon}</span>
                                        {t(link.label)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

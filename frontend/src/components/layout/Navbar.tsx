import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useStealth } from '../../context/StealthContext';

const TABS = [
    { path: '/dashboard', icon: 'Home', svg: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></> },
    { path: '/chat', icon: 'Chat', svg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
    { path: '/timeline', icon: 'Docs', svg: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></> },
    { path: '/complaint-generator', icon: 'File', svg: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></> },
    { path: '/legal-aid', icon: 'Help', svg: <><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></> },
];

export default function Navbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { toggleLang, language } = useLanguage();
    const { handleLogoTap } = useStealth();

    return (
        <>
            {/* Sleek Floating Dock Navigation (iOS Style) */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-[400px]">
                <div className="glass-panel p-2 rounded-full flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/60">

                    <button onClick={handleLogoTap} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0 transition-transform active:scale-90 relative overflow-hidden group ml-1">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative drop-shadow-sm group-hover:scale-110 transition-transform">⚖️</span>
                    </button>

                    <div className="flex-1 flex justify-evenly items-center px-1">
                        {TABS.map(tab => {
                            const active = pathname === tab.path || (tab.path === '/chat' && pathname.includes('chat'));
                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => navigate(tab.path)}
                                    className="group relative flex flex-col items-center justify-center w-12 h-12"
                                >
                                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${active ? 'bg-brand-500 scale-100' : 'bg-transparent scale-50 opacity-0 group-hover:bg-slate-100 group-hover:scale-100 group-hover:opacity-100'}`}></div>
                                    <svg
                                        className={`relative w-[22px] h-[22px] transition-all duration-300 ${active ? 'text-white' : 'text-slate-400'}`}
                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    >
                                        {tab.svg}
                                    </svg>
                                    {/* Micro indicator */}
                                    {active && <div className="absolute -bottom-1.5 w-1 h-1 bg-brand-500 rounded-full"></div>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Subtle lang toggle on the right */}
                    <button
                        onClick={toggleLang}
                        className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0 font-bold text-sm tracking-wide text-slate-600 transition-all hover:bg-slate-100 active:scale-90 mr-1 ring-1 ring-black/5"
                    >
                        {language === 'en' ? 'हिं' : 'EN'}
                    </button>

                </div>
            </nav>
        </>
    );
}

import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/60 mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                    {/* Left: Branding */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-lg flex items-center justify-center text-xs">
                            <span>⚖️</span>
                        </div>
                        <span className="text-sm font-bold text-slate-600">{t('app_name')}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{t('tagline')}</span>
                    </div>

                    {/* Center: Quick Links */}
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <Link to="/dashboard" className="hover:text-brand-600 transition-colors">{t('nav.dashboard')}</Link>
                        <span className="text-slate-200">|</span>
                        <Link to="/chat" className="hover:text-brand-600 transition-colors">{t('nav.chat')}</Link>
                        <span className="text-slate-200">|</span>
                        <Link to="/legal-aid" className="hover:text-brand-600 transition-colors">{t('nav.legal_aid')}</Link>
                    </div>

                    {/* Right: Copyright */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>&copy; 2026 Nyaya Mitra</span>
                        <span className="text-slate-200">•</span>
                        <span className="flex items-center gap-1">
                            Built with <span className="text-red-400">❤️</span> for India
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

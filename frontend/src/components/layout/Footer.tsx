import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-[#090C15]/90 backdrop-blur-md border-t border-[#1E293B] mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                    {/* Left: Branding */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#121827] border border-[#1E293B] rounded-lg flex items-center justify-center text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                            <span>⚖️</span>
                        </div>
                        <span className="text-sm font-bold text-white">{t('app_name')}</span>
                        <span className="text-[#1E293B] mx-1">•</span>
                        <span className="text-xs font-medium text-[#8B95A5]">{t('tagline')}</span>
                    </div>

                    {/* Center: Quick Links */}
                    <div className="flex items-center gap-4 text-xs font-medium text-[#8B95A5]">
                        <Link to="/dashboard" className="hover:text-[#E87D20] transition-colors">{t('nav.dashboard')}</Link>
                        <span className="text-[#1E293B]">|</span>
                        <Link to="/chat" className="hover:text-[#E87D20] transition-colors">{t('nav.chat')}</Link>
                        <span className="text-[#1E293B]">|</span>
                        <Link to="/legal-aid" className="hover:text-[#E87D20] transition-colors">{t('nav.legal_aid')}</Link>
                    </div>

                    {/* Right: Copyright */}
                    <div className="flex items-center gap-2 text-xs font-medium text-[#8B95A5]">
                        <span>&copy; 2026 Nyaya Mitra</span>
                        <span className="text-[#1E293B] mx-1">•</span>
                        <span className="flex items-center gap-1">
                            Built with <span className="text-red-500 animate-pulse text-sm leading-none">♥</span> for India
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
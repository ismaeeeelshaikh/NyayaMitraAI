import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSession } from '../../context/SessionContext';

export default function GuestLimitBanner() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { isGuest, queriesLeft } = useSession();
    if (!isGuest) return null;

    if (queriesLeft <= 0) return (
        <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
            <p className="flex-1 text-red-700 text-sm font-medium">{t('chat.guest_limit_reached')}</p>
            <button onClick={() => navigate('/entry')}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-xl font-bold">
                {t('chat.register_now')}
            </button>
        </div>
    );

    if (queriesLeft <= 3) return (
        <div className="mx-4 mb-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-2">
            <span>⚠️</span>
            <p className="text-yellow-800 text-sm">
                <strong>{queriesLeft}</strong> {t('chat.guest_limit')}
            </p>
        </div>
    );

    return null;
}

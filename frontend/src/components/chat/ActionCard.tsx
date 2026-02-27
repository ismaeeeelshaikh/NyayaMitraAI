import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { RecommendedAction } from '../../types';

const BORDERS: Record<string, string> = {
    URGENT: 'border-red-400    bg-red-50',
    HIGH: 'border-orange-400 bg-orange-50',
    MEDIUM: 'border-yellow-400 bg-yellow-50',
};

export default function ActionCard({ action }: { action: RecommendedAction }) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <div className={`border-l-4 rounded-r-2xl p-4 mt-2 ${BORDERS[action.priority] || 'border-brand-400 bg-brand-50'}`}>
            <div className="font-bold text-gray-800 text-sm">{action.action_type}</div>
            <div className="text-xs text-gray-500 mt-0.5">⏱ {action.timeline}  ·  {action.cost}</div>
            <p className="text-sm text-gray-600 mt-2">{action.reasoning}</p>
            {action.steps?.length > 0 && (
                <ol className="mt-2 space-y-1">
                    {action.steps.slice(0, 3).map((step, i) => (
                        <li key={i} className="flex gap-2 text-xs text-gray-600">
                            <span className="font-bold text-brand-600 shrink-0">{i + 1}.</span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            )}
            {action.can_do_now && (
                <button
                    onClick={() => navigate(action.system_route)}
                    className="mt-3 w-full py-2 bg-brand-700 text-white text-sm font-bold rounded-xl hover:bg-brand-800 transition-colors"
                >
                    {t('chat.do_this_now')} →
                </button>
            )}
        </div>
    );
}

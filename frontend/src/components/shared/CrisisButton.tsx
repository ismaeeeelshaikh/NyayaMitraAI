import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const HELPLINES = [
    { name: 'Women Helpline', number: '181', emoji: '👩' },
    { name: 'Child Helpline', number: '1098', emoji: '👧' },
    { name: 'Legal Aid', number: '15100', emoji: '⚖️' },
    { name: 'Police', number: '100', emoji: '🚔' },
    { name: 'Cyber Crime', number: '1930', emoji: '💻' },
    { name: 'Mental Health (Vandrevala)', number: '1860-2662-345', emoji: '💙' },
];

export default function CrisisButton() {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    return (
        <>
            {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}
            {open && (
                <div className="fixed bottom-24 right-4 z-50 bg-white rounded-3xl shadow-2xl p-5 w-72 animate-slide-up border border-red-100">
                    <h3 className="font-bold text-red-700 text-base mb-1">{t('common.crisis_title')}</h3>
                    <p className="text-xs text-gray-500 mb-4">{t('common.crisis_desc')}</p>
                    <div className="space-y-2">
                        {HELPLINES.map(h => (
                            <a key={h.number} href={`tel:${h.number}`}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors">
                                <span className="text-xl">{h.emoji}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">{h.name}</div>
                                    <div className="text-red-700 font-bold text-sm">{h.number}</div>
                                </div>
                                <span>📞</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-4 z-50 w-12 h-12 md:w-14 md:h-14 bg-red-600 hover:bg-red-700
                   text-white rounded-full shadow-2xl flex items-center justify-center
                   text-xl md:text-2xl animate-pulse-slow hover:scale-110 transition-all"
                title="Emergency Helplines"
            >🆘</button>
        </>
    );
}

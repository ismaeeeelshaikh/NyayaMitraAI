import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { LegalAidPartner } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const HELPLINES = [
    { name: 'Legal Aid Helpline', number: '15100', emoji: '⚖️' },
    { name: 'Women Helpline', number: '181', emoji: '👩' },
    { name: 'Child Helpline', number: '1098', emoji: '👧' },
    { name: 'Police', number: '100', emoji: '🚔' },
    { name: 'Cyber Crime', number: '1930', emoji: '💻' },
    { name: 'Consumer Helpline', number: '1915', emoji: '🛒' },
];

const STATES = [
    'MH', 'DL', 'UP', 'KA', 'TN', 'RJ', 'GJ', 'WB', 'MP', 'TG'
];

const SPECIALIZATION_ICONS: Record<string, string> = {
    property: '🏠', family: '👨👩👧', consumer: '🛒',
    criminal: '⚖️', labor: '💼', cyber: '💻'
};

export default function LegalAidPage() {
    const { t } = useLanguage();
    const [partners, setPartners] = useState<LegalAidPartner[]>([]);
    const [state, setState] = useState('MH');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API}/v1/legal-aid/referrals?state=${state}`)
            .then(r => setPartners(r.data.partners || []))
            .catch(() => setPartners([]))
            .finally(() => setLoading(false));
    }, [state]);

    return (
        <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
            <div className="pt-3">
                <h1 className="text-xl font-bold text-brand-700">{t('legal_aid.title')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t('legal_aid.desc')}</p>
            </div>

            {/* State Filter */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('legal_aid.filter_state')}</p>
                <div className="flex flex-wrap gap-2">
                    {STATES.map(s => (
                        <button key={s} onClick={() => setState(s)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all
                ${state === s
                                    ? 'bg-brand-700 text-white border-brand-700'
                                    : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Partners List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-12 text-center text-gray-400">{t('common.loading')}</div>
                ) : partners.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="font-medium">No partners found for {state}</p>
                        <p className="text-sm mt-1">Try another state or check national helplines below</p>
                    </div>
                ) : (
                    partners.map(partner => (
                        <div key={partner.partner_id}
                            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                      ${partner.type === 'govt' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {partner.type === 'govt' ? '🏛 GOVT' : '🤝 NGO'}
                                        </span>
                                        {partner.free_service && (
                                            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold">
                                                ✓ {t('legal_aid.free')}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-800 mt-1.5">{partner.organization_name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">📍 {partner.district}, {partner.state}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-yellow-500 text-sm">{'★'.repeat(Math.round(partner.rating))}</div>
                                    <div className="text-xs text-gray-400">{partner.rating}/5</div>
                                </div>
                            </div>

                            {/* Specializations */}
                            {partner.specializations?.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5">{t('legal_aid.specializes')}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {partner.specializations.map(s => (
                                            <span key={s} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-700
                                              border border-gray-200 rounded-full flex items-center gap-1">
                                                {SPECIALIZATION_ICONS[s] || '⚖️'} {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Languages */}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-semibold">{t('legal_aid.languages')}:</span>
                                <span>{partner.languages_supported?.join(', ').toUpperCase()}</span>
                            </div>

                            {/* Eligibility */}
                            {partner.eligibility_criteria && (
                                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                                    ℹ️ {partner.eligibility_criteria}
                                </div>
                            )}

                            {/* Capacity bar */}
                            {partner.max_capacity > 0 && (
                                <div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span>{t('legal_aid.capacity')}</span>
                                        <span>{partner.current_case_load}/{partner.max_capacity} cases</span>
                                    </div>
                                    <div className="bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className={`h-full rounded-full transition-all
                        ${(partner.current_case_load / partner.max_capacity) > 0.8 ? 'bg-red-400' :
                                                    (partner.current_case_load / partner.max_capacity) > 0.5 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                            style={{ width: `${Math.min(100, (partner.current_case_load / partner.max_capacity) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Contact buttons */}
                            <div className="flex gap-2 pt-1">
                                {partner.phone && (
                                    <a href={`tel:${partner.phone}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-700 text-white
                               rounded-xl text-sm font-bold hover:bg-brand-800 transition-colors">
                                        📞 {partner.phone}
                                    </a>
                                )}
                                {partner.email && (
                                    <a href={`mailto:${partner.email}`}
                                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold
                               hover:bg-gray-200 transition-colors">
                                        ✉️
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* National Helplines — always visible */}
            <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('legal_aid.national_helplines')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {HELPLINES.map(h => (
                        <a key={h.number} href={`tel:${h.number}`}
                            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4
                         hover:border-brand-300 hover:bg-brand-50 transition-colors shadow-sm">
                            <span className="text-2xl">{h.emoji}</span>
                            <div>
                                <div className="text-xs text-gray-500 leading-none">{h.name}</div>
                                <div className="font-bold text-brand-700 text-base">{h.number}</div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
}

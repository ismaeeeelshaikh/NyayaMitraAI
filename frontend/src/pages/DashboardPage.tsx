import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import type { DashboardData } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const ACTIONS = [
    { key: 'ask_question', icon: '💬', route: '/chat', theme: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50/50' },
    { key: 'build_timeline', icon: '⏳', route: '/timeline', theme: 'from-emerald-400 to-green-600', bg: 'bg-green-50/50' },
    { key: 'generate_complaint', icon: '📝', route: '/complaint-generator', theme: 'from-orange-400 to-amber-600', bg: 'bg-orange-50/50' },
    { key: 'scan_notice', icon: '📄', route: '/notice-scanner', theme: 'from-purple-500 to-fuchsia-600', bg: 'bg-purple-50/50' },
];

const ISSUE_ICONS: Record<string, { emoji: string, color: string }> = {
    property: { emoji: '🏠', color: 'bg-blue-100 text-blue-700' },
    family: { emoji: '👩‍👧‍👦', color: 'bg-pink-100 text-pink-700' },
    consumer: { emoji: '🛒', color: 'bg-orange-100 text-orange-700' },
    criminal: { emoji: '⚖️', color: 'bg-red-100 text-red-700' },
    labor: { emoji: '💼', color: 'bg-indigo-100 text-indigo-700' },
    cyber: { emoji: '💻', color: 'bg-emerald-100 text-emerald-700' }
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Add 1s artificial delay to show sleek loading state
        const t = setTimeout(() => {
            axios.get(`${API}/v1/dashboard/widgets?state=MH&district=MUMBAI`)
                .then(r => setData(r.data))
                .catch(() => { })
                .finally(() => setLoading(false));
        }, 800);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="px-4 py-6 sm:p-8 max-w-3xl mx-auto pb-32 space-y-8 animate-fade-in">

            {/* Hero Greeting Section */}
            <section className="relative overflow-hidden glass-panel rounded-[2rem] p-6 sm:p-8">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-200/50 rounded-full mix-blend-multiply blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-200/50 rounded-full mix-blend-multiply blur-2xl"></div>

                <div className="relative z-10">
                    <h2 className="text-sm font-bold tracking-widest text-brand-600 uppercase mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                        Nyaya Mitra AI
                    </h2>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 font-display leading-tight mb-3">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-slate-500 font-medium">Your personal, secure AI legal assistant.</p>
                </div>
            </section>

            {/* Premium Quick Actions Grid */}
            <section>
                <div className="flex items-center justify-between xl mb-4 px-1">
                    <h3 className="text-lg font-bold text-slate-800 font-display">{t('dashboard.actions_title')}</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {ACTIONS.map(a => (
                        <button
                            key={a.key}
                            onClick={() => navigate(a.route)}
                            className="relative group p-[1px] rounded-[1.5rem] bg-gradient-to-b from-white/60 to-white/10 shadow-sm hover:shadow-glass hover:scale-[1.03] transition-all duration-300 ring-1 ring-black/5"
                        >
                            <div className={`h-full w-full rounded-[1.5rem] bg-white flex flex-col items-start p-4 sm:p-5 transition-colors overflow-hidden ${a.bg}`}>

                                {/* Micro background gradient element */}
                                <div className={`absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-br ${a.theme} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`}></div>

                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.theme} text-white flex items-center justify-center text-2xl shadow-md mb-4 transform group-hover:-translate-y-1 transition-transform duration-300`}>
                                    <span className="drop-shadow-sm">{a.icon}</span>
                                </div>

                                <span className="font-bold text-[15px] sm:text-[16px] text-slate-800 leading-tight text-left font-display">
                                    {t(`dashboard.${a.key}`)}
                                </span>

                                {/* Arrow indicator */}
                                <div className="absolute bottom-4 right-4 text-slate-300 group-hover:text-slate-800 transform group-hover:translate-x-1 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Popular Issues (Skeleton or Glass list) */}
            <section>
                <div className="flex items-center mb-4 px-1">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-bold text-slate-800 font-display">{t('dashboard.popular_title')}</h3>
                </div>

                <div className="glass-panel rounded-[2rem] overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 items-center animate-pulse">
                                    <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded-full w-1/3"></div>
                                        <div className="h-3 bg-slate-100 rounded-full w-1/4"></div>
                                    </div>
                                    <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/50">
                            {data?.popular_issues?.map(issue => {
                                const style = ISSUE_ICONS[issue.issue_type] || ISSUE_ICONS.criminal;
                                return (
                                    <button
                                        key={issue.issue_type}
                                        onClick={() => navigate(`/chat?topic=${issue.issue_type}`)}
                                        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/50 transition-colors text-left group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${style.color}`}>
                                            {style.emoji}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800 text-[16px] font-display group-hover:text-brand-700 transition-colors">{issue.display_name}</div>
                                            <div className="text-xs font-semibold text-slate-500 mt-0.5 tracking-wide">{issue.count} cases verified</div>
                                        </div>
                                        <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold shadow-sm uppercase tracking-wide
                      ${issue.trend === 'up' ? 'bg-red-50 text-red-600 ring-1 ring-red-200/50' :
                                                issue.trend === 'down' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200/50'}`}>
                                            {issue.trend === 'up' ? '↗ Rising' : issue.trend === 'down' ? '↘ Falling' : '→ Stable'}
                                        </span>
                                    </button>
                                )
                            })}

                            {(!data?.popular_issues || data.popular_issues.length === 0) && (
                                <div className="p-10 text-center text-slate-500 font-medium flex flex-col items-center">
                                    <span className="text-4xl mb-3 grayscale opacity-50">⚖️</span>
                                    Live case data populating...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Floating Call to Action for Find Legal Aid */}
            <section className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-[2rem] shadow-glass-lg opacity-90 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-left">
                        <h3 className="text-2xl font-black text-white font-display leading-tight mb-2">Need a lawyer near you?</h3>
                        <p className="text-white/80 font-medium">Find verified Gov/NGO legal aid partners with live capacity tracking.</p>
                    </div>

                    <button onClick={() => navigate('/legal-aid')} className="w-full sm:w-auto px-6 py-4 bg-white text-brand-700 rounded-2xl font-bold font-display shadow-lg hover:shadow-xl hover:scale-105 transition-all whitespace-nowrap flex items-center justify-center gap-2">
                        Find Legal Aid <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </section>

        </div>
    );
}

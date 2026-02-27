import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const TYPES = [
    { id: 'police', icon: <path d="M11 15v2m-6-2v2m12-2v2M4 11v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4m-12-3h8m-9-4h10a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2z" />, key: 'complaint.police', color: 'from-blue-500 to-cyan-500' },
    { id: 'rti', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></>, key: 'complaint.rti', color: 'from-emerald-500 to-green-500' },
    { id: 'legal_notice', icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>, key: 'complaint.legal_notice', color: 'from-purple-500 to-indigo-500' },
    { id: 'consumer', icon: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>, key: 'complaint.consumer', color: 'from-orange-500 to-amber-500' },
    { id: 'womens_cell', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.2 0-2 .8-2 2v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>, key: 'complaint.womens_cell', color: 'from-pink-500 to-rose-500' },
    { id: 'cyber', icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>, key: 'complaint.cyber', color: 'from-red-500 to-rose-600' },
];

const FIELDS = [
    { key: 'name', type: 'text', i18n: 'complaint.name', required: true },
    { key: 'phone', type: 'tel', i18n: 'complaint.phone', required: false },
    { key: 'address', type: 'text', i18n: 'complaint.address', required: false },
    { key: 'email', type: 'email', i18n: 'Email Address', required: false },
];

type Step = 'type' | 'form' | 'done';

export default function ComplaintGeneratorPage() {
    const { t, language } = useLanguage();
    const { session } = useSession();

    const [step, setStep] = useState<Step>('type');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ tracking_number: string; pdf_url: string } | null>(null);
    const [form, setForm] = useState({
        name: '', phone: '', address: '', email: '', incident: '', relief: '', state: '', district: ''
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const generate = async () => {
        if (!form.name.trim() || !form.incident.trim()) {
            setError('Name and incident details are compulsory fields.');
            return;
        }
        setLoading(true); setError('');
        try {
            const { data } = await axios.post(`${API}/v1/complaints/generate`, {
                complaint_type: type, language,
                user_id: session?.user_id || 'guest',
                user_inputs: {
                    complainant: { name: form.name, phone: form.phone, address: form.address, email: form.email },
                    incident_description: form.incident,
                    relief_sought: form.relief,
                    location: { state: form.state, district: form.district }
                }
            });
            setResult(data);
            setStep('done');
        } catch { setError('Connection error. Please wait and try again.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="p-4 sm:p-8 max-w-2xl mx-auto pb-32 space-y-6 animate-fade-in">
            <div className="pt-2">
                <h1 className="text-3xl font-black text-slate-800 font-display flex items-center gap-3">
                    <span className="text-orange-500"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></span>
                    AI Legal Drafter
                </h1>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed">Automatically write professional, watertight legal drafts in minutes. Approved formats accepted directly by authorities.</p>
            </div>

            {step === 'type' && (
                <div className="space-y-4 pt-4">
                    <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Select Document Category</p>
                    <div className="grid grid-cols-2 gap-4">
                        {TYPES.map(tp => (
                            <button key={tp.id} onClick={() => { setType(tp.id); setStep('form'); }}
                                className="group relative h-40 rounded-[2rem] bg-white text-left p-6 ring-1 ring-slate-100 shadow-glass-sm hover:shadow-glass hover:-translate-y-1 transition-all overflow-hidden">
                                <div className={`absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-br ${tp.color} opacity-10 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`}></div>

                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tp.color} text-white flex items-center justify-center mb-4 shadow-md`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        {tp.icon}
                                    </svg>
                                </div>
                                <span className="font-bold text-[16px] text-slate-800 font-display leading-tight">{t(tp.key)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 'form' && (
                <div className="animate-slide-up space-y-5 relative">
                    <button onClick={() => setStep('type')} className="text-slate-500 hover:text-slate-800 text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Change Category
                    </button>

                    <div className="glass-panel p-6 sm:p-8 rounded-[2rem] space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 font-display">Required Details</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {FIELDS.map(f => (
                                <div key={f.key}>
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                                        {f.i18n.startsWith('complaint.') ? t(f.i18n) : f.i18n}{f.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input type={f.type} value={(form as any)[f.key]}
                                        onChange={e => set(f.key, e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white/60 rounded-xl border-none ring-1 ring-slate-200 text-[15px] text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition-all" />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">State / Zone</label>
                                <input type="text" value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Maharashtra"
                                    className="w-full px-4 py-3.5 bg-white/60 rounded-xl border-none ring-1 ring-slate-200 text-[15px] text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">City / District</label>
                                <input type="text" value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Mumbai"
                                    className="w-full px-4 py-3.5 bg-white/60 rounded-xl border-none ring-1 ring-slate-200 text-[15px] text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Incident Description <span className="text-red-500 ml-1">*</span></label>
                            <textarea value={form.incident} onChange={e => set('incident', e.target.value)} rows={5} placeholder="Describe exactly what happened chronologically..."
                                className="w-full px-4 py-3.5 bg-white/60 rounded-xl border-none ring-1 ring-slate-200 text-[15px] text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm resize-none" />
                        </div>

                        <div>
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Expected Relief / Demands</label>
                            <input type="text" value={form.relief} onChange={e => set('relief', e.target.value)} placeholder="What do you want the outcome to be?"
                                className="w-full px-4 py-3.5 bg-white/60 rounded-xl border-none ring-1 ring-slate-200 text-[15px] text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
                        </div>

                        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm tracking-wide">{error}</div>}

                        <button onClick={generate} disabled={loading}
                            className="w-full py-4 bg-slate-800 text-white rounded-[1.5rem] font-bold text-[16px] font-display shadow-glass hover:bg-black transition-all disabled:opacity-50">
                            {loading ? 'Drafting via Bedrock AI...' : 'Draft Legal Document 📄'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'done' && result && (
                <div className="space-y-6 animate-fade-in relative z-10 pt-10">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-[2rem] p-8 text-center shadow-glass-lg relative overflow-hidden text-white">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <svg className="mx-auto text-white drop-shadow-md mb-6" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        <h2 className="font-black text-3xl font-display leading-tight mb-2">Ready to File</h2>
                        <p className="font-medium text-emerald-100">Your professional draft is securely formatted as PDF.</p>

                        <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 mt-8 inline-block shadow-sm">
                            <p className="text-[10px] uppercase font-black tracking-widest text-green-100 mb-1">Secure Tracking Ref</p>
                            <p className="font-mono font-bold text-2xl tracking-widest drop-shadow-sm">{result.tracking_number}</p>
                        </div>
                    </div>

                    <a href={result.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-5 bg-white text-slate-800 border-2 border-slate-100 rounded-[1.5rem] font-bold hover:shadow-glass-sm transition-all focus:outline-none ring-1 ring-black/5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        Review & Download PDF
                    </a>

                    <button onClick={() => { setStep('type'); setResult(null); }}
                        className="w-full text-[13px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest mt-4">
                        Create Another Document
                    </button>
                </div>
            )}
        </div>
    );
}

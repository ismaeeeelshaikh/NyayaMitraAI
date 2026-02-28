import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useVoice } from '../hooks/useVoice';
import ConfidenceBadge from '../components/chat/ConfidenceBadge';
import RiskBadge from '../components/chat/RiskBadge';
import ActionCard from '../components/chat/ActionCard';
import GuestLimitBanner from '../components/shared/GuestLimitBanner';
export default function ChatPage() {
    const { t, language } = useLanguage();
    const { session, setSession, queriesLeft } = useSession();
    const [input, setInput] = useState('');
    const [voiceMode, setVoiceMode] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const sid = session?.session_id || '';

    const handleWsError = useCallback((error: any) => {
        if (error.error_code === 'SESSION_EXPIRED') {
            setSession(null);
            navigate('/');
        }
    }, [navigate, setSession]);

    const { messages, connected, loading, sendMessage } = useWebSocket(sid, handleWsError);
    const { isRecording, isSpeaking, startRecording, stopRecording, speakText } = useVoice(sid, language);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = () => {
        if (!input.trim() || queriesLeft <= 0) return;
        sendMessage(input.trim(), language);
        setInput('');
    };

    const handleVoice = async () => {
        if (isRecording) {
            const text = await stopRecording();
            if (text && text.trim()) sendMessage(text, language);
        } else {
            await startRecording();
        }
    };

    // Improved markdown-like basic parser for bolding **text** if react-markdown isn't present
    const formatText = (text: string) => {
        return text.split('\n').map((line, i) => (
            <span key={i} className="block mb-2 last:mb-0">
                {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                        ? <span key={j} className="font-bold">{part.slice(2, -2)}</span>
                        : part
                )}
            </span>
        ));
    };

    return (
        <div className="flex flex-col h-screen fixed inset-0 max-w-3xl mx-auto bg-surface-50">

            {/* Glass Top Header */}
            <header className="glass-panel sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b-0 shadow-sm rounded-b-[2rem]">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
                        AI Legal Assistant
                    </h1>
                    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${connected ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <span className="relative flex h-2 w-2">
                            {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </span>
                        {connected ? 'Secure Connection Active' : 'Connecting Engine...'}
                    </div>
                </div>
            </header>

            {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scrollbar-hide pb-40">

                <GuestLimitBanner />

                {/* Empty State Welcome */}
                {messages.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
                        <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-glass-sm animate-float">
                            💬
                        </div>
                        <h2 className="text-2xl font-black font-display text-slate-800 mb-2">How can I help you today?</h2>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                            I can assist with property disputes, labor laws, family issues, consumer rights, and FIR drafting.
                        </p>
                    </div>
                )}

                {/* Chat Bubbles */}
                {messages.map(msg => {
                    const isUser = msg.sender === 'user';
                    const isSystem = msg.sender === 'system';

                    return (
                        <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>

                                {/* Bubble */}
                                <div className={`relative px-5 py-4 rounded-[1.5rem] shadow-sm text-[15px] sm:text-[16px] leading-relaxed tracking-wide
                  ${isUser
                                        ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white rounded-br-sm'
                                        : isSystem
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200 ring-1 ring-amber-100/50'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm shadow-glass-sm'}`}
                                >
                                    {formatText(msg.text)}
                                </div>

                                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1.5 px-2">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {/* AI Interactive Elements (Badges, Citations, Cards) */}
                                {!isUser && !isSystem && (
                                    <div className="mt-3 w-full space-y-3 px-1">

                                        {/* Badges row */}
                                        {(msg.confidence_label || msg.risk_level) && (
                                            <div className="flex flex-wrap gap-2">
                                                {msg.confidence_label && msg.confidence_score && (
                                                    <ConfidenceBadge score={msg.confidence_score} label={msg.confidence_label} color={msg.confidence_color || 'green'} />
                                                )}
                                                {msg.risk_level && msg.risk_score && (
                                                    <RiskBadge level={msg.risk_level} score={msg.risk_score} />
                                                )}
                                            </div>
                                        )}

                                        {/* Citations Box */}
                                        {msg.citations && msg.citations.length > 0 && (
                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                                    Legal Sources
                                                </h4>
                                                <div className="space-y-2">
                                                    {msg.citations.map((c, i) => (
                                                        <div key={i} className="flex gap-3 text-[13px] text-slate-600 group hover:bg-white p-2 -mx-2 rounded-xl transition-colors">
                                                            <span className="bg-brand-100 text-brand-700 font-black h-5 px-1.5 rounded flex items-center justify-center shrink-0">[{c.index}]</span>
                                                            <span className="flex-1 font-medium">{c.source}</span>
                                                            {c.relevance === 'HIGH' && (
                                                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center shrink-0 uppercase tracking-widest">Crucial</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Crisis Block */}
                                        {msg.crisis_resources && (
                                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
                                                <div className="text-red-600 flex gap-2 font-bold mb-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                                    {msg.crisis_resources.message}
                                                </div>
                                                <div className="space-y-2">
                                                    {msg.crisis_resources.helplines.map((h, i) => (
                                                        <a key={i} href={`tel:${h.number}`} className="flex items-center gap-3 py-2 px-3 bg-white rounded-xl text-sm font-bold text-slate-800 hover:text-red-700 hover:shadow-sm ring-1 ring-red-100 transition-all">
                                                            📞 {h.name} <span className="ml-auto text-red-600">{h.number}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dynamic Action Cards */}
                                        {msg.recommended_actions?.map((action, i) => (
                                            <ActionCard key={i} action={action} />
                                        ))}

                                        {/* Action Row */}
                                        <div className="flex items-center gap-4 pt-1">
                                            <button
                                                onClick={() => !isSpeaking && speakText(msg.text)}
                                                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${isSpeaking ? 'text-brand-600' : 'text-slate-400 hover:text-slate-700'}`}
                                            >
                                                {isSpeaking ? (
                                                    <><svg className="w-4 h-4 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg> Speaking...</>
                                                ) : (
                                                    <><svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg> Listen</>
                                                )}
                                            </button>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white border border-slate-100 shadow-glass-sm rounded-[1.5rem] rounded-bl-sm px-6 py-5 flex items-center gap-2">
                            {[0, 150, 300].map(delay => (
                                <div key={delay} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="h-4"></div>
            </div>

            {/* Modern Input Bar */}
            <div className="absolute bottom-24 left-0 right-0 px-4 sm:px-6 z-30">
                <div className="glass-panel rounded-full p-2 flex items-center gap-2 shadow-glass-lg max-w-2xl mx-auto border-t">

                    {/* Voice Switcher */}
                    <button
                        onClick={() => setVoiceMode(v => !v)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${voiceMode ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                    </button>

                    {voiceMode ? (
                        <button
                            onClick={handleVoice}
                            disabled={queriesLeft <= 0}
                            className={`flex-1 h-12 rounded-full font-bold font-display tracking-wide flex items-center justify-center gap-2 transition-all
                ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-glass-sm'}
                disabled:opacity-50`}
                        >
                            {isRecording ? (
                                <><span className="w-3 h-3 bg-white rounded-full animate-ping"></span> Recording...</>
                            ) : (
                                <>Tap to Speak</>
                            )}
                        </button>
                    ) : (
                        <>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                disabled={queriesLeft <= 0}
                                placeholder={t('chat.placeholder')}
                                className="flex-1 bg-transparent border-none text-[15px] font-medium text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:outline-none px-2"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading || queriesLeft <= 0}
                                className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors transform active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}

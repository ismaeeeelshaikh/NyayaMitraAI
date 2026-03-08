import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WebSocketPayload } from '../hooks/useWebSocket';
import { useConversations } from '../hooks/useConversations';
import { useVoice } from '../hooks/useVoice';
import ConfidenceBadge from '../components/chat/ConfidenceBadge';
import RiskBadge from '../components/chat/RiskBadge';
import ActionCard from '../components/chat/ActionCard';
import GuestLimitBanner from '../components/shared/GuestLimitBanner';
import StreamingBubble from '../components/chat/StreamingBubble';

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION PARTICLES (Original Shared Theme)
   ═══════════════════════════════════════════════════════════ */
function ConstellationParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number; color: string }[]>([]);
    const mouse = useRef({ x: -1000, y: -1000 });
    const animFrame = useRef(0);

    const init = useCallback(() => {
        const count = window.innerWidth < 768 ? 40 : 80;
        const colors = ['#E87D20', '#138808', '#FFFFFF', '#FFB366'];
        particles.current = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        init();

        const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouse);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const pts = particles.current;
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();

                for (let j = i + 1; j < pts.length; j++) {
                    const p2 = pts[j];
                    const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (d < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - d / 150)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            animFrame.current = requestAnimationFrame(draw);
        };
        draw();
        return () => {
            cancelAnimationFrame(animFrame.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouse);
        };
    }, [init]);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-50" />;
}

export default function ChatPage() {
    const { language } = useLanguage();
    const { session, setSession, queriesLeft } = useSession();
    const [input, setInput] = useState('');
    const [voiceMode, setVoiceMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
    const bottomRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const sid = session?.session_id || '';
    // Persist conversation history only for authenticated users.
    // Guests should always have an ephemeral chat experience.
    const chatStorageKey = session && !session.anonymous_mode ? session.user_id : '';

    // ── Conversation history management ──
    const {
        conversations,
        activeId,
        activeConversation,
        saveMessages,
        createConversation,
        switchConversation,
        deleteConversation,
        isSwitchingRef,
    } = useConversations(chatStorageKey);

    const handleWsError = useCallback((error: WebSocketPayload) => {
        if (error.error_code === 'SESSION_EXPIRED') {
            setSession(null);
            navigate('/');
        }

        if (error.error_code === 'GUEST_LIMIT_REACHED') {
            setSession(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    query_limit_remaining: 0,
                    queries_count: typeof error.queries_used === 'number' ? error.queries_used : prev.queries_count,
                };
            });
        }
    }, [navigate, setSession]);

    const handleWsServerMessage = useCallback((data: WebSocketPayload) => {
        if (typeof data.queries_remaining !== 'number' && typeof data.queries_used !== 'number') return;

        setSession(prev => {
            if (!prev || !prev.anonymous_mode) return prev;
            return {
                ...prev,
                query_limit_remaining: typeof data.queries_remaining === 'number'
                    ? Math.max(0, data.queries_remaining)
                    : prev.query_limit_remaining,
                queries_count: typeof data.queries_used === 'number'
                    ? data.queries_used
                    : prev.queries_count,
            };
        });
    }, [setSession]);

    const { messages, setMessages, loading, sendMessage, markStreamingDone, clearMessages } = useWebSocket(sid, handleWsError, handleWsServerMessage);
    const { isRecording, isSpeaking, startRecording, stopRecording, speakText } = useVoice(sid, language);

    // Load saved messages when switching conversations
    const prevMsgLenRef = useRef<number>(0);
    useEffect(() => {
        if (activeConversation) {
            const msgs = [...activeConversation.messages];
            setMessages(msgs);
            prevMsgLenRef.current = msgs.length;
        } else {
            setMessages([]);
            prevMsgLenRef.current = 0;
        }
    }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-save messages when they change (skip during switching)
    useEffect(() => {
        // Skip save during conversation switching
        if (isSwitchingRef.current) return;
        // Save only if there are messages and no streaming
        if (messages.length > 0) {
            const anyStreaming = messages.some(m => m.isStreaming);
            if (!anyStreaming && messages.length !== prevMsgLenRef.current) {
                prevMsgLenRef.current = messages.length;
                saveMessages(messages);
            }
        } else {
            prevMsgLenRef.current = 0;
        }
    }, [messages, saveMessages, isSwitchingRef]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleNewConsultation = useCallback(() => {
        // If current chat is already empty, don't create another one
        if (messages.length === 0) return;
        // Save current messages & create new conversation atomically
        createConversation(messages);
        clearMessages();
    }, [messages, clearMessages, createConversation]);

    const handleSwitchConversation = useCallback((id: string) => {
        if (id === activeId) return;
        // Save current conversation's messages, then switch
        switchConversation(id, messages);
        clearMessages();
    }, [activeId, messages, clearMessages, switchConversation]);

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

    const formatText = (text: string) => {
        return text.split('\n').map((line, i) => (
            <span key={i} className="block mb-2 last:mb-0">
                {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                        ? <span key={j} className="font-bold text-[#E87D20]">{part.slice(2, -2)}</span>
                        : part
                )}
            </span>
        ));
    };

    return (
        <div className="flex h-full min-h-0 w-full bg-[#050505] text-slate-300 overflow-hidden font-sans selection:bg-[#E87D20]/30 selection:text-white">

            {/* Background Elements (Retained) */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="fixed top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#E87D20]/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

            {/* ═══════════════════════════════════════════════════════════
               LEFT SIDEBAR — overlay on mobile, push on desktop
               ═══════════════════════════════════════════════════════════ */}
            {/* Dark backdrop — mobile only */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <aside className={`
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isSidebarOpen ? 'md:w-72' : 'md:w-0'}
                fixed md:relative top-0 left-0 h-full w-72
                flex-shrink-0 transition-all duration-300
                bg-[#0D1220]/95 md:bg-[#0D1220]/60 backdrop-blur-2xl
                border-r border-[#1E293B] z-50 md:z-20 flex flex-col overflow-hidden
            `}>
                <div className="flex-shrink-0 p-6 border-b border-[#1E293B] bg-[#0D1220]/95 backdrop-blur-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Consultation History</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white" title="Close sidebar">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-custom">
                    {conversations.map(conv => {
                        const isActive = conv.id === activeId;
                        const dateStr = new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        const timeStr = new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div
                                key={conv.id}
                                onClick={() => { handleSwitchConversation(conv.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                                className={`p-3 rounded-xl cursor-pointer transition-all group relative
                                    ${isActive
                                        ? 'bg-[#E87D20]/10 border border-[#E87D20]/30 shadow-[0_0_15px_rgba(232,125,32,0.08)]'
                                        : 'bg-white/5 border border-white/5 hover:border-[#E87D20]/20'}`}
                            >
                                <p className={`text-xs truncate ${isActive ? 'text-[#E87D20] font-bold' : 'text-slate-300'}`}>
                                    {conv.title}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-[9px] text-slate-500 uppercase">{dateStr} • {timeStr}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all p-1"
                                        title="Delete"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {conversations.length === 0 && (
                        <p className="text-[10px] text-slate-600 text-center py-8 uppercase tracking-wider">No consultations yet</p>
                    )}
                </div>

                <div className="p-4 border-t border-[#1E293B] pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <button
                        onClick={handleNewConsultation}
                        className="w-full py-3 rounded-xl bg-[#E87D20]/10 border border-[#E87D20]/20 text-[#E87D20] text-[10px] font-black uppercase tracking-tighter hover:bg-[#E87D20]/20 transition-all"
                    >
                        + New Consultation
                    </button>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════
               MAIN CONTENT (Original UI)
               ═══════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Floating sidebar toggle (only visible when sidebar is closed) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute top-4 left-4 z-20 p-2 bg-[#0D1220]/80 backdrop-blur-xl border border-[#1E293B] rounded-xl hover:border-[#E87D20]/40 transition-all text-slate-400 hover:text-white"
                        title="Open sidebar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                )}

                {/* Main Chat Area */}
                <main className="flex-1 overflow-y-auto px-4 md:px-0 py-6 scrollbar-custom pb-48 relative z-10">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <GuestLimitBanner />

                        {messages.length === 0 && (
                            <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4 duration-1000 px-4">
                                <div className="w-20 h-20 bg-[#0D1220] border border-[#E87D20]/30 rounded-[2rem] flex items-center justify-center text-3xl shadow-[0_0_50px_rgba(232,125,32,0.15)] mb-8">⚖️</div>
                                <h2 className="text-xl sm:text-3xl font-black text-white mb-4 tracking-tight font-display">How can I assist you today?</h2>
                                <p className="text-[#8B95A5] max-w-md mx-auto text-base font-medium leading-relaxed">
                                    Start a secure legal consultation. Our engine analyzes thousands of precedents in real-time.
                                </p>
                            </div>
                        )}

                        {messages.map(msg => {
                            const isUser = msg.sender === 'user';
                            const isSystem = msg.sender === 'system';

                            return (
                                <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-in slide-in-from-bottom-2`}>
                                    <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>

                                        <div className={`px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed shadow-2xl
                                            ${isUser
                                                ? 'bg-gradient-to-br from-[#E87D20] to-[#FF512F] text-white rounded-br-none shadow-[#E87D20]/10'
                                                : isSystem
                                                    ? 'bg-amber-500/5 text-amber-200 border border-amber-500/20'
                                                    : 'bg-[#0D1220] text-slate-200 border border-[#1E293B] rounded-bl-none'}`}
                                        >
                                            {msg.sender === 'assistant' ? (
                                                <StreamingBubble msg={msg} onStreamingDone={markStreamingDone} formatText={formatText} />
                                            ) : (
                                                formatText(msg.text)
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-3 px-3">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!isUser && !isSystem && !msg.isStreaming && (
                                                <button
                                                    onClick={() => !isSpeaking && speakText(msg.text)}
                                                    className={`transition-all flex items-center gap-1.5 px-2 py-1 rounded-md ${isSpeaking ? 'bg-[#E87D20]/20 text-[#E87D20]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                                    title={isSpeaking ? "Speaking..." : "Listen"}
                                                >
                                                    {isSpeaking ? (
                                                        <>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider">Listening</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider">Listen</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {!isUser && !isSystem && !msg.isStreaming && (
                                            <div className="mt-6 w-full space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.confidence_label && <ConfidenceBadge score={msg.confidence_score ?? 0} label={msg.confidence_label} color="orange" />}
                                                    {msg.risk_level && <RiskBadge level={msg.risk_level} score={msg.risk_score ?? 0} />}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {msg.citations?.map((c, i) => (
                                                        <div key={i} className="bg-[#090C15] border border-[#1E293B] rounded-2xl p-4 flex gap-4 items-start group hover:border-[#E87D20]/40 transition-all">
                                                            <div className="bg-[#E87D20]/10 text-[#E87D20] w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-black border border-[#E87D20]/20">{c.index}</div>
                                                            <p className="text-xs text-slate-400 leading-tight pt-1">{c.source}</p>
                                                        </div>
                                                    ))}
                                                    {msg.recommended_actions?.map((action, i) => (
                                                        <ActionCard key={i} action={action} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-3 px-6 py-4 bg-[#0D1220] border border-[#1E293B] rounded-2xl shadow-xl">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-[#E87D20] rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-[#E87D20] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-[#E87D20] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Mitra is Thinking</span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} className="h-4"></div>
                    </div>
                </main>

                {/* Premium Input Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-40">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative flex items-center bg-[#0D1220] border border-[#1E293B] rounded-[2rem] p-2 shadow-2xl focus-within:border-[#E87D20]/50 transition-all group">

                            <button
                                onClick={() => setVoiceMode(v => !v)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${voiceMode ? 'bg-[#E87D20] text-white shadow-[0_0_15px_#e87d2066]' : 'text-slate-500 hover:bg-white/5'}`}
                                title="Toggle voice mode"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </button>

                            <div className="flex-1 px-4">
                                {voiceMode ? (
                                    <button
                                        onClick={handleVoice}
                                        disabled={queriesLeft <= 0}
                                        className={`w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                                            ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#E87D20]/10 text-[#E87D20] hover:bg-[#E87D20]/20'}`}
                                    >
                                        {isRecording ? 'Listening...' : 'Tap to Speak'}
                                    </button>
                                ) : (
                                    <input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        disabled={queriesLeft <= 0}
                                        placeholder="Describe your legal situation..."
                                        className="w-full bg-transparent border-none text-[15px] text-white placeholder:text-slate-600 focus:ring-0 outline-none"
                                    />
                                )}
                            </div>

                            {!voiceMode && (
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading || queriesLeft <= 0}
                                    className="w-12 h-12 rounded-2xl bg-[#E87D20] text-white flex items-center justify-center hover:bg-orange-500 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-[#E87D20]/20"
                                    title="Send message"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                            )}
                        </div>
                        <div className="flex justify-center mt-4">
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Secure End-to-End Encryption • AI Legal Helper</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .scrollbar-custom::-webkit-scrollbar { width: 4px; }
                .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(232, 125, 32, 0.1); border-radius: 10px; }
                .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(232, 125, 32, 0.3); }
                @font-face {
                    font-family: 'Display';
                    src: url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');
                }
                .font-display { font-family: 'Space Grotesk', sans-serif; }
            `}</style>
        </div>
    );
}

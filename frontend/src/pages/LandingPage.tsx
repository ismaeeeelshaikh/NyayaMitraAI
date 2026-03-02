import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = performance.now();
                const step = (now: number) => {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.floor(eased * target));
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }
        }, { threshold: 0.3 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
}

function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);
    return { ref, inView };
}

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION PARTICLES
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

                const dx = p.x - mouse.current.x;
                const dy = p.y - mouse.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    p.vx += dx / dist * 0.05;
                    p.vy += dy / dist * 0.05;
                }

                p.vx *= 0.99;
                p.vy *= 0.99;

                if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.1;
                if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * 0.1;

                p.x += p.vx;
                p.y += p.vy;

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
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * (1 - d / 150)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
                ctx.globalAlpha = 1.0;
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

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-80" />;
}

/* ═══════════════════════════════════════════════════════════
   TYPING ANIMATION COMPONENT
   ═══════════════════════════════════════════════════════════ */
function TypingText({ texts, className }: { texts: string[]; className?: string }) {
    const [current, setCurrent] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const text = texts[current];

        if (!isDeleting) {
            if (displayed.length < text.length) {
                timeout = setTimeout(() => {
                    setDisplayed(text.slice(0, displayed.length + 1));
                }, 50);
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(true);
                }, 2000);
            }
        } else {
            if (displayed.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayed(text.slice(0, displayed.length - 1));
                }, 30);
            } else {
                setIsDeleting(false);
                setCurrent((current + 1) % texts.length);
            }
        }

        return () => clearTimeout(timeout);
    }, [displayed, isDeleting, current, texts]);

    return (
        <span className={className}>
            {displayed}
            <span className="animate-pulse text-[#E87D20] ml-[2px]">|</span>
        </span>
    );
}

/* ═══════════════════════════════════════════════════════════
   LIVE CHAT DEMO COMPONENT
   ═══════════════════════════════════════════════════════════ */
const CHAT_SCENARIOS = [
    {
        userMsg: "मेरे मकान मालिक ने बिना नोटिस किराया बढ़ा दिया। क्या यह कानूनी है?",
        lawTitle: "Rent Control Act, 1999",
        botDescPart1: "नहीं, यह कानूनी नहीं है। धारा 5(1) के तहत मकान मालिक को किराया बढ़ाने से पहले ",
        highlightWord: "3 महीने का नोटिस",
        botDescPart2: " देना अनिवार्य है।",
        chip1: "✓ Verified",
        chip2: "📄 Draft Notice",
        nextStepText: "Rent Controller को ₹0 में शिकायत दर्ज करें → ",
        nextStepLink: "Auto-generate complaint"
    },
    {
        userMsg: "ऑनलाइन ₹25,000 का फ्रॉड हो गया है। मुझे क्या करना चाहिए?",
        lawTitle: "IT Act, 2000",
        botDescPart1: "आपको तुरंत Cyber Crime पोर्टल पर शिकायत दर्ज करनी चाहिए। 24 घंटे के भीतर ",
        highlightWord: "बैंक को भी सूचित करें",
        botDescPart2: "।",
        chip1: "✓ Verified",
        chip2: "📄 Cyber FIR",
        nextStepText: "नजदीकी पुलिस स्टेशन या साइबर सेल में शिकायत दर्ज करें → ",
        nextStepLink: "Auto-generate FIR draft"
    },
    {
        userMsg: "कंपनी ने मुझे बिना 1 महीने की सैलरी दिए निकाल दिया।",
        lawTitle: "Industrial Disputes Act, 1947",
        botDescPart1: "कानून के अनुसार, कंपनी को आपको 30 दिन का नोटिस या उसके बदले ",
        highlightWord: "1 महीने का वेतन",
        botDescPart2: " (Notice Pay) देना अनिवार्य है।",
        chip1: "✓ Verified",
        chip2: "📄 Legal Notice",
        nextStepText: "कंपनी को कानूनी नोटिस भेजें → ",
        nextStepLink: "Auto-generate legal notice"
    },
    {
        userMsg: "मेरे मोहल्ले में पिछले 10 दिन से कचरा नहीं उठा है। शिकायत कहाँ करूँ?",
        lawTitle: "Municipal Corporation Act",
        botDescPart1: "यह नगर निगम की जिम्मेदारी है। आप स्वास्थ्य विभाग में ",
        highlightWord: "RTI (Right to Info.)",
        botDescPart2: " के तहत सीधा जवाब मांग सकते हैं।",
        chip1: "✓ Verified",
        chip2: "📄 RTI Draft",
        nextStepText: "नगर निगम से जवाब मांगने के लिए RTI डालें → ",
        nextStepLink: "Auto-generate RTI"
    },
    {
        userMsg: "मैने एक प्रोडक्ट ख़रीदा था जो ख़राब निकला, दूकानदार वापस नहीं ले रहा।",
        lawTitle: "Consumer Protection Act, 2019",
        botDescPart1: "आप दूकानदार के खिलाफ उपभोक्ता फोरम (Consumer Court) में ",
        highlightWord: "नुकसान की भरपाई",
        botDescPart2: " के लिए केस दर्ज कर सकते हैं।",
        chip1: "✓ Verified",
        chip2: "📄 Legal Notice",
        nextStepText: "दूकानदार को उपभोक्ता फोरम का नोटिस भेजें → ",
        nextStepLink: "Auto-generate notice"
    }
];

function LiveChatDemo() {
    const [step, setStep] = useState(0);
    const [scenarioIdx, setScenarioIdx] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const { ref, inView } = useInView(0.3);

    const currentScenario = CHAT_SCENARIOS[scenarioIdx];

    useEffect(() => {
        if (!inView) return;
        let isCancelled = false;

        const runAnimation = () => {
            if (isCancelled) return;
            setIsFading(false);

            // Instantly show everything
            setStep(4);

            // Wait 5 seconds to read, then start fading out
            setTimeout(() => {
                if (!isCancelled) setIsFading(true);
            }, 5000);

            // Change scenario and restart immediately after fade out
            setTimeout(() => {
                if (!isCancelled) {
                    setStep(0);
                    setScenarioIdx(prev => (prev + 1) % CHAT_SCENARIOS.length);
                }
            }, 5500);
        };

        if (step === 0) {
            runAnimation();
        }

        return () => {
            isCancelled = true;
        };
    }, [inView, step, scenarioIdx]);

    return (
        <div ref={ref} className="relative w-full max-w-md mx-auto">
            <Link to="/login" className="block relative bg-[#090C15] backdrop-blur-2xl border border-[#1E293B] rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer group hover:border-[#E87D20]/50 transition-colors duration-300">
                <div className="bg-[#090C15]/90 border-b border-[#1E293B] px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#121827] rounded-xl flex items-center justify-center text-lg border border-[#1E293B] shadow-inner text-[#E87D20]">
                        ⚖️
                    </div>
                    <div>
                        <div className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                            Nyaya Mitra AI
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 bg-[#E87D20] rounded-full shadow-[0_0_8px_rgba(232,125,32,0.8)]"></span>
                            <span className="text-[#8B95A5] text-[11px] font-bold uppercase tracking-wider">Online</span>
                        </div>
                    </div>
                </div>

                <div className={`p-5 space-y-5 min-h-[350px] transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                    {step >= 1 && (
                        <div key={`user-${scenarioIdx}`} className="flex justify-end animate-slide-up">
                            <div className="bg-[linear-gradient(to_right,#E87D20,#FF512F)] text-white px-5 py-4 rounded-[1.5rem] rounded-tr-sm text-[15px] max-w-[90%] leading-relaxed shadow-[0_0_20px_rgba(232,125,32,0.15)] font-medium">
                                {currentScenario.userMsg}
                            </div>
                        </div>
                    )}
                    {step >= 4 && (
                        <div key={`bot-${scenarioIdx}`} className="flex gap-3 animate-slide-up">
                            <div className="w-9 h-9 rounded-full bg-[#121827] border border-[#1E293B] flex items-center justify-center flex-shrink-0 mt-1 text-white shadow-inner">🤖</div>
                            <div className="flex-1">
                                <div className="bg-[#0D1220] border border-[#1E293B] p-5 rounded-[1.5rem] rounded-tl-sm text-sm text-[#E2E8F0] w-full shadow-sm">
                                    <p className="font-bold text-[#E87D20] text-[15px] mb-3 flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                        {currentScenario.lawTitle}
                                    </p>
                                    <p className="text-[15px] leading-relaxed">
                                        {currentScenario.botDescPart1}
                                        <strong className="text-[#E87D20] font-bold">{currentScenario.highlightWord}</strong>
                                        {currentScenario.botDescPart2}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="px-4 py-2 bg-[#E87D20]/10 text-[#E87D20] rounded-full text-sm font-bold border border-[#E87D20]/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(232,125,32,0.1)] transition-all">
                                        {currentScenario.chip1}
                                    </span>
                                    <span className="px-4 py-2 bg-[#121827] text-[#8B95A5] rounded-full text-sm font-bold border border-[#1E293B] flex items-center gap-1.5 transition-all">
                                        {currentScenario.chip2}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {step >= 4 && (
                        <div key={`next-${scenarioIdx}`} className="flex gap-3 animate-slide-up ml-12">
                            <div className="bg-[#0D1220] border border-[#2D3748] p-4 rounded-2xl w-full shadow-lg group-hover:border-[#E87D20]/50 transition-colors">
                                <p className="font-bold text-[#E87D20] text-[11px] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                                    <span className="text-sm">🎯</span> NEXT STEP
                                </p>
                                <p className="text-[#F1F5F9] text-sm leading-relaxed">
                                    {currentScenario.nextStepText}
                                    <span className="text-[#E87D20] underline font-bold decoration-2 underline-offset-2 group-hover:text-white transition-colors">{currentScenario.nextStepLink}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Link>
            <div className="absolute -inset-10 bg-[#E87D20]/10 rounded-[3rem] blur-[80px] -z-10 animate-pulse-slow pointer-events-none"></div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   ORIGINAL DATA
   ═══════════════════════════════════════════════════════════ */

const FEATURES = [
    { icon: '💬', titleKey: 'landing.feat_chat', descKey: 'landing.feat_chat_desc', delay: 0 },
    { icon: '📋', titleKey: 'landing.feat_timeline', descKey: 'landing.feat_timeline_desc', delay: 100 },
    { icon: '📄', titleKey: 'landing.feat_complaint', descKey: 'landing.feat_complaint_desc', delay: 200 },
    { icon: '📜', titleKey: 'landing.feat_notice', descKey: 'landing.feat_notice_desc', delay: 300 },
    { icon: '🗺️', titleKey: 'landing.feat_legal_aid', descKey: 'landing.feat_legal_aid_desc', delay: 400 },
    { icon: '🌐', titleKey: 'landing.feat_multilingual', descKey: 'landing.feat_multilingual_desc', delay: 500 },
];

const STEPS = [
    { num: '01', titleKey: 'landing.step1_title', descKey: 'landing.step1_desc', icon: '🗣️' },
    { num: '02', titleKey: 'landing.step2_title', descKey: 'landing.step2_desc', icon: '🤖' },
    { num: '03', titleKey: 'landing.step3_title', descKey: 'landing.step3_desc', icon: '📝' },
];

const IMPACT_STATS = [
    { value: 6, suffix: '', label: 'AI Tools Built', icon: '🛠️' },
    { value: 2, suffix: '', label: 'Languages', icon: '🗣️' },
    { value: 50, suffix: '+', label: 'Legal Topics', icon: '📚' },
    { value: 24, suffix: '/7', label: 'Always Available', icon: '🕐' },
];

const INDIA_LEGAL_STATS = [
    { value: 4, suffix: '.5 Cr', label: 'Pending Cases in India (NJDG 2024)', highlight: true },
    { value: 80, suffix: '%', label: 'Indians can\'t afford a lawyer (NALSA)', highlight: false },
    { value: 3, suffix: '.5 Cr', label: 'Women face domestic violence yearly', highlight: false },
    { value: 1, suffix: '', label: 'Judge per 50,000 people', highlight: true },
];

const POWERED_BY = [
    { icon: '🧠', name: 'Bedrock', desc: 'Claude AI Models for legal reasoning' },
    { icon: '🗣️', name: 'Polly', desc: 'Natural voice I/O in Hindi & English' },
    { icon: '📑', name: 'Textract', desc: 'OCR for scanning legal documents' },
    { icon: '🔐', name: 'Cognito', desc: 'Secure, anonymous authentication' },
    { icon: '⚡', name: 'Lambda', desc: 'Serverless backend, zero downtime' },
    { icon: '🗄️', name: 'DynamoDB', desc: 'Session & case data at scale' },
];

const TESTIMONIAL_SCENARIOS = [
    {
        quote: 'मेरे मकान मालिक ने बिना नोटिस किराया बढ़ाया। न्याय मित्र ने Rent Control Act की धारा बताई और शिकायत का ड्राफ्ट 2 मिनट में बना दिया।',
        quoteEn: 'My landlord raised rent without notice. Nyaya Mitra cited the exact Rent Control Act section and drafted my complaint in 2 minutes.',
        persona: 'Priya, Mumbai',
        emoji: '👩‍🎓',
    },
    {
        quote: 'ऑनलाइन फ्रॉड हो गया था ₹25,000 का। न्याय मित्र ने Cyber Crime FIR ड्राफ्ट कर दी और नजदीकी थाने का पता बताया।',
        quoteEn: 'I was defrauded ₹25,000 online. Nyaya Mitra drafted my Cyber Crime FIR and located the nearest police station.',
        persona: 'Ramesh, Jaipur',
        emoji: '👨‍💼',
    },
    {
        quote: 'RTI कैसे फाइल करें कुछ नहीं पता था। न्याय मित्र ने पूरा RTI application बना दिया 5 मिनट में।',
        quoteEn: 'I had no idea how to file an RTI. Nyaya Mitra generated my complete RTI application in just 5 minutes.',
        persona: 'Anita, Delhi',
        emoji: '👩‍🍳',
    },
];

/* ─── StatCard ─── */
function StatCard({ value, suffix, label, icon }: { value: number; suffix: string; label: string; icon: string }) {
    const { count, ref } = useCountUp(value);
    return (
        <div ref={ref} className="relative group">
            <div className="bg-[#0D1220] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-[1.5rem] text-center transition-all duration-500 hover:-translate-y-1">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-3xl sm:text-4xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-[#E87D20] to-[#FF512F]">
                    {count.toLocaleString()}{suffix}
                </div>
                <div className="text-sm font-medium text-[#8B95A5] mt-2">{label}</div>
            </div>
        </div>
    );
}

/* ─── CrisisStatCard ─── */
function CrisisStatCard({ value, suffix, label, highlight }: { value: number; suffix: string; label: string; highlight: boolean }) {
    const { count, ref } = useCountUp(value, 2500);
    return (
        <div ref={ref} className={`p-6 rounded-[1.5rem] text-center transition-all duration-500 hover:scale-[1.03] backdrop-blur-xl border ${highlight
            ? 'bg-[#121827]/80 border-[#E87D20]/50 shadow-[0_8px_30px_-10px_rgba(232,125,32,0.2)]'
            : 'bg-[#0D1220]/40 border-[#1E293B]'
            }`}>
            <div className={`text-3xl sm:text-4xl font-extrabold font-display ${highlight ? 'text-[#E87D20] drop-shadow-[0_0_10px_rgba(232,125,32,0.5)]' : 'text-white'}`}>
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-sm font-medium text-[#8B95A5] mt-2 leading-tight">{label}</div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const { t, toggleLang, language } = useLanguage();
    const [scrollY, setScrollY] = useState(0);
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIAL_SCENARIOS.length), 5000);
        return () => clearInterval(iv);
    }, []);

    const featuresView = useInView(0.1);
    const stepsView = useInView(0.1);
    const techView = useInView(0.1);
    const crisisView = useInView(0.1);

    const texts = {
        navTitle: 'Nyaya Mitra',
        badge: language === 'en' ? 'Free & Anonymous Legal Help' : 'मुफ़्त और अनाम कानूनी सहायता',
        heroTitle1: language === 'en' ? 'Know Your Rights.' : 'अपने अधिकार जानें।',
        heroDesc: language === 'en'
            ? 'Get instant legal guidance in Hindi or English. AI-powered, anonymous, and completely free.'
            : 'हिंदी या अंग्रेजी में तुरंत कानूनी मार्गदर्शन प्राप्त करें। AI द्वारा संचालित, पूरी तरह से अनाम, और बिल्कुल मुफ़्त।',
        btnStart: language === 'en' ? 'Start Free Consultation' : 'मुफ्त परामर्श शुरू करें',
        btnGuest: language === 'en' ? 'Try as Guest (5 free questions)' : 'अतिथि के रूप में आज़माएं',
        featTitle: language === 'en' ? 'Everything You Need' : 'वह सब कुछ जो आपको चाहिए',
        featDesc: language === 'en' ? 'From understanding your rights to filing complaints — all in one place.' : 'अपने अधिकारों को समझने से लेकर शिकायत दर्ज करने तक — सब एक जगह।',
        howTitle: language === 'en' ? 'How It Works' : 'यह कैसे काम करता है',
        caseTitle: language === 'en' ? 'How People Use Nyaya Mitra' : 'लोग न्याय मित्र कैसे इस्तेमाल करते हैं',
        techTitle: language === 'en' ? 'Powered by Trusted Technology' : 'भरोसेमंद टेक्नोलॉजी द्वारा संचालित',
        ctaTitle: language === 'en' ? 'Start your free consultation' : 'अपना मुफ्त परामर्श शुरू करें',
        ctaDesc: language === 'en' ? 'Understand your legal situation in minutes. Ask a question now.' : 'मिनटों में अपनी कानूनी स्थिति समझें। अभी अपना सवाल पूछें।',
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-[#E87D20]/30 selection:text-white">

            {/* ═══ Background Effects ═══ */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#121827] via-[#050505] to-[#050505] pointer-events-none z-0"></div>
            <ConstellationParticles />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#E87D20]/20 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse-slow pointer-events-none z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#121827] rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-pulse-slow pointer-events-none z-0" style={{ animationDelay: '3s' }}></div>

            {/* ═══ Header ═══ */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-[#090C15]/90 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border-b border-[#1E293B]' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#121827] border border-[#1E293B] flex items-center justify-center text-lg shadow-[0_0_10px_rgba(255,255,255,0.05)]">⚖️</div>
                        <span className="text-xl font-extrabold font-display tracking-tight text-white">{texts.navTitle}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[#121827]/50 p-1 rounded-full border border-[#1E293B]">
                            <button
                                onClick={() => language !== 'en' && toggleLang()}
                                className={`px-4 py-1.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${language === 'en' ? 'bg-[#E87D20]/10 border border-[#E87D20]/50 text-[#E87D20] shadow-[0_0_15px_rgba(232,125,32,0.15)]' : 'border border-transparent text-[#8B95A5] hover:text-white'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => language !== 'hi' && toggleLang()}
                                className={`px-4 py-1.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${language === 'hi' ? 'bg-[#E87D20]/10 border border-[#E87D20]/50 text-[#E87D20] shadow-[0_0_15px_rgba(232,125,32,0.15)]' : 'border border-transparent text-[#8B95A5] hover:text-white'}`}
                            >
                                हिंदी
                            </button>
                        </div>
                        <Link to="/login" className="hidden sm:inline-flex items-center justify-center px-6 py-2 rounded-full text-white font-bold text-sm bg-[linear-gradient(to_right,#E87D20,#FF512F)] hover:bg-[linear-gradient(to_right,#FF512F,#E87D20)] shadow-[0_4px_20px_-2px_rgba(232,125,32,0.5)] transition-all hover:scale-105 active:scale-95">
                            {t('landing.get_started')}
                        </Link>
                    </div>
                </div>
            </header>

            {/* ═══ HERO SECTION ═══ */}
            <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121827] border border-[#1E293B] text-[#8B95A5] text-sm font-medium mb-8 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                    style={{ transform: `translateY(${scrollY * 0.1}px)`, opacity: Math.max(0, 1 - scrollY * 0.002) }}>
                    <span className="w-2.5 h-2.5 bg-[#E87D20] rounded-full animate-pulse shadow-[0_0_8px_rgba(232,125,32,0.8)]"></span>
                    {texts.badge}
                </div>

                <div style={{ transform: `translateY(${scrollY * 0.12}px)`, opacity: Math.max(0, 1 - scrollY * 0.0015) }}>
                    <h1 className="text-6xl sm:text-8xl lg:text-[7rem] font-extrabold font-display text-white tracking-tight">
                        {texts.heroTitle1}
                    </h1>
                </div>

                <p className="text-lg sm:text-xl text-[#8B95A5] mt-6 max-w-2xl mx-auto font-medium"
                    style={{ transform: `translateY(${scrollY * 0.1}px)`, opacity: Math.max(0, 1 - scrollY * 0.0015) }}>
                    {texts.heroDesc}
                </p>

                {/* Prompt Box */}
                <div className="mt-10" style={{ transform: `translateY(${scrollY * 0.08}px)`, opacity: Math.max(0, 1 - scrollY * 0.002) }}>
                    <div className="inline-flex items-center justify-center pl-6 pr-2 py-2 rounded-full bg-[#0D1220] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-[64px]">
                        <span className="text-[#8B95A5] font-bold text-[13px] tracking-[0.2em] uppercase mr-4">PROMPT</span>
                        <div className="bg-[#4A2D35] h-full flex items-center px-4 rounded text-white font-medium text-xl border border-[#E87D20]/20 shadow-inner">
                            <TypingText
                                texts={[
                                    language === 'en' ? 'How to file RTI for road repair' : 'सड़क मरम्मत के लिए RTI कैसे लिखें',
                                    language === 'en' ? 'How to file an FIR online' : 'ऑनलाइन FIR कैसे दर्ज करें',
                                    language === 'en' ? 'Can my landlord evict me' : 'क्या मकान मालिक मुझे निकाल सकता है',
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 mt-14"
                    style={{ transform: `translateY(${scrollY * 0.06}px)`, opacity: Math.max(0, 1 - scrollY * 0.0015) }}>
                    <Link to="/login" className="group flex items-center justify-center gap-3 px-10 py-4 rounded-full text-white font-bold text-lg bg-[linear-gradient(to_right,#E87D20,#FF512F)] hover:bg-[linear-gradient(to_right,#FF512F,#E87D20)] shadow-[0_4px_20px_-2px_rgba(232,125,32,0.5)] transition-all hover:scale-105 active:scale-95">
                        {texts.btnStart}
                        <svg className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                    <Link to="/login?guest=true" className="px-10 py-4 rounded-full font-bold text-white border border-[#1E293B] bg-[#090C15] hover:bg-[#121827] hover:text-[#E87D20] transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                        {texts.btnGuest}
                    </Link>
                </div>
            </section>

            {/* ═══ LIVE DEMO + STATS ═══ */}
            <section className="relative z-10 px-6 py-24 max-w-7xl mx-auto border-t border-[#1E293B]">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#121827] border border-[#1E293B] text-[#E87D20] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                            Live Demo
                        </span>
                        <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-white leading-tight mb-6">
                            {language === 'en' ? 'See It In Action' : 'देखें कैसे काम करता है'}
                        </h2>
                        <p className="text-lg text-[#8B95A5] leading-relaxed mb-10 max-w-md">
                            {language === 'en'
                                ? 'Real example: Watch how Nyaya Mitra analyzes the law, verifies the answer instantly, and provides actionable next steps.'
                                : 'असली उदाहरण: देखें न्याय मित्र कैसे कानून का विश्लेषण करता है और तुरंत सही समाधान देता है।'}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {IMPACT_STATS.map((stat, i) => (
                                <StatCard key={i} {...stat} />
                            ))}
                        </div>
                    </div>
                    <LiveChatDemo />
                </div>
            </section>

            {/* ═══ WHY INDIA NEEDS THIS ═══ */}
            <section ref={crisisView.ref} className="relative z-10 px-6 py-24 border-t border-[#1E293B] bg-[#0D1220]/50">
                <div className="max-w-5xl mx-auto">
                    <div className={`text-center mb-16 transition-all duration-1000 ${crisisView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#121827] border border-[#E87D20]/50 text-[#E87D20] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(232,125,32,0.15)]">
                            {language === 'en' ? 'The Problem' : 'समस्या'}
                        </span>
                        <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-white leading-tight">
                            {language === 'en' ? 'Why India Needs Nyaya Mitra' : 'भारत को न्याय मित्र की जरूरत क्यों है'}
                        </h2>
                        <p className="text-[#8B95A5] mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
                            {language === 'en'
                                ? 'India\'s justice system is overwhelmed. Millions are denied access to legal help. Real numbers from government reports.'
                                : 'भारत की न्याय व्यवस्था पर बोझ है। करोड़ों लोगों को कानूनी मदद नहीं मिलती। सरकारी रिपोर्ट के आंकड़े।'}
                        </p>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-200 ${crisisView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {INDIA_LEGAL_STATS.map((stat, i) => (
                            <CrisisStatCard key={i} {...stat} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Features Grid ═══ */}
            <section id="features" ref={featuresView.ref} className="relative z-10 px-6 py-24 max-w-7xl mx-auto border-t border-[#1E293B]">
                <div className={`text-center mb-20 transition-all duration-1000 ${featuresView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#121827] border border-[#1E293B] text-[#8B95A5] text-xs font-bold tracking-widest uppercase mb-6">
                        Features
                    </span>
                    <h2 className="text-4xl sm:text-6xl font-extrabold font-display text-white">
                        {texts.featTitle}
                    </h2>
                    <p className="text-[#8B95A5] mt-4 text-lg">{texts.featDesc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((f, i) => (
                        <Link
                            to="/login"
                            key={i}
                            className={`bg-[#0D1220] border border-[#1E293B] block p-8 rounded-3xl group cursor-pointer shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
                                ${featuresView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            <div className="w-14 h-14 bg-[#121827] border border-[#E87D20]/40 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:scale-110 transition-transform duration-300">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold font-display text-white mb-2 tracking-wide group-hover:text-[#E87D20] transition-colors">
                                {t(f.titleKey)}
                            </h3>
                            <p className="text-[15px] text-[#8B95A5] leading-relaxed font-medium">
                                {t(f.descKey)}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ═══ How It Works ═══ */}
            <section id="how-it-works" ref={stepsView.ref} className="relative z-10 px-6 py-24 max-w-6xl mx-auto border-t border-[#1E293B] bg-[#0D1220]/50 rounded-[3rem]">
                <div className={`text-center mb-20 transition-all duration-1000 ${stepsView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#121827] border border-[#1E293B] text-[#8B95A5] text-xs font-bold tracking-widest uppercase mb-6">
                        Simple Process
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-white">{texts.howTitle}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 relative">
                    <div className={`hidden sm:block absolute top-[3rem] left-[20%] right-[20%] h-px bg-[linear-gradient(to_right,#E87D20,#FF512F)] transition-all duration-1500 ${stepsView.inView ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} style={{ transformOrigin: 'left' }}></div>
                    {STEPS.map((s, i) => (
                        <div key={i} className={`text-center relative group transition-all duration-700 ${stepsView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 200 + 300}ms` }}>
                            <div className="w-[6rem] h-[6rem] mx-auto bg-[#050505] border-2 border-[#E87D20] rounded-[2rem] flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(232,125,32,0.3)] mb-6 relative z-10 group-hover:bg-[#121827] transition-colors">
                                <span className="relative z-10">{s.icon}</span>
                            </div>
                            <div className="text-[11px] font-bold text-[#E87D20] tracking-[0.2em] mb-2 uppercase">STEP {s.num}</div>
                            <h3 className="text-xl font-bold font-display text-white mb-3">{t(s.titleKey)}</h3>
                            <p className="text-sm text-[#8B95A5] leading-relaxed max-w-[250px] mx-auto">{t(s.descKey)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section className="relative z-10 px-6 py-24 border-t border-[#1E293B]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-white">
                            {texts.caseTitle}
                        </h2>
                    </div>
                    <div className="relative max-w-3xl mx-auto h-[280px]">
                        {TESTIMONIAL_SCENARIOS.map((t_item, i) => (
                            <div key={i} className={`transition-all duration-1000 absolute inset-0 ${i === activeTestimonial ? 'opacity-100 translate-y-0 scale-100 z-10' : 'opacity-0 translate-y-8 scale-95 z-0 pointer-events-none'}`}>
                                <div className="bg-[#090C15]/80 border border-[#1E293B] rounded-[2.5rem] p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-full flex flex-col justify-center relative overflow-hidden">
                                    <div className="flex items-start gap-6 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-[#121827] border border-[#E87D20]/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(232,125,32,0.15)] flex-shrink-0">
                                            {t_item.emoji}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{t_item.persona}</div>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-[#E87D20] text-sm">★</span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <blockquote className="text-white text-xl leading-relaxed font-display">
                                        "{language === 'en' ? t_item.quoteEn : t_item.quote}"
                                    </blockquote>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-2 mt-10">
                        {TESTIMONIAL_SCENARIOS.map((_, i) => (
                            <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeTestimonial ? 'bg-[#E87D20] w-8 shadow-[0_0_8px_rgba(232,125,32,0.8)]' : 'bg-[#1E293B] w-3 hover:bg-[#8B95A5]'}`} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Technology ═══ */}
            <section id="technology" ref={techView.ref} className="relative z-10 px-6 py-24 border-t border-[#1E293B]">
                <div className={`text-center mb-16 transition-all duration-1000 ${techView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#121827] border border-[#1E293B] text-[#8B95A5] text-xs font-bold tracking-widest uppercase mb-6">
                        Technology
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                        {texts.techTitle}
                    </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                    {POWERED_BY.map((tech, i) => (
                        <div key={i} className={`bg-[#0D1220] border border-[#1E293B] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-[1.5rem] flex items-center gap-4 transition-all duration-700 hover:-translate-y-1 group ${techView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                            <div className="w-12 h-12 bg-[#121827] border border-[#1E293B] group-hover:border-[#E87D20] rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-colors">
                                {tech.icon}
                            </div>
                            <div className="text-left">
                                <div className="text-base font-bold text-white font-display group-hover:text-[#E87D20] transition-colors">{tech.name}</div>
                                <div className="text-xs text-[#8B95A5] mt-0.5">{tech.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Footer ═══ */}
            <footer className="relative z-10 px-6 pt-24 pb-12 bg-[#090C15]/90 backdrop-blur-md border-t border-[#1E293B]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left mb-16">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-display text-white">{language === 'en' ? 'Nyaya Mitra' : 'न्याय मित्र'}</h3>
                            <p className="text-sm text-[#8B95A5] leading-relaxed">
                                {language === 'en' ? 'Empowering citizens with AI-driven legal guidance.' : 'नागरिकों को AI-आधारित कानूनी मार्गदर्शन के साथ सशक्त बनाना।'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold font-display text-white">{language === 'en' ? 'Legal' : 'कानूनी'}</h3>
                            <ul className="space-y-3 text-sm font-medium text-[#8B95A5]">
                                <li><a href="#" className="hover:text-[#E87D20] transition-colors">{language === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}</a></li>
                                <li><a href="#" className="hover:text-[#E87D20] transition-colors">{language === 'en' ? 'Terms of Service' : 'सेवा की शर्तें'}</a></li>
                            </ul>
                        </div>

                        <div className="flex flex-col items-start md:items-end justify-start space-y-5">
                            <h3 className="text-xl font-bold font-display text-white">{texts.ctaTitle}</h3>
                            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-white font-bold text-sm bg-[linear-gradient(to_right,#E87D20,#FF512F)] hover:bg-[linear-gradient(to_right,#FF512F,#E87D20)] shadow-[0_4px_20px_-2px_rgba(232,125,32,0.5)] transition-all hover:scale-105">
                                {texts.btnStart}
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8B95A5] font-medium">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#121827] border border-[#1E293B] flex items-center justify-center text-xs">⚖️</div>
                            <p>&copy; 2026 Nyaya Mitra &mdash; AI for Bharat</p>
                        </div>
                        <div className="flex items-center gap-2">
                            Built with <span className="text-red-500 animate-pulse text-lg">♥</span> for India
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
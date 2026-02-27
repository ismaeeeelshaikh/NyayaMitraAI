import { useState, useRef, useEffect } from 'react'
import './Chat.css'

const SAMPLE_RESPONSES = {
    default: "Namaste! Main Nyaya Mitra hoon — aapka AI legal assistant. Apna legal issue batayein, main aapki madad karunga. Aap Hindi ya English dono mein baat kar sakte hain.",
    salary: "**Aapke paas ye rights hain:**\n\n1. **Payment of Wages Act 1936** — Salary har mahine ki 7th ya 10th tak milni chahiye\n2. **Labour Commissioner** ke paas complaint file karein\n3. **Labour Court** mein case file kar sakte hain\n\n**Next Steps:**\n- Employer ko pehle written complaint dein\n- Salary slips aur bank statements rakhein as evidence\n- Helpline: **14441** (National Labor Helpline)\n\n📄 *Kya main aapke liye complaint letter draft karun?*",
    consumer: "**Consumer Protection Act 2019** ke under aap complaint file kar sakte hain:\n\n1. **Online File Karein**: edaakhil.nic.in\n2. **Helpline**: 1915 (National Consumer Helpline)\n3. **District Consumer Forum** mein jaayein\n\n**Filing Fee:**\n- Rs. 5 lakh tak: sirf Rs. 200\n- Rs. 10 lakh tak: Rs. 400\n\n**Documents chahiye:**\n- Bill/Receipt\n- Product photos\n- Seller se communication\n\n📄 *Kya main complaint draft banaun?*",
}

function Chat() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'bot',
            content: SAMPLE_RESPONSES.default,
            timestamp: new Date().toISOString()
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [language, setLanguage] = useState('hi')
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const getResponse = (text) => {
        const lower = text.toLowerCase()
        if (lower.includes('salary') || lower.includes('wages') || lower.includes('payment') || lower.includes('nahi mili')) {
            return SAMPLE_RESPONSES.salary
        }
        if (lower.includes('consumer') || lower.includes('product') || lower.includes('refund') || lower.includes('defect')) {
            return SAMPLE_RESPONSES.consumer
        }
        return "Main aapka issue samajh raha hoon. Kripya thoda aur detail mein batayein:\n\n- **Issue kya hai?** (property, family, salary, consumer, cyber crime)\n- **Kab se hai?** (kitne din/mahine pehle hua)\n- **Kya action liya?** (police, lawyer se baat ki?)\n\nJitna detail denge, utni achhi guidance milegi."
    }

    const handleSend = () => {
        if (!input.trim()) return

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsTyping(true)

        // Simulate AI response — TODO: Member 2 will connect to actual API
        setTimeout(() => {
            const botResponse = {
                id: Date.now() + 1,
                role: 'bot',
                content: getResponse(userMsg.content),
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, botResponse])
            setIsTyping(false)
        }, 1500)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const formatMessage = (content) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br />')
    }

    return (
        <div className="chat-page">
            {/* ── Chat Header ── */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <span className="chat-avatar">⚖️</span>
                    <div>
                        <h2>Nyaya Mitra</h2>
                        <span className="chat-status">
                            <span className="status-dot"></span> Online — Ready to help
                        </span>
                    </div>
                </div>
                <div className="chat-header-right">
                    <button
                        className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                        onClick={() => setLanguage('hi')}
                    >
                        हिंदी
                    </button>
                    <button
                        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                        onClick={() => setLanguage('en')}
                    >
                        English
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Voice Mode">
                        🎤
                    </button>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="quick-actions">
                <button className="quick-chip" onClick={() => setInput('Meri salary nahi mili')}>
                    💰 Salary Issue
                </button>
                <button className="quick-chip" onClick={() => setInput('Consumer complaint karna hai')}>
                    🛒 Consumer Complaint
                </button>
                <button className="quick-chip" onClick={() => setInput('Property dispute hai')}>
                    🏠 Property Dispute
                </button>
                <button className="quick-chip" onClick={() => setInput('Cyber crime hua hai')}>
                    💻 Cyber Crime
                </button>
                <button className="quick-chip" onClick={() => setInput('RTI file karna hai')}>
                    📋 RTI Application
                </button>
                <button className="quick-chip" onClick={() => setInput('Legal notice mila hai')}>
                    📜 Legal Notice
                </button>
            </div>

            {/* ── Messages ── */}
            <div className="messages-container">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.role}`}>
                        {msg.role === 'bot' && <span className="msg-avatar">⚖️</span>}
                        <div
                            className="msg-bubble"
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        />
                    </div>
                ))}
                {isTyping && (
                    <div className="message bot">
                        <span className="msg-avatar">⚖️</span>
                        <div className="msg-bubble typing">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <textarea
                        className="chat-input"
                        placeholder={language === 'hi' ? 'Apna issue yahan likhein...' : 'Type your legal question...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={1}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim()}
                    >
                        ➤
                    </button>
                </div>
                <p className="chat-disclaimer">
                    ⚠️ Nyaya Mitra AI guidance deta hai, professional legal advice nahi. Serious cases mein lawyer se milein.
                </p>
            </div>
        </div>
    )
}

export default Chat

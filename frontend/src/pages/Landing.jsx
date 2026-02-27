import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
    return (
        <div className="landing">
            {/* ── Navbar ── */}
            <nav className="landing-nav glass">
                <div className="container nav-content">
                    <div className="nav-brand">
                        <span className="nav-logo">⚖️</span>
                        <span className="nav-title">Nyaya Mitra</span>
                    </div>
                    <div className="nav-links">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#how-it-works" className="nav-link">How It Works</a>
                        <Link to="/login" className="btn btn-primary btn-sm">Login / Register</Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="hero">
                <div className="hero-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>
                <div className="container hero-content">
                    <div className="hero-text animate-slide-up">
                        <div className="hero-badge">
                            <span>🇮🇳</span> AI for Bharat — Empowering Justice
                        </div>
                        <h1 className="hero-title">
                            Your AI-Powered<br />
                            <span className="text-gradient">Legal Assistant</span>
                        </h1>
                        <p className="hero-subtitle">
                            Free legal guidance in Hindi & English. Understand your rights,
                            file complaints, and connect with legal aid — all through a simple conversation.
                        </p>
                        <div className="hero-actions">
                            <Link to="/chat" className="btn btn-accent btn-lg">
                                💬 Start Free Chat
                            </Link>
                            <Link to="/chat" className="btn btn-outline btn-lg">
                                🎤 Voice Mode
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-number">6+</span>
                                <span className="stat-label">Legal Categories</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat">
                                <span className="stat-number">2</span>
                                <span className="stat-label">Languages</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Available</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual animate-fade-in">
                        <div className="chat-preview">
                            <div className="chat-preview-header">
                                <div className="preview-dot"></div>
                                <span>Nyaya Mitra Chat</span>
                            </div>
                            <div className="chat-preview-body">
                                <div className="preview-msg user">
                                    Meri salary 3 mahine se nahi mili hai, kya karu?
                                </div>
                                <div className="preview-msg bot">
                                    <strong>Aapke paas ye rights hain:</strong><br />
                                    1. Payment of Wages Act ke under complaint<br />
                                    2. Labour Commissioner ke paas jaayein<br />
                                    3. Labour Court mein case file karein<br />
                                    <span className="preview-action">📄 Complaint Draft Generate Karein →</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section id="features" className="features-section">
                <div className="container">
                    <h2 className="section-title">
                        Kya Kar Sakta Hai <span className="text-gradient">Nyaya Mitra?</span>
                    </h2>
                    <p className="section-subtitle">
                        Ek hi platform pe saari legal help — bilkul free
                    </p>
                    <div className="features-grid">
                        <div className="feature-card card">
                            <div className="feature-icon">💬</div>
                            <h3>AI Legal Chat</h3>
                            <p>Apna issue batao Hindi ya English mein, AI turant legal guidance dega with relevant laws aur next steps.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">📄</div>
                            <h3>Complaint Generator</h3>
                            <p>Auto-generated complaint letters with proper legal format — download as PDF, direct authority ko bhejo.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">🎤</div>
                            <h3>Voice Mode</h3>
                            <p>Bol ke batao apna issue — AI sunke samjhega aur voice mein jawab dega. Perfect for low-literacy users.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">📜</div>
                            <h3>Notice Analyzer</h3>
                            <p>Legal notice mila? Photo upload karo — AI padhega, deadline batayega, aur response draft karega.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">🗺️</div>
                            <h3>Legal Aid Finder</h3>
                            <p>Apne state/district ke nearest legal aid office dhundho — FREE government legal help milegi.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">🔒</div>
                            <h3>Privacy First</h3>
                            <p>Anonymous mode aur stealth mode — koi trace nahi. Domestic violence cases ke liye designed.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="how-section">
                <div className="container">
                    <h2 className="section-title">
                        Kaise Kaam Karta Hai?
                    </h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Issue Batao</h3>
                            <p>Type karo ya voice mein bolo — Hindi, English, ya Hinglish mein</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>AI Analysis</h3>
                            <p>AI relevant laws dhundhta hai aur risk assess karta hai</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Guidance + Action</h3>
                            <p>Legal steps bataye, complaint draft kare, ya legal aid connect kare</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2>Apna Legal Issue Solve Karo — Abhi!</h2>
                        <p>Registration optional hai. Guest ke roop mein bhi 5 queries free hain.</p>
                        <Link to="/chat" className="btn btn-accent btn-lg">
                            💬 Chat Shuru Karo — Free Hai
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="footer">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <span>⚖️ Nyaya Mitra</span>
                        <p>AI for Bharat — Justice for All</p>
                    </div>
                    <div className="footer-links">
                        <span>Built for AI for Bharat Hackathon 🇮🇳</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Landing

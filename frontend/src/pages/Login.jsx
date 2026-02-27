import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' })
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        // TODO: Cognito authentication connect karenge — Member 4
        console.log('Form submitted:', formData)
        navigate('/chat')
    }

    const handleGuestAccess = () => {
        // TODO: Guest session create karenge — Member 4
        navigate('/chat')
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <Link to="/" className="login-back">← Back to Home</Link>
                <div className="login-hero">
                    <span className="login-emoji">⚖️</span>
                    <h1>Nyaya Mitra</h1>
                    <p>AI-powered legal guidance — free for all Indian citizens</p>
                    <div className="login-features">
                        <div className="login-feature">✅ Free legal chat in Hindi & English</div>
                        <div className="login-feature">✅ Auto-generate complaint letters</div>
                        <div className="login-feature">✅ Privacy-first — anonymous mode available</div>
                        <div className="login-feature">✅ Connect with free legal aid</div>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-card card">
                    <div className="login-tabs">
                        <button
                            className={`login-tab ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Login
                        </button>
                        <button
                            className={`login-tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {!isLogin && (
                            <div className="input-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    className="input-field"
                                    placeholder="Aapka naam"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div className="input-group">
                                <label htmlFor="phone">Phone (Optional)</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    className="input-field"
                                    placeholder="+91 XXXXX XXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary login-submit">
                            {isLogin ? 'Login' : 'Create Account'}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>or</span>
                    </div>

                    <button onClick={handleGuestAccess} className="btn btn-outline guest-btn">
                        👤 Continue as Guest (5 Free Queries)
                    </button>

                    <p className="login-note">
                        Guest users get 5 free queries. Register for unlimited access.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login

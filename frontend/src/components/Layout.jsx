import { Outlet, NavLink, Link } from 'react-router-dom'
import './Layout.css'

function Layout() {
    return (
        <div className="layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <Link to="/" className="sidebar-brand">
                    <span className="sidebar-logo">⚖️</span>
                    <span className="sidebar-title">Nyaya Mitra</span>
                </Link>

                <nav className="sidebar-nav">
                    <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span className="sidebar-icon">💬</span>
                        <span>AI Chat</span>
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span className="sidebar-icon">📊</span>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/documents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span className="sidebar-icon">📁</span>
                        <span>Documents</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">👤</div>
                        <div className="user-info">
                            <span className="user-name">Guest User</span>
                            <span className="user-role">5 queries remaining</span>
                        </div>
                    </div>
                    <Link to="/login" className="btn btn-outline btn-sm sidebar-login-btn">
                        Login / Register
                    </Link>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout

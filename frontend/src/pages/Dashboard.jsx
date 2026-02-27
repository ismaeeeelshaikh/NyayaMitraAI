import './Dashboard.css'

function Dashboard() {
    // TODO: Member 4 — Connect to real DynamoDB data via API
    const stats = [
        { label: 'Total Queries', value: '1,247', icon: '💬', change: '+12%' },
        { label: 'Complaints Filed', value: '89', icon: '📄', change: '+5%' },
        { label: 'Active Users (Today)', value: '342', icon: '👥', change: '+8%' },
        { label: 'Avg Risk Score', value: '42.3', icon: '⚠️', change: '-3%' },
    ]

    const recentIssues = [
        { type: 'Property', count: 312, percentage: 28, color: '#5c6bc0' },
        { type: 'Family/DV', count: 245, percentage: 22, color: '#ef5350' },
        { type: 'Consumer', count: 198, percentage: 18, color: '#ff9933' },
        { type: 'Labor', count: 156, percentage: 14, color: '#26a69a' },
        { type: 'Cyber Crime', count: 112, percentage: 10, color: '#7e57c2' },
        { type: 'RTI', count: 90, percentage: 8, color: '#42a5f5' },
    ]

    const recentEscalations = [
        { id: 'ESC-001', issue: 'Domestic Violence - HIGH Risk', state: 'MH', status: 'Referred', time: '2 hrs ago' },
        { id: 'ESC-002', issue: 'Sextortion - Immediate Action', state: 'DL', status: 'Escalated', time: '4 hrs ago' },
        { id: 'ESC-003', issue: 'Child Labor Report', state: 'UP', status: 'Pending', time: '6 hrs ago' },
    ]

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Nyaya Mitra Analytics Overview</p>
            </div>

            {/* ── Stats Cards ── */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card card">
                        <div className="stat-card-icon">{stat.icon}</div>
                        <div className="stat-card-content">
                            <span className="stat-card-label">{stat.label}</span>
                            <span className="stat-card-value">{stat.value}</span>
                            <span className={`stat-card-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                {stat.change} this week
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                {/* ── Issue Distribution ── */}
                <div className="card dashboard-card">
                    <h3>📊 Issue Distribution (30 days)</h3>
                    <div className="issue-bars">
                        {recentIssues.map((issue, i) => (
                            <div key={i} className="issue-bar-row">
                                <span className="issue-label">{issue.type}</span>
                                <div className="issue-bar-track">
                                    <div
                                        className="issue-bar-fill"
                                        style={{ width: `${issue.percentage}%`, background: issue.color }}
                                    ></div>
                                </div>
                                <span className="issue-count">{issue.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Recent Escalations ── */}
                <div className="card dashboard-card">
                    <h3>🚨 Recent Escalations</h3>
                    <div className="escalation-list">
                        {recentEscalations.map((esc, i) => (
                            <div key={i} className="escalation-item">
                                <div className="escalation-info">
                                    <span className="escalation-id">{esc.id}</span>
                                    <span className="escalation-issue">{esc.issue}</span>
                                    <span className="escalation-meta">{esc.state} · {esc.time}</span>
                                </div>
                                <span className={`badge ${esc.status === 'Escalated' ? 'badge-danger' : esc.status === 'Referred' ? 'badge-warning' : 'badge-success'}`}>
                                    {esc.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Top States ── */}
            <div className="card dashboard-card">
                <h3>🗺️ Top States by Queries</h3>
                <div className="states-grid">
                    {[
                        { state: 'Maharashtra', queries: 423, icon: '🏛️' },
                        { state: 'Delhi', queries: 387, icon: '🏛️' },
                        { state: 'Uttar Pradesh', queries: 312, icon: '🏛️' },
                        { state: 'Karnataka', queries: 198, icon: '🏛️' },
                        { state: 'Tamil Nadu', queries: 156, icon: '🏛️' },
                        { state: 'Rajasthan', queries: 134, icon: '🏛️' },
                    ].map((s, i) => (
                        <div key={i} className="state-item">
                            <span className="state-rank">#{i + 1}</span>
                            <span className="state-name">{s.state}</span>
                            <span className="state-queries">{s.queries} queries</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Dashboard

import './Documents.css'

function Documents() {
    // TODO: Member 3 & 4 — Connect to real API
    const documents = [
        {
            id: 1,
            title: 'Complaint Letter - Salary Non-Payment',
            type: 'complaint',
            date: '2026-02-25',
            status: 'Ready',
            icon: '📄'
        },
        {
            id: 2,
            title: 'Consumer Complaint - Defective Product',
            type: 'complaint',
            date: '2026-02-24',
            status: 'Ready',
            icon: '📄'
        },
        {
            id: 3,
            title: 'Legal Notice Response Draft',
            type: 'notice',
            date: '2026-02-23',
            status: 'Under Review',
            icon: '📜'
        },
        {
            id: 4,
            title: 'Case Timeline - Property Dispute',
            type: 'timeline',
            date: '2026-02-22',
            status: 'Ready',
            icon: '🗓️'
        },
        {
            id: 5,
            title: 'RTI Application Draft',
            type: 'rti',
            date: '2026-02-21',
            status: 'Ready',
            icon: '📋'
        }
    ]

    return (
        <div className="documents-page">
            <div className="documents-header">
                <div>
                    <h1>My Documents</h1>
                    <p>Aapke saare generated documents yahan hain</p>
                </div>
                <button className="btn btn-primary">
                    📤 Upload Notice
                </button>
            </div>

            {/* ── Filter Tabs ── */}
            <div className="doc-filters">
                <button className="doc-filter active">All</button>
                <button className="doc-filter">📄 Complaints</button>
                <button className="doc-filter">📜 Notices</button>
                <button className="doc-filter">🗓️ Timelines</button>
                <button className="doc-filter">📋 RTI</button>
            </div>

            {/* ── Documents List ── */}
            <div className="documents-list">
                {documents.map((doc) => (
                    <div key={doc.id} className="document-item card">
                        <div className="doc-icon">{doc.icon}</div>
                        <div className="doc-info">
                            <h3>{doc.title}</h3>
                            <span className="doc-date">{doc.date}</span>
                        </div>
                        <span className={`badge ${doc.status === 'Ready' ? 'badge-success' : 'badge-warning'}`}>
                            {doc.status}
                        </span>
                        <div className="doc-actions">
                            <button className="btn btn-ghost btn-sm" title="Download PDF">
                                ⬇️ PDF
                            </button>
                            <button className="btn btn-ghost btn-sm" title="Share">
                                📤
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Empty State ── */}
            {documents.length === 0 && (
                <div className="doc-empty">
                    <span className="doc-empty-icon">📁</span>
                    <h3>Koi document nahi hai</h3>
                    <p>Chat mein complaint generate karein — woh yahan dikhega</p>
                </div>
            )}
        </div>
    )
}

export default Documents

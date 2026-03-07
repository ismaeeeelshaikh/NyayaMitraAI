// ── Session ──
export interface Session {
    session_id: string;
    user_id: string;
    language: 'en' | 'hi';
    anonymous_mode: boolean;
    stealth_mode: boolean;
    queries_count: number;
    query_limit_remaining: number;
    location_state?: string;
    location_district?: string;
}

// ── Chat Message ──
export interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: string;
    isStreaming?: boolean;
    confidence_score?: number;
    confidence_label?: string;
    confidence_color?: 'green' | 'teal' | 'yellow' | 'orange';
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
    risk_score?: number;
    citations?: Citation[];
    recommended_actions?: RecommendedAction[];
    crisis_resources?: CrisisResources;
}

export interface Citation {
    index: number;
    source: string;
    category: string;
    relevance: string;
}

export interface RecommendedAction {
    action_type: string;
    priority: string;
    timeline: string;
    reasoning: string;
    steps: string[];
    cost: string;
    system_route: string;
    can_do_now: boolean;
}

export interface CrisisResources {
    message: string;
    helplines: { name: string; number: string }[];
}

// ── Timeline ──
export interface TimelineEvent {
    date: string;
    event: string;
    legal_significance: string;
    category: 'incident' | 'action' | 'response' | 'deadline' | 'evidence';
}

export interface Timeline {
    timeline_id: string;
    timeline: TimelineEvent[];
    gaps: string[];
    issue_type: string;
    summary: string;
}

// ── Notice Analysis ──
export interface NoticeAnalysis {
    notice_id: string;
    processing_status: 'processing' | 'completed' | 'failed';
    notice_type?: string;
    sender_details?: { name: string; is_lawyer: boolean; is_court: boolean; is_bank: boolean };
    response_deadline_date?: string;
    deadline_status?: 'OVERDUE' | 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'UNKNOWN';
    days_remaining?: number;
    deadline_color?: string;
    deadline_label?: string;
    risk_score?: number;
    risk_level?: 'HIGH' | 'MEDIUM' | 'LOW';
    demands?: string[];
    consequences_if_ignored?: string[];
    recommended_actions?: string;
    legal_sections_cited?: string[];
}

// ── Legal Aid Partner ──
export interface LegalAidPartner {
    partner_id: string;
    organization_name: string;
    type: 'govt' | 'ngo';
    state: string;
    district: string;
    phone: string;
    email: string;
    address: string;
    specializations: string[];
    languages_supported: string[];
    rating: number;
    free_service: boolean;
    eligibility_criteria: string;
    current_case_load: number;
    max_capacity: number; /* Capacity checking */
}

// ── Dashboard ──
export interface DashboardData {
    popular_issues: { issue_type: string; count: number; display_name: string; trend: string }[];
    suggested_actions: { action: string; route: string; icon: string }[];
    legal_updates: { date: string; title: string; summary: string; category: string }[];
}

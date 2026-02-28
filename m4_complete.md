# ╔══════════════════════════════════════════════════════════════╗
# ║         NYAYA MITRA — MEMBER 4 DETAILED REPORT             ║
# ║         Frontend React Application — 7 Pages               ║
# ║         Budget Version: ~$100 Total Project Budget          ║
# ╚══════════════════════════════════════════════════════════════╝

---

## 1. TUMHARA ROLE KYA HAI

Tum is project ka **"chehra"** ho. User sabse pehle tumhara kaam dekhta hai. Chahe backend kitna bhi powerful ho, agar UI bekaar hai toh judges impress nahi honge. Tumhara kaam hai ek aise React app banana jo:

- Hindi aur English dono mein kaam kare
- Mobile pe bhi achhi lage (mobile-first design)
- Real API calls kare (mock nahi)
- Demo mein slick aur professional dikhe

**Tumhara scope — 7 Pages:**
1. `/entry`               — Language select + mode select + stealth mode
2. `/dashboard`           — Quick navigation + popular issues + legal updates
3. `/chat`                — Real-time WebSocket chat with AI
4. `/timeline`            — Case timeline builder + PDF export
5. `/complaint-generator` — 6 types ka complaint form + PDF download
6. `/notice-scanner`      — Document upload + AI analysis results
7. `/legal-aid`           — Legal aid partner directory + emergency mode

**Key Features:**
- Hindi ↔ English instant toggle (i18n — sirf ek button)
- Stealth Mode: Logo pe 3 rapid taps → Calculator disguise
- Voice Mode: Mic button → Transcribe → chat; Speaker → Polly TTS
- Crisis Button: Floating red button — ALWAYS visible on every page
- Guest Limit: "5 questions remaining" auto banner
- Confidence Badges: Color-coded (green/yellow/orange)
- Risk Badges: 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH
- Action Cards: "Do This Now" with step-by-step guidance

**Budget mein tumhara contribution:** ~$2/month (S3 + CloudFront hosting)

**Dependencies — Member 1 se lo PEHLE:**
- `.env.shared` → `frontend/.env.local` banao (VITE_ prefix lagao)
- `FRONTEND_BUCKET` name
- `HTTP_API_URL` + `WEBSOCKET_URL`
- `COGNITO_USER_POOL_ID` + `COGNITO_CLIENT_ID`

---

## 2. COMPLETE FILE STRUCTURE

```
nyaya-mitra/
│
└── frontend/                                      ← TUMHARA POORA FOLDER
    │
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── package.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── .env.local                                 ← Member 1 ki .env.shared se banao
    │
    ├── public/
    │   └── favicon.ico
    │
    └── src/
        │
        ├── main.tsx                               ← React entry point
        ├── App.tsx                                ← Router + all providers
        │
        ├── types/
        │   └── index.ts                           ← TypeScript types (SARE)
        │
        ├── context/
        │   ├── LanguageContext.tsx                ← Hindi/English toggle
        │   ├── SessionContext.tsx                 ← Session state global
        │   └── StealthContext.tsx                 ← Stealth mode state
        │
        ├── i18n/
        │   ├── en.json                            ← English strings
        │   └── hi.json                            ← Hindi strings
        │
        ├── hooks/
        │   ├── useWebSocket.ts                    ← WebSocket connection + messages
        │   └── useVoice.ts                        ← Mic recording + Polly playback
        │
        ├── pages/
        │   ├── EntryPage.tsx                      ← Language + mode select
        │   ├── DashboardPage.tsx                  ← Quick nav + widgets
        │   ├── ChatPage.tsx                       ← Main chat interface
        │   ├── TimelinePage.tsx                   ← Timeline builder + PDF
        │   ├── ComplaintGeneratorPage.tsx         ← Complaint form + download
        │   ├── NoticeScannerPage.tsx              ← Upload + AI analysis
        │   └── LegalAidPage.tsx                  ← Partner directory
        │
        ├── components/
        │   ├── layout/
        │   │   ├── AppLayout.tsx                  ← Nav + Crisis button wrapper
        │   │   └── Navbar.tsx                     ← Top bar + bottom tabs
        │   │
        │   ├── chat/
        │   │   ├── ConfidenceBadge.tsx            ← Verified / Partially Verified
        │   │   ├── RiskBadge.tsx                  ← LOW / MEDIUM / HIGH
        │   │   └── ActionCard.tsx                 ← "Do This Now" cards
        │   │
        │   └── shared/
        │       ├── CrisisButton.tsx               ← Floating red emergency button
        │       ├── GuestLimitBanner.tsx           ← "X questions remaining"
        │       └── StealthCalculator.tsx          ← Calculator disguise UI
        │
        └── deploy.sh                             ← S3 + CloudFront deploy
```

---

## 3. KAHAN SE START KARO

```
PEHLE: Member 1 se .env.shared lo — iske bina kuch nahi chalega
DAY 1: Project setup + npm install + Tailwind + Types + i18n + Context providers
DAY 2: Entry Page + Dashboard Page
DAY 3: Chat Page (WebSocket, voice, badges — sabse complex page)
DAY 4: Timeline Page + Complaint Generator Page
DAY 5: Notice Scanner Page + Legal Aid Page
DAY 6: Polish + Crisis Button + Stealth Mode + Deploy to S3
```

---

## 4. DAY-BY-DAY DETAILED PLAN

### ═══ DAY 1 — Project Setup ═══
**Target: 8 ghante | Goal: npm run dev kaam kare, language toggle ho**

#### Step 1: Project Create + Install

```bash
cd nyaya-mitra
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Core dependencies
npm install react-router-dom axios

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Dev start
npm run dev
# Browser mein http://localhost:5173 khulna chahiye
```

#### Step 2: `.env.local` Banao

```bash
# Member 1 ki .env.shared se values copy karo
# IMPORTANT: VITE_ prefix zaroori hai — bina iske values undefined hongi

cat > .env.local << 'EOF'
VITE_HTTP_API_URL=https://XXXXXXXX.execute-api.ap-south-1.amazonaws.com
VITE_WEBSOCKET_URL=wss://XXXXXXXX.execute-api.ap-south-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=nyaya-mitra-auth.auth.ap-south-1.amazoncognito.com
VITE_USER_UPLOADS_BUCKET=nyaya-mitra-user-uploads-ACCOUNT_ID
VITE_AWS_REGION=ap-south-1
VITE_GUEST_QUERY_LIMIT=5
EOF
```

#### Step 3: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8eaf6',
          100: '#c5cae9',
          500: '#3949ab',
          600: '#283593',
          700: '#1a237e',
          800: '#0d1757',
        },
        accent: { 400: '#ffca28', 500: '#ff6f00' },
      },
      fontFamily: {
        sans:  ['Noto Sans', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      }
    },
  },
  plugins: [],
} satisfies Config
```

#### Step 4: `index.html`

```html
<!doctype html>
<html lang="hi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Nyaya Mitra — AI Legal Assistant for India" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Nyaya Mitra — AI Legal Assistant</title>
  </head>
  <body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### Step 5: `src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### Step 6: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans', system-ui, sans-serif; }
  .font-hindi * { font-family: 'Noto Sans Devanagari', serif; }
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
}
```

#### Step 7: `src/types/index.ts` — SARE TypeScript Types

```typescript
// ── Session ──
export interface Session {
  session_id:             string;
  user_id:                string;
  language:               'en' | 'hi';
  anonymous_mode:         boolean;
  stealth_mode:           boolean;
  queries_count:          number;
  query_limit_remaining:  number;
  location_state?:        string;
  location_district?:     string;
}

// ── Chat Message ──
export interface ChatMessage {
  id:                  string;
  sender:              'user' | 'assistant' | 'system';
  text:                string;
  timestamp:           string;
  confidence_score?:   number;
  confidence_label?:   string;
  confidence_color?:   'green' | 'teal' | 'yellow' | 'orange';
  risk_level?:         'LOW' | 'MEDIUM' | 'HIGH';
  risk_score?:         number;
  citations?:          Citation[];
  recommended_actions?: RecommendedAction[];
  crisis_resources?:   CrisisResources;
}

export interface Citation {
  index:     number;
  source:    string;
  category:  string;
  relevance: string;
}

export interface RecommendedAction {
  action_type:  string;
  priority:     string;
  timeline:     string;
  reasoning:    string;
  steps:        string[];
  cost:         string;
  system_route: string;
  can_do_now:   boolean;
}

export interface CrisisResources {
  message:   string;
  helplines: { name: string; number: string }[];
}

// ── Timeline ──
export interface TimelineEvent {
  date:               string;
  event:              string;
  legal_significance: string;
  category:           'incident' | 'action' | 'response' | 'deadline' | 'evidence';
}

export interface Timeline {
  timeline_id: string;
  timeline:    TimelineEvent[];
  gaps:        string[];
  issue_type:  string;
  summary:     string;
}

// ── Notice Analysis ──
export interface NoticeAnalysis {
  notice_id:               string;
  processing_status:       'processing' | 'completed' | 'failed';
  notice_type?:            string;
  sender_details?:         { name: string; is_lawyer: boolean; is_court: boolean; is_bank: boolean };
  response_deadline_date?: string;
  deadline_status?:        'OVERDUE' | 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'UNKNOWN';
  days_remaining?:         number;
  deadline_color?:         string;
  deadline_label?:         string;
  risk_score?:             number;
  risk_level?:             'HIGH' | 'MEDIUM' | 'LOW';
  demands?:                string[];
  consequences_if_ignored?: string[];
  recommended_actions?:    string;
  legal_sections_cited?:   string[];
}

// ── Legal Aid Partner ──
export interface LegalAidPartner {
  partner_id:           string;
  organization_name:    string;
  type:                 'govt' | 'ngo';
  state:                string;
  district:             string;
  phone:                string;
  email:                string;
  address:              string;
  specializations:      string[];
  languages_supported:  string[];
  rating:               number;
  free_service:         boolean;
  eligibility_criteria: string;
  current_case_load:    number;
  max_capacity:         number;
}

// ── Dashboard ──
export interface DashboardData {
  popular_issues:    { issue_type: string; count: number; display_name: string; trend: string }[];
  suggested_actions: { action: string; route: string; icon: string }[];
  legal_updates:     { date: string; title: string; summary: string; category: string }[];
}
```

#### Step 8: i18n Files

**`src/i18n/en.json`**
```json
{
  "app_name": "Nyaya Mitra",
  "tagline": "Your AI Legal Assistant",
  "entry": {
    "select_language": "Select Your Language",
    "choose_mode": "How would you like to start?",
    "chat_mode": "Chat with AI",
    "chat_desc": "Ask legal questions in plain language",
    "voice_mode": "Voice Mode",
    "voice_desc": "Speak your problem, get answers",
    "guest_note": "Continue as Guest (5 free questions)",
    "register": "Create Free Account"
  },
  "dashboard": {
    "title": "What do you need help with today?",
    "popular_title": "Common Issues in Your Area",
    "actions_title": "Quick Actions",
    "updates_title": "Legal Updates",
    "ask_question": "Ask Legal Question",
    "build_timeline": "Build Case Timeline",
    "generate_complaint": "Generate Complaint",
    "scan_notice": "Scan Legal Notice",
    "find_help": "Find Legal Aid"
  },
  "chat": {
    "placeholder": "Describe your legal problem...",
    "send": "Send",
    "voice_start": "Start Speaking",
    "voice_stop": "Stop",
    "verified": "Verified",
    "highly_verified": "Highly Verified",
    "partially_verified": "Partially Verified",
    "limited_info": "Limited Information",
    "sources": "Legal Sources",
    "do_this_now": "Do This Now",
    "guest_limit": "questions remaining",
    "guest_limit_reached": "You have used all 5 free questions. Register for unlimited access.",
    "register_now": "Register Free"
  },
  "timeline": {
    "title": "Build Your Case Timeline",
    "desc": "Describe what happened. AI will extract dates and legal significance.",
    "placeholder": "Tell your story with dates: 'In January 2024, my neighbor built a wall on my land. In February I sent a notice...'",
    "generate": "Generate Timeline",
    "export_pdf": "Export as PDF",
    "gaps_title": "Missing Information (Collect These)",
    "events_title": "Timeline Events"
  },
  "complaint": {
    "title": "Generate Legal Complaint",
    "select_type": "Select Complaint Type",
    "police": "Police Complaint (FIR)",
    "rti": "RTI Application",
    "legal_notice": "Legal Notice",
    "consumer": "Consumer Court",
    "womens_cell": "Women's Cell",
    "cyber": "Cyber Crime",
    "your_details": "Your Details",
    "name": "Full Name",
    "phone": "Phone Number",
    "address": "Address",
    "incident": "Describe the Incident",
    "relief": "What outcome do you want?",
    "generate": "Generate Complaint",
    "download": "Download PDF",
    "tracking": "Tracking Number"
  },
  "notice": {
    "title": "Scan Legal Notice",
    "desc": "Upload a legal notice — AI will analyze it in 30 seconds",
    "upload": "Upload Document",
    "drag_drop": "Drag & drop PDF or image here, or click to browse",
    "analyzing": "AI is analyzing your document...",
    "analysis_ready": "Analysis Complete",
    "deadline": "Response Deadline",
    "risk": "Risk Level",
    "demands": "Their Demands",
    "consequences": "If You Ignore",
    "what_to_do": "What You Should Do",
    "sections_cited": "Laws Cited"
  },
  "legal_aid": {
    "title": "Find Free Legal Aid",
    "desc": "Government & NGO legal assistance near you",
    "filter_state": "Filter by State",
    "free": "FREE",
    "rating": "Rating",
    "contact": "Contact",
    "languages": "Languages",
    "specializes": "Specializes in",
    "national_helplines": "National Helplines",
    "capacity": "Capacity"
  },
  "common": {
    "back": "Back",
    "cancel": "Cancel",
    "loading": "Loading...",
    "error": "Something went wrong. Please try again.",
    "crisis_title": "Emergency Helplines",
    "crisis_desc": "Call immediately if you are in danger"
  }
}
```

**`src/i18n/hi.json`**
```json
{
  "app_name": "न्याय मित्र",
  "tagline": "आपका AI कानूनी सहायक",
  "entry": {
    "select_language": "अपनी भाषा चुनें",
    "choose_mode": "आप कैसे शुरू करना चाहते हैं?",
    "chat_mode": "AI से बात करें",
    "chat_desc": "सरल भाषा में कानूनी सवाल पूछें",
    "voice_mode": "आवाज़ से पूछें",
    "voice_desc": "बोलकर बताएं, जवाब पाएं",
    "guest_note": "मेहमान के रूप में जारी रखें (5 मुफ़्त सवाल)",
    "register": "मुफ़्त खाता बनाएं"
  },
  "dashboard": {
    "title": "आज आपको किसमें मदद चाहिए?",
    "popular_title": "आपके क्षेत्र की आम समस्याएं",
    "actions_title": "त्वरित कार्य",
    "updates_title": "कानूनी अपडेट",
    "ask_question": "कानूनी सवाल पूछें",
    "build_timeline": "केस टाइमलाइन बनाएं",
    "generate_complaint": "शिकायत लिखें",
    "scan_notice": "नोटिस स्कैन करें",
    "find_help": "कानूनी सहायता खोजें"
  },
  "chat": {
    "placeholder": "अपनी कानूनी समस्या बताएं...",
    "send": "भेजें",
    "voice_start": "बोलना शुरू करें",
    "voice_stop": "रुकें",
    "verified": "सत्यापित",
    "highly_verified": "पूर्णतः सत्यापित",
    "partially_verified": "आंशिक रूप से सत्यापित",
    "limited_info": "सीमित जानकारी",
    "sources": "कानूनी स्रोत",
    "do_this_now": "यह करें अभी",
    "guest_limit": "सवाल बचे हैं",
    "guest_limit_reached": "आपने 5 मुफ़्त सवाल उपयोग कर लिए। असीमित के लिए पंजीकरण करें।",
    "register_now": "मुफ़्त पंजीकरण"
  },
  "timeline": {
    "title": "केस टाइमलाइन बनाएं",
    "desc": "क्या हुआ बताएं। AI तारीखें और कानूनी महत्व निकालेगा।",
    "placeholder": "अपनी कहानी तारीखों के साथ बताएं: 'जनवरी 2024 में मेरे पड़ोसी ने मेरी ज़मीन पर दीवार बनाई। फरवरी में मैंने नोटिस भेजा...'",
    "generate": "टाइमलाइन बनाएं",
    "export_pdf": "PDF में सेव करें",
    "gaps_title": "कमी की जानकारी (यह इकट्ठा करें)",
    "events_title": "घटनाक्रम"
  },
  "complaint": {
    "title": "कानूनी शिकायत बनाएं",
    "select_type": "शिकायत का प्रकार चुनें",
    "police": "पुलिस शिकायत (FIR)",
    "rti": "RTI आवेदन",
    "legal_notice": "कानूनी नोटिस",
    "consumer": "उपभोक्ता न्यायालय",
    "womens_cell": "महिला सेल",
    "cyber": "साइबर अपराध",
    "your_details": "आपकी जानकारी",
    "name": "पूरा नाम",
    "phone": "फोन नंबर",
    "address": "पता",
    "incident": "घटना का विवरण",
    "relief": "आप क्या चाहते हैं?",
    "generate": "शिकायत बनाएं",
    "download": "PDF डाउनलोड करें",
    "tracking": "ट्रैकिंग नंबर"
  },
  "notice": {
    "title": "कानूनी नोटिस स्कैन करें",
    "desc": "नोटिस अपलोड करें — AI 30 सेकंड में विश्लेषण करेगा",
    "upload": "दस्तावेज़ अपलोड करें",
    "drag_drop": "PDF या फोटो यहाँ खींचें, या क्लिक करें",
    "analyzing": "AI आपके दस्तावेज़ का विश्लेषण कर रहा है...",
    "analysis_ready": "विश्लेषण तैयार",
    "deadline": "जवाब देने की अंतिम तिथि",
    "risk": "जोखिम स्तर",
    "demands": "उनकी माँगें",
    "consequences": "यदि अनदेखा किया",
    "what_to_do": "आपको क्या करना चाहिए",
    "sections_cited": "उद्धृत कानून"
  },
  "legal_aid": {
    "title": "मुफ़्त कानूनी सहायता खोजें",
    "desc": "आपके पास सरकारी और NGO कानूनी मदद",
    "filter_state": "राज्य से फ़िल्टर करें",
    "free": "मुफ़्त",
    "rating": "रेटिंग",
    "contact": "संपर्क",
    "languages": "भाषाएं",
    "specializes": "विशेषज्ञता",
    "national_helplines": "राष्ट्रीय हेल्पलाइन",
    "capacity": "क्षमता"
  },
  "common": {
    "back": "वापस",
    "cancel": "रद्द करें",
    "loading": "लोड हो रहा है...",
    "error": "कुछ गलत हुआ। कृपया दोबारा कोशिश करें।",
    "crisis_title": "आपातकालीन हेल्पलाइन",
    "crisis_desc": "अगर आप खतरे में हैं तो तुरंत कॉल करें"
  }
}
```

#### Step 9: Context Providers

**`src/context/LanguageContext.tsx`**
```tsx
import React, { createContext, useContext, useState } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

type Language = 'en' | 'hi';
interface LangCtx {
  language: Language;
  t: (key: string) => string;
  toggleLang: () => void;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const strings = language === 'hi' ? hi : en;

  // "chat.placeholder" → strings.chat.placeholder
  const t = (key: string): string => {
    const parts = key.split('.');
    let val: any = strings;
    for (const p of parts) val = val?.[p];
    return typeof val === 'string' ? val : key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t,
      toggleLang: () => setLanguage(p => p === 'en' ? 'hi' : 'en'),
      setLang: setLanguage
    }}>
      <div className={language === 'hi' ? 'font-hindi' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
```

**`src/context/SessionContext.tsx`**
```tsx
import React, { createContext, useContext, useState } from 'react';
import type { Session } from '../types';

interface SessionCtx {
  session:     Session | null;
  setSession:  (s: Session | null) => void;
  isGuest:     boolean;
  queriesLeft: number;
}

const SessionContext = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  return (
    <SessionContext.Provider value={{
      session,
      setSession,
      isGuest:     session?.anonymous_mode ?? true,
      queriesLeft: session?.query_limit_remaining ?? 5,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be inside SessionProvider');
  return ctx;
};
```

**`src/context/StealthContext.tsx`**
```tsx
import React, { createContext, useContext, useState, useRef } from 'react';

interface StealthCtx {
  isStealthMode: boolean;
  handleLogoTap: () => void;
  exitStealth:   () => void;
}

const StealthContext = createContext<StealthCtx | null>(null);

export function StealthProvider({ children }: { children: React.ReactNode }) {
  const [isStealthMode, setIsStealthMode] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapCount.current >= 3) {
      setIsStealthMode(true);
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      return;
    }
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
  };

  const exitStealth = () => {
    setIsStealthMode(false);
    tapCount.current = 0;
  };

  return (
    <StealthContext.Provider value={{ isStealthMode, handleLogoTap, exitStealth }}>
      {children}
    </StealthContext.Provider>
  );
}

export const useStealth = () => {
  const ctx = useContext(StealthContext);
  if (!ctx) throw new Error('useStealth must be inside StealthProvider');
  return ctx;
};
```

#### Step 10: `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider }   from './context/LanguageContext';
import { SessionProvider }    from './context/SessionContext';
import { StealthProvider }    from './context/StealthContext';
import AppLayout              from './components/layout/AppLayout';
import EntryPage              from './pages/EntryPage';
import DashboardPage          from './pages/DashboardPage';
import ChatPage               from './pages/ChatPage';
import TimelinePage           from './pages/TimelinePage';
import ComplaintGeneratorPage from './pages/ComplaintGeneratorPage';
import NoticeScannerPage      from './pages/NoticeScannerPage';
import LegalAidPage           from './pages/LegalAidPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <SessionProvider>
          <StealthProvider>
            <Routes>
              <Route path="/"      element={<Navigate to="/entry" replace />} />
              <Route path="/entry" element={<EntryPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard"           element={<DashboardPage />} />
                <Route path="/chat"                element={<ChatPage />} />
                <Route path="/timeline"            element={<TimelinePage />} />
                <Route path="/complaint-generator" element={<ComplaintGeneratorPage />} />
                <Route path="/notice-scanner"      element={<NoticeScannerPage />} />
                <Route path="/legal-aid"           element={<LegalAidPage />} />
              </Route>
            </Routes>
          </StealthProvider>
        </SessionProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
```

---

### ═══ DAY 2 — Entry Page + Dashboard Page ═══
**Target: 8 ghante**

#### `src/pages/EntryPage.tsx`

```tsx
import { useState } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useLanguage }  from '../context/LanguageContext';
import { useSession }   from '../context/SessionContext';
import { useStealth }   from '../context/StealthContext';
import StealthCalculator from '../components/shared/StealthCalculator';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

export default function EntryPage() {
  const navigate = useNavigate();
  const { language, t, setLang } = useLanguage();
  const { setSession }           = useSession();
  const { isStealthMode, handleLogoTap } = useStealth();

  const [step, setStep]     = useState<'language' | 'mode'>('language');
  const [mode, setMode]     = useState<'chat' | 'voice'>('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Stealth mode on → show calculator
  if (isStealthMode) return <StealthCalculator />;

  const handleGuestStart = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/v1/entry/session`, {
        language_code:  language,
        mode_selection: mode,
        anonymous_mode: true,
      });
      setSession(data);
      navigate('/dashboard');
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 flex flex-col items-center justify-center p-5">

      {/* Logo — 3 rapid taps → Stealth Mode */}
      <button onClick={handleLogoTap} className="mb-10 text-center select-none" aria-label="Logo">
        <div className="text-6xl mb-2">⚖️</div>
        <h1 className="text-4xl font-bold text-white tracking-tight">{t('app_name')}</h1>
        <p className="text-blue-200 mt-1 text-sm">{t('tagline')}</p>
      </button>

      <div className="w-full max-w-sm">

        {/* ── STEP 1: Language ── */}
        {step === 'language' && (
          <div className="bg-white rounded-3xl p-8 shadow-2xl animate-slide-up">
            <h2 className="text-lg font-bold text-brand-700 mb-6 text-center">
              {t('entry.select_language')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: 'en' as const, flag: '🇬🇧', name: 'English',  sub: 'Continue in English' },
                { code: 'hi' as const, flag: '🇮🇳', name: 'हिंदी',    sub: 'हिंदी में जारी रखें' },
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setStep('mode'); }}
                  className={`p-5 rounded-2xl border-2 text-center transition-all
                    ${language === l.code
                      ? 'border-brand-600 bg-brand-50 scale-105'
                      : 'border-gray-200 hover:border-brand-300 hover:scale-105'}`}
                >
                  <div className="text-4xl mb-2">{l.flag}</div>
                  <div className="font-bold text-gray-800">{l.name}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">{l.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Mode ── */}
        {step === 'mode' && (
          <div className="bg-white rounded-3xl p-7 shadow-2xl animate-slide-up space-y-4">
            <button onClick={() => setStep('language')} className="text-brand-600 text-sm flex items-center gap-1">
              ← {t('common.back')}
            </button>
            <h2 className="text-lg font-bold text-brand-700">{t('entry.choose_mode')}</h2>

            {[
              { id: 'chat'  as const, icon: '💬', nameKey: 'entry.chat_mode',  descKey: 'entry.chat_desc' },
              { id: 'voice' as const, icon: '🎙️', nameKey: 'entry.voice_mode', descKey: 'entry.voice_desc' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all
                  ${mode === m.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}
              >
                <span className="text-3xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{t(m.nameKey)}</div>
                  <div className="text-sm text-gray-500">{t(m.descKey)}</div>
                </div>
                {mode === m.id && <span className="text-brand-600 font-bold">✓</span>}
              </button>
            ))}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              onClick={handleGuestStart}
              disabled={loading}
              className="w-full py-4 bg-brand-700 text-white rounded-2xl font-bold text-base
                         hover:bg-brand-800 disabled:opacity-60 transition-colors"
            >
              {loading ? t('common.loading') : t('entry.guest_note')}
            </button>
            <p className="text-center text-xs text-gray-400">No signup needed for first 5 questions</p>
          </div>
        )}

      </div>
    </div>
  );
}
```

#### `src/pages/DashboardPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import type { DashboardData } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const ACTIONS = [
  { key: 'ask_question',      icon: '💬', route: '/chat',                color: 'bg-blue-50   border-blue-200   text-blue-800' },
  { key: 'build_timeline',    icon: '📅', route: '/timeline',            color: 'bg-green-50  border-green-200  text-green-800' },
  { key: 'generate_complaint',icon: '📝', route: '/complaint-generator', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { key: 'scan_notice',       icon: '🔍', route: '/notice-scanner',      color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { key: 'find_help',         icon: '🤝', route: '/legal-aid',           color: 'bg-red-50    border-red-200    text-red-800' },
];

const ISSUE_ICONS: Record<string, string> = {
  property: '🏠', family: '👨‍👩‍👧', consumer: '🛒',
  criminal: '⚖️', labor: '💼',    cyber: '💻'
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t }    = useLanguage();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/v1/dashboard/widgets?state=MH&district=MUMBAI`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">

      <h1 className="text-xl font-bold text-brand-700 pt-3">{t('dashboard.title')}</h1>

      {/* Quick Actions */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.actions_title')}</p>
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map(a => (
            <button
              key={a.key}
              onClick={() => navigate(a.route)}
              className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3
                          hover:scale-105 transition-transform active:scale-95 ${a.color}`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="font-semibold text-sm leading-tight">{t(`dashboard.${a.key}`)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Issues */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.popular_title')}</p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">{t('common.loading')}</div>
          ) : (
            data?.popular_issues.map(issue => (
              <button
                key={issue.issue_type}
                onClick={() => navigate(`/chat?topic=${issue.issue_type}`)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-2xl">{ISSUE_ICONS[issue.issue_type] || '⚖️'}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{issue.display_name}</div>
                  <div className="text-xs text-gray-400">{issue.count} cases this month</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${issue.trend === 'up'   ? 'bg-red-50 text-red-600' :
                    issue.trend === 'down' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                  {issue.trend === 'up' ? '↑ Rising' : issue.trend === 'down' ? '↓ Falling' : '→ Stable'}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Legal Updates */}
      {data?.legal_updates && data.legal_updates.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.updates_title')}</p>
          <div className="space-y-3">
            {data.legal_updates.slice(0, 3).map((u, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-xs text-gray-400 mb-1">{u.date}</div>
                <div className="font-semibold text-gray-800 text-sm">{u.title}</div>
                <div className="text-sm text-gray-500 mt-1">{u.summary}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

### ═══ DAY 3 — Chat Page + Hooks + Components ═══
**Target: 8-10 ghante | Goal: End-to-end WebSocket chat kaam kare**

#### `src/hooks/useWebSocket.ts`

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

export function useWebSocket(sessionId: string) {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!sessionId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?session_id=${sessionId}`);
    wsRef.current = ws;

    ws.onopen  = () => { setConnected(true); console.log('WS connected'); };
    ws.onclose = () => { setConnected(false); setLoading(false); };
    ws.onerror = () => { setConnected(false); setLoading(false); };

    ws.onmessage = (event) => {
      setLoading(false);
      try {
        const data = JSON.parse(event.data);

        // Error / limit response
        if (data.error || data.error_code) {
          setMessages(prev => [...prev, {
            id:        Date.now().toString(),
            sender:    'system',
            text:      data.message || data.error,
            timestamp: new Date().toISOString(),
          }]);
          return;
        }

        // Normal AI response
        setMessages(prev => [...prev, {
          id:                  data.message_id || Date.now().toString(),
          sender:              'assistant',
          text:                data.answer || '',
          timestamp:           data.timestamp || new Date().toISOString(),
          confidence_score:    data.confidence_score,
          confidence_label:    data.confidence_label,
          confidence_color:    data.confidence_color,
          risk_level:          data.risk_level,
          risk_score:          data.risk_score,
          citations:           data.citations || [],
          recommended_actions: data.recommended_actions || [],
          crisis_resources:    data.crisis_resources,
        }]);
      } catch {
        console.error('WS JSON parse error');
      }
    };
  }, [sessionId]);

  const sendMessage = useCallback((text: string, language: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const msgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: msgId, sender: 'user', text, timestamp: new Date().toISOString()
    }]);
    setLoading(true);
    wsRef.current.send(JSON.stringify({
      action: 'sendMessage', session_id: sessionId, message_id: msgId, text, language
    }));
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [sessionId]);

  return { messages, connected, loading, sendMessage };
}
```

#### `src/hooks/useVoice.ts`

```typescript
import { useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

export function useVoice(sessionId: string, language: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const mrRef    = useRef<MediaRecorder | null>(null);
  const chunks   = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mrRef.current = mr;
      chunks.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.start(250);
      setIsRecording(true);
    } catch (e) {
      alert('Mic access denied. Please allow microphone access in browser settings.');
    }
  };

  const stopRecording = (): Promise<string> => {
    return new Promise(resolve => {
      const mr = mrRef.current;
      if (!mr) return resolve('');

      mr.onstop = async () => {
        setIsRecording(false);
        const blob   = new Blob(chunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const b64  = (reader.result as string).split(',')[1];
            const resp = await axios.post(`${API}/v1/voice/input`, {
              audio_data: b64, language, session_id: sessionId
            });
            // Poll for transcript (simplified — 3 seconds wait)
            await new Promise(r => setTimeout(r, 3000));
            resolve(resp.data.job_name ? 'Voice input received (processing)' : '');
          } catch { resolve(''); }
        };
        reader.readAsDataURL(blob);
        mr.stream.getTracks().forEach(t => t.stop());
      };
      mr.stop();
    });
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const { data } = await axios.post(`${API}/v1/voice/output`, { text, language });
      const bytes = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0));
      const blob  = new Blob([bytes], { type: 'audio/mp3' });
      const url   = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audioRef.current.play();
    } catch { setIsSpeaking(false); }
  };

  const stopSpeaking = () => { audioRef.current?.pause(); setIsSpeaking(false); };

  return { isRecording, isSpeaking, startRecording, stopRecording, speakText, stopSpeaking };
}
```

#### Chat Components

**`src/components/chat/ConfidenceBadge.tsx`**
```tsx
const COLORS: Record<string, string> = {
  green:  'bg-green-100  text-green-800  border-green-300',
  teal:   'bg-teal-100   text-teal-800   border-teal-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function ConfidenceBadge({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${COLORS[color] || COLORS.orange}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label} · {score}%
    </span>
  );
}
```

**`src/components/chat/RiskBadge.tsx`**
```tsx
const S: Record<string, { cls: string; emoji: string }> = {
  LOW:    { cls: 'bg-green-100  text-green-800  border-green-300',  emoji: '🟢' },
  MEDIUM: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: '🟡' },
  HIGH:   { cls: 'bg-red-100   text-red-800    border-red-300',    emoji: '🔴' },
};

export default function RiskBadge({ level, score }: { level: 'LOW' | 'MEDIUM' | 'HIGH'; score: number }) {
  const s = S[level] || S.LOW;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.emoji} {level} Risk · {score}/100
    </span>
  );
}
```

**`src/components/chat/ActionCard.tsx`**
```tsx
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { RecommendedAction } from '../../types';

const BORDERS: Record<string, string> = {
  URGENT: 'border-red-400    bg-red-50',
  HIGH:   'border-orange-400 bg-orange-50',
  MEDIUM: 'border-yellow-400 bg-yellow-50',
};

export default function ActionCard({ action }: { action: RecommendedAction }) {
  const navigate = useNavigate();
  const { t }    = useLanguage();
  return (
    <div className={`border-l-4 rounded-r-2xl p-4 mt-2 ${BORDERS[action.priority] || 'border-brand-400 bg-brand-50'}`}>
      <div className="font-bold text-gray-800 text-sm">{action.action_type}</div>
      <div className="text-xs text-gray-500 mt-0.5">⏱ {action.timeline}  ·  {action.cost}</div>
      <p className="text-sm text-gray-600 mt-2">{action.reasoning}</p>
      {action.steps?.length > 0 && (
        <ol className="mt-2 space-y-1">
          {action.steps.slice(0, 3).map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-600">
              <span className="font-bold text-brand-600 shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
      {action.can_do_now && (
        <button
          onClick={() => navigate(action.system_route)}
          className="mt-3 w-full py-2 bg-brand-700 text-white text-sm font-bold rounded-xl hover:bg-brand-800 transition-colors"
        >
          {t('chat.do_this_now')} →
        </button>
      )}
    </div>
  );
}
```

#### Shared Components

**`src/components/shared/CrisisButton.tsx`**
```tsx
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const HELPLINES = [
  { name: 'Women Helpline', number: '181',  emoji: '👩' },
  { name: 'Child Helpline', number: '1098', emoji: '👧' },
  { name: 'Legal Aid',      number: '15100',emoji: '⚖️' },
  { name: 'Police',         number: '100',  emoji: '🚔' },
  { name: 'Cyber Crime',    number: '1930', emoji: '💻' },
  { name: 'Mental Health (Vandrevala)', number: '1860-2662-345', emoji: '💙' },
];

export default function CrisisButton() {
  const { t }           = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 bg-white rounded-3xl shadow-2xl p-5 w-72 animate-slide-up border border-red-100">
          <h3 className="font-bold text-red-700 text-base mb-1">{t('common.crisis_title')}</h3>
          <p className="text-xs text-gray-500 mb-4">{t('common.crisis_desc')}</p>
          <div className="space-y-2">
            {HELPLINES.map(h => (
              <a key={h.number} href={`tel:${h.number}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors">
                <span className="text-xl">{h.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{h.name}</div>
                  <div className="text-red-700 font-bold text-sm">{h.number}</div>
                </div>
                <span>📞</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-red-600 hover:bg-red-700
                   text-white rounded-full shadow-2xl flex items-center justify-center
                   text-2xl animate-pulse-slow hover:scale-110 transition-all"
        title="Emergency Helplines"
      >🆘</button>
    </>
  );
}
```

**`src/components/shared/GuestLimitBanner.tsx`**
```tsx
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSession }  from '../../context/SessionContext';

export default function GuestLimitBanner() {
  const navigate             = useNavigate();
  const { t }                = useLanguage();
  const { isGuest, queriesLeft } = useSession();
  if (!isGuest) return null;

  if (queriesLeft <= 0) return (
    <div className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
      <p className="flex-1 text-red-700 text-sm font-medium">{t('chat.guest_limit_reached')}</p>
      <button onClick={() => navigate('/entry')}
        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-xl font-bold">
        {t('chat.register_now')}
      </button>
    </div>
  );

  if (queriesLeft <= 3) return (
    <div className="mx-4 mb-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-2">
      <span>⚠️</span>
      <p className="text-yellow-800 text-sm">
        <strong>{queriesLeft}</strong> {t('chat.guest_limit')}
      </p>
    </div>
  );

  return null;
}
```

**`src/components/shared/StealthCalculator.tsx`**
```tsx
import { useState } from 'react';
import { useStealth } from '../../context/StealthContext';

export default function StealthCalculator() {
  const { exitStealth }       = useStealth();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev]       = useState('');
  const [op, setOp]           = useState('');

  const press = (v: string) => {
    if (v === 'AC') { exitStealth(); return; }           // Secret exit
    if (v === '=') {
      try { setDisplay(String(eval(`${prev}${op}${display}`))); }
      catch { setDisplay('Error'); }
      setPrev(''); setOp(''); return;
    }
    if (['+', '-', '×', '÷'].includes(v)) {
      setPrev(display);
      setOp(v === '×' ? '*' : v === '÷' ? '/' : v);
      setDisplay('0'); return;
    }
    if (v === '%') { setDisplay(String(parseFloat(display) / 100)); return; }
    if (v === '+/-') { setDisplay(String(-parseFloat(display))); return; }
    setDisplay(p => p === '0' ? v : p + v);
  };

  const rows = [
    ['AC', '+/-', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 rounded-3xl p-5 w-80 shadow-2xl">
        <div className="text-white text-right text-5xl font-light pb-4 overflow-hidden px-2 min-h-[72px]">
          {display.length > 9 ? parseFloat(display).toExponential(3) : display}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {rows.flat().map((btn, i) => {
            const isOp    = ['+', '-', '×', '÷', '='].includes(btn);
            const isFunc  = ['AC', '+/-', '%'].includes(btn);
            const isZero  = btn === '0';
            return (
              <button key={i} onClick={() => press(btn)}
                className={`h-16 rounded-full text-xl font-medium active:opacity-70 transition-opacity
                  ${isZero   ? 'col-span-2 text-left pl-7 bg-gray-700 text-white' :
                    isOp     ? 'bg-orange-500 text-white' :
                    isFunc   ? 'bg-gray-500 text-white' :
                               'bg-gray-700 text-white'}`}
              >
                {btn === 'AC' ? <span title="Tap AC to exit stealth mode">AC</span> : btn}
              </button>
            );
          })}
        </div>
        <p className="text-center text-gray-700 text-xs mt-4">Tap AC to exit</p>
      </div>
    </div>
  );
}
```

#### Layout Components

**`src/components/layout/AppLayout.tsx`**
```tsx
import { Outlet }     from 'react-router-dom';
import Navbar         from './Navbar';
import CrisisButton   from '../shared/CrisisButton';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <CrisisButton />
    </div>
  );
}
```

**`src/components/layout/Navbar.tsx`**
```tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage }  from '../../context/LanguageContext';
import { useStealth }   from '../../context/StealthContext';

const TABS = [
  { path: '/dashboard',           icon: '🏠', label: 'Home' },
  { path: '/chat',                icon: '💬', label: 'Chat' },
  { path: '/timeline',            icon: '📅', label: 'Timeline' },
  { path: '/complaint-generator', icon: '📝', label: 'File' },
  { path: '/notice-scanner',      icon: '🔍', label: 'Notice' },
  { path: '/legal-aid',           icon: '🤝', label: 'Help' },
];

export default function Navbar() {
  const navigate             = useNavigate();
  const { pathname }         = useLocation();
  const { toggleLang, language } = useLanguage();
  const { handleLogoTap }    = useStealth();

  return (
    <>
      {/* Top bar */}
      <header className="bg-brand-700 px-4 py-3 flex items-center justify-between shadow-md">
        <button onClick={handleLogoTap} className="flex items-center gap-2 select-none">
          <span className="text-xl">⚖️</span>
          <span className="font-bold text-white text-lg tracking-tight">Nyaya Mitra</span>
        </button>
        <button onClick={toggleLang}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-full transition-colors">
          {language === 'en' ? 'हिं' : 'EN'}
        </button>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-gray-100 z-30 shadow-t">
        <div className="flex">
          {TABS.map(tab => {
            const active = pathname === tab.path;
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center py-2 transition-colors
                  ${active ? 'text-brand-700' : 'text-gray-400 hover:text-gray-500'}`}>
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : ''}`}>{tab.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-brand-700 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
```

#### `src/pages/ChatPage.tsx` — Poora File

```tsx
import { useRef, useEffect, useState } from 'react';
import { useLanguage }  from '../context/LanguageContext';
import { useSession }   from '../context/SessionContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useVoice }     from '../hooks/useVoice';
import ConfidenceBadge  from '../components/chat/ConfidenceBadge';
import RiskBadge        from '../components/chat/RiskBadge';
import ActionCard       from '../components/chat/ActionCard';
import GuestLimitBanner from '../components/shared/GuestLimitBanner';

export default function ChatPage() {
  const { t, language }          = useLanguage();
  const { session, queriesLeft } = useSession();
  const [input, setInput]        = useState('');
  const [voiceMode, setVoiceMode]= useState(false);
  const bottomRef                = useRef<HTMLDivElement>(null);

  const sid = session?.session_id || '';
  const { messages, connected, loading, sendMessage } = useWebSocket(sid);
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

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">

      {/* Status bar */}
      <div className={`flex items-center gap-2 px-4 py-2 text-xs ${connected ? 'text-green-600' : 'text-gray-400'}`}>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        {connected ? 'AI Connected' : 'Connecting...'}
      </div>

      <GuestLimitBanner />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 scrollbar-hide">

        {messages.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-semibold">{t('chat.placeholder')}</p>
            <p className="text-sm mt-2 text-gray-400">Ask about property, family law, consumer rights, labor, or cyber crime</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%] flex flex-col">

              {/* Message bubble */}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.sender === 'user'
                  ? 'bg-brand-700 text-white rounded-br-sm'
                  : msg.sender === 'system'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-2xl'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                {msg.text}
              </div>

              {/* AI extras */}
              {msg.sender === 'assistant' && (
                <div className="mt-2 space-y-2">

                  {/* Confidence + Risk badges */}
                  <div className="flex flex-wrap gap-2">
                    {msg.confidence_score !== undefined && msg.confidence_label && (
                      <ConfidenceBadge
                        score={msg.confidence_score}
                        label={msg.confidence_label}
                        color={msg.confidence_color || 'orange'}
                      />
                    )}
                    {msg.risk_level && msg.risk_score !== undefined && (
                      <RiskBadge level={msg.risk_level} score={msg.risk_score} />
                    )}
                  </div>

                  {/* Legal citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 mb-2">📚 {t('chat.sources')}</p>
                      {msg.citations.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600 py-1.5 border-b border-gray-100 last:border-0">
                          <span className="bg-brand-100 text-brand-700 font-bold px-1.5 rounded shrink-0">[{c.index}]</span>
                          <span className="flex-1">{c.source}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0
                            ${c.relevance === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.relevance}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Crisis resources (selfharm detected) */}
                  {msg.crisis_resources && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                      <p className="text-sm font-bold text-red-700 mb-2">⚠️ {msg.crisis_resources.message}</p>
                      {msg.crisis_resources.helplines.map((h, i) => (
                        <a key={i} href={`tel:${h.number}`}
                          className="flex items-center gap-2 py-1.5 text-sm text-red-700 hover:underline">
                          📞 <strong>{h.name}:</strong> {h.number}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Action cards */}
                  {msg.recommended_actions?.map((action, i) => (
                    <ActionCard key={i} action={action} />
                  ))}

                  {/* Listen button */}
                  <button
                    onClick={() => !isSpeaking && speakText(msg.text)}
                    className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors mt-1"
                  >
                    {isSpeaking ? '🔊 Speaking...' : '🔈 Listen'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-5 py-4">
              <div className="flex gap-1.5">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 pb-20 bg-white border-t border-gray-100 flex items-center gap-2">
        {/* Voice toggle icon */}
        <button onClick={() => setVoiceMode(v => !v)}
          className={`p-2.5 rounded-xl transition-colors ${voiceMode ? 'bg-brand-100 text-brand-700' : 'text-gray-400'}`}>
          🎙️
        </button>

        {voiceMode ? (
          <button onClick={handleVoice} disabled={queriesLeft <= 0}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all
              ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-700 text-white hover:bg-brand-800'}
              disabled:opacity-50`}>
            {isRecording ? `● ${t('chat.voice_stop')}` : `🎤 ${t('chat.voice_start')}`}
          </button>
        ) : (
          <>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={queriesLeft <= 0}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50
                         text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={!input.trim() || loading || queriesLeft <= 0}
              className="p-3 bg-brand-700 text-white rounded-2xl hover:bg-brand-800
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              ➤
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### ═══ DAY 4 — Timeline + Complaint Generator ═══

#### `src/pages/TimelinePage.tsx`

```tsx
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession }  from '../context/SessionContext';
import type { Timeline } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const CAT_STYLES: Record<string, { color: string; icon: string }> = {
  incident: { color: 'bg-red-500',    icon: '⚡' },
  action:   { color: 'bg-blue-500',   icon: '✅' },
  response: { color: 'bg-yellow-500', icon: '📨' },
  deadline: { color: 'bg-purple-500', icon: '⏰' },
  evidence: { color: 'bg-green-500',  icon: '📄' },
};

export default function TimelinePage() {
  const { t }       = useLanguage();
  const { session } = useSession();
  const [text, setText]           = useState('');
  const [tl, setTl]               = useState<Timeline | null>(null);
  const [loading, setLoading]     = useState(false);
  const [pdfBusy, setPdfBusy]     = useState(false);
  const [error, setError]         = useState('');

  const generate = async () => {
    if (text.trim().length < 30) { setError('Please write more details (at least 30 characters)'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/v1/timeline/extract`, {
        narrative_text: text, session_id: session?.session_id, user_id: session?.user_id || 'guest'
      });
      setTl(data);
    } catch { setError(t('common.error')); }
    finally { setLoading(false); }
  };

  const exportPdf = async () => {
    if (!tl) return;
    setPdfBusy(true);
    try {
      const { data } = await axios.post(`${API}/v1/timeline/export`, { timeline_id: tl.timeline_id });
      window.open(data.download_url, '_blank');
    } catch { setError('PDF export failed. Please try again.'); }
    finally { setPdfBusy(false); }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-5">
      <div className="pt-3">
        <h1 className="text-xl font-bold text-brand-700">{t('timeline.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('timeline.desc')}</p>
      </div>

      {/* Input card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('timeline.placeholder')}
          rows={6}
          className="w-full text-sm text-gray-700 bg-transparent resize-none
                     focus:outline-none placeholder-gray-400 leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{text.length} characters</span>
          <button onClick={generate} disabled={loading || text.length < 30}
            className="px-5 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-bold
                       hover:bg-brand-800 disabled:opacity-50 transition-colors">
            {loading ? '⏳ ' + t('common.loading') : '✨ ' + t('timeline.generate')}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Timeline result */}
      {tl && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{t('timeline.events_title')} ({tl.timeline.length})</h2>
            <button onClick={exportPdf} disabled={pdfBusy}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold
                         rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors">
              📄 {pdfBusy ? 'Generating...' : t('timeline.export_pdf')}
            </button>
          </div>

          {/* Summary badge */}
          {tl.summary && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-sm text-brand-800">
              {tl.summary}
            </div>
          )}

          {/* Events visual */}
          <div className="relative pl-2">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {tl.timeline.map((ev, i) => {
                const s = CAT_STYLES[ev.category] || CAT_STYLES.incident;
                return (
                  <div key={i} className="flex gap-4 relative">
                    <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center
                                    text-white text-sm shrink-0 shadow-md z-10`}>
                      {s.icon}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="text-xs font-bold text-brand-600 mb-1">{ev.date}</div>
                      <div className="font-semibold text-gray-800 text-sm">{ev.event}</div>
                      <div className="text-xs text-gray-500 mt-1.5 italic leading-relaxed">{ev.legal_significance}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gaps */}
          {tl.gaps && tl.gaps.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <h3 className="font-bold text-yellow-800 mb-3">⚠️ {t('timeline.gaps_title')}</h3>
              <ul className="space-y-2">
                {tl.gaps.map((gap, i) => (
                  <li key={i} className="text-sm text-yellow-800 flex gap-2">
                    <span className="shrink-0 mt-0.5">•</span><span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### `src/pages/ComplaintGeneratorPage.tsx`

```tsx
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession }  from '../context/SessionContext';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const TYPES = [
  { id: 'police',       icon: '🚔', key: 'complaint.police',       color: 'border-blue-400   bg-blue-50' },
  { id: 'rti',          icon: '📋', key: 'complaint.rti',           color: 'border-green-400  bg-green-50' },
  { id: 'legal_notice', icon: '⚖️', key: 'complaint.legal_notice',  color: 'border-purple-400 bg-purple-50' },
  { id: 'consumer',     icon: '🛒', key: 'complaint.consumer',      color: 'border-orange-400 bg-orange-50' },
  { id: 'womens_cell',  icon: '👩‍⚖️',key: 'complaint.womens_cell',   color: 'border-pink-400   bg-pink-50' },
  { id: 'cyber',        icon: '💻', key: 'complaint.cyber',         color: 'border-red-400    bg-red-50' },
];

const FIELDS = [
  { key: 'name',    type: 'text',  i18n: 'complaint.name',    required: true },
  { key: 'phone',   type: 'tel',   i18n: 'complaint.phone',   required: false },
  { key: 'address', type: 'text',  i18n: 'complaint.address', required: false },
  { key: 'email',   type: 'email', i18n: 'Email',             required: false },
];

type Step = 'type' | 'form' | 'done';

export default function ComplaintGeneratorPage() {
  const { t, language } = useLanguage();
  const { session }     = useSession();

  const [step, setStep]       = useState<Step>('type');
  const [type, setType]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<{ tracking_number: string; pdf_url: string } | null>(null);
  const [form, setForm]       = useState({
    name: '', phone: '', address: '', email: '', incident: '', relief: '', state: '', district: ''
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.name.trim() || !form.incident.trim()) {
      setError('Name and incident description are required');
      return;
    }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/v1/complaints/generate`, {
        complaint_type: type, language,
        user_id:        session?.user_id || 'guest',
        user_inputs: {
          complainant:          { name: form.name, phone: form.phone, address: form.address, email: form.email },
          incident_description: form.incident,
          relief_sought:        form.relief,
          location:             { state: form.state, district: form.district }
        }
      });
      setResult(data);
      setStep('done');
    } catch { setError(t('common.error')); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep('type'); setResult(null); setType(''); setError('');
    setForm({ name:'', phone:'', address:'', email:'', incident:'', relief:'', state:'', district:'' });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-5">
      <div className="pt-3">
        <h1 className="text-xl font-bold text-brand-700">{t('complaint.title')}</h1>
      </div>

      {/* STEP 1 — Type Selection */}
      {step === 'type' && (
        <>
          <p className="text-gray-500 text-sm">{t('complaint.select_type')}</p>
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map(tp => (
              <button key={tp.id} onClick={() => { setType(tp.id); setStep('form'); }}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col gap-2
                            hover:scale-105 active:scale-95 transition-transform ${tp.color}`}>
                <span className="text-3xl">{tp.icon}</span>
                <span className="font-semibold text-sm text-gray-800 leading-tight">{t(tp.key)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* STEP 2 — Form */}
      {step === 'form' && (
        <>
          <button onClick={() => setStep('type')} className="text-brand-600 text-sm flex items-center gap-1">
            ← {t('common.back')}
          </button>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-gray-800">{t('complaint.your_details')}</h2>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  {f.i18n.startsWith('complaint.') ? t(f.i18n) : f.i18n}{f.required && ' *'}
                </label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            ))}

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{t('complaint.incident')} *</label>
              <textarea value={form.incident} onChange={e => set('incident', e.target.value)} rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">{t('complaint.relief')}</label>
              <input type="text" value={form.relief} onChange={e => set('relief', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={generate} disabled={loading}
              className="w-full py-3.5 bg-brand-700 text-white rounded-xl font-bold
                         hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {loading ? '⏳ Generating AI complaint...' : '✨ ' + t('complaint.generate')}
            </button>
          </div>
        </>
      )}

      {/* STEP 3 — Done */}
      {step === 'done' && result && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-3xl p-7 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="font-bold text-green-800 text-lg">Complaint Generated!</h2>
            <div className="bg-white rounded-2xl px-5 py-3 mt-4 inline-block border border-green-100">
              <p className="text-xs text-gray-500 mb-1">{t('complaint.tracking')}</p>
              <p className="font-mono font-bold text-brand-700 text-xl tracking-widest">{result.tracking_number}</p>
            </div>
          </div>

          <a href={result.pdf_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-brand-700 text-white
                       rounded-2xl font-bold hover:bg-brand-800 transition-colors">
            <span className="text-xl">📄</span> {t('complaint.download')}
          </a>

          <button onClick={reset}
            className="w-full py-3.5 border-2 border-brand-200 text-brand-700 rounded-2xl font-semibold
                       hover:bg-brand-50 transition-colors">
            Generate Another Complaint
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### ═══ DAY 5 — Notice Scanner + Legal Aid ═══

#### `src/pages/NoticeScannerPage.tsx` — POORA FILE

```tsx
import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSession }  from '../context/SessionContext';
import type { NoticeAnalysis } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const DEADLINE_COLORS: Record<string, string> = {
  OVERDUE:   'bg-red-100    text-red-800    border-red-300',
  CRITICAL:  'bg-red-100    text-red-800    border-red-300',
  URGENT:    'bg-orange-100 text-orange-800 border-orange-300',
  IMPORTANT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  NORMAL:    'bg-green-100  text-green-800  border-green-300',
  UNKNOWN:   'bg-gray-100   text-gray-600   border-gray-300',
};

const RISK_COLORS: Record<string, string> = {
  HIGH:   'bg-red-50    border-red-200    text-red-800',
  MEDIUM: 'bg-orange-50 border-orange-200 text-orange-800',
  LOW:    'bg-green-50  border-green-200  text-green-800',
};

type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export default function NoticeScannerPage() {
  const { t }       = useLanguage();
  const { session } = useSession();
  const inputRef    = useRef<HTMLInputElement>(null);

  const [dragging, setDragging]   = useState(false);
  const [status, setStatus]       = useState<Status>('idle');
  const [analysis, setAnalysis]   = useState<NoticeAnalysis | null>(null);
  const [error, setError]         = useState('');
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Converts file → base64 string
  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const pollForResult = useCallback((noticeId: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await axios.get(`${API}/v1/notices/${noticeId}/analysis`);
        if (data.processing_status === 'completed') {
          clearInterval(pollRef.current!);
          setAnalysis(data);
          setStatus('done');
        } else if (data.processing_status === 'failed') {
          clearInterval(pollRef.current!);
          setError('Analysis failed. Please try again with a clearer image.');
          setStatus('error');
        }
      } catch { /* keep polling */ }

      if (attempts >= 30) {   // Max 90 seconds
        clearInterval(pollRef.current!);
        setError('Analysis timed out. Please try again.');
        setStatus('error');
      }
    }, 3000);  // Poll every 3 seconds
  }, []);

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed.');
      return;
    }

    setStatus('uploading'); setError('');

    try {
      const b64 = await toBase64(file);
      const { data } = await axios.post(`${API}/v1/notices/upload`, {
        file_data:  b64,
        file_name:  file.name,
        file_type:  file.type,
        user_id:    session?.user_id || 'guest',
        session_id: session?.session_id
      });

      setStatus('analyzing');
      pollForResult(data.notice_id);

    } catch {
      setError(t('common.error'));
      setStatus('error');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('idle'); setAnalysis(null); setError('');
  };

  // ── RENDER ──

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-5">
      <div className="pt-3">
        <h1 className="text-xl font-bold text-brand-700">{t('notice.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('notice.desc')}</p>
      </div>

      {/* ── UPLOAD ZONE ── */}
      {status === 'idle' && (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all
            ${dragging
              ? 'border-brand-500 bg-brand-50 scale-105'
              : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
          <div className="text-5xl mb-4">📄</div>
          <p className="font-bold text-gray-700 text-lg">{t('notice.upload')}</p>
          <p className="text-gray-400 text-sm mt-2">{t('notice.drag_drop')}</p>
          <p className="text-gray-300 text-xs mt-3">PDF, JPG, PNG · Max 5MB</p>
        </div>
      )}

      {/* ── UPLOADING ── */}
      {status === 'uploading' && (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-4xl mb-4 animate-bounce">📤</div>
          <p className="font-semibold text-gray-700">Uploading document...</p>
          <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-brand-600 h-full w-3/4 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* ── ANALYZING ── */}
      {status === 'analyzing' && (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-bold text-gray-800 text-lg">{t('notice.analyzing')}</p>
          <p className="text-gray-400 text-sm mt-2">Textract + AI · Usually 30-60 seconds</p>
          <div className="mt-6 flex justify-center gap-2">
            {[0, 200, 400].map(d => (
              <div key={d} className="w-3 h-3 bg-brand-400 rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-7 text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-700 font-semibold">{error}</p>
          <button onClick={reset}
            className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* ── ANALYSIS RESULT ── */}
      {status === 'done' && analysis && (
        <div className="space-y-4 animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-lg">✅ {t('notice.analysis_ready')}</h2>
            <button onClick={reset} className="text-sm text-brand-600 hover:underline">Scan Another</button>
          </div>

          {/* Notice type + sender */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Notice Type</p>
                <p className="font-bold text-gray-800 text-lg mt-0.5">{analysis.notice_type || 'Unknown'}</p>
              </div>
              {analysis.sender_details && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-sm font-semibold text-gray-700">{analysis.sender_details.name}</p>
                  <div className="flex gap-1 justify-end mt-1">
                    {analysis.sender_details.is_court  && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">COURT</span>}
                    {analysis.sender_details.is_lawyer && <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold">LAWYER</span>}
                    {analysis.sender_details.is_bank   && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">BANK</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deadline + Risk — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Deadline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('notice.deadline')}</p>
              {analysis.deadline_status ? (
                <>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border
                    ${DEADLINE_COLORS[analysis.deadline_status] || DEADLINE_COLORS.UNKNOWN}`}>
                    {analysis.deadline_label || analysis.deadline_status}
                  </span>
                  {analysis.response_deadline_date && (
                    <p className="text-xs text-gray-500 mt-2">📅 {analysis.response_deadline_date}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Not specified</p>
              )}
            </div>

            {/* Risk */}
            <div className={`rounded-2xl border p-4 shadow-sm ${RISK_COLORS[analysis.risk_level || 'LOW'] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">{t('notice.risk')}</p>
              <div className="font-bold text-2xl">
                {analysis.risk_level === 'HIGH' ? '🔴' : analysis.risk_level === 'MEDIUM' ? '🟡' : '🟢'}
                {' '}{analysis.risk_level || 'LOW'}
              </div>
              {analysis.risk_score !== undefined && (
                <p className="text-xs opacity-70 mt-1">Score: {analysis.risk_score}/100</p>
              )}
            </div>
          </div>

          {/* Demands */}
          {analysis.demands && analysis.demands.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📋 {t('notice.demands')}</h3>
              <ul className="space-y-2">
                {analysis.demands.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-brand-600 font-bold shrink-0">{i + 1}.</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consequences */}
          {analysis.consequences_if_ignored && analysis.consequences_if_ignored.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <h3 className="font-bold text-red-800 mb-3">⚠️ {t('notice.consequences')}</h3>
              <ul className="space-y-2">
                {analysis.consequences_if_ignored.map((c, i) => (
                  <li key={i} className="text-sm text-red-700 flex gap-2">
                    <span className="shrink-0">•</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Laws cited */}
          {analysis.legal_sections_cited && analysis.legal_sections_cited.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📚 {t('notice.sections_cited')}</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.legal_sections_cited.map((s, i) => (
                  <span key={i} className="bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full border border-brand-200 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What to do */}
          {analysis.recommended_actions && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <h3 className="font-bold text-blue-800 mb-3">✅ {t('notice.what_to_do')}</h3>
              {(() => {
                try {
                  const actions = typeof analysis.recommended_actions === 'string'
                    ? JSON.parse(analysis.recommended_actions)
                    : analysis.recommended_actions;
                  return Array.isArray(actions) ? (
                    <ul className="space-y-3">
                      {(actions as any[]).map((a, i) => (
                        <li key={i} className="text-sm">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2
                            ${a.priority === 'IMMEDIATE' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                            {a.priority}
                          </span>
                          <span className="text-blue-800">{a.action}</span>
                          {a.reason && <p className="text-blue-600 text-xs mt-1 ml-6">{a.reason}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : null;
                } catch { return <p className="text-sm text-blue-700">{String(analysis.recommended_actions)}</p>; }
              })()}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
```

#### `src/pages/LegalAidPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { LegalAidPartner } from '../types';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

const HELPLINES = [
  { name: 'Legal Aid Helpline',  number: '15100', emoji: '⚖️' },
  { name: 'Women Helpline',      number: '181',   emoji: '👩' },
  { name: 'Child Helpline',      number: '1098',  emoji: '👧' },
  { name: 'Police',              number: '100',   emoji: '🚔' },
  { name: 'Cyber Crime',         number: '1930',  emoji: '💻' },
  { name: 'Consumer Helpline',   number: '1915',  emoji: '🛒' },
];

const STATES = [
  'MH', 'DL', 'UP', 'KA', 'TN', 'RJ', 'GJ', 'WB', 'MP', 'TG'
];

const SPECIALIZATION_ICONS: Record<string, string> = {
  property: '🏠', family: '👨‍👩‍👧', consumer: '🛒',
  criminal: '⚖️', labor: '💼',    cyber: '💻'
};

export default function LegalAidPage() {
  const { t }      = useLanguage();
  const [partners, setPartners] = useState<LegalAidPartner[]>([]);
  const [state, setState]       = useState('MH');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/v1/legal-aid/referrals?state=${state}`)
      .then(r => setPartners(r.data.partners || []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, [state]);

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24 space-y-6">
      <div className="pt-3">
        <h1 className="text-xl font-bold text-brand-700">{t('legal_aid.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('legal_aid.desc')}</p>
      </div>

      {/* State Filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('legal_aid.filter_state')}</p>
        <div className="flex flex-wrap gap-2">
          {STATES.map(s => (
            <button key={s} onClick={() => setState(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all
                ${state === s
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400">{t('common.loading')}</div>
        ) : partners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">No partners found for {state}</p>
            <p className="text-sm mt-1">Try another state or check national helplines below</p>
          </div>
        ) : (
          partners.map(partner => (
            <div key={partner.partner_id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                      ${partner.type === 'govt' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {partner.type === 'govt' ? '🏛 GOVT' : '🤝 NGO'}
                    </span>
                    {partner.free_service && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold">
                        ✓ {t('legal_aid.free')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 mt-1.5">{partner.organization_name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">📍 {partner.district}, {partner.state}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-yellow-500 text-sm">{'★'.repeat(Math.round(partner.rating))}</div>
                  <div className="text-xs text-gray-400">{partner.rating}/5</div>
                </div>
              </div>

              {/* Specializations */}
              {partner.specializations?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{t('legal_aid.specializes')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {partner.specializations.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-700
                                              border border-gray-200 rounded-full flex items-center gap-1">
                        {SPECIALIZATION_ICONS[s] || '⚖️'} {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold">{t('legal_aid.languages')}:</span>
                <span>{partner.languages_supported?.join(', ').toUpperCase()}</span>
              </div>

              {/* Eligibility */}
              {partner.eligibility_criteria && (
                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                  ℹ️ {partner.eligibility_criteria}
                </div>
              )}

              {/* Capacity bar */}
              {partner.max_capacity > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{t('legal_aid.capacity')}</span>
                    <span>{partner.current_case_load}/{partner.max_capacity} cases</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-full rounded-full transition-all
                        ${(partner.current_case_load / partner.max_capacity) > 0.8 ? 'bg-red-400' :
                          (partner.current_case_load / partner.max_capacity) > 0.5 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${Math.min(100, (partner.current_case_load / partner.max_capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Contact buttons */}
              <div className="flex gap-2 pt-1">
                {partner.phone && (
                  <a href={`tel:${partner.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-700 text-white
                               rounded-xl text-sm font-bold hover:bg-brand-800 transition-colors">
                    📞 {partner.phone}
                  </a>
                )}
                {partner.email && (
                  <a href={`mailto:${partner.email}`}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold
                               hover:bg-gray-200 transition-colors">
                    ✉️
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* National Helplines — always visible */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t('legal_aid.national_helplines')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {HELPLINES.map(h => (
            <a key={h.number} href={`tel:${h.number}`}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4
                         hover:border-brand-300 hover:bg-brand-50 transition-colors shadow-sm">
              <span className="text-2xl">{h.emoji}</span>
              <div>
                <div className="text-xs text-gray-500 leading-none">{h.name}</div>
                <div className="font-bold text-brand-700 text-base">{h.number}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

### ═══ DAY 6 — Polish + Deploy ═══
**Target: 6-8 ghante | Goal: S3 pe app deploy ho, sharable URL mile**

#### `frontend/deploy.sh`

```bash
#!/bin/bash
set -e

# .env.shared se values load karo
source ../infra/config/.env.shared

echo "🏗  Building React app..."
npm run build

echo "📤 Deploying to S3: $FRONTEND_BUCKET"
aws s3 sync dist/ s3://$FRONTEND_BUCKET/ \
  --delete \
  --region ap-south-1 \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

# index.html ko no-cache rakho (latest version milti rahe)
aws s3 cp dist/index.html s3://$FRONTEND_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html" \
  --region ap-south-1

echo ""
echo "✅ Frontend deployed!"
echo "URL: http://$FRONTEND_BUCKET.s3-website.ap-south-1.amazonaws.com"
echo ""
echo "NOTE: Agar CloudFront use karna hai:"
echo "  1. AWS Console → CloudFront → Create Distribution"
echo "  2. Origin: $FRONTEND_BUCKET.s3.amazonaws.com"
echo "  3. Default root object: index.html"
echo "  4. Error pages: 404 → /index.html (React Router ke liye)"
```

#### Final Wiring — API Routes (Member 1 se coordinate karo)

```bash
# Yeh commands Member 1 ke infra/scripts/wire-api-routes.sh mein hain
# Tab chalao jab Member 2 aur 3 ke Lambdas deploy ho jayein

HTTP_API_ID=<Member 1 se lo>
REGION=ap-south-1

# Session
aws apigatewayv2 create-route \
  --api-id $HTTP_API_ID \
  --route-key "POST /v1/entry/session" \
  --region $REGION

# Dashboard
aws apigatewayv2 create-route \
  --api-id $HTTP_API_ID \
  --route-key "GET /v1/dashboard/widgets" \
  --region $REGION

# Timeline
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/timeline/extract"
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/timeline/export"

# Complaints
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/complaints/generate"
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/complaints/deliver"

# Notices
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/notices/upload"
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "GET /v1/notices/{notice_id}/analysis"

# Voice
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/voice/input"
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "POST /v1/voice/output"

# Legal aid
aws apigatewayv2 create-route --api-id $HTTP_API_ID --route-key "GET /v1/legal-aid/referrals"
```

---

## 5. DEMO FLOW — JUDGE KO YEH DIKHAAO

```
1. Entry page → Hindi select karo → Voice mode → Guest se shuru
2. Dashboard → Popular issues mein Mumbai se data dikhe
3. Chat → "मेरे पड़ोसी ने मेरी ज़मीन पर दीवार बनाई" type karo
   → Intent: property, Risk badge, Confidence badge, Citation, Action card
4. Action card → "Do This Now" button → Complaint generator khule
5. Complaint generator → Police complaint → form fill karo
   → PDF download karo → Tracking number NYM-MH-MUM-20250227-XXXX
6. Notice Scanner → Koi bhi PDF upload karo (legal notice sample)
   → Deadline badge, Risk level, Demands, Recommended actions
7. Legal Aid → State filter karo → Partner cards dikhao → Call button
8. Crisis Button → Hamesh visible → Click → Helplines dikhao
9. Logo pe 3 baar tap → Calculator appear
```

---

## 6. COST BREAKDOWN — TUMHARA CONTRIBUTION

| Service | Usage | Cost/month |
|---|---|---|
| S3 Static Hosting | React build files | ~$0.50 |
| CloudFront (optional) | CDN delivery | ~$1.50 |
| Route 53 (optional) | Custom domain | ~$0.50 |
| **Member 4 total** | | **~$2** |

---

## 7. FINAL CHECKLIST

```
[ ] npm create vite@latest frontend -- --template react-ts
[ ] npm install react-router-dom axios
[ ] Tailwind installed + configured
[ ] .env.local banaya Member 1 se (VITE_ prefix)
[ ] npm run dev → localhost:5173 khulta hai bina error ke

[ ] Types (/src/types/index.ts) — ek bhi TypeScript error nahi
[ ] LanguageContext — Hindi/English toggle kaam karta hai
[ ] SessionContext — session_id store hota hai
[ ] StealthContext — 3 taps → Calculator mode

[ ] EntryPage — Language select, mode select, guest API call
[ ] DashboardPage — Dashboard API se data aata hai
[ ] ChatPage — WebSocket connect hota hai, message send-receive kaam karta hai
[ ] ChatPage — Confidence badge + Risk badge dikh rahe hain
[ ] ChatPage — Citation list dikh rahi hai
[ ] ChatPage — Action card "Do This Now" button kaam karta hai
[ ] ChatPage — Voice mic button dikh raha hai
[ ] ChatPage — Guest limit 5 ke baad banner aata hai

[ ] TimelinePage — API call → events dikh rahe hain
[ ] TimelinePage — Visual nodes colored hain (red/blue/yellow/purple/green)
[ ] TimelinePage — PDF export button kaam karta hai (new tab mein PDF khulti hai)

[ ] ComplaintGeneratorPage — 6 types ki grid dikh rahi hai
[ ] ComplaintGeneratorPage — Form submit → PDF URL milta hai
[ ] ComplaintGeneratorPage — Tracking number NYM-XX-XXX format mein dikh raha hai
[ ] ComplaintGeneratorPage — Download button kaam karta hai

[ ] NoticeScannerPage — File drag-drop kaam karta hai
[ ] NoticeScannerPage — Uploading → Analyzing states dikh rahe hain
[ ] NoticeScannerPage — Polling 3 seconds mein hoti hai
[ ] NoticeScannerPage — Analysis result mein deadline badge + risk level

[ ] LegalAidPage — State filter se partners change hote hain
[ ] LegalAidPage — Capacity bar dikh rahi hai
[ ] LegalAidPage — Phone link kaam karta hai (tel:)
[ ] LegalAidPage — National helplines grid dikh rahi hai

[ ] CrisisButton — Har page pe dikh raha hai (fixed position)
[ ] CrisisButton — Click → Helplines panel open
[ ] StealthCalculator — Logo 3 taps → Calculator
[ ] StealthCalculator — AC press → Normal app vapas
[ ] GuestLimitBanner — 3 queries baad warning aati hai
[ ] Navbar — Bottom tabs kaam karte hain, active tab highlight hota hai
[ ] Language toggle — Hindi/English switch karta hai instantly

[ ] npm run build — Zero TypeScript errors, Zero warnings
[ ] dist/ folder generate hota hai
[ ] deploy.sh run kiya — S3 pe files upload hue
[ ] Browser mein S3 URL khulta hai
```

# Nyaya Mitra — Team Member Assignment Guide

## 📋 Step 4: Git Setup

### GitHub Repo Banao (Koi ek member kare):
```bash
# 1. GitHub pe naya repo banao: nyaya-mitra
# 2. Local mein:
cd nyayaMitraAI
git init
git add .
git commit -m "chore: initial project structure with infra + frontend"
git remote add origin https://github.com/<YOUR-USERNAME>/nyaya-mitra.git
git push -u origin main
```

### Baaki members ko invite karo:
1. GitHub repo → Settings → Collaborators → Add people
2. Sab members ko `Write` access do

### Branch Strategy:
```
main          ← Production (protected, merge via PR)
├── infra     ← Member 1 (tumhara)
├── backend   ← Member 2
├── docs      ← Member 3
└── frontend  ← Member 4
```

---

## 👥 Member Assignments

### Member 1 (TUM) — Infrastructure + Team Lead
**Status: ✅ Code DONE, ⏳ AWS Deploy pending (credits ka wait)**

| Task | Status | Notes |
|---|---|---|
| CDK Stacks (5 files) | ✅ Done | `infra/lib/*.ts` |
| Python Layer (4 files) | ✅ Done | `infra/layers/shared-python/` |
| Legal Docs (6 files) | ✅ Done | `infra/legal-docs/` |
| Deploy Scripts | ✅ Done | `infra/scripts/` |
| AWS Deploy | ⏳ Wait | $100 credit milne ke baad |

---

### Member 2 — Backend: Chat Pipeline + Voice
**Files to create:** `backend/lambdas/chat/` aur `backend/lambdas/voice/`

| Task | File Location | Description |
|---|---|---|
| Session Handler | `backend/lambdas/entry/session.py` | Session create/manage |
| Chat Orchestrator | `backend/lambdas/chat/orchestrator.py` | Main chat logic |
| S3 RAG Retriever | `backend/lambdas/chat/s3_retriever.py` | Legal docs se context fetch |
| Bedrock Integration | `backend/lambdas/chat/bedrock_client.py` | AI response generate |
| Risk Assessor | `backend/lambdas/chat/risk_assessor.py` | Risk score calculate |
| Voice Handler | `backend/lambdas/voice/handler.py` | Speech-to-text + TTS |
| WebSocket Handler | `backend/lambdas/chat/ws_handler.py` | Real-time chat connection |

**Dependencies:** Shared Python layer already ready hai (`db_utils.py`, `response.py`, `s3_utils.py`)

**Key ENV variables jo chahiye:**
```
TABLE_PREFIX=nyaya-mitra
LEGAL_CORPUS_BUCKET=nyaya-mitra-legal-corpus-<ACCOUNT_ID>
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

---

### Member 3 — Backend: Documents + Notice Analysis
**Files to create:** `backend/lambdas/documents/`

| Task | File Location | Description |
|---|---|---|
| Complaint Generator | `backend/lambdas/documents/complaint.py` | Complaint letter draft |
| Timeline Builder | `backend/lambdas/documents/timeline.py` | Case timeline create |
| Notice Analyzer | `backend/lambdas/documents/notice_analyzer.py` | Legal notice OCR + analysis |
| PDF Generator | `backend/lambdas/documents/pdf_generator.py` | HTML to PDF convert |
| Deadline Reminder | `backend/lambdas/documents/deadline_reminder.py` | Notice deadline alerts |

**Extra layer chahiye:** PDF generation ke liye `fpdf2` ya `reportlab` layer

---

### Member 4 — Frontend (React)
**Status: ✅ Base code DONE, Frontend ko polish karna hai**

| Task | File | Description |
|---|---|---|
| ✅ Base Setup | `frontend/` | Vite + React + Routes done |
| ✅ Landing Page | `src/pages/Landing.jsx` | Hero + Features + CTA |
| ✅ Login Page | `src/pages/Login.jsx` | Login/Register/Guest |
| ✅ Chat Page | `src/pages/Chat.jsx` | Chat UI with mock data |
| ✅ Dashboard | `src/pages/Dashboard.jsx` | Analytics with mock data |
| ✅ Documents | `src/pages/Documents.jsx` | Document list |
| TODO | Cognito connect | `npm install amazon-cognito-identity-js` |
| TODO | API connect | Chat page ko backend API se connect |
| TODO | WebSocket | Real-time chat implement |
| TODO | Voice Mode UI | Mic button + audio playback |
| TODO | Mobile responsive | Test + fix mobile views |
| TODO | Dark Mode | Optional but looks premium |

**Frontend run karne ke liye:**
```bash
cd frontend
npm install
npm run dev   # Opens at http://localhost:5173
```

---

## 🗓️ Timeline Suggestion

| Day | Member 1 | Member 2 | Member 3 | Member 4 |
|---|---|---|---|---|
| Day 1-2 | ✅ Done | Chat Orchestrator | Complaint Generator | Polish Landing + Login |
| Day 3-4 | AWS Deploy (credits milne par) | RAG + Bedrock | Notice Analyzer | Connect API + WebSocket |
| Day 5 | Integration Testing | Voice Mode | PDF Generator | Final UI Polish |
| Day 6 | Final Deploy + .env.shared | Testing | Testing | Build + Deploy Frontend |

---

## 📞 Communication

1. **Daily standup** — 10 min group call
2. **GitHub Issues** — bugs aur tasks track karo
3. **WhatsApp Group** — quick questions
4. Har member apna branch use kare, PR ke through merge karo

# Vyapaar सेतु
### *Baatcheet se business tak.*

[![Phase](https://img.shields.io/badge/Phase-3%20Complete-059669?style=for-the-badge)](docs/PHASE_ROADMAP.md)
[![UI Standard](https://img.shields.io/badge/UI%20Standard-%2410%2C000%20SaaS-0F172A?style=for-the-badge)](docs/DESIGN_SYSTEM.md)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant%20Voice%20SaaS-0D9488?style=for-the-badge)](docs/ARCHITECTURE.md)
[![Backend](https://img.shields.io/badge/FastAPI-Python%203.11%2B-009688?style=for-the-badge&logo=fastapi)](backend/README.md)
[![Frontend](https://img.shields.io/badge/React%2018-Vite%20JS-61DAFB?style=for-the-badge&logo=react)](frontend/package.json)

---

## 1. PRODUCT OVERVIEW

**Vyapaar सेतु** is a premium, production-oriented, AI-powered Voice Commerce and B2B Order Automation SaaS platform engineered specifically for Indian wholesale distributors, FMCG super-stockists, and kirana suppliers.

In the fast-moving Indian wholesale market, distributors lose up to 35% of high-volume sales opportunities during morning and evening rush hours because phone lines are busy, staff are busy billing in the warehouse, or calls go unanswered. Retailers cannot wait and immediately dial competitor wholesalers.

**Vyapaar सेतु solves this by providing every distributor with an always-available, intelligent AI sales employee connected to a dedicated business phone number.** 

When a retailer or kirana store owner calls:
1. The AI answers the call naturally in the caller's preferred language (**Hindi**, **Telugu**, **English**, or colloquial **Hinglish**).
2. Recognizes the retailer and queries the distributor's **actual live MongoDB catalog, real-time stock levels, wholesale case rates, and trade schemes**.
3. Understands colloquial Indian trade units (*bori, peti, carton, packet, darjan*).
4. Summarizes the order and obtains **mandatory verbal confirmation**.
5. Automatically creates a validated, binding purchase order that lands on the **distributor's real-time dashboard via WebSockets with an audible chime**.

> **The Golden Product Principle:**
> **THE VOICE-TO-ORDER WORKFLOW IS THE HEART OF THE PRODUCT.**
> All platform modules exist solely to make the voice-to-order pipeline fast, reliable, and effortless.

---

## 2. QUICKSTART & STARTUP COMMANDS (Windows PowerShell)

### Prerequisites:
- **Node.js:** v18+ (verified on v22.15.1)
- **Python:** v3.11+ (verified on v3.13.1)
- **MongoDB:** Community Server or Atlas (listening on port 27017)

### Terminal 1 — Start the Python FastAPI Backend:
```powershell
cd "c:\HACKATHONS\73. AI INTERNSHIP - GNANI\APP\backend"

# 1. Activate virtual environment (created in Phase 1)
.\venv\Scripts\Activate.ps1

# 2. Run development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API will be available at: http://127.0.0.1:8000*  
*Interactive Swagger docs at: http://127.0.0.1:8000/docs*  
*System Health Check at: http://127.0.0.1:8000/health*

---

### Terminal 2 — Start the React + Vite Frontend:
```powershell
cd "c:\HACKATHONS\73. AI INTERNSHIP - GNANI\APP\frontend"

# Run Vite dev server
npm run dev
```
*Web application will open at: http://localhost:5173*

---

## 3. APPROVED TECHNOLOGY STACK

| Architecture Tier | Approved Technology | Constraints & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React.js (Vite)** | High performance, fast HMR, lean bundle size. **STRICTLY NO NEXT.JS.** |
| **Frontend Language** | **JavaScript (ES6+) ONLY** | `.jsx` and `.js` exclusively. **STRICTLY NO TYPESCRIPT.** |
| **Styling & Tokens** | **Tailwind CSS** | Custom design tokens matching our light-mode enterprise palette. |
| **UI Components** | **shadcn/ui + Sera UI + daisyUI** | Harmonized light-mode component system ($10,000 SaaS standard). |
| **Backend Framework** | **Python (3.11+) / FastAPI** | High-performance asynchronous API server with native WebSocket support. |
| **Validation Layer** | **Pydantic (v2)** | Strict request/response schemas and domain contracts. |
| **Database** | **MongoDB (v6+)** | Multi-tenant document database with compound tenant indexing. |
| **Telephony Gateway** | **Vobiz** *(planned)* | Dedicated business virtual numbers, call control, and audio streams. |
| **Speech-to-Text (STT)**| **Gnani Prisma** *(preferred)* | Optimized for Indian accents, noisy phone lines, and code-switching. |
| **LLM Reasoning** | **Groq (Qwen models)** *(planned)*| Ultra-low-latency conversational reasoning and tool calling. |
| **Text-to-Speech (TTS)**| **Gnani Timbre** *(preferred)* | Natural, expressive, human-like Indian voice synthesis. |
| **Real-Time Layer** | **Native WebSockets** | Instant sub-second order delivery to the distributor dashboard. |

---

## 4. MASTER DOCUMENTATION SUITE

The core intelligence and rules of the project are documented across the following master files:

| Document | File Path | Description |
| :--- | :--- | :--- |
| **Agent Instructions** | [`AGENTS.md`](AGENTS.md) | Permanent operational manual for all coding agents and engineers. |
| **Project Context** | [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | Product vision, target personas, 9-step user journey, and business model. |
| **System Architecture**| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | High-level architecture, directory layout, MongoDB schemas, and voice pipeline. |
| **Design System** | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Design tokens, light theme, Poppins typography, and UI component standards. |
| **Development Rules** | [`docs/DEVELOPMENT_RULES.md`](docs/DEVELOPMENT_RULES.md) | Clean code rules, tenant isolation, security, and manual verification protocols. |
| **Phase Roadmap** | [`docs/PHASE_ROADMAP.md`](docs/PHASE_ROADMAP.md) | 11-phase development blueprint from Phase 0 to Phase 10 with exit gates. |

---

## 5. ACTUAL REPOSITORY STRUCTURE

```text
Vyapaar-Setu/
├── frontend/             # React + Vite Single-Page Application (JavaScript Only)
│   ├── public/           # Static assets, brand marks, and notification audio
│   ├── src/
│   │   ├── app/          # Router & root App component
│   │   ├── components/   # Reusable UI primitives (Button, Input, Badge, Card, etc.) & Layout (Header, Sidebar, Beacon)
│   │   ├── layouts/      # AppShell enterprise layout
│   │   ├── lib/          # Pure utils (cn class merger)
│   │   ├── pages/        # OverviewPage & NotFoundPage
│   │   ├── services/     # api.js & health.service.js
│   │   └── styles/       # globals.css & Tailwind tokens
│   ├── index.html        # Shell with Poppins font preconnect
│   └── package.json      # Dependencies (React 18, React Router v6, Tailwind CSS, Lucide)
│
├── backend/              # Python FastAPI Asynchronous Backend Service
│   ├── app/
│   │   ├── api/          # health.py (GET /health, /api/v1/health, /api/v1/ping)
│   │   ├── core/         # config.py (Pydantic BaseSettings)
│   │   ├── db/           # mongodb.py (Native PyMongo Async client connection pool & health ping)
│   │   └── main.py       # FastAPI application factory & lifespan context
│   ├── venv/             # Local Python virtual environment
│   ├── requirements.txt  # FastAPI, Uvicorn, PyMongo (Async API v4.9+), Pydantic v2
│   ├── .env.example      # Environment variable template
│   └── README.md         # Backend architecture & documentation
│
├── docs/                 # Master System Documentation & Architectural Blueprints
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── DEVELOPMENT_RULES.md
│   └── PHASE_ROADMAP.md
│
├── .gitignore            # Git ignore specification
├── AGENTS.md             # Persistent Agent Operational Instructions
└── README.md             # Repository Overview & Quickstart Guide
```

---

## 6. CURRENT STATUS & GOVERNANCE

> **Current Milestone: PHASE 4 COMPLETED — VOBIZ TELEPHONY INTEGRATION.**
> All Phase 4 deliverables are fully implemented, certified, and verified with 66/66 automated tests passing against MongoDB Atlas (`vyapaar_setu`):
> - **VobizXML Response Builders:** Protocol generation for `<Stream>`, `<Hangup>`, and `<Reject>` instructions directing Vobiz to bidirectional audio streaming.
> - **HMAC-SHA256 Webhook Verification:** Cryptographic signature verification for incoming Vobiz Answer Webhooks with payload decoding for both JSON and form-urlencoded requests.
> - **Phone Number Normalization:** Standard E.164 conversion and 10-digit Kirana mobile extraction for reliable caller-ID matching.
> - **Dedicated Business Line Provisioning:** Virtual phone configuration with strict global uniqueness preventing two distributors from claiming the same phone number.
> - **Caller ID Resolution:** Automatic matching of incoming caller numbers against the distributor's registered Kirana retailer directory (`REGISTERED_RETAILER` vs `UNKNOWN`).
> - **Bidirectional Audio Stream Transport:** WebSocket endpoint (`/api/v1/webhooks/vobiz/media-stream`) receiving raw 16kHz linear PCM frames with packet accounting and base64 codecs.
> - **Call State Machine & Event Logging:** Idempotent call session management (`INITIATED`, `IN_PROGRESS`, `STREAMING`, `COMPLETED`, `REJECTED`, `FAILED`) and immutable chronological audit logging in `call_events`.
> - **Multi-Tenant SaaS Isolation:** Full query, index, and mutation isolation between organizations.
> - **Telephony Dashboard UI:** Responsive `/app/telephony` management dashboard with line provisioning, connection testing, live webhook endpoint copying, call session logs, chronological event timeline drawer, and built-in Kirana call simulation.
> **Standing by for user review and explicit authorization before proceeding to Phase 5.**


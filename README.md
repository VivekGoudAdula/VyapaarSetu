# Vyapaar सेतु
### *Baatcheet se business tak.*

[![Phase](https://img.shields.io/badge/Phase-4%20Telephony%20Migrated-059669?style=for-the-badge)](docs/PHASE_ROADMAP.md)
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
| **Telephony Gateway** | **Twilio Programmable Voice + Media Streams** | Dedicated business phone numbers, TwiML webhooks, and real-time audio streams (PCMU 8kHz). |
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

> **Current Milestone: PHASE 3 COMPLETED — BUSINESS SETUP & CONFIGURATION.**
> All Phase 3 deliverables are fully implemented and verified on the isolated `vyapaar_setu` database:
> - **Product Catalogue Master:** Full CRUD, packaging unit hierarchies (e.g. 1 Carton = 12 Pieces), wholesale rates, MRP, vernacular aliases (`aliases`), category filters, and organization-scoped unique SKU constraint.
> - **Inventory Balances & Ledger:** Stock snapshots (`quantity_on_hand`, `quantity_available`, `reorder_threshold`), real-time stock alert status calculation (`in_stock`, `low_stock`, `out_of_stock`), non-negative stock invariant, and append-only immutable movement ledger (`OPENING_STOCK`, `STOCK_RECEIVED`, `MANUAL_ADJUSTMENT`, `STOCK_DAMAGED`, `STOCK_RETURNED`).
> - **Promotional Schemes & Rules Engine:** CRUD and deterministic calculation engine for `BUY_X_GET_Y` (Free Goods), `VOLUME_SLAB_DISCOUNT`, `PERCENTAGE_DISCOUNT`, and `FIXED_AMOUNT_DISCOUNT` with validity date windows and interactive testing sandbox.
> - **Retailer Directory & Caller ID:** Kirana accounts, validated 10-digit primary mobile numbers for Vobiz telephony matching, GSTIN validation, credit limit tracking, and multiple delivery address management per retailer.
> - **Business Operating Settings:** Trade name profile, weekly operating hours scheduler (Monday–Sunday open/close times), minimum order value (₹), order cut-off times, and serviced delivery areas/PIN codes.
> - **Multi-Tenant Data Isolation:** Strict enforcement via verified `TenantContext` — all queries, indexes, and mutations scoped to `organization_id`.
> - **UI / UX Experience:** 5 responsive pages in `/app` (Products, Inventory, Schemes, Retailers, Settings) crafted to the $10,000 SaaS light-theme benchmark with Poppins typography and emerald `#059669` accents.
> **Standing by for user review and explicit authorization before proceeding to Phase 4.**


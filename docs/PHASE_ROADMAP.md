# PHASE_ROADMAP.md — Master 11-Phase Implementation Blueprint
# VYAPAAR सेतु (Baatcheet se business tak.)

> **GOVERNANCE MANDATE:**
> Development on Vyapaar सेतु proceeds strictly one phase at a time.
> **Current Status: PHASE 1 COMPLETED — PENDING PHASE 2 AUTHORIZATION**
> No future phase (Phase 2 through Phase 10) may begin without explicit written authorization from the user.

---

## ROADMAP AT A GLANCE

| Phase | Phase Name | Primary Objective | Status |
| :---: | :--- | :--- | :---: |
| **0** | **Project Brain & Instructions** | Architecture, design system, engineering rules, roadmap documentation | **COMPLETED** |
| **1** | **Foundation & Premium UI System** | Vite + React (JS), FastAPI, MongoDB connectivity, Tailwind tokens, app shell | **COMPLETED** |
| **2** | **Authentication & Multi-Tenant SaaS**| User auth, organization onboarding, RBAC, backend tenant isolation | *PENDING APPROVAL* |
| **3** | **Business Setup & Configuration** | Product master catalog, inventory ledger, pricing, schemes, retailer book | *PENDING APPROVAL* |
| **4** | **Vobiz Telephony Integration** | Dedicated business number, webhook routing, call lifecycle & streaming | *PENDING APPROVAL* |
| **5** | **AI Voice Engine** | Gnani Prisma STT, Groq LLM, Gnani Timbre TTS, multilingual turn-taking | *PENDING APPROVAL* |
| **6** | **AI Order Processing Engine** | Conversational product matching, stock validation, scheme rules, confirmation | *PENDING APPROVAL* |
| **7** | **Distributor Dashboard** | Real-time WebSocket order desk, live call monitor, audio playback | *PENDING APPROVAL* |
| **8** | **Order Fulfilment & Notifications** | Accept, pack, dispatch, deliver workflow, retailer status notifications | *PENDING APPROVAL* |
| **9** | **Analytics & Business Intelligence** | Real-data sales performance, call conversion metrics, SKU velocity | *PENDING APPROVAL* |
| **10**| **Production Readiness & Deployment**| Security audit, rate limiting, containerization, production deployment | *PENDING APPROVAL* |

---

## DETAILED PHASE BREAKDOWNS

---

### PHASE 0 — Project Brain & Instructions
- **Objective:** Establish the permanent architectural foundation, design tokens, data models, and engineering rules before any application code is generated.
- **Scope & Deliverables:**
  - `AGENTS.md` (root-level agent operational manual)
  - `docs/PROJECT_CONTEXT.md` (product vision, market problem, complete 9-step user journey, roles)
  - `docs/ARCHITECTURE.md` (system architecture, schemas, voice pipeline, multi-tenant design)
  - `docs/DESIGN_SYSTEM.md` ($10,000 SaaS UI standards, color tokens, typography, component specs)
  - `docs/DEVELOPMENT_RULES.md` (code standards, tech constraints, clean code rules, security)
  - `docs/PHASE_ROADMAP.md` (this comprehensive roadmap document)
  - `README.md` (root project overview and documentation index)
- **Dependencies:** None.
- **Boundaries:** Zero application code, zero package installations, zero mock databases.
- **Completion Criteria:** All 7 core documentation files created and strictly validated.
- **Current Status:** **COMPLETED**.

---

### PHASE 1 — Foundation & Premium UI System
- **Objective:** Initialize the decoupled frontend and backend project structure, establish database connectivity, configure Tailwind design tokens, and build the shared application shell.
- **Scope & Deliverables:**
  - Initialized `frontend/` using Vite + React.js (JavaScript ONLY, strictly no Next.js/TS).
  - Configured Tailwind CSS with the official light-mode palette (`#059669` emerald, `#0F172A` deep ink, `#F8FAFC` canvas).
  - Installed Google Font **Poppins** with full Devanagari font rendering for **Vyapaar सेतु**.
  - Built core reusable UI primitives: `Button`, `Input`, `Badge`, `Card`, `Skeleton`, `Separator`, `EmptyState`.
  - Built responsive `AppShell` with enterprise collapsible `Sidebar` and `Header`.
  - Implemented real-time `LiveStatusBeacon` monitoring `/health` telemetry without fake states.
  - Built honest `OverviewPage` with hero welcome, 4-step voice commerce pipeline, and roadmap journey.
  - Initialized `backend/` using Python 3.11+ and FastAPI.
  - Implemented async MongoDB client pool via official native PyMongo Async API (`AsyncMongoClient`) with dynamic replica set discovery and admin ping.
  - Implemented `/health`, `/api/v1/health`, and `/api/v1/ping` endpoints returning HTTP 200 (connected) or HTTP 503 (degraded).
  - Configured strict CORS for Vite local origin and established centralized frontend API client.
- **Dependencies:** Phase 0 complete.
- **Boundaries:** Zero auth logic, zero fake metrics, zero dummy orders.
- **Completion Criteria:** Both frontend and backend start cleanly; `/health` returns genuine MongoDB status; AppShell renders smoothly across viewports.
- **Current Status:** **COMPLETED — VERIFIED**.
  - Initialize `backend/` using Python 3.11+ and FastAPI.
  - Establish persistent MongoDB connection with connection pooling and health check endpoint (`/health`).
  - Build responsive application layout shells (Sidebar, Header with live status beacon, Content canvas).
  - Implement reusable atomic UI primitives (Button, Input, Badge, Card) harmonizing shadcn/ui and Sera UI patterns.
- **Dependencies:** Phase 0 completion and explicit user sign-off.
- **Boundaries:** No auth logic, no complex business workflows, no dummy data.
- **Completion Criteria:** Both `frontend` and `backend` start cleanly via command line; `/health` returns 200 OK from MongoDB; responsive app shell renders cleanly in browser.

---

### PHASE 2 — Authentication & Multi-Tenant SaaS
- **Objective:** Implement secure user authentication, organization registration, role-based access control, and backend tenant isolation.
- **Scope & Deliverables:**
  - User registration and login endpoints with Argon2id password hashing.
  - JWT token generation (short-lived access tokens in memory), refresh tokens with rotation and replay attack detection via HttpOnly cookies.
  - Organization provisioning workflow (`ORGANIZATION_OWNER` creation).
  - Strict Tenant Context extraction dependency (`TenantContext`) enforcing server-derived `organization_id`.
  - RBAC verification (`ORGANIZATION_OWNER` vs `ORGANIZATION_STAFF`).
  - Frontend authentication views: Sign Up (`/register`), Sign In (`/login`), and responsive onboarding.
  - Protected route wrapper (`ProtectedRoute`) and public guard (`PublicOnlyRoute`) in React Router.
  - Rate limiting for brute-force login attack mitigation.
- **Dependencies:** Phase 1 and Phase 1.5 complete.
- **Boundaries:** No catalog management or voice integration.
- **Completion Criteria:** New user can register, create an organization, log in, receive a secure JWT, and access the protected dashboard shell with verified tenant isolation.
- **Status:** **COMPLETED — VERIFIED**. All 12 integration checks passed on isolated `vyapaar_setu` database.

---

### PHASE 3 — Business Setup & Configuration
- **Objective:** Enable wholesale distributors to configure their full business setup: product catalog, stock inventory, tiered pricing, promotional schemes, and retailer directory.
- **Scope & Deliverables:**
  - Product Catalog CRUD APIs and interactive management UI (SKUs, packaging units, MRP, wholesale rate).
  - Inventory tracking ledger with low-stock alert thresholds.
  - Promotional Schemes engine (Buy X Get Y, volume slab discounts, validity dates).
  - Retailer Directory management UI (store name, owner contact, delivery addresses, credit limits).
  - Business operating hours, minimum order values, and delivery area settings.
- **Dependencies:** Phase 2 complete.
- **Boundaries:** Real database persistence only; no fake pre-populated mock records.
- **Completion Criteria:** Distributor can log in, add products, set stock quantities, create an active promotional scheme, and register a retailer with phone number.

---

### PHASE 4 — Vobiz Telephony Integration
- **Objective:** Connect dedicated Vobiz business phone numbers, configure incoming call webhooks, and establish audio streaming bridges.
- **Scope & Deliverables:**
  - Vobiz configuration settings interface in distributor dashboard.
  - Incoming call webhook endpoint (`/api/v1/webhooks/vobiz/inbound-call`) with signature verification.
  - Dedicated phone number association with tenant organizations.
  - Call routing state machine: match caller ID to registered retailer, resolve organization context.
  - Audio streaming bridge setup (handling bidirectional audio chunks with Vobiz).
  - Inbound call lifecycle logging (`calls` and `call_events` collections in MongoDB).
- **Dependencies:** Phase 3 complete and verified Vobiz API credentials.
- **Boundaries:** No AI reasoning or order extraction yet (handled in Phase 5 & 6).
- **Completion Criteria:** When a test call is dialed to the Vobiz number, the webhook triggers, identifies the organization, matches the caller ID, and logs a valid call session.

---

### PHASE 5 — AI Voice Engine
- **Objective:** Implement the real-time voice pipeline integrating Speech-to-Text (Gnani Prisma), LLM reasoning (Groq / Qwen), and Text-to-Speech (Gnani Timbre).
- **Scope & Deliverables:**
  - Gnani Prisma STT integration for real-time Hindi, Telugu, and Indian English transcription.
  - Groq LLM integration with custom system prompts reflecting the distributor's business persona.
  - Gnani Timbre TTS integration for natural, low-latency localized speech synthesis.
  - Voice Session State Manager managing turn-taking, barge-in (interruption handling), and silence detection.
  - Tool calling protocol wiring the LLM to business inquiry tools (`search_products`, `check_stock`, `get_pricing_and_schemes`).
- **Dependencies:** Phase 4 complete and verified Gnani & Groq API credentials.
- **Boundaries:** Pure conversational enquiry; order commitment handled in Phase 6.
- **Completion Criteria:** Caller can dial the number, speak in Hindi, Telugu, or English, ask for product availability and prices, and receive accurate spoken answers derived from the MongoDB catalog.

---

### PHASE 6 — AI Order Processing Engine
- **Objective:** Transform voice conversations into validated, binding purchase orders through conversational intent extraction, stock reservation, and verbal confirmation.
- **Scope & Deliverables:**
  - Conversational item and quantity extraction (supporting trade units: *bori, peti, carton, packet*).
  - Server-side order drafting and mathematical calculation engine (`order_engine.py`).
  - Trade scheme application (automatically applying Buy X Get Y or volume discounts).
  - Conversational order summary readback and mandatory verbal confirmation gate.
  - Atomic order commitment inside MongoDB transaction (decrementing stock, saving order doc).
  - Idempotency protection preventing duplicate orders on repeated webhook triggers.
- **Dependencies:** Phase 5 complete.
- **Boundaries:** Order capture only; fulfillment dashboard sync handled in Phase 7.
- **Completion Criteria:** A complete spoken phone order is placed, confirmed by the caller, validated by the backend, and persisted into MongoDB with accurate itemization and pricing.

---

### PHASE 7 — Distributor Dashboard
- **Objective:** Build the real-time, high-contrast distributor operations dashboard with live WebSocket order feeds, incoming call alerts, and order management.
- **Scope & Deliverables:**
  - WebSocket hub broadcasting live order arrivals, call status updates, and stock warnings.
  - Real-time incoming orders queue with visual pulse indicators and audible chime.
  - Order Detail Drawer: SKU breakdown, customer details, calculated discounts, delivery address.
  - Audio player widget to listen to call recordings and review turn-by-turn transcripts.
  - Instant order actions: **Accept Order**, **Adjust Quantities**, **Reject with Reason**.
- **Dependencies:** Phase 6 complete.
- **Boundaries:** Order review and acceptance; dispatch lifecycle handled in Phase 8.
- **Completion Criteria:** An order placed via voice phone call appears instantly on the distributor's open browser dashboard with an audible chime, full SKU details, and audio transcript.

---

### PHASE 8 — Order Fulfilment & Notifications
- **Objective:** Complete the downstream warehouse fulfillment lifecycle and dispatch notifications to retailers.
- **Scope & Deliverables:**
  - Order state machine: `ACCEPTED` -> `PROCESSING` -> `PACKED` -> `DISPATCHED` -> `DELIVERED`.
  - Packing slip and invoice generation view.
  - Stock reconciliation ledger upon final dispatch.
  - Retailer notification triggers (SMS / WhatsApp / Automated confirmation call) with order status and bill total.
  - Historical order search, filtering by date range, retailer, and status.
- **Dependencies:** Phase 7 complete.
- **Boundaries:** Core fulfillment only; advanced analytics handled in Phase 9.
- **Completion Criteria:** Distributor can advance an accepted order through packing and dispatch, generating an invoice and recording status timestamps.

---

### PHASE 9 — Analytics & Business Intelligence
- **Objective:** Provide actionable business intelligence calculated directly from real database records.
- **Scope & Deliverables:**
  - Revenue, order volume, and average order value (AOV) time-series charts (Recharts).
  - Top-selling SKUs and stock turnover velocity indicators.
  - Retailer purchasing frequency, repeat rates, and outstanding credit metrics.
  - Voice agent operational analytics: total call minutes, order conversion rate, unanswered/failed call logs.
  - CSV/Excel export for accounting and bookkeeping reconciliation.
- **Dependencies:** Phase 8 complete.
- **Boundaries:** No hardcoded mock charts; all data must aggregate genuine MongoDB records.
- **Completion Criteria:** Analytics dashboard renders real aggregated data reflecting orders and calls placed during previous phases.

---

### PHASE 10 — Production Readiness & Deployment
- **Objective:** Comprehensive hardening, security audits, rate limiting, containerization, and production deployment.
- **Scope & Deliverables:**
  - Security audit: OWASP checklist, tenant isolation penetration test, CORS lockdown, secret scrubbing.
  - Rate limiting on public and auth endpoints.
  - Docker containerization (`Dockerfile` for frontend and backend, `docker-compose.yml`).
  - Production logging, error tracking (Sentry-ready), and health check telemetry.
  - Domain configuration, SSL/TLS certificates, and final live telephony verification.
- **Dependencies:** Phase 9 complete.
- **Boundaries:** Final sign-off.
- **Completion Criteria:** The entire platform is deployed to production, accessible via custom domain, and successfully processes end-to-end phone calls from real mobile devices.


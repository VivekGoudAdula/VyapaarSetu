# AGENTS.md — Persistent Agent Operational Instructions
# VYAPAAR सेतु (Baatcheet se business tak.)

> **CRITICAL NOTICE TO ALL AGENTS AND ASSISTANTS:**
> This file is the permanent, non-negotiable operational manual for every coding agent, architect, and assistant working in this repository.
> **Before writing a single line of code, modifying any file, or answering architectural queries, you MUST read this document in full alongside the core documentation in `docs/`.**

---

## 1. CORE PRODUCT IDENTITY & MANDATE

- **Product Name:** `Vyapaar सेतु` *(exact spelling mandatory — never write "Vyapar Setu", "VyapaarSetu", or drop the Devanagari "सेतु")*
- **Official Tagline:** `Baatcheet se business tak.` *(exact spelling mandatory)*
- **Product Domain:** AI-Powered Voice Commerce & B2B Order Automation SaaS for Indian wholesale distributors, FMCG suppliers, and kirana stockists.
- **Primary Market:** India (multilingual: Hindi, Telugu, English, Hinglish).
- **Core Value Proposition:** An always-available AI sales employee connected to a dedicated business phone number (Twilio) that answers incoming retailer calls, answers pricing/stock/scheme enquiries from live distributor data, and automatically captures confirmed orders into the distributor's dashboard.
- **The Core Golden Rule:** **THE VOICE-TO-ORDER WORKFLOW IS THE HEART OF THE PRODUCT.** All supporting modules exist solely to make the voice-to-order pipeline fast, accurate, and seamless. Do not turn this into a bloated generic ERP.

---

## 2. STRICT PHASE GOVERNANCE & EXECUTION BOUNDARIES

The project is governed by a **strict 11-phase linear roadmap (Phase 0 to Phase 10)**.

### The Absolute Boundaries:
1. **Never jump ahead:** You must ONLY work on the specific phase explicitly requested and authorized by the user.
2. **Never begin Phase N+1 automatically:** When you finish Phase N, you must present a Phase Completion Report and **STOP**. Wait for explicit user authorization before touching Phase N+1.
3. **Phase 0 Boundary (CURRENT):** Phase 0 is architectural blueprinting, design systems, and engineering instructions. **Zero application code, zero mock data, zero dependency installation.**
4. **No unauthorized scope expansion:** Do not sneak in future phase features (e.g., adding billing tiers in Phase 2, or adding analytics widgets in Phase 1).

---

## 3. NON-NEGOTIABLE TECHNOLOGY STACK RULES

Every agent must respect these technology constraints without exception. Any pull request or code generation violating these rules will be rejected.

| Layer | Approved Technology | STRICTLY FORBIDDEN |
| :--- | :--- | :--- |
| **Frontend Framework** | **React.js (Vite)** | **NO Next.js. NO Remix. NO Gatsby.** |
| **Frontend Language** | **JavaScript (ES6+) ONLY (`.jsx`, `.js`)** | **NO TypeScript (`.tsx`, `.ts`) unless explicitly instructed.** |
| **Frontend Styling** | **Tailwind CSS** + Design Tokens | Custom monolithic CSS files, inline style spaghetti |
| **Frontend Routing** | **React Router v6+** | Next.js App/Pages router patterns |
| **UI Component Base** | **shadcn/ui** (React/Vite JS path) + **Sera UI** + **daisyUI** | Mixing incompatible design languages; unverified imports |
| **Backend Framework** | **Python 3.11+ / FastAPI** | Django, Flask, Express/Node.js backend |
| **Validation Layer** | **Pydantic v2** | Unvalidated dict passing, raw schema bypass |
| **Database** | **MongoDB (Motor / PyMongo)** | PostgreSQL, MySQL, SQLite, or ORMs that assume relational schemas |
| **Real-Time Layer** | **WebSockets** (FastAPI native) | Polling loops, Firebase Realtime DB |
| **Telephony Integration** | **Twilio Programmable Voice & Media Streams** | Mock telephony, fake provider wrappers |
| **Speech-to-Text (STT)** | **Gnani Prisma** *(preferred candidate)* | Fake browser speech recognition in production |
| **LLM Reasoning** | **Groq (Qwen models candidate)** | Client-side LLM calls, hardcoded responses |
| **Text-to-Speech (TTS)**| **Gnani Timbre** *(preferred candidate)* | Fake browser synthesis in production |

---

## 4. MULTI-TENANT SAAS ISOLATION RULES

Vyapaar सेतु is a strict multi-tenant SaaS application. Every distributor is an isolated `organization`.

1. **Backend Tenant Scoping:** Every single database query, aggregation, update, and deletion must include `organization_id`.
   - *Prohibited:* `db.orders.find({"_id": order_id})`
   - *Mandatory:* `db.orders.find({"_id": order_id, "organization_id": user_org_id})`
2. **Never Trust the Client:** The `organization_id` must be extracted strictly from the authenticated, cryptographically verified user session/JWT token on the server. Never read `organization_id` from unauthenticated client query parameters or request bodies.
3. **Data Segregation:** An organization must NEVER be able to read, write, infer, or list another organization's:
   - Products, stock, SKU pricing, schemes, orders, retailers, call transcripts, audio recordings, or analytics.
4. **Compound Database Indexes:** All high-traffic collections must feature compound indexes prefixed with `organization_id` (e.g., `{"organization_id": 1, "created_at": -1}`).

---

## 5. DESIGN & UI/UX QUALITY STANDARDS ($10,000 SAAS BENCHMARK)

The visual design must look like a high-end, venture-funded enterprise SaaS product.

1. **Light Theme Exclusively:**
   - Crisp white surfaces (`#FFFFFF`), warm off-white canvas (`#F8FAFC`, `#F1F5F9`), subtle neutral borders (`#E2E8F0`).
   - Deep ink/navy typography (`#0F172A`, `#1E293B`) for supreme readability and authority.
   - Refined emerald/teal primary accents (`#059669`, `#0D9488`) representing Indian commercial growth, wealth, and clarity.
   - **STRICTLY NO DARK MODE** unless explicitly mandated in a future phase.
2. **Typography:**
   - Primary font: **Poppins** (Google Fonts) with proper weights (400 Regular, 500 Medium, 600 SemiBold, 700 Bold).
   - Full Devanagari support for proper rendering of **"सेतु"**.
3. **Design Aesthetics:**
   - No generic Bootstrap or default Tailwind admin dashboards.
   - No excessive neon gradients or jarring saturated colors.
   - Generous, structured spacing (4px / 8px grid system).
   - Subtle, elegant elevation (soft dual-layer box shadows, hairline borders).
   - Thoughtful micro-interactions (fast, smooth transitions, skeleton loaders, clear empty and error states).
4. **Responsive First-Class Citizen:**
   - Desktop, laptop, tablet, and mobile views must all be impeccably formatted. Wholesale distributors often review orders on Android phones or tablets in a warehouse; mobile layout is not an afterthought.

---

## 6. REAL IMPLEMENTATION & NO-MOCK-DATA POLICY

1. **No Fake Integrations:** When an integration is configured, it must talk to verified endpoints with real request/response contracts.
2. **No Mock Databases or In-Memory Placeholders in Production Code:** Real MongoDB queries with real schemas.
3. **Never Fake Business Records:** Do not generate random hardcoded dummy orders or fake analytics metrics. All metrics must be computed from persisted database records.
4. **Safe LLM Tool Execution:**
   - The LLM voice agent NEVER writes directly to MongoDB.
   - The LLM executes deterministic Python backend tools (`search_products`, `check_stock`, `get_pricing_and_schemes`, `calculate_order_totals`, `create_order_draft`, `confirm_order`).
   - Every tool call executes standard validation, price recalculation, and stock checks on the server.
5. **Idempotency & Duplicate Prevention:**
   - Incoming telephony webhooks and order confirmation events must use idempotency keys (e.g., `call_id` + `session_sequence`) to prevent duplicate orders during network retries.

---

## 7. MANDATORY AGENT PRE-FLIGHT PROTOCOL

Before undertaking any prompt or instruction in this workspace, every agent must execute the following protocol:

```text
[STEP 1: INSPECT]
  ├─ Read AGENTS.md (this file)
  ├─ Read docs/PROJECT_CONTEXT.md
  ├─ Read docs/ARCHITECTURE.md
  ├─ Read docs/DESIGN_SYSTEM.md
  ├─ Read docs/DEVELOPMENT_RULES.md
  └─ Read docs/PHASE_ROADMAP.md

[STEP 2: VERIFY PHASE SCOPE]
  ├─ Identify the currently active phase.
  ├─ Confirm user has explicitly authorized this specific phase.
  └─ Define the exact boundaries of what is in scope vs out of scope.

[STEP 3: INSPECT EXISTING CODEBASE]
  ├─ Check existing files and directory structure.
  ├─ Ensure no redundant files or conflicting implementations are introduced.
  └─ Verify that all previous phase deliverables remain intact.

[STEP 4: EXECUTE WITH HIGH PRECISION]
  ├─ Write clean, modular, production-ready code.
  ├─ Add clear docstrings and comments for all functions.
  ├─ Maintain strict frontend/backend separation.
  └─ Never break existing working features.

[STEP 5: REPORT & STOP]
  ├─ Present a standardized Phase Completion Report.
  ├─ Provide clear manual verification instructions.
  └─ STOP. Await explicit user review and permission for the next phase.
```

---

## 8. STANDARDIZED PHASE COMPLETION REPORT FORMAT

At the conclusion of any authorized implementation phase, output a report formatted exactly as follows:

```markdown
## Phase [Number] Completion Report: [Phase Name]

### 1. Executive Summary
- Brief 2-3 sentence summary of what was accomplished in this phase.

### 2. Deliverables Summary
- **Files Created:** (Absolute or relative links to each new file)
- **Files Modified:** (List of modified files with brief explanation of changes)
- **Backend Services:** (New endpoints, middleware, models, or services added)
- **Frontend Components:** (New pages, components, hooks, or styles added)
- **Database Changes:** (Collections, indexes, schema updates)
- **Integrations Configured:** (External APIs or services wired up)

### 3. Execution & Verification Steps
- Exact shell commands to start backend, frontend, or tests.
- Step-by-step manual testing instructions for the user to verify functionality.

### 4. Known Limitations & Deferred Items
- Any provider-dependent items pending external verification.
- Explicit confirmation of items deferred to subsequent phases.

### 5. Gate Status & Next Action
- Status: **PHASE [Number] COMPLETE — AWAITING USER APPROVAL TO PROCEED TO PHASE [Number+1]**
```

---

## 9. QUICK REFERENCE POINTERS

- **Product Context & User Journey:** `docs/PROJECT_CONTEXT.md`
- **System Architecture & MongoDB Schemas:** `docs/ARCHITECTURE.md`
- **Design System, UI Tokens & Component Guidelines:** `docs/DESIGN_SYSTEM.md`
- **Coding Standards, Multi-Tenancy & Security Rules:** `docs/DEVELOPMENT_RULES.md`
- **Phase Roadmap & Acceptance Gates:** `docs/PHASE_ROADMAP.md`
- **Project Overview & Quickstart:** `README.md`


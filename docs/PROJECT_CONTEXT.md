# PROJECT_CONTEXT.md — Product Strategy, Vision & Business Architecture
# VYAPAAR सेतु (Baatcheet se business tak.)

---

## 1. EXECUTIVE OVERVIEW

**Vyapaar सेतु** is an enterprise-grade, AI-powered Voice Commerce and B2B Order Automation SaaS platform engineered specifically for the Indian wholesale and distribution ecosystem. 

- **Official Product Name:** `Vyapaar सेतु`
- **Official Tagline:** `Baatcheet se business tak.`
- **Product Category:** B2B Voice Commerce, Inbound Telephony Automation & Distributor Order Management SaaS.
- **Primary Market:** India (initial focus on high-density commercial hubs across Tier-1, Tier-2, and Tier-3 wholesale mandis).

The core premise of Vyapaar सेतु is transformative yet grounded in real-world Indian trade: **give every wholesale distributor a dedicated, tireless, 24/7 AI sales employee capable of receiving high-volume incoming phone calls from retailers, checking real-time inventory and wholesale rates, explaining complex commercial schemes, and capturing confirmed purchase orders directly into an intuitive fulfillment dashboard.**

---

## 2. THE PROBLEM SPACE: INDIAN B2B DISTRIBUTION

Indian wholesale commerce moves through millions of traditional distributor-to-retailer relationships (FMCG, staples, packaged goods, personal care, kirana supply). In this market, phone calls remain the dominant channel for placing B2B orders:

```
[ Traditional B2B Ordering Friction ]

+-----------------------------------------------------------------------------------+
|  Retailer (Kirana Owner)               Distributor (Wholesale Mandi)              |
|                                                                                   |
|  - Calls during peak shop hours        - Phone line constantly busy / call waiting|
|  - Asks repetitive questions:          - Distracted by warehouse commotion        |
|    "Bhaiya, Fortune oil 1L packet hai?" - Scribbles order items on paper slips     |
|    "Maggi 70g box pe kya scheme hai?"   - Mishears quantities or pack sizes       |
|    "Basmati rice 25kg rate kya hai?"   - Fails to answer calls while billing      |
|  - If phone is busy -> Calls rival!     - Result: Lost revenue, dispatch errors   |
+-----------------------------------------------------------------------------------+
```

### Key Industry Pain Points:
1. **Missed Revenue from Busy/Unanswered Calls:** Wholesalers receive 50 to 300+ calls daily. During morning and evening peak windows, up to 35% of retailer calls go unanswered or receive a busy tone. Retailers do not wait; they call the next distributor in the locality.
2. **High-Friction Manual Order Taking:** Staff spend 3 to 5 hours daily answering the exact same questions regarding stock availability, wholesale case rates, and ongoing trade schemes. Orders are scribbled on rough paper slips or received as unstructured voice notes.
3. **Severe Transcription & Fulfillment Errors:** In noisy mandi environments, mishearing pack variants (e.g., 200g vs 500g pouch, carton vs single pieces) causes wrong dispatches, delivery returns, delayed payments, and strained commercial relationships.
4. **Scheme Misunderstandings & Disputes:** Indian FMCG distribution operates on dynamic schemes (e.g., "Buy 10 boxes get 1 box free", "Flat ₹150 off on orders above ₹5,000", "Volume slab discounts"). Retailers often dispute invoices when oral promises made over the phone don't match the final bill.
5. **No Structured Order Pipeline:** Wholesalers lack real-time digital visibility into incoming demand before the dispatch truck is loaded.

---

## 3. BRAND IDENTITY & ETHOS

### 3.1 Etymology and Significance
- **Vyapaar (व्यापार):** The sacred Hindi term for commerce, trade, and business enterprise. It embodies the entrepreneurial spirit of Indian traders, distributors, and merchants.
- **सेतु (Setu):** The ancient Sanskrit and Hindi word for "bridge". 
- **The Concept:** `Vyapaar सेतु` acts as the intelligent bridge spanning the gap between traditional oral commercial habit (natural phone conversations) and modern digital efficiency (automated database orders, inventory management, and structured fulfillment).
- **The Tagline:** `Baatcheet se business tak.` captures the end-to-end journey: from an informal spoken phone conversation to a validated, binding, revenue-generating commercial transaction.

### 3.2 Brand Personality & Visual Tenets
- **Trustworthy & Authoritative:** Handles actual money, real goods, and business-critical inventory. The product must feel dependable, solid, and bank-grade.
- **Intelligent & Perceptive:** Employs advanced voice AI to understand accents, colloquial trade terms (*bori, peti, carton, piece, darjan*), and code-switching (*Hinglish, Telugu-English*).
- **Modern Indian Commerce:** A contemporary, sleek, globally competitive aesthetic. **We strictly avoid stereotypical, outdated, visually cluttered "tally-style" or legacy ERP interfaces.**
- **Clarity & Simplicity:** Wholesale distributors are operational people operating in fast-paced warehouses. Every screen must prioritize legibility, fast scanning, zero clutter, and obvious call-to-actions.

---

## 4. TARGET CUSTOMER SEGMENTS

### 4.1 Primary Initial Segment
1. **FMCG Distributors & Super-Stockists:** Distributing packaged food, beverages, snacks, soaps, detergents, cosmetics, and household items to 100–1,000+ local kirana stores.
2. **Wholesale Grain, Pulse & Commodity Merchants:** Trading staples (rice, flour, oil, sugar, spices) where price fluctuations occur daily and quick stock verification is essential.
3. **Kirana & General Store Wholesalers:** Regional stockists supplying daily necessities to neighborhood retailers.
4. **Beverage & Confectionery Distributors:** High-velocity, high-frequency order cycles requiring rapid order processing.

### 4.2 Future Expansion Opportunities
- **Pharmaceutical Distributors & Stockists:** Prescription drug and OTC distribution (requiring batch-number tracking and drug license verification).
- **Electrical & Hardware Wholesalers:** High-SKU components, wires, switches, plumbing, tools.
- **Building Materials & Sanitaryware Distributors:** Cement, tiles, paint, fittings.
- **Auto Spare Parts Wholesalers:** Complex catalog matching for vehicle parts.

---

## 5. COMPLETE USER JOURNEY

Vyapaar सेतु powers a comprehensive, closed-loop business journey connecting distributors, their staff, and retail callers.

```
[ The Complete Vyapaar सेतु Lifecycle ]

+-----------------------+     +------------------------+     +------------------------+
| 1. Registration       | --> | 2. Org Provisioning    | --> | 3. Business Config     |
| - Distributor signs up|     | - Multi-tenant root    |     | - Catalog & SKUs       |
| - Company, GST, phone |     | - RBAC role assignment |     | - Pricing & Schemes    |
+-----------------------+     +------------------------+     +------------------------+
                                                                         |
                                                                         v
+-----------------------+     +------------------------+     +------------------------+
| 6. AI Conversation    | <-- | 5. Inbound Phone Call  | <-- | 4. Vobiz Telephony     |
| - Retailer identified |     | - Retailer dials       |     | - Assign business no.  |
| - Multilingual dialogue|    | - Webhook routes to org|     | - Webhook url mapped   |
| - Stock/price queries |     +------------------------+     +------------------------+
| - Verbal confirmation |
+-----------------------+
           |
           v
+-----------------------+     +------------------------+     +------------------------+
| 7. Order Engine       | --> | 8. Distributor Dash    | --> | 9. Dispatch & Notify   |
| - Duplicate prevention|     | - Real-time WS alert   |     | - Pack, dispatch, ship |
| - Validated MongoDB   |     | - Accept / Modify / Pak|     | - Retailer notified    |
| - Draft to Confirmed  |     | - Real-time inventory  |     | - Complete order audit |
+-----------------------+     +------------------------+     +------------------------+
```

### Detailed Step-by-Step Breakdown:

#### Step 1 — Distributor Registration
- A wholesale distributor lands on the Vyapaar सेतु web application.
- Enters full name, mobile phone number, official business email, and secure password.
- Provides legal business identity: Company / Trade Name (e.g., *"Sri Balaji Traders & Distributors"*), Business Category (FMCG, Staples, Beverages, etc.), Mandi / Market location, Operating City, State, PIN code, and GSTIN (where applicable).

#### Step 2 — Organization Provisioning (Multi-Tenant Root)
- The platform provisions an isolated `organization` document acting as the boundary for all business data.
- The registering user is assigned the role of `ORGANIZATION_OWNER`.
- System establishes isolated namespaces for catalog, inventory, pricing schemes, customer (retailer) directories, order pipelines, call logs, and voice agent configurations.

#### Step 3 — Business Configuration & Catalog Setup
- **Product Catalog Setup:** Distributor uploads or creates product entries with Name, Brand, Category, SKU code, Barcode, Base Unit (*Piece, Packet, Kilogram, Litre*), Packaging Units (*Pouch, Box, Carton, Bori, Peti*), Pack Multiplier (e.g., 1 Carton = 24 Packets).
- **Pricing & Tier Setup:** Base wholesale rate, Maximum Retail Price (MRP), volume slab discounts (e.g., 1–5 Cartons: ₹1,200/carton; 6+ Cartons: ₹1,150/carton).
- **Inventory Levels:** Current stock quantity, low-stock alert thresholds, out-of-stock ordering policies (allow backorders or reject).
- **Commercial Schemes & Trade Promos:** Active trade promotions (e.g., *"Buy 10 petis get 1 free"*, *"₹200 instant discount on orders above ₹10,000"*, *"5% cash discount on same-day dispatch"*), validity dates, and eligibility rules.
- **Operating Parameters:** Mandi operating hours, daily order cutoff times, delivery zones, minimum order value (MOV).

#### Step 4 — Twilio Telephony Configuration & Webhook Linking
- Distributor connects an assigned business phone number through Twilio Programmable Voice & Media Streams integration.
- The incoming call webhook URL is mapped in Twilio Console to the organization's unique voice session endpoint (`/api/v1/webhooks/twilio/inbound-call`).
- Call parameters configured: greeting language, fallback transfer number (to a human staff member if needed), and operating hours agent behavior.

#### Step 5 — Retailer Initiates Inbound Call
- A kirana store owner or purchasing clerk dials the distributor's dedicated Vyapaar सेतु phone number.
- Twilio receives the call, validates cryptographic signature (`X-Twilio-Signature`), and fires an inbound call webhook with caller identification (`From`, `To`, `CallSid`).
- The backend matches `From` number against the organization's registered `retailers` collection. If recognized, the retailer's store name, previous order history, and credit terms are instantly made available to the voice session context.
- Backend responds with TwiML `<Connect><Stream url="wss://...">` establishing bidirectional WebSocket media streaming.

#### Step 6 — Multilingual AI Conversation & Tool Execution
- The AI agent answers within 2 rings with a warm, professional, localized greeting:
  - *Hindi:* "नमस्ते! श्री बालाजी ट्रेडर्स में आपका स्वागत है। बताइए आज क्या आर्डर लिखवाना है?"
  - *Telugu:* "నమస్కారం! శ్రీ బాలాజీ ట్రేడర్స్ కు స్వాగతం. ఈరోజు ఏ ఆర్డర్ కావాలి?"
  - *English:* "Hello! Welcome to Sri Balaji Traders. How can I help you with your order today?"
- The retailer asks about products using colloquial phrasing: *"Fortune Sunflower Oil 1L pouch ka 5 carton chahiye, stock hai kya? Aur Parle-G 10 rupay wala 2 bori"*
- The AI executes backend business tools:
  1. `search_products(query="Fortune Sunflower Oil 1L")`
  2. `check_stock(product_id="...", quantity=5, unit="carton")`
  3. `get_pricing_and_schemes(product_id="...", quantity=5)`
- The AI responds clearly with available stock, price, and active schemes: *"Fortune Sunflower Oil 1L ke 5 carton available hain. Rate ₹1,420 per carton hai. Aur Parle-G ₹10 wale ke 2 bori ka rate ₹960 per bori hai. Kya main yeh dono items add kar doon?"*
- The AI handles interruptions gracefully, clarifies ambiguity (e.g., distinguishing between 1L pouch vs 1L bottle), and reads back a concise order summary.
- **Mandatory Confirmation Gate:** The AI asks for explicit verbal confirmation: *"Aapka total order ₹8,020 ka hai. Kya main order confirm kar doon?"*

#### Step 7 — Validated Order Creation
- Upon receiving explicit positive verbal confirmation, the backend order engine processes the transaction:
  - Validates stock availability again to prevent race conditions.
  - Recalculates final totals, discounts, schemes, and taxes deterministically on the server.
  - Generates an immutable, idempotent order document linked to the `organization_id`, `retailer_id`, and `call_id`.
  - Sets initial order status to `PENDING_REVIEW` or `ACCEPTED` based on organization settings.

#### Step 8 — Real-Time Distributor Dashboard Sync
- The distributor's dashboard immediately chimes and updates in real time via a persistent WebSocket connection.
- The new order appears at the top of the incoming orders queue, displaying:
  - Retailer store name, phone number, and location.
  - Itemized SKU breakdown with quantities, units, and rates.
  - Audio transcript snippet and direct link to call recording.
  - Clear action buttons: **Accept Order**, **Adjust Quantities**, **Assign Delivery Route**, or **Reject with Reason**.

#### Step 9 — Fulfillment Lifecycle & Retailer Notifications
- Warehouse staff progress the order through standardized states:
  `PENDING` -> `ACCEPTED` -> `PACKING` -> `DISPATCHED` -> `DELIVERED`.
- Stock quantities are decremented upon acceptance/packing.
- Retailer receives status notifications (SMS / WhatsApp / Automated confirmation voice call) with invoice summary and estimated delivery time.

---

## 6. USER PERSONAS & ROLE-BASED ACCESS CONTROL (RBAC)

```
+-----------------------------------------------------------------------------------+
|                           ROLE HIERARCHY & SCOPE                                  |
|                                                                                   |
|  [ PLATFORM_OWNER ]        Superadmin oversight, tenant provisioning, system health|
|          |                                                                        |
|  [ ORGANIZATION_OWNER ]    Distributor proprietor; full control over business data |
|          |                                                                        |
|  [ ORGANIZATION_STAFF ]    Billing clerks & warehouse managers; operational scope  |
|          |                                                                        |
|  [ RETAILER ]              External buyer; places orders via phone / caller ID     |
+-----------------------------------------------------------------------------------+
```

### Role Matrix:

| Capability / Action | Platform Owner | Org Owner (Distributor) | Org Staff | Retailer (Caller) |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Platform Health & Tenants** | YES | NO | NO | NO |
| **Configure Org Profile & GSTIN** | ALL ORGS | OWN ORG ONLY | NO | NO |
| **Connect & Configure Vobiz Number** | VIEW ALL | OWN ORG ONLY | NO | NO |
| **Configure AI Voice Persona & Prompts**| VIEW ALL | OWN ORG ONLY | NO | NO |
| **Add / Edit Catalog & Wholesale Rates**| NO | YES | VIEW ONLY | NO |
| **Update Stock & Minimum Order Values** | NO | YES | YES | NO |
| **Configure Trade Schemes & Discounts** | NO | YES | VIEW ONLY | NO |
| **View Incoming Orders (Dashboard)** | NO | YES (Real-time) | YES (Real-time) | NO |
| **Accept, Pack, Dispatch Orders** | NO | YES | YES | NO |
| **View Call Recordings & Transcripts** | NO | YES | RESTRICTED | NO |
| **Place Orders via Voice Call** | NO | NO | NO | YES (Via Phone) |

---

## 7. CORE PRODUCT PRINCIPLES

1. **The Voice-to-Order Pipeline is the Sun:** Every feature, database model, and interface element is designed to orbit around capturing phone orders accurately and fulfilling them swiftly. We do not build bloated CRM features, accounting ledgers, or HR tools that distract from this core mission.
2. **Zero Hallucination in Commercial Data:** In Indian wholesale commerce, an incorrect price or promised free gift can destroy a decade-long relationship. The AI agent must never guess or fabricate prices, stock quantities, or scheme rules. If an item is not in stock or price is unlisted, the agent must politely state that information is unavailable and offer to connect to human staff.
3. **Deterministic Backend Authority:** The LLM generates natural conversational text and selects tools. **It never performs arithmetic, never applies discounts directly, and never writes directly to the database.** All business calculations are performed by deterministic Python backend services.
4. **Resilience to Mandi Noise & Accents:** Retailers call from busy shop counters with ceiling fans, honking trucks, and background chatter. The voice pipeline must be optimized for noise filtering, interruption handling (barge-in), and natural colloquial trade phrasing.
5. **Radical Simplicity for Wholesalers:** Distributors are not tech-enthusiasts; they are busy business operators. The dashboard must be blindingly obvious, high-contrast, lightning-fast, and operable with minimal clicks.

---

## 8. BUSINESS MODEL & COMMERCIAL STRATEGY

Vyapaar सेतु is monetized through a recurring B2B SaaS model tailored for Indian distribution scales:

1. **Base Platform Subscription (Monthly/Annual):** Fixed fee per organization covering the dashboard, catalog management, inventory tracking, and multi-user staff access.
2. **Telephony & Voice Minute Tier:** Tiered packages of active AI voice calling minutes per month (e.g., 500 mins, 2,000 mins, 5,000 mins) with transparent overage pricing.
3. **Dedicated Virtual Number Hosting:** Monthly rental fee for dedicated, verified Vobiz business phone numbers.
4. **Value-Add Services (Roadmap):** Automated WhatsApp invoice dispatches, bulk broadcast announcements (e.g., notifying all 500 retailers about a new FMCG stock arrival), and priority integration with local accounting software.


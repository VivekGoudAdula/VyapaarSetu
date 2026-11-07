# DESIGN_SYSTEM.md — Master Design System & UI Specifications
# VYAPAAR सेतु ($10,000 SaaS Quality Benchmark)

---

## 1. DESIGN PHILOSOPHY & BRAND DIRECTION

Vyapaar सेतु is engineered to look and feel like a modern, venture-funded enterprise SaaS product built by a world-class design studio. It discards the cluttered, archaic aesthetic of traditional Indian accounting and ERP software in favor of a crisp, purposeful, light-mode interface that commands commercial trust.

- **Exact Wordmark:** `Vyapaar सेतु`
- **Official Tagline:** `Baatcheet se business tak.`
- **Theme Mandate:** **STRICTLY LIGHT THEME ONLY.** 
  - Pure white surfaces, soft off-white canvas backgrounds, whisper-light neutral borders, deep ink typography, and refined emerald/teal accents.
  - Zero dark mode. Dark modes reduce legibility in high-glare Indian warehouse environments and clash with the clean commercial trust required for billing and inventory.

```
[ Visual Essence of Vyapaar सेतु ]

+---------------------------------------------------------------------------------+
|  WARM & PURPOSEFUL        DEEP INK CONTRAST        EMERALD ACCENT               |
|  Canvas: #F8FAFC          Headings: #0F172A        Primary: #059669             |
|  Surface: #FFFFFF         Body: #334155            Hover: #047857               |
|  Border: #E2E8F0          Muted: #64748B           Soft Wash: #ECFDF5           |
|                                                                                 |
|  "Feels like Stripe meets Linear, tailored for Indian wholesale commerce."      |
+---------------------------------------------------------------------------------+
```

---

## 2. COLOR PALETTE & DESIGN TOKENS

The color palette is restrained, semantic, and balanced. Every token serves a functional commercial purpose.

### 2.1 Core Neutral Palette (Surfaces & Typography)
| Token Name | Hex Code | Tailwind Equivalent | Role / Semantic Usage |
| :--- | :--- | :--- | :--- |
| `surface-canvas` | `#F8FAFC` | `bg-slate-50` | Primary app canvas background behind all cards and shells |
| `surface-card` | `#FFFFFF` | `bg-white` | Primary content cards, data tables, modals, and sheets |
| `surface-secondary` | `#F1F5F9` | `bg-slate-100` | Secondary wells, table header rows, subtle badges |
| `surface-hover` | `#F8FAFC` | `hover:bg-slate-50` | Row hover states and clickable item hover |
| `border-subtle` | `#F1F5F9` | `border-slate-100` | Hairline dividers inside nested components |
| `border-default` | `#E2E8F0` | `border-slate-200` | Standard card borders, table dividers, input borders |
| `border-strong` | `#CBD5E1` | `border-slate-300` | Focused borders, active state dividers |
| `text-primary` | `#0F172A` | `text-slate-900` | Primary display headings, metric values, table titles |
| `text-secondary` | `#334155` | `text-slate-700` | Body copy, table cells, form labels, dialog descriptions |
| `text-muted` | `#64748B` | `text-slate-500` | Timestamps, helper text, breadcrumbs, placeholder text |
| `text-inverse` | `#FFFFFF` | `text-white` | Text on solid primary buttons and dark badges |

### 2.2 Primary Brand & Commerce Palette (Emerald / Growth)
Represents prosperity, clear trade, freshness, and transaction completion.
| Token Name | Hex Code | Tailwind Equivalent | Role / Semantic Usage |
| :--- | :--- | :--- | :--- |
| `brand-50` | `#ECFDF5` | `bg-emerald-50` | Primary light badge backgrounds, active row highlights |
| `brand-100` | `#D1FAE5` | `bg-emerald-100` | Soft hover states on emerald elements |
| `brand-200` | `#A7F3D0` | `bg-emerald-200` | Accent borders on highlighted order cards |
| `brand-500` | `#10B981` | `bg-emerald-500` | Status indicators, live call pulsing dots |
| `brand-600` | `#059669` | `bg-emerald-600` | **Primary Call-to-Action Buttons**, active tab indicators |
| `brand-700` | `#047857` | `bg-emerald-700` | Hover state for primary buttons |
| `brand-800` | `#065F46` | `text-emerald-800` | High-contrast text on emerald-50 pill badges |
| `brand-900` | `#064E3B` | `text-emerald-900` | Deep emerald accents and active sidebar icons |

### 2.3 Secondary Accent Palette (Teal / Precision)
Used for voice session indicators, audio waveforms, and telecommunication metrics.
| Token Name | Hex Code | Tailwind Equivalent | Role / Semantic Usage |
| :--- | :--- | :--- | :--- |
| `teal-50` | `#F0FDFA` | `bg-teal-50` | Call log highlights, audio player backgrounds |
| `teal-600` | `#0D9488` | `text-teal-600` | Telephony icons, voice agent badges |
| `teal-700` | `#0F766E` | `bg-teal-700` | Secondary action buttons |

### 2.4 Semantic Status Palette
| Semantic Meaning | Background | Border | Text | Example Usage in Vyapaar सेतु |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Accepted** | `#ECFDF5` (`emerald-50`) | `#A7F3D0` (`emerald-200`) | `#065F46` (`emerald-800`) | `ACCEPTED`, `DELIVERED`, Stock in good supply |
| **Warning / Attention** | `#FFFBEB` (`amber-50`) | `#FDE68A` (`amber-200`) | `#92400E` (`amber-800`) | `PENDING_REVIEW`, Low-stock warning (<20%) |
| **Info / In Progress** | `#EFF6FF` (`blue-50`) | `#BFDBFE` (`blue-200`) | `#1E40AF` (`blue-800`) | `PACKING`, `DISPATCHED`, Active incoming call |
| **Danger / Rejected** | `#FEF2F2` (`red-50`) | `#FECACA` (`red-200`) | `#991B1B` (`red-800`) | `REJECTED`, `CANCELLED`, Out-of-stock blocker |

---

## 3. TYPOGRAPHY SYSTEM

The primary typographic family across all interfaces is **Poppins** (Google Fonts), coupled with standard system fallbacks.

```css
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

### 3.1 Type Scale & Hierarchy
| Level | Font Size | Line Height | Weight | Tracking | Typical Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1** | `32px` (`2rem`) | `38px` | `Bold` (700) | `-0.02em` | Auth hero statements, landing statistics |
| **Heading 1** | `24px` (`1.5rem`) | `32px` | `SemiBold` (600) | `-0.015em` | Dashboard page titles, major screen headers |
| **Heading 2** | `20px` (`1.25rem`) | `28px` | `SemiBold` (600) | `-0.01em` | Section headers, drawer titles, modal headers |
| **Heading 3** | `16px` (`1.0rem`) | `24px` | `SemiBold` (600) | `normal` | Card titles, group section headings |
| **Body Large** | `15px` (`0.9375rem`)| `22px` | `Regular` (400) | `normal` | Featured descriptions, call transcripts |
| **Body Default**| `14px` (`0.875rem`) | `20px` | `Regular` (400) | `normal` | Standard table content, form labels, descriptions |
| **Body Medium** | `14px` (`0.875rem`) | `20px` | `Medium` (500) | `normal` | Table values, strong table headers, button labels |
| **Small / Muted**| `12px` (`0.75rem`) | `16px` | `Regular` (400) | `+0.01em` | Timestamps, helper text, SKU subtexts, metadata |
| **Micro / Tag** | `11px` (`0.6875rem`)| `14px` | `SemiBold` (600) | `+0.03em` | Status pill badges, keyboard shortcut chips |

### 3.2 Special Wordmark Rendering: `Vyapaar सेतु`
- The Latin word "Vyapaar" is rendered in **Poppins Bold** (`font-bold`).
- The Devanagari word "सेतु" is rendered with explicit high-legibility Unicode styling:
```jsx
<span className="font-bold text-slate-900 tracking-tight">
  Vyapaar <span className="text-emerald-600 font-semibold">सेतु</span>
</span>
```

---

## 4. SPACING, ELEVATION & CORNER RADII

### 4.1 The 4px / 8px Spatial Grid
All margins, paddings, and layouts conform strictly to multiples of 4px and 8px:
- `space-1`: 4px — micro gaps between icon and text
- `space-2`: 8px — button internal vertical padding, tight card gaps
- `space-3`: 12px — standard form field vertical padding, badge margins
- `space-4`: 16px — standard container internal padding, horizontal table cell padding
- `space-6`: 24px — dashboard card padding, section separators
- `space-8`: 32px — major layout gutters, modal padding
- `space-12`: 48px — page section vertical spacing

### 4.2 Elevation & Shadow Tokens
Harsh, dark drop-shadows are strictly prohibited. Shadows must be soft, multi-layered, and natural:
```css
/* Card Elevation: subtle hairline border + soft ambient drop */
box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
border: 1px solid #E2E8F0;

/* Popover & Dropdown Elevation */
box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04);

/* Modal & Slide-Over Drawer Elevation */
box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
```

### 4.3 Corner Radii Hierarchy
- `rounded-sm` (4px): Checkboxes, small tags, keyboard shortcut keys
- `rounded-md` (6px): Form inputs, standard buttons, select dropdowns
- `rounded-lg` (8px): Inner card widgets, action panels, table outer wrappers
- `rounded-xl` (12px): Standard dashboard cards, modals, slide-out drawers
- `rounded-2xl` (16px): Large hero cards, authentication panels
- `rounded-full` (9999px): Status pill badges, circular avatars, live audio indicator dots

---

## 5. COMPONENT DESIGN SPECIFICATIONS

### 5.1 Buttons
Buttons must communicate hierarchy clearly. Every view must have at most **one** prominent primary action.

```
[ Primary Action ]       [ Secondary Outline ]     [ Destructive Action ]
+-------------------+    +-------------------+    +-------------------+
|  + Accept Order   |    |  Reject Reason... |    |  Delete Product   |
|  (bg-emerald-600) |    |  (border-slate-200|    |  (bg-red-50       |
|  (text-white)     |    |   text-slate-700) |    |   text-red-700)   |
+-------------------+    +-------------------+    +-------------------+
```

- **Primary Button:**
  - Classes: `bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-150 inline-flex items-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`
  - Usage: Accept Order, Save Product, Confirm Dispatch, Connect Vobiz Number.
- **Secondary / Outline Button:**
  - Classes: `bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all duration-150 inline-flex items-center gap-2`
  - Usage: Export Orders, Filter Catalog, Cancel, View History.
- **Ghost / Icon Button:**
  - Classes: `hover:bg-slate-100 text-slate-600 hover:text-slate-900 p-2 rounded-lg transition-colors`
  - Usage: Audio player controls, table row action menus, modal close buttons.
- **Destructive Button:**
  - Classes: `bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium px-4 py-2 rounded-lg transition-all`
  - Usage: Reject Order, Deactivate SKU, Revoke User.

### 5.2 Forms & Inputs
Inputs must maintain high contrast with distinct focus rings to prevent data-entry fatigue in wholesale offices.
- **Standard Text Input:**
  - Container: `relative flex flex-col gap-1.5`
  - Label: `text-xs font-semibold uppercase tracking-wider text-slate-700`
  - Input: `h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all`
  - Error State: `border-red-300 focus:border-red-500 focus:ring-red-500/20`
  - Helper Text: `text-xs text-slate-500`

### 5.3 Data Tables (Wholesale Grade)
Wholesale distributors live in tables. Tables must be dense, clear, and scannable.
- Header row: `bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 text-left px-4 py-3`
- Row body: `border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-sm text-slate-700 px-4 py-3`
- Numerical columns (Quantity, Rate, Total): `text-right tabular-nums font-mono font-medium`
- Status badge column: Centered status pill with dot indicator.

### 5.4 Order Status Pill Badges
```jsx
// Status Badge Mapping Specification
const STATUS_STYLES = {
  PENDING_ACCEPTANCE: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROCESSING:         "bg-blue-50 text-blue-700 border-blue-200",
  PACKED:             "bg-indigo-50 text-indigo-700 border-indigo-200",
  DISPATCHED:         "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED:          "bg-teal-50 text-teal-800 border-teal-200",
  REJECTED:           "bg-red-50 text-red-700 border-red-200",
  CANCELLED:          "bg-slate-100 text-slate-600 border-slate-200",
};

// Component structure:
<span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
  {statusLabel}
</span>
```

### 5.5 Live Call Monitor & Order Arrival Chime
When an incoming call is active or a voice order lands:
- Real-time pulse indicator: Green pulsating badge with animated beacon (`animate-ping`).
- Audio Feedback: Soft, non-jarring two-tone chime (`order-chime.mp3`) alerting warehouse staff of new voice transactions.

---

## 6. APPROVED COMPONENT LIBRARIES & UNIFIED INTEGRATION STRATEGY

We leverage three approved UI references to accelerate UI assembly while maintaining a bespoke, unified appearance.

### 6.1 Library Roles & Reference Sources

1. **shadcn/ui (React / Vite JavaScript Path):**
   - **Reference:** https://ui.shadcn.com/docs/components
   - **Role:** Core headless/accessible primitives (Dialogs, Dropdown Menus, Popovers, Tabs, Tooltips, Command Palette).
   - **Critical Rule:** Follow the React + Vite + Tailwind JavaScript installation path. **NEVER introduce Next.js or TypeScript artifacts.** Copy individual component primitives into `src/components/ui/` and customize classes to match Vyapaar सेतु design tokens.
2. **Sera UI:**
   - **Reference:** https://seraui.com/docs
   - **Role:** Premium visual micro-interactions, sleek dashboard cards, audio visualizer components, and high-fidelity stats widgets.
   - **Rule:** Adapt components to ensure zero conflicting CSS variables or heavy external runtime requirements.
3. **daisyUI (Selective Use):**
   - **Reference:** https://daisyui.com/components/
   - **Role:** Quick structural primitives (e.g., drawer sliding mechanisms, toggle switches, steps indicators for order fulfillment).
   - **Rule:** Use selectively with semantic class overrides to ensure it matches the light-mode emerald/navy palette.

### 6.2 Harmonization Rules
To ensure the three libraries blend seamlessly:
1. **Unified Token Binding:** All components must use the project's standard Tailwind color tokens (`emerald-600`, `slate-900`, `slate-50`). No component may retain its default purple or blue brand styling.
2. **Standard Radii:** All inputs and buttons must share `rounded-lg` (8px). All cards must share `rounded-xl` (12px).
3. **No Unvetted Heavy Dependencies:** Never install a 300KB component bundle when a 30-line clean Tailwind component achieves the exact same design goal.

---

## 7. RESPONSIVE BREAKPOINT SPECIFICATION

Distributors frequently check their order queues on mobile phones while walking the warehouse floor or loading dispatch trucks.

| Breakpoint | Width Range | Layout Adaptation |
| :--- | :--- | :--- |
| **Mobile (`< 640px`)** | `320px` to `639px` | Single-column stack. Collapsible bottom or drawer navigation. Order cards replace dense tables. Swipeable action drawers for order acceptance. |
| **Tablet (`640px - 1023px`)** | `640px` to `1023px` | Two-column grid. Compact sidebar navigation. Simplified data tables with primary columns visible and expansion drawers. |
| **Laptop (`1024px - 1279px`)**| `1024px` to `1279px` | Full persistent sidebar navigation. Standard data tables with inline quick actions. Multi-panel order inspection. |
| **Desktop (`>= 1280px`)** | `1280px` and above | Wide workspace. Persistent live call feed sidebar alongside full order fulfillment queue and real-time inventory ledger. |

---

## 8. ACCESSIBILITY & PERFORMANCE STANDARDS

1. **Contrast Ratio:** All primary text (`#0F172A`) against canvas (`#F8FAFC`) exceeds WCAG AAA (contrast ratio > 12:1). Secondary text (`#334155`) exceeds WCAG AA (> 7:1).
2. **Keyboard Navigation:** Every modal, drawer, dropdown, and data table action must be accessible via Tab, Shift+Tab, Enter, and Escape.
3. **Focus Rings:** Visible, high-contrast focus rings (`focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`) on all interactive controls. Never use `outline: none` without providing a focus replacement.
4. **Reduced Motion:** Honor `prefers-reduced-motion` media queries by disabling sliding animations and pinging beacons for users requesting reduced motion.


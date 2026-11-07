# DEVELOPMENT_RULES.md — Engineering Standards & Development Protocols
# VYAPAAR सेतु (Baatcheet se business tak.)

---

## 1. TECHNOLOGY STACK LOCKDOWN

Every engineer and AI agent contributing to this repository must adhere strictly to the approved technology stack. Deviations are treated as critical architectural violations.

### 1.1 Approved Stack
- **Frontend Framework:** React.js (v18+) with Vite as the build tool.
- **Frontend Language:** **JavaScript ONLY (ES6+)**. Files must use `.jsx` and `.js` extensions.
- **Frontend Styling:** Tailwind CSS (v3+) configured with custom design tokens.
- **Frontend Routing:** React Router DOM (v6+).
- **Backend Framework:** Python (3.11+) with FastAPI.
- **Data Validation:** Pydantic (v2) for all request and response contracts.
- **Database:** MongoDB (v6+) via official PyMongo Async API (`pymongo.AsyncMongoClient` v4.9+).
- **Real-Time Communication:** Native WebSockets via FastAPI.
- **Charts & Data Viz:** Recharts.

### 1.2 Prohibited Technologies & Anti-Patterns
- **STRICTLY NO Next.js:** Do not import `next/navigation`, `next/router`, `next/image`, or use Next.js file-system routing conventions.
- **STRICTLY NO TypeScript:** Do not create `.ts` or `.tsx` files, and do not introduce TypeScript type annotations in JavaScript files unless explicitly commanded by the user in writing.
- **NO Alternative Backends:** No Node.js / Express or Django backends. The entire backend is Python FastAPI.
- **NO Relational ORMs:** Do not introduce SQLAlchemy, Prisma, or SQL engines. Persist data exclusively in MongoDB.
- **NO Mock / Fake Implementations:** Do not generate fake in-memory databases, hardcoded mock order generators, or dummy external APIs. Build genuine production logic.

---

## 2. CODING PRACTICES & CLEAN CODE RULES

### 2.1 General Rules (Mandatory User Rules)
1. **Clean & Readable:** Code must be clear, well-spaced, and self-documenting.
2. **Meaningful Identifiers:** Variable, function, and class names must clearly indicate their intent (e.g., `calculate_order_totals()` instead of `calc()`; `is_order_confirmed` instead of `flag`).
3. **Mandatory Comments & Docstrings:** Every function, class, and critical logical branch must include a concise docstring or comment explaining its purpose, parameters, and return value.
4. **Single Responsibility Principle:** Keep functions short (< 40 lines where practical) and focused on a single responsibility.
5. **Shallow Nesting:** Avoid deep nesting (maximum 3 levels of indentation). Use early returns (guard clauses) to handle error conditions.
6. **Consistent Formatting:** Enforce consistent indentation (2 spaces for JS/Tailwind, 4 spaces for Python).

### 2.2 Python (Backend) Conventions
- Use async/await for all database queries and external network requests:
  ```python
  async def get_active_schemes(org_id: str, product_id: str) -> List[Scheme]:
      """
      Retrieve all currently active promotional schemes for a given product within an organization.
      
      Args:
          org_id: The tenant organization ID.
          product_id: The target product ID.
          
      Returns:
          List of valid Scheme models.
      """
      now = datetime.now(timezone.utc)
      cursor = db.schemes.find({
          "organization_id": ObjectId(org_id),
          "target_product_id": ObjectId(product_id),
          "is_active": True,
          "start_date": {"$lte": now},
          "end_date": {"$gte": now}
      })
      return [Scheme(**doc) async for doc in cursor]
  ```
- Type hints must be used across all Python function signatures for static analysis and IDE autocomplete.
- Handle database exceptions explicitly; never use broad bare `except:` blocks.

### 2.3 JavaScript / React (Frontend) Conventions
- Functional components exclusively with standard React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`).
- Extract domain business logic into custom hooks (e.g., `useOrderQueue`, `useCatalogSearch`, `useVoiceSession`).
- Prop destructuring in component arguments with default fallbacks:
  ```jsx
  /**
   * StatusBadge renders an accessible, color-coded status pill for orders and calls.
   * 
   * @param {Object} props
   * @param {string} props.status - Order or call status code.
   * @param {string} [props.label] - Optional user-facing label override.
   */
  export function StatusBadge({ status, label }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
        {label || config.label}
      </span>
    );
  }
  ```

---

## 3. MULTI-TENANCY & DATABASE CONVENTIONS

### 3.1 Strict Tenant Scoping
Every MongoDB query, aggregation, update, and deletion MUST include `organization_id`.
```python
# PROHIBITED (Severe Security Vulnerability):
order = await db.orders.find_one({"_id": ObjectId(order_id)})

# MANDATORY:
order = await db.orders.find_one({
    "_id": ObjectId(order_id),
    "organization_id": ObjectId(current_user.organization_id)
})
```

### 3.2 ACID Transactions for Order Commit
When an order is confirmed, stock reservation and order document creation must be executed atomically inside a MongoDB transaction session:
```python
async with await mongo_client.start_session() as session:
    async with session.start_transaction():
        # 1. Verify stock availability with lock
        # 2. Decrement available stock in inventory collection
        # 3. Insert order document with PENDING_ACCEPTANCE status
        # 4. Commit transaction
```

### 3.3 Compound Index Discipline
No collection may be queried without verified index coverage. All tenant-scoped collections must prefix compound indexes with `organization_id`.

---

## 4. API ARCHITECTURE & COMMUNICATION STANDARDS

### 4.1 Standardized API Response Envelope
All REST API endpoints must return a predictable JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Order accepted successfully",
  "error": null,
  "metadata": {
    "timestamp": "2026-11-07T12:00:00Z",
    "request_id": "req_8492038102"
  }
}
```

In the event of an error:
```json
{
  "success": false,
  "data": null,
  "message": "Insufficient stock for SKU FMCG-OIL-FORT-1L",
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "details": {
      "requested": 5,
      "available": 2
    }
  },
  "metadata": {
    "timestamp": "2026-11-07T12:00:00Z",
    "request_id": "req_8492038102"
  }
}
```

### 4.2 HTTP Status Code Standards
- `200 OK`: Successful read, update, or general operation.
- `201 Created`: Successful creation of an organization, product, or order.
- `400 Bad Request`: Malformed payload, invalid business rule parameters.
- `401 Unauthorized`: Missing, expired, or invalid JWT authentication token.
- `403 Forbidden`: Authenticated user lacks permission or attempts cross-tenant access.
- `404 Not Found`: Resource does not exist within the tenant's scope.
- `409 Conflict`: Duplicate SKU, idempotency key collision, or phone number conflict.
- `422 Unprocessable Entity`: Pydantic validation failure.
- `500 Internal Server Error`: Unhandled application exception.

---

## 5. VOICE AI INTEGRATION & TOOL SAFETY RULES

1. **Deterministic Backend Authority:** The LLM generates natural conversational text and selects tools. **It never performs arithmetic, never applies discounts directly, and never writes directly to the database.**
2. **Tool Input Validation:** Every tool invoked by the LLM must validate its parameters through a strict Pydantic model before touching services or the database.
3. **No Direct MongoDB Access:** Tools interact exclusively through Python business service layers (`catalog_service`, `inventory_service`, `order_engine`).
4. **Idempotent Order Creation:** Order submission tools must require an `idempotency_key` (derived from `call_sid` + `turn_count`) to guarantee that repeated tool calls or retried webhooks cannot generate duplicate orders.

---

## 6. SECURITY & SECRETS MANAGEMENT

1. **Zero Secret Hardcoding:** API keys (Vobiz, Gnani, Groq), database connection URIs, and JWT signing secrets must reside strictly in environment variables read through Pydantic `BaseSettings`.
2. **No Real `.env` Files in Git:** Ensure `.env` is listed in `.gitignore`. Provide a complete `.env.example` with documented keys and dummy placeholders.
3. **Password Security:** Use `Argon2id` via the `pwdlib` or `passlib` Python library with secure salt generation. Plaintext passwords must never touch logs or databases.
4. **Audio & Transcript Privacy:** Call recordings contain sensitive business trade data and customer mobile numbers. Transcripts must be accessible only to authenticated Organization Owners, and audio recording URLs must be short-lived signed URLs.

---

## 7. MANUAL VERIFICATION & TESTING PROTOCOL

Vyapaar सेतु emphasizes rapid, reliable manual verification by the product owner over fragile, slow end-to-end automated test suites that hinder rapid iteration.

### For Every Implemented Phase:
1. **Startup Verification:** Ensure both backend (`uvicorn`) and frontend (`vite`) start cleanly without dependency errors, missing environment variables, or import crashes.
2. **Step-by-Step Manual Guide:** Every phase completion report must provide the exact curl commands, browser URLs, and UI click paths for the user to manually verify every new feature.
3. **Zero Untested Claims:** Never claim a feature or external integration is "working" unless it has been genuinely connected and tested against real endpoints.

---

## 8. PHASE COMPLETION & STOP PROTOCOL

When a development phase is completed:
1. Conduct a rigorous self-audit against that phase's deliverables.
2. Ensure no application code from future phases was created.
3. Emit the standardized **Phase Completion Report** (as specified in `AGENTS.md`).
4. **STOP.** Do not start the next phase. Wait for explicit user authorization.


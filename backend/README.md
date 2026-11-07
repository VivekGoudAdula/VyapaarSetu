# Vyapaar सेतु — Backend API Service
### *Baatcheet se business tak.*

High-performance, asynchronous REST API service built with Python 3.11+ and FastAPI.

---

## 1. Local Development Setup (Windows PowerShell)

### Step 1: Create and Activate Virtual Environment
```powershell
cd "c:\HACKATHONS\73. AI INTERNSHIP - GNANI\APP\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Configure Environment
```powershell
cp .env.example .env
```
*(Customize `MONGODB_URI` in `.env` if connecting to MongoDB Atlas or an external instance)*

### Step 4: Run the Development Server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 2. API Endpoints (Phase 1 Foundation)

- `GET /` — API metadata and status.
- `GET /health` — Genuine system health check (pings MongoDB).
- `GET /api/v1/health` — Versioned health check endpoint.
- `GET /api/v1/ping` — Lightweight liveness probe.
- `GET /docs` — Interactive OpenAPI Swagger UI documentation.
- `GET /redoc` — ReDoc API documentation.


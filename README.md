# GEM — Government e-Marketplace Bid Verification Platform

**SIH 2026 | PS Code: SIH26100**

An automated bid-eligibility verification platform for GeM procurement. Cross-verifies bidder-submitted documents against tender requirements using a deterministic rule engine, simulated portal adapters, and bounded AI extraction — producing a compliance score, risk level, advisory, and tamper-evident audit trail for procurement officers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React/Vite Frontend  (port 3000)                        │
│  ├── Login / RBAC (OFFICER | EVALUATOR | ADMIN | AUDITOR)│
│  ├── Dashboard — KPIs, activity feed, state summary      │
│  ├── Tenders — list + overview + requirement matrix      │
│  ├── Bidder Queue — work list + compliance scores        │
│  ├── Verification Workspace — 3-pane evidence viewer     │
│  ├── Review & Submit — officer decision + justification  │
│  ├── Document Vault — SHA-256 hashed evidence store      │
│  ├── Evaluation — deterministic benchmark metrics        │
│  ├── Audit Trail — SHA-256 hash chain + tamper demo      │
│  └── Settings — portal simulator + disclaimer panel     │
│                         │                                │
│  Express.js API Server  ← serves React SPA              │
│  ├── TypeScript Rule Engine (GSTIN/PAN/CIN/Udyam checks) │
│  ├── Simulated Portal Adapters (5 adapters)              │
│  ├── Audit Chain Service (SHA-256, tamper detection)     │
│  └── Advisory Service (Gemini-optional, template-first)  │
└───────────────────────────────────────────────────────┬──┘
                                                        │
                              FastAPI Bridge (optional) │
                                                        ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI Python Backend  (port 8000)                     │
│  ├── Python Rule Engine (PyYAML YAML rule configs)       │
│  ├── Validators: GSTIN Mod-36, PAN, Udyam, EPFO, ESIC   │
│  ├── Scoring Engine (weighted compliance score)          │
│  ├── Risk Evaluator (HIGH/MEDIUM/LOW independent axis)   │
│  ├── Advisory Generator (template + optional LLM)        │
│  └── SHA-256 Audit Chain (tamper-evident records)        │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Option A: Both servers (full stack)

```bash
# Terminal 1 — Python Backend (Rule Engine)
source .venv/bin/activate
pip install -e .
uvicorn gem_api.main:app --reload --port 8000

# Terminal 2 — React Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open: **http://localhost:3000**

### Option B: Combined startup script

```bash
./start.sh
```

### Option C: Frontend only (Express local rule engine)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open: **http://localhost:3000** — works without FastAPI; uses Express-local TypeScript rule engine.

---

## Demo Accounts

| Role | Email | Capabilities |
|------|-------|-------------|
| **Officer** | `officer@cpcl.gov.in` | Verify bids, submit decisions, view all |
| **Evaluator** | `evaluator@cpcl.gov.in` | View verification, assist officer |
| **Admin** | `admin@tenderguard.gov.in` | Configure portals, manage settings |
| **Auditor** | `auditor@cag.gov.in` | Read-only — audit chain & records |

## Demo Tenders

| Tender | Status | Bidders |
|--------|--------|---------|
| GEM/2025/0012 — CPCL Office Building | VERIFICATION | 6 bidders |
| MECL/IT/2026/048 — Data Center Supply | VERIFICATION | 22 bidders |
| HPCL/SEC/2026/091 — Security Services | DRAFT | 16 bidders |

## Key Demo Scenarios

| Case | Bidder | Result | Reason |
|------|--------|--------|--------|
| **A** | ABC Infra Solutions | FAIL (72% HIGH) | CIN not in MCA DB + GST filing overdue |
| **B** | Shree Tech Pvt Ltd | PASS (98% LOW) | All 18 requirements verified |
| **C** | National BuildCorp | REVIEW (92% LOW) | OEM stamp blurred (OCR confidence 55%) |
| **D** | Omkar Enterprises | UNVERIFIABLE | EPFO portal gateway timeout (5000ms) |
| **E** | Delta Constructions | FAIL (41% HIGH) | Debarred under GFR 151 (MoHUA Order) |
| **F** | Premier Engineering | FAIL (64% HIGH) | GSTIN-PAN cross-match structural mismatch |
| **G** | Audit Tamper Demo | DETECTED | SHA-256 chain broken — `POST /api/audit/tamper` |

## API Endpoints (Express — port 3000)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/login` | Login by email |
| POST | `/api/auth/switch-role` | Switch between RBAC roles |
| GET | `/api/dashboard` | KPIs and activity feed |
| GET | `/api/tenders` | List all tenders |
| GET | `/api/tenders/:id` | Single tender with requirements |
| GET | `/api/tenders/:id/bidders` | Bidder queue for tender |
| GET | `/api/bids/:id` | Bid detail with all requirement results |
| POST | `/api/bids/:id/verify` | Re-run deterministic verification |
| POST | `/api/bids/:id/decision` | Submit officer decision |
| GET | `/api/bids/:id/requirements/:reqId/advisory` | Get AI advisory |
| GET | `/api/audit` | Full audit chain |
| POST | `/api/audit/verify` | Verify SHA-256 chain integrity |
| POST | `/api/audit/tamper` | Demo: tamper a record |
| POST | `/api/audit/reset` | Reset to valid state |
| GET | `/api/portals` | Simulated portal adapter status |
| POST | `/api/portals/set-status` | Set portal failure mode |
| GET | `/api/evaluation` | Benchmark accuracy metrics |
| GET | `/api/limitations` | System disclaimers & disclosures |

## API Endpoints (FastAPI — port 8000)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tenders` | Tenders (Python data) |
| GET | `/api/tenders/:id` | Tender detail |
| GET | `/api/tenders/:id/bidders` | Bidder evaluations |
| GET | `/api/bidders/:id/evaluation` | Full Python rule engine evaluation |
| POST | `/api/bidders/:id/action` | Submit officer action |
| GET | `/api/audit/records` | Python audit records |
| GET | `/api/audit/verify` | Verify Python audit chain |
| GET | `/api/limitations` | System disclaimers |
| GET | `/docs` | Interactive OpenAPI docs |

---

## Key System Properties

### Determinism
- Same evidence in → same result out. Every time.
- Rule engine is pure Python/TypeScript functions, not ML models.

### Tamper-Evidence
- Every verification event creates a SHA-256 hash chained to the previous record.
- `POST /api/audit/tamper` + `POST /api/audit/verify` demonstrates detection.

### Resilience
- Portal TIMEOUT/DOWN → `UNVERIFIABLE` (never a false PASS, never a false FAIL)
- `UNVERIFIABLE` stays in score denominator but gets 0 score weight.

### AI Boundary
- Zero LLM in the eligibility decision path.
- Optional Gemini advisory rewrite is gated by regex validators with deterministic template fallback.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 4 |
| Frontend Server | Express 4, TypeScript, tsx |
| Python Backend | FastAPI 0.100+, Pydantic 2 |
| Rule Engine | Pure Python/TypeScript, YAML configs |
| Validators | GSTIN Mod-36, PAN regex, CIN, Udyam |
| Document Extraction | PyMuPDF + Tesseract OCR + OpenCV |
| Matching | rapidfuzz token-set-ratio |
| Audit Chain | SHA-256 hash chain (insert-only) |
| Database | PostgreSQL (production), In-memory (demo) |
| Deployment | docker-compose (API + DB + Frontend) |

---

> **Disclaimer**: All portal integrations are **SIMULATED ADAPTERS** — labelled throughout. All bidder data is **SYNTHETIC**. Designed for on-premises government deployment. Hosted demo is for evaluation only.

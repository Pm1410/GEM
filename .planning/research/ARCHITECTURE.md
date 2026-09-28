# Architecture Research: GeM Bid Verification Platform

## Recommended Architecture

### Overview

```
Upload → Sanitise → Extract → Validate → Rule Engine → Score/Risk → Advisory → Officer → Audit
```

Three-tier: **API** (FastAPI) → **Processing** (extraction + rule engine) → **Storage** (PostgreSQL).

### Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  Dashboard │ Evidence Viewer │ Officer Panel │ Admin │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│                    API Layer (FastAPI)               │
│  Upload │ Bidder │ Tender │ Verify │ Audit │ Auth   │
│  ┌──────────────────────────────────────────────┐   │
│  │              RBAC Middleware                  │   │
│  │  officer │ evaluator │ admin │ auditor(RO)   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Processing Layer                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Extraction  │  │ Validators  │  │ Rule Engine  │ │
│  │ PyMuPDF/OCR │  │ GSTIN/PAN/  │  │ YAML configs │ │
│  │ + rapidfuzz │  │ Udyam/etc.  │  │ Pure funcs   │ │
│  └──────┬─────┘  └──────┬──────┘  └──────┬───────┘ │
│         │               │                │          │
│  ┌──────▼───────────────▼────────────────▼───────┐  │
│  │           Portal Adapter Layer                │  │
│  │  PortalAdapter.lookup(id) → PortalResult      │  │
│  │  MockGSTN │ MockUdyam │ MockEPFO │ Mock...    │  │
│  │  {status, fields, fetched_at, latency_ms,     │  │
│  │   source: 'SIMULATED' | 'LIVE'}               │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │           Score + Risk Engine                 │  │
│  │  Frozen weighted formula │ Independent risk   │  │
│  │  UNVERIFIABLE = 0 in denominator              │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │           Advisory Generator                  │  │
│  │  Template-first │ Optional model rewrite      │  │
│  │  Must cite REQ IDs │ Validation gate          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Storage Layer (PostgreSQL)              │
│  Tenders │ Bidders │ Evidence │ Results │ Audit     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Audit Table (INSERT-ONLY role)               │  │
│  │  Hash chain: sha256(prev_hash + payload)      │  │
│  │  Tender version + rule-set version            │  │
│  │  Evidence hashes │ Officer decisions          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Patterns

#### 1. Portal Adapter Pattern (Strategy + Dependency Injection)
```python
class PortalAdapter(ABC):
    @abstractmethod
    async def lookup(self, id_value: str) -> PortalResult: ...

@dataclass
class PortalResult:
    status: str          # e.g., "ACTIVE", "INACTIVE", "NOT_FOUND"
    fields: dict         # portal-specific response fields
    fetched_at: datetime
    latency_ms: int
    source: Literal["SIMULATED", "LIVE"]

class MockGSTN(PortalAdapter):
    async def lookup(self, gstin: str) -> PortalResult:
        # Injectable: delay, failure modes, specific responses
        ...
```

#### 2. Rule Engine Pattern (Pure Functions)
```python
# rules/gst.yaml
- id: GST_001
  mandatory: true
  applies_if: tender.gst_required
  evidence: [GST_CERTIFICATE]
  checks: [GSTIN_CHECKSUM, GSTIN_PAN_MATCH, PORTAL_ACTIVE, RETURN_FILING_CURRENT]
  on_fail: FAIL
  on_missing: REVIEW
  on_portal_down: UNVERIFIABLE

# engine.py — pure function, no side effects
def evaluate_requirement(req_config, evidence, portal_results) -> RequirementResult:
    ...
```

#### 3. Extraction Pipeline
```
PDF → detect type (native/scan) → extract text → regex/template match → fallback to model → grounding check → structured output
```
- **Grounding rule:** Every extracted value must appear verbatim in source text, else result = REVIEW
- **Hybrid strategy:** Native text extraction (PyMuPDF) first → OCR (Tesseract+OpenCV) for scanned pages → LLM fallback for unstructured text only

#### 4. Audit Hash Chain
```python
record = {
    "tender_id": ...,
    "tender_version": ...,
    "rule_set_version": ...,
    "requirement_results": [...],
    "evidence_hashes": [...],  # sha256 of each document
    "score": ...,
    "risk": ...,
    "advisory_text_hash": ...,
    "officer_decision": ...,
    "officer_justification": ...,
    "timestamp": ...,
    "prev_hash": ...,
    "hash": sha256(prev_hash + json(payload))
}
```

### Data Flow

1. **Upload phase:** Documents uploaded → file type/size validated → sanitised → stored with SHA-256 hash
2. **Extraction phase:** Each document processed → fields extracted → regex/template first, model fallback
3. **Validation phase:** Extracted fields → format validators (GSTIN checksum, PAN format, etc.)
4. **Portal verification:** Adapter queries for each relevant portal → results cached with timestamp
5. **Rule evaluation:** Tender config + evidence + portal results → per-requirement result state
6. **Scoring:** Requirement results → frozen formula → compliance score + independent risk
7. **Advisory:** Structured results → template advisory → optional model rewrite → validation gate
8. **Officer review:** Results presented → officer decides → mandatory justification → audit record

### Security Considerations
- File type/size validation on upload
- Text sanitisation (strip hidden text, macros)
- Encryption at rest
- No LLM in decision path (prevents PDF injection attacks)
- RBAC on API and UI (officer, evaluator, admin, auditor read-only)
- Advisory sees only structured results (not raw PDF content)
- Retention policy aligned with DPDP Act 2023 principles

---
*Research completed: 2026-09-28*

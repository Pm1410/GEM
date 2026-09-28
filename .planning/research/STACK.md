# Stack Research: GeM Bid Verification Platform

## Recommended Stack

### Core API — FastAPI (Python)
- **Why:** Async-first, auto-generated OpenAPI docs, Pydantic validation, background task support
- **Version:** 0.100+ (latest stable)
- **Key features needed:** BackgroundTasks for extraction jobs, dependency injection for portal adapters, middleware for RBAC
- **Alternative considered:** Django REST — heavier, not needed for a hackathon prototype

### Database — PostgreSQL
- **Why:** Transactional integrity, JSONB for flexible evidence storage, native UUID support, row-level security for audit insert-only role
- **Key pattern:** Separate audit table with INSERT-only DB role (`CREATE ROLE auditor_insert; GRANT INSERT ON audit_trail TO auditor_insert;`)
- **ORM:** SQLAlchemy 2.0 with async support or raw SQL via asyncpg
- **Alternative considered:** SQLite — insufficient for concurrent access and role-based security demo

### Document Extraction
- **PyMuPDF (fitz):** Native PDF text extraction — fast, accurate for born-digital PDFs
- **Tesseract OCR + OpenCV:** For scanned documents — OpenCV preprocessing (deskew, denoise, binarize) before Tesseract
- **Strategy:** Always attempt native extraction first; fall back to OCR only for image-based pages
- **rapidfuzz:** Token-set-ratio similarity for entity name matching (e.g., company name normalisation)

### Frontend — React / Next.js
- **Why:** SSR for dashboard, component-based UI, large ecosystem
- **Key components needed:** Evidence viewer with region highlighting, requirement table, score/risk dashboard, officer workflow panel
- **Styling:** Tailwind CSS or Chakra UI for rapid prototyping

### Rule Engine — Python + YAML
- **Why:** Pure functions, unit-testable, no LLM dependency, human-readable configs
- **Pattern:** YAML defines tender requirements → Python module evaluates each check → deterministic result state
- **Versioning:** Rule configs carry version numbers; audit records store which version was used

## Validator Formats (Research Findings)

### GSTIN (15-character alphanumeric)
| Position | Content | Example |
|----------|---------|---------|
| 1–2 | State code (Census 2011) | 23 (MP) |
| 3–12 | PAN of holder | ABCDE1234F |
| 13 | Entity code (1-9, A-Z) | 1 |
| 14 | Default 'Z' | Z |
| 15 | Checksum (Mod-36) | 5 |

**Checksum algorithm:** Convert chars 1–14 to numeric (0-9 → 0-9, A-Z → 10-35). Multiply each by alternating 1/2. If product ≥ 36, reduce: (product % 36) + floor(product / 36). Sum all. Checksum = (36 - (sum % 36)) % 36, mapped back to alphanumeric.

**Critical cross-check:** Characters 3–12 of GSTIN = holder's PAN. Deterministic verification.

### PAN (10-character alphanumeric)
Format: `[A-Z]{5}[0-9]{4}[A-Z]`
- Chars 1–3: Alphabetic series (AAA–ZZZ)
- Char 4: Status (P=Person, C=Company, H=HUF, F=Firm)
- Char 5: First letter of surname/entity
- Chars 6–9: Sequential number (0001–9999)
- Char 10: Alphabetic check digit

### Udyam (19-character)
Format: `UDYAM-XX-00-0000000`
- `UDYAM`: Fixed prefix
- `XX`: 2-letter state code
- `00`: 2-digit district code
- `0000000`: 7-digit serial number

### EPFO Establishment Code
Format: 7-digit establishment code (within longer regional format `MH/BAN/1234567/000/0012345`)

### ESIC Employer Code
Format: 17-digit alphanumeric `XX-XX-XXXXXX-XXX-XXXX`
- First 2: State/region code
- Next 2: Sub-region code
- Next 6: Unique registration number
- Next 3: Branch/unit code
- Final 4: Sub-code

## Deployment
- **docker compose:** PostgreSQL + FastAPI + Next.js containers
- **Hosted demo:** Render (API) + Vercel (frontend) or Railway (all-in-one)
- **Note:** Hosted demo is not on-prem; state "designed for on-premises deployment"

## Key Packages

| Package | Purpose | Version |
|---------|---------|---------|
| fastapi | API framework | 0.100+ |
| uvicorn | ASGI server | 0.27+ |
| sqlalchemy | ORM | 2.0+ |
| asyncpg | Async PostgreSQL | 0.29+ |
| pymupdf (fitz) | PDF extraction | 1.23+ |
| pytesseract | OCR wrapper | 0.3.10+ |
| opencv-python | Image preprocessing | 4.8+ |
| rapidfuzz | Fuzzy string matching | 3.0+ |
| pyyaml | YAML rule configs | 6.0+ |
| pydantic | Data validation | 2.0+ |
| python-multipart | File uploads | 0.0.6+ |
| passlib + python-jose | Auth/JWT | latest |

---
*Research completed: 2026-09-28*

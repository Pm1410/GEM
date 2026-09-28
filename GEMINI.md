<!-- GSD:project-start source:PROJECT.md -->

## Project

**GEM — Government e-Marketplace Bid Verification Platform**

An automated bid-eligibility verification platform for Government e-Marketplace (GeM) procurement. It cross-verifies bidder-submitted documents against tender requirements using deterministic rule engines, simulated portal adapters, and bounded AI extraction — producing a compliance score, risk level, advisory, and tamper-evident audit trail for procurement officers.

Built as a hackathon prototype (SIH 2026, PS code SIH26100) with a 2-day build window and 3-minute demo. Everything simulated is labelled. The prototype uses simulated portal adapters and dummy datasets because production portal access is not available to the hackathon team. Every simulated response is labelled.

**Core Value:** Deterministic, explainable, auditable bid verification: same evidence in, same result out — never a false PASS.

### Constraints

- **Timeline**: 2 days to working prototype — protect Tier A items in priority order: rule engine → validators → four states → score + risk → evidence view → audit chain → evaluation numbers → video
- **Tech stack (frozen)**: FastAPI (Python) API, PostgreSQL, React/Next.js frontend, PyMuPDF/pypdf + Tesseract + OpenCV extraction, rapidfuzz matching, YAML rule configs
- **No live portal access**: All portal integrations are simulated adapters with injectable latency/failure; labelled SIMULATED
- **Data**: Synthetic datasets only — 3 tenders, 20+ bidder packs with variant cases
- **AI boundary**: No LLM in the decision path; model is optional for advisory wording rewrite only; deterministic template is the fallback and always works
- **Legal**: Rule library claims engine correctness and coverage, not legal completeness; certificate validity compared with bid opening date, not today
- **Model**: Either small local model (Ollama) or hosted API on synthetic data only, stated plainly; production designed for local model
- **Deploy**: docker compose; hosted demo (Render/Vercel/Railway) is not on-prem; state "designed for on-premises deployment"

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

### PAN (10-character alphanumeric)

- Chars 1–3: Alphabetic series (AAA–ZZZ)
- Char 4: Status (P=Person, C=Company, H=HUF, F=Firm)
- Char 5: First letter of surname/entity
- Chars 6–9: Sequential number (0001–9999)
- Char 10: Alphabetic check digit

### Udyam (19-character)

- `UDYAM`: Fixed prefix
- `XX`: 2-letter state code
- `00`: 2-digit district code
- `0000000`: 7-digit serial number

### EPFO Establishment Code

### ESIC Employer Code

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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

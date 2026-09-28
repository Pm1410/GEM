# Phase 2: Portal Adapters, Extraction & Result States - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning
**Mode:** Autonomous (Recommended options automatically selected)

<domain>
## Phase Boundary

Phase 2 builds the simulated portal integration layer, document extraction pipeline, and four result states engine:
- Simulated Portal Adapters: `MockGSTNAdapter`, `MockUdyamAdapter`, `MockEPFOAdapter`, `MockESICAdapter`, and `MockDebarmentAdapter`, all implementing `PortalAdapter` with configurable latency and injectable failures (timeout, HTTP 500, stale cache).
- Document Extraction Pipeline: PDF/scan upload validation, text sanitization, born-digital native extraction (PyMuPDF), OCR fallback (Tesseract + OpenCV preprocessing), and structured field extraction.
- Verbatim Grounding Enforcement (EXTR-04): Every extracted field must exist verbatim in the source text; ungrounded or ambiguous extractions transition to `REVIEW`.
- Four Result States Engine (RSLT-01 to RSLT-04): Deterministic evaluation of `PASS`, `FAIL`, `REVIEW`, and `UNVERIFIABLE`. Portal timeout/outage yields `UNVERIFIABLE` with cached response age (never false PASS).

</domain>

<decisions>
## Implementation Decisions

### Portal Adapters & Mock Data
- **D-01:** Synthetic Portal Registry with in-memory dataset fixture keyed by entity IDs (GSTIN, PAN, Udyam). Provides realistic status (ACTIVE/INACTIVE), filing status (COMPLIANT/OVERDUE with period and return date), and debarment scopes. — **Reversibility:** costly.
- **D-02:** Strict SIMULATED branding: All mock responses explicitly tag `source='SIMULATED'` and include `latency_ms` and `fetched_at` timestamps per PORT-01 and PORT-08. — **Reversibility:** costly.
- **D-03:** Portal timeout and error handling: On timeout or network failure, adapter returns `PortalResult(status='TIMEOUT')`; engine evaluates this as `UNVERIFIABLE` with cached snapshot age where available. — **Reversibility:** costly.

### Extraction Pipeline & Grounding
- **D-04:** Two-tier extraction pipeline: PyMuPDF (`fitz`) first for born-digital PDFs. If extracted text is below density threshold (< 50 chars per page), fallback to OpenCV image preprocessing (grayscale, Otsu binarization) + Tesseract OCR.
- **D-05:** Text sanitization (EXTR-02 / SECR-01): File upload validates MIME type (`application/pdf`, `image/png`, `image/jpeg`), size limit (max 10MB), and strips invisible/hidden control characters.
- **D-06:** Strict Verbatim Grounding Rule (EXTR-04): Extracted field values must be found verbatim (case-insensitive, whitespace-normalized) in the raw page text. If not verbatim, result is flagged `is_grounded=False` and outcome state transitions to `REVIEW`.
- **D-07:** Missing-info detection (EXTR-05): Compares required evidence fields per tender rule against extracted fields; emits structured deficiency findings.

### Result State Semantics
- **D-08:** Four-State Priority Hierarchy: `FAIL` (explicit violation, disqualifying) > `REVIEW` (missing/ungrounded/ambiguous, officer action needed) > `UNVERIFIABLE` (portal timeout/down, external dependency unavailable) > `PASS` (all criteria satisfied and grounded).
- **D-09:** Never False PASS guarantee: No unverified evidence or timed-out external check ever produces `PASS`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Specifications
- `.planning/PROJECT.md` — Project mission, constraints, and architecture summary.
- `.planning/REQUIREMENTS.md` §Portal Adapters, §Result States, §Extraction, §Security — PORT-02 to PORT-09, RSLT-01 to RSLT-04, EXTR-01 to EXTR-05, SECR-01, SECR-02.
- `.planning/ROADMAP.md` §Phase 2 — Phase 2 goals, scope, and success criteria.

### Stack & Architecture Research
- `.planning/research/STACK.md` §Document Extraction — PyMuPDF, Tesseract OCR + OpenCV preprocessing.
- `.planning/research/ARCHITECTURE.md` §Portal Adapter Pattern & Three-Tier Architecture.
- `.planning/research/PITFALLS.md` — Pitfalls #1 (False PASS), #2 (Simulated portal latency), #4 (Grounding rule failure), #6 (OCR fallback latency).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/gem_api/adapters/base.py`: `PortalAdapter` base class and `PortalResult` contract.
- `src/gem_api/validators/`: Statutory validators (GSTIN, PAN, Udyam, Date, Cross-checks).
- `src/gem_api/rules/engine.py` & `src/gem_api/rules/builtins.py`: Rule evaluation engine.
- `src/gem_api/db/models.py`: Database models for Evidence and VerificationResult.

</code_context>

<specifics>
## Specific Ideas

- Ensure mock portal adapters have a clean `.lookup()` implementation that looks up from a synthetic dataset dictionary, simulating real GSTN GSTR-3B filings, Udyam registration details, EPFO/ESIC registrations, and Debarment records.
- Grounding verification must return exact character offset/slice when verified.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 2-Portal Adapters, Extraction & Result States*
*Context gathered: 2026-09-28*

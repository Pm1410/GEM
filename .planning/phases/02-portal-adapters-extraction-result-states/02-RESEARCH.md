# Phase 2: Portal Adapters, Extraction & Result States - Research

**Researched:** 2026-09-28
**Domain:** Simulated Portal Integration, Document Extraction, Verbatim Grounding & Result State Semantics
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Synthetic Portal Registry with in-memory dataset fixture keyed by entity IDs (GSTIN, PAN, Udyam). Provides realistic status (ACTIVE/INACTIVE), filing status (COMPLIANT/OVERDUE with period and return date), and debarment scopes.
- **D-02:** Strict SIMULATED branding: All mock responses explicitly tag `source='SIMULATED'` and include `latency_ms` and `fetched_at` timestamps per PORT-01 and PORT-08.
- **D-03:** Portal timeout and error handling: On timeout or network failure, adapter returns `PortalResult(status='TIMEOUT')`; engine evaluates this as `UNVERIFIABLE` with cached snapshot age where available.
- **D-04:** Two-tier extraction pipeline: PyMuPDF (`fitz`) first for born-digital PDFs. If extracted text is below density threshold (< 50 chars per page), fallback to OCR.
- **D-05:** Text sanitization (EXTR-02 / SECR-01): File upload validates MIME type (`application/pdf`, `image/png`, `image/jpeg`), size limit (max 10MB), and strips invisible/hidden control characters.
- **D-06:** Strict Verbatim Grounding Rule (EXTR-04): Extracted field values must be found verbatim (case-insensitive, whitespace-normalized) in the raw page text. If not verbatim, result is flagged `is_grounded=False` and outcome state transitions to `REVIEW`.
- **D-07:** Missing-info detection (EXTR-05): Compares required evidence fields per tender rule against extracted fields; emits structured deficiency findings.
- **D-08:** Four-State Priority Hierarchy: `FAIL` > `REVIEW` > `UNVERIFIABLE` > `PASS`.
- **D-09:** Never False PASS guarantee: No unverified evidence or timed-out external check ever produces `PASS`.

### the agent's Discretion
- Synthetic portal dataset structure and realistic mock entries for goods, services, and MSME tenders.
- Regex pattern sets for statutory certificate extraction (GST certificate, PAN card, Udyam certificate, EPFO/ESIC registrations).

### Deferred Ideas (OUT OF SCOPE)
- None — all items fit Phase 2 scope.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Simulated Portal Adapters | API/Backend | — | Mock GSTN, Udyam, EPFO, ESIC, Debarment adapters with failure injection |
| PDF/Scan Extraction Pipeline | API/Backend | File Storage | PyMuPDF born-digital extraction with OCR fallback and sanitization |
| Verbatim Grounding Checker | API/Backend | — | Pure function locating extracted substrings in raw page text |
| Result State Machine | API/Backend | — | Evaluates FAIL, REVIEW, UNVERIFIABLE, and PASS states strictly |

</architectural_responsibility_map>

<research_summary>
## Summary

Phase 2 builds the live simulation and extraction core of the GeM Bid Verification Platform:
1. `MockGSTNAdapter`, `MockUdyamAdapter`, `MockEPFOAdapter`, `MockESICAdapter`, and `MockDebarmentAdapter` extend `PortalAdapter`. They simulate real government APIs with latency, timeout/500 error injection, and realistic data (e.g. GSTR-3B filing records, enterprise categories, debarment scopes).
2. The extraction engine handles born-digital PDFs using PyMuPDF (fast, accurate character positioning) and includes OCR fallback for scanned certificates.
3. The verbatim grounding engine enforces the strict rule: if an extracted value (e.g. GSTIN, enterprise name, date) does not exist verbatim in the source text, it is marked ungrounded and forces requirement review.
4. The four result states (`PASS`, `FAIL`, `REVIEW`, `UNVERIFIABLE`) are fully wired into the rule engine check dispatcher, ensuring that portal outages yield `UNVERIFIABLE` rather than a false PASS or premature disqualification.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pymupdf | 1.24+ | Native PDF extraction | Extremely fast (C++ MuPDF engine), accurate text & coordinates |
| pillow | 10.4+ | Image processing | Standard image library in Python |
| pytesseract | 0.3.10+ | OCR wrapper | Standard wrapper for Google Tesseract OCR engine |

</standard_stack>

<validation_architecture>
## Validation Architecture

### Test Infrastructure
- **Framework:** `pytest` with `pytest-asyncio`
- **Commands:** `pytest tests/unit/ -v`

### Sampling Strategy
- Unit tests for each portal adapter (positive lookup, inactive entity, timeout, 500 error, stale cache).
- Unit tests for extraction & sanitization (text extraction, size/mime validation, hidden char stripping).
- Unit tests for grounding verification (verbatim match, whitespace normalization, ungrounded rejection).
- Integration tests for four result states end-to-end.

</validation_architecture>

<security_threat_model>
## Security Threat Model (ASVS Level 1)

| Threat ID | Threat Description | Mitigation Strategy |
|-----------|--------------------|---------------------|
| T-02-01 | File Upload Bomb / Malicious Size | Size cap at 10MB; MIME validation before parsing (SECR-01) |
| T-02-02 | Hallucinated / Injected Extracted Fields | Verbatim grounding verification against raw document text (SECR-02) |
| T-02-03 | False Pass during Portal Outage | Strict UNVERIFIABLE transition when external portal fails (PORT-09) |

</security_threat_model>

---

*Phase: 02-portal-adapters-extraction-result-states*
*Research completed: 2026-09-28*
*Ready for planning: yes*

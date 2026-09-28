# Roadmap: GeM Bid Verification Platform

**Created:** 2026-09-28
**Granularity:** Standard
**Total Phases:** 6
**Requirements Coverage:** 57/57 ✓

## Phase 1: Schema, Rule Engine & Validators

**Goal:** Establish the data foundation — database schema, rule engine core with YAML config, and all format validators with cross-checks. Everything deterministic, everything unit-tested.

**Success Criteria:**
1. PostgreSQL schema created with tables for tenders, bidders, evidence, results, and audit (insert-only role enforced)
2. GSTIN validator passes Mod-36 checksum on valid inputs and rejects invalid ones
3. GSTIN-PAN cross-check correctly compares chars 3-12 of GSTIN with PAN
4. PAN and Udyam format validators correctly accept/reject inputs
5. Certificate validity comparison uses bid opening date, not current date
6. Rule engine evaluates YAML tender configs and produces correct result states for each requirement
7. All validators and rule engine functions have unit tests with positive, negative, and edge cases

**Requirements:** PORT-01, VALD-01, VALD-02, VALD-03, VALD-04, VALD-05, RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07

---

## Phase 2: Portal Adapters, Extraction & Result States

**Goal:** Build the simulated portal layer with injectable failure modes, the document extraction pipeline, and implement all four result states (PASS, FAIL, REVIEW, UNVERIFIABLE) with correct semantics.

**Success Criteria:**
1. MockGSTN adapter returns registration + filing status with configurable latency and failure injection
2. MockUdyam, MockEPFO, MockESIC, and MockDebarment adapters return appropriate responses
3. Portal timeout produces UNVERIFIABLE result (not PASS or FAIL), with cached snapshot and age
4. PDF/scan extraction works: native text (PyMuPDF) first, OCR (Tesseract+OpenCV) for scans
5. Grounding rule enforced: extracted values not found verbatim in source → REVIEW
6. Missing-info detection compares required evidence against extracted fields
7. File upload validates type/size and sanitises content
8. All four result states produce correct semantics across all check types

**Requirements:** PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, PORT-07, PORT-09, RSLT-01, RSLT-02, RSLT-03, RSLT-04, EXTR-01, EXTR-02, EXTR-03, EXTR-04, EXTR-05, SECR-01, SECR-02

---

## Phase 3: Scoring, Audit Trail & Security

**Goal:** Implement the compliance score and risk computation with frozen formulas, the tamper-evident audit hash chain with INSERT-only enforcement, and data-at-rest security.

**Success Criteria:**
1. Compliance score computed by frozen weighted formula — deterministic for same inputs
2. Risk level computed independently from result states
3. UNVERIFIABLE checks excluded from score denominator
4. Audit hash chain: sha256(prev_hash + payload) with tender/rule-set versions, evidence hashes
5. INSERT-only DB role enforced — no UPDATE or DELETE on audit table
6. Verify endpoint recomputes chain and reports first broken record with expected vs computed hash
7. Stored documents encrypted at rest with retention policy

**Requirements:** SCOR-01, SCOR-02, SCOR-03, SCOR-04, AUDT-01, AUDT-02, AUDT-03, AUDT-04, SECR-03, SECR-04

---

## Phase 4: Frontend Dashboard & Officer Workflow

**Goal:** Build the React/Next.js frontend: dashboard with score/risk/state counts, requirement table, evidence viewer with highlighted regions, officer workflow (approve/reject/clarify), advisory panel, RBAC, and simulated adapter panel.

**Success Criteria:**
1. Dashboard shows per-tender bidder overview with score, risk, and state counts
2. Requirement table displays each check, result state, and evidence link
3. Evidence viewer shows extracted value highlighted in context within the source document
4. Officer can Approve, Reject, or Request Clarification with mandatory justification
5. Advisory panel shows template-generated summary citing REQ IDs, labelled as "advisory"
6. Optional model rewrite of advisory with validation gate and template fallback
7. Portal panel reads SIMULATED ADAPTER with response data, latency, fetched_at
8. RBAC enforced: officer, evaluator, admin, auditor (read-only) on both API and UI

**Requirements:** PORT-08, ADVS-01, ADVS-02, ADVS-03, ADVS-04, OFCR-01, OFCR-02, OFCR-03, OFCR-04, OFCR-05, DASH-01, DASH-02, DASH-03

---

## Phase 5: Synthetic Data & Evaluation

**Goal:** Create the synthetic dataset (3 tenders × 20+ bidder packs) with realistic documents, run the evaluation suite, and establish the manual baseline timing.

**Success Criteria:**
1. 3 tenders configured: goods tender, services tender (EPFO/ESIC required), MSME-preference tender
2. 20+ bidder packs covering all case variants: compliant, missing, expired, mismatch, overdue, debarred, ambiguous, portal-down
3. Synthetic GSTINs have valid Mod-36 checksums
4. Documents rendered as realistic PDFs/scans with noise, skew, and stamps
5. Evaluation table reports per-check deterministic results separately from OCR accuracy
6. Report: "zero false-PASS observed across N synthetic cases"
7. Manual baseline: teammates time verification of same packs, N and method stated

**Requirements:** DATA-01, DATA-02, DATA-03, DATA-04, EVAL-01, EVAL-02, EVAL-03

---

## Phase 6: Demo Script & Deployment

**Goal:** Containerise with docker compose, deploy to hosted platform, rehearse the 3-minute demo script, and create the limitations page.

**Success Criteria:**
1. docker compose runs PostgreSQL + FastAPI + Next.js end-to-end
2. Hosted demo accessible (Render/Vercel/Railway) — labelled as "designed for on-premises deployment"
3. 3-minute demo rehearsed: problem → PASS/FAIL/REVIEW → filing overdue → portal kill → advisory → officer action → audit tamper → evaluation numbers
4. Limitations page documents: simulated adapters, synthetic data, rule coverage vs legal completeness

**Requirements:** DEMO-01, DEMO-02

---

*Roadmap created: 2026-09-28*
*Last updated: 2026-09-28 after initial creation*

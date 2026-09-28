# Requirements: GeM Bid Verification Platform

**Defined:** 2026-09-28
**Core Value:** Deterministic, explainable, auditable bid verification — same evidence in, same result out, never a false PASS.

## v1 Requirements

### Portal Adapters

- [ ] **PORT-01**: System provides a `PortalAdapter` interface with `lookup(id_value) → PortalResult` returning status, fields, fetched_at, latency_ms, and source ('SIMULATED' | 'LIVE')
- [ ] **PORT-02**: MockGSTN adapter returns registration status (ACTIVE/INACTIVE) and return filing status (COMPLIANT/OVERDUE) with last return type, period, and date
- [ ] **PORT-03**: MockUdyam adapter returns MSME registration status and enterprise category
- [ ] **PORT-04**: MockEPFO adapter returns establishment registration status (conditional on tender category)
- [ ] **PORT-05**: MockESIC adapter returns employer registration status (conditional on tender category)
- [ ] **PORT-06**: MockDebarment adapter returns debarment status with scope (organisation-wide, category, time-bound) and dates
- [ ] **PORT-07**: All simulated adapters support injectable latency, failure modes (timeout, error), and stale/cached responses
- [ ] **PORT-08**: Portal panel displays SIMULATED ADAPTER label, response data, latency, and fetched_at timestamp
- [ ] **PORT-09**: When portal is down, result becomes UNVERIFIABLE (not PASS), cached snapshot shown with age

### Validators

- [ ] **VALD-01**: GSTIN format validator: 15-char alphanumeric, state code (pos 1-2), PAN (pos 3-12), entity code (pos 13), default 'Z' (pos 14), Mod-36 checksum (pos 15)
- [ ] **VALD-02**: GSTIN-PAN cross-check: characters 3-12 of GSTIN must match the supplied PAN document
- [ ] **VALD-03**: PAN format validator: 10-char `[A-Z]{5}[0-9]{4}[A-Z]` with entity type at position 4
- [ ] **VALD-04**: Udyam registration number format validator: `UDYAM-XX-00-0000000` (19-char)
- [ ] **VALD-05**: Certificate validity comparison against bid opening date (not current date)

### Rule Engine

- [ ] **RULE-01**: Versioned YAML tender rule configuration with tender ID, version, and rule_set_version
- [ ] **RULE-02**: Per-requirement configuration: ID, mandatory flag, applies_if condition, evidence types, checks list, on_fail/on_missing/on_portal_down actions
- [ ] **RULE-03**: Conditional requirement applicability (e.g., MSME mandatory vs preference per tender; EPFO/ESIC by tender category)
- [ ] **RULE-04**: Make in India local-content threshold rule configurable per tender
- [ ] **RULE-05**: Debarment check with scope evaluation (organisation-wide, category-specific, time-bound)
- [ ] **RULE-06**: Rule engine is pure Python functions — deterministic, no LLM, unit-tested
- [ ] **RULE-07**: Rule library is versioned; rules are reviewed, not auto-generated

### Result States

- [ ] **RSLT-01**: PASS — all checks satisfied, evidence attached
- [ ] **RSLT-02**: FAIL — explicit violation (bad checksum, expired, mismatch, debarred, filing overdue), deterministic and explainable; not a disqualification
- [ ] **RSLT-03**: REVIEW — required field missing, unreadable, ambiguous, or LLM-extracted value not found verbatim in source text
- [ ] **RSLT-04**: UNVERIFIABLE — portal timeout/down, external check could not run; retry with backoff; cached snapshot with age shown

### Extraction

- [ ] **EXTR-01**: PDF/scan upload with file type and size validation
- [ ] **EXTR-02**: Text sanitisation (strip hidden text, macros, non-visible content)
- [ ] **EXTR-03**: Regex/template extraction first; OCR (Tesseract + OpenCV preprocessing) for scans; model fallback for unstructured text (e.g., OEM letters)
- [ ] **EXTR-04**: Grounding rule: extracted value must appear verbatim in source text, else result = REVIEW
- [ ] **EXTR-05**: Missing-info detection: compare required evidence per tender rule with extracted fields, emit findings

### Scoring

- [ ] **SCOR-01**: Compliance score computed by frozen weighted formula (documented, deterministic)
- [ ] **SCOR-02**: Risk level computed independently from result states (not just inverted score)
- [ ] **SCOR-03**: UNVERIFIABLE checks count as 0 in denominator (score reflects verifiable coverage only)
- [ ] **SCOR-04**: Score is a verification summary — cannot be used to rank bidders; price evaluation is separate

### Advisory

- [ ] **ADVS-01**: Deterministic template builds officer summary from structured rule results
- [ ] **ADVS-02**: Advisory cites existing requirement IDs (REQ-XX format)
- [ ] **ADVS-03**: Optional model rewrites advisory wording; if validation fails, fall back to template
- [ ] **ADVS-04**: Advisory is labelled as "advisory" — not a decision

### Officer Workflow

- [ ] **OFCR-01**: Officer can view per-bidder compliance results with requirement table
- [ ] **OFCR-02**: Officer can drill down to evidence with highlighted extraction regions
- [ ] **OFCR-03**: Officer can choose: Approve, Reject, or Request Clarification
- [ ] **OFCR-04**: Justification is mandatory on every officer action
- [ ] **OFCR-05**: RBAC: officer, evaluator, admin, auditor (read-only) roles enforced on API and UI

### Audit Trail

- [ ] **AUDT-01**: Hash chain: each record = sha256(prev_hash + payload) with tender_id, tender_version, rule_set_version, requirement_results, evidence_hashes, score, risk, advisory_text_hash, officer_decision + justification, timestamp
- [ ] **AUDT-02**: Database role for audit table: INSERT only (no UPDATE/DELETE)
- [ ] **AUDT-03**: Verify endpoint recomputes chain and reports first broken record with expected vs computed hash
- [ ] **AUDT-04**: Each audit record stores tender version and rule-set version used

### Dashboard

- [ ] **DASH-01**: Per-tender bidder overview with score, risk level, and state counts (PASS/FAIL/REVIEW/UNVERIFIABLE)
- [ ] **DASH-02**: Requirement table showing each check, its result state, and evidence
- [ ] **DASH-03**: Evidence viewer with highlighted extraction region showing extracted value in context

### Synthetic Data

- [ ] **DATA-01**: 3 tenders with distinct rule combinations: goods tender, services tender (needing EPFO/ESIC), MSME-preference tender
- [ ] **DATA-02**: 20+ bidder packs as case variants: compliant, missing document, expired certificate, GSTIN-PAN mismatch, GST filing overdue, debarred, ambiguous (REVIEW), portal down (UNVERIFIABLE)
- [ ] **DATA-03**: Documents rendered as realistic PDFs/scans (noise, skew, stamps) so OCR is genuinely exercised
- [ ] **DATA-04**: Synthetic GSTINs generated with valid Mod-36 checksums

### Evaluation

- [ ] **EVAL-01**: Deterministic validation results reported per check separately from OCR extraction accuracy per field
- [ ] **EVAL-02**: Report format: "zero false-PASS observed across N synthetic cases" — no percentages from tiny samples
- [ ] **EVAL-03**: Manual baseline: teammates time manual verification of same packs; state N and method

### Demo

- [ ] **DEMO-01**: 3-minute demo script covering Tier A items only: problem → PASS/FAIL/REVIEW bidders → GST filing overdue → portal kill → advisory → officer action → audit tamper → evaluation numbers
- [ ] **DEMO-02**: Hosted deployment accessible for live demo (docker compose + Render/Vercel/Railway)

### Security

- [ ] **SECR-01**: File type/size validation on upload
- [ ] **SECR-02**: Text sanitisation to prevent injection
- [ ] **SECR-03**: Encryption at rest for stored documents
- [ ] **SECR-04**: Retention policy aligned with DPDP Act 2023 principles

## v2 Requirements

### Enhanced Portal Integration

- **PORT-V2-01**: DigiLocker simulated adapter — compare hash/fields of uploaded doc with issued record
- **PORT-V2-02**: Startup India / NSIC registration mock adapters
- **PORT-V2-03**: OEM authorisation letter extraction (product, dealer, validity, signatory)

### Enhanced AI

- **AI-V2-01**: Entity matching: normalise names (casefold, strip M/s, Pvt, Private, Ltd) then token similarity (rapidfuzz) with configurable thresholds
- **AI-V2-02**: Anomaly detection: metadata, hidden text, font inconsistencies — feeds REVIEW flags only
- **AI-V2-03**: ITR acknowledgement extraction (PAN + Income Tax Tier C item)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live production portal integration | No API access available before deadline; licensed intermediary agreements required |
| Public portal scraping | Captcha, ToS violations, fragile, integrity risk |
| LLM-based decision making | Reproducibility requirement — same evidence must yield same result |
| Bidder ranking by compliance score | Score is verification summary; price evaluation is separate function |
| Blockchain | Plain hash chain + insert-only DB role is simpler and demonstrable |
| Real-world accuracy claims | Tested only on synthetic data; report observed counts |
| Mobile application | Web-first for hackathon demo |
| Slide/PPT content | This project covers prototype + demo + judge answers only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PORT-01 | Phase 1 | Pending |
| PORT-02 | Phase 2 | Pending |
| PORT-03 | Phase 2 | Pending |
| PORT-04 | Phase 2 | Pending |
| PORT-05 | Phase 2 | Pending |
| PORT-06 | Phase 2 | Pending |
| PORT-07 | Phase 2 | Pending |
| PORT-08 | Phase 4 | Pending |
| PORT-09 | Phase 2 | Pending |
| VALD-01 | Phase 1 | Pending |
| VALD-02 | Phase 1 | Pending |
| VALD-03 | Phase 1 | Pending |
| VALD-04 | Phase 1 | Pending |
| VALD-05 | Phase 1 | Pending |
| RULE-01 | Phase 1 | Pending |
| RULE-02 | Phase 1 | Pending |
| RULE-03 | Phase 1 | Pending |
| RULE-04 | Phase 1 | Pending |
| RULE-05 | Phase 1 | Pending |
| RULE-06 | Phase 1 | Pending |
| RULE-07 | Phase 1 | Pending |
| RSLT-01 | Phase 2 | Pending |
| RSLT-02 | Phase 2 | Pending |
| RSLT-03 | Phase 2 | Pending |
| RSLT-04 | Phase 2 | Pending |
| EXTR-01 | Phase 2 | Pending |
| EXTR-02 | Phase 2 | Pending |
| EXTR-03 | Phase 2 | Pending |
| EXTR-04 | Phase 2 | Pending |
| EXTR-05 | Phase 2 | Pending |
| SCOR-01 | Phase 3 | Pending |
| SCOR-02 | Phase 3 | Pending |
| SCOR-03 | Phase 3 | Pending |
| SCOR-04 | Phase 3 | Pending |
| ADVS-01 | Phase 4 | Pending |
| ADVS-02 | Phase 4 | Pending |
| ADVS-03 | Phase 4 | Pending |
| ADVS-04 | Phase 4 | Pending |
| OFCR-01 | Phase 4 | Pending |
| OFCR-02 | Phase 4 | Pending |
| OFCR-03 | Phase 4 | Pending |
| OFCR-04 | Phase 4 | Pending |
| OFCR-05 | Phase 4 | Pending |
| AUDT-01 | Phase 3 | Pending |
| AUDT-02 | Phase 3 | Pending |
| AUDT-03 | Phase 3 | Pending |
| AUDT-04 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DATA-01 | Phase 5 | Pending |
| DATA-02 | Phase 5 | Pending |
| DATA-03 | Phase 5 | Pending |
| DATA-04 | Phase 5 | Pending |
| EVAL-01 | Phase 5 | Pending |
| EVAL-02 | Phase 5 | Pending |
| EVAL-03 | Phase 5 | Pending |
| DEMO-01 | Phase 6 | Pending |
| DEMO-02 | Phase 6 | Pending |
| SECR-01 | Phase 2 | Pending |
| SECR-02 | Phase 2 | Pending |
| SECR-03 | Phase 3 | Pending |
| SECR-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-28*
*Last updated: 2026-09-28 after initial definition*

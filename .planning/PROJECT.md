# GEM — Government e-Marketplace Bid Verification Platform

## What This Is

An automated bid-eligibility verification platform for Government e-Marketplace (GeM) procurement. It cross-verifies bidder-submitted documents against tender requirements using deterministic rule engines, simulated portal adapters, and bounded AI extraction — producing a compliance score, risk level, advisory, and tamper-evident audit trail for procurement officers.

Built as a hackathon prototype (SIH 2026, PS code SIH26100) with a 2-day build window and 3-minute demo. Everything simulated is labelled. The prototype uses simulated portal adapters and dummy datasets because production portal access is not available to the hackathon team. Every simulated response is labelled.

## Core Value

Deterministic, explainable, auditable bid verification: same evidence in, same result out — never a false PASS.

## Context

**Problem statement (SIH26100):** The platform shall integrate with government portals to verify bidder eligibility documents against tender-specific requirements. Dummy bidder and tender datasets may be used.

**Why simulated portals:** GSTN data reaches applications through licensed intermediaries under formal agreements; taxpayer-level data needs authentication and consent — not obtainable before 30 Sep. Public portal scraping is rejected (captcha, terms, fragile, integrity risk). The adapter boundary exists because external verification is a separate dependency — we can demonstrate available, unavailable, delayed, and stale evidence, and swap in a production adapter later.

**Hackathon constraints:**
- 2-day build window (28–30 Sep 2026)
- 3-minute live demo for judges
- No production portal access
- Synthetic data only
- Team of student developers

**Prior work:** None — greenfield prototype.

**PS coverage:** 14 expected-solution items mapped to implementation tiers (A = must-ship for demo, B = ship if time, C = design only).

## Constraints

- **Timeline**: 2 days to working prototype — protect Tier A items in priority order: rule engine → validators → four states → score + risk → evidence view → audit chain → evaluation numbers → video
- **Tech stack (frozen)**: FastAPI (Python) API, PostgreSQL, React/Next.js frontend, PyMuPDF/pypdf + Tesseract + OpenCV extraction, rapidfuzz matching, YAML rule configs
- **No live portal access**: All portal integrations are simulated adapters with injectable latency/failure; labelled SIMULATED
- **Data**: Synthetic datasets only — 3 tenders, 20+ bidder packs with variant cases
- **AI boundary**: No LLM in the decision path; model is optional for advisory wording rewrite only; deterministic template is the fallback and always works
- **Legal**: Rule library claims engine correctness and coverage, not legal completeness; certificate validity compared with bid opening date, not today
- **Model**: Either small local model (Ollama) or hosted API on synthetic data only, stated plainly; production designed for local model
- **Deploy**: docker compose; hosted demo (Render/Vercel/Railway) is not on-prem; state "designed for on-premises deployment"

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Portal integration with adapter interface + simulated implementations (GST, Udyam, EPFO, ESIC, DigiLocker, debarment)
- [ ] Udyam/MSME format validator, document extraction, mock lookup, tender applicability
- [ ] GST registration and return filing verification (GSTIN validator, mock returns, filing status)
- [ ] PAN + Income Tax (PAN validator, GSTIN-PAN cross-check)
- [ ] Make in India per-tender local-content threshold rules
- [ ] EPFO/ESIC conditional rules by tender category with mock lookup
- [ ] Startup/NSIC/OEM registration mocks and OEM letter extraction
- [ ] DigiLocker simulated adapter (hash/field comparison)
- [ ] Blacklisting/debarment mock list with scope and dates
- [ ] Tender-specific compliance via versioned rule configuration (YAML)
- [ ] AI extraction + missing/inconsistent info detection
- [ ] Compliance score + risk (frozen weighted formulas)
- [ ] AI recommendation (deterministic advisory template + optional model rewrite)
- [ ] Audit trail (hash chain + tender/rule-set versions + evidence hashes, insert-only)
- [ ] Four result states: PASS, FAIL, REVIEW, UNVERIFIABLE with correct semantics
- [ ] Officer workflow (approve/reject/request clarification with mandatory justification)
- [ ] Dashboard with score, risk, state counts, requirement table, evidence viewer
- [ ] RBAC (officer, evaluator, admin, auditor read-only)
- [ ] Synthetic dataset: 3 tenders × 20+ bidder packs with realistic PDFs/scans
- [ ] Evaluation table: per-check results, zero false-PASS count, manual baseline timing
- [ ] 3-minute demo script (Tier A items only)

### Out of Scope

- Live production portal integration — no API access available before deadline
- Slide/PPT content — this project covers prototype + demo + judge answers only
- Real bidder data — synthetic only, stated plainly
- Mobile app — web-first for demo
- Price evaluation / bidder ranking by score — score is verification summary only
- Blockchain — plain hash chain + insert-only DB role, no blockchain
- Real-world accuracy claims — report counts observed on synthetic data, not percentages

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Simulated portal adapters, not scraping | No production API access; scraping is fragile, violates ToS, integrity risk | — Pending |
| Hash chain + insert-only audit, not blockchain | Demonstrable by tampering a row; simpler; proves same property | — Pending |
| No LLM in decision path | Reproducibility: same evidence → same result; prevents injection via PDF hidden text | — Pending |
| Deterministic advisory template as primary | Template always works; optional model rewrite is labelled and validated against REQ IDs | — Pending |
| Certificate validity vs bid opening date, not today | Legally correct interpretation for procurement context | — Pending |
| GSTIN checksum digit 13 algorithm for validation | Deterministic format + checksum; characters 3–12 are holder's PAN for cross-check | — Pending |
| YAML versioned rule configs | Human-readable, versionable, per-tender configurable; reviewed rule library | — Pending |
| Regex/template extraction first, model fallback | Deterministic where possible; model only for unstructured text (OEM letters) | — Pending |
| Grounding rule: extracted value must appear verbatim in source text | Prevents hallucinated fields and OCR slips (5 vs S) | — Pending |
| Entity name matching with rapidfuzz + configurable thresholds | Normalise (casefold, strip M/s, Pvt, Private, Ltd) then token similarity; band between match/mismatch → REVIEW | — Pending |
| Missing evidence = REVIEW, never PASS | Conservative by design — incomplete evidence is never treated as passing | — Pending |
| Score denominator excludes UNVERIFIABLE checks | UNVERIFIABLE counts as 0 in denominator; score reflects verifiable coverage only | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-28 after initialization*

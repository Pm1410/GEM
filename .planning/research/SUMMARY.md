# Project Research Summary

## Key Findings

### Stack
FastAPI + PostgreSQL + React/Next.js is the right stack. PyMuPDF handles native PDFs natively; Tesseract+OpenCV handles scans with preprocessing. rapidfuzz provides fuzzy entity matching. YAML rule configs are human-readable and versionable. SQLAlchemy 2.0 async or raw asyncpg for PostgreSQL. All chosen technologies are well-documented, pip-installable, and Docker-friendly.

**Validator specifications confirmed:**
- GSTIN: 15-char, Mod-36 checksum on char 15, chars 3-12 = PAN
- PAN: 10-char `[A-Z]{5}[0-9]{4}[A-Z]`, char 4 = entity type
- Udyam: 19-char `UDYAM-XX-00-0000000`
- EPFO: 7-digit establishment code
- ESIC: 17-digit `XX-XX-XXXXXX-XXX-XXXX`

### Table Stakes
All 14 PS items mapped to implementation tiers. Tier A covers the complete verification pipeline: portal adapters → extraction → validators → rule engine → score/risk → advisory → officer workflow → audit. This is the minimum viable demo. Tier B (DigiLocker, entity matching) and Tier C (anomaly detection) are bonus.

### Architecture
Three-tier with a clear separation: API layer (FastAPI + RBAC), Processing layer (extraction + validators + rule engine + portal adapters + scoring + advisory), Storage layer (PostgreSQL with INSERT-only audit role). The portal adapter pattern (Strategy + DI) is the key architectural decision — it enables simulated/live swapping and injectable failure modes.

### Watch Out For
1. **GSTIN checksum errors** — the Mod-36 algorithm has subtle edge cases; generate synthetic GSTINs with valid checksums or the validator fails its own test data
2. **False PASS is catastrophic** — every code path must be audited; missing evidence = REVIEW, portal down = UNVERIFIABLE, never PASS
3. **OCR misreads** — grounding rule (verbatim match) prevents hallucinated fields; cross-checks catch mismatched pairs
4. **Date comparisons against bid opening date, not today** — legally correct for procurement
5. **Time pressure** — strict Tier A priority order; Tier B/C only after full end-to-end Tier A demo works
6. **Entity name matching** — strip common suffixes before matching; use token_set_ratio not simple ratio; band between match/mismatch → REVIEW

## Implications for Roadmap

### Suggested Phase Structure
1. **Foundation** — Schema, models, rule engine core, validators, GSTIN-PAN cross-check, unit tests
2. **Portal & Extraction** — Mock adapters with injectable failure, extraction pipeline on synthetic PDFs, four result states, score + risk
3. **Frontend & Officer Workflow** — Dashboard, evidence viewer, requirement table, officer approve/reject/clarify, RBAC
4. **Audit & Advisory** — Hash chain + verify endpoint, advisory template, optional model rewrite
5. **Synthetic Data & Evaluation** — 3 tenders, 20+ bidder packs, realistic PDFs, evaluation table, manual baseline
6. **Demo & Deploy** — docker compose, hosted deploy, demo script rehearsal, limitations page

### Phases That Need Deeper Research
- Phase 1 needs exact GSTIN Mod-36 algorithm implementation (found in research)
- Phase 2 needs OpenCV preprocessing pipeline for scanned documents
- Phase 5 needs realistic synthetic document generation (noise, skew, stamps)

### Cross-Cutting Concerns
- **Testing:** Unit test every rule with positive, negative, and edge cases from Phase 1 onwards
- **Security:** File sanitisation, RBAC, no-LLM-in-decision-path from Phase 1 onwards
- **Labelling:** Every simulated response labelled from Phase 2 onwards

## Sources

- GSTIN format and Mod-36 checksum: Official GST documentation, multiple validator implementations
- PAN format: Income Tax India (incometaxindia.gov.in), format specification
- Udyam format: Official MSME Udyam portal (udyamregistration.gov.in)
- EPFO/ESIC formats: Official EPFO portal (epfindia.gov.in), ESIC portal (esic.gov.in)
- GeM procurement compliance: Official GeM portal documentation
- FastAPI + OCR architecture: Community best practices, PyMuPDF documentation

---
*Research synthesised: 2026-09-28*

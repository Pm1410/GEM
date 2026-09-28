# Pitfalls Research: GeM Bid Verification Platform

## Critical Pitfalls

### 1. GSTIN Checksum Implementation Error
**Risk:** Implementing the Mod-36 checksum incorrectly → validator rejects valid GSTINs or accepts invalid ones → synthetic data fails self-validation
**Mitigation:**
- Use known-valid GSTINs from the format specification to build test suite
- Generate synthetic GSTINs WITH valid checksums (the blueprint warns: "generate GSTINs with valid checksums, or your own validator will fail your own dataset")
- Unit test checksum independently with edge cases (all-numeric, all-alpha boundaries)

### 2. OCR Misreads Breaking Deterministic Checks
**Risk:** Tesseract misreads a character (5 vs S, 0 vs O, 1 vs l) → checksum fails → potential false FAIL or worse, false PASS if misread produces a valid but wrong GSTIN
**Mitigation:**
- Grounding rule: extracted value must appear verbatim in source text
- GSTIN checksum catches most single-character errors (Mod-36 designed for this)
- GSTIN-PAN cross-check catches mismatched pairs even if both individually valid
- Result = REVIEW (not PASS or FAIL) when grounding fails
- OpenCV preprocessing (binarize, deskew) before OCR significantly improves accuracy

### 3. False PASS Is the Catastrophic Failure Mode
**Risk:** Any code path that produces PASS when evidence is missing, ambiguous, or contradictory
**Mitigation:**
- Missing evidence = REVIEW, never PASS (explicit requirement)
- UNVERIFIABLE (portal down) = not counted in scoring denominator, not treated as PASS
- LLM not in decision path — deterministic rule engine only
- Unit test every rule with positive, negative, AND edge cases
- Evaluation reports "zero false-PASS observed across N synthetic cases"

### 4. Certificate Validity Date Comparison
**Risk:** Comparing certificate validity against `datetime.now()` instead of bid opening date → wrong result for certificates that were valid at bid time but expired since
**Mitigation:**
- All date comparisons use bid opening date from tender config
- Never use `datetime.now()` or `date.today()` in validity checks
- Unit test with certificates expiring between today and bid date

### 5. Audit Hash Chain Integrity
**Risk:** Inserting records without proper prev_hash linkage → chain appears valid but isn't actually tamper-evident
**Mitigation:**
- INSERT-only DB role (no UPDATE, no DELETE) enforced at database level
- Verify endpoint recomputes entire chain from genesis record
- Demo includes deliberate tampering to show detection
- Each record stores its own hash AND the expected prev_hash

### 6. Entity Name Matching False Positives/Negatives
**Risk:** Fuzzy matching is too loose (matches "ABC Ltd" with "XYZ Ltd" because both share "Ltd") or too strict (rejects "M/s ABC Private Limited" vs "ABC Pvt. Ltd.")
**Mitigation:**
- Strip common suffixes (M/s, Pvt, Private, Ltd, Limited) BEFORE matching
- Casefold normalisation
- rapidfuzz token_set_ratio, not simple ratio
- Configurable thresholds with band: above threshold = match, below = mismatch, between = REVIEW
- Tune thresholds on synthetic data; document the values chosen

### 7. YAML Rule Config Parsing Errors
**Risk:** Malformed YAML, missing fields, or typos in field names cause silent failures in rule evaluation
**Mitigation:**
- Pydantic models for rule config validation (load-time, not runtime)
- Required fields enforced by schema
- Version field is mandatory — reject configs without version
- Unit test each tender config file

### 8. Portal Adapter Timeout Handling
**Risk:** Simulated adapter doesn't handle timeout/failure correctly → system hangs or produces wrong state
**Mitigation:**
- Injectable failure modes: timeout, server error, rate limit, invalid response
- Explicit timeout with configurable duration
- Result = UNVERIFIABLE on timeout (not FAIL, not PASS)
- Show cached snapshot with age when portal is down
- Retry with exponential backoff (optional for prototype)

### 9. PDF Injection / Hidden Text Attacks
**Risk:** Malicious PDF contains hidden instructions that could influence LLM-based extraction
**Mitigation:**
- LLM not in decision path — structural defense
- Advisory sees only structured results, not raw PDF content
- Text sanitisation strips non-visible content
- Demo script includes optional "poisoned PDF" scenario to show decision unchanged

### 10. Hackathon Time Pressure Pitfalls
**Risk:** Building Tier B/C items before Tier A is fully working → demo fails on basics
**Mitigation:**
- Strict priority order from blueprint: rule engine → validators → four states → score + risk → evidence view → audit chain → evaluation numbers → video
- Tier B/C only after every Tier A item works end to end
- "Otherwise mark 'designed' on slides" for unfinished items
- The PPT and video decide selection; the prototype supports them

## Common Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|-------------|-------------|-----------|
| Single "AI accuracy" metric | Mixes OCR extraction accuracy with rule engine correctness | Report deterministic validation results per check separately |
| Percentage accuracy from tiny samples | Statistically meaningless; judges will challenge | Report counts: "zero false-PASS across 24 GSTIN tests" |
| `display: "Connected to GSTN"` | Implies live portal access you don't have | Display: "SIMULATED ADAPTER" with response, latency, fetched_at |
| Using `datetime.now()` for validity | Wrong — procurement uses bid opening date | Pass bid_opening_date to all validity checks |
| Ranking bidders by compliance score | Score is verification summary, not evaluation | Explicitly state: "Price evaluation is separate" |

---
*Research completed: 2026-09-28*

# Features Research: GeM Bid Verification Platform

## Table Stakes (Users Expect These)

### Document Upload & Processing
- Multi-format upload (PDF, scanned images)
- File type and size validation
- Text sanitisation
- Batch upload for bidder packs

### Validator Suite
- GSTIN format + checksum validation
- PAN format validation
- GSTIN-PAN cross-check (chars 3-12)
- Udyam registration number format validation
- CIN format validation
- Certificate expiry checking (vs bid opening date, not today)

### Portal Integration (Simulated)
- GST registration status lookup
- GST return filing status (COMPLIANT / OVERDUE)
- Udyam/MSME registration lookup
- EPFO establishment verification
- ESIC employer verification
- Debarment/blacklisting check
- Each response: `{status, fields, fetched_at, latency_ms, source: 'SIMULATED' | 'LIVE'}`

### Rule Engine
- Tender-specific requirement configuration
- Versioned rule sets
- Per-requirement applicability conditions
- Four result states: PASS, FAIL, REVIEW, UNVERIFIABLE
- Pure function evaluation (deterministic)

### Compliance Scoring
- Weighted formula (frozen, documented)
- Risk computation (independent from score)
- UNVERIFIABLE = 0 in denominator
- Score is verification summary, not bid ranking

### Officer Workflow
- View requirement results per bidder
- Approve / Reject / Request Clarification
- Mandatory justification on each action
- Evidence viewer with highlighted extraction regions

### Audit Trail
- Hash chain (SHA-256)
- Insert-only database role
- Tender version + rule-set version in each record
- Evidence hashes
- Verify endpoint (recompute chain, report first break)

### Dashboard
- Per-tender bidder overview
- Score, risk, state counts
- Requirement table with drill-down
- SIMULATED ADAPTER panel on portal responses

## Differentiators (Tier B/C — If Time)

### DigiLocker Integration (B)
- Hash/field comparison of uploaded doc vs issued record
- Simulated adapter

### Entity Matching (B)
- Name normalisation (casefold, strip M/s, Pvt, Private, Ltd)
- Token similarity via rapidfuzz
- Configurable thresholds
- Match/mismatch band → REVIEW

### Anomaly Detection (C)
- Metadata inconsistencies in uploaded PDFs
- Hidden text detection
- Font inconsistency flags
- Feeds REVIEW flags only

### AI Advisory Rewrite (Optional)
- Deterministic template builds advisory from rule results
- Optional model rewrites wording
- Must cite existing requirement IDs
- If validation fails, fall back to template
- Labelled "advisory"

## Anti-Features (Explicitly Excluded)

| Feature | Why Excluded |
|---------|-------------|
| Live portal scraping | ToS violations, fragile, integrity risk |
| LLM-based decisions | Non-reproducible; same evidence must give same result |
| Bidder ranking by score | Score is verification summary; price evaluation is separate |
| Real-world accuracy claims | Tested only on synthetic data; report counts, not percentages |
| Blockchain | Plain hash chain + insert-only role is simpler and demonstrable |
| Mobile app | Web-first for demo |

## Feature-to-PS-Item Mapping

| PS Item | Feature Category | Tier |
|---------|-----------------|------|
| 1. Portal integration | Portal adapters | A |
| 2. Udyam/MSME | Validators + Portal | A |
| 3. GST registration/filing | Validators + Portal | A |
| 4. PAN + Income Tax | Validators + Cross-check | A/C |
| 5. Make in India | Rule engine | A |
| 6. EPFO/ESIC | Rule engine + Portal | A |
| 7. Startup/NSIC/OEM | Portal + Extraction | A/B |
| 8. DigiLocker | Portal adapter | B |
| 9. Blacklisting | Portal + Rule engine | A |
| 10. Tender-specific | Rule config | A |
| 11. AI info detection | Extraction + Matching | A/B/C |
| 12. Score + Risk | Scoring | A |
| 13. AI recommendation | Advisory | A |
| 14. Audit trail | Audit | A |

---
*Research completed: 2026-09-28*

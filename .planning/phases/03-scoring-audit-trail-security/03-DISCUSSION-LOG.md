# Phase 3: Scoring, Audit Trail & Security - Discussion Log

**Mode:** Autonomous (Recommended Options Auto-Selected)
**Date:** 2026-09-28

## Decisions Selected

1. **Scoring Formula (SCOR-01, SCOR-03, SCOR-04):**
   - *Option:* Weighted sum of verifiable mandatory checks, excluding UNVERIFIABLE from denominator.
   - *Rationale:* Eliminates false-penalization when external portals are unreachable, accurately reflecting verified evidence only.
2. **Risk Classification (SCOR-02):**
   - *Option:* Independent 4-tier model (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) driven by distinct violation categories.
   - *Rationale:* Ensures debarred bidders cannot have low risk regardless of high scores elsewhere.
3. **Audit Trail Hash Chain (AUDT-01, AUDT-03, AUDT-04):**
   - *Option:* Canonical JSON serialization hashed with SHA-256 (`record_hash = sha256(prev_hash + canonical_json(payload))`).
   - *Rationale:* Cryptographically guarantees tamper-evidence; any tampering in payload or sequence breaks the chain immediately.
4. **Data Security & Retention (SECR-03, SECR-04):**
   - *Option:* AES-256-GCM authenticated encryption for evidence storage blobs with SHA-256 integrity digests.
   - *Rationale:* Standard industry grade encryption protecting sensitive statutory and financial documents.

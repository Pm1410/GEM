# Phase 3: Scoring, Audit Trail & Security - Context

**Created:** 2026-09-28
**Status:** Approved (Autonomous Mode)

## Context & Architecture Contract

### 1. Compliance Scoring Engine (SCOR-01, SCOR-03, SCOR-04)
- **Frozen Weighted Formula:**
  - Every tender requirement check carries an assigned weight $w_i$ (default: 1.0).
  - Check states map to fractional scores: `PASS` = 1.0, `REVIEW` = 0.5, `FAIL` = 0.0.
  - **UNVERIFIABLE Exclusion (SCOR-03):** Checks whose result state is `UNVERIFIABLE` (e.g. portal outage) are completely removed from both numerator and denominator ($w_i = 0$). The score strictly measures verifiable compliance.
  - Score formula:
    $$\text{Score} = \frac{\sum_{i \in \text{Verifiable}} w_i \times s_i}{\sum_{i \in \text{Verifiable}} w_i} \times 100$$
    If no checks are verifiable, score is 0.0 with `verifiable_coverage = 0%`.
  - **Non-Ranking Principle (SCOR-04):** The compliance score is explicitly documented as an eligibility indicator for procurement officers, NOT a bidder ranking mechanism or price factor.

### 2. Independent Risk Engine (SCOR-02)
- Risk is computed independently from the compliance score:
  - `CRITICAL`: Any active debarment or blacklisting, or statutory fraud/forgery.
  - `HIGH`: Any mandatory check is `FAIL` (e.g. expired certificate, local content failure, overdue GST returns).
  - `MEDIUM`: Any check is `REVIEW` (missing documents, ungrounded extractions) or `UNVERIFIABLE` (portal timeout).
  - `LOW`: All mandatory checks are `PASS`.
- Explainable risk factors list is generated alongside the risk level.

### 3. Tamper-Evident Audit Hash Chain (AUDT-01, AUDT-03, AUDT-04)
- Each audit entry computes:
  $$\text{record\_hash} = \text{SHA256}(\text{prev\_hash} + \text{canonical\_json}(\text{payload}))$$
  Genesis block uses `prev_hash = "0" * 64`.
- Payload carries:
  - `tender_id`, `tender_version`, `rule_set_version` (AUDT-04)
  - `bidder_id`
  - `requirement_results`
  - `evidence_hashes` (SHA256 of raw documents)
  - `compliance_score`, `risk_level`
  - `advisory_text_hash`
  - `officer_action` + `officer_justification` (if applicable)
  - `timestamp` (UTC ISO-8601)
- `verify_audit_chain` function: walks the chain, recomputes hashes, and reports `is_valid: bool`, `records_verified: int`, and if broken, `broken_index`, `expected_hash`, and `actual_hash`.

### 4. Database Security & Retention (AUDT-02, SECR-03, SECR-04)
- INSERT-only audit enforcement: table-level trigger `prevent_audit_tampering` rejects `UPDATE` and `DELETE`.
- Document encryption at rest: AES-256-GCM symmetric envelope encryption using `cryptography` library for stored evidence files.
- Retention policy: configurable retention window (e.g., 1825 days) and tamper-proof retention metadata.

# Phase 3: Scoring, Audit Trail & Security - Research

**Researched:** 2026-09-28
**Domain:** Deterministic Compliance Scoring, Risk Classification, Tamper-Evident Hash Chains, and Evidence Encryption
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Compliance score computed by frozen weighted formula (SCOR-01). Formula is deterministic, transparent, and reproducible for the exact same inputs.
- **D-02:** UNVERIFIABLE checks excluded from score denominator (SCOR-03): score reflects verifiable coverage only ($w_i = 0$ for unverified items).
- **D-03:** Score is a verification summary, not a bidder ranking or price substitute (SCOR-04).
- **D-04:** Independent risk level computation (SCOR-02): evaluated independently across `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
- **D-05:** Tamper-evident audit hash chain: $\text{record\_hash} = \text{SHA256}(\text{prev\_hash} + \text{canonical\_json}(\text{payload}))$ (AUDT-01, AUDT-04).
- **D-06:** INSERT-only database role and trigger enforcement (AUDT-02).
- **D-07:** Audit chain verification endpoint recomputes hashes from genesis and identifies any broken records (AUDT-03).
- **D-08:** Evidence encryption at rest (SECR-03, SECR-04) using AES-256-GCM authenticated cipher with retention policy tracking.

### the agent's Discretion
- Module layout within `src/gem_api/scoring/`, `src/gem_api/audit/`, `src/gem_api/security/`.
- Default weights for requirement categories (statutory = 1.0, tender-specific = 1.0).

### Deferred Ideas (OUT OF SCOPE)
- None.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scoring Engine | API / Logic | — | Pure function computing weighted score and verifiable coverage |
| Risk Engine | API / Logic | — | Multi-factor risk evaluator with severity ranking |
| Audit Hash Chain | API / Logic | DB | Tamper-evident cryptographic chain linked to database records |
| Evidence Security | API / Logic | File Store | AES-256-GCM symmetric encryption for documents at rest |

</architectural_responsibility_map>

<standard_stack>
## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cryptography | 50.0+ | AES-256-GCM encryption | Standard, auditable Python cryptography library |
| hashlib | stdlib | SHA-256 hashing | Native high-speed cryptographic hashing |
| json | stdlib | Canonical JSON sorting | Deterministic serialization for hashing |

</standard_stack>

<validation_architecture>
## Validation Architecture

### Test Infrastructure
- **Framework:** `pytest` 8.x
- **Commands:** `pytest tests/unit/ -v`

### Sampling Strategy
- Unit tests for scoring formula with normal weights, UNVERIFIABLE items (denominator exclusion), zero verifiable checks, and edge cases.
- Unit tests for independent risk classification (critical debarment, high statutory failures, medium review/timeouts, low pass).
- Unit tests for audit hash chain: genesis generation, multi-record chaining, serialization canonicality, and tamper detection (broken hash or payload mutation).
- Unit tests for AES-256-GCM document encryption, decryption, and wrong-key rejection.

</validation_architecture>

<security_threat_model>
## Security Threat Model (ASVS Level 1)

| Threat ID | Threat Description | Mitigation Strategy |
|-----------|--------------------|---------------------|
| T-03-01 | Audit log alteration or record deletion | Cryptographic SHA-256 hash chaining + INSERT-only DB trigger (AUDT-01, AUDT-02) |
| T-03-02 | Compromise of confidential documents at rest | AES-256-GCM encryption for stored evidence blobs (SECR-03) |
| T-03-03 | Undetected portal downtime distorting bidder score | Denominator exclusion for UNVERIFIABLE checks (SCOR-03) |

</security_threat_model>

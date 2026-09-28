---
phase: "03"
slug: "scoring-audit-trail-security"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-28"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x + pytest-asyncio |
| **Config file** | pyproject.toml |
| **Quick run command** | `pytest tests/unit/test_scoring.py -v` |
| **Full suite command** | `pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted unit tests
- **After every plan wave:** Run full test suite
- **Before verification:** Full test suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SCOR-01, SCOR-03, SCOR-04 | T-03-03 | Compliance score excludes UNVERIFIABLE from denominator | unit | `pytest tests/unit/test_scoring.py -k "score" -v` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SCOR-02 | T-03-03 | Risk level computed independently from result states | unit | `pytest tests/unit/test_scoring.py -k "risk" -v` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | AUDT-01, AUDT-03, AUDT-04 | T-03-01 | Hash chain sha256(prev_hash + payload) detects tampering | unit | `pytest tests/unit/test_audit_chain.py -v` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | AUDT-02, SECR-03, SECR-04 | T-03-02 | AES-256-GCM encryption at rest with retention metadata | unit | `pytest tests/unit/test_security.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/test_scoring.py` — unit tests for compliance scoring and risk evaluation
- [ ] `tests/unit/test_audit_chain.py` — unit tests for cryptographic audit hash chain & verification
- [ ] `tests/unit/test_security.py` — unit tests for data-at-rest encryption and retention policies

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-28

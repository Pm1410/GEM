---
phase: "01"
slug: "schema-rule-engine-validators"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-28"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x + pytest-asyncio |
| **Config file** | pyproject.toml |
| **Quick run command** | `pytest tests/unit/test_validators.py -v` |
| **Full suite command** | `pytest tests/ -v` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted unit tests (`pytest tests/unit/...`)
- **After every plan wave:** Run full test suite (`pytest tests/ -v`)
- **Before verification:** Full test suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PORT-01 | — | PortalResult models adhere to strict typed Pydantic contract | unit | `pytest tests/unit/test_adapters.py -v` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | VALD-01 | T-01-03 | Rejects invalid GSTIN formats and mismatched Mod-36 checksums | unit | `pytest tests/unit/test_validators.py -k test_gstin -v` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | VALD-02 | — | Emits FAIL when chars 3-12 of GSTIN do not match PAN | unit | `pytest tests/unit/test_validators.py -k test_gstin_pan_cross -v` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | VALD-03 | — | Rejects invalid PAN formats and invalid entity characters | unit | `pytest tests/unit/test_validators.py -k test_pan -v` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | VALD-04 | — | Validates 19-char Udyam registration number format | unit | `pytest tests/unit/test_validators.py -k test_udyam -v` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | VALD-05 | — | Compares certificate expiration against bid opening date, never system date | unit | `pytest tests/unit/test_validators.py -k test_date -v` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | RULE-01, RULE-02 | T-01-03 | Strict Pydantic parsing of YAML rules with fail-fast startup | unit | `pytest tests/unit/test_rules_config.py -v` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | RULE-03, RULE-04, RULE-05, RULE-06, RULE-07 | — | Pure function rule engine evaluates condition matching, threshold, and debarment | unit | `pytest tests/unit/test_rules_engine.py -v` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 3 | AUDT-02, T-01-01 | T-01-01 | PostgreSQL trigger and restricted role reject UPDATE/DELETE on audit table | integration | `pytest tests/unit/test_db_schema.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pyproject.toml` — project metadata and pytest configuration
- [ ] `tests/conftest.py` — shared fixtures and synthetic test data
- [ ] `tests/unit/test_validators.py` — test stubs for format validators
- [ ] `tests/unit/test_adapters.py` — test stubs for portal adapter contracts
- [ ] `tests/unit/test_rules_config.py` — test stubs for YAML parsing
- [ ] `tests/unit/test_rules_engine.py` — test stubs for rule evaluation
- [ ] `tests/unit/test_db_schema.py` — test stubs for SQLAlchemy models and audit trigger

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | — | — | All Phase 1 requirements have automated unit/integration tests |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-28

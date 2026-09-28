---
phase: "02"
slug: "portal-adapters-extraction-result-states"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-28"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x + pytest-asyncio |
| **Config file** | pyproject.toml |
| **Quick run command** | `pytest tests/unit/test_mock_adapters.py -v` |
| **Full suite command** | `pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

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
| 02-01-01 | 01 | 1 | PORT-02, PORT-03, PORT-07 | T-02-03 | MockGSTN and MockUdyam return realistic data with simulated latency/failures | unit | `pytest tests/unit/test_mock_adapters.py -k "gstn or udyam" -v` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PORT-04, PORT-05, PORT-06, PORT-09 | T-02-03 | MockEPFO, MockESIC, and MockDebarment return status and handle timeouts | unit | `pytest tests/unit/test_mock_adapters.py -k "epfo or esic or debarment" -v` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | EXTR-01, EXTR-02, SECR-01 | T-02-01 | Rejects files > 10MB or invalid MIME types; sanitizes text | unit | `pytest tests/unit/test_extraction.py -k "upload or sanitize" -v` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | EXTR-03, EXTR-04, SECR-02 | T-02-02 | Extracts fields and strictly enforces verbatim grounding against source text | unit | `pytest tests/unit/test_extraction.py -k "grounding or extract" -v` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | RSLT-01, RSLT-02, RSLT-03, RSLT-04, EXTR-05 | T-02-03 | Evaluates four result states with zero false PASS guarantee | unit | `pytest tests/unit/test_result_states.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/test_mock_adapters.py` — unit tests for all mock portal adapters
- [ ] `tests/unit/test_extraction.py` — unit tests for extraction pipeline and grounding rule
- [ ] `tests/unit/test_result_states.py` — unit tests for result state priority and portal down transitions

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-28

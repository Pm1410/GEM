---
phase: "05"
slug: "synthetic-data-evaluation"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-28"
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | pyproject.toml |
| **Quick run command** | `pytest tests/unit/test_synthetic_data.py -v` |
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
| 05-01-01 | 01 | 1 | DATA-01, DATA-04 | T-05-01 | Mod-36 GSTIN generator produces mathematically valid numbers | unit | `pytest tests/unit/test_synthetic_data.py -k "gstin or tender" -v` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DATA-02, DATA-03 | T-05-01 | 20+ bidder packs generated with realistic PDF documents | unit | `pytest tests/unit/test_synthetic_data.py -k "packs or pdf" -v` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | EVAL-01, EVAL-02, EVAL-03 | T-05-02 | Evaluation runner verifies Zero False-PASS property across all packs | unit | `pytest tests/unit/test_evaluation.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/test_synthetic_data.py` — unit tests for synthetic data generation and Mod-36 generator
- [ ] `tests/unit/test_evaluation.py` — unit tests for benchmark evaluation pipeline and zero false-PASS report

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-28

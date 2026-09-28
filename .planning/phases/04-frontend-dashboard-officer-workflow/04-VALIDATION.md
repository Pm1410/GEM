---
phase: "04"
slug: "frontend-dashboard-officer-workflow"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-09-28"
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x + httpx (TestClient) |
| **Config file** | pyproject.toml |
| **Quick run command** | `pytest tests/unit/test_advisory.py -v` |
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
| 04-01-01 | 01 | 1 | ADVS-01, ADVS-02, ADVS-04 | T-04-03 | Deterministic advisory cites REQ-XX and includes disclaimer | unit | `pytest tests/unit/test_advisory.py -v` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | OFCR-04, OFCR-05, AUDT-03 | T-04-01, T-04-02 | RBAC authorization and mandatory justification on actions | unit | `pytest tests/unit/test_api_endpoints.py -v` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | DASH-01, DASH-02, OFCR-01 | T-04-03 | Officer dashboard renders bidder table and requirement breakdown | unit | `pytest tests/unit/test_dashboard_ui.py -v` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | DASH-03, OFCR-02, OFCR-03 | T-04-01 | Evidence viewer with highlight regions and action modal | unit | `pytest tests/unit/test_dashboard_ui.py -k "evidence or action" -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/test_advisory.py` — unit tests for advisory generation
- [ ] `tests/unit/test_api_endpoints.py` — unit tests for REST API endpoints and RBAC
- [ ] `tests/unit/test_dashboard_ui.py` — unit tests for UI assets and dashboard components

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-28

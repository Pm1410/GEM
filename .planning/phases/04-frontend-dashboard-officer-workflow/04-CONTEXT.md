# Phase 4: Frontend Dashboard & Officer Workflow - Context

**Created:** 2026-09-28
**Status:** Approved (Autonomous Mode)

## Context & Architecture Contract

### 1. Deterministic Advisory Generator (ADVS-01, ADVS-02, ADVS-03, ADVS-04)
- Pure template engine generating officer recommendations from structured `TenderEvaluationReport`:
  - Clearly marked: `ADVISORY: FOR PROCURING OFFICER EVALUATION ONLY - NOT AN AUTOMATED DISQUALIFICATION` (ADVS-04).
  - Explicitly cites requirement IDs (`REQ-GSTIN`, `REQ-PAN`, `REQ-MII`, etc.) (ADVS-02).
  - Summarizes:
    - Compliance status (PASS, FAIL, REVIEW, UNVERIFIABLE).
    - Specific deficiencies and missing documents.
    - Statutory violations if any (e.g. overdue GST filing, expired certificates).
    - Recommended next step: "Approve bid", "Reject due to statutory non-compliance", or "Issue clarification notice".
  - Template is 100% deterministic (ADVS-01); optional AI rewrite fallback always defaults to template (ADVS-03).

### 2. Officer Workflow & RBAC API (OFCR-01, OFCR-03, OFCR-04, OFCR-05)
- Role-based Access Control (RBAC):
  - Roles: `officer`, `evaluator`, `admin`, `auditor` (read-only).
  - Enforced via FastAPI dependency and Bearer token / header (`X-User-Role`, `X-User-Id`).
  - `auditor` role has strict read-only access (`GET` only).
- Officer Decisions:
  - Permitted actions: `APPROVE`, `REJECT`, `REQUEST_CLARIFICATION` (OFCR-03).
  - Mandatory justification: action rejected if `justification` string is empty or < 10 characters (OFCR-04).
  - Every action appends a cryptographically chained record to `audit_trail` (AUDT-01).

### 3. Frontend Dashboard & Evidence Viewer (DASH-01, DASH-02, DASH-03, OFCR-02)
- GeM Procurement Portal Dashboard:
  - Header: Role switcher (`Officer`, `Evaluator`, `Admin`, `Auditor`), tender selector, simulation status badge.
  - Tender Overview: Total bidders, compliance score distribution, risk tier breakdown (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), result states count pills (`PASS`, `FAIL`, `REVIEW`, `UNVERIFIABLE`).
  - Bidder Table: Bidder legal name, score, risk badge, state breakdown, actions.
  - Bidder Detail / Verification View:
    - Advisory panel with cited requirement IDs.
    - Check-by-check breakdown showing result state, evidence submitted, portal lookup status (with `SIMULATED` badge).
    - Interactive Evidence Viewer: Document panel showing extracted text and highlighted bounding box/character regions.
    - Officer Decision Drawer: Action selection, mandatory justification text area, confirmation.
    - Audit Trail Inspector: Visual hash chain showing block index, timestamp, payload hash, prev hash, and "Verify Audit Integrity" button.

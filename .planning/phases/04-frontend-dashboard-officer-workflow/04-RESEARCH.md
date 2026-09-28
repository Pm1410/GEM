# Phase 4: Frontend Dashboard & Officer Workflow - Research

**Researched:** 2026-09-28
**Domain:** Advisory Generation, FastAPI REST APIs, RBAC Middleware, Procurement Officer UI, Evidence Viewer
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Deterministic advisory template generator (ADVS-01). Cites REQ-XX IDs (ADVS-02), includes clear advisory label (ADVS-04), and provides structured advice for officer review.
- **D-02:** Mandatory justification on every officer action (OFCR-04) with Approve, Reject, and Request Clarification choices (OFCR-03).
- **D-03:** RBAC enforcement (OFCR-05): officer, evaluator, admin, auditor (read-only) roles across API and UI.
- **D-04:** Bidder overview dashboard (DASH-01): score, risk tier, state counts.
- **D-05:** Requirement table (DASH-02): check breakdown, result states, evidence links.
- **D-06:** Evidence viewer (DASH-03, OFCR-02): displays extracted evidence with region/bounding highlight.
- **D-07:** Audit chain viewer with integrity verification (AUDT-03).

### the agent's Discretion
- UI layout, responsive components, CSS styling adhering to web application development aesthetic guidelines.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Advisory Generator | API / Advisory | — | Pure function generating formatted advisory text citing REQ-XX |
| REST API Endpoints | API / FastAPI | DB / Rules | Exposes tenders, bidders, evaluations, officer actions, audit |
| RBAC Middleware | API / Auth | — | Validates roles (`officer`, `evaluator`, `admin`, `auditor`) |
| Dashboard Frontend | Web / UI | API | Rich interactive UI with evidence viewer and audit chain verifier |

</architectural_responsibility_map>

<standard_stack>
## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | 0.110+ | REST API framework | Async-first, automatic OpenAPI docs, Pydantic validation |
| httpx | latest | Test client | Asynchronous HTTP client for testing FastAPI apps |
| Vanilla JS + CSS | Modern ES6+ | Dashboard frontend | Fast, highly responsive, zero complex build chain, stunning aesthetics |

</standard_stack>

<validation_architecture>
## Validation Architecture

### Test Infrastructure
- **Framework:** `pytest` + `httpx` (FastAPI TestClient)
- **Commands:** `pytest tests/unit/ -v`

### Sampling Strategy
- Unit tests for advisory template generation (clean pass, critical debarred, multiple failures, missing info).
- Unit tests for RBAC enforcement (auditor cannot POST actions, officer can POST with justification, missing justification rejected).
- Unit tests for API endpoints (tenders, bidders, evaluation, action logging, audit verification).

</validation_architecture>

<security_threat_model>
## Security Threat Model (ASVS Level 1)

| Threat ID | Threat Description | Mitigation Strategy |
|-----------|--------------------|---------------------|
| T-04-01 | Unauthorized officer action (Approvals/Rejections) | Role-based check rejecting non-officer/non-admin roles (OFCR-05) |
| T-04-02 | Unjustified officer action | Minimum justification validation enforced at API boundary (OFCR-04) |
| T-04-03 | Advisory confused for automated disqualification | Mandatory legal disclaimer banner on all advisory outputs (ADVS-04) |

</security_threat_model>

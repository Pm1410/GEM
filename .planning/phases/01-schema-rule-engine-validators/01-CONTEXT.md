# Phase 1: Schema, Rule Engine & Validators - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the core data and verification foundation for the GeM Bid Verification Platform:
- PostgreSQL database schema with SQLAlchemy 2.0 Async (`asyncpg`) and Alembic migrations.
- Dual-role database security with INSERT-only enforcement and trigger defense-in-depth on the `audit_trail` table.
- Versioned YAML tender rule configuration parsed and validated strictly at application startup via Pydantic.
- Pure Python deterministic rule evaluation engine using a handler registry pattern (`@register_check`).
- Format validators: GSTIN with official Mod-36 checksum and Census state code check, PAN format, Udyam format, and certificate validity evaluated against the bid opening date.
- GSTIN-PAN cross-check (chars 3-12 of GSTIN vs PAN).
- `PortalAdapter` base class and `PortalResult` contract with async lookup signature and injectable latency/failure hooks.
- Comprehensive unit test suite covering positive, negative, and edge cases for all validators and rule engine functions.

</domain>

<decisions>
## Implementation Decisions

### Rule Config & Engine Architecture
- **D-01:** Simple key-value dictionary matching for `applies_if` (e.g. `applies_if: { tender_category: "services" }`), evaluated via strict dictionary equality and membership checks in Python. — **Reversibility:** costly — changing condition syntax requires updating all tender YAML files and evaluation logic.
- **D-02:** Strict Pydantic models with fail-fast startup. Tender YAML configurations are validated immediately on application start; any schema errors, missing fields, or unrecognized check types abort startup with clear error messages. — **Reversibility:** costly — schemas define configuration contract for all downstream tenders.
- **D-03:** Conventional result state defaults with YAML overrides. The engine defaults to `FAIL` for check violations, `REVIEW` for missing evidence, and `UNVERIFIABLE` for portal outages, with explicit YAML overrides only when special handling is needed. — **Reversibility:** costly — affects default outcome mapping across all requirement checks.
- **D-04:** Handler Registry with pure functions. A decorator `@register_check("check_name")` registers deterministic evaluation functions with standardized signature `(context: VerificationContext, params: dict) -> CheckResult`. Rule engine contains zero LLM dependency. — **Reversibility:** costly — standardizes dispatch interface across all check implementations.

### Database Setup & Audit Security
- **D-05:** SQLAlchemy 2.0 Async (`asyncpg`) + Alembic migrations for declarative models, versioned migration scripts, and native async support in FastAPI. — **Reversibility:** one-way — database schema and migration baseline.
- **D-06:** UUIDv4 primary keys across all database tables (tenders, bidders, evidence, verification results, audit records) using PostgreSQL native `UUID` type generated client-side via Python `uuid.uuid4()`. — **Reversibility:** one-way — changing primary key types requires full schema migration.
- **D-07:** PostgreSQL JSONB columns validated by Pydantic models for extracted document attributes, portal raw payloads, and check execution parameters. — **Reversibility:** costly — column types and serialization models used across services.
- **D-08:** Dual PostgreSQL role + DB trigger defense-in-depth for audit trail. Dedicated `auditor_user` role (`GRANT INSERT, SELECT ON audit_trail TO auditor_user; REVOKE UPDATE, DELETE`) combined with a PostgreSQL BEFORE UPDATE OR DELETE trigger raising an exception on any attempt to alter or delete audit records. — **Reversibility:** costly — required for hackathon tamper-evident demo and security compliance.

### Format Validators & Cross-Checks
- **D-09:** GSTIN format validator implementing the official 15-character Mod-36 check algorithm (chars 1-2 Census state code, 3-12 PAN, 13 entity code, 14 default 'Z', 15 Mod-36 check digit).
- **D-10:** GSTIN-PAN cross-check ensuring characters 3-12 of GSTIN match the supplied PAN document string exactly.
- **D-11:** PAN format validator enforcing 10-char pattern `[A-Z]{5}[0-9]{4}[A-Z]`, validating character 4 entity status against standard types (P, C, H, F, A, T, B, L, J, G).
- **D-12:** Udyam format validator enforcing 19-char format `UDYAM-XX-00-0000000` with 2-letter state code and 7-digit numeric serial.
- **D-13:** Certificate validity check comparing certificate expiration date against the tender's **bid opening date** (not current execution date).

### PortalAdapter Interface Contract
- **D-14:** `PortalAdapter` abstract base class with async `lookup(id_value: str) -> PortalResult` returning a Pydantic `PortalResult` model containing `status: Literal['ACTIVE', 'INACTIVE', 'ERROR', 'TIMEOUT']`, `fields: dict`, `raw_payload: dict`, `fetched_at: datetime`, `latency_ms: int`, `source: Literal['SIMULATED', 'LIVE']`, and `is_cached: bool`.
- **D-15:** Built-in configurable latency and failure injection hooks (`latency_ms: int = 0`, `fail_mode: Optional[Literal['timeout', 'error', 'stale']] = None`) on all adapter instances to support edge case testing and hackathon demo scenarios.

### the agent's Discretion
- Packaging and directory layout: Clean modular FastAPI structure (`src/gem_api/db`, `src/gem_api/rules`, `src/gem_api/validators`, `src/gem_api/adapters`, `tests/`).
- Specific Pydantic model field names matching research specs and requirements.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Specifications
- `.planning/PROJECT.md` — Project mission, constraints, core value, and architecture summary.
- `.planning/REQUIREMENTS.md` §Validators, §Rule Engine, §Portal Adapters — PORT-01, VALD-01 to VALD-05, RULE-01 to RULE-07.
- `.planning/ROADMAP.md` §Phase 1 — Phase 1 goals, scope, and success criteria.

### Stack & Architecture Research
- `.planning/research/STACK.md` §Validator Formats — Exact format specs for GSTIN Mod-36, PAN, Udyam, EPFO, ESIC.
- `.planning/research/ARCHITECTURE.md` §Three-Tier Architecture — Adapter pattern, Rule Engine, and Audit hash chain design.
- `.planning/research/PITFALLS.md` — Pitfalls #1 (False PASS), #3 (GSTIN Mod-36 edge cases), #5 (Tender rules vs engine code), #8 (Current date vs bid opening date).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (Phase 1 establishes the initial codebase).

### Established Patterns
- Pure Python functions for all rule evaluation and validation logic.
- Pydantic models for configuration and data transfer contracts.
- Async-first database access via SQLAlchemy 2.0 and asyncpg.

### Integration Points
- `src/gem_api/validators` -> imported by `src/gem_api/rules` handlers.
- `src/gem_api/adapters` -> base interface implemented by Phase 2 mock adapters.
- `src/gem_api/db` -> tables consumed by Phase 2-4 services.

</code_context>

<specifics>
## Specific Ideas

- The user emphasized ensuring the technical foundation is robust: "if more discussion is required for better project then do it if not then go on".
- Mod-36 checksum must implement the exact official weights and modulo-36 logic so that actual sample GSTINs pass/fail accurately.
- Everything must be unit tested with positive, negative, and edge test fixtures.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 1 scope.

</deferred>

---

*Phase: 1-Schema, Rule Engine & Validators*
*Context gathered: 2026-09-28*

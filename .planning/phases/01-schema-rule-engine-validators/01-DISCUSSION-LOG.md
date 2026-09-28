# Phase 1: Schema, Rule Engine & Validators - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-28
**Phase:** 1-Schema, Rule Engine & Validators
**Areas discussed:** YAML Rule Config Schema & Condition Syntax, Database Setup & Migration Strategy, GSTIN Mod-36 & Validator Strictness, PortalAdapter Core Interface & Async Signature

---

## YAML Rule Config Schema & Condition Syntax

### Condition Syntax for `applies_if`
| Option | Description | Selected |
|--------|-------------|----------|
| Simple key-value dictionary matching | e.g. `applies_if: { tender_category: "services" }`, evaluated via strict dictionary equality/membership | ✓ |
| Mini-expression evaluation | e.g. `applies_if: "tender.category == 'services'"`, parsed via safe AST expression parser | |
| Named predicate functions | e.g. `applies_if: "is_services_tender"`, referencing registered Python predicate functions | |
| You decide | | |

**User's choice:** Simple key-value dictionary matching — e.g. applies_if: { tender_category: "services" }, evaluated via strict dictionary equality/membership
**Notes:** Chosen for deterministic evaluation, clean syntax, and low error surface.

### YAML Schema Validation Strictness
| Option | Description | Selected |
|--------|-------------|----------|
| Strict Pydantic models with fail-fast startup | YAML files are validated on application start; invalid fields or missing checks fail immediately with clear errors | ✓ |
| Pydantic models with permissive defaults | Missing fields use sensible defaults and log warnings without stopping startup | |
| You decide | | |

**User's choice:** Strict Pydantic models with fail-fast startup — YAML files are validated on application start; invalid fields or missing checks fail immediately with clear errors
**Notes:** Prevents runtime surprises and misconfigured tenders during evaluation.

### Result State Action Declarations
| Option | Description | Selected |
|--------|-------------|----------|
| Conventional defaults with YAML overrides | System defaults to FAIL for check errors, REVIEW for missing evidence, and UNVERIFIABLE for portal outages, with explicit YAML overrides only when special handling is needed | ✓ |
| Explicit states on every check | Every requirement in YAML must explicitly declare on_fail, on_missing, and on_portal_down result states | |
| You decide | | |

**User's choice:** Conventional defaults with YAML overrides — System defaults to FAIL for check errors, REVIEW for missing evidence, and UNVERIFIABLE for portal outages, with explicit YAML overrides only when special handling is needed
**Notes:** Keeps YAML concise while maintaining full extensibility.

### Rule Engine Check Dispatch Mechanism
| Option | Description | Selected |
|--------|-------------|----------|
| Handler Registry with pure functions | Python decorator/registry (`@register_check('check_name')`) mapping check types to pure functions with a standardized `(context, params) -> CheckResult` signature | ✓ |
| Class-based Strategy pattern | Individual strategy classes implementing a BaseCheck interface per category | |
| Single centralized match/case dispatcher | A single pure dispatch function evaluating checks based on check type string | |
| You decide | | |

**User's choice:** Handler Registry with pure functions — Python decorator/registry (`@register_check('check_name')`) mapping check types to pure functions with a standardized `(context, params) -> CheckResult` signature
**Notes:** Decouples check implementations cleanly and keeps each check pure, testable, and isolated.

---

## Database Setup & Migration Strategy

### ORM & Schema Migrations
| Option | Description | Selected |
|--------|-------------|----------|
| SQLAlchemy 2.0 Async (asyncpg) + Alembic | Clean declarative models, versioned migration scripts, and native async support | ✓ |
| SQLAlchemy 2.0 with create_all() on startup | Fast startup without separate migration steps, ideal for rapid hackathon iteration | |
| Raw SQL DDL scripts + asyncpg | Zero ORM abstraction, pure SQL tables and queries | |
| You decide | | |

**User's choice:** SQLAlchemy 2.0 Async (asyncpg) + Alembic — Clean declarative models, versioned migration scripts, and native async support
**Notes:** Standardized modern async database layer for FastAPI.

### Primary Key Strategy
| Option | Description | Selected |
|--------|-------------|----------|
| UUIDv4 primary keys across all tables | Native PostgreSQL uuid type generated client-side, prevents enumeration and enables easy mocking/seeding | ✓ |
| BigInt autoincrement primary keys + public string IDs | | |
| You decide | | |

**User's choice:** UUIDv4 primary keys across all tables — Native PostgreSQL uuid type generated client-side, prevents enumeration and enables easy mocking/seeding
**Notes:** Client-side generation simplifies mock and test seed generation.

### Evidence & Metadata Storage
| Option | Description | Selected |
|--------|-------------|----------|
| PostgreSQL JSONB columns validated by Pydantic models | Flexible schema for heterogeneous documents/evidence, efficient indexing, fast serialization | ✓ |
| Fully normalized relational tables for document fields and portal attributes | | |
| You decide | | |

**User's choice:** PostgreSQL JSONB columns validated by Pydantic models — Flexible schema for heterogeneous documents/evidence, efficient indexing, fast serialization
**Notes:** Clean balance between flexibility for unstructured evidence and typed safety in Python.

### Audit Table Security
| Option | Description | Selected |
|--------|-------------|----------|
| Dual DB role + DB trigger defense-in-depth | Dedicated INSERT-only role for audit records plus a PostgreSQL trigger raising exception on any UPDATE/DELETE | ✓ |
| PostgreSQL trigger only | Enforces append-only behavior on the audit table regardless of connection user | |
| Application-level enforcement only | | |
| You decide | | |

**User's choice:** Dual DB role + DB trigger defense-in-depth — Dedicated INSERT-only role for audit records plus a PostgreSQL trigger raising exception on any UPDATE/DELETE
**Notes:** Rigorous defense-in-depth satisfies PS requirement AUDT-02 and impresses judges during the security demo.

---

## Validators & PortalAdapter
User confirmed: apply standard battle-tested specs directly:
- GSTIN: Official 15-char Mod-36 checksum, 01-37 Census state codes, PAN cross-match at chars 3-12.
- PAN: 10-char regex `[A-Z]{5}[0-9]{4}[A-Z]`, pos 4 entity verification.
- Udyam: 19-char `UDYAM-XX-00-0000000`.
- Certificate Validity: Date comparison against tender bid opening date (not current time).
- PortalAdapter: Async `lookup(id_value: str) -> PortalResult` returning Pydantic model with source label and latency/failure injection hooks.

---

## the agent's Discretion
- Modular package layout (`src/gem_api/db`, `src/gem_api/rules`, `src/gem_api/validators`, `src/gem_api/adapters`, `tests/`).
- Test fixtures for positive, negative, and edge validation scenarios.

## Deferred Ideas
- None — all topics discussed fit Phase 1 scope.

# Phase 1: Schema, Rule Engine & Validators - Research

**Researched:** 2026-09-28
**Domain:** Deterministic Bid Verification, Schema Design & Indian Statutory Format Validators
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Simple key-value dictionary matching for `applies_if` (e.g. `applies_if: { tender_category: "services" }`), evaluated via strict dictionary equality and membership checks in Python.
- **D-02:** Strict Pydantic models with fail-fast startup. Tender YAML configurations are validated immediately on application start; any schema errors, missing fields, or unrecognized check types abort startup with clear error messages.
- **D-03:** Conventional result state defaults with YAML overrides. The engine defaults to `FAIL` for check violations, `REVIEW` for missing evidence, and `UNVERIFIABLE` for portal outages, with explicit YAML overrides only when special handling is needed.
- **D-04:** Handler Registry with pure functions. A decorator `@register_check("check_name")` registers deterministic evaluation functions with standardized signature `(context: VerificationContext, params: dict) -> CheckResult`. Rule engine contains zero LLM dependency.
- **D-05:** SQLAlchemy 2.0 Async (`asyncpg`) + Alembic migrations for declarative models, versioned migration scripts, and native async support in FastAPI.
- **D-06:** UUIDv4 primary keys across all database tables (tenders, bidders, evidence, verification results, audit records) using PostgreSQL native `UUID` type generated client-side via Python `uuid.uuid4()`.
- **D-07:** PostgreSQL JSONB columns validated by Pydantic models for extracted document attributes, portal raw payloads, and check execution parameters.
- **D-08:** Dual PostgreSQL role + DB trigger defense-in-depth for audit trail. Dedicated `auditor_user` role (`GRANT INSERT, SELECT ON audit_trail TO auditor_user; REVOKE UPDATE, DELETE`) combined with a PostgreSQL BEFORE UPDATE OR DELETE trigger raising an exception on any attempt to alter or delete audit records.
- **D-09:** GSTIN format validator implementing official 15-character Mod-36 check algorithm (chars 1-2 Census state code 01-37, 3-12 PAN, 13 entity code, 14 default 'Z', 15 Mod-36 check digit).
- **D-10:** GSTIN-PAN cross-check ensuring characters 3-12 of GSTIN match the supplied PAN document string exactly.
- **D-11:** PAN format validator enforcing 10-char pattern `[A-Z]{5}[0-9]{4}[A-Z]`, validating character 4 entity status against standard types (P, C, H, F, A, T, B, L, J, G).
- **D-12:** Udyam format validator enforcing 19-char format `UDYAM-XX-00-0000000` with 2-letter state code and 7-digit numeric serial.
- **D-13:** Certificate validity check comparing certificate expiration date against the tender's **bid opening date** (not current execution date).
- **D-14:** `PortalAdapter` abstract base class with async `lookup(id_value: str) -> PortalResult` returning a Pydantic `PortalResult` model containing `status: Literal['ACTIVE', 'INACTIVE', 'ERROR', 'TIMEOUT']`, `fields: dict`, `raw_payload: dict`, `fetched_at: datetime`, `latency_ms: int`, `source: Literal['SIMULATED', 'LIVE']`, and `is_cached: bool`.
- **D-15:** Built-in configurable latency and failure injection hooks on all adapter instances to support edge case testing and hackathon demo scenarios.

### the agent's Discretion
- Code organization into clear modules: `src/gem_api/db/`, `src/gem_api/validators/`, `src/gem_api/rules/`, `src/gem_api/adapters/`.
- Test suite structure and synthetic test fixtures.

### Deferred Ideas (OUT OF SCOPE)
- None — all topics fit Phase 1 scope.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Database Schema & Tables | Database/Storage | API/Backend (ORM) | PostgreSQL stores relational structures, JSONB payloads, and audit triggers |
| INSERT-only Audit Enforcement | Database/Storage | API/Backend (Roles) | DB trigger and restricted role enforce tamper-evident persistence |
| Statutory Format Validators | API/Backend | — | Pure Python deterministic regex and checksum arithmetic |
| YAML Rule Engine Core | API/Backend | — | Pure function registry evaluating rules against context data |
| PortalAdapter Base Interface | API/Backend | — | Abstract class and Pydantic model contract for adapter implementations |
| Unit Test Suite | API/Backend | — | Pytest suite validating all validators, schema models, and rules |

</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 provides the bedrock of the GeM Bid Verification Platform. The design ensures complete determinism: no machine learning, no heuristic guessing, and zero false passes.

The system is organized into four clean subpackages within `src/gem_api`:
1. `db`: Declarative SQLAlchemy 2.0 models mapping `Tender`, `Bidder`, `Evidence`, `VerificationResult`, and `AuditRecord` with PostgreSQL UUIDs and JSONB columns, along with an Alembic baseline migration and an audit protection trigger (`prevent_audit_tampering()`).
2. `validators`: Standalone pure Python validators for GSTIN (with the exact GSTN Mod-36 check digit algorithm and Census 2011 state codes), PAN (pos 4 entity check), Udyam (19-char format), and certificate date validity evaluated strictly against the tender bid opening date. Includes the GSTIN-PAN cross-check.
3. `rules`: Pydantic schema models for versioned tender YAML configurations, rule sets, requirements, and checks. Implements the `@register_check` registry and pure execution functions that evaluate checks and return `CheckResult` with result states (`PASS`, `FAIL`, `REVIEW`, `UNVERIFIABLE`).
4. `adapters`: The `PortalAdapter` abstract base class and `PortalResult` Pydantic model, providing the async lookup contract, metadata attributes (`source='SIMULATED'`), and configurable latency/failure injection.

**Primary recommendation:** Build pure, side-effect-free validator and rule functions first with 100% test coverage using comprehensive test fixtures, then wire the SQLAlchemy 2.0 schema and Alembic migrations.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.11+ | Runtime | Native support for typing, modern syntax, async performance |
| SQLAlchemy | 2.0.35+ | ORM / Declarative Schema | Typed async 2.0 API, JSONB support, native PostgreSQL integration |
| asyncpg | 0.29.0+ | PostgreSQL Driver | Highest performance async PostgreSQL driver for Python |
| Pydantic | 2.9+ | Data Validation | High-performance Rust-backed schema validation for YAML configs and API models |
| PyYAML | 6.0.2+ | Configuration Parsing | Standard YAML reader in Python ecosystem |
| pytest | 8.3+ | Testing Framework | Modern test discovery, fixtures, and assertions |
| pytest-asyncio | 0.24+ | Async Test Runner | Native async test support for database and adapter testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| alembic | 1.13+ | Schema Migrations | Versioned database schema evolution |
| python-dotenv | 1.0+ | Environment Config | Loading local development environment variables |

</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Official GSTN Mod-36 Checksum
The 15th character of an Indian GSTIN is a checksum calculated across characters 1–14 using a custom Base-36 alphabet:
- Alphabet: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ` (36 characters, value 0 to 35).
- Weights: Characters at odd positions (from right, 1-indexed) are multiplied by 1; characters at even positions are multiplied by 2.
- For each character:
  - `val = char_value`
  - `prod = val * weight`
  - `quotient = prod // 36`
  - `remainder = prod % 36`
  - `sum += quotient + remainder`
- `check_val = (36 - (sum % 36)) % 36`
- The 15th character must equal `Alphabet[check_val]`.

### Pattern 2: Rule Engine Registry Pattern
```python
from typing import Callable, Dict
from gem_api.rules.models import CheckResult, VerificationContext

CHECK_REGISTRY: Dict[str, Callable] = {}

def register_check(name: str):
    def decorator(fn: Callable[[VerificationContext, dict], CheckResult]):
        CHECK_REGISTRY[name] = fn
        return fn
    return decorator
```

### Pattern 3: Audit Table Protection Trigger
```sql
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail is immutable. UPDATE or DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_tampering
BEFORE UPDATE OR DELETE ON audit_trail
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
```

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom random string | `uuid.uuid4()` | RFC 4122 standard, native PostgreSQL index support |
| Schema migration tracking | Ad-hoc SQL scripts | Alembic | Tracks schema revisions, rollbacks, dependency graphs |
| Model serialization | Custom dict converters | Pydantic v2 `BaseModel` | Rust-backed speed, automatic JSON schema generation |
| Async DB connection pool | Custom connection manager | SQLAlchemy `create_async_engine` | Connection pooling, retry, asyncpg dialect handling |

</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: False PASS on Missing Input
**What goes wrong:** If evidence is missing or cannot be validated, an improperly structured check might return PASS by falling through conditional logic.
**How to avoid:** All checks follow the "Never False PASS" rule: if required data is absent, return `REVIEW`. Only return `PASS` when evidence explicitly satisfies all criteria.

### Pitfall 2: Date Comparison against Today's Date
**What goes wrong:** A certificate valid at bid opening date is flagged as EXPIRED because evaluation occurs weeks later.
**How to avoid:** Always pass `context.bid_opening_date` into date comparisons. Never use `datetime.now()` for tender qualification decisions.

### Pitfall 3: Checksum Alphabet Misalignment
**What goes wrong:** Using standard Base64 or hex lookup tables for GSTIN Mod-36 instead of the official 36-char GSTN alphabet (`0-9` then `A-Z`).
**How to avoid:** Use the exact GSTN specification and test against known valid Indian GSTINs.

</common_pitfalls>

<validation_architecture>
## Validation Architecture

### Test Infrastructure
- **Framework:** `pytest` 8.3+ with `pytest-asyncio`
- **Quick run command:** `pytest tests/unit/ -v`
- **Full suite command:** `pytest -v`
- **Estimated runtime:** < 5 seconds

### Sampling Strategy
- After every task commit: Run targeted test module (e.g. `pytest tests/unit/test_validators.py`).
- After every plan wave: Run full suite `pytest -v`.
- Full suite must be completely green before plan completion.

</validation_architecture>

<security_threat_model>
## Security Threat Model (ASVS Level 1)

| Threat ID | Threat Description | Mitigation Strategy |
|-----------|--------------------|---------------------|
| T-01-01 | Tampering with audit logs (UPDATE or DELETE) | PostgreSQL trigger `prevent_audit_tampering` + separate `auditor_user` role |
| T-01-02 | SQL Injection via raw parameters | Parameterized queries via SQLAlchemy ORM / Core expressions |
| T-01-03 | Malformed / Malicious YAML configs | Strict Pydantic parsing with whitelist of valid check types and fields |
| T-01-04 | ID Enumeration / Scraping | UUIDv4 for all public and internal entity identifiers |

</security_threat_model>

---

*Phase: 01-schema-rule-engine-validators*
*Research completed: 2026-09-28*
*Ready for planning: yes*

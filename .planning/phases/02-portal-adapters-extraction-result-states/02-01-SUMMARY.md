# Phase 2 Plan 01 Summary: Simulated Portal Adapters

**Executed:** 2026-09-28
**Plan:** `.planning/phases/02-portal-adapters-extraction-result-states/02-01-PLAN.md`
**Status:** COMPLETE

## Accomplishments

1. **Synthetic Portal Dataset (`synthetic_portals.json`):**
   - Configured realistic synthetic data for GSTINs, Udyam MSME entries, EPFO establishment records, ESIC employer records, and debarment cases.
   - Includes real test GSTIN (`27AAACT2727Q1ZW`), overdue filing variants, cancelled registrations, and scoped debarment records.
2. **Five Mock Portal Adapters:**
   - `MockGSTNAdapter`: Returns taxpayer registration status, return filing status (COMPLIANT/OVERDUE), last return type (`GSTR-3B`), period, and filing date.
   - `MockUdyamAdapter`: Returns MSME enterprise category (`MICRO`, `SMALL`, `MEDIUM`) and major activity (`MANUFACTURING`, `SERVICES`).
   - `MockEPFOAdapter`: Returns establishment registration status, wage month, and contributing member count.
   - `MockESICAdapter`: Returns employer registration status and compliance status (`COMPLIANT`, `DEFAULTER`).
   - `MockDebarmentAdapter`: Returns debarment status with scope (`org_wide`, `category`, `state`), authority, orders, and active dates.
3. **Simulated Environment Controls:**
   - All adapters inherit from `PortalAdapter` and return `PortalResult` with `source="SIMULATED"`.
   - Injected latency, timeout (`TimeoutError -> TIMEOUT`), error (`ConnectionError -> ERROR`), and stale cache modes (`is_cached=True` with past timestamps).
4. **Verification:**
   - 13 new unit tests in `tests/unit/test_mock_adapters.py` passing 100%. Total suite at 59/59 passing.

## Files Created/Updated
- `src/gem_api/adapters/data/synthetic_portals.json`
- `src/gem_api/adapters/mock_gstn.py`
- `src/gem_api/adapters/mock_udyam.py`
- `src/gem_api/adapters/mock_epfo.py`
- `src/gem_api/adapters/mock_esic.py`
- `src/gem_api/adapters/mock_debarment.py`
- `src/gem_api/adapters/__init__.py`
- `tests/unit/test_mock_adapters.py`

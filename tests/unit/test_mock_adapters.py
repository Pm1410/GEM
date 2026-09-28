"""Unit tests for simulated portal adapters (Phase 2 - Plan 01)."""

import pytest
from datetime import datetime, timezone, timedelta

from gem_api.adapters import (
    MockGSTNAdapter,
    MockUdyamAdapter,
    MockEPFOAdapter,
    MockESICAdapter,
    MockDebarmentAdapter,
)


@pytest.mark.asyncio
async def test_mock_gstn_lookup_active():
    adapter = MockGSTNAdapter(latency_ms=10)
    result = await adapter.lookup("27AAACT2727Q1ZW")

    assert result.status == "ACTIVE"
    assert result.source == "SIMULATED"
    assert result.fields["filing_status"] == "COMPLIANT"
    assert result.fields["last_return_type"] == "GSTR-3B"
    assert result.fields["last_return_period"] == "2026-08"
    assert result.fields["legal_name"] == "Tata Consultancy Services Limited"
    assert result.is_cached is False


@pytest.mark.asyncio
async def test_mock_gstn_lookup_overdue():
    adapter = MockGSTNAdapter()
    result = await adapter.lookup("07AABCB1234F1Z5")

    assert result.status == "ACTIVE"
    assert result.fields["filing_status"] == "OVERDUE"
    assert result.fields["last_return_period"] == "2025-11"


@pytest.mark.asyncio
async def test_mock_gstn_not_found():
    adapter = MockGSTNAdapter()
    result = await adapter.lookup("00XXXXX0000X0Z0")

    assert result.status == "NOT_FOUND"
    assert result.source == "SIMULATED"
    assert result.fields["found"] is False


@pytest.mark.asyncio
async def test_mock_gstn_timeout_and_error():
    timeout_adapter = MockGSTNAdapter(fail_mode="timeout")
    timeout_res = await timeout_adapter.lookup("27AAACT2727Q1ZW")
    assert timeout_res.status == "TIMEOUT"
    assert timeout_res.source == "SIMULATED"

    error_adapter = MockGSTNAdapter(fail_mode="error")
    error_res = await error_adapter.lookup("27AAACT2727Q1ZW")
    assert error_res.status == "ERROR"
    assert error_res.source == "SIMULATED"


@pytest.mark.asyncio
async def test_mock_gstn_stale_cache():
    stale_adapter = MockGSTNAdapter(fail_mode="stale")
    res = await stale_adapter.lookup("27AAACT2727Q1ZW")

    assert res.status == "ACTIVE"
    assert res.is_cached is True
    # Cached timestamp should be well in the past (> 30 days)
    age = datetime.now(timezone.utc) - res.fetched_at
    assert age > timedelta(days=30)


@pytest.mark.asyncio
async def test_mock_udyam_lookup_active():
    adapter = MockUdyamAdapter()
    result = await adapter.lookup("UDYAM-MH-12-0012345")

    assert result.status == "ACTIVE"
    assert result.source == "SIMULATED"
    assert result.fields["enterprise_category"] == "MICRO"
    assert result.fields["major_activity"] == "MANUFACTURING"
    assert result.fields["enterprise_name"] == "Apex Engineering Works"


@pytest.mark.asyncio
async def test_mock_udyam_cancelled():
    adapter = MockUdyamAdapter()
    result = await adapter.lookup("UDYAM-UP-20-0011223")

    assert result.status == "INACTIVE"
    assert result.source == "SIMULATED"


@pytest.mark.asyncio
async def test_mock_udyam_not_found():
    adapter = MockUdyamAdapter()
    result = await adapter.lookup("UDYAM-XX-00-9999999")

    assert result.status == "NOT_FOUND"
    assert result.source == "SIMULATED"


@pytest.mark.asyncio
async def test_mock_epfo_lookup():
    adapter = MockEPFOAdapter()
    result = await adapter.lookup("MH/BAN/0012345/000")

    assert result.status == "ACTIVE"
    assert result.source == "SIMULATED"
    assert result.fields["establishment_name"] == "Apex Engineering Works"
    assert result.fields["members_contributed"] == 42


@pytest.mark.asyncio
async def test_mock_esic_lookup():
    adapter = MockESICAdapter()
    result = await adapter.lookup("31001234560000101")

    assert result.status == "ACTIVE"
    assert result.source == "SIMULATED"
    assert result.fields["compliance_status"] == "COMPLIANT"


@pytest.mark.asyncio
async def test_mock_esic_defaulter():
    adapter = MockESICAdapter()
    result = await adapter.lookup("53005432100000303")

    assert result.status == "INACTIVE"
    assert result.fields["compliance_status"] == "DEFAULTER"


@pytest.mark.asyncio
async def test_mock_debarment_debarred():
    adapter = MockDebarmentAdapter()
    result = await adapter.lookup("AABCK9999K")

    assert result.status == "SUSPENDED"
    assert result.source == "SIMULATED"
    assert result.fields["is_debarred"] is True
    assert result.fields["debarment_status"] == "DEBARRED"
    assert len(result.fields["records"]) > 0
    record = result.fields["records"][0]
    assert record["scope"] == "org_wide"
    assert record["authority"] == "Ministry of Commerce and Industry"


@pytest.mark.asyncio
async def test_mock_debarment_cleared():
    adapter = MockDebarmentAdapter()
    result = await adapter.lookup("AAACT2727Q")

    assert result.status == "ACTIVE"
    assert result.source == "SIMULATED"
    assert result.fields["is_debarred"] is False
    assert result.fields["debarment_status"] == "CLEARED"

"""Unit tests for PortalAdapter contract and latency/failure injection."""

import asyncio
from datetime import datetime, timezone
import pytest

from gem_api.adapters import PortalAdapter, PortalResult


class DummyAdapter(PortalAdapter):
    """Concrete implementation of PortalAdapter for testing contract."""

    async def lookup(self, id_value: str) -> PortalResult:
        start_time = asyncio.get_event_loop().time()
        try:
            await self._simulate_network()
            elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            return PortalResult(
                status="ACTIVE",
                fields={"id": id_value, "verified": True},
                raw_payload={"mock": True, "id": id_value},
                latency_ms=elapsed_ms,
                source=self.source,
                is_cached=self.fail_mode == "stale"
            )
        except TimeoutError:
            elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            return PortalResult(
                status="TIMEOUT",
                latency_ms=elapsed_ms,
                source=self.source,
                error_message="Portal connection timed out"
            )
        except ConnectionError:
            elapsed_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            return PortalResult(
                status="ERROR",
                latency_ms=elapsed_ms,
                source=self.source,
                error_message="Simulated server error 500"
            )


@pytest.mark.asyncio
async def test_portal_result_defaults():
    res = PortalResult(status="ACTIVE", fields={"status": "OK"})
    assert res.status == "ACTIVE"
    assert res.source == "SIMULATED"
    assert res.is_cached is False
    assert isinstance(res.fetched_at, datetime)


@pytest.mark.asyncio
async def test_successful_lookup():
    adapter = DummyAdapter(latency_ms=20)
    result = await adapter.lookup("TEST12345")

    assert result.status == "ACTIVE"
    assert result.source == "SIMULATED"
    assert result.fields["id"] == "TEST12345"
    assert result.latency_ms >= 15


@pytest.mark.asyncio
async def test_timeout_injection():
    adapter = DummyAdapter(latency_ms=10, fail_mode="timeout")
    result = await adapter.lookup("TIMEOUT_ID")

    assert result.status == "TIMEOUT"
    assert "timed out" in result.error_message


@pytest.mark.asyncio
async def test_error_injection():
    adapter = DummyAdapter(latency_ms=10, fail_mode="error")
    result = await adapter.lookup("ERROR_ID")

    assert result.status == "ERROR"
    assert "500" in result.error_message


@pytest.mark.asyncio
async def test_stale_cached_response():
    adapter = DummyAdapter(fail_mode="stale")
    result = await adapter.lookup("CACHED_ID")

    assert result.status == "ACTIVE"
    assert result.is_cached is True

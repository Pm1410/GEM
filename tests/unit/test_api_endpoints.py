"""Unit tests for FastAPI REST API endpoints, RBAC, and officer actions (Phase 4 - Plan 01)."""

import pytest
from httpx import AsyncClient, ASGITransport

from gem_api.main import app
from gem_api.api.routes import AUDIT_LOG


@pytest.fixture(autouse=True)
def clear_audit_log():
    AUDIT_LOG.clear()


@pytest.mark.asyncio
async def test_list_tenders():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/tenders")
        assert res.status_code == 200
        data = res.json()
        assert "tenders" in data
        assert len(data["tenders"]) >= 1


@pytest.mark.asyncio
async def test_tender_bidders_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/tenders/TNDR-GOODS-001/bidders")
        assert res.status_code == 200
        data = res.json()
        assert "bidders" in data
        bidders = data["bidders"]
        assert len(bidders) >= 3

        # TCS bidder should have 100% score and LOW risk
        tcs = next((b for b in bidders if b["bidder_id"] == "BIDDER-TCS-01"), None)
        assert tcs is not None
        assert tcs["compliance_score"] == 100.0
        assert tcs["risk_level"] == "LOW"

        # Kalyani bidder should have CRITICAL risk due to debarment
        kalyani = next((b for b in bidders if b["bidder_id"] == "BIDDER-KALYANI-03"), None)
        assert kalyani is not None
        assert kalyani["risk_level"] == "CRITICAL"


@pytest.mark.asyncio
async def test_bidder_evaluation_detail():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/bidders/BIDDER-TCS-01/evaluation")
        assert res.status_code == 200
        data = res.json()
        assert data["overall_state"] == "PASS"
        assert "advisory" in data
        assert "evidence_doc" in data
        assert "requirements" in data


@pytest.mark.asyncio
async def test_officer_action_with_valid_justification():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "action": "APPROVE",
            "justification": "Bidder fully complied with all statutory criteria and technical thresholds.",
        }
        headers = {"X-User-Role": "officer", "X-User-Id": "officer-gem-01"}
        res = await ac.post("/api/bidders/BIDDER-TCS-01/action", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        assert data["chain_length"] == 1
        assert "record_hash" in data


@pytest.mark.asyncio
async def test_officer_action_missing_or_short_justification():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Less than 10 characters justification must be rejected (OFCR-04)
        payload = {"action": "APPROVE", "justification": "Short"}
        headers = {"X-User-Role": "officer"}
        res = await ac.post("/api/bidders/BIDDER-TCS-01/action", json=payload, headers=headers)
        assert res.status_code == 422
        assert "at least 10 characters" in res.json()["detail"]


@pytest.mark.asyncio
async def test_auditor_role_cannot_submit_action():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Auditor is read-only (OFCR-05)
        payload = {
            "action": "REJECT",
            "justification": "Debarred entity identified in statutory records.",
        }
        headers = {"X-User-Role": "auditor"}
        res = await ac.post("/api/bidders/BIDDER-KALYANI-03/action", json=payload, headers=headers)
        assert res.status_code == 403
        assert "read-only" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_audit_verify_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Append 2 actions
        headers = {"X-User-Role": "officer"}
        await ac.post(
            "/api/bidders/BIDDER-TCS-01/action",
            json={"action": "APPROVE", "justification": "Compliant bidder verified."},
            headers=headers,
        )
        await ac.post(
            "/api/bidders/BIDDER-KALYANI-03/action",
            json={"action": "REJECT", "justification": "Debarred entity rejected per GeM rules."},
            headers=headers,
        )

        res = await ac.get("/api/audit/verify")
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] is True
        assert data["total_records"] == 2

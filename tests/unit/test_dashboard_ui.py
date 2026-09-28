"""Unit tests for officer frontend dashboard assets and static serving (Phase 4 - Plan 02)."""

import pytest
from httpx import AsyncClient, ASGITransport

from gem_api.main import app


@pytest.mark.asyncio
async def test_serve_dashboard_index_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        assert "text/html" in res.headers.get("content-type", "")
        html = res.text

        # Verify critical interactive elements are rendered in DOM (DASH-01, DASH-02, DASH-03)
        assert 'id="tender-select"' in html
        assert 'id="role-select"' in html
        assert 'id="bidders-table"' in html
        assert 'id="requirements-table"' in html
        assert 'id="evidence-viewer"' in html
        assert 'id="advisory-container"' in html
        assert 'id="justification-input"' in html
        assert 'id="action-submit"' in html
        assert 'id="audit-verify-btn"' in html
        assert 'SIMULATED PORTALS' in html


@pytest.mark.asyncio
async def test_serve_stylesheet():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/static/style.css")
        assert res.status_code == 200
        css = res.text
        assert "--state-pass" in css
        assert "--state-fail" in css
        assert "--state-review" in css
        assert "--state-unverifiable" in css
        assert ".highlight-box" in css


@pytest.mark.asyncio
async def test_serve_app_javascript():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/static/app.js")
        assert res.status_code == 200
        js = res.text
        assert "loadBidders" in js
        assert "selectBidder" in js
        assert "updateRBACState" in js
        assert "loadAuditChain" in js
        assert "/api/audit/verify" in js

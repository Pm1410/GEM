"""Unit tests for pure Python deterministic rule evaluation engine."""

from datetime import date
from pathlib import Path
import pytest

from gem_api.rules import (
    load_tender_rules,
    evaluate_tender,
    evaluate_requirement,
    evaluate_check,
    is_requirement_applicable,
    VerificationContext,
    CheckConfig,
    RequirementConfig,
    ActionOverrides,
    get_check_handler,
    list_registered_checks,
)


def test_registered_checks_presence():
    checks = list_registered_checks()
    assert "format_gstin" in checks
    assert "format_pan" in checks
    assert "format_udyam" in checks
    assert "cross_check_gstin_pan" in checks
    assert "certificate_validity" in checks
    assert "make_in_india_threshold" in checks
    assert "debarment_check" in checks


def test_conditional_applicability():
    req = RequirementConfig(
        id="REQ-TEST",
        description="Services check",
        applies_if={"tender_category": "services"}
    )

    ctx_services = VerificationContext(tender={"tender_category": "services"})
    ctx_goods = VerificationContext(tender={"tender_category": "goods"})

    assert is_requirement_applicable(req, ctx_services) is True
    assert is_requirement_applicable(req, ctx_goods) is False


def test_tender_evaluation_compliant_bidder(sample_valid_gstin, sample_valid_pan):
    config = load_tender_rules(Path("config/tenders/sample_goods.yaml"))

    context = VerificationContext(
        tender={
            "tender_id": "TND-2026-GOODS-001",
            "tender_category": "goods",
            "bid_opening_date": "2026-03-15",
            "local_content_threshold": 50.0
        },
        bidder={
            "id": "BIDDER-001",
            "gstin": sample_valid_gstin,
            "pan": sample_valid_pan,
        },
        evidence={
            "gstin": sample_valid_gstin,
            "pan": sample_valid_pan,
            "local_content_percentage": 65.0,
            "debarment_records": []
        }
    )

    report = evaluate_tender(config, context)
    assert report.overall_state == "PASS"
    assert len(report.requirements) == 4
    assert all(r.state == "PASS" for r in report.requirements)


def test_make_in_india_threshold_deficiency(sample_valid_gstin, sample_valid_pan):
    config = load_tender_rules(Path("config/tenders/sample_goods.yaml"))

    context = VerificationContext(
        tender={"local_content_threshold": 50.0},
        bidder={"id": "BIDDER-DEFICIENT", "gstin": sample_valid_gstin, "pan": sample_valid_pan},
        evidence={
            "gstin": sample_valid_gstin,
            "pan": sample_valid_pan,
            # 42% is below the required 50%
            "local_content_percentage": 42.0,
            "debarment_records": []
        }
    )

    report = evaluate_tender(config, context)
    assert report.overall_state == "FAIL"

    mii_req = next(r for r in report.requirements if r.requirement_id == "REQ-03")
    assert mii_req.state == "FAIL"
    assert "below required tender threshold" in mii_req.check_results[0].message


def test_missing_evidence_results_in_review(sample_valid_gstin, sample_valid_pan):
    """Never False PASS: Missing evidence must transition to REVIEW, never PASS."""
    config = load_tender_rules(Path("config/tenders/sample_goods.yaml"))

    context = VerificationContext(
        tender={"local_content_threshold": 50.0},
        bidder={"id": "BIDDER-INCOMPLETE", "gstin": sample_valid_gstin, "pan": sample_valid_pan},
        evidence={
            "gstin": sample_valid_gstin,
            "pan": sample_valid_pan,
            # Missing local_content_percentage!
        }
    )

    report = evaluate_tender(config, context)
    assert report.overall_state == "REVIEW"

    mii_req = next(r for r in report.requirements if r.requirement_id == "REQ-03")
    assert mii_req.state == "REVIEW"
    assert "declaration is missing" in mii_req.check_results[0].message


def test_debarment_scope_evaluation():
    config = load_tender_rules(Path("config/tenders/sample_goods.yaml"))

    # Active org-wide debarment spanning bid opening date
    active_debarment = {
        "is_active": True,
        "scope": "org_wide",
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "reason": "Corrupt procurement practices",
        "authority": "Ministry of Power"
    }

    ctx_debarred = VerificationContext(
        tender={"bid_opening_date": "2026-03-15"},
        bidder={"id": "BIDDER-BAD"},
        evidence={"debarment_records": [active_debarment]}
    )

    req = config.requirements[3]  # REQ-04 debarment
    eval_res = evaluate_requirement(req, ctx_debarred)
    assert eval_res.state == "FAIL"
    assert "actively debarred" in eval_res.check_results[0].message

    # Expired debarment -> should PASS
    expired_debarment = {
        "is_active": True,
        "scope": "org_wide",
        "start_date": "2024-01-01",
        "end_date": "2025-01-01",
        "reason": "Old offense"
    }
    ctx_cleared = VerificationContext(
        tender={"bid_opening_date": "2026-03-15"},
        bidder={"id": "BIDDER-CLEARED"},
        evidence={"debarment_records": [expired_debarment]}
    )
    eval_res_cleared = evaluate_requirement(req, ctx_cleared)
    assert eval_res_cleared.state == "PASS"


def test_action_overrides():
    check_cfg = CheckConfig(
        id="CHK-TEST",
        type="format_pan",
        overrides=ActionOverrides(on_missing="UNVERIFIABLE")
    )

    ctx_empty = VerificationContext()
    result = evaluate_check(check_cfg, ctx_empty)
    # Default is REVIEW on missing, but override remapped it to UNVERIFIABLE
    assert result.state == "UNVERIFIABLE"

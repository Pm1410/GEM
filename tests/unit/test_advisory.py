"""Unit tests for deterministic advisory generation (Phase 4 - Plan 01)."""

import pytest

from gem_api.advisory import generate_advisory, LEGAL_ADVISORY_DISCLAIMER
from gem_api.rules.models import (
    CheckResult,
    RequirementEvaluation,
    TenderEvaluationReport,
)
from gem_api.scoring.engine import ComplianceScore
from gem_api.scoring.risk import RiskProfile


def _make_report(overall_state: str, requirements: list[RequirementEvaluation]) -> TenderEvaluationReport:
    return TenderEvaluationReport(
        tender_id="GEM-2026-B-1001",
        tender_version="1.0.0",
        rule_set_version="v2026.01",
        bidder_id="BIDDER-TCS-01",
        overall_state=overall_state,
        requirements=requirements,
    )


def test_advisory_compliant_bidder():
    reqs = [
        RequirementEvaluation(
            requirement_id="REQ-GSTIN",
            state="PASS",
            check_results=[CheckResult(check_id="CHK-GSTIN-01", state="PASS", message="Valid")],
        ),
        RequirementEvaluation(
            requirement_id="REQ-PAN",
            state="PASS",
            check_results=[CheckResult(check_id="CHK-PAN-01", state="PASS", message="Valid")],
        ),
    ]
    report = _make_report("PASS", reqs)
    score = ComplianceScore(score=100.0, verifiable_weight=2.0, total_weight=2.0, verifiable_coverage_pct=100.0, unverifiable_count=0)
    risk = RiskProfile(level="LOW", factors=["All checks satisfied"])

    adv = generate_advisory(report, score, risk)

    assert adv.recommended_action == "APPROVE"
    assert len(adv.statutory_findings) == 0
    assert len(adv.cited_requirement_ids) == 0
    assert LEGAL_ADVISORY_DISCLAIMER in adv.summary_text
    assert len(adv.advisory_hash) == 64


def test_advisory_debarred_bidder():
    reqs = [
        RequirementEvaluation(
            requirement_id="REQ-DEBARMENT",
            state="FAIL",
            check_results=[CheckResult(check_id="CHK-DEBARMENT-01", state="FAIL", message="Debarred by Ministry")],
        ),
    ]
    report = _make_report("FAIL", reqs)
    score = ComplianceScore(score=0.0, verifiable_weight=1.0, total_weight=1.0, verifiable_coverage_pct=100.0, unverifiable_count=0)
    risk = RiskProfile(level="CRITICAL", debarment_flag=True, factors=["Active debarment"])

    adv = generate_advisory(report, score, risk)

    assert adv.recommended_action == "REJECT"
    assert "REQ-DEBARMENT" in adv.cited_requirement_ids
    assert len(adv.statutory_findings) == 1
    assert "CRITICAL" in adv.summary_text


def test_advisory_unverifiable_clarification():
    reqs = [
        RequirementEvaluation(
            requirement_id="REQ-GSTIN-PORTAL",
            state="UNVERIFIABLE",
            check_results=[CheckResult(check_id="CHK-PORTAL-01", state="UNVERIFIABLE", message="GSTN timeout")],
        ),
    ]
    report = _make_report("UNVERIFIABLE", reqs)
    score = ComplianceScore(score=0.0, verifiable_weight=0.0, total_weight=1.0, verifiable_coverage_pct=0.0, unverifiable_count=1)
    risk = RiskProfile(level="MEDIUM", unverifiable_count=1, factors=["Portal timeout"])

    adv = generate_advisory(report, score, risk)

    assert adv.recommended_action == "REQUEST_CLARIFICATION"
    assert "REQ-GSTIN-PORTAL" in adv.cited_requirement_ids
    assert "REQUEST CLARIFICATION" in adv.summary_text


def test_advisory_determinism():
    reqs = [
        RequirementEvaluation(
            requirement_id="REQ-MII",
            state="FAIL",
            check_results=[CheckResult(check_id="CHK-MII-01", state="FAIL", message="Local content 30% < 50%")],
        ),
    ]
    report = _make_report("FAIL", reqs)
    score = ComplianceScore(score=0.0, verifiable_weight=1.0, total_weight=1.0, verifiable_coverage_pct=100.0, unverifiable_count=0)
    risk = RiskProfile(level="HIGH", mandatory_failure_count=1)

    adv1 = generate_advisory(report, score, risk)
    adv2 = generate_advisory(report, score, risk)

    assert adv1.summary_text == adv2.summary_text
    assert adv1.advisory_hash == adv2.advisory_hash
    assert "REQ-MII" in adv1.cited_requirement_ids

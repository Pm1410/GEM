"""Unit tests for compliance scoring and risk classification (Phase 3 - Plan 01)."""

import pytest

from gem_api.rules.models import RequirementEvaluation, CheckResult
from gem_api.scoring import (
    compute_compliance_score,
    evaluate_risk,
    FROZEN_FORMULA_VERSION,
    SCORING_DISCLAIMER,
)


def _make_req(req_id: str, state: str, is_applicable: bool = True, checks: list = None):
    return RequirementEvaluation(
        requirement_id=req_id,
        state=state,
        is_applicable=is_applicable,
        check_results=checks or [CheckResult(check_id=f"CHK-{req_id}", state=state, message="Test")],
    )


# --- Test Compliance Scoring (SCOR-01, SCOR-03, SCOR-04) ---

def test_score_all_pass():
    evals = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "PASS")]
    res = compute_compliance_score(evals)

    assert res.score == 100.0
    assert res.verifiable_weight == 2.0
    assert res.total_weight == 2.0
    assert res.verifiable_coverage_pct == 100.0
    assert res.unverifiable_count == 0
    assert res.formula_version == FROZEN_FORMULA_VERSION
    assert res.disclaimer == SCORING_DISCLAIMER


def test_score_with_fail_and_review():
    # 1 PASS (1.0), 1 REVIEW (0.5), 1 FAIL (0.0) -> (1.0 + 0.5 + 0.0) / 3.0 * 100 = 50.0%
    evals = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "REVIEW"), _make_req("REQ-3", "FAIL")]
    res = compute_compliance_score(evals)

    assert res.score == 50.0
    assert res.verifiable_weight == 3.0
    assert res.total_weight == 3.0
    assert res.verifiable_coverage_pct == 100.0


def test_score_custom_weights():
    # REQ-1 (weight 2.0, PASS), REQ-2 (weight 1.0, FAIL) -> 2.0 / 3.0 * 100 = 66.67%
    evals = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "FAIL")]
    res = compute_compliance_score(evals, weights={"REQ-1": 2.0, "REQ-2": 1.0})

    assert res.score == 66.67
    assert res.verifiable_weight == 3.0


def test_score_unverifiable_denominator_exclusion():
    """SCOR-03: UNVERIFIABLE items must NOT penalize score denominator."""
    # 2 PASS (weight 1.0 each) + 1 UNVERIFIABLE (weight 1.0)
    # Score should be 100.0% over 2.0 verifiable weight, with coverage 66.67%
    evals = [
        _make_req("REQ-1", "PASS"),
        _make_req("REQ-2", "PASS"),
        _make_req("REQ-3", "UNVERIFIABLE"),
    ]
    res = compute_compliance_score(evals)

    assert res.score == 100.0
    assert res.verifiable_weight == 2.0
    assert res.total_weight == 3.0
    assert res.verifiable_coverage_pct == 66.67
    assert res.unverifiable_count == 1


def test_score_all_unverifiable_and_empty():
    evals = [_make_req("REQ-1", "UNVERIFIABLE"), _make_req("REQ-2", "UNVERIFIABLE")]
    res = compute_compliance_score(evals)

    assert res.score == 0.0
    assert res.verifiable_weight == 0.0
    assert res.total_weight == 2.0
    assert res.verifiable_coverage_pct == 0.0
    assert res.unverifiable_count == 2

    # Empty list
    res_empty = compute_compliance_score([])
    assert res_empty.score == 0.0
    assert res_empty.verifiable_coverage_pct == 0.0


def test_score_inapplicable_ignored():
    evals = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "FAIL", is_applicable=False)]
    res = compute_compliance_score(evals)

    assert res.score == 100.0
    assert res.total_weight == 1.0


# --- Test Independent Risk Level Engine (SCOR-02) ---

def test_risk_all_pass_is_low():
    evals = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "PASS")]
    risk = evaluate_risk(evals)

    assert risk.level == "LOW"
    assert risk.debarment_flag is False
    assert risk.mandatory_failure_count == 0


def test_risk_debarment_is_critical():
    # Debarment overrides everything, even 100% compliant requirements
    evals = [
        _make_req(
            "REQ-DEBARMENT",
            "FAIL",
            checks=[CheckResult(check_id="CHK-DEBARMENT", state="FAIL", message="Debarred by Ministry")],
        ),
        _make_req("REQ-GSTIN", "PASS"),
    ]
    risk = evaluate_risk(evals)

    assert risk.level == "CRITICAL"
    assert risk.debarment_flag is True
    assert any("CRITICAL" in f for f in risk.factors)


def test_risk_external_debarment_payload_is_critical():
    evals = [_make_req("REQ-1", "PASS")]
    risk = evaluate_risk(evals, debarment_record={"is_debarred": True, "reason": "Forgery"})

    assert risk.level == "CRITICAL"
    assert risk.debarment_flag is True


def test_risk_mandatory_failure_is_high():
    evals = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "FAIL")]
    risk = evaluate_risk(evals)

    assert risk.level == "HIGH"
    assert risk.mandatory_failure_count == 1
    assert risk.debarment_flag is False


def test_risk_review_or_unverifiable_is_medium():
    evals_review = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "REVIEW")]
    risk_rev = evaluate_risk(evals_review)
    assert risk_rev.level == "MEDIUM"
    assert risk_rev.review_count == 1

    evals_unv = [_make_req("REQ-1", "PASS"), _make_req("REQ-2", "UNVERIFIABLE")]
    risk_unv = evaluate_risk(evals_unv)
    assert risk_unv.level == "MEDIUM"
    assert risk_unv.unverifiable_count == 1

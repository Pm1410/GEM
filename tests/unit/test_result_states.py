"""Unit tests for four result states, portal outage mapping, and missing-info detection (Phase 2 - Plan 03)."""

import pytest
import itertools

from gem_api.rules import (
    CheckResult,
    RequirementEvaluation,
    VerificationContext,
    detect_missing_fields,
    aggregate_states,
    aggregate_evaluation_report,
    evaluate_check,
    CheckConfig,
)


# --- Test Missing-Info Detection (EXTR-05) ---

def test_missing_fields_all_present():
    report = detect_missing_fields(
        required_fields=["gstin", "pan"],
        extracted_fields={"gstin": "27AAACT2727Q1ZW", "pan": "AAACT2727Q"},
        grounded_map={"gstin": True, "pan": True},
    )
    assert report.is_complete is True
    assert len(report.missing_fields) == 0
    assert len(report.ungrounded_fields) == 0
    assert len(report.deficiencies) == 0


def test_missing_fields_missing_item():
    report = detect_missing_fields(
        required_fields=["gstin", "pan", "udyam"],
        extracted_fields={"gstin": "27AAACT2727Q1ZW"},
    )
    assert report.is_complete is False
    assert "pan" in report.missing_fields
    assert "udyam" in report.missing_fields
    assert len(report.deficiencies) == 2
    assert report.deficiencies[0].issue_type == "MISSING"


def test_missing_fields_ungrounded_item():
    report = detect_missing_fields(
        required_fields=["gstin"],
        extracted_fields={"gstin": "29ABCDE1234F1Z5"},
        grounded_map={"gstin": False},
    )
    assert report.is_complete is False
    assert len(report.missing_fields) == 0
    assert "gstin" in report.ungrounded_fields
    assert report.deficiencies[0].issue_type == "UNGROUNDED"


# --- Test Portal Outage Mapping to UNVERIFIABLE (PORT-09, RSLT-04) ---

def test_portal_gstn_timeout_is_unverifiable():
    context = VerificationContext(
        portal_results={
            "gstin": {
                "status": "TIMEOUT",
                "error_message": "Connection timed out",
                "is_cached": False,
            }
        }
    )
    chk_cfg = CheckConfig(id="CHK-PORTAL-GSTN", type="portal_gstn_check")
    res = evaluate_check(chk_cfg, context)

    assert res.state == "UNVERIFIABLE"
    assert "unreachable" in res.message.lower()


def test_portal_gstn_compliant_pass_and_overdue_fail():
    context_pass = VerificationContext(
        portal_results={
            "gstin": {
                "status": "ACTIVE",
                "fields": {
                    "status": "ACTIVE",
                    "filing_status": "COMPLIANT",
                    "last_return_type": "GSTR-3B",
                },
            }
        }
    )
    chk_cfg = CheckConfig(id="CHK-PORTAL-GSTN", type="portal_gstn_check")
    res_pass = evaluate_check(chk_cfg, context_pass)
    assert res_pass.state == "PASS"

    context_fail = VerificationContext(
        portal_results={
            "gstin": {
                "status": "ACTIVE",
                "fields": {
                    "status": "ACTIVE",
                    "filing_status": "OVERDUE",
                    "last_return_type": "GSTR-3B",
                },
            }
        }
    )
    res_fail = evaluate_check(chk_cfg, context_fail)
    assert res_fail.state == "FAIL"
    assert "OVERDUE" in res_fail.message


def test_portal_udyam_timeout_is_unverifiable():
    context = VerificationContext(
        portal_results={"udyam": {"status": "TIMEOUT", "error_message": "Timeout"}}
    )
    chk_cfg = CheckConfig(id="CHK-PORTAL-UDYAM", type="portal_udyam_check")
    res = evaluate_check(chk_cfg, context)
    assert res.state == "UNVERIFIABLE"


def test_debarment_portal_timeout_is_unverifiable():
    context = VerificationContext(
        portal_results={"debarment": {"status": "TIMEOUT"}}
    )
    chk_cfg = CheckConfig(id="CHK-DEBARMENT", type="debarment_check")
    res = evaluate_check(chk_cfg, context)
    assert res.state == "UNVERIFIABLE"


# --- Test Four-State Priority Hierarchy & Zero False-PASS (RSLT-01..04) ---

def test_state_priority_hierarchy():
    # FAIL overrides all
    assert aggregate_states(["PASS", "UNVERIFIABLE", "REVIEW", "FAIL"]) == "FAIL"
    assert aggregate_states(["FAIL", "PASS"]) == "FAIL"

    # REVIEW overrides UNVERIFIABLE and PASS
    assert aggregate_states(["PASS", "UNVERIFIABLE", "REVIEW"]) == "REVIEW"
    assert aggregate_states(["REVIEW", "PASS"]) == "REVIEW"

    # UNVERIFIABLE overrides PASS
    assert aggregate_states(["PASS", "UNVERIFIABLE"]) == "UNVERIFIABLE"

    # All PASS yields PASS
    assert aggregate_states(["PASS", "PASS", "PASS"]) == "PASS"
    assert aggregate_states([]) == "PASS"


def test_zero_false_pass_property():
    """Mathematical guarantee: No combination containing a non-PASS state can ever return PASS."""
    possible_states = ["PASS", "FAIL", "REVIEW", "UNVERIFIABLE"]

    for r in range(1, 4):
        for combo in itertools.product(possible_states, repeat=r):
            states_list = list(combo)
            aggregated = aggregate_states(states_list)

            has_fail = "FAIL" in states_list
            has_review = "REVIEW" in states_list
            has_unverifiable = "UNVERIFIABLE" in states_list

            if has_fail:
                assert aggregated == "FAIL", f"Expected FAIL for {states_list}, got {aggregated}"
            elif has_review:
                assert aggregated == "REVIEW", f"Expected REVIEW for {states_list}, got {aggregated}"
            elif has_unverifiable:
                assert aggregated == "UNVERIFIABLE", f"Expected UNVERIFIABLE for {states_list}, got {aggregated}"
            else:
                assert aggregated == "PASS", f"Expected PASS for {states_list}, got {aggregated}"


def test_aggregate_evaluation_report_counts_and_findings():
    evals = [
        RequirementEvaluation(
            requirement_id="REQ-GSTIN",
            state="PASS",
            is_applicable=True,
            check_results=[
                CheckResult(check_id="CHK-GSTIN-FMT", state="PASS", message="Valid format"),
                CheckResult(check_id="CHK-PORTAL-GSTN", state="PASS", message="Compliant"),
            ],
        ),
        RequirementEvaluation(
            requirement_id="REQ-PAN",
            state="FAIL",
            is_applicable=True,
            check_results=[
                CheckResult(check_id="CHK-PAN-FMT", state="FAIL", message="Invalid entity character"),
            ],
        ),
        RequirementEvaluation(
            requirement_id="REQ-EPFO",
            state="UNVERIFIABLE",
            is_applicable=True,
            check_results=[
                CheckResult(check_id="CHK-PORTAL-EPFO", state="UNVERIFIABLE", message="Portal timeout"),
            ],
        ),
        RequirementEvaluation(
            requirement_id="REQ-OPTIONAL",
            state="FAIL",
            is_applicable=False,  # Not applicable, should not influence overall
            check_results=[],
        ),
    ]

    report = aggregate_evaluation_report(evals)

    assert report.total_evaluated == 3
    assert report.pass_count == 1
    assert report.fail_count == 1
    assert report.unverifiable_count == 1
    assert report.overall_state == "FAIL"
    assert report.is_compliant is False
    assert len(report.findings) == 2  # FAIL from REQ-PAN and UNVERIFIABLE from REQ-EPFO

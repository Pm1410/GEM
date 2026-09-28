"""Four-state priority aggregation and zero false-PASS evaluation engine (RSLT-01..04)."""

from dataclasses import dataclass, field
from typing import Any, Literal
from gem_api.rules.models import (
    CheckResult,
    RequirementEvaluation,
    ResultState,
)

# Priority hierarchy: FAIL > REVIEW > UNVERIFIABLE > PASS
STATE_PRIORITY: dict[ResultState, int] = {
    "FAIL": 4,
    "REVIEW": 3,
    "UNVERIFIABLE": 2,
    "PASS": 1,
}


@dataclass
class AggregatedEvaluation:
    """Consolidated bidder compliance evaluation across all tender requirements."""
    overall_state: ResultState
    pass_count: int = 0
    fail_count: int = 0
    review_count: int = 0
    unverifiable_count: int = 0
    total_evaluated: int = 0
    findings: list[dict[str, Any]] = field(default_factory=list)

    @property
    def is_compliant(self) -> bool:
        """True if and only if overall state is PASS (Zero False-PASS guarantee)."""
        return self.overall_state == "PASS"


def aggregate_states(states: list[ResultState]) -> ResultState:
    """Reduces a list of result states according to the strict priority hierarchy.

    Hierarchy: FAIL > REVIEW > UNVERIFIABLE > PASS.
    Guarantees: An empty list returns PASS; any FAIL forces FAIL; any REVIEW forces REVIEW
    (unless FAIL is present); any UNVERIFIABLE forces UNVERIFIABLE (unless FAIL/REVIEW present).
    """
    if not states:
        return "PASS"

    if "FAIL" in states:
        return "FAIL"
    elif "REVIEW" in states:
        return "REVIEW"
    elif "UNVERIFIABLE" in states:
        return "UNVERIFIABLE"
    return "PASS"


def aggregate_evaluation_report(
    evaluations: list[RequirementEvaluation],
    only_mandatory: bool = True,
) -> AggregatedEvaluation:
    """Aggregates all requirement evaluations into an overall compliance decision.

    Enforces:
    - RSLT-01: PASS if all checks are satisfied and evidence is attached.
    - RSLT-02: FAIL if any check fails (deterministic violation).
    - RSLT-03: REVIEW if any required field is missing or ambiguous.
    - RSLT-04: UNVERIFIABLE if portal timed out; never marked as FAIL or PASS.
    """
    pass_cnt = 0
    fail_cnt = 0
    rev_cnt = 0
    unv_cnt = 0
    total_cnt = 0
    findings: list[dict[str, Any]] = []
    applicable_states: list[ResultState] = []

    for req_eval in evaluations:
        if not req_eval.is_applicable:
            continue

        total_cnt += 1
        st = req_eval.state
        if st == "PASS":
            pass_cnt += 1
        elif st == "FAIL":
            fail_cnt += 1
        elif st == "REVIEW":
            rev_cnt += 1
        elif st == "UNVERIFIABLE":
            unv_cnt += 1

        applicable_states.append(st)

        # Collect detailed findings for non-PASS checks
        for chk in req_eval.check_results:
            if chk.state != "PASS":
                findings.append({
                    "requirement_id": req_eval.requirement_id,
                    "check_id": chk.check_id,
                    "state": chk.state,
                    "message": chk.message,
                    "details": chk.details,
                })

    overall = aggregate_states(applicable_states)

    return AggregatedEvaluation(
        overall_state=overall,
        pass_count=pass_cnt,
        fail_count=fail_cnt,
        review_count=rev_cnt,
        unverifiable_count=unv_cnt,
        total_evaluated=total_cnt,
        findings=findings,
    )

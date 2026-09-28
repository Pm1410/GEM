"""Pure Python deterministic rule evaluation engine (RULE-06)."""

from typing import Any
from gem_api.rules.models import (
    CheckConfig,
    CheckResult,
    RequirementConfig,
    RequirementEvaluation,
    ResultState,
    TenderEvaluationReport,
    TenderRuleConfig,
    VerificationContext,
)
from gem_api.rules.registry import get_check_handler


def is_requirement_applicable(req: RequirementConfig, context: VerificationContext) -> bool:
    """Evaluates conditional applicability (RULE-03) using simple key-value dictionary matching."""
    if not req.applies_if:
        return True

    for key, expected_value in req.applies_if.items():
        # Check tender metadata first, then bidder metadata
        actual_value = context.tender.get(key)
        if actual_value is None:
            actual_value = context.bidder.get(key)

        if actual_value != expected_value:
            return False

    return True


def evaluate_check(check: CheckConfig, context: VerificationContext) -> CheckResult:
    """Executes a single check handler and applies optional outcome state overrides."""
    handler = get_check_handler(check.type)
    params = dict(check.params)
    params["id"] = check.id

    result = handler(context, params)

    if check.overrides:
        if result.state == "FAIL" and check.overrides.on_fail:
            result = result.model_copy(update={"state": check.overrides.on_fail})
        elif result.state == "REVIEW" and check.overrides.on_missing:
            result = result.model_copy(update={"state": check.overrides.on_missing})
        elif result.state == "UNVERIFIABLE" and check.overrides.on_portal_down:
            result = result.model_copy(update={"state": check.overrides.on_portal_down})

    return result


def evaluate_requirement(req: RequirementConfig, context: VerificationContext) -> RequirementEvaluation:
    """Evaluates all checks for a single requirement and derives its combined result state."""
    if not is_requirement_applicable(req, context):
        return RequirementEvaluation(
            requirement_id=req.id,
            state="PASS",
            is_applicable=False,
            check_results=[]
        )

    check_results: list[CheckResult] = []
    for check_cfg in req.checks:
        res = evaluate_check(check_cfg, context)
        check_results.append(res)

    # Derive combined state: FAIL > REVIEW > UNVERIFIABLE > PASS
    # Strict determinism: Never False PASS
    states = [r.state for r in check_results]
    if "FAIL" in states:
        combined_state: ResultState = "FAIL"
    elif "REVIEW" in states:
        combined_state = "REVIEW"
    elif "UNVERIFIABLE" in states:
        combined_state = "UNVERIFIABLE"
    else:
        combined_state = "PASS"

    return RequirementEvaluation(
        requirement_id=req.id,
        state=combined_state,
        is_applicable=True,
        check_results=check_results
    )


def evaluate_tender(config: TenderRuleConfig, context: VerificationContext) -> TenderEvaluationReport:
    """Evaluates all requirements in a tender rule configuration against the verification context."""
    req_evaluations: list[RequirementEvaluation] = []

    # Inject tender config parameters into context if not present
    if not context.tender.get("tender_id"):
        context.tender["tender_id"] = config.tender_id
    if not context.tender.get("tender_category"):
        context.tender["tender_category"] = config.tender_category
    if not context.tender.get("bid_opening_date") and config.bid_opening_date:
        context.tender["bid_opening_date"] = config.bid_opening_date.isoformat()
    if not context.tender.get("local_content_threshold") and config.local_content_threshold is not None:
        context.tender["local_content_threshold"] = config.local_content_threshold

    mandatory_states: list[ResultState] = []

    for req in config.requirements:
        eval_res = evaluate_requirement(req, context)
        req_evaluations.append(eval_res)
        if req.mandatory and eval_res.is_applicable:
            mandatory_states.append(eval_res.state)

    if "FAIL" in mandatory_states:
        overall_state: ResultState = "FAIL"
    elif "REVIEW" in mandatory_states:
        overall_state = "REVIEW"
    elif "UNVERIFIABLE" in mandatory_states:
        overall_state = "UNVERIFIABLE"
    else:
        overall_state = "PASS"

    bidder_id = str(context.bidder.get("id") or context.bidder.get("bidder_id") or "UNKNOWN")

    return TenderEvaluationReport(
        tender_id=config.tender_id,
        tender_version=config.version,
        rule_set_version=config.rule_set_version,
        bidder_id=bidder_id,
        overall_state=overall_state,
        requirements=req_evaluations
    )

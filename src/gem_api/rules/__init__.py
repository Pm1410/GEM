"""Rule engine package."""

from gem_api.rules.models import (
    ResultState,
    ActionOverrides,
    CheckConfig,
    RequirementConfig,
    TenderRuleConfig,
    VerificationContext,
    CheckResult,
    RequirementEvaluation,
    TenderEvaluationReport,
)
from gem_api.rules.registry import (
    register_check,
    get_check_handler,
    list_registered_checks,
)
from gem_api.rules.loader import load_tender_rules
from gem_api.rules.engine import (
    is_requirement_applicable,
    evaluate_check,
    evaluate_requirement,
    evaluate_tender,
)

# Ensure built-in checks are registered on import
import gem_api.rules.builtins  # noqa: F401

__all__ = [
    "ResultState",
    "ActionOverrides",
    "CheckConfig",
    "RequirementConfig",
    "TenderRuleConfig",
    "VerificationContext",
    "CheckResult",
    "RequirementEvaluation",
    "TenderEvaluationReport",
    "register_check",
    "get_check_handler",
    "list_registered_checks",
    "load_tender_rules",
    "is_requirement_applicable",
    "evaluate_check",
    "evaluate_requirement",
    "evaluate_tender",
]

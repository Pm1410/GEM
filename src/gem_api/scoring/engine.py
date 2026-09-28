"""Deterministic compliance scoring engine with frozen weighted formula (SCOR-01, SCOR-03, SCOR-04)."""

from dataclasses import dataclass
from typing import Optional

from gem_api.rules.models import RequirementEvaluation

DEFAULT_CHECK_WEIGHT = 1.0
STATE_MULTIPLIERS = {
    "PASS": 1.0,
    "REVIEW": 0.5,
    "FAIL": 0.0,
}
FROZEN_FORMULA_VERSION = "v1.0-frozen"
SCORING_DISCLAIMER = (
    "Verification summary for procurement officer review only. "
    "Cannot be used to rank bidders or substitute price evaluation (SCOR-04)."
)


@dataclass
class ComplianceScore:
    """Calculated compliance score and verifiable coverage metrics."""
    score: float  # 0.0 to 100.0
    verifiable_weight: float
    total_weight: float
    verifiable_coverage_pct: float
    unverifiable_count: int
    formula_version: str = FROZEN_FORMULA_VERSION
    disclaimer: str = SCORING_DISCLAIMER


def compute_compliance_score(
    evaluations: list[RequirementEvaluation],
    weights: Optional[dict[str, float]] = None,
) -> ComplianceScore:
    """Computes deterministic compliance score using frozen weighted formula.

    SCOR-01: Frozen weighted formula: deterministic for the same inputs.
    SCOR-03: UNVERIFIABLE checks are excluded from the score denominator,
    reflecting verifiable coverage only.
    SCOR-04: Accompanied by statutory non-ranking disclaimer.
    """
    if weights is None:
        weights = {}

    total_weight = 0.0
    verifiable_weight = 0.0
    earned_points = 0.0
    unverifiable_count = 0

    for req in evaluations:
        if not req.is_applicable:
            continue

        w = weights.get(req.requirement_id, DEFAULT_CHECK_WEIGHT)
        total_weight += w

        if req.state == "UNVERIFIABLE":
            unverifiable_count += 1
            # SCOR-03: Omit from denominator; weight is not counted in verifiable_weight
            continue

        verifiable_weight += w
        multiplier = STATE_MULTIPLIERS.get(req.state, 0.0)
        earned_points += w * multiplier

    if verifiable_weight <= 0.0:
        score_val = 0.0
        coverage_pct = 0.0
    else:
        score_val = round((earned_points / verifiable_weight) * 100.0, 2)
        coverage_pct = round((verifiable_weight / total_weight) * 100.0, 2) if total_weight > 0 else 0.0

    return ComplianceScore(
        score=score_val,
        verifiable_weight=round(verifiable_weight, 2),
        total_weight=round(total_weight, 2),
        verifiable_coverage_pct=coverage_pct,
        unverifiable_count=unverifiable_count,
        formula_version=FROZEN_FORMULA_VERSION,
        disclaimer=SCORING_DISCLAIMER,
    )

"""Independent multi-factor risk classification engine (SCOR-02)."""

from dataclasses import dataclass, field
from typing import Any, Literal, Optional

from gem_api.rules.models import RequirementEvaluation

RiskLevel = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]


@dataclass
class RiskProfile:
    """Comprehensive risk profile computed independently from the numerical compliance score."""
    level: RiskLevel
    factors: list[str] = field(default_factory=list)
    debarment_flag: bool = False
    mandatory_failure_count: int = 0
    review_count: int = 0
    unverifiable_count: int = 0


def evaluate_risk(
    evaluations: list[RequirementEvaluation],
    debarment_record: Optional[dict[str, Any]] = None,
) -> RiskProfile:
    """Evaluates bidder risk independently from compliance score (SCOR-02).

    Rules:
    - CRITICAL: Active debarment/blacklisting order detected.
    - HIGH: Explicit failure in one or more statutory/mandatory requirements.
    - MEDIUM: Ambiguity, missing evidence (REVIEW), or external portal downtime (UNVERIFIABLE).
    - LOW: All applicable checks verified and satisfied (all PASS).
    """
    factors: list[str] = []
    debarment_flag = False
    mandatory_failures = 0
    review_count = 0
    unverifiable_count = 0

    # 1. Inspect explicit debarment payload if provided
    if debarment_record and debarment_record.get("is_debarred"):
        debarment_flag = True
        reason = debarment_record.get("reason", "Active debarment order found")
        factors.append(f"CRITICAL: Active debarment detected ({reason}).")

    # 2. Inspect requirement evaluations
    for req in evaluations:
        if not req.is_applicable:
            continue

        # Check if debarment check failed inside requirement evaluations
        for chk in req.check_results:
            if "DEBARMENT" in chk.check_id.upper() and chk.state == "FAIL":
                debarment_flag = True
                factors.append(f"CRITICAL: Debarment check failed: {chk.message}")

        if req.state == "FAIL":
            mandatory_failures += 1
            factors.append(f"HIGH: Mandatory requirement '{req.requirement_id}' failed.")
        elif req.state == "REVIEW":
            review_count += 1
            factors.append(f"MEDIUM: Requirement '{req.requirement_id}' requires manual review (missing/ungrounded).")
        elif req.state == "UNVERIFIABLE":
            unverifiable_count += 1
            factors.append(f"MEDIUM: Requirement '{req.requirement_id}' could not be verified due to portal downtime.")

    # 3. Determine overall risk level
    if debarment_flag:
        level: RiskLevel = "CRITICAL"
    elif mandatory_failures > 0:
        level = "HIGH"
    elif review_count > 0 or unverifiable_count > 0:
        level = "MEDIUM"
    else:
        level = "LOW"
        factors.append("LOW: All statutory and technical requirements verified and compliant.")

    return RiskProfile(
        level=level,
        factors=factors,
        debarment_flag=debarment_flag,
        mandatory_failure_count=mandatory_failures,
        review_count=review_count,
        unverifiable_count=unverifiable_count,
    )

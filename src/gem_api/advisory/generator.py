"""Deterministic procurement advisory generator (ADVS-01, ADVS-02, ADVS-03, ADVS-04)."""

from dataclasses import dataclass, field
import hashlib
from typing import Literal

from gem_api.rules.models import TenderEvaluationReport
from gem_api.scoring.engine import ComplianceScore
from gem_api.scoring.risk import RiskProfile

AdvisoryAction = Literal["APPROVE", "REJECT", "REQUEST_CLARIFICATION"]
LEGAL_ADVISORY_DISCLAIMER = (
    "ADVISORY: FOR PROCURING OFFICER EVALUATION ONLY — THIS IS AN ASSISTIVE RECOMMENDATION, "
    "NOT AN AUTOMATED DISQUALIFICATION. FINAL DETERMINATION RESTS WITH THE COMPETENT PROCURING AUTHORITY."
)


@dataclass
class AdvisoryReport:
    """Structured advisory summary for procurement officers."""
    summary_text: str
    statutory_findings: list[str] = field(default_factory=list)
    technical_findings: list[str] = field(default_factory=list)
    cited_requirement_ids: list[str] = field(default_factory=list)
    recommended_action: AdvisoryAction = "REQUEST_CLARIFICATION"
    advisory_hash: str = ""
    disclaimer: str = LEGAL_ADVISORY_DISCLAIMER


def generate_advisory(
    report: TenderEvaluationReport,
    score: ComplianceScore,
    risk: RiskProfile,
) -> AdvisoryReport:
    """Generates an explainable, deterministic advisory citing requirement IDs.

    Enforces:
    - ADVS-01: Deterministic template builds officer summary from structured rule results.
    - ADVS-02: Advisory cites existing requirement IDs (REQ-XX format).
    - ADVS-03: Pure deterministic baseline; safe fallback.
    - ADVS-04: Mandatory legal advisory disclaimer.
    """
    statutory_findings: list[str] = []
    technical_findings: list[str] = []
    cited_req_ids: set[str] = set()

    for req in report.requirements:
        if not req.is_applicable or req.state == "PASS":
            continue

        cited_req_ids.add(req.requirement_id)
        is_statutory = any(
            token in req.requirement_id.upper()
            for token in ("GST", "PAN", "UDYAM", "EPFO", "ESIC", "DEBARMENT")
        )

        for chk in req.check_results:
            if chk.state != "PASS":
                finding_str = f"[{req.requirement_id}] {chk.check_id}: {chk.message} (State: {chk.state})"
                if is_statutory:
                    statutory_findings.append(finding_str)
                else:
                    technical_findings.append(finding_str)

    # Determine recommended action
    if risk.level == "CRITICAL" or risk.debarment_flag:
        recommended_action: AdvisoryAction = "REJECT"
        action_rationale = (
            "Recommendation to REJECT: Bidder is subject to critical statutory constraints "
            "(active debarment or blacklisting). Immediate disqualification recommended under GeM GTC."
        )
    elif report.overall_state == "FAIL" or risk.level == "HIGH":
        recommended_action = "REJECT"
        action_rationale = (
            f"Recommendation to REJECT: Bidder failed {len(statutory_findings) + len(technical_findings)} "
            "statutory or mandatory eligibility checks. Citations: " + ", ".join(sorted(cited_req_ids))
        )
    elif report.overall_state in ("REVIEW", "UNVERIFIABLE") or risk.level == "MEDIUM":
        recommended_action = "REQUEST_CLARIFICATION"
        action_rationale = (
            f"Recommendation to REQUEST CLARIFICATION: Submitted bid contains unresolved ambiguities, "
            f"missing documents, or unverified portal checks. Citations: " + ", ".join(sorted(cited_req_ids))
        )
    else:
        recommended_action = "APPROVE"
        action_rationale = (
            "Recommendation to APPROVE: Bidder has satisfied all evaluated statutory, technical, and "
            "tender-specific eligibility criteria with full evidence coverage."
        )

    # Build full structured summary text
    lines = [
        f"=== {LEGAL_ADVISORY_DISCLAIMER} ===",
        f"Tender: {report.tender_id} (Version: {report.tender_version})",
        f"Bidder: {report.bidder_id}",
        f"Overall Result State: {report.overall_state}",
        f"Compliance Score: {score.score:.1f}% (Verifiable Coverage: {score.verifiable_coverage_pct:.1f}%)",
        f"Risk Level: {risk.level}",
        "",
        f"RECOMMENDED ACTION: {recommended_action}",
        f"RATIONALE: {action_rationale}",
        "",
        f"STATUTORY FINDINGS ({len(statutory_findings)}):",
    ]
    if statutory_findings:
        lines.extend(f"  - {f}" for f in statutory_findings)
    else:
        lines.append("  - None. All statutory checks satisfied.")

    lines.append(f"\nTECHNICAL / TENDER FINDINGS ({len(technical_findings)}):")
    if technical_findings:
        lines.extend(f"  - {f}" for f in technical_findings)
    else:
        lines.append("  - None. All tender-specific checks satisfied.")

    summary_text = "\n".join(lines)
    advisory_hash = hashlib.sha256(summary_text.encode("utf-8")).hexdigest()

    return AdvisoryReport(
        summary_text=summary_text,
        statutory_findings=statutory_findings,
        technical_findings=technical_findings,
        cited_requirement_ids=sorted(list(cited_req_ids)),
        recommended_action=recommended_action,
        advisory_hash=advisory_hash,
        disclaimer=LEGAL_ADVISORY_DISCLAIMER,
    )

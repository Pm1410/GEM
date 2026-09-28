"""Missing-info and deficiency detection engine (EXTR-05)."""

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class DeficiencyFinding:
    """Detailed deficiency finding when evidence fields are missing or ungrounded."""
    field_name: str
    issue_type: str  # "MISSING" | "UNGROUNDED" | "EMPTY"
    message: str
    severity: str = "ERROR"  # "ERROR" | "WARNING"


@dataclass
class MissingInfoReport:
    """Report detailing completeness of submitted evidence against tender requirements."""
    is_complete: bool
    missing_fields: list[str] = field(default_factory=list)
    present_fields: list[str] = field(default_factory=list)
    ungrounded_fields: list[str] = field(default_factory=list)
    deficiencies: list[DeficiencyFinding] = field(default_factory=list)


def detect_missing_fields(
    required_fields: list[str],
    extracted_fields: dict[str, Any],
    grounded_map: Optional[dict[str, bool]] = None,
) -> MissingInfoReport:
    """Compares required evidence fields per tender rule against extracted fields.

    Enforces EXTR-05: Missing-info detection: compare required evidence per tender rule
    with extracted fields, emit structured deficiency findings.
    """
    if grounded_map is None:
        grounded_map = {}

    missing_fields: list[str] = []
    present_fields: list[str] = []
    ungrounded_fields: list[str] = []
    deficiencies: list[DeficiencyFinding] = []

    for field_name in required_fields:
        val = extracted_fields.get(field_name)

        if val is None or (isinstance(val, str) and not val.strip()):
            missing_fields.append(field_name)
            deficiencies.append(
                DeficiencyFinding(
                    field_name=field_name,
                    issue_type="MISSING",
                    message=f"Required evidence field '{field_name}' was not submitted or extracted.",
                    severity="ERROR",
                )
            )
        else:
            present_fields.append(field_name)
            # Check if grounding was evaluated and failed
            is_grounded = grounded_map.get(field_name, True)
            if not is_grounded:
                ungrounded_fields.append(field_name)
                deficiencies.append(
                    DeficiencyFinding(
                        field_name=field_name,
                        issue_type="UNGROUNDED",
                        message=(
                            f"Field '{field_name}' value '{val}' was not found verbatim "
                            "in the submitted document (possible hallucination or tampering)."
                        ),
                        severity="ERROR",
                    )
                )

    is_complete = len(missing_fields) == 0 and len(ungrounded_fields) == 0

    return MissingInfoReport(
        is_complete=is_complete,
        missing_fields=missing_fields,
        present_fields=present_fields,
        ungrounded_fields=ungrounded_fields,
        deficiencies=deficiencies,
    )

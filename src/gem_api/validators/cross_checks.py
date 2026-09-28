"""Cross-document verification checks."""

from typing import Optional


def validate_gstin_pan_match(gstin: Optional[str], pan: Optional[str]) -> "ValidatorResult":
    """Cross-checks that characters 3-12 of the GSTIN match the supplied PAN document.

    CRITICAL RULE (VALD-02): Characters 3-12 (index 2:12 in 0-based indexing)
    must match the bidder's PAN exactly.
    """
    from gem_api.validators import ValidatorResult, validate_gstin, validate_pan

    if not gstin:
        return ValidatorResult(
            is_valid=False,
            code="CROSS_CHECK_GSTIN_MISSING",
            reason="Cannot cross-check PAN against GSTIN: GSTIN is missing."
        )

    if not pan:
        return ValidatorResult(
            is_valid=False,
            code="CROSS_CHECK_PAN_MISSING",
            reason="Cannot cross-check PAN against GSTIN: PAN is missing."
        )

    clean_gstin = gstin.strip().upper()
    clean_pan = pan.strip().upper()

    if len(clean_gstin) < 12:
        return ValidatorResult(
            is_valid=False,
            code="CROSS_CHECK_GSTIN_TOO_SHORT",
            reason=f"GSTIN '{clean_gstin}' is too short to contain a PAN.",
            details={"gstin": clean_gstin}
        )

    gstin_pan_part = clean_gstin[2:12]

    if gstin_pan_part != clean_pan:
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_PAN_MISMATCH",
            reason=(
                f"GSTIN embedded PAN '{gstin_pan_part}' does not match the supplied "
                f"PAN document '{clean_pan}'."
            ),
            details={
                "gstin": clean_gstin,
                "gstin_embedded_pan": gstin_pan_part,
                "supplied_pan": clean_pan
            }
        )

    return ValidatorResult(
        is_valid=True,
        code="GSTIN_PAN_MATCH",
        reason=f"GSTIN embedded PAN '{gstin_pan_part}' matches supplied PAN '{clean_pan}'.",
        details={
            "gstin": clean_gstin,
            "pan": clean_pan
        }
    )

"""Udyam MSME Registration Number format validator."""

import re
from typing import Optional

UDYAM_REGEX = re.compile(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$")


def validate_udyam(udyam: Optional[str]) -> "ValidatorResult":
    from gem_api.validators import ValidatorResult

    if not udyam or not isinstance(udyam, str):
        return ValidatorResult(
            is_valid=False,
            code="UDYAM_EMPTY",
            reason="Udyam registration number is empty or not provided."
        )

    clean_udyam = udyam.strip().upper()

    if not clean_udyam.startswith("UDYAM-"):
        return ValidatorResult(
            is_valid=False,
            code="UDYAM_INVALID_PREFIX",
            reason="Udyam registration number must start with 'UDYAM-'.",
            details={"input": clean_udyam}
        )

    if len(clean_udyam) != 19:
        return ValidatorResult(
            is_valid=False,
            code="UDYAM_INVALID_LENGTH",
            reason=f"Udyam registration number must be exactly 19 characters, got {len(clean_udyam)}.",
            details={"input": clean_udyam, "length": len(clean_udyam)}
        )

    if not UDYAM_REGEX.match(clean_udyam):
        return ValidatorResult(
            is_valid=False,
            code="UDYAM_MALFORMED_STRUCTURE",
            reason="Udyam number does not match statutory format UDYAM-XX-00-0000000.",
            details={"input": clean_udyam}
        )

    parts = clean_udyam.split("-")
    return ValidatorResult(
        is_valid=True,
        code="UDYAM_VALID",
        reason="Udyam registration number format is valid.",
        details={
            "udyam": clean_udyam,
            "state_code": parts[1],
            "district_code": parts[2],
            "serial_number": parts[3]
        }
    )

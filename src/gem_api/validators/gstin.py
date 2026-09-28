"""GSTIN format and official Mod-36 checksum validator."""

import re
from typing import Optional

GSTN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
CHAR_TO_VAL = {c: i for i, c in enumerate(GSTN_CHARSET)}

# Valid Census 2011 + UT state codes recognized by GSTN
VALID_STATE_CODES = {
    f"{i:02d}" for i in range(1, 39)
} | {"97", "99"}

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")


def calculate_gstin_checksum(gstin_14: str) -> str:
    """Calculates the 15th character checksum of a 14-character GSTIN prefix

    using the official GSTN Mod-36 algorithm.
    """
    if len(gstin_14) != 14:
        raise ValueError(f"Expected 14 characters for GSTIN checksum calculation, got {len(gstin_14)}")

    total = 0
    for idx, char in enumerate(gstin_14.upper()):
        pos = idx + 1
        # Factor is 2 for even positions (2, 4, 6, 8, 10, 12, 14), 1 for odd
        weight = 2 if pos % 2 == 0 else 1
        val = CHAR_TO_VAL[char]
        product = val * weight
        quotient = product // 36
        remainder = product % 36
        total += quotient + remainder

    check_val = (36 - (total % 36)) % 36
    return GSTN_CHARSET[check_val]


def validate_gstin(gstin: Optional[str]) -> "ValidatorResult":
    from gem_api.validators import ValidatorResult

    if not gstin or not isinstance(gstin, str):
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_EMPTY",
            reason="GSTIN value is empty or not provided."
        )

    clean_gstin = gstin.strip().upper()

    if len(clean_gstin) != 15:
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_INVALID_LENGTH",
            reason=f"GSTIN must be exactly 15 characters, got {len(clean_gstin)}.",
            details={"input": clean_gstin, "length": len(clean_gstin)}
        )

    state_code = clean_gstin[:2]
    if state_code not in VALID_STATE_CODES:
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_INVALID_STATE_CODE",
            reason=f"State code '{state_code}' is not a valid Census / GST state code.",
            details={"state_code": state_code}
        )

    if clean_gstin[13] != 'Z':
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_INVALID_DEFAULT_CHAR",
            reason=f"Character at position 14 must be default 'Z', got '{clean_gstin[13]}'.",
            details={"char_pos_14": clean_gstin[13]}
        )

    if not GSTIN_REGEX.match(clean_gstin):
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_MALFORMED_STRUCTURE",
            reason="GSTIN structure does not match statutory pattern [State][PAN][Entity][Z][Checksum].",
            details={"input": clean_gstin}
        )

    expected_checksum = calculate_gstin_checksum(clean_gstin[:14])
    actual_checksum = clean_gstin[14]

    if actual_checksum != expected_checksum:
        return ValidatorResult(
            is_valid=False,
            code="GSTIN_CHECKSUM_MISMATCH",
            reason=f"GSTIN Mod-36 checksum mismatch: expected '{expected_checksum}', got '{actual_checksum}'.",
            details={"expected": expected_checksum, "actual": actual_checksum}
        )

    return ValidatorResult(
        is_valid=True,
        code="GSTIN_VALID",
        reason="GSTIN is valid and passes official Mod-36 checksum.",
        details={
            "gstin": clean_gstin,
            "state_code": state_code,
            "pan": clean_gstin[2:12],
            "entity_code": clean_gstin[12],
            "checksum": actual_checksum
        }
    )

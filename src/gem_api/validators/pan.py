"""Permanent Account Number (PAN) format validator."""

import re
from typing import Optional

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")

# Official Income Tax Department entity status codes
VALID_PAN_ENTITY_TYPES = {
    'P': "Individual / Person",
    'C': "Company",
    'H': "Hindu Undivided Family (HUF)",
    'F': "Partnership Firm / LLP",
    'A': "Association of Persons (AOP)",
    'T': "Trust",
    'B': "Body of Individuals (BOI)",
    'L': "Local Authority",
    'J': "Artificial Juridical Person",
    'G': "Government Agency",
}


def validate_pan(pan: Optional[str]) -> "ValidatorResult":
    from gem_api.validators import ValidatorResult

    if not pan or not isinstance(pan, str):
        return ValidatorResult(
            is_valid=False,
            code="PAN_EMPTY",
            reason="PAN value is empty or not provided."
        )

    clean_pan = pan.strip().upper()

    if len(clean_pan) != 10:
        return ValidatorResult(
            is_valid=False,
            code="PAN_INVALID_LENGTH",
            reason=f"PAN must be exactly 10 characters, got {len(clean_pan)}.",
            details={"input": clean_pan, "length": len(clean_pan)}
        )

    if not PAN_REGEX.match(clean_pan):
        return ValidatorResult(
            is_valid=False,
            code="PAN_MALFORMED_STRUCTURE",
            reason="PAN does not match statutory pattern [A-Z]{5}[0-9]{4}[A-Z].",
            details={"input": clean_pan}
        )

    entity_type_char = clean_pan[3]
    if entity_type_char not in VALID_PAN_ENTITY_TYPES:
        return ValidatorResult(
            is_valid=False,
            code="PAN_INVALID_ENTITY_TYPE",
            reason=f"Character at position 4 ('{entity_type_char}') is not a recognized entity type.",
            details={"entity_char": entity_type_char}
        )

    return ValidatorResult(
        is_valid=True,
        code="PAN_VALID",
        reason="PAN is valid with recognized entity status.",
        details={
            "pan": clean_pan,
            "entity_code": entity_type_char,
            "entity_type": VALID_PAN_ENTITY_TYPES[entity_type_char]
        }
    )

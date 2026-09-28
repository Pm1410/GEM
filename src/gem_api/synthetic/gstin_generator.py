"""Synthetic Mod-36 GSTIN generator (DATA-04)."""

import random
from gem_api.validators.gstin import calculate_gstin_checksum, validate_gstin, VALID_STATE_CODES

DEFAULT_SAMPLE_PANS = [
    "AAACT2727Q",
    "AABCB1234F",
    "ABCDE1234F",
    "BAPPD1234P",
    "DELHI9999C",
    "MUMBA8888H",
    "BLORE7777F",
]


def generate_synthetic_gstin(
    state_code: str = "27",
    pan: str = "AAACT2727Q",
    entity_code: str = "1",
) -> str:
    """Generates a mathematically valid 15-character GSTIN with official Mod-36 checksum.

    Enforces DATA-04: Synthetic GSTINs generated with valid Mod-36 checksums.
    """
    clean_state = f"{state_code.strip():0>2}"
    if clean_state not in VALID_STATE_CODES:
        clean_state = "27"  # Default to Maharashtra

    clean_pan = pan.strip().upper()
    if len(clean_pan) != 10:
        clean_pan = "AAACT2727Q"

    clean_entity = entity_code.strip().upper()[0] if entity_code else "1"

    # Positions 1..14: State(2) + PAN(10) + Entity(1) + Default 'Z'(1)
    prefix_14 = f"{clean_state}{clean_pan}{clean_entity}Z"

    # Position 15: Checksum character
    checksum_char = calculate_gstin_checksum(prefix_14)
    full_gstin = f"{prefix_14}{checksum_char}"

    # Verify that the generated GSTIN passes validator
    val_res = validate_gstin(full_gstin)
    if not val_res.is_valid:
        raise ValueError(f"Generated GSTIN '{full_gstin}' failed verification: {val_res.reason}")

    return full_gstin


def generate_random_gstin() -> str:
    """Generates a random valid synthetic GSTIN across India state codes."""
    state = random.choice(sorted(list(VALID_STATE_CODES)))
    pan = random.choice(DEFAULT_SAMPLE_PANS)
    entity = str(random.randint(1, 9))
    return generate_synthetic_gstin(state_code=state, pan=pan, entity_code=entity)

"""Format validators and statutory checks for GeM platform."""

from dataclasses import dataclass, field
from typing import Optional, Any

@dataclass(frozen=True)
class ValidatorResult:
    is_valid: bool
    code: str
    reason: Optional[str] = None
    details: dict[str, Any] = field(default_factory=dict)

from gem_api.validators.gstin import validate_gstin, calculate_gstin_checksum
from gem_api.validators.pan import validate_pan
from gem_api.validators.udyam import validate_udyam
from gem_api.validators.date_checks import validate_certificate_validity
from gem_api.validators.cross_checks import validate_gstin_pan_match

__all__ = [
    "ValidatorResult",
    "validate_gstin",
    "calculate_gstin_checksum",
    "validate_pan",
    "validate_udyam",
    "validate_certificate_validity",
    "validate_gstin_pan_match",
]

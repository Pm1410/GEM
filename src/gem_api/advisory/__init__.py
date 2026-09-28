"""Advisory engine package."""

from gem_api.advisory.generator import (
    AdvisoryReport,
    AdvisoryAction,
    LEGAL_ADVISORY_DISCLAIMER,
    generate_advisory,
)

__all__ = [
    "AdvisoryReport",
    "AdvisoryAction",
    "LEGAL_ADVISORY_DISCLAIMER",
    "generate_advisory",
]

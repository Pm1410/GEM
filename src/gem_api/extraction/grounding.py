"""Verbatim grounding verification engine (EXTR-04, SECR-02)."""

from dataclasses import dataclass
import re
from typing import Optional


@dataclass
class GroundingResult:
    """Outcome of verifying whether an extracted value is grounded verbatim in source text."""
    is_grounded: bool
    match_text: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    confidence: float = 0.0
    page_number: Optional[int] = None


def _build_flexible_pattern(value: str) -> re.Pattern:
    """Builds a regex pattern allowing arbitrary whitespace/newlines between tokens."""
    tokens = [re.escape(t) for t in re.split(r"\s+", value.strip()) if t]
    if not tokens:
        return re.compile(r"$^")  # Matches nothing
    # Join tokens with \s+ so line breaks, tabs, or multiple spaces match
    pattern_str = r"\s*".join(tokens)
    return re.compile(pattern_str, re.IGNORECASE)


def check_verbatim_grounding(
    extracted_value: str,
    raw_text: str,
    page_number: Optional[int] = None,
) -> GroundingResult:
    """Verifies that an extracted field value appears verbatim in the source text.

    EXTR-04 & SECR-02:
    Prevents hallucinated or injected values from passing verification.
    Tolerates whitespace normalization differences (tabs, spaces, linebreaks).
    """
    clean_val = extracted_value.strip()
    if not clean_val or not raw_text:
        return GroundingResult(is_grounded=False, confidence=0.0, page_number=page_number)

    # 1. Direct exact substring match
    idx = raw_text.find(clean_val)
    if idx != -1:
        return GroundingResult(
            is_grounded=True,
            match_text=raw_text[idx : idx + len(clean_val)],
            start_char=idx,
            end_char=idx + len(clean_val),
            confidence=1.0,
            page_number=page_number,
        )

    # 2. Case-insensitive exact substring match
    lower_raw = raw_text.lower()
    lower_val = clean_val.lower()
    idx_case = lower_raw.find(lower_val)
    if idx_case != -1:
        return GroundingResult(
            is_grounded=True,
            match_text=raw_text[idx_case : idx_case + len(clean_val)],
            start_char=idx_case,
            end_char=idx_case + len(clean_val),
            confidence=0.98,
            page_number=page_number,
        )

    # 3. Flexible whitespace regex match (across linebreaks, multiple spaces)
    try:
        pattern = _build_flexible_pattern(clean_val)
        match = pattern.search(raw_text)
        if match:
            return GroundingResult(
                is_grounded=True,
                match_text=match.group(0),
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.95,
                page_number=page_number,
            )
    except re.error:
        pass

    # 4. Value not found in source text -> ungrounded
    return GroundingResult(
        is_grounded=False,
        match_text=None,
        start_char=None,
        end_char=None,
        confidence=0.0,
        page_number=page_number,
    )

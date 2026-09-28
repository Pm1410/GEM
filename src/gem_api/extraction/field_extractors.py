"""Statutory field extractors using regex patterns and verbatim grounding (EXTR-03, EXTR-04)."""

from dataclasses import dataclass
import re
from typing import Optional

from gem_api.extraction.grounding import GroundingResult, check_verbatim_grounding

# Strict statutory regex patterns
GSTIN_REGEX = re.compile(
    r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b",
    re.IGNORECASE,
)
PAN_REGEX = re.compile(
    r"\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b",
    re.IGNORECASE,
)
UDYAM_REGEX = re.compile(
    r"\b(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})\b",
    re.IGNORECASE,
)
DATE_REGEX = re.compile(
    r"\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})\b"
)


@dataclass
class ExtractedField:
    """Represents a structured field extracted from document text with grounding proof."""
    field_name: str
    value: str
    raw_match: str
    page_number: int
    grounding: GroundingResult


def extract_gstin(text: str, page_number: int = 1) -> list[ExtractedField]:
    """Extracts all GSTIN occurrences and verifies verbatim grounding."""
    results: list[ExtractedField] = []
    seen = set()
    for match in GSTIN_REGEX.finditer(text):
        raw_val = match.group(1).upper()
        if raw_val not in seen:
            seen.add(raw_val)
            grounding = check_verbatim_grounding(raw_val, text, page_number=page_number)
            results.append(
                ExtractedField(
                    field_name="gstin",
                    value=raw_val,
                    raw_match=match.group(0),
                    page_number=page_number,
                    grounding=grounding,
                )
            )
    return results


def extract_pan(text: str, page_number: int = 1) -> list[ExtractedField]:
    """Extracts all PAN occurrences and verifies verbatim grounding."""
    results: list[ExtractedField] = []
    seen = set()
    for match in PAN_REGEX.finditer(text):
        raw_val = match.group(1).upper()
        if raw_val not in seen:
            seen.add(raw_val)
            grounding = check_verbatim_grounding(raw_val, text, page_number=page_number)
            results.append(
                ExtractedField(
                    field_name="pan",
                    value=raw_val,
                    raw_match=match.group(0),
                    page_number=page_number,
                    grounding=grounding,
                )
            )
    return results


def extract_udyam(text: str, page_number: int = 1) -> list[ExtractedField]:
    """Extracts all Udyam numbers and verifies verbatim grounding."""
    results: list[ExtractedField] = []
    seen = set()
    for match in UDYAM_REGEX.finditer(text):
        raw_val = match.group(1).upper()
        if raw_val not in seen:
            seen.add(raw_val)
            grounding = check_verbatim_grounding(raw_val, text, page_number=page_number)
            results.append(
                ExtractedField(
                    field_name="udyam_registration_number",
                    value=raw_val,
                    raw_match=match.group(0),
                    page_number=page_number,
                    grounding=grounding,
                )
            )
    return results


def extract_dates(text: str, page_number: int = 1) -> list[ExtractedField]:
    """Extracts date strings and verifies verbatim grounding."""
    results: list[ExtractedField] = []
    seen = set()
    for match in DATE_REGEX.finditer(text):
        raw_val = match.group(1)
        if raw_val not in seen:
            seen.add(raw_val)
            grounding = check_verbatim_grounding(raw_val, text, page_number=page_number)
            results.append(
                ExtractedField(
                    field_name="date",
                    value=raw_val,
                    raw_match=match.group(0),
                    page_number=page_number,
                    grounding=grounding,
                )
            )
    return results


def extract_all_fields(text: str, page_number: int = 1) -> dict[str, list[ExtractedField]]:
    """Extracts all standard statutory identifiers from text."""
    return {
        "gstin": extract_gstin(text, page_number),
        "pan": extract_pan(text, page_number),
        "udyam": extract_udyam(text, page_number),
        "dates": extract_dates(text, page_number),
    }

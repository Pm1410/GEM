"""Shared test fixtures for GeM verification suite."""

from datetime import date
import pytest

@pytest.fixture
def sample_valid_gstin():
    """Known valid Indian GSTIN: 27AAPFU0939F1ZV (Maharashtra, Company PAN AAPFU0939F, entity 1, Z, checksum V)."""
    return "27AAPFU0939F1ZV"

@pytest.fixture
def sample_valid_pan():
    """Known valid Company PAN."""
    return "AAPFU0939F"

@pytest.fixture
def sample_valid_udyam():
    """Valid Udyam registration number format."""
    return "UDYAM-MH-01-0012345"

@pytest.fixture
def sample_tender_dates():
    """Sample tender dates where bid opening date is 2026-03-15."""
    return {
        "bid_opening_date": date(2026, 3, 15),
        "valid_cert_expiry": date(2026, 6, 30),
        "expired_cert_expiry": date(2026, 2, 28)
    }

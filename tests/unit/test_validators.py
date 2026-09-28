"""Unit tests for GeM statutory format validators and cross-checks."""

from datetime import date
import pytest

from gem_api.validators import (
    validate_gstin,
    calculate_gstin_checksum,
    validate_pan,
    validate_udyam,
    validate_certificate_validity,
    validate_gstin_pan_match,
)


class TestGSTINValidator:
    def test_valid_gstin(self, sample_valid_gstin):
        res = validate_gstin(sample_valid_gstin)
        assert res.is_valid is True
        assert res.code == "GSTIN_VALID"
        assert res.details["state_code"] == "27"
        assert res.details["pan"] == "AAPFU0939F"

    def test_tcs_valid_gstin(self):
        # Tata Consultancy Services Maharashtra GSTIN
        res = validate_gstin("27AAACT2727Q1ZW")
        assert res.is_valid is True
        assert res.code == "GSTIN_VALID"

    def test_gstin_empty_or_none(self):
        assert validate_gstin(None).is_valid is False
        assert validate_gstin("").is_valid is False

    def test_gstin_invalid_length(self):
        res = validate_gstin("27AAPFU0939F1Z")
        assert res.is_valid is False
        assert res.code == "GSTIN_INVALID_LENGTH"

    def test_gstin_invalid_state_code(self):
        res = validate_gstin("00AAPFU0939F1ZV")
        assert res.is_valid is False
        assert res.code == "GSTIN_INVALID_STATE_CODE"

    def test_gstin_invalid_default_char(self):
        # Character 14 should be Z, change it to X
        res = validate_gstin("27AAPFU0939F1XV")
        assert res.is_valid is False
        assert res.code == "GSTIN_INVALID_DEFAULT_CHAR"

    def test_gstin_checksum_mismatch(self):
        # Change last character from V to 5
        res = validate_gstin("27AAPFU0939F1Z5")
        assert res.is_valid is False
        assert res.code == "GSTIN_CHECKSUM_MISMATCH"

    def test_lowercase_normalized(self):
        res = validate_gstin("27aapfu0939f1zv")
        assert res.is_valid is True
        assert res.details["gstin"] == "27AAPFU0939F1ZV"


class TestPANValidator:
    def test_valid_firm_pan(self, sample_valid_pan):
        res = validate_pan(sample_valid_pan)
        assert res.is_valid is True
        assert res.code == "PAN_VALID"
        assert res.details["entity_code"] == "F"

    def test_valid_company_pan(self):
        res = validate_pan("AAACT2727Q")
        assert res.is_valid is True
        assert res.code == "PAN_VALID"
        assert res.details["entity_code"] == "C"

    def test_valid_individual_pan(self):
        res = validate_pan("ABCPD1234F")
        assert res.is_valid is True
        assert res.code == "PAN_VALID"
        assert res.details["entity_code"] == "P"

    def test_pan_invalid_length(self):
        res = validate_pan("ABCDE1234")
        assert res.is_valid is False
        assert res.code == "PAN_INVALID_LENGTH"

    def test_pan_invalid_entity_type(self):
        # 'Z' is not a recognized entity type at pos 4
        res = validate_pan("ABCZE1234F")
        assert res.is_valid is False
        assert res.code == "PAN_INVALID_ENTITY_TYPE"

    def test_pan_malformed(self):
        res = validate_pan("12345ABCDE")
        assert res.is_valid is False
        assert res.code == "PAN_MALFORMED_STRUCTURE"


class TestUdyamValidator:
    def test_valid_udyam(self, sample_valid_udyam):
        res = validate_udyam(sample_valid_udyam)
        assert res.is_valid is True
        assert res.code == "UDYAM_VALID"
        assert res.details["state_code"] == "MH"
        assert res.details["district_code"] == "01"
        assert res.details["serial_number"] == "0012345"

    def test_udyam_invalid_prefix(self):
        res = validate_udyam("MSME-MH-01-0012345")
        assert res.is_valid is False
        assert res.code == "UDYAM_INVALID_PREFIX"

    def test_udyam_invalid_length(self):
        res = validate_udyam("UDYAM-MH-01-12345")
        assert res.is_valid is False
        assert res.code == "UDYAM_INVALID_LENGTH"

    def test_udyam_malformed(self):
        res = validate_udyam("UDYAM-12-XX-0012345")
        assert res.is_valid is False
        assert res.code == "UDYAM_MALFORMED_STRUCTURE"


class TestCertificateDateValidity:
    def test_cert_valid_at_bid_opening(self, sample_tender_dates):
        res = validate_certificate_validity(
            sample_tender_dates["valid_cert_expiry"],
            sample_tender_dates["bid_opening_date"]
        )
        assert res.is_valid is True
        assert res.code == "CERT_VALID_AT_BID_OPENING"
        assert res.details["validity_remaining_days"] > 0

    def test_cert_expired_before_bid_opening(self, sample_tender_dates):
        res = validate_certificate_validity(
            sample_tender_dates["expired_cert_expiry"],
            sample_tender_dates["bid_opening_date"]
        )
        assert res.is_valid is False
        assert res.code == "CERT_EXPIRED_BEFORE_BID_OPENING"

    def test_cert_expires_exact_day_of_bid_opening(self):
        bid_date = date(2026, 3, 15)
        res = validate_certificate_validity(bid_date, bid_date)
        assert res.is_valid is True
        assert res.details["validity_remaining_days"] == 0

    def test_historical_bid_opening_date_logic(self):
        # Even if cert expired relative to today, if it was valid on historical bid opening date, it is valid!
        bid_date = date(2020, 1, 15)
        cert_expiry = date(2020, 3, 31)
        res = validate_certificate_validity(cert_expiry, bid_date)
        assert res.is_valid is True


class TestGSTINPANCrossCheck:
    def test_matching_gstin_and_pan(self, sample_valid_gstin, sample_valid_pan):
        res = validate_gstin_pan_match(sample_valid_gstin, sample_valid_pan)
        assert res.is_valid is True
        assert res.code == "GSTIN_PAN_MATCH"

    def test_mismatched_gstin_and_pan(self, sample_valid_gstin):
        res = validate_gstin_pan_match(sample_valid_gstin, "ZZZFU0939F")
        assert res.is_valid is False
        assert res.code == "GSTIN_PAN_MISMATCH"

    def test_missing_values(self, sample_valid_gstin):
        assert validate_gstin_pan_match(None, "AAPFU0939F").is_valid is False
        assert validate_gstin_pan_match(sample_valid_gstin, None).is_valid is False

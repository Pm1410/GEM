"""Unit tests for synthetic data generators, Mod-36 GSTIN generator, and bidder packs (Phase 5 - Plan 01)."""

import pytest
from pathlib import Path

from gem_api.rules.loader import load_tender_rules
from gem_api.validators.gstin import validate_gstin
from gem_api.extraction import extract_document
from gem_api.synthetic import (
    generate_synthetic_gstin,
    generate_random_gstin,
    generate_gst_certificate_pdf,
    generate_udyam_certificate_pdf,
    generate_mii_declaration_pdf,
    get_synthetic_bidder_packs,
)


# --- Test Mod-36 GSTIN Generation (DATA-04) ---

def test_generate_synthetic_gstin_validity():
    # Test across multiple state codes and PANs
    test_cases = [
        ("27", "AAACT2727Q", "1"),
        ("07", "AABCB1234F", "1"),
        ("24", "AABCK9999K", "2"),
        ("09", "ABCDE5678G", "1"),
        ("29", "BLORE7777F", "1"),
    ]

    for state, pan, entity in test_cases:
        gstin = generate_synthetic_gstin(state_code=state, pan=pan, entity_code=entity)
        assert len(gstin) == 15
        assert gstin.startswith(state)
        assert pan in gstin
        # Validate through strict validator
        res = validate_gstin(gstin)
        assert res.is_valid is True, f"Failed for {gstin}: {res.reason}"


def test_generate_random_gstin():
    for _ in range(10):
        gstin = generate_random_gstin()
        assert len(gstin) == 15
        assert validate_gstin(gstin).is_valid is True


# --- Test Realistic PDF Document Generation (DATA-03) ---

def test_generate_gst_certificate_pdf_and_extract():
    pdf_bytes = generate_gst_certificate_pdf(
        legal_name="Apex Engineering Works Private Limited",
        gstin="27AAACT2727Q1ZW",
        pan="AAACT2727Q",
    )
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 1000

    # Test round-trip extraction
    doc = extract_document(pdf_bytes, filename="gst_cert.pdf")
    assert "27AAACT2727Q1ZW" in doc.full_text
    assert "Apex Engineering Works" in doc.full_text


def test_generate_udyam_and_mii_pdf():
    udyam_pdf = generate_udyam_certificate_pdf(
        enterprise_name="Delhi Digital Services",
        udyam_num="UDYAM-DL-05-0098765",
        category="SMALL",
    )
    assert udyam_pdf.startswith(b"%PDF")
    doc_udyam = extract_document(udyam_pdf, filename="udyam.pdf")
    assert "UDYAM-DL-05-0098765" in doc_udyam.full_text

    mii_pdf = generate_mii_declaration_pdf(
        company_name="Tata Consultancy Services",
        local_content_pct=65.0,
    )
    assert mii_pdf.startswith(b"%PDF")
    doc_mii = extract_document(mii_pdf, filename="mii.pdf")
    assert "65.0%" in doc_mii.full_text


# --- Test 3 Tenders & 20+ Bidder Packs (DATA-01, DATA-02) ---

def test_load_all_three_tender_configs():
    config_dir = Path("config/tenders")
    assert (config_dir / "sample_goods.yaml").exists()
    assert (config_dir / "sample_services.yaml").exists()
    assert (config_dir / "sample_msme.yaml").exists()

    goods_cfg = load_tender_rules(config_dir / "sample_goods.yaml")
    assert goods_cfg.tender_category == "goods"

    services_cfg = load_tender_rules(config_dir / "sample_services.yaml")
    assert services_cfg.tender_category == "services"

    msme_cfg = load_tender_rules(config_dir / "sample_msme.yaml")
    assert msme_cfg.tender_category == "goods"
    assert len(msme_cfg.requirements) == 5


def test_synthetic_bidder_packs_coverage():
    packs = get_synthetic_bidder_packs()
    assert len(packs) >= 20
    assert len(packs) == 22

    # Verify coverage across all 4 result states
    states = {p["expected_state"] for p in packs}
    assert "PASS" in states
    assert "FAIL" in states
    assert "REVIEW" in states
    assert "UNVERIFIABLE" in states

    # Verify coverage across risk tiers
    risks = {p["expected_risk"] for p in packs}
    assert "CRITICAL" in risks
    assert "HIGH" in risks
    assert "MEDIUM" in risks
    assert "LOW" in risks

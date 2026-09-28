"""Unit tests for document extraction, sanitization, and verbatim grounding (Phase 2 - Plan 02)."""

import pytest
import pymupdf

from gem_api.extraction import (
    validate_file_upload,
    sanitize_text,
    extract_document,
    check_verbatim_grounding,
    extract_gstin,
    extract_pan,
    extract_udyam,
    extract_dates,
    extract_all_fields,
)


def _create_sample_pdf_bytes(text: str) -> bytes:
    """Helper to generate a clean, born-digital PDF in-memory using PyMuPDF."""
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), text, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# --- Test File Upload Validation & Sanitization ---

def test_validate_file_upload_valid_pdf():
    pdf_bytes = _create_sample_pdf_bytes("GST Certificate Registration")
    assert validate_file_upload(pdf_bytes, "cert.pdf", "application/pdf") is True


def test_validate_file_upload_oversized():
    oversized = b"%PDF" + b"0" * (11 * 1024 * 1024)
    with pytest.raises(ValueError, match="exceeds the maximum allowed limit"):
        validate_file_upload(oversized, "big.pdf", "application/pdf")


def test_validate_file_upload_invalid_mime_and_extension():
    content = b"echo 'malicious'"
    with pytest.raises(ValueError, match="extension"):
        validate_file_upload(content, "script.sh", "application/x-sh")

    with pytest.raises(ValueError, match="MIME type"):
        validate_file_upload(b"%PDF-test", "test.pdf", "application/octet-stream")


def test_validate_file_upload_magic_bytes_mismatch():
    fake_pdf = b"NOT_A_PDF_HEADER"
    with pytest.raises(ValueError, match="magic header"):
        validate_file_upload(fake_pdf, "fake.pdf", "application/pdf")


def test_sanitize_text_removes_invisibles_and_controls():
    dirty = "Tata\x00 Consultancy\u200b Services\u202e Ltd\ufeff\nNew Delhi"
    clean = sanitize_text(dirty)

    assert "\x00" not in clean
    assert "\u200b" not in clean
    assert "\u202e" not in clean
    assert "\ufeff" not in clean
    assert "Tata Consultancy Services Ltd\nNew Delhi" == clean


# --- Test Document Extraction ---

def test_extract_born_digital_pdf():
    text_content = "Certificate of Registration\nGSTIN: 27AAACT2727Q1ZW\nPAN: AAACT2727Q"
    pdf_bytes = _create_sample_pdf_bytes(text_content)

    doc = extract_document(pdf_bytes, filename="gst.pdf", content_type="application/pdf")
    assert doc.total_pages == 1
    assert "27AAACT2727Q1ZW" in doc.pages[0].text
    assert "AAACT2727Q" in doc.pages[0].text
    assert doc.pages[0].is_ocr is False


# --- Test Verbatim Grounding ---

def test_verbatim_grounding_exact_and_case():
    raw_doc = "The bidder's GSTIN is 27AAACT2727Q1ZW registered in Maharashtra."

    # Exact match
    res1 = check_verbatim_grounding("27AAACT2727Q1ZW", raw_doc, page_number=1)
    assert res1.is_grounded is True
    assert res1.confidence == 1.0
    assert res1.page_number == 1
    assert res1.start_char is not None

    # Case-insensitive match
    res2 = check_verbatim_grounding("27aaact2727q1zw", raw_doc)
    assert res2.is_grounded is True
    assert res2.confidence >= 0.95


def test_verbatim_grounding_flexible_whitespace():
    raw_doc = "Enterprise Name: Apex   Engineering \n Works Private Limited"

    # Multiline with irregular spacing
    res = check_verbatim_grounding("Apex Engineering Works", raw_doc)
    assert res.is_grounded is True
    assert res.confidence >= 0.95


def test_verbatim_grounding_hallucination_rejected():
    raw_doc = "Bidder Name: Tata Consultancy Services. Registered office in Mumbai."

    # Hallucinated GSTIN not in text
    res = check_verbatim_grounding("29ABCDE1234F1Z5", raw_doc)
    assert res.is_grounded is False
    assert res.confidence == 0.0
    assert res.match_text is None


# --- Test Statutory Field Extractors ---

def test_extract_gstin_with_grounding():
    text = "Form GST REG-06: Taxpayer GSTIN: 27AAACT2727Q1ZW issued on 01/07/2017."
    gstins = extract_gstin(text)

    assert len(gstins) == 1
    assert gstins[0].value == "27AAACT2727Q1ZW"
    assert gstins[0].field_name == "gstin"
    assert gstins[0].grounding.is_grounded is True


def test_extract_pan_with_grounding():
    text = "Permanent Account Number: AAACT2727Q (Company)."
    pans = extract_pan(text)

    assert len(pans) == 1
    assert pans[0].value == "AAACT2727Q"
    assert pans[0].grounding.is_grounded is True


def test_extract_udyam_with_grounding():
    text = "Udyam Registration Certificate: UDYAM-MH-12-0012345 (Micro Enterprise)."
    udyams = extract_udyam(text)

    assert len(udyams) == 1
    assert udyams[0].value == "UDYAM-MH-12-0012345"
    assert udyams[0].grounding.is_grounded is True


def test_extract_dates_with_grounding():
    text = "Date of Incorporation: 15/04/2015. Expiry: 2026-12-31."
    dates = extract_dates(text)

    assert len(dates) == 2
    assert dates[0].value == "15/04/2015"
    assert dates[1].value == "2026-12-31"


def test_extract_all_fields_bundle():
    text = (
        "Enterprise UDYAM-DL-05-0098765 holding PAN AABCB1234F and GSTIN 07AABCB1234F1Z5 "
        "registered on 20/11/2020."
    )
    bundle = extract_all_fields(text)

    assert len(bundle["gstin"]) == 1
    assert len(bundle["pan"]) == 1
    assert len(bundle["udyam"]) == 1
    assert len(bundle["dates"]) == 1
    assert bundle["gstin"][0].value == "07AABCB1234F1Z5"
    assert bundle["udyam"][0].value == "UDYAM-DL-05-0098765"

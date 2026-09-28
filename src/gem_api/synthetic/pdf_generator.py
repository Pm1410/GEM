"""Realistic statutory document PDF generator (DATA-03)."""

import pymupdf


def generate_gst_certificate_pdf(
    legal_name: str,
    gstin: str,
    pan: str,
    reg_date: str = "2018-07-01",
    expiry_date: str = "2027-12-31",
) -> bytes:
    """Renders a realistic Form GST REG-06 registration certificate PDF."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)  # A4

    # Header & Crest representation
    page.draw_rect(pymupdf.Rect(20, 20, 575, 822), color=(0.1, 0.2, 0.4), width=1.5)
    page.draw_rect(pymupdf.Rect(25, 25, 570, 817), color=(0.7, 0.5, 0.2), width=0.75)

    page.insert_text((180, 55), "GOVERNMENT OF INDIA", fontsize=16, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text((215, 75), "Form GST REG-06", fontsize=13, fontname="helv")
    page.insert_text((170, 95), "Registration Certificate for Taxpayer", fontsize=11, fontname="helv", color=(0.3, 0.3, 0.3))

    # Divider line
    page.draw_line(pymupdf.Point(40, 110), pymupdf.Point(555, 110), color=(0.7, 0.7, 0.7), width=1)

    # Statutory Information Table
    y = 145
    labels = [
        ("1. Registration Number (GSTIN):", gstin),
        ("2. Legal Name of Business:", legal_name),
        ("3. Trade Name:", legal_name.split()[0] + " Enterprise"),
        ("4. Permanent Account Number (PAN):", pan),
        ("5. Constitution of Business:", "Private Limited Company"),
        ("6. Address of Principal Place:", "Plot 42, Electronic City, MIDC, Sector 5"),
        ("7. Date of Registration:", reg_date),
        ("8. Period of Validity:", f"From {reg_date} to {expiry_date}"),
        ("9. Type of Registration:", "Regular"),
    ]

    for label, val in labels:
        page.insert_text((50, y), label, fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
        page.insert_text((260, y), val, fontsize=10, fontname="helv", color=(0.0, 0.0, 0.0))
        y += 28

    # Official Seal / Stamp Simulation
    stamp_rect = pymupdf.Rect(380, 480, 530, 550)
    page.draw_rect(stamp_rect, color=(0.1, 0.5, 0.2), width=1.5)
    page.insert_text((395, 505), "DIGITALLY SIGNED", fontsize=9, fontname="helv", color=(0.1, 0.5, 0.2))
    page.insert_text((390, 520), "GOODS & SERVICES TAX", fontsize=8, fontname="helv", color=(0.1, 0.5, 0.2))
    page.insert_text((400, 535), "GOVERNMENT OF INDIA", fontsize=7, fontname="helv", color=(0.1, 0.5, 0.2))

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def generate_udyam_certificate_pdf(
    enterprise_name: str,
    udyam_num: str,
    category: str = "MICRO",
    major_activity: str = "MANUFACTURING",
) -> bytes:
    """Renders a realistic Ministry of MSME Udyam Registration Certificate."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)

    # Border
    page.draw_rect(pymupdf.Rect(20, 20, 575, 822), color=(0.1, 0.3, 0.5), width=1.5)

    page.insert_text((190, 60), "GOVERNMENT OF INDIA", fontsize=15, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text((130, 85), "MINISTRY OF MICRO, SMALL AND MEDIUM ENTERPRISES", fontsize=11, fontname="helv")
    page.insert_text((170, 115), "UDYAM REGISTRATION CERTIFICATE", fontsize=13, fontname="helv", color=(0.2, 0.4, 0.1))

    page.draw_line(pymupdf.Point(40, 135), pymupdf.Point(555, 135), color=(0.7, 0.7, 0.7), width=1)

    y = 175
    labels = [
        ("UDYAM REGISTRATION NUMBER:", udyam_num),
        ("NAME OF ENTERPRISE:", enterprise_name),
        ("TYPE OF ENTERPRISE:", category.upper()),
        ("MAJOR ACTIVITY:", major_activity.upper()),
        ("SOCIAL CATEGORY OF ENTREPRENEUR:", "GENERAL"),
        ("DATE OF INCORPORATION:", "2016-04-15"),
        ("DATE OF UDYAM REGISTRATION:", "2020-08-20"),
    ]

    for label, val in labels:
        page.insert_text((50, y), label, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))
        page.insert_text((270, y), val, fontsize=9.5, fontname="helv", color=(0.0, 0.0, 0.0))
        y += 30

    stamp_rect = pymupdf.Rect(380, 480, 530, 550)
    page.draw_rect(stamp_rect, color=(0.2, 0.4, 0.1), width=1.5)
    page.insert_text((405, 510), "MSME OFFICIAL SEAL", fontsize=8.5, fontname="helv", color=(0.2, 0.4, 0.1))
    page.insert_text((410, 530), "NATIONAL MSME PORTAL", fontsize=7.5, fontname="helv", color=(0.2, 0.4, 0.1))

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def generate_mii_declaration_pdf(
    company_name: str,
    local_content_pct: float,
    tender_ref: str = "TNDR-GOODS-001",
) -> bytes:
    """Renders Make in India local content self-declaration certificate."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)

    page.draw_rect(pymupdf.Rect(20, 20, 575, 822), color=(0.3, 0.3, 0.3), width=1.0)

    page.insert_text((130, 70), "MAKE IN INDIA (MII) SELF-DECLARATION CERTIFICATE", fontsize=12, fontname="helv", color=(0.1, 0.2, 0.4))
    page.insert_text((195, 90), f"Reference Tender: {tender_ref}", fontsize=10, fontname="helv")

    page.draw_line(pymupdf.Point(40, 110), pymupdf.Point(555, 110), color=(0.7, 0.7, 0.7), width=1)

    declaration_text = (
        f"We, {company_name}, hereby solemnly declare and certify under the Make in India\n"
        f"Order (DPIIT) that the local content in the offered products/services for\n"
        f"tender {tender_ref} is {local_content_pct:.1f}%.\n\n"
        f"We understand that false declarations violate the GeM General Terms and Conditions\n"
        f"and are liable for debarment and statutory penalties under the Public Procurement Rules."
    )

    y = 150
    for line in declaration_text.split("\n"):
        page.insert_text((50, y), line, fontsize=10, fontname="helv")
        y += 20

    page.insert_text((50, 320), f"Declared Local Content: {local_content_pct:.1f}%", fontsize=11, fontname="helv", color=(0.1, 0.5, 0.2))
    page.insert_text((50, 345), f"Authorized Signatory for: {company_name}", fontsize=10, fontname="helv")

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

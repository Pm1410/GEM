"""Synthetic bidder packs repository with 22 comprehensive case variants (DATA-02)."""

from typing import Any
from gem_api.synthetic.gstin_generator import generate_synthetic_gstin


def get_synthetic_bidder_packs() -> list[dict[str, Any]]:
    """Returns 22 structured synthetic bidder packs covering all test variants."""
    return [
        # --- Goods Tender Variants (TNDR-GOODS-001) ---
        {
            "id": "BP-01-GOODS-COMPLIANT",
            "legal_name": "Tata Consultancy Services Limited",
            "tender_config": "sample_goods.yaml",
            "expected_state": "PASS",
            "expected_risk": "LOW",
            "gstin": "27AAACT2727Q1ZW",
            "pan": "AAACT2727Q",
            "cert_expiry": "2027-06-30",
            "local_content_percentage": 65.0,
            "portal_results": {
                "gstin": {
                    "status": "ACTIVE",
                    "source": "SIMULATED",
                    "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT", "last_return_type": "GSTR-3B"},
                },
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-02-GOODS-EXPIRED-CERT",
            "legal_name": "Antiquated Hardware Solutions Pvt Ltd",
            "tender_config": "sample_goods.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": generate_synthetic_gstin("27", "AABCA1111A", "1"),
            "pan": "AABCA1111A",
            "cert_expiry": "2026-08-01",  # Expired before 2026-10-15 bid opening
            "local_content_percentage": 60.0,
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-03-GOODS-GSTIN-PAN-MISMATCH",
            "legal_name": "Mismatched Identity Infotech",
            "tender_config": "sample_goods.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": "27AAACT2727Q1ZW",  # Contains AAACT2727Q
            "pan": "AABCB1234F",         # Mismatched PAN
            "cert_expiry": "2027-12-31",
            "local_content_percentage": 55.0,
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-04-GOODS-GST-OVERDUE",
            "legal_name": "Bharat Tech Solutions Private Limited",
            "tender_config": "sample_goods.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": "07AABCB1234F1Z5",
            "pan": "AABCB1234F",
            "cert_expiry": "2027-04-15",
            "local_content_percentage": 55.0,
            "portal_results": {
                "gstin": {
                    "status": "ACTIVE",
                    "source": "SIMULATED",
                    "fields": {
                        "status": "ACTIVE",
                        "filing_status": "OVERDUE",
                        "last_return_type": "GSTR-3B",
                        "last_return_period": "2025-11",
                    },
                },
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-05-GOODS-DEBARRED",
            "legal_name": "Kalyani Infotech Private Limited",
            "tender_config": "sample_goods.yaml",
            "expected_state": "FAIL",
            "expected_risk": "CRITICAL",
            "gstin": "24AABCK9999K1Z2",
            "pan": "AABCK9999K",
            "cert_expiry": "2027-05-01",
            "local_content_percentage": 52.0,
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {
                    "status": "SUSPENDED",
                    "source": "SIMULATED",
                    "fields": {
                        "is_debarred": True,
                        "records": [
                            {
                                "is_active": True,
                                "scope": "org_wide",
                                "authority": "Ministry of Commerce and Industry",
                                "start_date": "2025-01-15",
                                "end_date": "2028-01-14",
                                "reason": "Submission of forged financial certificates",
                            }
                        ],
                    },
                },
            },
        },
        {
            "id": "BP-06-GOODS-LOW-LOCAL-CONTENT",
            "legal_name": "Global Import Workstations Ltd",
            "tender_config": "sample_goods.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": generate_synthetic_gstin("06", "DELHI9999C", "1"),
            "pan": "DELHI9999C",
            "cert_expiry": "2027-10-10",
            "local_content_percentage": 25.0,  # Below 50% threshold
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-07-GOODS-MISSING-PAN",
            "legal_name": "Incomplete Submissions LLP",
            "tender_config": "sample_goods.yaml",
            "expected_state": "REVIEW",
            "expected_risk": "MEDIUM",
            "gstin": "27AAACT2727Q1ZW",
            "pan": None,  # Missing PAN
            "cert_expiry": "2027-10-10",
            "local_content_percentage": 55.0,
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-08-GOODS-PORTAL-TIMEOUT",
            "legal_name": "Unverified Network Works",
            "tender_config": "sample_goods.yaml",
            "expected_state": "UNVERIFIABLE",
            "expected_risk": "MEDIUM",
            "gstin": "27AAACT2727Q1ZW",
            "pan": "AAACT2727Q",
            "cert_expiry": "2027-10-10",
            "local_content_percentage": 55.0,
            "portal_results": {
                "gstin": {"status": "TIMEOUT", "source": "SIMULATED", "error_message": "Gateway Timeout"},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-09-GOODS-MISSING-MII",
            "legal_name": "Undeclared Content Traders",
            "tender_config": "sample_goods.yaml",
            "expected_state": "REVIEW",
            "expected_risk": "MEDIUM",
            "gstin": "27AAACT2727Q1ZW",
            "pan": "AAACT2727Q",
            "cert_expiry": "2027-10-10",
            "local_content_percentage": None,  # Missing local content declaration
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },

        # --- Services Tender Variants (TNDR-SERVICES-001) ---
        {
            "id": "BP-10-SERVICES-COMPLIANT",
            "legal_name": "Delhi Digital Services Private Limited",
            "tender_config": "sample_services.yaml",
            "expected_state": "PASS",
            "expected_risk": "LOW",
            "gstin": "07AABCB1234F1Z5",
            "pan": "AABCB1234F",
            "epfo_code": "DL/CPM/0098765/000",
            "esic_code": "11009876540000202",
            "portal_results": {
                "epfo": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "members_contributed": 115}},
                "esic": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "compliance_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-11-SERVICES-ESIC-DEFAULTER",
            "legal_name": "Southern Infotech Private Limited",
            "tender_config": "sample_services.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": generate_synthetic_gstin("29", "BLORE7777F", "1"),
            "pan": "BLORE7777F",
            "epfo_code": "KA/BOM/0054321/000",
            "esic_code": "53005432100000303",
            "portal_results": {
                "epfo": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE"}},
                "esic": {"status": "INACTIVE", "source": "SIMULATED", "fields": {"status": "INACTIVE", "compliance_status": "DEFAULTER"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-12-SERVICES-EPFO-INACTIVE",
            "legal_name": "Defunct Facility Partners",
            "tender_config": "sample_services.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": generate_synthetic_gstin("29", "BLORE7777F", "1"),
            "pan": "BLORE7777F",
            "epfo_code": "KA/BOM/0054321/000",
            "esic_code": "11009876540000202",
            "portal_results": {
                "epfo": {"status": "INACTIVE", "source": "SIMULATED", "fields": {"status": "INACTIVE"}},
                "esic": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "compliance_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-13-SERVICES-MISSING-EPFO",
            "legal_name": "Unregistered Staffing Agency",
            "tender_config": "sample_services.yaml",
            "expected_state": "REVIEW",
            "expected_risk": "MEDIUM",
            "gstin": "07AABCB1234F1Z5",
            "pan": "AABCB1234F",
            "epfo_code": None,  # Missing EPFO code
            "esic_code": "11009876540000202",
            "portal_results": {
                "esic": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "compliance_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-14-SERVICES-EPFO-TIMEOUT",
            "legal_name": "Cloud Gate Services",
            "tender_config": "sample_services.yaml",
            "expected_state": "UNVERIFIABLE",
            "expected_risk": "MEDIUM",
            "gstin": "07AABCB1234F1Z5",
            "pan": "AABCB1234F",
            "epfo_code": "DL/CPM/0098765/000",
            "esic_code": "11009876540000202",
            "portal_results": {
                "epfo": {"status": "TIMEOUT", "source": "SIMULATED", "error_message": "EPFO down"},
                "esic": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "compliance_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },

        # --- MSME Tender Variants (TNDR-MSME-001) ---
        {
            "id": "BP-15-MSME-COMPLIANT-MICRO",
            "legal_name": "Apex Engineering Works",
            "tender_config": "sample_msme.yaml",
            "expected_state": "PASS",
            "expected_risk": "LOW",
            "udyam": "UDYAM-MH-12-0012345",
            "gstin": generate_synthetic_gstin("27", "ABCDE1234F", "1"),
            "pan": "ABCDE1234F",
            "local_content_percentage": 45.0,
            "portal_results": {
                "udyam": {
                    "status": "ACTIVE",
                    "source": "SIMULATED",
                    "fields": {"status": "ACTIVE", "enterprise_name": "Apex Engineering Works", "enterprise_category": "MICRO"},
                },
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-16-MSME-COMPLIANT-SMALL",
            "legal_name": "Delhi Digital Small Crafts",
            "tender_config": "sample_msme.yaml",
            "expected_state": "PASS",
            "expected_risk": "LOW",
            "udyam": "UDYAM-DL-05-0098765",
            "gstin": "07AABCB1234F1Z5",
            "pan": "AABCB1234F",
            "local_content_percentage": 35.0,
            "portal_results": {
                "udyam": {
                    "status": "ACTIVE",
                    "source": "SIMULATED",
                    "fields": {"status": "ACTIVE", "enterprise_name": "Delhi Digital Small Crafts", "enterprise_category": "SMALL"},
                },
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-17-MSME-CANCELLED-UDYAM",
            "legal_name": "Old Craft Enterprises",
            "tender_config": "sample_msme.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "udyam": "UDYAM-UP-20-0011223",
            "gstin": generate_synthetic_gstin("09", "ABCDE5678G", "1"),
            "pan": "ABCDE5678G",
            "local_content_percentage": 50.0,
            "portal_results": {
                "udyam": {
                    "status": "CANCELLED",
                    "source": "SIMULATED",
                    "fields": {"status": "CANCELLED"},
                },
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-18-MSME-MISSING-UDYAM",
            "legal_name": "Non-MSME Large Enterprise",
            "tender_config": "sample_msme.yaml",
            "expected_state": "REVIEW",
            "expected_risk": "MEDIUM",
            "udyam": None,  # Missing Udyam certificate
            "gstin": "27AAACT2727Q1ZW",
            "pan": "AAACT2727Q",
            "local_content_percentage": 50.0,
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-19-MSME-UDYAM-TIMEOUT",
            "legal_name": "Rural Micro Tech",
            "tender_config": "sample_msme.yaml",
            "expected_state": "UNVERIFIABLE",
            "expected_risk": "MEDIUM",
            "udyam": "UDYAM-MH-12-0012345",
            "gstin": generate_synthetic_gstin("27", "ABCDE1234F", "1"),
            "pan": "ABCDE1234F",
            "local_content_percentage": 50.0,
            "portal_results": {
                "udyam": {"status": "TIMEOUT", "source": "SIMULATED"},
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-20-MSME-LOW-MII",
            "legal_name": "Imported Office Supplies",
            "tender_config": "sample_msme.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "udyam": "UDYAM-MH-12-0012345",
            "gstin": generate_synthetic_gstin("27", "ABCDE1234F", "1"),
            "pan": "ABCDE1234F",
            "local_content_percentage": 10.0,  # Below 20% MSME threshold
            "portal_results": {
                "udyam": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE"}},
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-21-GOODS-DUAL-FAILURE",
            "legal_name": "Double Non-Compliant Corp",
            "tender_config": "sample_goods.yaml",
            "expected_state": "FAIL",
            "expected_risk": "HIGH",
            "gstin": generate_synthetic_gstin("27", "AABCA1111A", "1"),
            "pan": "AABCA1111A",
            "cert_expiry": "2026-01-01",  # Expired
            "local_content_percentage": 15.0,  # Low MII
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "OVERDUE"}},
                "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
            },
        },
        {
            "id": "BP-22-GOODS-SCOPED-OUT-DEBARMENT",
            "legal_name": "Permitted Category Supplier",
            "tender_config": "sample_goods.yaml",
            "expected_state": "PASS",
            "expected_risk": "LOW",
            "gstin": "27AAACT2727Q1ZW",
            "pan": "AAACT2727Q",
            "cert_expiry": "2027-12-31",
            "local_content_percentage": 60.0,
            "portal_results": {
                "gstin": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"}},
                "debarment": {
                    "status": "ACTIVE",
                    "source": "SIMULATED",
                    "fields": {
                        "is_debarred": False,
                        "records": [
                            {
                                "is_active": True,
                                "scope": "category",
                                "category": "construction_works",  # Not goods -> scoped out
                                "start_date": "2025-01-01",
                                "end_date": "2028-01-01",
                            }
                        ],
                    },
                },
            },
        },
    ]

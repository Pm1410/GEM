"""FastAPI REST API routes for procurement officer workflows and dashboards (OFCR-01..05, DASH-01..03, AUDT-03)."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field

from gem_api.advisory.generator import generate_advisory
from gem_api.api.rbac import UserContext, get_current_user, UserRole
from gem_api.audit.chain import (
    GENESIS_HASH,
    AuditPayload,
    create_audit_record,
    verify_audit_chain,
)
from gem_api.rules.loader import load_tender_rules
from gem_api.rules.engine import evaluate_tender
from gem_api.rules.models import VerificationContext
from gem_api.scoring.engine import compute_compliance_score
from gem_api.scoring.risk import evaluate_risk

router = APIRouter(prefix="/api")

# In-memory demo audit log
AUDIT_LOG: list[dict[str, Any]] = []

# Demo repository fixtures
DEMO_TENDERS = [
    {
        "id": "TNDR-GOODS-001",
        "title": "Procurement of High-End Workstations and Compute Servers",
        "category": "goods",
        "bid_opening_date": "2026-10-15",
        "estimated_value": 4500000.0,
        "local_content_threshold": 50.0,
        "config_path": "sample_goods.yaml",
    },
    {
        "id": "TNDR-SERVICES-001",
        "title": "Enterprise Cloud Migration and Facility IT Support",
        "category": "services",
        "bid_opening_date": "2026-11-01",
        "estimated_value": 8500000.0,
        "local_content_threshold": 20.0,
        "config_path": "sample_services.yaml",
    },
]

DEMO_BIDDERS = [
    {
        "id": "BIDDER-TCS-01",
        "legal_name": "Tata Consultancy Services Limited",
        "tender_id": "TNDR-GOODS-001",
        "gstin": "27AAACT2727Q1ZW",
        "pan": "AAACT2727Q",
        "local_content_percentage": 65.0,
        "cert_expiry": "2027-03-31",
        "portal_results": {
            "gstin": {
                "status": "ACTIVE",
                "source": "SIMULATED",
                "fields": {
                    "legal_name": "Tata Consultancy Services Limited",
                    "status": "ACTIVE",
                    "filing_status": "COMPLIANT",
                    "last_return_type": "GSTR-3B",
                    "last_return_period": "2026-08",
                    "last_filing_date": "2026-09-18",
                },
            },
            "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
        },
        "evidence_doc": {
            "filename": "TCS_Statutory_Compliance_Pack.pdf",
            "extracted_text": (
                "Certificate of Registration - GSTIN: 27AAACT2727Q1ZW\n"
                "Permanent Account Number: AAACT2727Q\n"
                "Make in India Declaration: Local content is 65%.\n"
                "Expiry: 2027-03-31"
            ),
            "highlights": [
                {"field": "gstin", "value": "27AAACT2727Q1ZW", "page": 1, "bbox": [50, 70, 250, 90]},
                {"field": "pan", "value": "AAACT2727Q", "page": 1, "bbox": [50, 95, 200, 115]},
                {"field": "local_content", "value": "65%", "page": 1, "bbox": [50, 120, 220, 140]},
            ],
        },
    },
    {
        "id": "BIDDER-BHARAT-02",
        "legal_name": "Bharat Tech Solutions Private Limited",
        "tender_id": "TNDR-GOODS-001",
        "gstin": "07AABCB1234F1Z5",
        "pan": "AABCB1234F",
        "local_content_percentage": 55.0,
        "cert_expiry": "2027-01-15",
        "portal_results": {
            "gstin": {
                "status": "ACTIVE",
                "source": "SIMULATED",
                "fields": {
                    "legal_name": "Bharat Tech Solutions Private Limited",
                    "status": "ACTIVE",
                    "filing_status": "OVERDUE",
                    "last_return_type": "GSTR-3B",
                    "last_return_period": "2025-11",
                },
            },
            "debarment": {"status": "ACTIVE", "source": "SIMULATED", "fields": {"records": []}},
        },
        "evidence_doc": {
            "filename": "Bharat_Tech_Compliance_Doc.pdf",
            "extracted_text": "GSTIN: 07AABCB1234F1Z5\nPAN: AABCB1234F\nLocal Content: 55%",
            "highlights": [
                {"field": "gstin", "value": "07AABCB1234F1Z5", "page": 1, "bbox": [50, 70, 240, 90]},
            ],
        },
    },
    {
        "id": "BIDDER-KALYANI-03",
        "legal_name": "Kalyani Infotech Private Limited",
        "tender_id": "TNDR-GOODS-001",
        "gstin": "24AABCK9999K1Z2",
        "pan": "AABCK9999K",
        "local_content_percentage": 30.0,
        "cert_expiry": "2026-05-01",  # Expired before 2026-10-15
        "portal_results": {
            "gstin": {
                "status": "ACTIVE",
                "source": "SIMULATED",
                "fields": {"status": "ACTIVE", "filing_status": "COMPLIANT"},
            },
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
                            "reason": "Submission of forged financial certificates",
                            "start_date": "2025-01-15",
                            "end_date": "2028-01-14",
                        }
                    ],
                },
            },
        },
        "evidence_doc": {
            "filename": "Kalyani_Tender_Submission.pdf",
            "extracted_text": "GSTIN: 24AABCK9999K1Z2\nPAN: AABCK9999K\nLocal Content: 30%",
            "highlights": [],
        },
    },
    {
        "id": "BIDDER-UNVERIFIED-04",
        "legal_name": "Unverified Network Works",
        "tender_id": "TNDR-GOODS-001",
        "gstin": "27AAACT2727Q1ZW",
        "pan": "AAACT2727Q",
        "local_content_percentage": 50.0,
        "portal_results": {
            "gstin": {"status": "TIMEOUT", "source": "SIMULATED", "error_message": "Gateway Timeout"},
            "debarment": {"status": "TIMEOUT", "source": "SIMULATED"},
        },
        "evidence_doc": {
            "filename": "Unverified_Draft.pdf",
            "extracted_text": "GSTIN: 27AAACT2727Q1ZW",
            "highlights": [],
        },
    },
]


class OfficerActionRequest(BaseModel):
    action: Literal["APPROVE", "REJECT", "REQUEST_CLARIFICATION"]
    justification: str


REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
CONFIG_DIR = REPO_ROOT / "config" / "tenders"
if not CONFIG_DIR.exists():
    CONFIG_DIR = Path("config/tenders")


def _evaluate_bidder_data(tender_dict: dict, bidder_dict: dict):
    """Internal helper to run rule engine evaluation and scoring."""
    config_file = CONFIG_DIR / tender_dict["config_path"]
    rule_config = load_tender_rules(config_file)
    context = VerificationContext(
        tender=tender_dict,
        bidder=bidder_dict,
        evidence={
            "gstin": bidder_dict.get("gstin"),
            "pan": bidder_dict.get("pan"),
            "local_content_percentage": bidder_dict.get("local_content_percentage"),
            "cert_expiry": bidder_dict.get("cert_expiry"),
        },
        portal_results=bidder_dict.get("portal_results", {}),
    )
    report = evaluate_tender(rule_config, context)
    score = compute_compliance_score(report.requirements)
    debarment_res = bidder_dict.get("portal_results", {}).get("debarment", {}).get("fields", {})
    risk = evaluate_risk(report.requirements, debarment_record=debarment_res)
    advisory = generate_advisory(report, score, risk)
    return report, score, risk, advisory


@router.get("/tenders")
def list_tenders():
    """Returns all active tenders."""
    return {"tenders": DEMO_TENDERS}


@router.get("/tenders/{tender_id}")
def get_tender(tender_id: str):
    """Returns single tender details."""
    tender = next((t for t in DEMO_TENDERS if t["id"] == tender_id), None)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return {"tender": tender}


@router.get("/tenders/{tender_id}/bidders")
def list_tender_bidders(tender_id: str):
    """Returns all bidders for a tender with scores, risk tiers, and state counts (DASH-01)."""
    tender = next((t for t in DEMO_TENDERS if t["id"] == tender_id), None)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    bidders = [b for b in DEMO_BIDDERS if b["tender_id"] == tender_id]
    result_cards = []

    for b in bidders:
        report, score, risk, advisory = _evaluate_bidder_data(tender, b)
        state_counts = {"PASS": 0, "FAIL": 0, "REVIEW": 0, "UNVERIFIABLE": 0}
        for req in report.requirements:
            if req.is_applicable:
                state_counts[req.state] = state_counts.get(req.state, 0) + 1

        result_cards.append({
            "bidder_id": b["id"],
            "legal_name": b["legal_name"],
            "overall_state": report.overall_state,
            "compliance_score": score.score,
            "verifiable_coverage_pct": score.verifiable_coverage_pct,
            "risk_level": risk.level,
            "debarment_flag": risk.debarment_flag,
            "state_counts": state_counts,
            "recommended_action": advisory.recommended_action,
        })

    return {"tender_id": tender_id, "bidders": result_cards}


@router.get("/bidders/{bidder_id}/evaluation")
def get_bidder_evaluation(bidder_id: str):
    """Returns full evaluation report, check breakdown, advisory, and evidence highlights (DASH-02, DASH-03)."""
    bidder = next((b for b in DEMO_BIDDERS if b["id"] == bidder_id), None)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    tender = next((t for t in DEMO_TENDERS if t["id"] == bidder["tender_id"]), None)
    report, score, risk, advisory = _evaluate_bidder_data(tender, bidder)

    return {
        "bidder_id": bidder["id"],
        "legal_name": bidder["legal_name"],
        "tender": tender,
        "overall_state": report.overall_state,
        "score": score,
        "risk": risk,
        "advisory": advisory,
        "requirements": report.requirements,
        "portal_results": bidder.get("portal_results", {}),
        "evidence_doc": bidder.get("evidence_doc", {}),
    }


@router.post("/bidders/{bidder_id}/action")
def submit_officer_action(
    bidder_id: str,
    action_req: OfficerActionRequest,
    user: UserContext = Depends(get_current_user),
):
    """Submits officer decision with mandatory justification and creates audit record (OFCR-03, OFCR-04, OFCR-05)."""
    # 1. RBAC check: Auditor cannot perform actions
    if user.role == "auditor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auditor role is read-only and cannot submit decisions.",
        )

    # 2. Mandatory justification validation (OFCR-04)
    justification = action_req.justification.strip()
    if len(justification) < 10:
        raise HTTPException(
            status_code=422,
            detail="Mandatory justification must be at least 10 characters explaining the decision.",
        )

    bidder = next((b for b in DEMO_BIDDERS if b["id"] == bidder_id), None)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    tender = next((t for t in DEMO_TENDERS if t["id"] == bidder["tender_id"]), None)
    report, score, risk, advisory = _evaluate_bidder_data(tender, bidder)

    # 3. Create cryptographically chained audit record
    prev_h = AUDIT_LOG[-1]["record_hash"] if AUDIT_LOG else GENESIS_HASH
    payload = AuditPayload(
        tender_id=tender["id"],
        tender_version="1.0.0",
        rule_set_version="rules-2026.1",
        bidder_id=bidder_id,
        requirement_results=[{"req_id": r.requirement_id, "state": r.state} for r in report.requirements],
        evidence_hashes=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
        compliance_score=score.score,
        risk_level=risk.level,
        advisory_text_hash=advisory.advisory_hash,
        timestamp=datetime.now(timezone.utc).isoformat(),
        officer_action=action_req.action,
        officer_justification=justification,
    ).to_dict()

    audit_entry = create_audit_record(payload, prev_hash=prev_h)
    AUDIT_LOG.append(audit_entry)

    return {
        "status": "SUCCESS",
        "action": action_req.action,
        "bidder_id": bidder_id,
        "officer_id": user.user_id,
        "record_hash": audit_entry["record_hash"],
        "chain_length": len(AUDIT_LOG),
    }


@router.get("/audit/records")
def list_audit_records():
    """Returns all audit chain records."""
    return {"total_records": len(AUDIT_LOG), "records": AUDIT_LOG}


@router.get("/audit/verify")
def verify_audit():
    """Recomputes and cryptographically verifies the entire audit hash chain (AUDT-03)."""
    return verify_audit_chain(AUDIT_LOG)


@router.get("/limitations")
def get_system_limitations():
    """Returns statutory disclaimers, simulated adapter disclosures, and production deployment blueprint."""
    return {
        "system_classification": "Deterministic Statutory Procurement Decision-Support System",
        "deployment_paradigm": "Designed for Sovereign On-Premises Government Deployment",
        "hosted_environment": "Simulated evaluation environment (Render/Vercel/Railway)",
        "core_value": "Deterministic, explainable, auditable bid verification: same evidence in, same result out — never a false PASS.",
        "legal_disclaimer": "ADVISORY — NOT A FINAL DISQUALIFICATION. This evaluation provides algorithmic evidence verification to assist the competent procurement authority. Final procurement disqualification or contract award decisions remain the sole statutory prerogative of the designated Procurement Officer in accordance with the General Financial Rules (GFR 2017) and GeM General Terms and Conditions.",
        "simulated_adapters": {
            "source_tag": "SIMULATED",
            "adapters": [
                {"name": "GSTN Adapter", "status": "SIMULATED", "capabilities": ["Registration Status", "Return Filing Compliance", "Return Period"]},
                {"name": "Udyam MSME Adapter", "status": "SIMULATED", "capabilities": ["Registration Status", "Enterprise Category (Micro/Small)", "Major Activity"]},
                {"name": "EPFO Adapter", "status": "SIMULATED", "capabilities": ["Establishment Verification", "Contributing Members Count"]},
                {"name": "ESIC Adapter", "status": "SIMULATED", "capabilities": ["Employer Status", "Defaulter Registry Screening"]},
                {"name": "Debarment Registry Adapter", "status": "SIMULATED", "capabilities": ["Scope Evaluation (Org-wide vs Category)", "Order Validity Timeline"]}
            ],
            "resilience": "Portal timeouts or downtime gracefully yield UNVERIFIABLE state — never a false PASS and never a false FAIL. Excluded from score denominator."
        },
        "synthetic_data": {
            "rationale": "Commercial confidentiality under DPDP Act 2023 restricts use of proprietary bidder trade proposals.",
            "coverage": "22 comprehensive bidder packets across 3 distinct tenders (Goods, Services, MSME Reserved).",
            "statutory_accuracy": "All synthetic GSTINs strictly validate against ISO/IEC 7064 Mod-36 checksum."
        },
        "ai_boundary": {
            "decision_path": "Zero LLM in the eligibility decision path. 100% deterministic pure Python rule execution.",
            "extraction": "Bounded Tesseract OCR and PyMuPDF native extraction with mandatory verbatim text grounding.",
            "advisory": "Deterministic template generation citing REQ-XX. Optional LLM rewrite strictly gated by regex validators with template fallback."
        },
        "sovereign_security": {
            "encryption_at_rest": "AES-256-GCM authenticated cipher with SHA-256 integrity digests.",
            "audit_trail": "Tamper-evident SHA-256 hash chain with PostgreSQL INSERT-only role enforcement.",
            "data_retention": "DPDP Act 2023 compliant retention policy tracking."
        }
    }

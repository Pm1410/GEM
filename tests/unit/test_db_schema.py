"""Unit tests for SQLAlchemy 2.0 database models and schema definitions."""

from datetime import date, datetime, timezone
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from gem_api.db import (
    Base,
    Tender,
    Bidder,
    Evidence,
    VerificationResult,
    AuditRecord,
    CREATE_AUDIT_TRIGGER_FUNCTION_SQL,
    CREATE_AUDIT_TRIGGER_SQL,
)


@pytest.fixture
def in_memory_db():
    """Provides a clean in-memory SQLite database session for schema validation."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


def test_metadata_contains_all_tables():
    expected_tables = {
        "tenders",
        "bidders",
        "evidence",
        "verification_results",
        "audit_trail",
    }
    actual_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables)


def test_primary_keys_are_uuid():
    for table_name in ["tenders", "bidders", "evidence", "verification_results", "audit_trail"]:
        table = Base.metadata.tables[table_name]
        pk_cols = [c for c in table.columns if c.primary_key]
        assert len(pk_cols) == 1
        assert pk_cols[0].name == "id"


def test_trigger_sql_definitions():
    assert "prevent_audit_tampering" in CREATE_AUDIT_TRIGGER_FUNCTION_SQL
    assert "trg_prevent_audit_tampering" in CREATE_AUDIT_TRIGGER_SQL
    assert "AUDT-02" in CREATE_AUDIT_TRIGGER_FUNCTION_SQL


def test_crud_and_relationships(in_memory_db):
    session = in_memory_db

    # 1. Create Tender
    tender = Tender(
        id=uuid.uuid4(),
        tender_id="TND-TEST-001",
        title="Test Tender",
        category="goods",
        version="1.0.0",
        rule_set_version="2026.1",
        bid_opening_date=date(2026, 3, 15),
        estimated_value=1000000.0,
        local_content_threshold=50.0,
        raw_config={"test": True}
    )
    session.add(tender)
    session.commit()

    # 2. Create Bidder
    bidder = Bidder(
        id=uuid.uuid4(),
        tender_id=tender.id,
        bidder_name="Apex Solar Ltd",
        pan="AAPFU0939F",
        gstin="27AAPFU0939F1ZV",
        udyam_number="UDYAM-MH-01-0012345",
        bidder_type="msme"
    )
    session.add(bidder)
    session.commit()

    # 3. Create Evidence
    evidence = Evidence(
        id=uuid.uuid4(),
        bidder_id=bidder.id,
        doc_type="gst_cert",
        file_name="gst_cert.pdf",
        file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        extracted_fields={"gstin": "27AAPFU0939F1ZV"},
        is_grounded=True
    )
    session.add(evidence)

    # 4. Create Verification Result
    result = VerificationResult(
        id=uuid.uuid4(),
        bidder_id=bidder.id,
        tender_id=tender.id,
        overall_state="PASS",
        compliance_score=100.0,
        risk_level="LOW",
        requirement_results=[{"id": "REQ-01", "state": "PASS"}]
    )
    session.add(result)

    # 5. Create Audit Record
    audit = AuditRecord(
        id=uuid.uuid4(),
        tender_id=tender.id,
        bidder_id=bidder.id,
        event_type="EVALUATION_COMPLETED",
        prev_hash="0" * 64,
        record_hash="a" * 64,
        payload={"score": 100.0}
    )
    session.add(audit)
    session.commit()

    # Query back and verify relationships
    fetched_tender = session.query(Tender).filter_by(tender_id="TND-TEST-001").first()
    assert fetched_tender is not None
    assert len(fetched_tender.bidders) == 1
    assert fetched_tender.bidders[0].bidder_name == "Apex Solar Ltd"
    assert len(fetched_tender.bidders[0].evidence) == 1
    assert fetched_tender.bidders[0].evidence[0].doc_type == "gst_cert"
    assert len(fetched_tender.verification_results) == 1
    assert fetched_tender.verification_results[0].overall_state == "PASS"

    fetched_audit = session.query(AuditRecord).filter_by(record_hash="a" * 64).first()
    assert fetched_audit is not None
    assert fetched_audit.event_type == "EVALUATION_COMPLETED"

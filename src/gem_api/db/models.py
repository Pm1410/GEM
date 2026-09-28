"""Declarative database models for the GeM Bid Verification Platform."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Table,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import relationship

from gem_api.db.session import Base

# Universal JSON and UUID types
JSONType = JSONB().with_variant(JSON, "sqlite")
UUIDType = Uuid(as_uuid=True).with_variant(PG_UUID(as_uuid=True), "postgresql")


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    tender_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    version = Column(String(32), nullable=False, default="1.0.0")
    rule_set_version = Column(String(32), nullable=False)
    bid_opening_date = Column(Date, nullable=False)
    estimated_value = Column(Float, nullable=True)
    local_content_threshold = Column(Float, nullable=True)
    raw_config = Column(JSONType, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    bidders = relationship("Bidder", back_populates="tender", cascade="all, delete-orphan")
    verification_results = relationship("VerificationResult", back_populates="tender", cascade="all, delete-orphan")


class Bidder(Base):
    __tablename__ = "bidders"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUIDType, ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_name = Column(String(255), nullable=False)
    pan = Column(String(10), nullable=False, index=True)
    gstin = Column(String(15), nullable=True, index=True)
    udyam_number = Column(String(19), nullable=True)
    bidder_type = Column(String(64), nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    tender = relationship("Tender", back_populates="bidders")
    evidence = relationship("Evidence", back_populates="bidder", cascade="all, delete-orphan")
    verification_results = relationship("VerificationResult", back_populates="bidder", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    bidder_id = Column(UUIDType, ForeignKey("bidders.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_type = Column(String(64), nullable=False)  # e.g., 'gst_cert', 'pan_card', 'udyam_cert'
    file_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False)  # SHA-256 hash of raw document
    extracted_fields = Column(JSONType, nullable=False, default=dict)
    is_grounded = Column(Boolean, nullable=False, default=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    bidder = relationship("Bidder", back_populates="evidence")


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    bidder_id = Column(UUIDType, ForeignKey("bidders.id", ondelete="CASCADE"), nullable=False, index=True)
    tender_id = Column(UUIDType, ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_state = Column(String(32), nullable=False)  # PASS, FAIL, REVIEW, UNVERIFIABLE
    compliance_score = Column(Float, nullable=True)
    risk_level = Column(String(32), nullable=True)  # LOW, MEDIUM, HIGH
    requirement_results = Column(JSONType, nullable=False, default=list)
    evaluated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    tender = relationship("Tender", back_populates="verification_results")
    bidder = relationship("Bidder", back_populates="verification_results")


class AuditRecord(Base):
    """Tamper-evident append-only audit trail table (AUDT-01, AUDT-02)."""
    __tablename__ = "audit_trail"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUIDType, nullable=False, index=True)
    bidder_id = Column(UUIDType, nullable=True, index=True)
    event_type = Column(String(64), nullable=False)  # e.g., 'EVALUATION', 'OFFICER_OVERRIDE'
    prev_hash = Column(String(64), nullable=False)
    record_hash = Column(String(64), nullable=False, index=True)
    payload = Column(JSONType, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

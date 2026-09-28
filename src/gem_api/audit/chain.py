"""Cryptographic tamper-evident audit hash chain and verification engine (AUDT-01, AUDT-03, AUDT-04)."""

from dataclasses import dataclass, asdict
import hashlib
import json
from typing import Any, Optional

GENESIS_HASH = "0" * 64


@dataclass
class AuditPayload:
    """Normalized audit record payload structure (AUDT-01, AUDT-04)."""
    tender_id: str
    tender_version: str
    rule_set_version: str
    bidder_id: str
    requirement_results: list[dict[str, Any]]
    evidence_hashes: list[str]
    compliance_score: float
    risk_level: str
    advisory_text_hash: str
    timestamp: str  # ISO-8601 UTC
    officer_action: Optional[str] = None
    officer_justification: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class AuditChainVerificationResult:
    """Verification outcome across an entire audit log sequence (AUDT-03)."""
    is_valid: bool
    total_records: int
    broken_index: Optional[int] = None
    expected_hash: Optional[str] = None
    computed_hash: Optional[str] = None
    message: str = "Audit trail is intact and verified."


def canonical_json(data: dict[str, Any]) -> str:
    """Serializes dictionary to deterministic canonical JSON with sorted keys and minimal separators."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)


def compute_record_hash(prev_hash: str, payload: dict[str, Any]) -> str:
    """Computes SHA-256 hash chaining: sha256(prev_hash + canonical_json(payload)).

    Enforces AUDT-01.
    """
    serialized = canonical_json(payload)
    hasher = hashlib.sha256()
    hasher.update(prev_hash.encode("utf-8"))
    hasher.update(serialized.encode("utf-8"))
    return hasher.hexdigest()


def create_audit_record(
    payload: dict[str, Any],
    prev_hash: Optional[str] = None,
) -> dict[str, Any]:
    """Constructs a chained audit record dictionary."""
    actual_prev_hash = prev_hash if prev_hash else GENESIS_HASH
    rec_hash = compute_record_hash(actual_prev_hash, payload)
    return {
        "prev_hash": actual_prev_hash,
        "record_hash": rec_hash,
        "payload": payload,
    }


def verify_audit_chain(records: list[dict[str, Any]]) -> AuditChainVerificationResult:
    """Validates full audit trail sequence from genesis to present (AUDT-03).

    Recomputes hashes and verifies that every link is unbroken and no payload
    was tampered with after creation.
    """
    if not records:
        return AuditChainVerificationResult(
            is_valid=True,
            total_records=0,
            message="Audit log is empty.",
        )

    expected_prev = GENESIS_HASH

    for idx, rec in enumerate(records):
        prev_h = rec.get("prev_hash")
        rec_h = rec.get("record_hash")
        payload = rec.get("payload", {})

        # 1. Verify prev_hash linkage
        if prev_h != expected_prev:
            return AuditChainVerificationResult(
                is_valid=False,
                total_records=len(records),
                broken_index=idx,
                expected_hash=expected_prev,
                computed_hash=prev_h,
                message=f"Broken chain link at index {idx}: prev_hash does not match preceding record_hash.",
            )

        # 2. Recompute payload hash
        computed_h = compute_record_hash(prev_h, payload)
        if computed_h != rec_h:
            return AuditChainVerificationResult(
                is_valid=False,
                total_records=len(records),
                broken_index=idx,
                expected_hash=rec_h,
                computed_hash=computed_h,
                message=f"Tampered record at index {idx}: payload content does not match recorded record_hash.",
            )

        expected_prev = rec_h

    return AuditChainVerificationResult(
        is_valid=True,
        total_records=len(records),
        message=f"Audit trail verified: all {len(records)} records are cryptographically intact.",
    )

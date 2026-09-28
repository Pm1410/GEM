"""Unit tests for cryptographic audit hash chain (Phase 3 - Plan 02)."""

import pytest
from datetime import datetime, timezone

from gem_api.audit import (
    GENESIS_HASH,
    AuditPayload,
    canonical_json,
    compute_record_hash,
    create_audit_record,
    verify_audit_chain,
)


def _sample_payload(bidder_id: str, score: float = 100.0) -> dict:
    return AuditPayload(
        tender_id="TNDR-2026-GOODS-001",
        tender_version="1.0.0",
        rule_set_version="rules-2026.1",
        bidder_id=bidder_id,
        requirement_results=[{"req_id": "REQ-GSTIN", "state": "PASS"}],
        evidence_hashes=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
        compliance_score=score,
        risk_level="LOW",
        advisory_text_hash="11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
        timestamp=datetime.now(timezone.utc).isoformat(),
        officer_action="APPROVED",
        officer_justification="Bidder fully satisfied all statutory requirements.",
    ).to_dict()


def test_canonical_json_determinism():
    d1 = {"b": 2, "a": 1, "c": [3, 2, 1]}
    d2 = {"a": 1, "c": [3, 2, 1], "b": 2}
    assert canonical_json(d1) == canonical_json(d2)


def test_compute_record_hash_deterministic():
    p = _sample_payload("BIDDER-01")
    h1 = compute_record_hash(GENESIS_HASH, p)
    h2 = compute_record_hash(GENESIS_HASH, p)
    assert h1 == h2
    assert len(h1) == 64

    # Altering any field must alter the hash
    p_mutated = dict(p)
    p_mutated["compliance_score"] = 99.0
    h_mutated = compute_record_hash(GENESIS_HASH, p_mutated)
    assert h1 != h_mutated


def test_clean_chain_verification():
    records = []
    prev_h = GENESIS_HASH

    for i in range(5):
        payload = _sample_payload(f"BIDDER-0{i}", score=90.0 + i)
        rec = create_audit_record(payload, prev_hash=prev_h)
        records.append(rec)
        prev_h = rec["record_hash"]

    res = verify_audit_chain(records)
    assert res.is_valid is True
    assert res.total_records == 5
    assert res.broken_index is None


def test_tamper_payload_detection():
    records = []
    prev_h = GENESIS_HASH

    for i in range(4):
        payload = _sample_payload(f"BIDDER-0{i}")
        rec = create_audit_record(payload, prev_hash=prev_h)
        records.append(rec)
        prev_h = rec["record_hash"]

    # Tamper with payload of record 2 (e.g. illegally change score or officer decision)
    records[2]["payload"]["officer_action"] = "REJECTED"

    res = verify_audit_chain(records)
    assert res.is_valid is False
    assert res.broken_index == 2
    assert "Tampered record at index 2" in res.message


def test_tamper_prev_hash_detection():
    records = []
    prev_h = GENESIS_HASH

    for i in range(3):
        payload = _sample_payload(f"BIDDER-0{i}")
        rec = create_audit_record(payload, prev_hash=prev_h)
        records.append(rec)
        prev_h = rec["record_hash"]

    # Corrupt prev_hash of record 1
    records[1]["prev_hash"] = "f" * 64

    res = verify_audit_chain(records)
    assert res.is_valid is False
    assert res.broken_index == 1
    assert "Broken chain link at index 1" in res.message


def test_deletion_detection():
    records = []
    prev_h = GENESIS_HASH

    for i in range(4):
        payload = _sample_payload(f"BIDDER-0{i}")
        rec = create_audit_record(payload, prev_hash=prev_h)
        records.append(rec)
        prev_h = rec["record_hash"]

    # Delete record 1
    del records[1]

    # Chain should break at index 1 because record 2's prev_hash points to deleted record 1
    res = verify_audit_chain(records)
    assert res.is_valid is False
    assert res.broken_index == 1

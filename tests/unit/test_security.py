"""Unit tests for evidence encryption at rest and retention policy enforcement (Phase 3 - Plan 02)."""

import pytest
from datetime import datetime, timezone, timedelta

from gem_api.security import (
    generate_data_key,
    encrypt_document,
    decrypt_document,
    compute_retention_policy,
    is_retention_expired,
)


def test_encryption_roundtrip():
    key = generate_data_key()
    assert len(key) == 32

    original_doc = b"%PDF-1.4 Official Certificate of Registration for GeM Tender"
    blob = encrypt_document(original_doc, key)

    assert blob.ciphertext != original_doc
    assert len(blob.nonce) == 12
    assert len(blob.sha256_digest) == 64

    decrypted = decrypt_document(blob, key)
    assert decrypted == original_doc


def test_encryption_wrong_key_fails():
    key1 = generate_data_key()
    key2 = generate_data_key()

    original_doc = b"Secret Financial Statement"
    blob = encrypt_document(original_doc, key1)

    with pytest.raises(ValueError, match="Decryption authentication failed"):
        decrypt_document(blob, key2)


def test_encryption_tampered_ciphertext_fails():
    key = generate_data_key()
    original_doc = b"Confidential Technical Bid Document"
    blob = encrypt_document(original_doc, key)

    # Tamper with the ciphertext byte
    tampered_bytes = bytearray(blob.ciphertext)
    tampered_bytes[5] ^= 0xFF
    blob.ciphertext = bytes(tampered_bytes)

    with pytest.raises(ValueError, match="Decryption authentication failed"):
        decrypt_document(blob, key)


def test_encryption_empty_or_bad_key():
    key = generate_data_key()
    with pytest.raises(ValueError, match="empty data"):
        encrypt_document(b"", key)

    with pytest.raises(ValueError, match="32 bytes"):
        encrypt_document(b"data", b"short_key")


# --- Test Retention Policy ---

def test_retention_policy_active():
    now = datetime.now(timezone.utc)
    policy = compute_retention_policy(created_at=now, retention_days=1825)

    assert policy.retention_days == 1825
    assert policy.is_expired is False
    assert policy.purge_status == "RETAINED"
    assert policy.expires_at > now + timedelta(days=1824)


def test_retention_policy_expired():
    past_date = datetime.now(timezone.utc) - timedelta(days=2000)
    policy = compute_retention_policy(created_at=past_date, retention_days=1825)

    assert policy.is_expired is True
    assert is_retention_expired(policy) is True

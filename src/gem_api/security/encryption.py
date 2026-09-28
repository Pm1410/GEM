"""AES-256-GCM authenticated encryption for evidence documents at rest (SECR-03)."""

from dataclasses import dataclass
import hashlib
import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


@dataclass
class EncryptedBlob:
    """Encrypted binary payload with authenticated nonce and original SHA-256 digest."""
    ciphertext: bytes
    nonce: bytes
    sha256_digest: str


def generate_data_key() -> bytes:
    """Generates a secure 256-bit symmetric key for AES-GCM encryption."""
    return AESGCM.generate_key(bit_length=256)


def encrypt_document(data: bytes, key: bytes) -> EncryptedBlob:
    """Encrypts document bytes at rest using AES-256-GCM authenticated cipher.

    SECR-03: Stored documents encrypted at rest.
    """
    if not data:
        raise ValueError("Cannot encrypt empty data.")
    if len(key) != 32:
        raise ValueError("AES-256 key must be exactly 32 bytes.")

    sha256_digest = hashlib.sha256(data).hexdigest()
    nonce = os.urandom(12)  # Standard 96-bit nonce for GCM
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, data, None)

    return EncryptedBlob(
        ciphertext=ciphertext,
        nonce=nonce,
        sha256_digest=sha256_digest,
    )


def decrypt_document(blob: EncryptedBlob, key: bytes) -> bytes:
    """Decrypts and authenticates document bytes using AES-256-GCM.

    Verifies integrity against original sha256_digest.
    """
    if len(key) != 32:
        raise ValueError("AES-256 key must be exactly 32 bytes.")

    aesgcm = AESGCM(key)
    try:
        plaintext = aesgcm.decrypt(blob.nonce, blob.ciphertext, None)
    except Exception as e:
        raise ValueError(f"Decryption authentication failed: {e}")

    computed_digest = hashlib.sha256(plaintext).hexdigest()
    if computed_digest != blob.sha256_digest:
        raise ValueError("Decrypted plaintext does not match authenticated SHA-256 digest.")

    return plaintext

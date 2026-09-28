"""File upload validation and text sanitization (EXTR-01, EXTR-02, SECR-01)."""

import os
import re
import unicodedata
from typing import Set

ALLOWED_MIME_TYPES: Set[str] = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/pjpeg",
}

ALLOWED_EXTENSIONS: Set[str] = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Magic bytes signatures
MAGIC_BYTES = {
    "pdf": b"%PDF",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpeg": b"\xff\xd8\xff",
}

# Control characters and directional overrides regex
ZERO_WIDTH_CHARS = re.compile(r"[\u200B-\u200D\uFEFF\u2060]")
DIRECTIONAL_OVERRIDES = re.compile(r"[\u202A-\u202E\u2066-\u2069]")


def validate_file_upload(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    max_size_mb: int = 10,
) -> bool:
    """Validates uploaded file against size, MIME type, and magic bytes.

    Raises ValueError if validation fails.
    """
    max_bytes = max_size_mb * 1024 * 1024
    if len(file_bytes) == 0:
        raise ValueError("Uploaded file is empty.")

    if len(file_bytes) > max_bytes:
        raise ValueError(
            f"File size ({len(file_bytes)} bytes) exceeds the maximum allowed limit of {max_size_mb}MB."
        )

    # Validate file extension
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File extension '{ext}' is not permitted. Allowed: {ALLOWED_EXTENSIONS}")

    # Validate MIME type
    clean_mime = content_type.lower().split(";")[0].strip()
    if clean_mime not in ALLOWED_MIME_TYPES:
        raise ValueError(f"MIME type '{clean_mime}' is not permitted. Allowed: {ALLOWED_MIME_TYPES}")

    # Validate magic bytes
    if clean_mime == "application/pdf" or ext == ".pdf":
        if not file_bytes.startswith(MAGIC_BYTES["pdf"]):
            raise ValueError("File content does not match PDF magic header (%PDF).")
    elif clean_mime == "image/png" or ext == ".png":
        if not file_bytes.startswith(MAGIC_BYTES["png"]):
            raise ValueError("File content does not match PNG magic header.")
    elif clean_mime in ("image/jpeg", "image/pjpeg") or ext in (".jpg", ".jpeg"):
        if not file_bytes.startswith(MAGIC_BYTES["jpeg"]):
            raise ValueError("File content does not match JPEG magic header.")

    return True


def sanitize_text(text: str) -> str:
    """Normalizes unicode and strips hidden, invisible, or control characters.

    Enforces EXTR-02 & SECR-01.
    """
    if not text:
        return ""

    # Normalize unicode representations to NFKC
    normalized = unicodedata.normalize("NFKC", text)

    # Remove zero-width characters
    normalized = ZERO_WIDTH_CHARS.sub("", normalized)

    # Remove directional formatting overrides
    normalized = DIRECTIONAL_OVERRIDES.sub("", normalized)

    # Strip null bytes and non-printable ASCII control characters except \n, \r, \t
    cleaned_chars = []
    for ch in normalized:
        code = ord(ch)
        if code == 0:
            continue
        if code < 32 and ch not in ("\n", "\r", "\t"):
            continue
        cleaned_chars.append(ch)

    return "".join(cleaned_chars)

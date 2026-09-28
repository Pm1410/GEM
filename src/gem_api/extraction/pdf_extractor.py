"""Document extraction pipeline with native PyMuPDF and OCR fallback (EXTR-01, EXTR-03)."""

from dataclasses import dataclass, field
import io
import logging
from typing import Any, Optional

import pymupdf
from PIL import Image
import pytesseract

from gem_api.extraction.sanitizer import validate_file_upload, sanitize_text

logger = logging.getLogger(__name__)

MIN_TEXT_CHARS_THRESHOLD = 50


@dataclass
class PageData:
    """Extracted text and structural block data for a single document page."""
    page_number: int
    text: str
    is_ocr: bool = False
    blocks: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class ExtractedDocument:
    """Full extracted document representation with page-level access."""
    pages: list[PageData]
    total_pages: int
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def full_text(self) -> str:
        """Concatenated text of all pages separated by newlines."""
        return "\n\n".join(p.text for p in self.pages if p.text)


def _ocr_image(img: Image.Image) -> str:
    """Attempts OCR extraction using pytesseract with graceful degradation."""
    try:
        raw_text = pytesseract.image_to_string(img)
        return raw_text.strip()
    except Exception as e:
        logger.warning("OCR extraction failed or Tesseract binary unavailable: %s", e)
        return ""


def extract_document(
    file_bytes: bytes,
    filename: str = "document.pdf",
    content_type: str = "application/pdf",
    validate: bool = True,
) -> ExtractedDocument:
    """Extracts text and layout from PDF or image documents.

    Uses PyMuPDF for born-digital PDFs; falls back to OCR if text density is below threshold.
    """
    if validate:
        validate_file_upload(file_bytes, filename=filename, content_type=content_type)

    is_pdf = content_type.lower() == "application/pdf" or filename.lower().endswith(".pdf")

    if is_pdf:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        pages: list[PageData] = []

        for idx, page in enumerate(doc):
            page_num = idx + 1
            raw_text = page.get_text() or ""
            is_ocr = False
            blocks_data: list[dict[str, Any]] = []

            # Extract block positions if available
            try:
                raw_blocks = page.get_text("blocks")
                for b in raw_blocks:
                    # b: (x0, y0, x1, y1, text, block_no, block_type)
                    if len(b) >= 5 and b[4].strip():
                        blocks_data.append({
                            "bbox": (b[0], b[1], b[2], b[3]),
                            "text": sanitize_text(b[4]),
                            "block_num": b[5] if len(b) > 5 else 0,
                        })
            except Exception:
                pass

            # Low text density triggers OCR fallback
            if len(raw_text.strip()) < MIN_TEXT_CHARS_THRESHOLD:
                try:
                    pix = page.get_pixmap(dpi=150)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_text = _ocr_image(img)
                    if len(ocr_text) > len(raw_text.strip()):
                        raw_text = ocr_text
                        is_ocr = True
                except Exception as ex:
                    logger.debug("Pix-map rendering or OCR fallback skipped: %s", ex)

            clean_page_text = sanitize_text(raw_text)
            pages.append(
                PageData(
                    page_number=page_num,
                    text=clean_page_text,
                    is_ocr=is_ocr,
                    blocks=blocks_data,
                )
            )

        metadata = {
            "format": doc.metadata.get("format", "PDF"),
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "page_count": len(pages),
        }
        doc.close()
        return ExtractedDocument(pages=pages, total_pages=len(pages), metadata=metadata)

    else:
        # Image file (PNG / JPEG)
        img = Image.open(io.BytesIO(file_bytes))
        ocr_text = _ocr_image(img)
        clean_text = sanitize_text(ocr_text)
        page = PageData(page_number=1, text=clean_text, is_ocr=True, blocks=[])
        return ExtractedDocument(
            pages=[page],
            total_pages=1,
            metadata={"format": img.format, "size": img.size},
        )

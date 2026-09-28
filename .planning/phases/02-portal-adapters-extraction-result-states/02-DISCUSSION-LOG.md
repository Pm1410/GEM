# Phase 2: Portal Adapters, Extraction & Result States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-28
**Phase:** 2-Portal Adapters, Extraction & Result States
**Areas discussed:** Portal Adapters & Mock Data, Extraction Pipeline & Grounding, Result State Semantics

---

## Autonomous Mode Selection
All recommended options auto-selected per user configuration (`discuss_mode: auto`):
- **Mock Adapters:** In-memory synthetic dataset dictionary with simulated latency and injectable errors/timeouts.
- **Extraction Pipeline:** Native PyMuPDF first, OpenCV + Tesseract OCR fallback for scanned pages.
- **Grounding Rule:** Strict verbatim substring check in source text; ungrounded fields transition requirement to REVIEW.
- **Result States Hierarchy:** FAIL > REVIEW > UNVERIFIABLE > PASS with timeout mapping to UNVERIFIABLE.

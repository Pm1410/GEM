# Phase 5: Synthetic Data & Evaluation - Research

**Researched:** 2026-09-28
**Domain:** Synthetic Procurement Data Generation, Mod-36 Checksum Generation, Realistic Document Rendering, Evaluation Benchmarks
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 3 tenders with distinct rule combinations (DATA-01): goods, services, and MSME preference.
- **D-02:** 20+ bidder packs representing case variants (DATA-02): compliant, missing doc, expired cert, mismatch, overdue GST, debarred, ambiguous (REVIEW), portal down (UNVERIFIABLE).
- **D-03:** Realistic rendered PDFs with headers, layout, stamps (DATA-03).
- **D-04:** Synthetic GSTINs generated with valid Mod-36 checksums (DATA-04).
- **D-05:** Evaluation report reporting deterministic verification separately from extraction accuracy (EVAL-01).
- **D-06:** Report metric: "zero false-PASS observed across N synthetic cases" (EVAL-02).
- **D-07:** Manual baseline timing comparison (EVAL-03).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mod-36 GSTIN Generator | Synthetic Engine | — | Pure function computing valid Mod-36 check digits |
| Document PDF Generator | Synthetic Engine | File System | PyMuPDF-based PDF generator rendering realistic certificates |
| Bidder Pack Repository | Synthetic Engine | JSON / YAML | Stores 22 structured bidder profiles with simulated attachments |
| Evaluation Benchmark | CLI / Script | Reporting | Executes full verification pipeline and produces metric reports |

</architectural_responsibility_map>

<standard_stack>
## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pymupdf | 1.24+ | PDF Document Generation | Fast, precise coordinate drawing, font rendering |
| pytest | 8.3+ | Automated verification | Standard Python testing framework |

</standard_stack>

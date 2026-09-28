# Phase 5: Synthetic Data & Evaluation - Discussion Log

**Mode:** Autonomous (Recommended Options Auto-Selected)
**Date:** 2026-09-28

## Decisions Selected

1. **Synthetic Case Coverage (DATA-01, DATA-02):**
   - *Option:* 3 distinct tenders (Goods, Services, MSME) with a full matrix of 22 distinct bidder variant packs.
   - *Rationale:* Thoroughly tests every branch of statutory checks (Mod-36 GSTIN, PAN, Udyam, EPFO, ESIC, Debarment) and all four outcome states.
2. **Mod-36 Synthetic Generation (DATA-04):**
   - *Option:* Programmatic generator calculating the exact Mod-36 check character for arbitrary valid prefix tuples.
   - *Rationale:* Guarantees synthetic GSTINs pass both regex and statutory checksum validation.
3. **Evaluation Reporting Format (EVAL-01, EVAL-02, EVAL-03):**
   - *Option:* Explicit statement: "Zero false-PASS observed across 22 synthetic test cases", reporting deterministic rule verification separately from OCR extraction rate.
   - *Rationale:* Avoids dishonest percentage claims from small datasets; provides genuine hackathon evaluation rigor.

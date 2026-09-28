# Phase 5: Synthetic Data & Evaluation - Context

**Created:** 2026-09-28
**Status:** Approved (Autonomous Mode)

## Context & Architecture Contract

### 1. Synthetic Tender Matrix (DATA-01)
- 3 Distinct Tender YAML Configurations:
  1. `TNDR-GOODS-001` (Goods): Requires valid GSTIN, matching PAN, 50% Make in India local content, active debarment check, and statutory certificate validity.
  2. `TNDR-SERVICES-001` (Services): Requires EPFO establishment registration, ESIC employer registration, GST filing compliance, and debarment clearance.
  3. `TNDR-MSME-001` (MSME-Preference): Requires valid Udyam registration (Micro/Small enterprise category), 20% MII threshold, GSTIN-PAN cross-check.

### 2. 20+ Synthetic Bidder Case Variants (DATA-02, DATA-04)
- 20+ Bidder Packs representing realistic procurement scenarios:
  1. Fully compliant goods bidder
  2. Fully compliant services bidder
  3. Fully compliant MSME bidder
  4. Missing statutory document (e.g., missing PAN) -> triggers `REVIEW`
  5. Expired certificate (expired prior to bid opening date) -> triggers `FAIL`
  6. GSTIN-PAN mismatch (mismatched entity PAN embedded in GSTIN) -> triggers `FAIL`
  7. Overdue GST return filing (`filing_status: OVERDUE`) -> triggers `FAIL`
  8. Actively debarred entity (Ministry of Commerce debarment order) -> triggers `FAIL` and `CRITICAL` risk
  9. Ambiguous / ungrounded extraction (hallucinated GSTIN not in text) -> triggers `REVIEW`
  10. Portal outage / timeout (simulated GSTN portal down) -> triggers `UNVERIFIABLE`
  11. Low local content (30% vs 50% threshold) -> triggers `FAIL`
  12. ESIC defaulter status -> triggers `FAIL`
  13. Cancelled Udyam registration -> triggers `FAIL`
  14..24. Additional mixed-variant cases ensuring full state-space exploration.
- Synthetic GSTINs generated with mathematically verified Mod-36 checksums (DATA-04).

### 3. Realistic PDF Document Generation (DATA-03)
- Synthetic document generator creates realistic PDF documents using PyMuPDF:
  - Certificates with official layout headers ("Government of India", "Form GST REG-06", "Udyam Registration Certificate").
  - Simulated physical scan effects (slight skew, background grain/noise texture, border stamps).
  - Born-digital vs scanned image variants exercising both PyMuPDF native extraction and OCR fallback.

### 4. Zero False-PASS Evaluation Benchmark (EVAL-01, EVAL-02, EVAL-03)
- Automated evaluation script executes all 20+ bidder packs across all 3 tenders.
- Strict evaluation metrics:
  - Zero False-PASS guarantee: 0 false PASS results across all synthetic test cases (EVAL-02).
  - Deterministic check precision & recall reported separately from OCR field extraction accuracy (EVAL-01).
  - Baseline comparison: automated platform latency (~200ms) vs recorded manual officer evaluation baseline (~15-20 minutes) (EVAL-03).

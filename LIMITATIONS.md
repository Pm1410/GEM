# GeM Bid Eligibility Verification Platform — System Limitations & Production Architecture Blueprint

**Problem Statement:** SIH26100 — Automated Bid-Eligibility Verification for Government e-Marketplace (GeM)  
**System Classification:** Deterministic Statutory Procurement Decision-Support System  
**Deployment Paradigm:** Designed for Sovereign On-Premises Government Deployment  

---

## Executive Summary & Core Value
The GeM Bid Eligibility Verification Platform is architected upon a non-negotiable core principle: **Deterministic, explainable, auditable bid verification: same evidence in, same result out — never a false PASS.**

To maintain absolute procurement integrity and compliance with Indian statutory procurement regulations (General Financial Rules 2017, GeM GTC, DPDP Act 2023), this document provides full institutional transparency regarding the system's operational boundaries, synthetic data model, simulation adapters, and the concrete transition path to full-scale government deployment.

---

## 1. Simulated Portal Adapters (`source: "SIMULATED"`)

### Context & Constraint
Production integration with statutory government registries (GSTN, Ministry of MSME Udyam, EPFO Shram Suvidha, ESIC, and Central Debarment Lists) requires:
1. Departmental authorization and bilateral Data Sharing Agreements (MoUs).
2. Licensed GSP (GST Suvidha Provider) credentials with dedicated hardware security modules (HSMs).
3. Whitelisted static government IP ranges not accessible during open hackathon prototyping.

### Prototype Architecture
All external registry adapters in this prototype implement the frozen `BasePortalAdapter` interface with pure mock drivers:
- **`MockGSTNAdapter`**: Simulates live GSTIN entity search, registration status (`ACTIVE`/`CANCELLED`), and return filing status (`COMPLIANT`/`OVERDUE`).
- **`MockUdyamAdapter`**: Simulates Udyam registration lookup and enterprise category classification (`MICRO`/`SMALL`/`MEDIUM`/`CANCELLED`).
- **`MockEPFOAdapter`**: Simulates EPFO establishment verification and member contribution status.
- **`MockESICAdapter`**: Simulates ESIC employer verification and compliance standing (`COMPLIANT`/`DEFAULTER`).
- **`MockDebarmentAdapter`**: Simulates Central Procurement Debarment register with multi-level scope evaluation (`org_wide` vs `category`).

### Resilience & Integrity Guarantees
- Every simulated payload includes an explicit `source: "SIMULATED"` metadata tag.
- All adapters feature injectable latency, transient 503/timeout simulation, and simulated network partitions.
- **Statutory Fail-Safe:** When a portal adapter times out or becomes unreachable, the platform transitions the check to **`UNVERIFIABLE`**. It **never yields a false PASS** and **never causes a false disqualification (FAIL)**. The check is excluded from the score denominator (`SCOR-03`), and flagged for officer review.

### Production Transition Blueprint
The adapter layer is decoupled from the rule engine via dependency injection. Transitioning to production requires zero changes to core business logic:
1. Implement `ProductionGSTNAdapter` adhering to `BasePortalAdapter` consuming the official GSTN GSP API.
2. Implement `ProductionUdyamAdapter` consuming the MSME Ministry API sandbox.
3. Configure mTLS client certificates and HSM-backed digital signatures in government secure zones.

---

## 2. Synthetic Test Datasets (`DATA-01` to `DATA-04`)

### Context & Confidentiality
Real-world bidder bid packets submitted on GeM contain proprietary commercial information, proprietary technical proposals, and confidential financial disclosures. Using real tender packs without bidder consent violates commercial confidentiality and DPDP Act 2023 principles.

### Methodology
The platform includes an automated synthetic data generator (`src/gem_api/synthetic/`):
- **3 Realistically Configured Tenders:**
  - `sample_goods.yaml`: High-value goods procurement with 50% Make-in-India threshold, PAN-GSTIN linkage, and debarment screening.
  - `sample_services.yaml`: Facility management services requiring statutory EPFO establishment and ESIC employer registrations.
  - `sample_msme.yaml`: Reserved MSME procurement requiring Micro/Small Udyam registration, 20% local content, and active return filing.
- **22 Diverse Bidder Packs:**
  - Exhaustive test cases covering compliant bidders, expired certificates, PAN-GSTIN mismatches, overdue GSTR-3B filings, active blacklisting orders, out-of-scope debarments, missing documents, and portal timeouts.
- **Official Mod-36 Checksum Validation:**
  - All synthetic GSTINs are generated using the statutory Mod-36 checksum algorithm (ISO/IEC 7064). No randomized invalid strings are used for passing cases.

---

## 3. Rule Coverage vs. Legal Completeness

### Algorithmic Verification Scope
The rule library claims **engine correctness and statutory coverage for evaluated rules**, not exhaustive legal advice or final disqualification authority:
- **Tender Bid Opening Date Standard:** Statutory certificates (GST, PAN, MSME, OEM) are strictly evaluated against the tender's **`bid_opening_date`**, **not calendar today**. This prevents valid bids submitted on time from being penalized due to evaluation delays.
- **Four Distinct States:** Every requirement resolves deterministically into one of four states:
  - `PASS`: Full statutory compliance verified with verbatim document grounding.
  - `FAIL`: Explicit violation of a mandatory tender requirement or active debarment order.
  - `REVIEW`: Incomplete data, ungrounded extraction, or missing optional documents requiring officer review.
  - `UNVERIFIABLE`: External portal unavailable; system retries with backoff and excludes from score denominator.

### Mandatory Legal Disclaimer
Every generated advisory and API response incorporates the mandatory statutory disclaimer:
> **"ADVISORY — NOT A FINAL DISQUALIFICATION.** This evaluation provides algorithmic evidence verification to assist the competent procurement authority. Final procurement disqualification or contract award decisions remain the sole statutory prerogative of the designated Procurement Officer in accordance with the General Financial Rules (GFR 2017) and GeM General Terms and Conditions."

---

## 4. Artificial Intelligence Boundary

### The Zero-LLM Principle in Decision Making
In public procurement, non-deterministic AI models (LLMs) cannot be permitted in the decision path:
- Hallucinations can cause unlawful disqualification of compliant MSME vendors or illegal awards to ineligible vendors.
- Lack of reproducibility violates administrative law (decisions must withstand judicial review in High Courts).

### Bounded AI Architecture
- **Extraction & OCR Only:** Tesseract OCR, PyMuPDF native extraction, and OpenCV deskewing are utilized strictly for extracting text from submitted PDF documents.
- **Verbatim Grounding:** Every extracted entity (GSTIN, PAN, Udyam number) must be grounded verbatim in the raw document text. Ungrounded extractions are rejected and marked `REVIEW`.
- **Deterministic Rule Engine:** 100% of eligibility logic is implemented as pure Python functions matching declarative YAML rules. Same evidence + same tender = identical result bit-for-bit.
- **Advisory Generation:** Built upon deterministic templates citing requirement IDs (`REQ-XX`). Optional LLM rewrites are constrained to stylistic rewording with automated regex validation gates and deterministic template fallback.

---

## 5. Security & Sovereign On-Premises Architecture

### On-Premises Sovereign Deployment
While hosted container demonstration configurations (e.g. Render/Vercel) are provided for evaluation convenience, the platform is **designed for sovereign on-premises deployment** within government data centers (NIC, MeghRaj cloud, or dedicated ministerial infrastructure):
- Zero external SaaS dependencies.
- Local OCR inference (Tesseract) with zero data egress.
- AES-256-GCM authenticated encryption for all documents at rest with SHA-256 integrity digests.
- DPDP Act 2023 compliant data retention policy tracker.

### Tamper-Evident Cryptographic Audit Trail
- Every evaluation, officer decision, and portal check is recorded in a cryptographic SHA-256 hash chain:  
  `current_hash = sha256(previous_hash + canonical_json(event_payload))`
- Database-level enforcement: Separate PostgreSQL role (`auditor_insert`) granting `INSERT`-only privileges, preventing `UPDATE` or `DELETE` actions even by system administrators.
- Cryptographic verification endpoint (`/api/audit/verify`) detects any unauthorized tampering in real time.

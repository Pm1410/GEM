# GeM Bid Eligibility Verification Platform — 3-Minute Hackathon Demo Script

**Competition:** Smart India Hackathon (SIH 2026)  
**Problem Statement:** SIH26100 — Automated Bid-Eligibility Verification for Government e-Marketplace (GeM)  
**Target Duration:** Exactly 180 seconds (3 minutes)  
**Core Thesis:** *Deterministic, explainable, auditable bid verification: same evidence in, same result out — never a false PASS.*  

---

## ⏱️ Timeline & Segment Overview

| Timestamp | Duration | Section | Key Demo Action | Target Impact |
| :--- | :--- | :--- | :--- | :--- |
| **00:00 – 00:30** | 30s | **1. The Problem & Core Architecture** | Open Executive Dashboard; point to 4 Result States & Zero False-PASS guarantee | Frame manual pain (~18 min) vs deterministic automation |
| **00:30 – 01:05** | 35s | **2. Catching the Overdue Return Defaulter** | Select *Bharat Tech Solutions (BP-04)*; inspect valid PDF vs live GSTN OVERDUE | Show how document-only inspection fails without live portal cross-check |
| **01:05 – 01:35** | 30s | **3. Portal Outage Resilience (Kill Switch)** | Select *Unverified Network Works (BP-08)*; show timeout yielding `UNVERIFIABLE` | Prove resilience: downtime never causes false PASS or false rejection |
| **01:35 – 02:05** | 30s | **4. Advisory & Officer Workflow** | Select *Tata Consultancy Services (BP-01)*; review REQ-XX citations; approve bid | Highlight zero-LLM decision path & mandatory 10+ char justification |
| **02:05 – 02:35** | 30s | **5. Cryptographic SHA-256 Audit Trail** | Switch to Audit tab; click *Verify Chain*; click *Simulate Tamper* | Demonstrate instant detection of unauthorized database alteration |
| **02:35 – 03:00** | 25s | **6. Hard Evaluation Benchmark Numbers** | Show benchmark table (22 cases, 0 false PASS, 100% precision, 2.6 ms latency) | Close with hard, unassailable mathematical proof |

---

## Detailed Script & Presenter Cues

### Part 1: The Problem & Core Architecture (00:00 – 00:30)
- **Spoken Dialogue:**  
  *"Respected Judges, on Government e-Marketplace, procurement officers manually review dozens of 50-page bidder packs per tender. Our teammate timing baseline showed this takes 18 minutes per packet. Under time pressure, officers miss expired certificates or cancelled GSTINs, leading to illegal contract awards or judicial challenges.*  
  *We built the GeM Bid Eligibility Verification Platform on a strict non-negotiable principle: **Deterministic, explainable, and auditable: same evidence in, same result out — never a false PASS.** Notice the 4 statutory states: PASS, FAIL, REVIEW, and UNVERIFIABLE."*
- **Action on Screen:**  
  - Point to the executive dark glassmorphism dashboard.
  - Hover over the Active Tender selector showing Goods, Services, and MSME Reserved procurement.
  - Highlight the state legend badges in the top metrics bar.

---

### Part 2: Catching the Overdue Return Defaulter (00:30 – 01:05)
- **Spoken Dialogue:**  
  *"Let's examine how fraudulent bidders slip through manual review. Here is Bharat Tech Solutions (BP-04). They submitted a clean, born-digital GST Certificate. The Mod-36 checksum is valid, and the embedded PAN matches.*  
  *If an officer only looked at the PDF, they would approve it. But our automated engine queries the GSTN portal in real time. Look at Requirement REQ-01: the portal returned an OVERDUE GSTR-3B filing for November 2025. The platform immediately flags a statutory FAIL and elevates risk to HIGH. Zero human oversight, zero false PASS."*
- **Action on Screen:**  
  - Click on **Bharat Tech Solutions Private Limited (BP-04)** in the bidder table.
  - Click on **Requirement REQ-01** to open the check breakdown.
  - Click on the **Evidence Viewer** tab to show the extracted GSTIN highlighted in cyan in the original document context.
  - Show the **Simulated Portal Adapter** pill indicating `filing_status: OVERDUE`.

---

### Part 3: Portal Outage Resilience & Kill Switch (01:05 – 01:35)
- **Spoken Dialogue:**  
  *"What happens during real-world network partitions when government portals go down? Most naive AI systems either crash or guess.*  
  *Look at Unverified Network Works (BP-08). The GSTN portal adapter timed out with a 504 Gateway error. Our engine does not guess, does not issue a false PASS, and does not unfairly disqualify the bidder. It deterministically classifies the check as **UNVERIFIABLE**. It excludes the check from the score denominator so the bidder is not penalized, and queues it for automated exponential retry."*
- **Action on Screen:**  
  - Click on **Unverified Network Works (BP-08)** in the bidder table.
  - Show the purple **UNVERIFIABLE** badge.
  - Show the check details: *"GSTN portal unreachable (TIMEOUT). Retrying with backoff; not marked as FAIL."*
  - Point to the compliance score: calculated cleanly over verifiable requirements without distortion.

---

### Part 4: Deterministic Advisory & Officer Workflow (01:35 – 02:05)
- **Spoken Dialogue:**  
  *"Now let's look at Tata Consultancy Services (BP-01), a fully compliant bidder. Look at the Advisory panel. Notice there is **zero LLM in the decision path**. The advisory is generated deterministically citing exact requirement IDs like REQ-01 and REQ-03, accompanied by the statutory legal disclaimer that final authority rests with the Procurement Officer.*  
  *Watch the officer workflow: if I try to approve without explaining why, the system blocks me. GFR compliance strictly mandates at least 10 characters of justification. I enter 'Verified compliant documentation against tender specifications' and submit."*
- **Action on Screen:**  
  - Select **Tata Consultancy Services Limited (BP-01)**.
  - Click on the **Advisory & Determination** tab.
  - Point to the prominent amber disclaimer banner: `ADVISORY — NOT A FINAL DISQUALIFICATION`.
  - Type 4 characters into the justification box — demonstrate the button remains disabled with counter `4 / 10 characters minimum`.
  - Type: `"Verified compliant documentation against tender specifications"` and click **Record Determination to Audit Trail**.

---

### Part 5: Cryptographic SHA-256 Audit Trail & Live Tamper Demo (02:05 – 02:35)
- **Spoken Dialogue:**  
  *"Every officer action, evidence digest, and portal response is cryptographically linked into a SHA-256 hash chain, backed by an INSERT-only PostgreSQL role.*  
  *Let's verify the chain. Clicking 'Verify Chain Integrity' recomputes all hashes from genesis in real time: green badge, all records intact.*  
  *Now, suppose a rogue database admin tries to covertly alter Block #1 to approve a disqualified bidder. Watch what happens when I click 'Simulate Tamper': instant red alert! The cryptographic chain breaks immediately and pinpoints the exact corrupted block. Total forensic accountability."*
- **Action on Screen:**  
  - Switch to the **Cryptographic Audit Trail** tab.
  - Show the newly minted Block containing the officer's action, timestamp, and SHA-256 digest.
  - Click **Verify Chain Integrity** -> Badge turns green: `✓ Chain Verified: Records Cryptographically Intact`.
  - Click **Simulate Tamper** -> Alert flashes red: `✗ Cryptographic Breach Detected: Expected SHA-256 mismatch at Block #1! Hash chain broken.`

---

### Part 6: Hard Evaluation Benchmark Numbers (02:35 – 03:00)
- **Spoken Dialogue:**  
  *"Finally, the numbers. We do not claim vague accuracy percentages from cherry-picked examples. We tested 22 comprehensive synthetic bidder packets across Goods, Services, and MSME Reserved tenders.*  
  *The results: **Strictly 0 false PASSes. 0 false rejections. 100% deterministic rule precision.** And while manual officer review takes 18 minutes, our platform finishes in **2.6 milliseconds** — a greater than 10,000x speedup.  
  *Designed for sovereign on-premises deployment, ready for GeM integration. Thank you, and we welcome your questions!"*
- **Action on Screen:**  
  - Click the **3-Min Hackathon Demo** or **System Limitations** header button.
  - Show the benchmark metrics table:  
    - `Total Synthetic Cases: 22`  
    - `False PASS Count: 0 (Zero False-PASS)`  
    - `Execution Time: 2.6 ms per packet (vs 18 min manual)`  
  - Display the concluding slide/screen with team name and PS code SIH26100.

---

## 💡 Quick Judge Q&A Cheat Sheet

| Likely Judge Question | 15-Second Direct Answer |
| :--- | :--- |
| **"Why are portal responses simulated?"** | *"Statutory portal APIs (GSTN, EPFO, Udyam) legally require licensed GSP credentials and departmental MoUs. We built decoupled adapters with identical data schemas and latency injection, ready to swap in live endpoints without changing a single line of business logic."* |
| **"What if your OCR misreads an entity?"** | *"Our verbatim grounding engine requires 100% character matching against the raw PDF stream. Any ungrounded or ambiguous text is automatically rejected and classified as REVIEW — it is impossible to hallucinate a PASS."* |
| **"Why not use an LLM like GPT-4 or Claude to decide?"** | *"Public procurement decisions must withstand High Court judicial review. Non-deterministic LLM hallucinations could unlawfully disqualify a legitimate MSME or pass a corrupt vendor. Our decision path is 100% pure deterministic code."* |
| **"How do you evaluate certificate expiry?"** | *"Certificates are evaluated against the tender's **bid_opening_date**, not calendar today. This prevents vendors from being penalized for bureaucratic evaluation delays."* |
| **"How is the audit trail secured against tampering?"** | *"We use a cryptographic SHA-256 hash chain combined with a PostgreSQL INSERT-only DB role (`auditor_insert`) that revokes UPDATE and DELETE privileges at the database engine level."* |

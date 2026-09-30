---
phase: "04"
slug: "frontend-dashboard-officer-workflow"
status: approved
shadcn_initialized: false
preset: institutional-government-light
created: "2026-09-29"
---

# Phase 04 — UI Design Contract: GeM Institutional Procurement Dashboard

> Visual and interaction contract for the Procurement Officer Dashboard. Revamps the prototype from dark "AI-type" glassmorphism into an authoritative, clean, accessible, light-themed Government of India procurement portal.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Vanilla CSS Design Tokens) |
| Preset | Apple Precision Light — 30/70 Master-Detail Vertical Split |
| Layout Ratio | 30% Tender Bidder Packets Sidebar / 70% Dossier Inspector |
| Component library | Native Semantic HTML5 + Custom Enterprise Components |
| Icon library | Native SVG & Unicode Glyphs |
| Font | 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont & 'JetBrains Mono' |

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge micro-padding, inline tags |
| sm | 8px | Button padding, compact control gaps, table cell vertical padding |
| md | 16px | Card padding, layout column gaps, form control margins |
| lg | 24px | Section padding, container gaps, panel headers |
| xl | 32px | Major grid gutters, header horizontal margins |
| 2xl | 48px | Page header spacing, major workflow breaks |
| 3xl | 64px | Page container maximum boundaries |

Exceptions: 2px border radius on micro-badges; 1px structural data table dividers.

---

## Typography

| Role | Size | Weight | Line Height | Tracking |
|------|------|--------|-------------|----------|
| Display | 20px (1.25rem) | 700 (Bold) | 1.3 | -0.01em |
| Heading | 16px (1.0rem) | 700 (Bold) | 1.4 | normal |
| Subheading | 14px (0.875rem) | 600 (SemiBold) | 1.4 | normal |
| Body | 14px (0.875rem) | 400 (Regular) | 1.5 | normal |
| Label / Meta | 12px (0.75rem) | 600 (SemiBold) | 1.4 | 0.03em (Uppercase) |
| Monospace / Code | 12px (0.75rem) | 500 (Medium) | 1.5 | normal |

---

## Color: Institutional Light Theme

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FAFC` (Slate-50) | Main background, body background |
| Secondary (30%) | `#FFFFFF` (Pure White) | Cards, panels, tables, modals, inspector dossier |
| Borders & Dividers | `#E2E8F0` / `#CBD5E1` | Crisp 1px container and table cell dividers |
| Primary Gov Navy | `#0B2545` / `#133E87` | Top navbar brand, primary buttons, active tabs |
| National Accent Strip | `#FF9933` / `#138808` | Subtle top micro-stripe (Saffron & Green) |
| Neutral Text Primary | `#0F172A` (Slate-900) | Primary headings, table text, high readability |
| Neutral Text Secondary | `#475569` (Slate-600) | Subtitles, labels, secondary metadata |
| Neutral Text Muted | `#64748B` (Slate-500) | Captions, disabled text, timestamps |
| State: PASS | `#DEF7EC` bg / `#03543F` text | Compliant requirements and clean bidders |
| State: FAIL | `#FDE8E8` bg / `#9B1C1C` text | Statutory defaults, overdue returns, expired certs |
| State: REVIEW | `#FEF3C7` bg / `#92400E` text | Missing attachments, manual scrutiny needed |
| State: UNVERIFIABLE | `#EDE9FE` bg / `#5B21B6` text | Network partition, portal timeout, kill switch |
| Simulated Badge | `#FEF3C7` bg / `#78350F` text | Statutory portal simulation disclosure pill |

Accent reserved for: Active tab indicator (`#1E40AF`), focused inputs, and explicit action submit CTA.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Record Determination to Audit Trail" |
| Header Brand | "Government e-Marketplace — Bid Verification & Eligibility Platform" |
| Simulation Disclosure | "SIMULATED PORTALS" |
| Empty Table State | "Select a bidder from the list to view compliance breakdown." |
| Empty Audit State | "No decisions recorded yet. Decisions made by officers will form a tamper-evident hash chain here." |
| Error State | "Verification error: [Specific message]. Please retry or inspect system logs." |
| Legal Disclaimer | "ADVISORY: FOR PROCURING OFFICER EVALUATION ONLY — NOT AN AUTOMATED DISQUALIFICATION. Final determination rests with the designated Procurement Officer." |
| Justification Counter | "[N] / 10 characters minimum" |

---

## UI Considerations

Applicable state considerations resolved:

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Bidders table | ✅ covered | Shows loading indicator or explicit fallback message |
| empty | Requirements table | ✅ covered | Displays guidance to select a bidder dossier |
| empty | Audit chain | ✅ covered | Displays institutional explanation of genesis hash log |
| long-text | Evidence document | ✅ covered | Scrollable paper viewport with clear pre-wrap typography |
| action-guard | Officer decision | ✅ covered | Button strictly disabled until 10+ characters justification entered |
| rbac-state | Auditor view | ✅ covered | Actions disabled in read-only mode with warning notice |
| simulated-tag | Adapter badges | ✅ covered | Clear amber pill badge on every external simulated check |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS (100% light theme institutional government palette)
- [x] Dimension 4 Typography: PASS (Clean, accessible, high data density)
- [x] Dimension 5 Spacing: PASS (Standard 4px base scale)
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-09-29

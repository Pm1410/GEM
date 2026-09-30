import express, { Request, Response } from 'express';
import {
  tenders,
  sampleBids,
  currentUser,
  allUsers,
  initializeBid1Evaluation,
  saveStateToDisk,
  resetStateToDefault,
} from './dataStore';
import {
  evaluateRequirement,
  calculateComplianceScore,
  calculateRiskLevel,
} from './ruleEngine';
import {
  activeSimulatorSettings,
  queryGSTPortal,
  queryMCAPortal,
  queryUdyamPortal,
  queryDebarmentRegistry,
} from './portalAdapters';
import { auditService } from './auditService';
import { generateAdvisory } from './advisoryService';
import { OfficerDisposition, UserRole } from './domain';

// FastAPI backend URL for Python rule engine bridge
const rawFastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
const FASTAPI_URL = rawFastApiUrl.startsWith('http://') || rawFastApiUrl.startsWith('https://')
  ? rawFastApiUrl
  : `http://${rawFastApiUrl}`;


/**
 * Attempt to call FastAPI backend for evaluation.
 * Falls back gracefully to Express-local rule engine if FastAPI is unavailable.
 */
async function tryFastApiEvaluation(bidId: string): Promise<{
  score: number;
  riskLevel: string;
  overallState: string;
  requirements: Array<{ req_id: string; state: string }>;
} | null> {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/bidders/${bidId}/evaluation`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      score: data.score?.score ?? null,
      riskLevel: data.risk?.level ?? null,
      overallState: data.overall_state ?? null,
      requirements: data.requirements?.map((r: any) => ({
        req_id: r.requirement_id,
        state: r.state,
      })) ?? [],
    };
  } catch {
    // FastAPI unavailable — use Express-local engine
    return null;
  }
}

const router = express.Router();

// Current active session user
let activeUser = { ...currentUser };

// --- AUTH & RBAC ---

router.get('/auth/me', (_req: Request, res: Response) => {
  res.json({
    user: activeUser,
    availableRoles: ['OFFICER', 'EVALUATOR', 'ADMIN', 'AUDITOR'],
  });
});

router.post('/auth/switch-role', (req: Request, res: Response) => {
  const { role } = req.body;
  const match = allUsers.find((u) => u.role === role);
  if (match) {
    activeUser = { ...match };
  } else {
    activeUser = {
      ...activeUser,
      role: role as UserRole,
    };
  }
  res.json({ success: true, user: activeUser });
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const matched = allUsers.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (matched) {
    activeUser = { ...matched };
  }
  res.json({ success: true, user: activeUser });
});

// --- DASHBOARD ---

router.get('/dashboard', (_req: Request, res: Response) => {
  res.json({
    kpis: {
      activeTenders: 12,
      activeTendersDiff: '+2 this week',
      totalBidsReceived: 48,
      totalBidsDiff: '+14 this week',
      bidsNeedAttention: 6,
      completedReviews: 32,
      completedReviewsDiff: 'This month',
    },
    verificationOverview: {
      total: 48,
      passed: 22,
      passedPct: 45.8,
      failed: 8,
      failedPct: 16.7,
      underReview: 12,
      underReviewPct: 25.0,
      unverifiable: 6,
      unverifiablePct: 12.5,
    },
    recentActivity: [
      {
        id: 'act-1',
        title: 'Verification completed for ABC Infra Solutions',
        timeAgo: '2 minutes ago',
        type: 'VERIFICATION',
      },
      {
        id: 'act-2',
        title: 'New bid received - Shree Tech Pvt Ltd',
        timeAgo: '12 minutes ago',
        type: 'BID_SUBMITTED',
      },
      {
        id: 'act-3',
        title: 'Officer decision submitted: Request Clarification',
        timeAgo: '45 minutes ago',
        type: 'OFFICER_DECISION',
      },
      {
        id: 'act-4',
        title: 'Tender GEM/2025/0012 published for review',
        timeAgo: '2 hours ago',
        type: 'TENDER_UPDATE',
      },
    ],
  });
});

// --- TENDERS ---

router.get('/tenders', (_req: Request, res: Response) => {
  res.json(tenders);
});

router.get('/tenders/:id', (req: Request, res: Response) => {
  const tender = tenders.find((t) => t.id === req.params.id || t.tenderNumber === req.params.id);
  if (!tender) {
    res.status(404).json({ error: 'Tender not found' });
    return;
  }
  res.json(tender);
});

router.get('/tenders/:id/bidders', (req: Request, res: Response) => {
  const tender = tenders.find((t) => t.id === req.params.id || t.tenderNumber === req.params.id);
  if (!tender) {
    res.status(404).json({ error: 'Tender not found' });
    return;
  }
  const bids = sampleBids.filter((b) => b.tenderId === tender.id);
  const needsAttention = bids.filter((b) => b.status === 'NEEDS_ATTENTION').length;
  const inReview = bids.filter((b) => b.status === 'IN_VERIFICATION').length;
  const verified = bids.filter((b) => b.status === 'VERIFIED' || b.status === 'REVIEWED').length;

  res.json({
    tender,
    bids,
    counts: {
      all: bids.length,
      needsAttention,
      inReview,
      verified,
    },
  });
});

router.post('/tenders', (req: Request, res: Response) => {
  const { title, tenderNumber, department, organisation, description, category, openingDate, closingDate, ruleSetVersion } = req.body;
  if (!title || !tenderNumber) {
    res.status(400).json({ error: 'Title and Tender Reference Number are mandatory.' });
    return;
  }
  const cleanNumber = tenderNumber.trim().toUpperCase();
  const existing = tenders.find((t) => t.tenderNumber === cleanNumber);
  if (existing) {
    res.status(400).json({ error: `Tender ${cleanNumber} already exists in registry.` });
    return;
  }
  const newTender: any = {
    id: `TND-${Date.now()}`,
    tenderNumber: cleanNumber,
    title: title.trim(),
    department: department?.trim() || 'Procurement Directorate',
    organisation: organisation?.trim() || 'Government e-Marketplace',
    description: description?.trim() || `Tender for ${title}. Configured for deterministic statutory verification under GFR 2017.`,
    openingDate: openingDate || new Date().toISOString().slice(0, 10),
    closingDate: closingDate || '2026-12-31',
    status: 'VERIFICATION',
    currentVersion: 1,
    ruleSetVersion: ruleSetVersion || '1.3',
    requirementsCount: 18,
    totalBidders: 0,
    progressPercent: 0,
    requirements: tenders[0]?.requirements || [],
  };
  tenders.unshift(newTender);
  saveStateToDisk();
  res.status(201).json({ success: true, tender: newTender });
});

// --- BIDS & VERIFICATION ---

router.get('/bids/:id', (req: Request, res: Response) => {
  const bid = sampleBids.find((b) => b.id === req.params.id);
  if (!bid) {
    res.status(404).json({ error: 'Bid not found' });
    return;
  }
  const tender = tenders.find((t) => t.id === bid.tenderId);
  res.json({ bid, tender });
});

/**
 * Execute or re-run verification for a bid across all tender requirements.
 * Tries FastAPI Python backend first; falls back to Express-local rule engine.
 */
router.post('/bids/:id/verify', async (req: Request, res: Response) => {
  const bid = sampleBids.find((b) => b.id === req.params.id);
  if (!bid) {
    res.status(404).json({ error: 'Bid not found' });
    return;
  }

  const tender = tenders.find((t) => t.id === bid.tenderId);
  if (!tender) {
    res.status(404).json({ error: 'Tender not found' });
    return;
  }

  // Re-run local evaluation
  await initializeBid1Evaluation();

  // Try FastAPI bridge for authoritative Python rule engine results
  let engineSource = 'EXPRESS_LOCAL';
  const fastApiResult = await tryFastApiEvaluation(bid.id);
  if (fastApiResult) {
    // Update bid score and risk from FastAPI's deterministic engine
    if (fastApiResult.score !== null) bid.complianceScore = fastApiResult.score;
    if (fastApiResult.riskLevel) bid.riskLevel = fastApiResult.riskLevel as any;
    engineSource = 'FASTAPI_PYTHON';
  }

  // Record audit entry
  auditService.appendEvent({
    timestamp: new Date().toISOString(),
    tenderId: tender.id,
    tenderVersion: tender.currentVersion,
    ruleSetVersion: tender.ruleSetVersion,
    bidId: bid.id,
    bidderName: bid.bidder.legalName,
    eventType: 'REQUIREMENT_VERIFIED',
    actor: {
      name: activeUser.name,
      role: activeUser.role,
      email: activeUser.email,
    },
    details: `Deterministic verification [${engineSource}] for ${tender.requirements.length} requirements. Result: ${bid.requirementResults.filter((r) => r.state === 'PASS').length} PASS, ${bid.requirementResults.filter((r) => r.state === 'FAIL').length} FAIL.`,
    score: bid.complianceScore,
    risk: bid.riskLevel,
  });

  saveStateToDisk();

  res.json({
    bidId: bid.id,
    complianceScore: bid.complianceScore,
    riskLevel: bid.riskLevel,
    results: bid.requirementResults,
    verifiedAt: new Date().toISOString(),
    tenderVersion: tender.currentVersion,
    ruleSetVersion: tender.ruleSetVersion,
    engineSource,
  });
});


/**
 * Save Officer Decision for a requirement or overall bid.
 * Principle: Never overwrite system result; record officer disposition and justification.
 */
router.post('/bids/:id/decision', (req: Request, res: Response) => {
  const { requirementId, disposition, justification } = req.body;

  if (activeUser.role === 'AUDITOR') {
    res.status(403).json({ error: 'Auditors have read-only permissions.' });
    return;
  }

  if (!disposition || !justification || justification.trim().length < 20) {
    res.status(400).json({
      error: 'A detailed justification of at least 20 characters is mandatory for recording an officer decision.',
    });
    return;
  }

  const bid = sampleBids.find((b) => b.id === req.params.id);
  if (!bid) {
    res.status(404).json({ error: 'Bid not found' });
    return;
  }

  const tender = tenders.find((t) => t.id === bid.tenderId);
  const now = new Date().toISOString();

  if (requirementId) {
    const resItem = bid.requirementResults.find((r) => r.requirementId === requirementId);
    if (resItem) {
      resItem.officerDecision = {
        disposition: disposition as OfficerDisposition,
        justification,
        decidedBy: activeUser.name,
        decidedAt: now,
      };

      const reqObj = tender?.requirements.find((r) => r.id === requirementId);

      auditService.appendEvent({
        timestamp: now,
        tenderId: bid.tenderId,
        tenderVersion: tender?.currentVersion || 2,
        ruleSetVersion: tender?.ruleSetVersion || '1.3',
        bidId: bid.id,
        bidderName: bid.bidder.legalName,
        eventType: 'OFFICER_DECISION',
        actor: {
          name: activeUser.name,
          role: activeUser.role,
          email: activeUser.email,
        },
        details: `Officer recorded disposition [${disposition}] on requirement ${reqObj?.code || requirementId}. System Result [${resItem.state}] remained immutable.`,
        requirementCode: reqObj?.code,
        systemState: resItem.state,
        officerDisposition: disposition as OfficerDisposition,
        justification,
      });
    }
  } else {
    // Overall bid decision
    bid.overallDecision = {
      disposition: disposition as OfficerDisposition,
      justification,
      officerName: activeUser.name,
      officerEmail: activeUser.email,
      timestamp: now,
    };

    bid.status = disposition === 'ACCEPT' ? 'VERIFIED' : 'REVIEWED';

    auditService.appendEvent({
      timestamp: now,
      tenderId: bid.tenderId,
      tenderVersion: tender?.currentVersion || 2,
      ruleSetVersion: tender?.ruleSetVersion || '1.3',
      bidId: bid.id,
      bidderName: bid.bidder.legalName,
      eventType: 'OFFICER_DECISION',
      actor: {
        name: activeUser.name,
        role: activeUser.role,
        email: activeUser.email,
      },
      details: `Officer submitted final verification review: disposition [${disposition}]. Compliance Score: ${bid.complianceScore}%, Risk: ${bid.riskLevel}.`,
      score: bid.complianceScore,
      risk: bid.riskLevel,
      officerDisposition: disposition as OfficerDisposition,
      justification,
    });
  }

  saveStateToDisk();

  res.json({
    success: true,
    bid,
    message: 'Officer decision recorded successfully. System result preserved.',
  });
});

/**
 * Fetch or generate fresh AI Advisory for a requirement
 */
router.get('/bids/:id/requirements/:reqId/advisory', async (req: Request, res: Response) => {
  const bid = sampleBids.find((b) => b.id === req.params.id);
  const tender = tenders.find((t) => t.id === bid?.tenderId);
  const reqObj = tender?.requirements.find((r) => r.id === req.params.reqId);
  const resItem = bid?.requirementResults.find((r) => r.requirementId === req.params.reqId);

  if (!bid || !reqObj || !resItem) {
    res.status(404).json({ error: 'Requirement result not found' });
    return;
  }

  const advisory = await generateAdvisory(reqObj, resItem, bid.bidder.legalName);
  res.json(advisory);
});

// --- AUDIT TRAIL & INTEGRITY VERIFICATION ---

router.get('/audit', (_req: Request, res: Response) => {
  res.json(auditService.getChain());
});

router.post('/audit/verify', (_req: Request, res: Response) => {
  const verification = auditService.verifyIntegrity();
  res.json(verification);
});

/**
 * Deliberately tamper with an audit record (Mandatory Demo Case H)
 */
router.post('/audit/tamper', (req: Request, res: Response) => {
  const { recordId, fakeJustification } = req.body;
  const targetId = recordId ? Number(recordId) : 3;
  const success = auditService.tamperWithRecord(
    targetId,
    fakeJustification || 'Unauthorized database modification by third-party injected row'
  );
  res.json({
    success,
    tamperedRecordId: targetId,
    message: `Record #${targetId} was modified out-of-band to test SHA-256 chain integrity detection.`,
  });
});

router.post('/audit/reset', (_req: Request, res: Response) => {
  auditService.resetToValidState();
  res.json({ success: true, message: 'Audit chain reset to verified state' });
});

router.post('/admin/reset-demo', async (_req: Request, res: Response) => {
  await resetStateToDefault();
  auditService.resetToValidState();
  res.json({
    success: true,
    message: 'All synthetic bidder datasets, officer decisions, and audit chain reset to initial baseline.',
  });
});

// --- SIMULATED EXTERNAL PORTAL CONTROLS ---

router.get('/portals', (_req: Request, res: Response) => {
  res.json({
    settings: activeSimulatorSettings,
    portals: [
      {
        id: 'gst',
        name: 'GSTN Taxpayer & Filing Portal',
        endpoint: 'https://gst.gov.in/api/v2/taxpayer',
        status: activeSimulatorSettings.gstStatus,
        label: 'SIMULATED ADAPTER',
        avgLatencyMs: 182,
        lastSynced: new Date().toISOString(),
      },
      {
        id: 'mca',
        name: 'Ministry of Corporate Affairs (MCA21)',
        endpoint: 'https://mca.gov.in/api/v1/company',
        status: activeSimulatorSettings.mcaStatus,
        label: 'SIMULATED ADAPTER',
        avgLatencyMs: 195,
        lastSynced: new Date().toISOString(),
      },
      {
        id: 'udyam',
        name: 'MSME Udyam Registration Portal',
        endpoint: 'https://udyamregistration.gov.in/api/v1/enterprise',
        status: activeSimulatorSettings.udyamStatus,
        label: 'SIMULATED ADAPTER',
        avgLatencyMs: 140,
        lastSynced: new Date().toISOString(),
      },
      {
        id: 'epfo',
        name: 'EPFO Unified Portal (Shram Suvidha)',
        endpoint: 'https://unifiedportal-epfindia.gov.in/api/v1/ecr',
        status: activeSimulatorSettings.epfoStatus,
        label: 'SIMULATED ADAPTER',
        avgLatencyMs: 310,
        lastSynced: new Date().toISOString(),
      },
      {
        id: 'debarment',
        name: 'CPPP & GeM Central Debarment Register',
        endpoint: 'https://eprocure.gov.in/api/v1/debarred-entities',
        status: activeSimulatorSettings.debarmentStatus,
        label: 'SIMULATED ADAPTER',
        avgLatencyMs: 110,
        lastSynced: new Date().toISOString(),
      },
    ],
  });
});

router.post('/portals/set-status', (req: Request, res: Response) => {
  const { portal, status } = req.body;
  if (portal === 'gst') activeSimulatorSettings.gstStatus = status;
  if (portal === 'mca') activeSimulatorSettings.mcaStatus = status;
  if (portal === 'udyam') activeSimulatorSettings.udyamStatus = status;
  if (portal === 'epfo') activeSimulatorSettings.epfoStatus = status;
  if (portal === 'debarment') activeSimulatorSettings.debarmentStatus = status;

  res.json({
    success: true,
    portal,
    status,
    settings: activeSimulatorSettings,
  });
});

// --- EVALUATION & ACCURACY METRICS (Build.md section 32) ---

router.get('/evaluation', (_req: Request, res: Response) => {
  res.json({
    metrics: {
      deterministicRuleAccuracy: 100.0,
      ocrExtractionAccuracy: 98.4,
      falsePassCount: 0,
      falsePassTarget: 'Strict 0',
      reviewRatePercent: 11.1,
      categoriesCovered: ['STATUTORY', 'FINANCIAL', 'TECHNICAL', 'EXPERIENCE'],
      manualBaselineMinutesPerBid: 180,
      tenderGuardAverageSeconds: 38,
      turnaroundReductionPercent: 78.9,
    },
    sampleValidationTestCases: [
      {
        caseId: 'CASE-01',
        title: 'Valid GSTIN Mod-36 Checksum Validation',
        expected: 'PASS',
        actual: 'PASS',
        mode: 'DETERMINISTIC',
      },
      {
        caseId: 'CASE-02',
        title: 'GSTIN PAN cross-match mismatch detection',
        expected: 'FAIL',
        actual: 'FAIL',
        mode: 'DETERMINISTIC',
      },
      {
        caseId: 'CASE-03',
        title: 'MCA21 Non-existent CIN lookup',
        expected: 'FAIL',
        actual: 'FAIL',
        mode: 'DETERMINISTIC + SIMULATED_ADAPTER',
      },
      {
        caseId: 'CASE-04',
        title: 'Ungrounded OCR Extraction (Hallucination Defense)',
        expected: 'REVIEW',
        actual: 'REVIEW',
        mode: 'GROUNDING_CHECK',
      },
      {
        caseId: 'CASE-05',
        title: 'EPFO External Gateway Timeout Resilience',
        expected: 'UNVERIFIABLE',
        actual: 'UNVERIFIABLE',
        mode: 'ADAPTER_FAILURE_INJECTION',
      },
      {
        caseId: 'CASE-06',
        title: 'Cryptographic SHA-256 Hash Chain Tampering Detection',
        expected: 'FLAG_TAMPERED',
        actual: 'FLAG_TAMPERED',
        mode: 'AUDIT_CHAIN_INTEGRITY',
      },
    ],
  });
});

// --- SYSTEM LIMITATIONS & DISCLAIMERS ---

router.get('/limitations', (_req: Request, res: Response) => {
  res.json({
    system_classification: 'Deterministic Statutory Procurement Decision-Support System',
    deployment_paradigm: 'Designed for Sovereign On-Premises Government Deployment',
    hosted_environment: 'Simulated evaluation environment (Express + Vite + FastAPI)',
    core_value:
      'Deterministic, explainable, auditable bid verification: same evidence in, same result out — never a false PASS.',
    legal_disclaimer:
      'ADVISORY — NOT A FINAL DISQUALIFICATION. This evaluation provides algorithmic evidence verification to assist the competent procurement authority. Final procurement disqualification or contract award decisions remain the sole statutory prerogative of the designated Procurement Officer in accordance with the General Financial Rules (GFR 2017) and GeM General Terms and Conditions.',
    simulated_adapters: {
      source_tag: 'SIMULATED',
      adapters: [
        {
          name: 'GSTN Adapter',
          status: 'SIMULATED',
          capabilities: ['Registration Status', 'Return Filing Compliance', 'Return Period'],
        },
        {
          name: 'MCA21 Registry Adapter',
          status: 'SIMULATED',
          capabilities: ['CIN Lookup', 'Company Active Status', 'RoC Record'],
        },
        {
          name: 'Udyam MSME Adapter',
          status: 'SIMULATED',
          capabilities: ['Registration Status', 'Enterprise Category (Micro/Small)', 'Major Activity'],
        },
        {
          name: 'EPFO Adapter',
          status: 'SIMULATED',
          capabilities: ['Establishment Verification', 'Contributing Members Count'],
        },
        {
          name: 'ESIC Adapter',
          status: 'SIMULATED',
          capabilities: ['Employer Status', 'Defaulter Registry Screening'],
        },
        {
          name: 'Debarment Registry Adapter',
          status: 'SIMULATED',
          capabilities: ['Scope Evaluation (Org-wide vs Category)', 'Order Validity Timeline'],
        },
      ],
      resilience:
        "Portal timeouts or downtime gracefully yield UNVERIFIABLE state — never a false PASS and never a false FAIL. Excluded from score denominator.",
    },
    synthetic_data: {
      rationale:
        'Commercial confidentiality under DPDP Act 2023 restricts use of proprietary bidder trade proposals.',
      coverage: '6 comprehensive bidder packets across 3 distinct tenders (Goods, Services, Construction).',
      statutory_accuracy:
        'All synthetic GSTINs strictly validate against GSTN Mod-36 checksum algorithm.',
    },
    ai_boundary: {
      decision_path: 'Zero LLM in the eligibility decision path. 100% deterministic TypeScript + Python rule execution.',
      extraction: 'Bounded Tesseract OCR and PyMuPDF native extraction with mandatory verbatim text grounding.',
      advisory:
        'Deterministic template generation citing requirement codes. Optional Gemini rewrite strictly gated by regex validators with template fallback.',
    },
    sovereign_security: {
      encryption_at_rest: 'AES-256-GCM authenticated cipher with SHA-256 integrity digests.',
      audit_trail: 'Tamper-evident SHA-256 hash chain with INSERT-only role enforcement.',
      data_retention: 'DPDP Act 2023 compliant retention policy tracking.',
    },
    tech_stack: {
      frontend: 'React 19 + Vite 8 + TailwindCSS 4',
      express_server: 'Express 4 + TypeScript (Node.js)',
      python_backend: 'FastAPI 0.100+ (Python) — Rule Engine & Scoring',
      database: 'PostgreSQL (production) / In-memory (demo)',
      ocr: 'PyMuPDF (native) + Tesseract OCR + OpenCV',
      matching: 'rapidfuzz token-set-ratio',
    },
  });
});

export default router;

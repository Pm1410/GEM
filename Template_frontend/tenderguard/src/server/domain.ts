export type VerificationState = 'PASS' | 'FAIL' | 'REVIEW' | 'UNVERIFIABLE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type OfficerDisposition = 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION' | 'ACCEPT_EXCEPTION';
export type UserRole = 'OFFICER' | 'EVALUATOR' | 'ADMIN' | 'AUDITOR';
export type AdapterStatus = 'SUCCESS' | 'TIMEOUT' | 'DOWN' | 'STALE' | 'INVALID_RESPONSE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  organisation: string;
}

export interface BoundingBox {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number;
  height: number;
}

export interface EvidenceItem {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  boundingBox: BoundingBox;
  sourceText: string;
  fieldName: string;
  extractedValue: string;
  extractionMethod: 'REGEX' | 'TEMPLATE' | 'OCR_TESSERACT' | 'MODEL_FALLBACK' | 'OFFICER_CORRECTED';
  confidence: number; // 0.0 - 1.0
  sha256: string;
  grounded: boolean;
}

export interface ValidationCheck {
  id: string;
  checkCode: string;
  description: string;
  inputValue: string;
  expectedValue: string;
  result: 'PASS' | 'FAIL' | 'REVIEW' | 'SKIPPED';
  reason: string;
  source: string;
}

export interface ExternalVerification {
  adapterName: string;
  sourceLabel: string; // e.g. "SIMULATED ADAPTER - GST Portal"
  status: AdapterStatus;
  queriedValue: string;
  latencyMs: number;
  fetchedAt: string;
  fields: Record<string, any>;
  responseHash: string;
}

export interface Requirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'STATUTORY' | 'TECHNICAL' | 'FINANCIAL' | 'EXPERIENCE';
  mandatory: boolean; // weight 3 if mandatory, weight 1 if optional
  appliesIf?: string;
  evidenceRequired: string[];
  checksRequired: string[];
  ruleName: string;
  ruleVersion: string;
  onFail: VerificationState;
  onMissing: VerificationState;
  onPortalDown: VerificationState;
}

export interface RequirementResult {
  requirementId: string;
  state: VerificationState;
  scoreValue: number; // 1.0 for PASS, 0.5 for REVIEW, 0.0 for FAIL/UNVERIFIABLE
  weight: number; // 3 for mandatory, 1 for optional
  reason: string;
  evidence: EvidenceItem[];
  validationChecks: ValidationCheck[];
  externalVerification?: ExternalVerification;
  advisory?: {
    summary: string;
    explanation: string;
    suggestedAction: string;
    generatedAt: string;
    isAiEnhanced?: boolean;
  };
  officerDecision?: {
    disposition: OfficerDisposition;
    justification: string;
    decidedBy: string;
    decidedAt: string;
  };
}

export interface DocumentInfo {
  id: string;
  bidId: string;
  filename: string;
  documentType: string;
  mimeType: string;
  pageCount: number;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  status: 'EXTRACTED' | 'PROCESSING' | 'FLAGGED';
  previewPages: {
    pageNumber: number;
    title: string;
    textSnippet: string;
    regions: {
      label: string;
      value: string;
      box: BoundingBox;
    }[];
  }[];
}

export interface Bidder {
  id: string;
  legalName: string;
  gstin: string;
  pan: string;
  cin: string;
  udyam: string;
  epfoCode?: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  bidder: Bidder;
  submittedAt: string;
  status: 'SUBMITTED' | 'IN_VERIFICATION' | 'NEEDS_ATTENTION' | 'REVIEWED' | 'VERIFIED';
  complianceScore: number; // 0 - 100
  riskLevel: RiskLevel;
  documents: DocumentInfo[];
  requirementResults: RequirementResult[];
  overallDecision?: {
    disposition: OfficerDisposition;
    justification: string;
    officerName: string;
    officerEmail: string;
    timestamp: string;
  };
}

export interface Tender {
  id: string;
  tenderNumber: string;
  title: string;
  department: string;
  organisation: string;
  description: string;
  openingDate: string;
  closingDate: string;
  status: 'DRAFT' | 'OPEN' | 'VERIFICATION' | 'COMPLETED' | 'CLOSED';
  currentVersion: number;
  ruleSetVersion: string;
  requirementsCount: number;
  totalBidders: number;
  progressPercent: number;
  requirements: Requirement[];
}

export interface AuditRecord {
  id: number;
  timestamp: string;
  tenderId: string;
  tenderVersion: number;
  ruleSetVersion: string;
  bidId: string;
  bidderName: string;
  eventType:
    | 'BID_SUBMITTED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_EXTRACTED'
    | 'REQUIREMENT_VERIFIED'
    | 'PORTAL_LOOKUP'
    | 'ADVISORY_GENERATED'
    | 'OFFICER_DECISION'
    | 'EVIDENCE_CORRECTED'
    | 'AUDIT_VERIFIED';
  actor: {
    name: string;
    role: string;
    email: string;
  };
  details: string;
  requirementCode?: string;
  systemState?: VerificationState;
  score?: number;
  risk?: RiskLevel;
  officerDisposition?: OfficerDisposition;
  justification?: string;
  previousHash: string;
  hash: string;
  isTampered?: boolean;
}

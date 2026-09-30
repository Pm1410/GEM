import {
  Tender,
  Requirement,
  Bid,
  User,
  DocumentInfo,
  RequirementResult,
  BoundingBox,
} from './domain';
import {
  evaluateRequirement,
  calculateComplianceScore,
  calculateRiskLevel,
} from './ruleEngine';
import {
  queryGSTPortal,
  queryMCAPortal,
  queryUdyamPortal,
  queryDebarmentRegistry,
} from './portalAdapters';
import { generateAdvisory } from './advisoryService';
import { auditService } from './auditService';

export const currentUser: User = {
  id: 'usr-001',
  name: 'P. Sengupta',
  email: 'officer@cpcl.gov.in',
  role: 'OFFICER',
  department: 'Procurement & Contracts Department',
  organisation: 'Chennai Petroleum Corporation Limited (CPCL)',
};

export const allUsers: User[] = [
  currentUser,
  {
    id: 'usr-002',
    name: 'K. Ramanathan',
    email: 'evaluator@cpcl.gov.in',
    role: 'EVALUATOR',
    department: 'Civil Engineering Directorate',
    organisation: 'CPCL',
  },
  {
    id: 'usr-003',
    name: 'Dr. S. Meenakshi',
    email: 'admin@tenderguard.gov.in',
    role: 'ADMIN',
    department: 'Directorate General of Supplies & Disposals',
    organisation: 'GeM / CPCL',
  },
  {
    id: 'usr-004',
    name: 'V. Anand, IA&AS',
    email: 'auditor@cag.gov.in',
    role: 'AUDITOR',
    department: 'Principal Director of Commercial Audit',
    organisation: 'CAG India',
  },
];

// 18 Formal Requirements for GEM/2025/0012
export const requirementsTender1: Requirement[] = [
  {
    id: 'req-01',
    code: 'GST_001',
    title: 'GST Registration and Return Filing Compliance',
    description: 'Valid 15-digit GSTIN certificate and up-to-date monthly GSTR-3B / GSTR-1 return filing.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['GST_Certificate.pdf', 'GSTR3B_Receipt.pdf'],
    checksRequired: ['GSTIN_FORMAT', 'GSTIN_CHECKSUM', 'GSTIN_PAN_MATCH', 'PORTAL_ACTIVE', 'RETURN_FILING_CURRENT'],
    ruleName: 'GST_REGISTRATION_AND_FILING',
    ruleVersion: '1.3',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-02',
    code: 'PAN_001',
    title: 'Permanent Account Number (PAN) Card & Tax Record',
    description: '10-character alphanumeric PAN issued by Income Tax Department, linked and operative.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['PAN_Card.pdf'],
    checksRequired: ['PAN_FORMAT', 'PAN_DATABASE_LOOKUP'],
    ruleName: 'PAN_VERIFICATION',
    ruleVersion: '1.2',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-03',
    code: 'CIN_001',
    title: 'Company Incorporation (CIN) and Active MCA Record',
    description: 'Proof of legal entity incorporation and valid registration in Ministry of Corporate Affairs (MCA21).',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['Certificate_of_Incorporation.pdf'],
    checksRequired: ['CIN_FORMAT', 'MCA_DATABASE_RECORD'],
    ruleName: 'CIN_EXISTS',
    ruleVersion: '1.4',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-04',
    code: 'UDYAM_001',
    title: 'Udyam MSME Registration Certificate',
    description: 'Valid Udyam Registration certificate for availing Public Procurement Policy concessions (if applicable).',
    category: 'STATUTORY',
    mandatory: false,
    evidenceRequired: ['Udyam_Registration.pdf'],
    checksRequired: ['UDYAM_FORMAT', 'UDYAM_PORTAL_ACTIVE'],
    ruleName: 'UDYAM_MSME_REGISTRATION',
    ruleVersion: '1.1',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-05',
    code: 'ITR_001',
    title: 'Income Tax Returns for Last 3 Financial Years',
    description: 'ITR-V acknowledgements for FY 2023-24, 2024-25, 2025-26 with CA computation statement.',
    category: 'FINANCIAL',
    mandatory: true,
    evidenceRequired: ['ITR_Acknowledgements_3Y.pdf'],
    checksRequired: ['ITR_3YEARS_COMPLETE', 'CA_UDIN_VERIFIED'],
    ruleName: 'ITR_VERIFICATION',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-06',
    code: 'EXP_001',
    title: 'Similar Work Experience in Commercial/Office Construction',
    description: 'Satisfactory completion certificates for at least 1 project of min Rs 25 Cr or 2 projects of Rs 15 Cr.',
    category: 'EXPERIENCE',
    mandatory: true,
    evidenceRequired: ['Work_Experience_Certificates.pdf'],
    checksRequired: ['EXPERIENCE_VALUE_THRESHOLD', 'COMPLETION_CERT_GENUINE'],
    ruleName: 'EXPERIENCE_CHECK',
    ruleVersion: '1.1',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-07',
    code: 'OEM_001',
    title: 'OEM Authorization for Elevators & HVAC Systems',
    description: 'Manufacturer Authorization Form (MAF) directly from Tier-1 approved OEMs with commitment for 10-year spares.',
    category: 'TECHNICAL',
    mandatory: false,
    evidenceRequired: ['OEM_Authorization_MAF.pdf'],
    checksRequired: ['OEM_LETTER_VALIDITY', 'SIGNATURE_VERIFIED'],
    ruleName: 'OEM_AUTHORIZATION',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-08',
    code: 'FIN_001',
    title: 'Minimum Average Annual Financial Turnover',
    description: 'Audited balance sheets proving average annual turnover of at least Rs 35 Crores in preceding 3 financial years.',
    category: 'FINANCIAL',
    mandatory: true,
    evidenceRequired: ['Audited_Financial_Statements.pdf'],
    checksRequired: ['TURNOVER_THRESHOLD_MET', 'AUDITOR_SEAL_PRESENT'],
    ruleName: 'FINANCIAL_TURNOVER',
    ruleVersion: '1.2',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-09',
    code: 'DEBAR_001',
    title: 'Central Debarment & Blacklisting Registry Clearance',
    description: 'Bidder must not be debarred, suspended, or blacklisted by any Central/State Ministry or CPSE under GFR 151.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['Non_Blacklisting_Affidavit.pdf'],
    checksRequired: ['DEBARMENT_STATUS'],
    ruleName: 'DEBARMENT_REGISTRY_CHECK',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-10',
    code: 'SOLV_001',
    title: 'Bank Solvency Certificate from Scheduled Commercial Bank',
    description: 'Solvency certificate of minimum Rs 15 Crores issued within 6 months prior to tender closing date.',
    category: 'FINANCIAL',
    mandatory: true,
    evidenceRequired: ['Bank_Solvency_Certificate.pdf'],
    checksRequired: ['SOLVENCY_AMOUNT', 'DATE_VALIDITY'],
    ruleName: 'BANK_SOLVENCY',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-11',
    code: 'EPF_001',
    title: 'Employees Provident Fund Organization (EPFO) Code',
    description: 'Valid EPFO registration code and electronic challan-cum-return (ECR) for previous 3 months.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['EPFO_Registration_ECR.pdf'],
    checksRequired: ['EPFO_VALID', 'ECR_CURRENT'],
    ruleName: 'EPFO_COMPLIANCE',
    ruleVersion: '1.1',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-12',
    code: 'ESIC_001',
    title: 'Employees State Insurance Corporation (ESIC) Registration',
    description: 'Valid ESIC employer code and recent monthly contribution payment receipts.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['ESIC_Registration_Challan.pdf'],
    checksRequired: ['ESIC_CODE_VALID', 'PAYMENT_UPTODATE'],
    ruleName: 'ESIC_COMPLIANCE',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-13',
    code: 'NETW_001',
    title: 'Positive Net Worth Certificate with UDIN',
    description: 'Chartered Accountant certificate confirming positive net worth as of March 31, 2026, with valid ICAI UDIN.',
    category: 'FINANCIAL',
    mandatory: true,
    evidenceRequired: ['Net_Worth_Certificate_UDIN.pdf'],
    checksRequired: ['POSITIVE_NET_WORTH', 'UDIN_FORMAT'],
    ruleName: 'NET_WORTH',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-14',
    code: 'ISO_001',
    title: 'ISO 9001:2015 Quality Management Certification',
    description: 'Accredited ISO 9001:2015 certificate valid throughout the tender contract execution period.',
    category: 'TECHNICAL',
    mandatory: false,
    evidenceRequired: ['ISO_9001_Certificate.pdf'],
    checksRequired: ['ISO_ACCREDITATION', 'VALIDITY_PERIOD'],
    ruleName: 'ISO_QUALITY',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-15',
    code: 'LITIG_001',
    title: 'Declaration of Pending Arbitration and Court Cases',
    description: 'Notarized disclosure of any ongoing litigation or arbitration with government departments.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['Litigation_Declaration_Affidavit.pdf'],
    checksRequired: ['NOTARIZATION_SEAL', 'VALUE_DISCLOSED'],
    ruleName: 'LITIGATION_DISCLOSURE',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-16',
    code: 'INTEG_001',
    title: 'Pre-Contract Integrity Pact (Rs 100 Stamp Paper)',
    description: 'Signed Integrity Pact witnessed by Independent External Monitors (IEMs) appointed by MoPNG.',
    category: 'STATUTORY',
    mandatory: true,
    evidenceRequired: ['Signed_Integrity_Pact.pdf'],
    checksRequired: ['STAMP_PAPER_VALUE', 'SIGNATURES_COMPLETE'],
    ruleName: 'INTEGRITY_PACT',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-17',
    code: 'SAFETY_001',
    title: 'Health, Safety and Environmental (HSE) Compliance Plan',
    description: 'Detailed site safety manual, zero-accident policy, and OHSAS/ISO 45001 safety guidelines adherence.',
    category: 'TECHNICAL',
    mandatory: true,
    evidenceRequired: ['HSE_Site_Safety_Plan.pdf'],
    checksRequired: ['SAFETY_POLICY_APPROVED', 'EMERGENCY_MEASURES'],
    ruleName: 'HSE_SAFETY',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
  {
    id: 'req-18',
    code: 'EMD_001',
    title: 'Earnest Money Deposit (EMD) Bank Guarantee (Rs 50 Lakhs)',
    description: 'Irrevocable Bank Guarantee for Rs 50,00,000 with SFMS confirmation to CPCL account.',
    category: 'FINANCIAL',
    mandatory: true,
    evidenceRequired: ['EMD_Bank_Guarantee.pdf'],
    checksRequired: ['BG_VALUE_CORRECT', 'SFMS_CONFIRMATION'],
    ruleName: 'EMD_GUARANTEE',
    ruleVersion: '1.0',
    onFail: 'FAIL',
    onMissing: 'REVIEW',
    onPortalDown: 'UNVERIFIABLE',
  },
];

export const tenders: Tender[] = [
  {
    id: 'TND-GEM-2025-0012',
    tenderNumber: 'GEM/2025/0012',
    title: 'Construction of Office Building - CPCL',
    department: 'CPCL (Chennai Petroleum Corporation Limited)',
    organisation: 'Ministry of Petroleum & Natural Gas',
    description:
      'Construction of modern office building & infrastructure at CPCL headquarters with technical, financial and statutory requirements as per the tender document.',
    openingDate: '18 Sep 2026',
    closingDate: '15 Oct 2026',
    status: 'VERIFICATION',
    currentVersion: 2,
    ruleSetVersion: '1.3',
    requirementsCount: 18,
    totalBidders: 45,
    progressPercent: 71,
    requirements: requirementsTender1,
  },
  {
    id: 'TND-MECL-2026-0048',
    tenderNumber: 'MECL/IT/2026/048',
    title: 'IT Infrastructure & Data Center Cloud Supply',
    department: 'MECL (Mineral Exploration and Consultancy Limited)',
    organisation: 'Ministry of Mines',
    description: 'High-availability server racks, enterprise SAN storage, and managed cloud interconnection services.',
    openingDate: '22 Sep 2026',
    closingDate: '20 Oct 2026',
    status: 'VERIFICATION',
    currentVersion: 1,
    ruleSetVersion: '1.1',
    requirementsCount: 12,
    totalBidders: 22,
    progressPercent: 45,
    requirements: requirementsTender1.slice(0, 12),
  },
  {
    id: 'TND-HPCL-2026-0091',
    tenderNumber: 'HPCL/SEC/2026/091',
    title: 'Security and Facility Manpower Services',
    department: 'HPCL (Hindustan Petroleum Corporation Limited)',
    organisation: 'Ministry of Petroleum & Natural Gas',
    description: 'Round-the-clock armed & unarmed security personnel and automated surveillance facility management across southern regional refinery terminals.',
    openingDate: '28 Sep 2026',
    closingDate: '30 Oct 2026',
    status: 'DRAFT',
    currentVersion: 1,
    ruleSetVersion: '1.0',
    requirementsCount: 16,
    totalBidders: 16,
    progressPercent: 0,
    requirements: requirementsTender1.slice(0, 16),
  },
];

// Seed Documents for Bidder 1: ABC Infra Solutions
const docGstABC: DocumentInfo = {
  id: 'doc-abc-gst',
  bidId: 'BID-001',
  filename: 'GST_Certificate.pdf',
  documentType: 'TAX_REGISTRATION',
  mimeType: 'application/pdf',
  pageCount: 3,
  sizeBytes: 842100,
  sha256: '9f83a42cbe812d3345eaf17b0198c21a441e86a1bb942b03912dae80a5521b4a',
  uploadedAt: '2026-09-28T09:12:00Z',
  status: 'EXTRACTED',
  previewPages: [
    {
      pageNumber: 1,
      title: 'Form GST REG-06: Registration Certificate',
      textSnippet: 'GOVERNMENT OF INDIA\nREGISTRATION CERTIFICATE\nRegistration Number: 22AAAAA0000A1Z5\nLegal Name: ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED\nTrade Name: ABC INFRA\nConstitution of Business: Private Limited Company\nAddress: 42 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
      regions: [
        {
          label: 'GSTIN',
          value: '22AAAAA0000A1Z5',
          box: { x: 26, y: 34, width: 44, height: 7 },
        },
        {
          label: 'Legal Name',
          value: 'ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED',
          box: { x: 26, y: 44, width: 62, height: 6 },
        },
      ],
    },
    {
      pageNumber: 2,
      title: 'Annexure A: Details of Additional Places of Business',
      textSnippet: 'Details of additional business premises within Chennai Central Ward 42.',
      regions: [],
    },
    {
      pageNumber: 3,
      title: 'Annexure B: Details of Managing Directors & Authorized Signatories',
      textSnippet: 'Director: Rajesh Kumar (DIN: 07123456), Authorized signatory.',
      regions: [],
    },
  ],
};

const docCinABC: DocumentInfo = {
  id: 'doc-abc-cin',
  bidId: 'BID-001',
  filename: 'Certificate_of_Incorporation.pdf',
  documentType: 'INCORPORATION_PROOF',
  mimeType: 'application/pdf',
  pageCount: 3,
  sizeBytes: 1245000,
  sha256: '38a12df08b49e19d774ba2780c102a9914ecbd098319f0525da445f1b62cc8d1',
  uploadedAt: '2026-09-28T09:13:00Z',
  status: 'EXTRACTED',
  previewPages: [
    {
      pageNumber: 1,
      title: 'Ministry of Corporate Affairs - Certificate of Incorporation',
      textSnippet: 'GOVERNMENT OF INDIA\nMINISTRY OF CORPORATE AFFAIRS\nCentral Registration Centre\nCERTIFICATE OF INCORPORATION\n[Pursuant to sub-section (2) of section 7 and sub-section (1) of section 8 of the Companies Act, 2013]\nI hereby certify that ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED is incorporated on this Twenty-fourth day of November Two thousand sixteen under the Companies Act, 2013.\nThe Corporate Identity Number of the company is U45201TN2016PTC112345.\nGiven under my hand at Chennai this 24th day of November 2016.',
      regions: [
        {
          label: 'Corporate Identity Number (CIN)',
          value: 'U45201TN2016PTC112345',
          box: { x: 22, y: 52, width: 56, height: 9 },
        },
      ],
    },
    {
      pageNumber: 2,
      title: 'Memorandum of Association (MoA) - Main Objects',
      textSnippet: 'Civil construction, office building construction, structural contracting.',
      regions: [],
    },
    {
      pageNumber: 3,
      title: 'Articles of Association (AoA) - Signatories',
      textSnippet: 'Articles signed by promoters and registered under RoC Chennai.',
      regions: [],
    },
  ],
};

const docPanABC: DocumentInfo = {
  id: 'doc-abc-pan',
  bidId: 'BID-001',
  filename: 'PAN_Card.pdf',
  documentType: 'IDENTITY_PROOF',
  mimeType: 'application/pdf',
  pageCount: 1,
  sizeBytes: 420000,
  sha256: 'e519c72e411082abdfa87263b65287f4c391bc448e02d334511d782199b1a03e',
  uploadedAt: '2026-09-28T09:12:30Z',
  status: 'EXTRACTED',
  previewPages: [
    {
      pageNumber: 1,
      title: 'INCOME TAX DEPARTMENT - GOVT. OF INDIA - PERMANENT ACCOUNT NUMBER CARD',
      textSnippet: 'INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nABC INFRASTRUCTURE SOLUTIONS PVT LTD\nIncorporation Date: 24/11/2016\nPermanent Account Number: AAAAA0000A',
      regions: [
        {
          label: 'PAN',
          value: 'AAAAA0000A',
          box: { x: 24, y: 58, width: 48, height: 12 },
        },
      ],
    },
  ],
};

const docUdyamABC: DocumentInfo = {
  id: 'doc-abc-udyam',
  bidId: 'BID-001',
  filename: 'Udyam_Registration.pdf',
  documentType: 'MSME_CERTIFICATE',
  mimeType: 'application/pdf',
  pageCount: 2,
  sizeBytes: 520000,
  sha256: 'c37a6b29d44811aef71092834b6e5118742918bbca33902187654321fedcba98',
  uploadedAt: '2026-09-28T09:14:00Z',
  status: 'EXTRACTED',
  previewPages: [
    {
      pageNumber: 1,
      title: 'UDYAM REGISTRATION CERTIFICATE',
      textSnippet: 'MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES\nUDYAM REGISTRATION NUMBER: UDYAM-TN-02-0012345\nNAME OF ENTERPRISE: ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED\nTYPE OF ENTERPRISE: Small Enterprise',
      regions: [
        {
          label: 'Udyam Registration Number',
          value: 'UDYAM-TN-02-0012345',
          box: { x: 22, y: 32, width: 56, height: 8 },
        },
      ],
    },
  ],
};

export const sampleBids: Bid[] = [
  {
    id: 'BID-001',
    tenderId: 'TND-GEM-2025-0012',
    bidderId: 'BDR-001',
    bidder: {
      id: 'BDR-001',
      legalName: 'ABC Infra Solutions',
      gstin: '22AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      cin: 'U45201TN2016PTC112345',
      udyam: 'UDYAM-TN-02-0012345',
      epfoCode: 'TNCHE0098765000',
      email: 'bids@abcinfra.co.in',
      phone: '+91 44 2234 5678',
      city: 'Chennai',
      state: 'Tamil Nadu',
    },
    submittedAt: '2026-09-28T09:15:00Z',
    status: 'NEEDS_ATTENTION',
    complianceScore: 72,
    riskLevel: 'HIGH',
    documents: [docGstABC, docCinABC, docPanABC, docUdyamABC],
    requirementResults: [], // populated during initialization
  },
  {
    id: 'BID-002',
    tenderId: 'TND-GEM-2025-0012',
    bidderId: 'BDR-002',
    bidder: {
      id: 'BDR-002',
      legalName: 'Shree Tech Pvt Ltd',
      gstin: '27BBBBB1111B2Z7',
      pan: 'BBBBB1111B',
      cin: 'U72200MH2015PTC265432',
      udyam: 'UDYAM-MH-01-0087654',
      epfoCode: 'MHBOM0012345000',
      email: 'tenders@shreetech.com',
      phone: '+91 22 6677 8899',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    submittedAt: '2026-09-28T10:10:00Z',
    status: 'IN_VERIFICATION',
    complianceScore: 68,
    riskLevel: 'MEDIUM',
    documents: [docGstABC],
    requirementResults: [],
  },
  {
    id: 'BID-003',
    tenderId: 'TND-GEM-2025-0012',
    bidderId: 'BDR-003',
    bidder: {
      id: 'BDR-003',
      legalName: 'National BuildCorp',
      gstin: '29CCCCC2222C3Z9',
      pan: 'CCCCC2222C',
      cin: 'U45200KA2012PLC198765',
      udyam: 'UDYAM-KR-03-0099881',
      epfoCode: 'KNBLR0055443000',
      email: 'contracts@nationalbuildcorp.in',
      phone: '+91 80 4123 9900',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
    submittedAt: '2026-09-28T11:45:00Z',
    status: 'VERIFIED',
    complianceScore: 92,
    riskLevel: 'LOW',
    documents: [docGstABC],
    requirementResults: [],
  },
  {
    id: 'BID-004',
    tenderId: 'TND-GEM-2025-0012',
    bidderId: 'BDR-004',
    bidder: {
      id: 'BDR-004',
      legalName: 'Omkar Enterprises',
      gstin: '24DDDDD3333D4Z9',
      pan: 'DDDDD3333D',
      cin: 'U45203GJ2019PTC109876',
      udyam: 'UDYAM-GJ-01-0034567',
      epfoCode: 'GJAHD0077889000',
      email: 'info@omkargroup.net',
      phone: '+91 79 2655 4321',
      city: 'Ahmedabad',
      state: 'Gujarat',
    },
    submittedAt: '2026-09-28T13:20:00Z',
    status: 'IN_VERIFICATION',
    complianceScore: 56,
    riskLevel: 'MEDIUM',
    documents: [docGstABC],
    requirementResults: [],
  },
  {
    id: 'BID-005',
    tenderId: 'TND-GEM-2025-0012',
    bidderId: 'BDR-005',
    bidder: {
      id: 'BDR-005',
      legalName: 'Delta Constructions',
      gstin: '07EEEEE4444E5Z0',
      pan: 'EEEEE4444E',
      cin: 'U45201DL2014PLC098123',
      udyam: '',
      email: 'legal@deltaconstructions.com',
      phone: '+91 11 4321 0000',
      city: 'New Delhi',
      state: 'Delhi',
    },
    submittedAt: '2026-09-28T14:05:00Z',
    status: 'NEEDS_ATTENTION',
    complianceScore: 41,
    riskLevel: 'HIGH',
    documents: [docGstABC],
    requirementResults: [],
  },
  {
    id: 'BID-006',
    tenderId: 'TND-GEM-2025-0012',
    bidderId: 'BDR-006',
    bidder: {
      id: 'BDR-006',
      legalName: 'Premier Engineering Works',
      gstin: '33FFFFF5555F6Z2',
      pan: 'GGGGG9999G', // deliberate mismatch for Case B
      cin: 'U28112TN2017PTC118901',
      udyam: 'UDYAM-TN-02-0044556',
      email: 'tender@premierengg.in',
      phone: '+91 44 2855 1234',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
    },
    submittedAt: '2026-09-28T15:30:00Z',
    status: 'NEEDS_ATTENTION',
    complianceScore: 64,
    riskLevel: 'HIGH',
    documents: [docGstABC],
    requirementResults: [],
  },
];

/**
 * Initialize evaluation results for all 18 requirements of ABC Infra Solutions (BID-001)
 * specifically constructing the exact state shown in panel 06, 07, 08:
 * - 18 total requirements
 * - Passed: 13
 * - Failed: 2 (CIN_001 [not found in MCA database] and GST_001 [overdue return filing])
 * - Review: 2 (OEM_001 [ambiguous seal/format], ITR_001 [unclear CA UDIN stamp])
 * - Unverifiable: 1 (EPF_001 [EPFO portal timeout])
 * - Score: 72/100
 * - Risk: HIGH (due to mandatory FAIL on CIN_001 and GST_001)
 */
export async function initializeBid1Evaluation(): Promise<void> {
  const bid = sampleBids[0];
  const reqs = requirementsTender1;
  const results: RequirementResult[] = [];

  for (const req of reqs) {
    let result: RequirementResult;

    if (req.code === 'GST_001') {
      // Overdue return filing simulated
      const externalGst = queryGSTPortal(bid.bidder.gstin, { filingStatus: 'OVERDUE', regStatus: 'ACTIVE' });
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: 'ev-gst-01',
            documentId: docGstABC.id,
            documentName: docGstABC.filename,
            pageNumber: 1,
            boundingBox: { x: 26, y: 34, width: 44, height: 7 },
            sourceText: 'Registration Number: 22AAAAA0000A1Z5',
            fieldName: 'GSTIN',
            extractedValue: bid.bidder.gstin,
            extractionMethod: 'REGEX',
            confidence: 0.99,
            sha256: docGstABC.sha256,
            grounded: true,
          },
        ],
        externalVerification: externalGst,
        bidderDetails: bid.bidder,
      });
    } else if (req.code === 'CIN_001') {
      // CIN NOT FOUND in MCA database (panel 06 exact scenario)
      const externalMca = queryMCAPortal(bid.bidder.cin, { foundInMca: false });
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: 'ev-cin-01',
            documentId: docCinABC.id,
            documentName: docCinABC.filename,
            pageNumber: 1,
            boundingBox: { x: 22, y: 52, width: 56, height: 9 },
            sourceText: 'The Corporate Identity Number of the company is U45201TN2016PTC112345.',
            fieldName: 'CIN',
            extractedValue: bid.bidder.cin,
            extractionMethod: 'OCR_TESSERACT',
            confidence: 0.94,
            sha256: docCinABC.sha256,
            grounded: true,
          },
        ],
        externalVerification: externalMca,
        bidderDetails: bid.bidder,
      });
      // Set advisory
      const adv = await generateAdvisory(req, result, bid.bidder.legalName);
      result.advisory = {
        summary: adv.summary,
        explanation: adv.explanation,
        suggestedAction: adv.suggestedAction,
        generatedAt: new Date().toISOString(),
        isAiEnhanced: adv.isAiEnhanced,
      };
      // Pre-set existing officer clarification request
      result.officerDecision = {
        disposition: 'REQUEST_CLARIFICATION',
        justification: 'CIN not found in MCA database. Requested bidder to provide incorporation certificate with verified RoC extract.',
        decidedBy: currentUser.name,
        decidedAt: '2026-09-28T10:45:00Z',
      };
    } else if (req.code === 'PAN_001') {
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: 'ev-pan-01',
            documentId: docPanABC.id,
            documentName: docPanABC.filename,
            pageNumber: 1,
            boundingBox: { x: 24, y: 58, width: 48, height: 12 },
            sourceText: 'Permanent Account Number: AAAAA0000A',
            fieldName: 'PAN',
            extractedValue: bid.bidder.pan,
            extractionMethod: 'REGEX',
            confidence: 0.98,
            sha256: docPanABC.sha256,
            grounded: true,
          },
        ],
        externalVerification: {
          adapterName: 'Income Tax e-Filing Database',
          sourceLabel: 'SIMULATED ADAPTER - ITD PAN Database (incometax.gov.in)',
          status: 'SUCCESS',
          queriedValue: bid.bidder.pan,
          latencyMs: 135,
          fetchedAt: new Date().toISOString(),
          fields: { status: 'OPERATIVE', nameMatched: true },
          responseHash: 'a718b9c201884f',
        },
        bidderDetails: bid.bidder,
      });
    } else if (req.code === 'UDYAM_001') {
      const extUdyam = queryUdyamPortal(bid.bidder.udyam);
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: 'ev-udyam-01',
            documentId: docUdyamABC.id,
            documentName: docUdyamABC.filename,
            pageNumber: 1,
            boundingBox: { x: 22, y: 32, width: 56, height: 8 },
            sourceText: 'UDYAM REGISTRATION NUMBER: UDYAM-TN-02-0012345',
            fieldName: 'UDYAM_NO',
            extractedValue: bid.bidder.udyam,
            extractionMethod: 'REGEX',
            confidence: 0.97,
            sha256: docUdyamABC.sha256,
            grounded: true,
          },
        ],
        externalVerification: extUdyam,
        bidderDetails: bid.bidder,
      });
    } else if (req.code === 'OEM_001') {
      // REVIEW: Optional, unclear seal
      result = {
        requirementId: req.id,
        state: 'REVIEW',
        scoreValue: 0.5,
        weight: 1,
        reason: 'OEM authorization letter seal is partially faded; manual officer inspection recommended.',
        evidence: [
          {
            id: 'ev-oem-01',
            documentId: 'doc-abc-oem',
            documentName: 'OEM_Authorization_MAF.pdf',
            pageNumber: 1,
            boundingBox: { x: 30, y: 40, width: 40, height: 15 },
            sourceText: 'Authorized Channel Partner - Southern Region Spares & Maintenance',
            fieldName: 'OEM_AUTHORIZATION',
            extractedValue: 'Mitsubishi Electric Elevators',
            extractionMethod: 'OCR_TESSERACT',
            confidence: 0.52,
            sha256: '992a0198bb42f102c91',
            grounded: true,
          },
        ],
        validationChecks: [
          {
            id: 'chk-oem-seal',
            checkCode: 'SEAL_LEGIBILITY',
            description: 'OEM Corporate Stamp Legibility Check',
            inputValue: 'Faint ink impression (52% confidence)',
            expectedValue: 'Clear legible OEM seal',
            result: 'REVIEW',
            reason: 'Seal impression blurred on scan page 1',
            source: 'OEM_Authorization_MAF.pdf',
          },
        ],
      };
    } else if (req.code === 'EPF_001') {
      // UNVERIFIABLE: External EPFO portal timeout
      result = {
        requirementId: req.id,
        state: 'UNVERIFIABLE',
        scoreValue: 0.0,
        weight: 3,
        reason: 'External dependency (EPFO Employer Portal) timed out after 5000ms',
        evidence: [
          {
            id: 'ev-epf-01',
            documentId: 'doc-abc-epf',
            documentName: 'EPFO_Registration_ECR.pdf',
            pageNumber: 1,
            boundingBox: { x: 20, y: 30, width: 50, height: 10 },
            sourceText: 'Establishment ID: TNCHE0098765000',
            fieldName: 'EPFO_ESTABLISHMENT_ID',
            extractedValue: bid.bidder.epfoCode || 'TNCHE0098765000',
            extractionMethod: 'REGEX',
            confidence: 0.95,
            sha256: 'e108849b2c31',
            grounded: true,
          },
        ],
        validationChecks: [
          {
            id: 'chk-epf-portal',
            checkCode: 'EPFO_PORTAL_CONNECTIVITY',
            description: 'Online verification with unifiedportal-epfindia.gov.in',
            inputValue: 'TIMEOUT (5000ms)',
            expectedValue: 'HTTP 200 SUCCESS',
            result: 'REVIEW',
            reason: 'Gateway timeout querying establishment records',
            source: 'SIMULATED ADAPTER - EPFO Portal',
          },
        ],
        externalVerification: {
          adapterName: 'EPFO Portal',
          sourceLabel: 'SIMULATED ADAPTER - EPFO Portal (epfindia.gov.in)',
          status: 'TIMEOUT',
          queriedValue: bid.bidder.epfoCode || 'TNCHE0098765000',
          latencyMs: 5000,
          fetchedAt: new Date().toISOString(),
          fields: { error: 'Gateway Timeout' },
          responseHash: 'f491c09a82',
        },
      };
    } else if (req.code === 'ITR_001') {
      // REVIEW: CA UDIN stamp faint
      result = {
        requirementId: req.id,
        state: 'REVIEW',
        scoreValue: 0.5,
        weight: 3,
        reason: 'CA UDIN barcode impression faint; manual inspection required to verify ICAI registry link',
        evidence: [
          {
            id: 'ev-itr-01',
            documentId: 'doc-abc-itr',
            documentName: 'ITR_Acknowledgements_3Y.pdf',
            pageNumber: 1,
            boundingBox: { x: 25, y: 70, width: 45, height: 10 },
            sourceText: 'UDIN: 24089123AAAA0012',
            fieldName: 'CA_UDIN',
            extractedValue: '24089123AAAA0012',
            extractionMethod: 'OCR_TESSERACT',
            confidence: 0.58,
            sha256: 'a1b2c3d4e5f6',
            grounded: true,
          },
        ],
        validationChecks: [
          {
            id: 'chk-itr-udin',
            checkCode: 'UDIN_LEGIBILITY',
            description: 'ICAI UDIN clarity threshold',
            inputValue: '58% OCR confidence',
            expectedValue: '>= 60%',
            result: 'REVIEW',
            reason: 'Slight ink bleed on auditor rubber stamp',
            source: 'ITR_Acknowledgements_3Y.pdf',
          },
        ],
      };
    } else {
      // All other requirements pass
      result = {
        requirementId: req.id,
        state: 'PASS',
        scoreValue: 1.0,
        weight: req.mandatory ? 3 : 1,
        reason: 'Mandatory documentation verified and compliance criteria satisfied',
        evidence: [
          {
            id: `ev-${req.code.toLowerCase()}-01`,
            documentId: `doc-${req.code.toLowerCase()}`,
            documentName: req.evidenceRequired[0] || 'Tender_Proof.pdf',
            pageNumber: 1,
            boundingBox: { x: 20, y: 35, width: 60, height: 12 },
            sourceText: `Verified criteria for ${req.title}`,
            fieldName: req.checksRequired[0] || 'STATUTORY_COMPLIANCE',
            extractedValue: 'COMPLIANT_RECORD',
            extractionMethod: 'REGEX',
            confidence: 0.98,
            sha256: '7c9812df0821',
            grounded: true,
          },
        ],
        validationChecks: [
          {
            id: `chk-${req.code.toLowerCase()}-v1`,
            checkCode: req.checksRequired[0] || 'VALIDATION_CHECK',
            description: `Verification check for ${req.title}`,
            inputValue: 'Submitted in full',
            expectedValue: 'Satisfactory proof',
            result: 'PASS',
            reason: 'Criteria fully satisfied',
            source: req.evidenceRequired[0] || 'Bid Pack',
          },
        ],
      };
    }

    results.push(result);
  }

  bid.requirementResults = results;
  bid.complianceScore = calculateComplianceScore(results);
  bid.riskLevel = calculateRiskLevel(reqs, results);
}

// Self-initialize all bids on module load
export async function initializeAllBidsEvaluation(): Promise<void> {
  await initializeBid1Evaluation();

  const reqs = requirementsTender1;

  // Initialize BID-002: Shree Tech Pvt Ltd (Clean Compliant Pass)
  const bid2 = sampleBids[1];
  if (bid2) {
    bid2.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: 'PASS',
      scoreValue: 1.0,
      weight: req.mandatory ? 3 : 1,
      reason: 'Full statutory compliance verified against portal registers and certified certificates.',
      evidence: [
        {
          id: `ev-bid2-${req.code.toLowerCase()}`,
          documentId: 'doc-shree-cert',
          documentName: 'ShreeTech_Certified_BidPack.pdf',
          pageNumber: 1,
          boundingBox: { x: 22, y: 35, width: 55, height: 10 },
          sourceText: `Statutory verification for ${req.title} verified.`,
          fieldName: req.checksRequired[0] || 'COMPLIANCE',
          extractedValue: 'VERIFIED_COMPLIANT',
          extractionMethod: 'REGEX',
          confidence: 0.99,
          sha256: '772b8912ef09a82',
          grounded: true,
        },
      ],
      validationChecks: [
        {
          id: `chk-bid2-${req.code}`,
          checkCode: req.checksRequired[0] || 'RULE_CHECK',
          description: `Compliance validation for ${req.title}`,
          inputValue: 'Valid and active record',
          expectedValue: 'Active and current',
          result: 'PASS',
          reason: 'Verified against database register',
          source: req.evidenceRequired[0] || 'Tender Pack',
        },
      ],
    }));
    bid2.complianceScore = 98;
    bid2.riskLevel = 'LOW';
  }

  // Initialize BID-003: National BuildCorp (Clean Pass with 1 Review)
  const bid3 = sampleBids[2];
  if (bid3) {
    bid3.requirementResults = reqs.map((req, idx) => ({
      requirementId: req.id,
      state: idx === 6 ? 'REVIEW' : 'PASS',
      scoreValue: idx === 6 ? 0.5 : 1.0,
      weight: req.mandatory ? 3 : 1,
      reason: idx === 6 ? 'OEM endorsement stamp impression blurred; human inspection recommended.' : 'Statutory compliance satisfied.',
      evidence: [
        {
          id: `ev-bid3-${req.code.toLowerCase()}`,
          documentId: 'doc-national-cert',
          documentName: 'NationalBuildCorp_TenderDocs.pdf',
          pageNumber: 1,
          boundingBox: { x: 24, y: 40, width: 50, height: 12 },
          sourceText: `Submitted evidence for ${req.title}`,
          fieldName: req.checksRequired[0] || 'STATUTORY',
          extractedValue: 'COMPLIANT_VALUE',
          extractionMethod: 'OCR_TESSERACT',
          confidence: idx === 6 ? 0.55 : 0.96,
          sha256: '883ca0921fe7b',
          grounded: true,
        },
      ],
      validationChecks: [
        {
          id: `chk-bid3-${req.code}`,
          checkCode: req.checksRequired[0] || 'VALIDATION',
          description: `Verification for ${req.title}`,
          inputValue: 'Submitted',
          expectedValue: 'Valid',
          result: idx === 6 ? 'REVIEW' : 'PASS',
          reason: idx === 6 ? 'Low OCR confidence on stamp' : 'Passed criteria',
          source: 'NationalBuildCorp_TenderDocs.pdf',
        },
      ],
    }));
    bid3.complianceScore = 92;
    bid3.riskLevel = 'LOW';
  }

  // Initialize BID-004: Omkar Enterprises (EPFO Portal Timeout)
  const bid4 = sampleBids[3];
  if (bid4) {
    bid4.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: req.code === 'EPF_001' ? 'UNVERIFIABLE' : 'PASS',
      scoreValue: req.code === 'EPF_001' ? 0.0 : 1.0,
      weight: req.mandatory ? 3 : 1,
      reason: req.code === 'EPF_001' ? 'Simulated EPFO Portal gateway returned TIMEOUT (5000ms).' : 'Verified compliant.',
      evidence: [
        {
          id: `ev-bid4-${req.code.toLowerCase()}`,
          documentId: 'doc-omkar-cert',
          documentName: 'Omkar_Compliance_Pack.pdf',
          pageNumber: 1,
          boundingBox: { x: 20, y: 30, width: 60, height: 10 },
          sourceText: `Omkar Enterprises proof for ${req.title}`,
          fieldName: req.checksRequired[0] || 'RECORD',
          extractedValue: 'VALID',
          extractionMethod: 'REGEX',
          confidence: 0.95,
          sha256: '661fa98012b',
          grounded: true,
        },
      ],
      validationChecks: [
        {
          id: `chk-bid4-${req.code}`,
          checkCode: req.checksRequired[0] || 'CHECK',
          description: `Validation for ${req.title}`,
          inputValue: req.code === 'EPF_001' ? 'TIMEOUT' : 'Valid',
          expectedValue: 'Active',
          result: req.code === 'EPF_001' ? 'REVIEW' : 'PASS',
          reason: req.code === 'EPF_001' ? 'Gateway timeout' : 'Passed',
          source: 'Simulated Gateway',
        },
      ],
    }));
    bid4.complianceScore = 84;
    bid4.riskLevel = 'MEDIUM';
  }

  // Initialize BID-005: Delta Constructions (Debarred Entity)
  const bid5 = sampleBids[4];
  if (bid5) {
    bid5.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: req.code === 'DEBAR_001' ? 'FAIL' : 'PASS',
      scoreValue: req.code === 'DEBAR_001' ? 0.0 : 1.0,
      weight: req.mandatory ? 3 : 1,
      reason: req.code === 'DEBAR_001' ? 'Entity actively listed on Central Debarment Register (Order MoHUA/2024/77).' : 'Documentation verified.',
      evidence: [
        {
          id: `ev-bid5-${req.code.toLowerCase()}`,
          documentId: 'doc-delta-cert',
          documentName: 'Delta_Construction_Documents.pdf',
          pageNumber: 1,
          boundingBox: { x: 20, y: 40, width: 50, height: 12 },
          sourceText: `Delta proof for ${req.title}`,
          fieldName: req.checksRequired[0] || 'DEBARMENT',
          extractedValue: req.code === 'DEBAR_001' ? 'DEBARRED' : 'VALID',
          extractionMethod: 'REGEX',
          confidence: 0.99,
          sha256: '994bd012a9',
          grounded: true,
        },
      ],
      validationChecks: [
        {
          id: `chk-bid5-${req.code}`,
          checkCode: req.checksRequired[0] || 'REGISTRY',
          description: `Clearance check for ${req.title}`,
          inputValue: req.code === 'DEBAR_001' ? 'FOUND IN DEBARMENT REGISTER' : 'Clean record',
          expectedValue: 'CLEAN RECORD (NOT DEBARRED)',
          result: req.code === 'DEBAR_001' ? 'FAIL' : 'PASS',
          reason: req.code === 'DEBAR_001' ? 'Debarred under GFR 151' : 'Clear',
          source: 'Central Debarment Registry',
        },
      ],
    }));
    bid5.complianceScore = 41;
    bid5.riskLevel = 'HIGH';
  }

  // Initialize BID-006: Premier Engineering Works (GSTIN-PAN Mismatch)
  const bid6 = sampleBids[5];
  if (bid6) {
    bid6.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: req.code === 'GST_001' ? 'FAIL' : 'PASS',
      scoreValue: req.code === 'GST_001' ? 0.0 : 1.0,
      weight: req.mandatory ? 3 : 1,
      reason: req.code === 'GST_001' ? 'Structural mismatch: embedded PAN in GSTIN does not match standalone PAN card.' : 'Verified.',
      evidence: [
        {
          id: `ev-bid6-${req.code.toLowerCase()}`,
          documentId: 'doc-premier-cert',
          documentName: 'Premier_Engineering_Bid.pdf',
          pageNumber: 1,
          boundingBox: { x: 22, y: 45, width: 55, height: 10 },
          sourceText: `Premier proof for ${req.title}`,
          fieldName: 'GSTIN',
          extractedValue: '33FFFFF5555F6Z2',
          extractionMethod: 'REGEX',
          confidence: 0.98,
          sha256: '551eb0921c',
          grounded: true,
        },
      ],
      validationChecks: [
        {
          id: `chk-bid6-${req.code}`,
          checkCode: req.checksRequired[0] || 'CHECKSUM',
          description: `Validation for ${req.title}`,
          inputValue: req.code === 'GST_001' ? 'PAN MISMATCH (FFFFF5555F vs GGGGG9999G)' : 'Compliant',
          expectedValue: 'EXACT PAN MATCH',
          result: req.code === 'GST_001' ? 'FAIL' : 'PASS',
          reason: req.code === 'GST_001' ? 'Checksum / PAN cross-check failed' : 'Pass',
          source: 'Rule Engine Mod-36',
        },
      ],
    }));
    bid6.complianceScore = 64;
    bid6.riskLevel = 'HIGH';
  }
}

// Self-initialize on module load
initializeAllBidsEvaluation().catch((err) => console.error('Error initializing seed evaluation:', err));

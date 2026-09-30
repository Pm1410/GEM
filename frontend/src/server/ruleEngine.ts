import {
  Requirement,
  RequirementResult,
  ValidationCheck,
  EvidenceItem,
  ExternalVerification,
  VerificationState,
  RiskLevel,
} from './domain';

// --- TIER A VALIDATORS ---

/**
 * Validate standard Indian PAN format: 5 letters, 4 digits, 1 letter
 * Example: AAACA0001A
 */
export function validatePANFormat(pan: string): boolean {
  if (!pan) return false;
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.trim().toUpperCase());
}

/**
 * Validate standard Indian GSTIN format:
 * 2 digits (state code) + 10 chars PAN + 1 digit (entity number) + 'Z' + 1 checksum char
 * Example: 22AAAAA0000A1Z5
 */
export function validateGSTINFormat(gstin: string): boolean {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
}

/**
 * Deterministic GSTIN Checksum calculation (Indian GSTN Mod-36 algorithm)
 */
export function validateGSTINChecksum(gstin: string): boolean {
  if (!validateGSTINFormat(gstin)) return false;
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const clean = gstin.trim().toUpperCase();
  const inputChars = clean.slice(0, 14);
  const expectedCheckChar = clean.charAt(14);

  let factor = 2;
  let sum = 0;
  const checkCodeLength = chars.length;

  for (let i = inputChars.length - 1; i >= 0; i--) {
    const codePoint = chars.indexOf(inputChars.charAt(i));
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / checkCodeLength) + (addend % checkCodeLength);
    sum += addend;
  }

  const remainder = sum % checkCodeLength;
  const checkCode = (checkCodeLength - remainder) % checkCodeLength;
  const calculatedChar = chars.charAt(checkCode);

  return calculatedChar === expectedCheckChar;
}

/**
 * Validate that characters 3 to 12 of GSTIN match the 10-character PAN
 */
export function validateGSTINPANMatch(gstin: string, pan: string): boolean {
  if (!gstin || !pan) return false;
  const cleanGstin = gstin.trim().toUpperCase();
  const cleanPan = pan.trim().toUpperCase();
  if (cleanGstin.length < 12) return false;
  const gstinPanSlice = cleanGstin.substring(2, 12);
  return gstinPanSlice === cleanPan;
}

/**
 * Validate CIN (Corporate Identification Number):
 * 21 characters: L/U + 5 digits industry + 2 chars state + 4 digits year + 3 chars company type + 6 digits reg
 * Example: U72200TN2018PTC123456
 */
export function validateCINFormat(cin: string): boolean {
  if (!cin) return false;
  const regex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  return regex.test(cin.trim().toUpperCase());
}

/**
 * Validate Udyam Registration Number:
 * Format: UDYAM-XX-00-0000000
 * Example: UDYAM-TN-02-0012345
 */
export function validateUdyamFormat(udyam: string): boolean {
  if (!udyam) return false;
  const regex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
  return regex.test(udyam.trim().toUpperCase());
}

// --- DETERMINISTIC RULE ENGINE ---

export interface EvaluationInput {
  requirement: Requirement;
  evidenceList: EvidenceItem[];
  externalVerification?: ExternalVerification;
  bidderDetails: {
    legalName: string;
    gstin: string;
    pan: string;
    cin: string;
    udyam: string;
  };
}

/**
 * Execute pure deterministic validation for a requirement.
 * Adheres strictly to the state precedence:
 * 1. Missing evidence -> on_missing (REVIEW)
 * 2. Unverified grounding (model extraction not verbatim in source) -> REVIEW
 * 3. External portal DOWN/TIMEOUT -> on_portal_down (UNVERIFIABLE)
 * 4. Violations (checksum, mismatch, overdue, debarred) -> FAIL
 * 5. All checks satisfied -> PASS
 */
export function evaluateRequirement(input: EvaluationInput): RequirementResult {
  const { requirement, evidenceList, externalVerification, bidderDetails } = input;
  const checks: ValidationCheck[] = [];
  const weight = requirement.mandatory ? 3 : 1;

  // 1. Evidence presence check
  if (!evidenceList || evidenceList.length === 0) {
    checks.push({
      id: `chk-${requirement.code}-doc`,
      checkCode: 'EVIDENCE_PRESENCE',
      description: 'Required evidence document uploaded and verified',
      inputValue: 'None provided',
      expectedValue: requirement.evidenceRequired.join(', '),
      result: 'REVIEW',
      reason: 'Mandatory proof document not found in bidder submission pack.',
      source: 'BID_DOCUMENTS',
    });

    return {
      requirementId: requirement.id,
      state: requirement.onMissing || 'REVIEW',
      scoreValue: requirement.onMissing === 'REVIEW' ? 0.5 : 0.0,
      weight,
      reason: 'Required evidence document missing in submitted pack',
      evidence: [],
      validationChecks: checks,
      externalVerification,
    };
  }

  // 2. Evidence grounding check
  const ungroundedEvidence = evidenceList.filter((e) => !e.grounded);
  if (ungroundedEvidence.length > 0) {
    checks.push({
      id: `chk-${requirement.code}-grounding`,
      checkCode: 'EVIDENCE_GROUNDING',
      description: 'Verbatim presence of extracted facts in source text',
      inputValue: ungroundedEvidence.map((e) => e.extractedValue).join(', '),
      expectedValue: 'Verbatim text match in source page',
      result: 'REVIEW',
      reason: 'Extracted value cannot be verified verbatim against source page text.',
      source: ungroundedEvidence[0].documentName,
    });

    return {
      requirementId: requirement.id,
      state: 'REVIEW',
      scoreValue: 0.5,
      weight,
      reason: 'Extracted fact failed strict grounding check (possible OCR ambiguity)',
      evidence: evidenceList,
      validationChecks: checks,
      externalVerification,
    };
  }

  // 3. External Portal Resilience check
  if (externalVerification) {
    if (externalVerification.status === 'DOWN' || externalVerification.status === 'TIMEOUT') {
      checks.push({
        id: `chk-${requirement.code}-portal`,
        checkCode: 'PORTAL_AVAILABILITY',
        description: `Connectivity to ${externalVerification.adapterName}`,
        inputValue: externalVerification.status,
        expectedValue: 'SUCCESS',
        result: 'REVIEW',
        reason: `${externalVerification.adapterName} returned ${externalVerification.status}. External proof cannot be completed.`,
        source: externalVerification.sourceLabel,
      });

      return {
        requirementId: requirement.id,
        state: requirement.onPortalDown || 'UNVERIFIABLE',
        scoreValue: 0.0,
        weight,
        reason: `External dependency (${externalVerification.adapterName}) unavailable: ${externalVerification.status}`,
        evidence: evidenceList,
        validationChecks: checks,
        externalVerification,
      };
    }
  }

  // 4. Domain-specific rule checks
  let isFail = false;
  let failReason = '';
  let isReview = false;
  let reviewReason = '';

  switch (requirement.ruleName) {
    case 'GST_REGISTRATION_AND_FILING': {
      const gstinEvidence = evidenceList.find((e) => e.fieldName === 'GSTIN');
      const gstinVal = gstinEvidence?.extractedValue || bidderDetails.gstin;

      // Check format
      const isFormatValid = validateGSTINFormat(gstinVal);
      checks.push({
        id: `chk-${requirement.code}-gst-fmt`,
        checkCode: 'GSTIN_FORMAT',
        description: 'GSTIN follows statutory 15-character alphanumeric format',
        inputValue: gstinVal,
        expectedValue: '15-character GSTIN structure',
        result: isFormatValid ? 'PASS' : 'FAIL',
        reason: isFormatValid ? 'Format valid' : 'Invalid GSTIN length or characters',
        source: 'GST_Certificate.pdf',
      });
      if (!isFormatValid) {
        isFail = true;
        failReason = 'GSTIN format is invalid';
      }

      // Check checksum
      const isChecksumValid = validateGSTINChecksum(gstinVal);
      checks.push({
        id: `chk-${requirement.code}-gst-chk`,
        checkCode: 'GSTIN_CHECKSUM',
        description: 'GSTIN modulo-36 checksum verification',
        inputValue: gstinVal,
        expectedValue: 'Valid checksum digit',
        result: isChecksumValid ? 'PASS' : 'FAIL',
        reason: isChecksumValid ? 'Checksum matches' : 'Checksum mismatch on 15th character',
        source: 'GST_Certificate.pdf',
      });
      if (!isChecksumValid) {
        isFail = true;
        failReason = 'GSTIN checksum verification failed';
      }

      // Check PAN cross-match
      const panMatch = validateGSTINPANMatch(gstinVal, bidderDetails.pan);
      checks.push({
        id: `chk-${requirement.code}-gst-pan`,
        checkCode: 'GSTIN_PAN_MATCH',
        description: 'GSTIN characters 3-12 match bidder PAN record',
        inputValue: `${gstinVal.substring(2, 12)} vs ${bidderDetails.pan}`,
        expectedValue: bidderDetails.pan,
        result: panMatch ? 'PASS' : 'FAIL',
        reason: panMatch ? 'PAN segment matches bidder PAN' : 'Discrepancy between GSTIN and PAN',
        source: 'Cross-Document Match',
      });
      if (!panMatch) {
        isFail = true;
        failReason = 'GSTIN does not match the submitted PAN card';
      }

      // External portal status
      if (externalVerification && externalVerification.status === 'SUCCESS') {
        const portalStatus = externalVerification.fields.registrationStatus;
        const filingStatus = externalVerification.fields.returnFiling;

        const isRegActive = portalStatus === 'ACTIVE';
        checks.push({
          id: `chk-${requirement.code}-gst-active`,
          checkCode: 'PORTAL_ACTIVE',
          description: 'GST Portal registration status check',
          inputValue: portalStatus,
          expectedValue: 'ACTIVE',
          result: isRegActive ? 'PASS' : 'FAIL',
          reason: isRegActive ? 'Registration is active' : `Registration status is ${portalStatus}`,
          source: externalVerification.sourceLabel,
        });
        if (!isRegActive) {
          isFail = true;
          failReason = `GST registration is ${portalStatus}`;
        }

        const isFilingCurrent = filingStatus === 'CURRENT';
        checks.push({
          id: `chk-${requirement.code}-gst-filing`,
          checkCode: 'RETURN_FILING_CURRENT',
          description: 'Recent GSTR-3B / GSTR-1 return filing compliance',
          inputValue: `Status: ${filingStatus}, Period: ${externalVerification.fields.period || 'N/A'}`,
          expectedValue: 'CURRENT',
          result: isFilingCurrent ? 'PASS' : 'FAIL',
          reason: isFilingCurrent ? 'Returns filed up to date' : 'Statutory return filing is OVERDUE',
          source: externalVerification.sourceLabel,
        });
        if (!isFilingCurrent) {
          isFail = true;
          failReason = 'GST return filing is overdue on the portal';
        }
      }
      break;
    }

    case 'PAN_VERIFICATION': {
      const panEvidence = evidenceList.find((e) => e.fieldName === 'PAN');
      const panVal = panEvidence?.extractedValue || bidderDetails.pan;
      const isFormat = validatePANFormat(panVal);

      checks.push({
        id: `chk-${requirement.code}-pan-fmt`,
        checkCode: 'PAN_FORMAT',
        description: 'Permanent Account Number 10-digit structure',
        inputValue: panVal,
        expectedValue: '5 letters, 4 digits, 1 letter',
        result: isFormat ? 'PASS' : 'FAIL',
        reason: isFormat ? 'Valid format' : 'Invalid PAN format',
        source: 'PAN_Card.pdf',
      });
      if (!isFormat) {
        isFail = true;
        failReason = 'PAN format is invalid';
      }

      if (externalVerification && externalVerification.status === 'SUCCESS') {
        const panStatus = externalVerification.fields.status;
        const nameMatch = externalVerification.fields.nameMatched;
        checks.push({
          id: `chk-${requirement.code}-pan-db`,
          checkCode: 'PAN_DATABASE_LOOKUP',
          description: 'Direct tax database validation',
          inputValue: `Status: ${panStatus}, NameMatch: ${nameMatch}`,
          expectedValue: 'OPERATIVE / Matched',
          result: panStatus === 'OPERATIVE' && nameMatch ? 'PASS' : 'FAIL',
          reason: panStatus === 'OPERATIVE' ? 'PAN is operative and linked' : 'PAN record inactive or mismatched',
          source: externalVerification.sourceLabel,
        });
        if (panStatus !== 'OPERATIVE') {
          isFail = true;
          failReason = 'PAN status is inoperative';
        }
      }
      break;
    }

    case 'CIN_EXISTS': {
      const cinEvidence = evidenceList.find((e) => e.fieldName === 'CIN');
      const cinVal = cinEvidence?.extractedValue || bidderDetails.cin;
      const isFormat = validateCINFormat(cinVal);

      checks.push({
        id: `chk-${requirement.code}-cin-fmt`,
        checkCode: 'CIN_FORMAT',
        description: 'Corporate Identification Number (21 alphanumeric characters)',
        inputValue: cinVal || 'None',
        expectedValue: 'Valid 21-character CIN',
        result: isFormat ? 'PASS' : 'FAIL',
        reason: isFormat ? 'Format verified' : 'Invalid CIN structure or empty',
        source: 'Certificate_of_Incorporation.pdf',
      });

      if (!isFormat) {
        isFail = true;
        failReason = 'Corporate Identification Number (CIN) format is invalid';
      }

      if (externalVerification) {
        if (externalVerification.status === 'SUCCESS') {
          const mcaExists = externalVerification.fields.foundInMcaDatabase;
          checks.push({
            id: `chk-${requirement.code}-mca`,
            checkCode: 'MCA_DATABASE_RECORD',
            description: 'Ministry of Corporate Affairs registry lookup',
            inputValue: cinVal,
            expectedValue: 'Active company record in MCA21',
            result: mcaExists ? 'PASS' : 'FAIL',
            reason: mcaExists ? 'Company active in MCA21' : 'CIN not found in MCA database',
            source: externalVerification.sourceLabel,
          });
          if (!mcaExists) {
            isFail = true;
            failReason = 'CIN not found in MCA database';
          }
        }
      }
      break;
    }

    case 'DEBARMENT_REGISTRY_CHECK': {
      if (externalVerification && externalVerification.status === 'SUCCESS') {
        const isDebarred = externalVerification.fields.isDebarred === true;
        checks.push({
          id: `chk-${requirement.code}-debar`,
          checkCode: 'DEBARMENT_STATUS',
          description: 'Central Debarment & Blacklisting Registry check',
          inputValue: isDebarred ? `DEBARRED: ${externalVerification.fields.debarmentReason}` : 'CLEAN',
          expectedValue: 'CLEAN',
          result: isDebarred ? 'FAIL' : 'PASS',
          reason: isDebarred ? `Bidder listed in debarment registry: ${externalVerification.fields.debarmentReason}` : 'No debarment records found',
          source: externalVerification.sourceLabel,
        });
        if (isDebarred) {
          isFail = true;
          failReason = `Bidder is debarred: ${externalVerification.fields.debarmentReason}`;
        }
      }
      break;
    }

    case 'UDYAM_MSME_REGISTRATION': {
      const udyamEvidence = evidenceList.find((e) => e.fieldName === 'UDYAM_NO');
      const udyamVal = udyamEvidence?.extractedValue || bidderDetails.udyam;
      const isFormat = validateUdyamFormat(udyamVal);

      checks.push({
        id: `chk-${requirement.code}-udyam-fmt`,
        checkCode: 'UDYAM_FORMAT',
        description: 'Udyam Registration Number format check',
        inputValue: udyamVal || 'None',
        expectedValue: 'UDYAM-XX-00-0000000',
        result: isFormat ? 'PASS' : 'FAIL',
        reason: isFormat ? 'Udyam format verified' : 'Invalid Udyam registration structure',
        source: 'Udyam_Registration.pdf',
      });
      if (!isFormat) {
        isFail = true;
        failReason = 'Invalid Udyam registration number';
      }

      if (externalVerification && externalVerification.status === 'SUCCESS') {
        const active = externalVerification.fields.enterpriseStatus === 'ACTIVE';
        checks.push({
          id: `chk-${requirement.code}-udyam-active`,
          checkCode: 'UDYAM_PORTAL_ACTIVE',
          description: 'MSME portal enterprise active status',
          inputValue: externalVerification.fields.enterpriseStatus,
          expectedValue: 'ACTIVE',
          result: active ? 'PASS' : 'FAIL',
          reason: active ? 'Active MSME registration' : 'MSME certificate expired or inactive',
          source: externalVerification.sourceLabel,
        });
        if (!active) {
          isFail = true;
          failReason = 'MSME registration is not active';
        }
      }
      break;
    }

    default: {
      // General requirement check
      const primaryEvidence = evidenceList[0];
      if (primaryEvidence.confidence < 0.6) {
        checks.push({
          id: `chk-${requirement.code}-conf`,
          checkCode: 'CONFIDENCE_THRESHOLD',
          description: 'OCR & extraction confidence score meets minimum threshold (0.6)',
          inputValue: `${Math.round(primaryEvidence.confidence * 100)}%`,
          expectedValue: '>= 60%',
          result: 'REVIEW',
          reason: 'Low OCR clarity on submitted certificate requires officer inspection.',
          source: primaryEvidence.documentName,
        });
        isReview = true;
        reviewReason = 'Low OCR clarity requires officer review';
      } else {
        checks.push({
          id: `chk-${requirement.code}-ok`,
          checkCode: 'CRITERIA_VERIFICATION',
          description: 'Statutory verification criteria satisfied',
          inputValue: primaryEvidence.extractedValue,
          expectedValue: 'Valid specification proof',
          result: 'PASS',
          reason: 'Criteria verified against submitted certificate',
          source: primaryEvidence.documentName,
        });
      }
      break;
    }
  }

  let finalState: VerificationState = 'PASS';
  let finalReason = 'All validation criteria verified successfully';
  let scoreValue = 1.0;

  if (isFail) {
    finalState = 'FAIL';
    finalReason = failReason;
    scoreValue = 0.0;
  } else if (isReview) {
    finalState = 'REVIEW';
    finalReason = reviewReason;
    scoreValue = 0.5;
  }

  return {
    requirementId: requirement.id,
    state: finalState,
    scoreValue,
    weight,
    reason: finalReason,
    evidence: evidenceList,
    validationChecks: checks,
    externalVerification,
  };
}

// --- SCORING & RISK ENGINES ---

/**
 * Score formula:
 * PASS = 1.0, REVIEW = 0.5, UNVERIFIABLE = 0.0, FAIL = 0.0
 * Mandatory weight = 3, Optional weight = 1
 * Score = 100 * Σ(weight * result_value) / Σ(weight)
 * UNVERIFIABLE stays in denominator!
 */
export function calculateComplianceScore(results: RequirementResult[]): number {
  if (!results || results.length === 0) return 0;
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const r of results) {
    totalWeight += r.weight;
    totalWeightedScore += r.weight * r.scoreValue;
  }

  if (totalWeight === 0) return 0;
  return Math.round((100 * totalWeightedScore) / totalWeight);
}

/**
 * Independent Risk Calculation:
 * HIGH: Any mandatory FAIL
 * MEDIUM: Any mandatory REVIEW OR any mandatory UNVERIFIABLE OR any optional FAIL
 * LOW: Otherwise
 * (Never derive risk from score!)
 */
export function calculateRiskLevel(
  requirements: Requirement[],
  results: RequirementResult[]
): RiskLevel {
  const reqMap = new Map(requirements.map((r) => [r.id, r]));

  let hasMandatoryFail = false;
  let hasMandatoryReview = false;
  let hasMandatoryUnverifiable = false;
  let hasOptionalFail = false;

  for (const res of results) {
    const req = reqMap.get(res.requirementId);
    const isMandatory = req?.mandatory ?? (res.weight === 3);

    if (isMandatory) {
      if (res.state === 'FAIL') {
        hasMandatoryFail = true;
      } else if (res.state === 'REVIEW') {
        hasMandatoryReview = true;
      } else if (res.state === 'UNVERIFIABLE') {
        hasMandatoryUnverifiable = true;
      }
    } else {
      if (res.state === 'FAIL') {
        hasOptionalFail = true;
      }
    }
  }

  if (hasMandatoryFail) {
    return 'HIGH';
  }
  if (hasMandatoryReview || hasMandatoryUnverifiable || hasOptionalFail) {
    return 'MEDIUM';
  }
  return 'LOW';
}

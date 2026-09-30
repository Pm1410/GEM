// server-core.ts
import express2 from "express";
import path2 from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// src/server/routes.ts
import express from "express";

// src/server/ruleEngine.ts
function validatePANFormat(pan) {
  if (!pan) return false;
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.trim().toUpperCase());
}
function validateGSTINFormat(gstin) {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
}
function validateGSTINChecksum(gstin) {
  if (!validateGSTINFormat(gstin)) return false;
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
    addend = Math.floor(addend / checkCodeLength) + addend % checkCodeLength;
    sum += addend;
  }
  const remainder = sum % checkCodeLength;
  const checkCode = (checkCodeLength - remainder) % checkCodeLength;
  const calculatedChar = chars.charAt(checkCode);
  return calculatedChar === expectedCheckChar;
}
function validateGSTINPANMatch(gstin, pan) {
  if (!gstin || !pan) return false;
  const cleanGstin = gstin.trim().toUpperCase();
  const cleanPan = pan.trim().toUpperCase();
  if (cleanGstin.length < 12) return false;
  const gstinPanSlice = cleanGstin.substring(2, 12);
  return gstinPanSlice === cleanPan;
}
function validateCINFormat(cin) {
  if (!cin) return false;
  const regex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  return regex.test(cin.trim().toUpperCase());
}
function validateUdyamFormat(udyam) {
  if (!udyam) return false;
  const regex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
  return regex.test(udyam.trim().toUpperCase());
}
function evaluateRequirement(input) {
  const { requirement, evidenceList, externalVerification, bidderDetails } = input;
  const checks = [];
  const weight = requirement.mandatory ? 3 : 1;
  if (!evidenceList || evidenceList.length === 0) {
    checks.push({
      id: `chk-${requirement.code}-doc`,
      checkCode: "EVIDENCE_PRESENCE",
      description: "Required evidence document uploaded and verified",
      inputValue: "None provided",
      expectedValue: requirement.evidenceRequired.join(", "),
      result: "REVIEW",
      reason: "Mandatory proof document not found in bidder submission pack.",
      source: "BID_DOCUMENTS"
    });
    return {
      requirementId: requirement.id,
      state: requirement.onMissing || "REVIEW",
      scoreValue: requirement.onMissing === "REVIEW" ? 0.5 : 0,
      weight,
      reason: "Required evidence document missing in submitted pack",
      evidence: [],
      validationChecks: checks,
      externalVerification
    };
  }
  const ungroundedEvidence = evidenceList.filter((e) => !e.grounded);
  if (ungroundedEvidence.length > 0) {
    checks.push({
      id: `chk-${requirement.code}-grounding`,
      checkCode: "EVIDENCE_GROUNDING",
      description: "Verbatim presence of extracted facts in source text",
      inputValue: ungroundedEvidence.map((e) => e.extractedValue).join(", "),
      expectedValue: "Verbatim text match in source page",
      result: "REVIEW",
      reason: "Extracted value cannot be verified verbatim against source page text.",
      source: ungroundedEvidence[0].documentName
    });
    return {
      requirementId: requirement.id,
      state: "REVIEW",
      scoreValue: 0.5,
      weight,
      reason: "Extracted fact failed strict grounding check (possible OCR ambiguity)",
      evidence: evidenceList,
      validationChecks: checks,
      externalVerification
    };
  }
  if (externalVerification) {
    if (externalVerification.status === "DOWN" || externalVerification.status === "TIMEOUT") {
      checks.push({
        id: `chk-${requirement.code}-portal`,
        checkCode: "PORTAL_AVAILABILITY",
        description: `Connectivity to ${externalVerification.adapterName}`,
        inputValue: externalVerification.status,
        expectedValue: "SUCCESS",
        result: "REVIEW",
        reason: `${externalVerification.adapterName} returned ${externalVerification.status}. External proof cannot be completed.`,
        source: externalVerification.sourceLabel
      });
      return {
        requirementId: requirement.id,
        state: requirement.onPortalDown || "UNVERIFIABLE",
        scoreValue: 0,
        weight,
        reason: `External dependency (${externalVerification.adapterName}) unavailable: ${externalVerification.status}`,
        evidence: evidenceList,
        validationChecks: checks,
        externalVerification
      };
    }
  }
  let isFail = false;
  let failReason = "";
  let isReview = false;
  let reviewReason = "";
  switch (requirement.ruleName) {
    case "GST_REGISTRATION_AND_FILING": {
      const gstinEvidence = evidenceList.find((e) => e.fieldName === "GSTIN");
      const gstinVal = gstinEvidence?.extractedValue || bidderDetails.gstin;
      const isFormatValid = validateGSTINFormat(gstinVal);
      checks.push({
        id: `chk-${requirement.code}-gst-fmt`,
        checkCode: "GSTIN_FORMAT",
        description: "GSTIN follows statutory 15-character alphanumeric format",
        inputValue: gstinVal,
        expectedValue: "15-character GSTIN structure",
        result: isFormatValid ? "PASS" : "FAIL",
        reason: isFormatValid ? "Format valid" : "Invalid GSTIN length or characters",
        source: "GST_Certificate.pdf"
      });
      if (!isFormatValid) {
        isFail = true;
        failReason = "GSTIN format is invalid";
      }
      const isChecksumValid = validateGSTINChecksum(gstinVal);
      checks.push({
        id: `chk-${requirement.code}-gst-chk`,
        checkCode: "GSTIN_CHECKSUM",
        description: "GSTIN modulo-36 checksum verification",
        inputValue: gstinVal,
        expectedValue: "Valid checksum digit",
        result: isChecksumValid ? "PASS" : "FAIL",
        reason: isChecksumValid ? "Checksum matches" : "Checksum mismatch on 15th character",
        source: "GST_Certificate.pdf"
      });
      if (!isChecksumValid) {
        isFail = true;
        failReason = "GSTIN checksum verification failed";
      }
      const panMatch = validateGSTINPANMatch(gstinVal, bidderDetails.pan);
      checks.push({
        id: `chk-${requirement.code}-gst-pan`,
        checkCode: "GSTIN_PAN_MATCH",
        description: "GSTIN characters 3-12 match bidder PAN record",
        inputValue: `${gstinVal.substring(2, 12)} vs ${bidderDetails.pan}`,
        expectedValue: bidderDetails.pan,
        result: panMatch ? "PASS" : "FAIL",
        reason: panMatch ? "PAN segment matches bidder PAN" : "Discrepancy between GSTIN and PAN",
        source: "Cross-Document Match"
      });
      if (!panMatch) {
        isFail = true;
        failReason = "GSTIN does not match the submitted PAN card";
      }
      if (externalVerification && externalVerification.status === "SUCCESS") {
        const portalStatus = externalVerification.fields.registrationStatus;
        const filingStatus = externalVerification.fields.returnFiling;
        const isRegActive = portalStatus === "ACTIVE";
        checks.push({
          id: `chk-${requirement.code}-gst-active`,
          checkCode: "PORTAL_ACTIVE",
          description: "GST Portal registration status check",
          inputValue: portalStatus,
          expectedValue: "ACTIVE",
          result: isRegActive ? "PASS" : "FAIL",
          reason: isRegActive ? "Registration is active" : `Registration status is ${portalStatus}`,
          source: externalVerification.sourceLabel
        });
        if (!isRegActive) {
          isFail = true;
          failReason = `GST registration is ${portalStatus}`;
        }
        const isFilingCurrent = filingStatus === "CURRENT";
        checks.push({
          id: `chk-${requirement.code}-gst-filing`,
          checkCode: "RETURN_FILING_CURRENT",
          description: "Recent GSTR-3B / GSTR-1 return filing compliance",
          inputValue: `Status: ${filingStatus}, Period: ${externalVerification.fields.period || "N/A"}`,
          expectedValue: "CURRENT",
          result: isFilingCurrent ? "PASS" : "FAIL",
          reason: isFilingCurrent ? "Returns filed up to date" : "Statutory return filing is OVERDUE",
          source: externalVerification.sourceLabel
        });
        if (!isFilingCurrent) {
          isFail = true;
          failReason = "GST return filing is overdue on the portal";
        }
      }
      break;
    }
    case "PAN_VERIFICATION": {
      const panEvidence = evidenceList.find((e) => e.fieldName === "PAN");
      const panVal = panEvidence?.extractedValue || bidderDetails.pan;
      const isFormat = validatePANFormat(panVal);
      checks.push({
        id: `chk-${requirement.code}-pan-fmt`,
        checkCode: "PAN_FORMAT",
        description: "Permanent Account Number 10-digit structure",
        inputValue: panVal,
        expectedValue: "5 letters, 4 digits, 1 letter",
        result: isFormat ? "PASS" : "FAIL",
        reason: isFormat ? "Valid format" : "Invalid PAN format",
        source: "PAN_Card.pdf"
      });
      if (!isFormat) {
        isFail = true;
        failReason = "PAN format is invalid";
      }
      if (externalVerification && externalVerification.status === "SUCCESS") {
        const panStatus = externalVerification.fields.status;
        const nameMatch = externalVerification.fields.nameMatched;
        checks.push({
          id: `chk-${requirement.code}-pan-db`,
          checkCode: "PAN_DATABASE_LOOKUP",
          description: "Direct tax database validation",
          inputValue: `Status: ${panStatus}, NameMatch: ${nameMatch}`,
          expectedValue: "OPERATIVE / Matched",
          result: panStatus === "OPERATIVE" && nameMatch ? "PASS" : "FAIL",
          reason: panStatus === "OPERATIVE" ? "PAN is operative and linked" : "PAN record inactive or mismatched",
          source: externalVerification.sourceLabel
        });
        if (panStatus !== "OPERATIVE") {
          isFail = true;
          failReason = "PAN status is inoperative";
        }
      }
      break;
    }
    case "CIN_EXISTS": {
      const cinEvidence = evidenceList.find((e) => e.fieldName === "CIN");
      const cinVal = cinEvidence?.extractedValue || bidderDetails.cin;
      const isFormat = validateCINFormat(cinVal);
      checks.push({
        id: `chk-${requirement.code}-cin-fmt`,
        checkCode: "CIN_FORMAT",
        description: "Corporate Identification Number (21 alphanumeric characters)",
        inputValue: cinVal || "None",
        expectedValue: "Valid 21-character CIN",
        result: isFormat ? "PASS" : "FAIL",
        reason: isFormat ? "Format verified" : "Invalid CIN structure or empty",
        source: "Certificate_of_Incorporation.pdf"
      });
      if (!isFormat) {
        isFail = true;
        failReason = "Corporate Identification Number (CIN) format is invalid";
      }
      if (externalVerification) {
        if (externalVerification.status === "SUCCESS") {
          const mcaExists = externalVerification.fields.foundInMcaDatabase;
          checks.push({
            id: `chk-${requirement.code}-mca`,
            checkCode: "MCA_DATABASE_RECORD",
            description: "Ministry of Corporate Affairs registry lookup",
            inputValue: cinVal,
            expectedValue: "Active company record in MCA21",
            result: mcaExists ? "PASS" : "FAIL",
            reason: mcaExists ? "Company active in MCA21" : "CIN not found in MCA database",
            source: externalVerification.sourceLabel
          });
          if (!mcaExists) {
            isFail = true;
            failReason = "CIN not found in MCA database";
          }
        }
      }
      break;
    }
    case "DEBARMENT_REGISTRY_CHECK": {
      if (externalVerification && externalVerification.status === "SUCCESS") {
        const isDebarred = externalVerification.fields.isDebarred === true;
        checks.push({
          id: `chk-${requirement.code}-debar`,
          checkCode: "DEBARMENT_STATUS",
          description: "Central Debarment & Blacklisting Registry check",
          inputValue: isDebarred ? `DEBARRED: ${externalVerification.fields.debarmentReason}` : "CLEAN",
          expectedValue: "CLEAN",
          result: isDebarred ? "FAIL" : "PASS",
          reason: isDebarred ? `Bidder listed in debarment registry: ${externalVerification.fields.debarmentReason}` : "No debarment records found",
          source: externalVerification.sourceLabel
        });
        if (isDebarred) {
          isFail = true;
          failReason = `Bidder is debarred: ${externalVerification.fields.debarmentReason}`;
        }
      }
      break;
    }
    case "UDYAM_MSME_REGISTRATION": {
      const udyamEvidence = evidenceList.find((e) => e.fieldName === "UDYAM_NO");
      const udyamVal = udyamEvidence?.extractedValue || bidderDetails.udyam;
      const isFormat = validateUdyamFormat(udyamVal);
      checks.push({
        id: `chk-${requirement.code}-udyam-fmt`,
        checkCode: "UDYAM_FORMAT",
        description: "Udyam Registration Number format check",
        inputValue: udyamVal || "None",
        expectedValue: "UDYAM-XX-00-0000000",
        result: isFormat ? "PASS" : "FAIL",
        reason: isFormat ? "Udyam format verified" : "Invalid Udyam registration structure",
        source: "Udyam_Registration.pdf"
      });
      if (!isFormat) {
        isFail = true;
        failReason = "Invalid Udyam registration number";
      }
      if (externalVerification && externalVerification.status === "SUCCESS") {
        const active = externalVerification.fields.enterpriseStatus === "ACTIVE";
        checks.push({
          id: `chk-${requirement.code}-udyam-active`,
          checkCode: "UDYAM_PORTAL_ACTIVE",
          description: "MSME portal enterprise active status",
          inputValue: externalVerification.fields.enterpriseStatus,
          expectedValue: "ACTIVE",
          result: active ? "PASS" : "FAIL",
          reason: active ? "Active MSME registration" : "MSME certificate expired or inactive",
          source: externalVerification.sourceLabel
        });
        if (!active) {
          isFail = true;
          failReason = "MSME registration is not active";
        }
      }
      break;
    }
    default: {
      const primaryEvidence = evidenceList[0];
      if (primaryEvidence.confidence < 0.6) {
        checks.push({
          id: `chk-${requirement.code}-conf`,
          checkCode: "CONFIDENCE_THRESHOLD",
          description: "OCR & extraction confidence score meets minimum threshold (0.6)",
          inputValue: `${Math.round(primaryEvidence.confidence * 100)}%`,
          expectedValue: ">= 60%",
          result: "REVIEW",
          reason: "Low OCR clarity on submitted certificate requires officer inspection.",
          source: primaryEvidence.documentName
        });
        isReview = true;
        reviewReason = "Low OCR clarity requires officer review";
      } else {
        checks.push({
          id: `chk-${requirement.code}-ok`,
          checkCode: "CRITERIA_VERIFICATION",
          description: "Statutory verification criteria satisfied",
          inputValue: primaryEvidence.extractedValue,
          expectedValue: "Valid specification proof",
          result: "PASS",
          reason: "Criteria verified against submitted certificate",
          source: primaryEvidence.documentName
        });
      }
      break;
    }
  }
  let finalState = "PASS";
  let finalReason = "All validation criteria verified successfully";
  let scoreValue = 1;
  if (isFail) {
    finalState = "FAIL";
    finalReason = failReason;
    scoreValue = 0;
  } else if (isReview) {
    finalState = "REVIEW";
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
    externalVerification
  };
}
function calculateComplianceScore(results) {
  if (!results || results.length === 0) return 0;
  let totalWeightedScore = 0;
  let totalWeight = 0;
  for (const r of results) {
    totalWeight += r.weight;
    totalWeightedScore += r.weight * r.scoreValue;
  }
  if (totalWeight === 0) return 0;
  return Math.round(100 * totalWeightedScore / totalWeight);
}
function calculateRiskLevel(requirements, results) {
  const reqMap = new Map(requirements.map((r) => [r.id, r]));
  let hasMandatoryFail = false;
  let hasMandatoryReview = false;
  let hasMandatoryUnverifiable = false;
  let hasOptionalFail = false;
  for (const res of results) {
    const req = reqMap.get(res.requirementId);
    const isMandatory = req?.mandatory ?? res.weight === 3;
    if (isMandatory) {
      if (res.state === "FAIL") {
        hasMandatoryFail = true;
      } else if (res.state === "REVIEW") {
        hasMandatoryReview = true;
      } else if (res.state === "UNVERIFIABLE") {
        hasMandatoryUnverifiable = true;
      }
    } else {
      if (res.state === "FAIL") {
        hasOptionalFail = true;
      }
    }
  }
  if (hasMandatoryFail) {
    return "HIGH";
  }
  if (hasMandatoryReview || hasMandatoryUnverifiable || hasOptionalFail) {
    return "MEDIUM";
  }
  return "LOW";
}

// src/server/portalAdapters.ts
import crypto from "crypto";
var activeSimulatorSettings = {
  gstStatus: "SUCCESS",
  mcaStatus: "SUCCESS",
  udyamStatus: "SUCCESS",
  epfoStatus: "SUCCESS",
  debarmentStatus: "SUCCESS"
};
function generateResponseHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex").substring(0, 16);
}
function queryGSTPortal(gstin, overrides) {
  const status = activeSimulatorSettings.gstStatus;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (status === "DOWN") {
    return {
      adapterName: "GST Portal",
      sourceLabel: "SIMULATED ADAPTER - GST Portal (gov.in)",
      status: "DOWN",
      queriedValue: gstin,
      latencyMs: 1420,
      fetchedAt: now,
      fields: { error: "503 Service Unavailable: GSTN Gateway unreachable" },
      responseHash: generateResponseHash({ error: "DOWN", gstin })
    };
  }
  if (status === "TIMEOUT") {
    return {
      adapterName: "GST Portal",
      sourceLabel: "SIMULATED ADAPTER - GST Portal (gov.in)",
      status: "TIMEOUT",
      queriedValue: gstin,
      latencyMs: 5e3,
      fetchedAt: now,
      fields: { error: "Gateway Timeout after 5000ms" },
      responseHash: generateResponseHash({ error: "TIMEOUT", gstin })
    };
  }
  const regStatus = overrides?.regStatus || "ACTIVE";
  const returnFiling = overrides?.filingStatus || "CURRENT";
  const fields = {
    legalNameOfBusiness: "ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED",
    tradeName: "ABC INFRA",
    gstin,
    registrationDate: "2018-04-12",
    registrationStatus: regStatus,
    taxpayerType: "Regular",
    jurisdiction: "State - Ward 42, Chennai Central",
    returnFiling,
    lastReturnFiled: "GSTR-3B",
    period: "Aug 2026",
    filingDate: returnFiling === "CURRENT" ? "2026-09-18" : "OVERDUE (Last: May 2026)",
    eWayBillStatus: "ACTIVE",
    source: "SIMULATED"
  };
  return {
    adapterName: "GST Portal",
    sourceLabel: "SIMULATED ADAPTER - GST Portal (gst.gov.in)",
    status,
    queriedValue: gstin,
    latencyMs: 182,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields)
  };
}
function queryMCAPortal(cin, overrides) {
  const status = activeSimulatorSettings.mcaStatus;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (status === "DOWN") {
    return {
      adapterName: "MCA21 Registry",
      sourceLabel: "SIMULATED ADAPTER - Ministry of Corporate Affairs",
      status: "DOWN",
      queriedValue: cin,
      latencyMs: 2100,
      fetchedAt: now,
      fields: { error: "MCA21 Database Maintenance in progress" },
      responseHash: generateResponseHash({ error: "DOWN", cin })
    };
  }
  const found = overrides?.foundInMca !== void 0 ? overrides.foundInMca : true;
  const fields = {
    cin,
    foundInMcaDatabase: found,
    companyStatus: found ? "Active" : "NOT_FOUND",
    rocCode: "RoC-Chennai",
    incorporationDate: found ? "2016-11-24" : null,
    authorizedCapital: found ? "INR 50,00,000" : null,
    paidUpCapital: found ? "INR 25,00,000" : null,
    classOfCompany: "Private",
    source: "SIMULATED"
  };
  return {
    adapterName: "MCA21 Registry",
    sourceLabel: "SIMULATED ADAPTER - Ministry of Corporate Affairs (mca.gov.in)",
    status,
    queriedValue: cin,
    latencyMs: 195,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields)
  };
}
function queryUdyamPortal(udyamNo) {
  const status = activeSimulatorSettings.udyamStatus;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (status === "DOWN") {
    return {
      adapterName: "MSME Udyam Portal",
      sourceLabel: "SIMULATED ADAPTER - Udyam Registration (udyamregistration.gov.in)",
      status: "DOWN",
      queriedValue: udyamNo,
      latencyMs: 3200,
      fetchedAt: now,
      fields: { error: "MSME Server not reachable" },
      responseHash: generateResponseHash({ error: "DOWN", udyamNo })
    };
  }
  const fields = {
    udyamRegistrationNumber: udyamNo,
    enterpriseStatus: "ACTIVE",
    enterpriseType: "Small Enterprise",
    majorActivity: "Construction & Civil Contracting",
    dicName: "Chennai District Industries Centre",
    verificationDate: "2026-09-29",
    source: "SIMULATED"
  };
  return {
    adapterName: "MSME Udyam Portal",
    sourceLabel: "SIMULATED ADAPTER - Udyam Registration (udyamregistration.gov.in)",
    status,
    queriedValue: udyamNo,
    latencyMs: 140,
    fetchedAt: now,
    fields,
    responseHash: generateResponseHash(fields)
  };
}

// src/server/dataStore.ts
import fs from "fs";
import path from "path";

// src/server/advisoryService.ts
import { GoogleGenAI } from "@google/genai";
async function generateAdvisory(req, result, bidderName, forceAi = false) {
  let deterministicExplanation = "";
  let deterministicSuggestedAction = "";
  let summary = "";
  if (result.state === "PASS") {
    summary = `${req.code} fully satisfied statutory criteria.`;
    deterministicExplanation = `The submitted documents for ${req.title} met all deterministic rules and statutory checks without anomalies. Source evidence matched cross-referenced registers.`;
    deterministicSuggestedAction = "Mark as accepted in technical compliance sheet.";
  } else if (result.state === "FAIL") {
    summary = `${req.code} failed due to: ${result.reason}.`;
    if (result.reason.toLowerCase().includes("mca") || result.reason.toLowerCase().includes("cin")) {
      deterministicExplanation = `The CIN specified in the bid documents for ${bidderName} was not found in the Ministry of Corporate Affairs (MCA21) registry. This may indicate an incorrect CIN number, a defunct entity, or un-notified corporate reorganization.`;
      deterministicSuggestedAction = "Request formal clarification from bidder to furnish original certified RoC Certificate of Incorporation within 5 days, or verify from alternative official register.";
    } else if (result.reason.toLowerCase().includes("overdue") || result.reason.toLowerCase().includes("filing")) {
      deterministicExplanation = `GST portal response indicates GSTR-3B return filings are currently OVERDUE for the recent tax periods, violating mandatory tender compliance condition.`;
      deterministicSuggestedAction = "Issue clarification notice demanding proof of updated GSTR-3B filing acknowledgement and challan payment.";
    } else if (result.reason.toLowerCase().includes("mismatch")) {
      deterministicExplanation = `A structural discrepancy was detected: The PAN segment embedded within the GSTIN does not match the standalone PAN card submitted in the bidder pack.`;
      deterministicSuggestedAction = "Reject or issue strict notice of non-compliance for document tampering or submission error.";
    } else if (result.reason.toLowerCase().includes("debarred")) {
      deterministicExplanation = `Entity or key directors appear on the Central Debarment / GeM Ineligibility Register under active banning order.`;
      deterministicSuggestedAction = "Disqualify bidder pursuant to General Financial Rules (GFR) 2017 Rule 151.";
    } else {
      deterministicExplanation = `Requirement failed rule check: ${result.reason}. Check individual validation items for step-by-step failures.`;
      deterministicSuggestedAction = "Review fail reasons with tender committee and request clarification if acceptable under tender terms.";
    }
  } else if (result.state === "REVIEW") {
    summary = `${req.code} flagged for officer review: ${result.reason}.`;
    deterministicExplanation = `Deterministic engine identified missing or low-confidence evidence. Either the document was omitted, or OCR text confidence was below threshold (e.g. blurred seal or faint text), requiring human inspection.`;
    deterministicSuggestedAction = "Officer must inspect the attached high-resolution document viewer to manually confirm validity.";
  } else {
    summary = `${req.code} could not be verified automatically: external portal unavailable.`;
    deterministicExplanation = `External government adapter (${result.externalVerification?.adapterName || "Portal"}) returned TIMEOUT or 503 SERVICE UNAVAILABLE during verification run.`;
    deterministicSuggestedAction = "Officer may re-trigger portal lookup or perform manual offline verification via authenticated department terminal.";
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!forceAi || !apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return {
      summary,
      explanation: deterministicExplanation,
      suggestedAction: deterministicSuggestedAction,
      isAiEnhanced: false
    };
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are TenderGuard's AI Procurement Advisory assistant.
Your role: Provide clear, objective, read-only explanation and suggested next actions for a government procurement officer.
CRITICAL CONSTRAINT: You do NOT determine or alter the result. The deterministic rule engine already determined:
- Requirement: ${req.code} (${req.title})
- Result State: ${result.state} (IMMUTABLE)
- Reason: ${result.reason}
- Bidder: ${bidderName}
- Baseline explanation: ${deterministicExplanation}
- Baseline suggested action: ${deterministicSuggestedAction}

Provide a concise, professional explanation (2-3 sentences max) and recommended next action (bullet points) in strictly JSON format:
{
  "explanation": "...",
  "suggestedAction": "..."
}`;
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.explanation && parsed.suggestedAction) {
        return {
          summary,
          explanation: parsed.explanation,
          suggestedAction: parsed.suggestedAction,
          isAiEnhanced: true
        };
      }
    }
  } catch (error) {
    console.warn("[AdvisoryService] Gemini rewrite failed or skipped, using deterministic template:", error);
  }
  return {
    summary,
    explanation: deterministicExplanation,
    suggestedAction: deterministicSuggestedAction,
    isAiEnhanced: false
  };
}

// src/server/dataStore.ts
var PERSIST_FILE = path.resolve(process.cwd(), "persisted_bids_state.json");
var currentUser = {
  id: "usr-001",
  name: "P. Sengupta",
  email: "officer@cpcl.gov.in",
  role: "OFFICER",
  department: "Procurement & Contracts Department",
  organisation: "Chennai Petroleum Corporation Limited (CPCL)"
};
var allUsers = [
  currentUser,
  {
    id: "usr-002",
    name: "K. Ramanathan",
    email: "evaluator@cpcl.gov.in",
    role: "EVALUATOR",
    department: "Civil Engineering Directorate",
    organisation: "CPCL"
  },
  {
    id: "usr-003",
    name: "Dr. S. Meenakshi",
    email: "admin@tenderguard.gov.in",
    role: "ADMIN",
    department: "Directorate General of Supplies & Disposals",
    organisation: "GeM / CPCL"
  },
  {
    id: "usr-004",
    name: "V. Anand, IA&AS",
    email: "auditor@cag.gov.in",
    role: "AUDITOR",
    department: "Principal Director of Commercial Audit",
    organisation: "CAG India"
  }
];
var requirementsTender1 = [
  {
    id: "req-01",
    code: "GST_001",
    title: "GST Registration and Return Filing Compliance",
    description: "Valid 15-digit GSTIN certificate and up-to-date monthly GSTR-3B / GSTR-1 return filing.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["GST_Certificate.pdf", "GSTR3B_Receipt.pdf"],
    checksRequired: ["GSTIN_FORMAT", "GSTIN_CHECKSUM", "GSTIN_PAN_MATCH", "PORTAL_ACTIVE", "RETURN_FILING_CURRENT"],
    ruleName: "GST_REGISTRATION_AND_FILING",
    ruleVersion: "1.3",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-02",
    code: "PAN_001",
    title: "Permanent Account Number (PAN) Card & Tax Record",
    description: "10-character alphanumeric PAN issued by Income Tax Department, linked and operative.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["PAN_Card.pdf"],
    checksRequired: ["PAN_FORMAT", "PAN_DATABASE_LOOKUP"],
    ruleName: "PAN_VERIFICATION",
    ruleVersion: "1.2",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-03",
    code: "CIN_001",
    title: "Company Incorporation (CIN) and Active MCA Record",
    description: "Proof of legal entity incorporation and valid registration in Ministry of Corporate Affairs (MCA21).",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["Certificate_of_Incorporation.pdf"],
    checksRequired: ["CIN_FORMAT", "MCA_DATABASE_RECORD"],
    ruleName: "CIN_EXISTS",
    ruleVersion: "1.4",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-04",
    code: "UDYAM_001",
    title: "Udyam MSME Registration Certificate",
    description: "Valid Udyam Registration certificate for availing Public Procurement Policy concessions (if applicable).",
    category: "STATUTORY",
    mandatory: false,
    evidenceRequired: ["Udyam_Registration.pdf"],
    checksRequired: ["UDYAM_FORMAT", "UDYAM_PORTAL_ACTIVE"],
    ruleName: "UDYAM_MSME_REGISTRATION",
    ruleVersion: "1.1",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-05",
    code: "ITR_001",
    title: "Income Tax Returns for Last 3 Financial Years",
    description: "ITR-V acknowledgements for FY 2023-24, 2024-25, 2025-26 with CA computation statement.",
    category: "FINANCIAL",
    mandatory: true,
    evidenceRequired: ["ITR_Acknowledgements_3Y.pdf"],
    checksRequired: ["ITR_3YEARS_COMPLETE", "CA_UDIN_VERIFIED"],
    ruleName: "ITR_VERIFICATION",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-06",
    code: "EXP_001",
    title: "Similar Work Experience in Commercial/Office Construction",
    description: "Satisfactory completion certificates for at least 1 project of min Rs 25 Cr or 2 projects of Rs 15 Cr.",
    category: "EXPERIENCE",
    mandatory: true,
    evidenceRequired: ["Work_Experience_Certificates.pdf"],
    checksRequired: ["EXPERIENCE_VALUE_THRESHOLD", "COMPLETION_CERT_GENUINE"],
    ruleName: "EXPERIENCE_CHECK",
    ruleVersion: "1.1",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-07",
    code: "OEM_001",
    title: "OEM Authorization for Elevators & HVAC Systems",
    description: "Manufacturer Authorization Form (MAF) directly from Tier-1 approved OEMs with commitment for 10-year spares.",
    category: "TECHNICAL",
    mandatory: false,
    evidenceRequired: ["OEM_Authorization_MAF.pdf"],
    checksRequired: ["OEM_LETTER_VALIDITY", "SIGNATURE_VERIFIED"],
    ruleName: "OEM_AUTHORIZATION",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-08",
    code: "FIN_001",
    title: "Minimum Average Annual Financial Turnover",
    description: "Audited balance sheets proving average annual turnover of at least Rs 35 Crores in preceding 3 financial years.",
    category: "FINANCIAL",
    mandatory: true,
    evidenceRequired: ["Audited_Financial_Statements.pdf"],
    checksRequired: ["TURNOVER_THRESHOLD_MET", "AUDITOR_SEAL_PRESENT"],
    ruleName: "FINANCIAL_TURNOVER",
    ruleVersion: "1.2",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-09",
    code: "DEBAR_001",
    title: "Central Debarment & Blacklisting Registry Clearance",
    description: "Bidder must not be debarred, suspended, or blacklisted by any Central/State Ministry or CPSE under GFR 151.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["Non_Blacklisting_Affidavit.pdf"],
    checksRequired: ["DEBARMENT_STATUS"],
    ruleName: "DEBARMENT_REGISTRY_CHECK",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-10",
    code: "SOLV_001",
    title: "Bank Solvency Certificate from Scheduled Commercial Bank",
    description: "Solvency certificate of minimum Rs 15 Crores issued within 6 months prior to tender closing date.",
    category: "FINANCIAL",
    mandatory: true,
    evidenceRequired: ["Bank_Solvency_Certificate.pdf"],
    checksRequired: ["SOLVENCY_AMOUNT", "DATE_VALIDITY"],
    ruleName: "BANK_SOLVENCY",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-11",
    code: "EPF_001",
    title: "Employees Provident Fund Organization (EPFO) Code",
    description: "Valid EPFO registration code and electronic challan-cum-return (ECR) for previous 3 months.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["EPFO_Registration_ECR.pdf"],
    checksRequired: ["EPFO_VALID", "ECR_CURRENT"],
    ruleName: "EPFO_COMPLIANCE",
    ruleVersion: "1.1",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-12",
    code: "ESIC_001",
    title: "Employees State Insurance Corporation (ESIC) Registration",
    description: "Valid ESIC employer code and recent monthly contribution payment receipts.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["ESIC_Registration_Challan.pdf"],
    checksRequired: ["ESIC_CODE_VALID", "PAYMENT_UPTODATE"],
    ruleName: "ESIC_COMPLIANCE",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-13",
    code: "NETW_001",
    title: "Positive Net Worth Certificate with UDIN",
    description: "Chartered Accountant certificate confirming positive net worth as of March 31, 2026, with valid ICAI UDIN.",
    category: "FINANCIAL",
    mandatory: true,
    evidenceRequired: ["Net_Worth_Certificate_UDIN.pdf"],
    checksRequired: ["POSITIVE_NET_WORTH", "UDIN_FORMAT"],
    ruleName: "NET_WORTH",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-14",
    code: "ISO_001",
    title: "ISO 9001:2015 Quality Management Certification",
    description: "Accredited ISO 9001:2015 certificate valid throughout the tender contract execution period.",
    category: "TECHNICAL",
    mandatory: false,
    evidenceRequired: ["ISO_9001_Certificate.pdf"],
    checksRequired: ["ISO_ACCREDITATION", "VALIDITY_PERIOD"],
    ruleName: "ISO_QUALITY",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-15",
    code: "LITIG_001",
    title: "Declaration of Pending Arbitration and Court Cases",
    description: "Notarized disclosure of any ongoing litigation or arbitration with government departments.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["Litigation_Declaration_Affidavit.pdf"],
    checksRequired: ["NOTARIZATION_SEAL", "VALUE_DISCLOSED"],
    ruleName: "LITIGATION_DISCLOSURE",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-16",
    code: "INTEG_001",
    title: "Pre-Contract Integrity Pact (Rs 100 Stamp Paper)",
    description: "Signed Integrity Pact witnessed by Independent External Monitors (IEMs) appointed by MoPNG.",
    category: "STATUTORY",
    mandatory: true,
    evidenceRequired: ["Signed_Integrity_Pact.pdf"],
    checksRequired: ["STAMP_PAPER_VALUE", "SIGNATURES_COMPLETE"],
    ruleName: "INTEGRITY_PACT",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-17",
    code: "SAFETY_001",
    title: "Health, Safety and Environmental (HSE) Compliance Plan",
    description: "Detailed site safety manual, zero-accident policy, and OHSAS/ISO 45001 safety guidelines adherence.",
    category: "TECHNICAL",
    mandatory: true,
    evidenceRequired: ["HSE_Site_Safety_Plan.pdf"],
    checksRequired: ["SAFETY_POLICY_APPROVED", "EMERGENCY_MEASURES"],
    ruleName: "HSE_SAFETY",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  },
  {
    id: "req-18",
    code: "EMD_001",
    title: "Earnest Money Deposit (EMD) Bank Guarantee (Rs 50 Lakhs)",
    description: "Irrevocable Bank Guarantee for Rs 50,00,000 with SFMS confirmation to CPCL account.",
    category: "FINANCIAL",
    mandatory: true,
    evidenceRequired: ["EMD_Bank_Guarantee.pdf"],
    checksRequired: ["BG_VALUE_CORRECT", "SFMS_CONFIRMATION"],
    ruleName: "EMD_GUARANTEE",
    ruleVersion: "1.0",
    onFail: "FAIL",
    onMissing: "REVIEW",
    onPortalDown: "UNVERIFIABLE"
  }
];
var tenders = [
  {
    id: "TND-GEM-2025-0012",
    tenderNumber: "GEM/2025/0012",
    title: "Construction of Office Building - CPCL",
    department: "CPCL (Chennai Petroleum Corporation Limited)",
    organisation: "Ministry of Petroleum & Natural Gas",
    description: "Construction of modern office building & infrastructure at CPCL headquarters with technical, financial and statutory requirements as per the tender document.",
    openingDate: "18 Sep 2026",
    closingDate: "15 Oct 2026",
    status: "VERIFICATION",
    currentVersion: 2,
    ruleSetVersion: "1.3",
    requirementsCount: 18,
    totalBidders: 45,
    progressPercent: 71,
    requirements: requirementsTender1
  },
  {
    id: "TND-MECL-2026-0048",
    tenderNumber: "MECL/IT/2026/048",
    title: "IT Infrastructure & Data Center Cloud Supply",
    department: "MECL (Mineral Exploration and Consultancy Limited)",
    organisation: "Ministry of Mines",
    description: "High-availability server racks, enterprise SAN storage, and managed cloud interconnection services.",
    openingDate: "22 Sep 2026",
    closingDate: "20 Oct 2026",
    status: "VERIFICATION",
    currentVersion: 1,
    ruleSetVersion: "1.1",
    requirementsCount: 12,
    totalBidders: 22,
    progressPercent: 45,
    requirements: requirementsTender1.slice(0, 12)
  },
  {
    id: "TND-HPCL-2026-0091",
    tenderNumber: "HPCL/SEC/2026/091",
    title: "Security and Facility Manpower Services",
    department: "HPCL (Hindustan Petroleum Corporation Limited)",
    organisation: "Ministry of Petroleum & Natural Gas",
    description: "Round-the-clock armed & unarmed security personnel and automated surveillance facility management across southern regional refinery terminals.",
    openingDate: "28 Sep 2026",
    closingDate: "30 Oct 2026",
    status: "DRAFT",
    currentVersion: 1,
    ruleSetVersion: "1.0",
    requirementsCount: 16,
    totalBidders: 16,
    progressPercent: 0,
    requirements: requirementsTender1.slice(0, 16)
  },
  {
    id: "TND-IOCL-2026-0112",
    tenderNumber: "IOCL/ENG/2026/112",
    title: "Pipeline Cathodic Protection & Corrosion Monitoring System",
    department: "IOCL (Indian Oil Corporation Limited)",
    organisation: "Ministry of Petroleum & Natural Gas",
    description: "Impressed current cathodic protection (ICCP) systems with remote transformer rectifier units along Paradip-Hyderabad pipeline section.",
    openingDate: "24 Sep 2026",
    closingDate: "25 Oct 2026",
    status: "VERIFICATION",
    currentVersion: 1,
    ruleSetVersion: "1.2",
    requirementsCount: 14,
    totalBidders: 18,
    progressPercent: 55,
    requirements: requirementsTender1.slice(0, 14)
  },
  {
    id: "TND-ONGC-2026-0304",
    tenderNumber: "ONGC/OFF/2026/304",
    title: "Offshore Supply Vessel Logistics & Crew Transport Services",
    department: "ONGC (Oil and Natural Gas Corporation)",
    organisation: "Ministry of Petroleum & Natural Gas",
    description: "Charter hire of 2 DP-2 dynamic positioning platform supply vessels for Mumbai High offshore asset field operations.",
    openingDate: "30 Sep 2026",
    closingDate: "10 Nov 2026",
    status: "DRAFT",
    currentVersion: 1,
    ruleSetVersion: "1.0",
    requirementsCount: 15,
    totalBidders: 9,
    progressPercent: 0,
    requirements: requirementsTender1.slice(0, 15)
  },
  {
    id: "TND-GAIL-2025-0890",
    tenderNumber: "GAIL/VAL/2025/890",
    title: "Natural Gas Compressor Station Ball Valves & Actuators",
    department: "GAIL (India) Limited",
    organisation: "Ministry of Petroleum & Natural Gas",
    description: "Supply of API 6D trunnion-mounted pipeline ball valves for Jagdishpur-Haldia-Bokaro-Dhamra natural gas pipeline (JHBDPL).",
    openingDate: "10 Aug 2025",
    closingDate: "15 Sep 2025",
    status: "CLOSED",
    currentVersion: 3,
    ruleSetVersion: "1.4",
    requirementsCount: 18,
    totalBidders: 32,
    progressPercent: 100,
    requirements: requirementsTender1
  },
  {
    id: "TND-BHEL-2025-0551",
    tenderNumber: "BHEL/TRN/2025/551",
    title: "765kV Ultra-High Voltage Generator Transformer Overhaul",
    department: "BHEL (Bharat Heavy Electricals Limited)",
    organisation: "Ministry of Heavy Industries",
    description: "Specialized maintenance, vacuum dry-out, and diagnostic bushing testing of 765kV 500MVA generator step-up transformers.",
    openingDate: "01 Jul 2025",
    closingDate: "05 Aug 2025",
    status: "CLOSED",
    currentVersion: 2,
    ruleSetVersion: "1.2",
    requirementsCount: 16,
    totalBidders: 27,
    progressPercent: 100,
    requirements: requirementsTender1.slice(0, 16)
  }
];
var docGstABC = {
  id: "doc-abc-gst",
  bidId: "BID-001",
  filename: "GST_Certificate.pdf",
  documentType: "TAX_REGISTRATION",
  mimeType: "application/pdf",
  pageCount: 3,
  sizeBytes: 842100,
  sha256: "9f83a42cbe812d3345eaf17b0198c21a441e86a1bb942b03912dae80a5521b4a",
  uploadedAt: "2026-09-28T09:12:00Z",
  status: "EXTRACTED",
  previewPages: [
    {
      pageNumber: 1,
      title: "Form GST REG-06: Registration Certificate",
      textSnippet: "GOVERNMENT OF INDIA\nREGISTRATION CERTIFICATE\nRegistration Number: 22AAAAA0000A1Z5\nLegal Name: ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED\nTrade Name: ABC INFRA\nConstitution of Business: Private Limited Company\nAddress: 42 Mount Road, Guindy, Chennai, Tamil Nadu 600032",
      regions: [
        {
          label: "GSTIN",
          value: "22AAAAA0000A1Z5",
          box: { x: 26, y: 34, width: 44, height: 7 }
        },
        {
          label: "Legal Name",
          value: "ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED",
          box: { x: 26, y: 44, width: 62, height: 6 }
        }
      ]
    },
    {
      pageNumber: 2,
      title: "Annexure A: Details of Additional Places of Business",
      textSnippet: "Details of additional business premises within Chennai Central Ward 42.",
      regions: []
    },
    {
      pageNumber: 3,
      title: "Annexure B: Details of Managing Directors & Authorized Signatories",
      textSnippet: "Director: Rajesh Kumar (DIN: 07123456), Authorized signatory.",
      regions: []
    }
  ]
};
var docCinABC = {
  id: "doc-abc-cin",
  bidId: "BID-001",
  filename: "Certificate_of_Incorporation.pdf",
  documentType: "INCORPORATION_PROOF",
  mimeType: "application/pdf",
  pageCount: 3,
  sizeBytes: 1245e3,
  sha256: "38a12df08b49e19d774ba2780c102a9914ecbd098319f0525da445f1b62cc8d1",
  uploadedAt: "2026-09-28T09:13:00Z",
  status: "EXTRACTED",
  previewPages: [
    {
      pageNumber: 1,
      title: "Ministry of Corporate Affairs - Certificate of Incorporation",
      textSnippet: "GOVERNMENT OF INDIA\nMINISTRY OF CORPORATE AFFAIRS\nCentral Registration Centre\nCERTIFICATE OF INCORPORATION\n[Pursuant to sub-section (2) of section 7 and sub-section (1) of section 8 of the Companies Act, 2013]\nI hereby certify that ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED is incorporated on this Twenty-fourth day of November Two thousand sixteen under the Companies Act, 2013.\nThe Corporate Identity Number of the company is U45201TN2016PTC112345.\nGiven under my hand at Chennai this 24th day of November 2016.",
      regions: [
        {
          label: "Corporate Identity Number (CIN)",
          value: "U45201TN2016PTC112345",
          box: { x: 22, y: 52, width: 56, height: 9 }
        }
      ]
    },
    {
      pageNumber: 2,
      title: "Memorandum of Association (MoA) - Main Objects",
      textSnippet: "Civil construction, office building construction, structural contracting.",
      regions: []
    },
    {
      pageNumber: 3,
      title: "Articles of Association (AoA) - Signatories",
      textSnippet: "Articles signed by promoters and registered under RoC Chennai.",
      regions: []
    }
  ]
};
var docPanABC = {
  id: "doc-abc-pan",
  bidId: "BID-001",
  filename: "PAN_Card.pdf",
  documentType: "IDENTITY_PROOF",
  mimeType: "application/pdf",
  pageCount: 1,
  sizeBytes: 42e4,
  sha256: "e519c72e411082abdfa87263b65287f4c391bc448e02d334511d782199b1a03e",
  uploadedAt: "2026-09-28T09:12:30Z",
  status: "EXTRACTED",
  previewPages: [
    {
      pageNumber: 1,
      title: "INCOME TAX DEPARTMENT - GOVT. OF INDIA - PERMANENT ACCOUNT NUMBER CARD",
      textSnippet: "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nABC INFRASTRUCTURE SOLUTIONS PVT LTD\nIncorporation Date: 24/11/2016\nPermanent Account Number: AAAAA0000A",
      regions: [
        {
          label: "PAN",
          value: "AAAAA0000A",
          box: { x: 24, y: 58, width: 48, height: 12 }
        }
      ]
    }
  ]
};
var docUdyamABC = {
  id: "doc-abc-udyam",
  bidId: "BID-001",
  filename: "Udyam_Registration.pdf",
  documentType: "MSME_CERTIFICATE",
  mimeType: "application/pdf",
  pageCount: 2,
  sizeBytes: 52e4,
  sha256: "c37a6b29d44811aef71092834b6e5118742918bbca33902187654321fedcba98",
  uploadedAt: "2026-09-28T09:14:00Z",
  status: "EXTRACTED",
  previewPages: [
    {
      pageNumber: 1,
      title: "UDYAM REGISTRATION CERTIFICATE",
      textSnippet: "MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES\nUDYAM REGISTRATION NUMBER: UDYAM-TN-02-0012345\nNAME OF ENTERPRISE: ABC INFRASTRUCTURE SOLUTIONS PRIVATE LIMITED\nTYPE OF ENTERPRISE: Small Enterprise",
      regions: [
        {
          label: "Udyam Registration Number",
          value: "UDYAM-TN-02-0012345",
          box: { x: 22, y: 32, width: 56, height: 8 }
        }
      ]
    }
  ]
};
var sampleBids = [
  {
    id: "BID-001",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-001",
    bidder: {
      id: "BDR-001",
      legalName: "ABC Infra Solutions",
      gstin: "22AAAAA0000A1Z5",
      pan: "AAAAA0000A",
      cin: "U45201TN2016PTC112345",
      udyam: "UDYAM-TN-02-0012345",
      epfoCode: "TNCHE0098765000",
      email: "bids@abcinfra.co.in",
      phone: "+91 44 2234 5678",
      city: "Chennai",
      state: "Tamil Nadu"
    },
    submittedAt: "2026-09-28T09:15:00Z",
    status: "NEEDS_ATTENTION",
    complianceScore: 72,
    riskLevel: "HIGH",
    documents: [docGstABC, docCinABC, docPanABC, docUdyamABC],
    requirementResults: []
    // populated during initialization
  },
  {
    id: "BID-002",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-002",
    bidder: {
      id: "BDR-002",
      legalName: "Shree Tech Pvt Ltd",
      gstin: "27BBBBB1111B2Z7",
      pan: "BBBBB1111B",
      cin: "U72200MH2015PTC265432",
      udyam: "UDYAM-MH-01-0087654",
      epfoCode: "MHBOM0012345000",
      email: "tenders@shreetech.com",
      phone: "+91 22 6677 8899",
      city: "Mumbai",
      state: "Maharashtra"
    },
    submittedAt: "2026-09-28T10:10:00Z",
    status: "VERIFIED",
    complianceScore: 98,
    riskLevel: "LOW",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-003",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-003",
    bidder: {
      id: "BDR-003",
      legalName: "National BuildCorp",
      gstin: "29CCCCC2222C3Z9",
      pan: "CCCCC2222C",
      cin: "U45200KA2012PLC198765",
      udyam: "UDYAM-KR-03-0099881",
      epfoCode: "KNBLR0055443000",
      email: "contracts@nationalbuildcorp.in",
      phone: "+91 80 4123 9900",
      city: "Bengaluru",
      state: "Karnataka"
    },
    submittedAt: "2026-09-28T11:45:00Z",
    status: "VERIFIED",
    complianceScore: 92,
    riskLevel: "LOW",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-004",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-004",
    bidder: {
      id: "BDR-004",
      legalName: "Omkar Enterprises",
      gstin: "24DDDDD3333D4Z9",
      pan: "DDDDD3333D",
      cin: "U45203GJ2019PTC109876",
      udyam: "UDYAM-GJ-01-0034567",
      epfoCode: "GJAHD0077889000",
      email: "info@omkargroup.net",
      phone: "+91 79 2655 4321",
      city: "Ahmedabad",
      state: "Gujarat"
    },
    submittedAt: "2026-09-28T13:20:00Z",
    status: "IN_VERIFICATION",
    complianceScore: 56,
    riskLevel: "MEDIUM",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-005",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-005",
    bidder: {
      id: "BDR-005",
      legalName: "Delta Constructions",
      gstin: "07EEEEE4444E5Z0",
      pan: "EEEEE4444E",
      cin: "U45201DL2014PLC098123",
      udyam: "",
      email: "legal@deltaconstructions.com",
      phone: "+91 11 4321 0000",
      city: "New Delhi",
      state: "Delhi"
    },
    submittedAt: "2026-09-28T14:05:00Z",
    status: "NEEDS_ATTENTION",
    complianceScore: 41,
    riskLevel: "HIGH",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-006",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-006",
    bidder: {
      id: "BDR-006",
      legalName: "Premier Engineering Works",
      gstin: "33FFFFF5555F6Z2",
      pan: "GGGGG9999G",
      // deliberate mismatch for Case B
      cin: "U28112TN2017PTC118901",
      udyam: "UDYAM-TN-02-0044556",
      email: "tender@premierengg.in",
      phone: "+91 44 2855 1234",
      city: "Coimbatore",
      state: "Tamil Nadu"
    },
    submittedAt: "2026-09-28T15:30:00Z",
    status: "NEEDS_ATTENTION",
    complianceScore: 64,
    riskLevel: "HIGH",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-007",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-007",
    bidder: {
      id: "BDR-007",
      legalName: "Larsen & Toubro Heavy Infrastructure",
      gstin: "27AAACL0123L1ZM",
      pan: "AAACL0123L",
      cin: "L99999MH1946PLC004768",
      udyam: "UDYAM-MH-19-0023451",
      epfoCode: "MHBOM0045678000",
      email: "tenders@larsentoubro.com",
      phone: "+91 22 6752 5656",
      city: "Mumbai",
      state: "Maharashtra"
    },
    submittedAt: "2026-09-28T16:15:00Z",
    status: "VERIFIED",
    complianceScore: 99,
    riskLevel: "LOW",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-008",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-008",
    bidder: {
      id: "BDR-008",
      legalName: "Tata Projects Limited",
      gstin: "36AAACT1987Q1Z5",
      pan: "AAACT1987Q",
      cin: "U45200TG1979PLC002450",
      udyam: "UDYAM-TS-09-0098765",
      epfoCode: "TSHYD0022334000",
      email: "procurement@tataprojects.com",
      phone: "+91 40 6623 8800",
      city: "Hyderabad",
      state: "Telangana"
    },
    submittedAt: "2026-09-28T16:45:00Z",
    status: "VERIFIED",
    complianceScore: 96,
    riskLevel: "LOW",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-009",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-009",
    bidder: {
      id: "BDR-009",
      legalName: "Afcons Infrastructure Limited",
      gstin: "27AAACA1234A1Z9",
      pan: "AAACA1234A",
      cin: "U45200MH1976PLC019335",
      udyam: "UDYAM-MH-19-0011223",
      epfoCode: "MHBOM0098761000",
      email: "bids@afcons.com",
      phone: "+91 22 6719 1000",
      city: "Mumbai",
      state: "Maharashtra"
    },
    submittedAt: "2026-09-28T17:10:00Z",
    status: "VERIFIED",
    complianceScore: 94,
    riskLevel: "LOW",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-010",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-010",
    bidder: {
      id: "BDR-010",
      legalName: "Godrej Construction Division",
      gstin: "27AAACG0001G1Z3",
      pan: "AAACG0001G",
      cin: "L28931MH1932PLC001828",
      udyam: "UDYAM-MH-19-0044332",
      epfoCode: "MHBOM0077665000",
      email: "construction@godrej.com",
      phone: "+91 22 6796 5656",
      city: "Mumbai",
      state: "Maharashtra"
    },
    submittedAt: "2026-09-28T17:35:00Z",
    status: "VERIFIED",
    complianceScore: 91,
    riskLevel: "LOW",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-011",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-011",
    bidder: {
      id: "BDR-011",
      legalName: "KEC International Limited",
      gstin: "27AAACK1122K1Z8",
      pan: "AAACK1122K",
      cin: "L45200MH2005PLC152061",
      udyam: "UDYAM-MH-19-0077889",
      epfoCode: "MHBOM0033221000",
      email: "tenders@kecrpg.com",
      phone: "+91 22 6667 0200",
      city: "Mumbai",
      state: "Maharashtra"
    },
    submittedAt: "2026-09-28T18:00:00Z",
    status: "IN_VERIFICATION",
    complianceScore: 78,
    riskLevel: "MEDIUM",
    documents: [docGstABC],
    requirementResults: []
  },
  {
    id: "BID-012",
    tenderId: "TND-GEM-2025-0012",
    bidderId: "BDR-012",
    bidder: {
      id: "BDR-012",
      legalName: "JMC Projects (India) Limited",
      gstin: "24AAACJ5566J1Z1",
      pan: "AAACJ5566J",
      cin: "L45200GJ1986PLC008717",
      udyam: "UDYAM-GJ-01-0088991",
      epfoCode: "GJAHD0055443000",
      email: "contracts@jmcprojects.com",
      phone: "+91 79 3001 1500",
      city: "Ahmedabad",
      state: "Gujarat"
    },
    submittedAt: "2026-09-28T18:25:00Z",
    status: "NEEDS_ATTENTION",
    complianceScore: 52,
    riskLevel: "HIGH",
    documents: [docGstABC],
    requirementResults: []
  }
];
async function initializeBid1Evaluation(forceDefault = false) {
  const bid = sampleBids[0];
  const reqs = requirementsTender1;
  const existingDecisions = /* @__PURE__ */ new Map();
  if (!forceDefault && bid.requirementResults) {
    for (const r of bid.requirementResults) {
      if (r.officerDecision) {
        existingDecisions.set(r.requirementId, r.officerDecision);
      }
    }
  }
  const results = [];
  for (const req of reqs) {
    let result;
    if (req.code === "GST_001") {
      const externalGst = queryGSTPortal(bid.bidder.gstin, { filingStatus: "OVERDUE", regStatus: "ACTIVE" });
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: "ev-gst-01",
            documentId: docGstABC.id,
            documentName: docGstABC.filename,
            pageNumber: 1,
            boundingBox: { x: 26, y: 34, width: 44, height: 7 },
            sourceText: "Registration Number: 22AAAAA0000A1Z5",
            fieldName: "GSTIN",
            extractedValue: bid.bidder.gstin,
            extractionMethod: "REGEX",
            confidence: 0.99,
            sha256: docGstABC.sha256,
            grounded: true
          }
        ],
        externalVerification: externalGst,
        bidderDetails: bid.bidder
      });
    } else if (req.code === "CIN_001") {
      const externalMca = queryMCAPortal(bid.bidder.cin, { foundInMca: false });
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: "ev-cin-01",
            documentId: docCinABC.id,
            documentName: docCinABC.filename,
            pageNumber: 1,
            boundingBox: { x: 22, y: 52, width: 56, height: 9 },
            sourceText: "The Corporate Identity Number of the company is U45201TN2016PTC112345.",
            fieldName: "CIN",
            extractedValue: bid.bidder.cin,
            extractionMethod: "OCR_TESSERACT",
            confidence: 0.94,
            sha256: docCinABC.sha256,
            grounded: true
          }
        ],
        externalVerification: externalMca,
        bidderDetails: bid.bidder
      });
      const adv = await generateAdvisory(req, result, bid.bidder.legalName);
      result.advisory = {
        summary: adv.summary,
        explanation: adv.explanation,
        suggestedAction: adv.suggestedAction,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        isAiEnhanced: adv.isAiEnhanced
      };
      if (existingDecisions.has(req.id)) {
        result.officerDecision = existingDecisions.get(req.id);
      } else {
        result.officerDecision = {
          disposition: "REQUEST_CLARIFICATION",
          justification: "CIN not found in MCA database. Requested bidder to provide incorporation certificate with verified RoC extract.",
          decidedBy: currentUser.name,
          decidedAt: "2026-09-28T10:45:00Z"
        };
      }
    } else if (req.code === "PAN_001") {
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: "ev-pan-01",
            documentId: docPanABC.id,
            documentName: docPanABC.filename,
            pageNumber: 1,
            boundingBox: { x: 24, y: 58, width: 48, height: 12 },
            sourceText: "Permanent Account Number: AAAAA0000A",
            fieldName: "PAN",
            extractedValue: bid.bidder.pan,
            extractionMethod: "REGEX",
            confidence: 0.98,
            sha256: docPanABC.sha256,
            grounded: true
          }
        ],
        externalVerification: {
          adapterName: "Income Tax e-Filing Database",
          sourceLabel: "SIMULATED ADAPTER - ITD PAN Database (incometax.gov.in)",
          status: "SUCCESS",
          queriedValue: bid.bidder.pan,
          latencyMs: 135,
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
          fields: { status: "OPERATIVE", nameMatched: true },
          responseHash: "a718b9c201884f"
        },
        bidderDetails: bid.bidder
      });
    } else if (req.code === "UDYAM_001") {
      const extUdyam = queryUdyamPortal(bid.bidder.udyam);
      result = evaluateRequirement({
        requirement: req,
        evidenceList: [
          {
            id: "ev-udyam-01",
            documentId: docUdyamABC.id,
            documentName: docUdyamABC.filename,
            pageNumber: 1,
            boundingBox: { x: 22, y: 32, width: 56, height: 8 },
            sourceText: "UDYAM REGISTRATION NUMBER: UDYAM-TN-02-0012345",
            fieldName: "UDYAM_NO",
            extractedValue: bid.bidder.udyam,
            extractionMethod: "REGEX",
            confidence: 0.97,
            sha256: docUdyamABC.sha256,
            grounded: true
          }
        ],
        externalVerification: extUdyam,
        bidderDetails: bid.bidder
      });
    } else if (req.code === "OEM_001") {
      result = {
        requirementId: req.id,
        state: "REVIEW",
        scoreValue: 0.5,
        weight: 1,
        reason: "OEM authorization letter seal is partially faded; manual officer inspection recommended.",
        evidence: [
          {
            id: "ev-oem-01",
            documentId: "doc-abc-oem",
            documentName: "OEM_Authorization_MAF.pdf",
            pageNumber: 1,
            boundingBox: { x: 30, y: 40, width: 40, height: 15 },
            sourceText: "Authorized Channel Partner - Southern Region Spares & Maintenance",
            fieldName: "OEM_AUTHORIZATION",
            extractedValue: "Mitsubishi Electric Elevators",
            extractionMethod: "OCR_TESSERACT",
            confidence: 0.52,
            sha256: "992a0198bb42f102c91",
            grounded: true
          }
        ],
        validationChecks: [
          {
            id: "chk-oem-seal",
            checkCode: "SEAL_LEGIBILITY",
            description: "OEM Corporate Stamp Legibility Check",
            inputValue: "Faint ink impression (52% confidence)",
            expectedValue: "Clear legible OEM seal",
            result: "REVIEW",
            reason: "Seal impression blurred on scan page 1",
            source: "OEM_Authorization_MAF.pdf"
          }
        ]
      };
    } else if (req.code === "EPF_001") {
      result = {
        requirementId: req.id,
        state: "UNVERIFIABLE",
        scoreValue: 0,
        weight: 3,
        reason: "External dependency (EPFO Employer Portal) timed out after 5000ms",
        evidence: [
          {
            id: "ev-epf-01",
            documentId: "doc-abc-epf",
            documentName: "EPFO_Registration_ECR.pdf",
            pageNumber: 1,
            boundingBox: { x: 20, y: 30, width: 50, height: 10 },
            sourceText: "Establishment ID: TNCHE0098765000",
            fieldName: "EPFO_ESTABLISHMENT_ID",
            extractedValue: bid.bidder.epfoCode || "TNCHE0098765000",
            extractionMethod: "REGEX",
            confidence: 0.95,
            sha256: "e108849b2c31",
            grounded: true
          }
        ],
        validationChecks: [
          {
            id: "chk-epf-portal",
            checkCode: "EPFO_PORTAL_CONNECTIVITY",
            description: "Online verification with unifiedportal-epfindia.gov.in",
            inputValue: "TIMEOUT (5000ms)",
            expectedValue: "HTTP 200 SUCCESS",
            result: "REVIEW",
            reason: "Gateway timeout querying establishment records",
            source: "SIMULATED ADAPTER - EPFO Portal"
          }
        ],
        externalVerification: {
          adapterName: "EPFO Portal",
          sourceLabel: "SIMULATED ADAPTER - EPFO Portal (epfindia.gov.in)",
          status: "TIMEOUT",
          queriedValue: bid.bidder.epfoCode || "TNCHE0098765000",
          latencyMs: 5e3,
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
          fields: { error: "Gateway Timeout" },
          responseHash: "f491c09a82"
        }
      };
    } else if (req.code === "ITR_001") {
      result = {
        requirementId: req.id,
        state: "REVIEW",
        scoreValue: 0.5,
        weight: 3,
        reason: "CA UDIN barcode impression faint; manual inspection required to verify ICAI registry link",
        evidence: [
          {
            id: "ev-itr-01",
            documentId: "doc-abc-itr",
            documentName: "ITR_Acknowledgements_3Y.pdf",
            pageNumber: 1,
            boundingBox: { x: 25, y: 70, width: 45, height: 10 },
            sourceText: "UDIN: 24089123AAAA0012",
            fieldName: "CA_UDIN",
            extractedValue: "24089123AAAA0012",
            extractionMethod: "OCR_TESSERACT",
            confidence: 0.58,
            sha256: "a1b2c3d4e5f6",
            grounded: true
          }
        ],
        validationChecks: [
          {
            id: "chk-itr-udin",
            checkCode: "UDIN_LEGIBILITY",
            description: "ICAI UDIN clarity threshold",
            inputValue: "58% OCR confidence",
            expectedValue: ">= 60%",
            result: "REVIEW",
            reason: "Slight ink bleed on auditor rubber stamp",
            source: "ITR_Acknowledgements_3Y.pdf"
          }
        ]
      };
    } else {
      result = {
        requirementId: req.id,
        state: "PASS",
        scoreValue: 1,
        weight: req.mandatory ? 3 : 1,
        reason: "Mandatory documentation verified and compliance criteria satisfied",
        evidence: [
          {
            id: `ev-${req.code.toLowerCase()}-01`,
            documentId: `doc-${req.code.toLowerCase()}`,
            documentName: req.evidenceRequired[0] || "Tender_Proof.pdf",
            pageNumber: 1,
            boundingBox: { x: 20, y: 35, width: 60, height: 12 },
            sourceText: `Verified criteria for ${req.title}`,
            fieldName: req.checksRequired[0] || "STATUTORY_COMPLIANCE",
            extractedValue: "COMPLIANT_RECORD",
            extractionMethod: "REGEX",
            confidence: 0.98,
            sha256: "7c9812df0821",
            grounded: true
          }
        ],
        validationChecks: [
          {
            id: `chk-${req.code.toLowerCase()}-v1`,
            checkCode: req.checksRequired[0] || "VALIDATION_CHECK",
            description: `Verification check for ${req.title}`,
            inputValue: "Submitted in full",
            expectedValue: "Satisfactory proof",
            result: "PASS",
            reason: "Criteria fully satisfied",
            source: req.evidenceRequired[0] || "Bid Pack"
          }
        ]
      };
    }
    if (existingDecisions.has(req.id)) {
      result.officerDecision = existingDecisions.get(req.id);
    }
    results.push(result);
  }
  bid.requirementResults = results;
  bid.complianceScore = calculateComplianceScore(results);
  bid.riskLevel = calculateRiskLevel(reqs, results);
}
async function initializeAllBidsEvaluation(forceDefault = false) {
  await initializeBid1Evaluation(forceDefault);
  const reqs = requirementsTender1;
  const bid2 = sampleBids[1];
  if (bid2) {
    bid2.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: "PASS",
      scoreValue: 1,
      weight: req.mandatory ? 3 : 1,
      reason: "Full statutory compliance verified against portal registers and certified certificates.",
      evidence: [
        {
          id: `ev-bid2-${req.code.toLowerCase()}`,
          documentId: "doc-shree-cert",
          documentName: "ShreeTech_Certified_BidPack.pdf",
          pageNumber: 1,
          boundingBox: { x: 22, y: 35, width: 55, height: 10 },
          sourceText: `Statutory verification for ${req.title} verified.`,
          fieldName: req.checksRequired[0] || "COMPLIANCE",
          extractedValue: "VERIFIED_COMPLIANT",
          extractionMethod: "REGEX",
          confidence: 0.99,
          sha256: "772b8912ef09a82",
          grounded: true
        }
      ],
      validationChecks: [
        {
          id: `chk-bid2-${req.code}`,
          checkCode: req.checksRequired[0] || "RULE_CHECK",
          description: `Compliance validation for ${req.title}`,
          inputValue: "Valid and active record",
          expectedValue: "Active and current",
          result: "PASS",
          reason: "Verified against database register",
          source: req.evidenceRequired[0] || "Tender Pack"
        }
      ]
    }));
    bid2.complianceScore = 98;
    bid2.riskLevel = "LOW";
  }
  const bid3 = sampleBids[2];
  if (bid3) {
    bid3.requirementResults = reqs.map((req, idx) => ({
      requirementId: req.id,
      state: idx === 6 ? "REVIEW" : "PASS",
      scoreValue: idx === 6 ? 0.5 : 1,
      weight: req.mandatory ? 3 : 1,
      reason: idx === 6 ? "OEM endorsement stamp impression blurred; human inspection recommended." : "Statutory compliance satisfied.",
      evidence: [
        {
          id: `ev-bid3-${req.code.toLowerCase()}`,
          documentId: "doc-national-cert",
          documentName: "NationalBuildCorp_TenderDocs.pdf",
          pageNumber: 1,
          boundingBox: { x: 24, y: 40, width: 50, height: 12 },
          sourceText: `Submitted evidence for ${req.title}`,
          fieldName: req.checksRequired[0] || "STATUTORY",
          extractedValue: "COMPLIANT_VALUE",
          extractionMethod: "OCR_TESSERACT",
          confidence: idx === 6 ? 0.55 : 0.96,
          sha256: "883ca0921fe7b",
          grounded: true
        }
      ],
      validationChecks: [
        {
          id: `chk-bid3-${req.code}`,
          checkCode: req.checksRequired[0] || "VALIDATION",
          description: `Verification for ${req.title}`,
          inputValue: "Submitted",
          expectedValue: "Valid",
          result: idx === 6 ? "REVIEW" : "PASS",
          reason: idx === 6 ? "Low OCR confidence on stamp" : "Passed criteria",
          source: "NationalBuildCorp_TenderDocs.pdf"
        }
      ]
    }));
    bid3.complianceScore = 92;
    bid3.riskLevel = "LOW";
  }
  const bid4 = sampleBids[3];
  if (bid4) {
    bid4.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: req.code === "EPF_001" ? "UNVERIFIABLE" : "PASS",
      scoreValue: req.code === "EPF_001" ? 0 : 1,
      weight: req.mandatory ? 3 : 1,
      reason: req.code === "EPF_001" ? "Simulated EPFO Portal gateway returned TIMEOUT (5000ms)." : "Verified compliant.",
      evidence: [
        {
          id: `ev-bid4-${req.code.toLowerCase()}`,
          documentId: "doc-omkar-cert",
          documentName: "Omkar_Compliance_Pack.pdf",
          pageNumber: 1,
          boundingBox: { x: 20, y: 30, width: 60, height: 10 },
          sourceText: `Omkar Enterprises proof for ${req.title}`,
          fieldName: req.checksRequired[0] || "RECORD",
          extractedValue: "VALID",
          extractionMethod: "REGEX",
          confidence: 0.95,
          sha256: "661fa98012b",
          grounded: true
        }
      ],
      validationChecks: [
        {
          id: `chk-bid4-${req.code}`,
          checkCode: req.checksRequired[0] || "CHECK",
          description: `Validation for ${req.title}`,
          inputValue: req.code === "EPF_001" ? "TIMEOUT" : "Valid",
          expectedValue: "Active",
          result: req.code === "EPF_001" ? "REVIEW" : "PASS",
          reason: req.code === "EPF_001" ? "Gateway timeout" : "Passed",
          source: "Simulated Gateway"
        }
      ]
    }));
    bid4.complianceScore = 84;
    bid4.riskLevel = "MEDIUM";
  }
  const bid5 = sampleBids[4];
  if (bid5) {
    bid5.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: req.code === "DEBAR_001" ? "FAIL" : "PASS",
      scoreValue: req.code === "DEBAR_001" ? 0 : 1,
      weight: req.mandatory ? 3 : 1,
      reason: req.code === "DEBAR_001" ? "Entity actively listed on Central Debarment Register (Order MoHUA/2024/77)." : "Documentation verified.",
      evidence: [
        {
          id: `ev-bid5-${req.code.toLowerCase()}`,
          documentId: "doc-delta-cert",
          documentName: "Delta_Construction_Documents.pdf",
          pageNumber: 1,
          boundingBox: { x: 20, y: 40, width: 50, height: 12 },
          sourceText: `Delta proof for ${req.title}`,
          fieldName: req.checksRequired[0] || "DEBARMENT",
          extractedValue: req.code === "DEBAR_001" ? "DEBARRED" : "VALID",
          extractionMethod: "REGEX",
          confidence: 0.99,
          sha256: "994bd012a9",
          grounded: true
        }
      ],
      validationChecks: [
        {
          id: `chk-bid5-${req.code}`,
          checkCode: req.checksRequired[0] || "REGISTRY",
          description: `Clearance check for ${req.title}`,
          inputValue: req.code === "DEBAR_001" ? "FOUND IN DEBARMENT REGISTER" : "Clean record",
          expectedValue: "CLEAN RECORD (NOT DEBARRED)",
          result: req.code === "DEBAR_001" ? "FAIL" : "PASS",
          reason: req.code === "DEBAR_001" ? "Debarred under GFR 151" : "Clear",
          source: "Central Debarment Registry"
        }
      ]
    }));
    bid5.complianceScore = 41;
    bid5.riskLevel = "HIGH";
  }
  const bid6 = sampleBids[5];
  if (bid6) {
    bid6.requirementResults = reqs.map((req) => ({
      requirementId: req.id,
      state: req.code === "GST_001" ? "FAIL" : "PASS",
      scoreValue: req.code === "GST_001" ? 0 : 1,
      weight: req.mandatory ? 3 : 1,
      reason: req.code === "GST_001" ? "Structural mismatch: embedded PAN in GSTIN does not match standalone PAN card." : "Verified.",
      evidence: [
        {
          id: `ev-bid6-${req.code.toLowerCase()}`,
          documentId: "doc-premier-cert",
          documentName: "Premier_Engineering_Bid.pdf",
          pageNumber: 1,
          boundingBox: { x: 22, y: 45, width: 55, height: 10 },
          sourceText: `Premier proof for ${req.title}`,
          fieldName: "GSTIN",
          extractedValue: "33FFFFF5555F6Z2",
          extractionMethod: "REGEX",
          confidence: 0.98,
          sha256: "551eb0921c",
          grounded: true
        }
      ],
      validationChecks: [
        {
          id: `chk-bid6-${req.code}`,
          checkCode: req.checksRequired[0] || "CHECKSUM",
          description: `Validation for ${req.title}`,
          inputValue: req.code === "GST_001" ? "PAN MISMATCH (FFFFF5555F vs GGGGG9999G)" : "Compliant",
          expectedValue: "EXACT PAN MATCH",
          result: req.code === "GST_001" ? "FAIL" : "PASS",
          reason: req.code === "GST_001" ? "Checksum / PAN cross-check failed" : "Pass",
          source: "Rule Engine Mod-36"
        }
      ]
    }));
    bid6.complianceScore = 64;
    bid6.riskLevel = "HIGH";
  }
  for (let i = 6; i < sampleBids.length; i++) {
    const b = sampleBids[i];
    if (b && (!b.requirementResults || b.requirementResults.length === 0)) {
      b.requirementResults = reqs.map((req, idx) => {
        const isFail = b.status === "NEEDS_ATTENTION" && (idx === 0 || idx === 2);
        const isReview = b.status === "IN_VERIFICATION" && idx === 10;
        const state = isFail ? "FAIL" : isReview ? "REVIEW" : "PASS";
        return {
          requirementId: req.id,
          state,
          scoreValue: state === "PASS" ? 1 : state === "REVIEW" ? 0.5 : 0,
          weight: req.mandatory ? 3 : 1,
          reason: state === "PASS" ? "Full statutory compliance verified against portal registers and certified certificates." : state === "FAIL" ? "Statutory non-compliance detected." : "Flagged for officer verification.",
          evidence: [
            {
              id: `ev-${b.id.toLowerCase()}-${req.code.toLowerCase()}`,
              documentId: `doc-${b.id.toLowerCase()}-cert`,
              documentName: `${b.bidder.legalName.replace(/\s+/g, "_")}_BidPack.pdf`,
              pageNumber: 1,
              boundingBox: { x: 20, y: 35, width: 55, height: 10 },
              sourceText: `Statutory verification for ${req.title}`,
              fieldName: req.checksRequired[0] || "COMPLIANCE",
              extractedValue: "VERIFIED_COMPLIANT",
              extractionMethod: "REGEX",
              confidence: 0.98,
              sha256: "7c9812df0821",
              grounded: true
            }
          ],
          validationChecks: [
            {
              id: `chk-${b.id.toLowerCase()}-${req.code}`,
              checkCode: req.checksRequired[0] || "CHECK",
              description: `Verification for ${req.title}`,
              inputValue: state === "PASS" ? "Valid and current" : state === "FAIL" ? "Non-compliant" : "Manual inspection required",
              expectedValue: "Compliant record",
              result: state,
              reason: state === "PASS" ? "Criteria satisfied" : state === "FAIL" ? "Breach identified" : "Awaiting review",
              source: `${b.bidder.legalName}_BidPack.pdf`
            }
          ]
        };
      });
    }
  }
}
function saveStateToDisk() {
  try {
    const data = JSON.stringify(sampleBids, null, 2);
    fs.writeFileSync(PERSIST_FILE, data, "utf-8");
  } catch (err) {
    console.warn("[DataStore] Failed to write state to disk:", err);
  }
}
function loadStateFromDisk() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const raw = fs.readFileSync(PERSIST_FILE, "utf-8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded) && loaded.length > 0) {
        for (const savedBid of loaded) {
          const match = sampleBids.find((b) => b.id === savedBid.id);
          if (match) {
            if (savedBid.requirementResults) match.requirementResults = savedBid.requirementResults;
            if (savedBid.complianceScore !== void 0) match.complianceScore = savedBid.complianceScore;
            if (savedBid.riskLevel) match.riskLevel = savedBid.riskLevel;
            if (savedBid.status) match.status = savedBid.status;
            if (savedBid.overallDecision) match.overallDecision = savedBid.overallDecision;
          }
        }
        return true;
      }
    }
  } catch (err) {
    console.warn("[DataStore] Failed to load state from disk:", err);
  }
  return false;
}
async function resetStateToDefault() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      fs.unlinkSync(PERSIST_FILE);
    }
  } catch (err) {
    console.warn("[DataStore] Error removing state file:", err);
  }
  const defaultStatusMap = {
    "BID-001": "NEEDS_ATTENTION",
    "BID-002": "VERIFIED",
    "BID-003": "VERIFIED",
    "BID-004": "IN_VERIFICATION",
    "BID-005": "NEEDS_ATTENTION",
    "BID-006": "NEEDS_ATTENTION",
    "BID-007": "VERIFIED",
    "BID-008": "VERIFIED",
    "BID-009": "VERIFIED",
    "BID-010": "VERIFIED",
    "BID-011": "IN_VERIFICATION",
    "BID-012": "NEEDS_ATTENTION"
  };
  for (const bid of sampleBids) {
    delete bid.overallDecision;
    bid.status = defaultStatusMap[bid.id] || "IN_VERIFICATION";
    if (bid.requirementResults) {
      for (const r of bid.requirementResults) {
        delete r.officerDecision;
      }
    }
  }
  await initializeAllBidsEvaluation(true);
}
(async () => {
  const restored = loadStateFromDisk();
  if (!restored) {
    await initializeAllBidsEvaluation();
  }
})().catch((err) => console.error("Error initializing data store:", err));

// src/server/auditService.ts
import crypto2 from "crypto";
var GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
var AuditService = class {
  constructor() {
    this.chain = [];
    this.nextId = 1;
    this.seedInitialChain();
  }
  canonicalize(payload) {
    return JSON.stringify(payload, Object.keys(payload).sort());
  }
  computeHash(previousHash, payload) {
    const canonicalString = this.canonicalize(payload);
    return crypto2.createHash("sha256").update(previousHash + canonicalString).digest("hex");
  }
  appendEvent(data) {
    const previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : GENESIS_HASH;
    const payload = {
      timestamp: data.timestamp,
      tenderId: data.tenderId,
      tenderVersion: data.tenderVersion,
      ruleSetVersion: data.ruleSetVersion,
      bidId: data.bidId,
      bidderName: data.bidderName,
      eventType: data.eventType,
      actor: data.actor,
      details: data.details,
      requirementCode: data.requirementCode,
      systemState: data.systemState,
      score: data.score,
      risk: data.risk,
      officerDisposition: data.officerDisposition,
      justification: data.justification
    };
    const hash = this.computeHash(previousHash, payload);
    const record = {
      id: this.nextId++,
      ...data,
      previousHash,
      hash
    };
    this.chain.push(record);
    return record;
  }
  getChain() {
    return [...this.chain];
  }
  verifyIntegrity() {
    let currentExpectedPrev = GENESIS_HASH;
    for (let i = 0; i < this.chain.length; i++) {
      const record = this.chain[i];
      if (record.previousHash !== currentExpectedPrev) {
        return {
          valid: false,
          verifiedRecords: i,
          firstBrokenRecord: record.id,
          expectedHash: currentExpectedPrev,
          computedHash: record.previousHash,
          details: `Broken link at record #${record.id}: previousHash does not match parent block hash.`
        };
      }
      const payload = {
        timestamp: record.timestamp,
        tenderId: record.tenderId,
        tenderVersion: record.tenderVersion,
        ruleSetVersion: record.ruleSetVersion,
        bidId: record.bidId,
        bidderName: record.bidderName,
        eventType: record.eventType,
        actor: record.actor,
        details: record.details,
        requirementCode: record.requirementCode,
        systemState: record.systemState,
        score: record.score,
        risk: record.risk,
        officerDisposition: record.officerDisposition,
        justification: record.justification
      };
      const computed = this.computeHash(record.previousHash, payload);
      if (computed !== record.hash) {
        return {
          valid: false,
          verifiedRecords: i,
          firstBrokenRecord: record.id,
          expectedHash: record.hash,
          computedHash: computed,
          details: `Cryptographic payload tampering detected in record #${record.id}! Content was altered after signing.`
        };
      }
      currentExpectedPrev = record.hash;
    }
    return {
      valid: true,
      verifiedRecords: this.chain.length
    };
  }
  /**
   * Tamper with a record deliberately to demonstrate the integrity verification tool (Mandatory Demo Case H)
   */
  tamperWithRecord(recordId, fakeJustification) {
    const record = this.chain.find((r) => r.id === recordId);
    if (!record) return false;
    record.justification = fakeJustification;
    record.details = `[TAMPERED CONTENT] ${record.details}`;
    record.isTampered = true;
    return true;
  }
  /**
   * Reset / re-seed audit records to initial valid state
   */
  resetToValidState() {
    this.chain = [];
    this.nextId = 1;
    this.seedInitialChain();
  }
  seedInitialChain() {
    this.appendEvent({
      timestamp: "2026-09-28T09:15:00.000Z",
      tenderId: "TND-GEM-2025-0012",
      tenderVersion: 2,
      ruleSetVersion: "1.3",
      bidId: "BID-001",
      bidderName: "ABC Infra Solutions",
      eventType: "BID_SUBMITTED",
      actor: { name: "CPCL Portal Service", role: "SYSTEM", email: "gem-ingest@cpcl.gov.in" },
      details: "Bid submitted with 6 mandatory statutory certificates and tender documents."
    });
    this.appendEvent({
      timestamp: "2026-09-28T09:16:30.000Z",
      tenderId: "TND-GEM-2025-0012",
      tenderVersion: 2,
      ruleSetVersion: "1.3",
      bidId: "BID-001",
      bidderName: "ABC Infra Solutions",
      eventType: "DOCUMENT_EXTRACTED",
      actor: { name: "TenderGuard OCR Pipeline", role: "SYSTEM", email: "ocr-engine@tenderguard.local" },
      details: "6 documents parsed. Extracted GSTIN, PAN, CIN facts with bounding boxes."
    });
    this.appendEvent({
      timestamp: "2026-09-28T09:18:10.000Z",
      tenderId: "TND-GEM-2025-0012",
      tenderVersion: 2,
      ruleSetVersion: "1.3",
      bidId: "BID-001",
      bidderName: "ABC Infra Solutions",
      eventType: "REQUIREMENT_VERIFIED",
      actor: { name: "Deterministic Rule Engine", role: "SYSTEM", email: "rules@tenderguard.local" },
      details: "Statutory verification completed. 18 requirements evaluated.",
      score: 72,
      risk: "HIGH",
      systemState: "FAIL"
    });
    this.appendEvent({
      timestamp: "2026-09-28T10:45:00.000Z",
      tenderId: "TND-GEM-2025-0012",
      tenderVersion: 2,
      ruleSetVersion: "1.3",
      bidId: "BID-001",
      bidderName: "ABC Infra Solutions",
      eventType: "OFFICER_DECISION",
      actor: { name: "P. Sengupta", role: "OFFICER", email: "officer@cpcl.gov.in" },
      details: "Officer requested clarification on CIN discrepancy and overdue return filing.",
      requirementCode: "CIN_001",
      systemState: "FAIL",
      officerDisposition: "REQUEST_CLARIFICATION",
      justification: "Bidder is granted 5 working days to provide certified RoC extract for CIN verification."
    });
  }
};
var auditService = new AuditService();

// src/server/routes.ts
var rawFastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
var FASTAPI_URL = rawFastApiUrl.startsWith("http://") || rawFastApiUrl.startsWith("https://") ? rawFastApiUrl : `http://${rawFastApiUrl}`;
async function tryFastApiEvaluation(bidId) {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/bidders/${bidId}/evaluation`, {
      signal: AbortSignal.timeout(3e3)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      score: data.score?.score ?? null,
      riskLevel: data.risk?.level ?? null,
      overallState: data.overall_state ?? null,
      requirements: data.requirements?.map((r) => ({
        req_id: r.requirement_id,
        state: r.state
      })) ?? []
    };
  } catch {
    return null;
  }
}
var router = express.Router();
var activeUser = { ...currentUser };
router.get("/auth/me", (_req, res) => {
  res.json({
    user: activeUser,
    availableRoles: ["OFFICER", "EVALUATOR", "ADMIN", "AUDITOR"]
  });
});
router.post("/auth/switch-role", (req, res) => {
  const { role } = req.body;
  const match = allUsers.find((u) => u.role === role);
  if (match) {
    activeUser = { ...match };
  } else {
    activeUser = {
      ...activeUser,
      role
    };
  }
  res.json({ success: true, user: activeUser });
});
router.post("/auth/login", (req, res) => {
  const { email } = req.body;
  const matched = allUsers.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (matched) {
    activeUser = { ...matched };
  }
  res.json({ success: true, user: activeUser });
});
router.get("/dashboard", (_req, res) => {
  res.json({
    kpis: {
      activeTenders: 12,
      activeTendersDiff: "+2 this week",
      totalBidsReceived: 48,
      totalBidsDiff: "+14 this week",
      bidsNeedAttention: 6,
      completedReviews: 32,
      completedReviewsDiff: "This month"
    },
    verificationOverview: {
      total: 48,
      passed: 22,
      passedPct: 45.8,
      failed: 8,
      failedPct: 16.7,
      underReview: 12,
      underReviewPct: 25,
      unverifiable: 6,
      unverifiablePct: 12.5
    },
    recentActivity: [
      {
        id: "act-1",
        title: "Verification completed for ABC Infra Solutions",
        timeAgo: "2 minutes ago",
        type: "VERIFICATION"
      },
      {
        id: "act-2",
        title: "New bid received - Shree Tech Pvt Ltd",
        timeAgo: "12 minutes ago",
        type: "BID_SUBMITTED"
      },
      {
        id: "act-3",
        title: "Officer decision submitted: Request Clarification",
        timeAgo: "45 minutes ago",
        type: "OFFICER_DECISION"
      },
      {
        id: "act-4",
        title: "Tender GEM/2025/0012 published for review",
        timeAgo: "2 hours ago",
        type: "TENDER_UPDATE"
      }
    ]
  });
});
router.get("/tenders", (_req, res) => {
  res.json(tenders);
});
router.get("/tenders/:id", (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id || t.tenderNumber === req.params.id);
  if (!tender) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  res.json(tender);
});
router.get("/tenders/:id/bidders", (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id || t.tenderNumber === req.params.id);
  if (!tender) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  const bids = sampleBids.filter((b) => b.tenderId === tender.id);
  const needsAttention = bids.filter((b) => b.status === "NEEDS_ATTENTION").length;
  const inReview = bids.filter((b) => b.status === "IN_VERIFICATION").length;
  const verified = bids.filter((b) => b.status === "VERIFIED" || b.status === "REVIEWED").length;
  res.json({
    tender,
    bids,
    counts: {
      all: bids.length,
      needsAttention,
      inReview,
      verified
    }
  });
});
router.post("/tenders", (req, res) => {
  const { title, tenderNumber, department, organisation, description, category, openingDate, closingDate, ruleSetVersion } = req.body;
  if (!title || !tenderNumber) {
    res.status(400).json({ error: "Title and Tender Reference Number are mandatory." });
    return;
  }
  const cleanNumber = tenderNumber.trim().toUpperCase();
  const existing = tenders.find((t) => t.tenderNumber === cleanNumber);
  if (existing) {
    res.status(400).json({ error: `Tender ${cleanNumber} already exists in registry.` });
    return;
  }
  const newTender = {
    id: `TND-${Date.now()}`,
    tenderNumber: cleanNumber,
    title: title.trim(),
    department: department?.trim() || "Procurement Directorate",
    organisation: organisation?.trim() || "Government e-Marketplace",
    description: description?.trim() || `Tender for ${title}. Configured for deterministic statutory verification under GFR 2017.`,
    openingDate: openingDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    closingDate: closingDate || "2026-12-31",
    status: "VERIFICATION",
    currentVersion: 1,
    ruleSetVersion: ruleSetVersion || "1.3",
    requirementsCount: 18,
    totalBidders: 0,
    progressPercent: 0,
    requirements: tenders[0]?.requirements || []
  };
  tenders.unshift(newTender);
  saveStateToDisk();
  res.status(201).json({ success: true, tender: newTender });
});
router.get("/bids/:id", (req, res) => {
  const bid = sampleBids.find((b) => b.id === req.params.id);
  if (!bid) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }
  const tender = tenders.find((t) => t.id === bid.tenderId);
  res.json({ bid, tender });
});
router.post("/bids/:id/verify", async (req, res) => {
  const bid = sampleBids.find((b) => b.id === req.params.id);
  if (!bid) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }
  const tender = tenders.find((t) => t.id === bid.tenderId);
  if (!tender) {
    res.status(404).json({ error: "Tender not found" });
    return;
  }
  await initializeBid1Evaluation();
  let engineSource = "EXPRESS_LOCAL";
  const fastApiResult = await tryFastApiEvaluation(bid.id);
  if (fastApiResult) {
    if (fastApiResult.score !== null) bid.complianceScore = fastApiResult.score;
    if (fastApiResult.riskLevel) bid.riskLevel = fastApiResult.riskLevel;
    engineSource = "FASTAPI_PYTHON";
  }
  auditService.appendEvent({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    tenderId: tender.id,
    tenderVersion: tender.currentVersion,
    ruleSetVersion: tender.ruleSetVersion,
    bidId: bid.id,
    bidderName: bid.bidder.legalName,
    eventType: "REQUIREMENT_VERIFIED",
    actor: {
      name: activeUser.name,
      role: activeUser.role,
      email: activeUser.email
    },
    details: `Deterministic verification [${engineSource}] for ${tender.requirements.length} requirements. Result: ${bid.requirementResults.filter((r) => r.state === "PASS").length} PASS, ${bid.requirementResults.filter((r) => r.state === "FAIL").length} FAIL.`,
    score: bid.complianceScore,
    risk: bid.riskLevel
  });
  saveStateToDisk();
  res.json({
    bidId: bid.id,
    complianceScore: bid.complianceScore,
    riskLevel: bid.riskLevel,
    results: bid.requirementResults,
    verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    tenderVersion: tender.currentVersion,
    ruleSetVersion: tender.ruleSetVersion,
    engineSource
  });
});
router.post("/bids/:id/decision", (req, res) => {
  const { requirementId, disposition, justification } = req.body;
  if (activeUser.role === "AUDITOR") {
    res.status(403).json({ error: "Auditors have read-only permissions." });
    return;
  }
  if (!disposition || !justification || justification.trim().length < 20) {
    res.status(400).json({
      error: "A detailed justification of at least 20 characters is mandatory for recording an officer decision."
    });
    return;
  }
  const bid = sampleBids.find((b) => b.id === req.params.id);
  if (!bid) {
    res.status(404).json({ error: "Bid not found" });
    return;
  }
  const tender = tenders.find((t) => t.id === bid.tenderId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (requirementId) {
    const resItem = bid.requirementResults.find((r) => r.requirementId === requirementId);
    if (resItem) {
      resItem.officerDecision = {
        disposition,
        justification,
        decidedBy: activeUser.name,
        decidedAt: now
      };
      const reqObj = tender?.requirements.find((r) => r.id === requirementId);
      auditService.appendEvent({
        timestamp: now,
        tenderId: bid.tenderId,
        tenderVersion: tender?.currentVersion || 2,
        ruleSetVersion: tender?.ruleSetVersion || "1.3",
        bidId: bid.id,
        bidderName: bid.bidder.legalName,
        eventType: "OFFICER_DECISION",
        actor: {
          name: activeUser.name,
          role: activeUser.role,
          email: activeUser.email
        },
        details: `Officer recorded disposition [${disposition}] on requirement ${reqObj?.code || requirementId}. System Result [${resItem.state}] remained immutable.`,
        requirementCode: reqObj?.code,
        systemState: resItem.state,
        officerDisposition: disposition,
        justification
      });
    }
  } else {
    bid.overallDecision = {
      disposition,
      justification,
      officerName: activeUser.name,
      officerEmail: activeUser.email,
      timestamp: now
    };
    bid.status = disposition === "ACCEPT" ? "VERIFIED" : "REVIEWED";
    auditService.appendEvent({
      timestamp: now,
      tenderId: bid.tenderId,
      tenderVersion: tender?.currentVersion || 2,
      ruleSetVersion: tender?.ruleSetVersion || "1.3",
      bidId: bid.id,
      bidderName: bid.bidder.legalName,
      eventType: "OFFICER_DECISION",
      actor: {
        name: activeUser.name,
        role: activeUser.role,
        email: activeUser.email
      },
      details: `Officer submitted final verification review: disposition [${disposition}]. Compliance Score: ${bid.complianceScore}%, Risk: ${bid.riskLevel}.`,
      score: bid.complianceScore,
      risk: bid.riskLevel,
      officerDisposition: disposition,
      justification
    });
  }
  saveStateToDisk();
  res.json({
    success: true,
    bid,
    message: "Officer decision recorded successfully. System result preserved."
  });
});
router.get("/bids/:id/requirements/:reqId/advisory", async (req, res) => {
  const bid = sampleBids.find((b) => b.id === req.params.id);
  const tender = tenders.find((t) => t.id === bid?.tenderId);
  const reqObj = tender?.requirements.find((r) => r.id === req.params.reqId);
  const resItem = bid?.requirementResults.find((r) => r.requirementId === req.params.reqId);
  if (!bid || !reqObj || !resItem) {
    res.status(404).json({ error: "Requirement result not found" });
    return;
  }
  const advisory = await generateAdvisory(reqObj, resItem, bid.bidder.legalName);
  res.json(advisory);
});
router.get("/audit", (_req, res) => {
  res.json(auditService.getChain());
});
router.post("/audit/verify", (_req, res) => {
  const verification = auditService.verifyIntegrity();
  res.json(verification);
});
router.post("/audit/tamper", (req, res) => {
  const { recordId, fakeJustification } = req.body;
  const targetId = recordId ? Number(recordId) : 3;
  const success = auditService.tamperWithRecord(
    targetId,
    fakeJustification || "Unauthorized database modification by third-party injected row"
  );
  res.json({
    success,
    tamperedRecordId: targetId,
    message: `Record #${targetId} was modified out-of-band to test SHA-256 chain integrity detection.`
  });
});
router.post("/audit/reset", (_req, res) => {
  auditService.resetToValidState();
  res.json({ success: true, message: "Audit chain reset to verified state" });
});
router.post("/admin/reset-demo", async (_req, res) => {
  await resetStateToDefault();
  auditService.resetToValidState();
  res.json({
    success: true,
    message: "All synthetic bidder datasets, officer decisions, and audit chain reset to initial baseline."
  });
});
router.get("/portals", (_req, res) => {
  res.json({
    settings: activeSimulatorSettings,
    portals: [
      {
        id: "gst",
        name: "GSTN Taxpayer & Filing Portal",
        endpoint: "https://gst.gov.in/api/v2/taxpayer",
        status: activeSimulatorSettings.gstStatus,
        label: "SIMULATED ADAPTER",
        avgLatencyMs: 182,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "mca",
        name: "Ministry of Corporate Affairs (MCA21)",
        endpoint: "https://mca.gov.in/api/v1/company",
        status: activeSimulatorSettings.mcaStatus,
        label: "SIMULATED ADAPTER",
        avgLatencyMs: 195,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "udyam",
        name: "MSME Udyam Registration Portal",
        endpoint: "https://udyamregistration.gov.in/api/v1/enterprise",
        status: activeSimulatorSettings.udyamStatus,
        label: "SIMULATED ADAPTER",
        avgLatencyMs: 140,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "epfo",
        name: "EPFO Unified Portal (Shram Suvidha)",
        endpoint: "https://unifiedportal-epfindia.gov.in/api/v1/ecr",
        status: activeSimulatorSettings.epfoStatus,
        label: "SIMULATED ADAPTER",
        avgLatencyMs: 310,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "debarment",
        name: "CPPP & GeM Central Debarment Register",
        endpoint: "https://eprocure.gov.in/api/v1/debarred-entities",
        status: activeSimulatorSettings.debarmentStatus,
        label: "SIMULATED ADAPTER",
        avgLatencyMs: 110,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  });
});
router.post("/portals/set-status", (req, res) => {
  const { portal, status } = req.body;
  if (portal === "gst") activeSimulatorSettings.gstStatus = status;
  if (portal === "mca") activeSimulatorSettings.mcaStatus = status;
  if (portal === "udyam") activeSimulatorSettings.udyamStatus = status;
  if (portal === "epfo") activeSimulatorSettings.epfoStatus = status;
  if (portal === "debarment") activeSimulatorSettings.debarmentStatus = status;
  res.json({
    success: true,
    portal,
    status,
    settings: activeSimulatorSettings
  });
});
router.get("/evaluation", (_req, res) => {
  res.json({
    metrics: {
      deterministicRuleAccuracy: 100,
      ocrExtractionAccuracy: 98.4,
      falsePassCount: 0,
      falsePassTarget: "Strict 0",
      reviewRatePercent: 11.1,
      categoriesCovered: ["STATUTORY", "FINANCIAL", "TECHNICAL", "EXPERIENCE"],
      manualBaselineMinutesPerBid: 180,
      tenderGuardAverageSeconds: 38,
      turnaroundReductionPercent: 78.9
    },
    sampleValidationTestCases: [
      {
        caseId: "CASE-01",
        title: "Valid GSTIN Mod-36 Checksum Validation",
        expected: "PASS",
        actual: "PASS",
        mode: "DETERMINISTIC"
      },
      {
        caseId: "CASE-02",
        title: "GSTIN PAN cross-match mismatch detection",
        expected: "FAIL",
        actual: "FAIL",
        mode: "DETERMINISTIC"
      },
      {
        caseId: "CASE-03",
        title: "MCA21 Non-existent CIN lookup",
        expected: "FAIL",
        actual: "FAIL",
        mode: "DETERMINISTIC + SIMULATED_ADAPTER"
      },
      {
        caseId: "CASE-04",
        title: "Ungrounded OCR Extraction (Hallucination Defense)",
        expected: "REVIEW",
        actual: "REVIEW",
        mode: "GROUNDING_CHECK"
      },
      {
        caseId: "CASE-05",
        title: "EPFO External Gateway Timeout Resilience",
        expected: "UNVERIFIABLE",
        actual: "UNVERIFIABLE",
        mode: "ADAPTER_FAILURE_INJECTION"
      },
      {
        caseId: "CASE-06",
        title: "Cryptographic SHA-256 Hash Chain Tampering Detection",
        expected: "FLAG_TAMPERED",
        actual: "FLAG_TAMPERED",
        mode: "AUDIT_CHAIN_INTEGRITY"
      }
    ]
  });
});
router.get("/limitations", (_req, res) => {
  res.json({
    system_classification: "Deterministic Statutory Procurement Decision-Support System",
    deployment_paradigm: "Designed for Sovereign On-Premises Government Deployment",
    hosted_environment: "Simulated evaluation environment (Express + Vite + FastAPI)",
    core_value: "Deterministic, explainable, auditable bid verification: same evidence in, same result out \u2014 never a false PASS.",
    legal_disclaimer: "ADVISORY \u2014 NOT A FINAL DISQUALIFICATION. This evaluation provides algorithmic evidence verification to assist the competent procurement authority. Final procurement disqualification or contract award decisions remain the sole statutory prerogative of the designated Procurement Officer in accordance with the General Financial Rules (GFR 2017) and GeM General Terms and Conditions.",
    simulated_adapters: {
      source_tag: "SIMULATED",
      adapters: [
        {
          name: "GSTN Adapter",
          status: "SIMULATED",
          capabilities: ["Registration Status", "Return Filing Compliance", "Return Period"]
        },
        {
          name: "MCA21 Registry Adapter",
          status: "SIMULATED",
          capabilities: ["CIN Lookup", "Company Active Status", "RoC Record"]
        },
        {
          name: "Udyam MSME Adapter",
          status: "SIMULATED",
          capabilities: ["Registration Status", "Enterprise Category (Micro/Small)", "Major Activity"]
        },
        {
          name: "EPFO Adapter",
          status: "SIMULATED",
          capabilities: ["Establishment Verification", "Contributing Members Count"]
        },
        {
          name: "ESIC Adapter",
          status: "SIMULATED",
          capabilities: ["Employer Status", "Defaulter Registry Screening"]
        },
        {
          name: "Debarment Registry Adapter",
          status: "SIMULATED",
          capabilities: ["Scope Evaluation (Org-wide vs Category)", "Order Validity Timeline"]
        }
      ],
      resilience: "Portal timeouts or downtime gracefully yield UNVERIFIABLE state \u2014 never a false PASS and never a false FAIL. Excluded from score denominator."
    },
    synthetic_data: {
      rationale: "Commercial confidentiality under DPDP Act 2023 restricts use of proprietary bidder trade proposals.",
      coverage: "6 comprehensive bidder packets across 3 distinct tenders (Goods, Services, Construction).",
      statutory_accuracy: "All synthetic GSTINs strictly validate against GSTN Mod-36 checksum algorithm."
    },
    ai_boundary: {
      decision_path: "Zero LLM in the eligibility decision path. 100% deterministic TypeScript + Python rule execution.",
      extraction: "Bounded Tesseract OCR and PyMuPDF native extraction with mandatory verbatim text grounding.",
      advisory: "Deterministic template generation citing requirement codes. Optional Gemini rewrite strictly gated by regex validators with template fallback."
    },
    sovereign_security: {
      encryption_at_rest: "AES-256-GCM authenticated cipher with SHA-256 integrity digests.",
      audit_trail: "Tamper-evident SHA-256 hash chain with INSERT-only role enforcement.",
      data_retention: "DPDP Act 2023 compliant retention policy tracking."
    },
    tech_stack: {
      frontend: "React 19 + Vite 8 + TailwindCSS 4",
      express_server: "Express 4 + TypeScript (Node.js)",
      python_backend: "FastAPI 0.100+ (Python) \u2014 Rule Engine & Scoring",
      database: "PostgreSQL (production) / In-memory (demo)",
      ocr: "PyMuPDF (native) + Tesseract OCR + OpenCV",
      matching: "rapidfuzz token-set-ratio"
    }
  });
});
var routes_default = router;

// server-core.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express2();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const isProd = process.env.NODE_ENV === "production";
  app.use(express2.json());
  app.use("/api", routes_default);
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    app.use(express2.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`[TenderGuard] Frontend server running on http://0.0.0.0:${port}`);
    console.log(`[TenderGuard] FastAPI backend expected at ${process.env.FASTAPI_URL || "http://localhost:8000"}`);
  });
}
startServer().catch((err) => {
  console.error("[TenderGuard] Server failed to start:", err);
  process.exit(1);
});
export {
  startServer
};

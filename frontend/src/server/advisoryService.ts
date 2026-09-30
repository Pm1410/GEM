import { GoogleGenAI } from '@google/genai';
import { Requirement, RequirementResult } from './domain';

interface AdvisoryOutput {
  summary: string;
  explanation: string;
  suggestedAction: string;
  isAiEnhanced: boolean;
}

/**
 * Generate advisory explanation.
 * Core principle: Deterministic advisory template first.
 * Optional Gemini rewrite for natural, professional procurement phrasing.
 * The model NEVER receives authority to change the verification state.
 */
export async function generateAdvisory(
  req: Requirement,
  result: RequirementResult,
  bidderName: string,
  forceAi: boolean = false
): Promise<AdvisoryOutput> {
  // 1. Deterministic template generation (Baseline & guaranteed fallback)
  let deterministicExplanation = '';
  let deterministicSuggestedAction = '';
  let summary = '';

  if (result.state === 'PASS') {
    summary = `${req.code} fully satisfied statutory criteria.`;
    deterministicExplanation = `The submitted documents for ${req.title} met all deterministic rules and statutory checks without anomalies. Source evidence matched cross-referenced registers.`;
    deterministicSuggestedAction = 'Mark as accepted in technical compliance sheet.';
  } else if (result.state === 'FAIL') {
    summary = `${req.code} failed due to: ${result.reason}.`;
    if (result.reason.toLowerCase().includes('mca') || result.reason.toLowerCase().includes('cin')) {
      deterministicExplanation = `The CIN specified in the bid documents for ${bidderName} was not found in the Ministry of Corporate Affairs (MCA21) registry. This may indicate an incorrect CIN number, a defunct entity, or un-notified corporate reorganization.`;
      deterministicSuggestedAction = 'Request formal clarification from bidder to furnish original certified RoC Certificate of Incorporation within 5 days, or verify from alternative official register.';
    } else if (result.reason.toLowerCase().includes('overdue') || result.reason.toLowerCase().includes('filing')) {
      deterministicExplanation = `GST portal response indicates GSTR-3B return filings are currently OVERDUE for the recent tax periods, violating mandatory tender compliance condition.`;
      deterministicSuggestedAction = 'Issue clarification notice demanding proof of updated GSTR-3B filing acknowledgement and challan payment.';
    } else if (result.reason.toLowerCase().includes('mismatch')) {
      deterministicExplanation = `A structural discrepancy was detected: The PAN segment embedded within the GSTIN does not match the standalone PAN card submitted in the bidder pack.`;
      deterministicSuggestedAction = 'Reject or issue strict notice of non-compliance for document tampering or submission error.';
    } else if (result.reason.toLowerCase().includes('debarred')) {
      deterministicExplanation = `Entity or key directors appear on the Central Debarment / GeM Ineligibility Register under active banning order.`;
      deterministicSuggestedAction = 'Disqualify bidder pursuant to General Financial Rules (GFR) 2017 Rule 151.';
    } else {
      deterministicExplanation = `Requirement failed rule check: ${result.reason}. Check individual validation items for step-by-step failures.`;
      deterministicSuggestedAction = 'Review fail reasons with tender committee and request clarification if acceptable under tender terms.';
    }
  } else if (result.state === 'REVIEW') {
    summary = `${req.code} flagged for officer review: ${result.reason}.`;
    deterministicExplanation = `Deterministic engine identified missing or low-confidence evidence. Either the document was omitted, or OCR text confidence was below threshold (e.g. blurred seal or faint text), requiring human inspection.`;
    deterministicSuggestedAction = 'Officer must inspect the attached high-resolution document viewer to manually confirm validity.';
  } else {
    // UNVERIFIABLE
    summary = `${req.code} could not be verified automatically: external portal unavailable.`;
    deterministicExplanation = `External government adapter (${result.externalVerification?.adapterName || 'Portal'}) returned TIMEOUT or 503 SERVICE UNAVAILABLE during verification run.`;
    deterministicSuggestedAction = 'Officer may re-trigger portal lookup or perform manual offline verification via authenticated department terminal.';
  }

  // 2. Optional Gemini AI enhancement (Only when explicitly requested to preserve quotas)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!forceAi || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      summary,
      explanation: deterministicExplanation,
      suggestedAction: deterministicSuggestedAction,
      isAiEnhanced: false,
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

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.explanation && parsed.suggestedAction) {
        return {
          summary,
          explanation: parsed.explanation,
          suggestedAction: parsed.suggestedAction,
          isAiEnhanced: true,
        };
      }
    }
  } catch (error) {
    console.warn('[AdvisoryService] Gemini rewrite failed or skipped, using deterministic template:', error);
  }

  return {
    summary,
    explanation: deterministicExplanation,
    suggestedAction: deterministicSuggestedAction,
    isAiEnhanced: false,
  };
}

import React, { useState } from 'react';
import {
  Requirement,
  RequirementResult,
  OfficerDisposition,
  EvidenceItem,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { SimulatedPortalBanner } from '../common/SimulatedPortalBanner';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  UserCheck,
  FileText,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

interface VerificationDetailPaneProps {
  requirement: Requirement;
  result: RequirementResult;
  onSaveDecision: (disposition: OfficerDisposition, justification: string) => Promise<void>;
  onSelectEvidence: (evidence: EvidenceItem) => void;
  onOpenPortalSimulator?: () => void;
}

export const VerificationDetailPane: React.FC<VerificationDetailPaneProps> = ({
  requirement,
  result,
  onSaveDecision,
  onSelectEvidence,
  onOpenPortalSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'VALIDATION' | 'EVIDENCE' | 'ADVISORY'>('DETAILS');
  const [disposition, setDisposition] = useState<OfficerDisposition>(
    result.officerDecision?.disposition || 'REQUEST_CLARIFICATION'
  );
  const [justification, setJustification] = useState<string>(
    result.officerDecision?.justification || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const primaryEvidence = result.evidence[0];

  const handleSubmitDecision = async () => {
    if (!justification || justification.trim().length < 20) return;
    setIsSubmitting(true);
    setSaveSuccessMsg('');
    try {
      await onSaveDecision(disposition, justification.trim());
      setSaveSuccessMsg('Officer decision recorded & appended to audit chain.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (e: any) {
      alert(e.message || 'Error saving officer decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPass = result.state === 'PASS';
  const isFail = result.state === 'FAIL';
  const isReview = result.state === 'REVIEW';

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#E5DFD9] bg-white shadow-xs overflow-hidden">
      {/* Requirement Header with Prominent Main Title */}
      <div className="p-5 border-b border-[#E5DFD9] bg-[#FBF9F6] space-y-3">
        {/* Code & Category Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-tech px-3 py-1 rounded-md bg-[#124E59]/10 text-[#124E59] font-extrabold border border-[#124E59]/25">
              {requirement.code}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-white border border-[#E5DFD9] text-[#5F6675] font-bold font-mono-tech">
              {requirement.category}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-white border border-[#E5DFD9] text-[#2A2826] font-bold font-mono-tech">
              {requirement.mandatory ? 'Mandatory (Weight: 3)' : 'Optional (Weight: 1)'}
            </span>
          </div>

          <span className="text-xs text-[#5F6675] font-mono-tech font-bold">
            Rule v{requirement.ruleVersion}
          </span>
        </div>

        {/* Big Requirement Title */}
        <h2 className="text-lg sm:text-xl font-black text-[#2A2826] leading-tight">
          {requirement.title}
        </h2>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 border-b border-[#E5DFD9] pt-2">
          {(['DETAILS', 'VALIDATION', 'EVIDENCE', 'ADVISORY'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 text-xs font-bold font-mono-tech transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                activeTab === tab
                  ? 'border-[#124E59] text-[#124E59]'
                  : 'border-transparent text-[#5F6675] hover:text-[#2A2826]'
              }`}
            >
              {tab === 'ADVISORY' ? 'AI Advisory' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* DETAILS TAB */}
        {activeTab === 'DETAILS' && (
          <div className="space-y-4 font-mono-tech">
            {/* System Result Banner with Giant Bold State Unit */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isPass
                  ? 'bg-[#124E59]/5 border-[#124E59]/30'
                  : isFail
                  ? 'bg-[#2A2826]/8 border-[#2A2826]/35'
                  : 'bg-[#B7A08B]/20 border-[#B7A08B]/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`text-2xl font-black px-4 py-2 rounded-xl flex items-center gap-2 ${
                    isPass
                      ? 'bg-[#124E59] text-[#FEFAF7]'
                      : isFail
                      ? 'bg-[#2A2826] text-[#FEFAF7]'
                      : 'bg-[#B7A08B] text-[#FEFAF7]'
                  }`}
                >
                  {isPass && <Check className="w-6 h-6 stroke-[3]" />}
                  {isFail && <XCircle className="w-6 h-6 stroke-[2.5]" />}
                  {isReview && <AlertTriangle className="w-6 h-6 stroke-[2.5]" />}
                  <span>{result.state}</span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-[#2A2826]">
                    {result.reason}
                  </h4>
                  <p className="text-xs text-[#5F6675] font-sans font-medium mt-0.5">
                    Deterministic Rule Check &bull; The officer makes the final disposition.
                  </p>
                </div>
              </div>
            </div>

            {/* Fact Grid: Main Values Displayed Big & Prominently */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Unit 1: Extracted Fact */}
              <div className="p-4 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block">
                  EXTRACTED FACT
                </span>
                <span
                  className={`text-base sm:text-lg font-black block truncate ${
                    isFail ? 'text-[#2A2826]' : 'text-[#124E59]'
                  }`}
                >
                  {primaryEvidence?.extractedValue || 'Not Found in Submission'}
                </span>
                <span className="text-xs text-[#5F6675] font-sans block pt-0.5">
                  Field: <strong>{primaryEvidence?.fieldName || 'Statutory'}</strong>
                </span>
              </div>

              {/* Unit 2: Deterministic Rule */}
              <div className="p-4 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block">
                  DETERMINISTIC RULE
                </span>
                <span className="text-base sm:text-lg font-black text-[#2A2826] block truncate">
                  {requirement.ruleName}
                </span>
                <span className="text-xs text-[#5F6675] font-sans block pt-0.5">
                  Rule Version v{requirement.ruleVersion}
                </span>
              </div>

              {/* Unit 3: Grounding / OCR Clarity */}
              <div className="p-4 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block">
                  GROUNDING VERIFICATION
                </span>
                <span className="text-base sm:text-lg font-black text-[#124E59] block">
                  {primaryEvidence ? `${Math.round(primaryEvidence.confidence * 100)}% Verbatim Match` : 'Unverified'}
                </span>
                <span className="text-xs text-[#5F6675] font-sans block pt-0.5">
                  Verified verbatim against source PDF page coordinates
                </span>
              </div>

              {/* Unit 4: Source Document Link */}
              <div className="p-4 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] space-y-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block">
                    SOURCE DOCUMENT
                  </span>
                  <span className="text-sm font-extrabold text-[#2A2826] block truncate">
                    {primaryEvidence?.documentName || 'No document'}
                  </span>
                </div>
                {primaryEvidence && (
                  <button
                    onClick={() => onSelectEvidence(primaryEvidence)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#124E59] hover:underline font-bold cursor-pointer pt-1"
                  >
                    <span>Jump to Page {primaryEvidence.pageNumber} in Viewer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Simulated External Verification Banner */}
            {result.externalVerification && (
              <SimulatedPortalBanner
                verification={result.externalVerification}
                onOpenSimulator={onOpenPortalSimulator}
              />
            )}

            {/* Officer Decision Box (Matches Panel 07) */}
            <div className="p-5 border border-[#D6CEC5] rounded-2xl bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD9]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#2A2826]">
                  <UserCheck className="w-5 h-5 text-[#124E59]" />
                  <span>Officer Decision (Human Authority)</span>
                </div>
                <span className="text-xs text-[#5F6675] font-sans">
                  Deterministic result remains immutable
                </span>
              </div>

              {result.officerDecision && (
                <div className="p-3 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#124E59]">
                      Recorded: {result.officerDecision.disposition}
                    </span>
                    <span className="text-xs text-[#5F6675]">
                      By {result.officerDecision.decidedBy}
                    </span>
                  </div>
                  <p className="text-[#2A2826] font-medium italic">&ldquo;{result.officerDecision.justification}&rdquo;</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#5F6675] uppercase tracking-wider mb-2">
                  Select Disposition Action
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { value: 'REQUEST_CLARIFICATION', label: 'Request Clarification' },
                    { value: 'ACCEPT_EXCEPTION', label: 'Accept Exception' },
                    { value: 'REJECT', label: 'Reject Requirement' },
                    { value: 'ACCEPT', label: 'Accept as Compliant' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        disposition === opt.value
                          ? 'border-[#124E59] bg-[#124E59]/10 text-[#124E59] font-bold shadow-2xs'
                          : 'border-[#E5DFD9] hover:bg-[#FBF9F6] text-[#2A2826]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="officer_disp"
                        value={opt.value}
                        checked={disposition === opt.value}
                        onChange={() => setDisposition(opt.value as OfficerDisposition)}
                        className="text-[#124E59] focus:ring-0"
                      />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#5F6675] uppercase tracking-wider">
                    Official Justification * (Min 20 Characters)
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      justification.trim().length >= 20 ? 'text-[#124E59]' : 'text-[#5F6675]'
                    }`}
                  >
                    {justification.trim().length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Enter detailed statutory or technical justification for audit trail..."
                  className="w-full p-3 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-sans text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white transition-all"
                />
              </div>

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-[#124E59]/10 text-[#124E59] text-xs font-bold flex items-center gap-2 border border-[#124E59]/25">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSubmitDecision}
                  disabled={isSubmitting || justification.trim().length < 20}
                  className="px-5 py-2.5 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-bold hover:bg-[#0A323A] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : 'Save Decision'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VALIDATION TAB */}
        {activeTab === 'VALIDATION' && (
          <div className="space-y-4 font-mono-tech">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD9]">
              <span className="font-extrabold text-sm text-[#2A2826]">
                Deterministic Validation Checks ({result.validationChecks.length})
              </span>
              <span className="text-xs text-[#5F6675] font-medium">Executed in strict sequence</span>
            </div>

            <div className="space-y-3">
              {result.validationChecks.map((chk, idx) => (
                <div
                  key={chk.id || idx}
                  className="p-4 rounded-xl border border-[#E5DFD9] bg-white space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#2A2826]">{chk.checkCode}</span>
                      <span className="text-xs text-[#5F6675]">via {chk.source}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-extrabold ${
                        chk.result === 'PASS'
                          ? 'bg-[#124E59]/10 text-[#124E59] border border-[#124E59]/30'
                          : chk.result === 'FAIL'
                          ? 'bg-[#2A2826]/10 text-[#2A2826] border border-[#2A2826]/40'
                          : 'bg-[#B7A08B]/25 text-[#3D3730] border border-[#B7A08B]/50'
                      }`}
                    >
                      {chk.result}
                    </span>
                  </div>

                  <p className="text-xs text-[#5F6675] font-sans font-medium">{chk.description}</p>

                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#E5DFD9] text-xs">
                    <div>
                      <span className="text-[#5F6675] text-[11px] uppercase font-bold block">INPUT VALUE:</span>
                      <span className="text-[#2A2826] font-bold block mt-0.5">{chk.inputValue}</span>
                    </div>
                    <div>
                      <span className="text-[#5F6675] text-[11px] uppercase font-bold block">EXPECTED:</span>
                      <span className="text-[#2A2826] font-bold block mt-0.5">{chk.expectedValue}</span>
                    </div>
                  </div>

                  {chk.reason && (
                    <p className="text-xs text-[#2A2826] pt-1.5 font-semibold border-t border-[#E5DFD9]/60">
                      Reason: {chk.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-4 font-mono-tech">
            <p className="text-xs text-[#5F6675] font-medium font-sans">
              Extracted facts and verified bounding box coordinates from submitted bidder pack.
            </p>

            {result.evidence.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-[#E5DFD9] bg-white space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base text-[#124E59]">{ev.fieldName}</span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-[#FBF9F6] border border-[#E5DFD9] text-[#5F6675] font-bold">
                    Page {ev.pageNumber}
                  </span>
                </div>

                <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#E5DFD9] text-xs">
                  <span className="text-[#5F6675] block text-[11px] uppercase font-bold mb-1">SOURCE TEXT IN PDF:</span>
                  <span className="text-[#2A2826] font-medium italic">&ldquo;{ev.sourceText}&rdquo;</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-[#5F6675]">
                  <span>Extraction Method: <strong>{ev.extractionMethod}</strong></span>
                  <button
                    onClick={() => onSelectEvidence(ev)}
                    className="text-[#124E59] hover:underline font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View in Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI ADVISORY TAB (Matches Panel 07) */}
        {activeTab === 'ADVISORY' && (
          <div className="space-y-4 font-mono-tech">
            <div className="p-5 rounded-2xl border border-[#124E59]/35 bg-[#124E59]/5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#124E59]">
                  <Sparkles className="w-5 h-5 text-[#124E59]" />
                  <span>AI Advisory (Read Only)</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-white text-[#124E59] border border-[#124E59]/25 font-extrabold">
                  {result.advisory?.isAiEnhanced ? 'Gemini 2.5 Enhanced' : 'Deterministic Template'}
                </span>
              </div>

              <div className="text-sm font-sans text-[#2A2826] leading-relaxed font-medium">
                {result.advisory?.explanation || (
                  <p>
                    Requirement {requirement.code} was evaluated against statutory rules. Result state:{' '}
                    <strong>{result.state}</strong>.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#124E59]/20 space-y-2">
                <span className="text-xs font-extrabold text-[#124E59] block uppercase tracking-wide">
                  Suggested Next Action
                </span>
                <div className="text-xs font-sans text-[#2A2826] leading-relaxed font-medium">
                  {result.advisory?.suggestedAction || 'Review verification findings and document source.'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2A2826] mb-1">
                <Info className="w-4 h-4 text-[#124E59]" />
                <span>Governance & Boundary Standard</span>
              </div>
              <p className="text-xs font-sans text-[#5F6675] leading-relaxed">
                TenderGuard AI advises and explains only. It does not possess authority to assign PASS, FAIL, or modify compliance scores. The deterministic rule engine verifies facts, and the procurement officer makes the final decision.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

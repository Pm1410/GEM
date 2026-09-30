import React, { useState, useEffect } from 'react';
import { Bid, Tender, OfficerDisposition } from '../types';
import { ScoreRing } from '../components/common/ScoreRing';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { CheckCircle2, ShieldCheck, ArrowLeft, Send, AlertTriangle, FileText, Check, XCircle } from 'lucide-react';

interface ReviewSubmitViewProps {
  bidId: string;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

export const ReviewSubmitView: React.FC<ReviewSubmitViewProps> = ({
  bidId,
  onBack,
  onSubmitSuccess,
}) => {
  const [bid, setBid] = useState<Bid | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [overallDisposition, setOverallDisposition] = useState<OfficerDisposition>('REQUEST_CLARIFICATION');
  const [overallJustification, setOverallJustification] = useState<string>(
    'CIN not found in MCA database. Issued formal clarification notice requesting verified RoC incorporation extract within 5 days.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/bids/${bidId}`)
      .then((res) => res.json())
      .then((data) => {
        setBid(data.bid);
        setTender(data.tender);
      });
  }, [bidId]);

  if (!bid || !tender) {
    return (
      <div className="py-16 text-center text-sm font-mono-tech text-[#5F6675]">
        Loading review summary...
      </div>
    );
  }

  const passedCount = bid.requirementResults.filter((r) => r.state === 'PASS').length;
  const failedCount = bid.requirementResults.filter((r) => r.state === 'FAIL').length;
  const reviewCount = bid.requirementResults.filter((r) => r.state === 'REVIEW').length;
  const unverifiableCount = bid.requirementResults.filter((r) => r.state === 'UNVERIFIABLE').length;

  const handleSubmit = async () => {
    if (!overallJustification || overallJustification.trim().length < 20) {
      alert('A detailed justification of at least 20 characters is required for submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bids/${bid.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposition: overallDisposition,
          justification: overallJustification.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit officer decision');
      }

      setSubmittedSuccess(true);
      setTimeout(() => {
        onSubmitSuccess();
      }, 1500);
    } catch (e: any) {
      alert(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header (Matches Panel 08) */}
      <div className="border-b border-[#E5DFD9] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A2826]">
          Final Verification Review & Submit
        </h1>
        <p className="text-sm text-[#5F6675] font-medium mt-1">
          Review all requirement results before submitting your final decision.
        </p>
      </div>

      {/* Main Review Summary Card (Matches Panel 08) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#E5DFD9] bg-white shadow-xs space-y-6">
        {/* Top Bidder Identity Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5DFD9]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-[#2A2826] tracking-tight">
                {bid.bidder.legalName}
              </h2>
              <RiskBadge level={bid.riskLevel} />
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#FBF9F6] border border-[#E5DFD9] text-[#2A2826]">
                <span className="text-[#5F6675]">GSTIN:</span> <strong>{bid.bidder.gstin}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FBF9F6] border border-[#E5DFD9] text-[#2A2826]">
                <span className="text-[#5F6675]">PAN:</span> <strong>{bid.bidder.pan}</strong>
              </span>
            </div>
          </div>

          <div className="text-xs font-mono-tech text-[#5F6675] text-right">
            <span>Tender {tender.tenderNumber}</span>
            <span className="block font-bold text-[#124E59]">Rule-set v{tender.ruleSetVersion}</span>
          </div>
        </div>

        {/* 5 Big Bold Stat Cards for Rule States */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-tech">
          <div className="p-4 rounded-2xl bg-[#FBF9F6] border border-[#E5DFD9] text-center space-y-1">
            <span className="text-[11px] font-extrabold text-[#5F6675] uppercase block">TOTAL RULES</span>
            <span className="text-3xl font-black text-[#2A2826] block">
              {bid.requirementResults.length}
            </span>
            <span className="text-[11px] text-[#5F6675] block font-sans">Evaluated</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#124E59]/5 border border-[#124E59]/20 text-center space-y-1">
            <span className="text-[11px] font-extrabold text-[#124E59] uppercase block">PASSED</span>
            <span className="text-3xl font-black text-[#124E59] block">
              {passedCount}
            </span>
            <span className="text-[11px] text-[#124E59] block font-sans font-bold">72% Compliant</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#2A2826]/5 border border-[#2A2826]/20 text-center space-y-1">
            <span className="text-[11px] font-extrabold text-[#2A2826] uppercase block">FAILED</span>
            <span className="text-3xl font-black text-[#2A2826] block">
              {failedCount}
            </span>
            <span className="text-[11px] text-[#2A2826] block font-sans font-bold">CIN & Return</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#B7A08B]/20 border border-[#B7A08B]/50 text-center space-y-1">
            <span className="text-[11px] font-extrabold text-[#8A6D56] uppercase block">REVIEW</span>
            <span className="text-3xl font-black text-[#2A2826] block">
              {reviewCount}
            </span>
            <span className="text-[11px] text-[#5F6675] block font-sans">Low OCR Stamp</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#5F6675]/10 border border-[#5F6675]/30 text-center space-y-1">
            <span className="text-[11px] font-extrabold text-[#5F6675] uppercase block">UNVERIFIED</span>
            <span className="text-3xl font-black text-[#5F6675] block">
              {unverifiableCount}
            </span>
            <span className="text-[11px] text-[#5F6675] block font-sans">Portal Timeout</span>
          </div>
        </div>

        {/* Center: Compliance Donut & Breakdown Rows */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-3">
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#FBF9F6] rounded-2xl border border-[#E5DFD9]">
            <span className="text-xs font-bold text-[#2A2826] uppercase font-mono-tech mb-3">
              Overall Compliance Rating
            </span>
            <ScoreRing score={bid.complianceScore} size={130} strokeWidth={11} />
          </div>

          <div className="md:col-span-7 space-y-2.5 font-mono-tech text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
              <span className="text-[#124E59] font-extrabold text-sm">&bull; Pass Rate (13 Rules)</span>
              <span className="font-black text-[#124E59] text-base">72%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
              <span className="text-[#2A2826] font-extrabold text-sm">&bull; Fail Breaches (2 Rules)</span>
              <span className="font-black text-[#2A2826] text-base">11%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
              <span className="text-[#8A6D56] font-extrabold text-sm">&bull; Under Review (2 Rules)</span>
              <span className="font-black text-[#2A2826] text-base">11%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
              <span className="text-[#5F6675] font-extrabold text-sm">&bull; Unverifiable (1 Rule)</span>
              <span className="font-black text-[#5F6675] text-base">6%</span>
            </div>
          </div>
        </div>

        {/* Officer Disposition Form */}
        <div className="p-6 rounded-2xl border border-[#D6CEC5] bg-white shadow-xs space-y-4 font-mono-tech text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD9]">
            <span className="font-extrabold text-sm text-[#2A2826]">Officer Final Disposition</span>
            <span className="text-xs text-[#5F6675]">Signed with official cryptographic credentials</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5F6675] uppercase tracking-wider mb-2">
              SELECT DISPOSITION ACTION
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { id: 'REQUEST_CLARIFICATION', label: 'Request Clarification' },
                { id: 'ACCEPT_EXCEPTION', label: 'Accept Exception' },
                { id: 'REJECT', label: 'Reject Bid' },
                { id: 'ACCEPT', label: 'Accept as Compliant' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOverallDisposition(opt.id as any)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    overallDisposition === opt.id
                      ? 'border-[#124E59] bg-[#124E59]/10 text-[#124E59] font-bold shadow-2xs'
                      : 'border-[#E5DFD9] bg-[#FBF9F6] text-[#2A2826] hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#5F6675] uppercase tracking-wider">
                OFFICIAL JUSTIFICATION (MINIMUM 20 CHARACTERS) *
              </label>
              <span
                className={`text-xs font-bold ${
                  overallJustification.trim().length >= 20 ? 'text-[#124E59]' : 'text-[#5F6675]'
                }`}
              >
                {overallJustification.trim().length}/500
              </span>
            </div>
            <textarea
              rows={3}
              value={overallJustification}
              onChange={(e) => setOverallJustification(e.target.value)}
              className="w-full p-3.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-sans text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white transition-all"
              placeholder="Enter official justification for committee records and audit trail..."
            />
          </div>

          {submittedSuccess && (
            <div className="p-4 rounded-xl bg-[#124E59]/10 border border-[#124E59]/30 text-[#124E59] flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-extrabold text-xs">
                Decision successfully recorded and signed into SHA-256 audit ledger! Redirecting to Audit Trail...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav Actions (Matches Panel 08) */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E5DFD9] bg-white text-xs font-mono-tech font-bold text-[#2A2826] hover:bg-[#F4EFEB] transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || overallJustification.trim().length < 20}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-mono-tech font-bold hover:bg-[#0A323A] transition-all disabled:opacity-40 cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Submitting & Signing...' : 'Submit Decision'}</span>
        </button>
      </div>
    </div>
  );
};

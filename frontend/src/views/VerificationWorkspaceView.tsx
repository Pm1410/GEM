import React, { useState, useEffect } from 'react';
import { Bid, Tender, RequirementResult, EvidenceItem, OfficerDisposition } from '../types';
import { RequirementNavigator } from '../components/verification/RequirementNavigator';
import { VerificationDetailPane } from '../components/verification/VerificationDetailPane';
import { DocumentEvidenceViewer } from '../components/evidence/DocumentEvidenceViewer';
import { ManualEvidenceModal } from '../components/evidence/ManualEvidenceModal';
import { RefreshCw, CheckCircle, ArrowRight, ShieldCheck, Building2, Hash, FileCheck } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

interface VerificationWorkspaceViewProps {
  bidId: string;
  onNavigateReview: (bidId: string) => void;
  onOpenPortalSimulator: () => void;
}

export const VerificationWorkspaceView: React.FC<VerificationWorkspaceViewProps> = ({
  bidId,
  onNavigateReview,
  onOpenPortalSimulator,
}) => {
  const [bid, setBid] = useState<Bid | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [selectedReqId, setSelectedReqId] = useState<string>('req-03'); // Default to CIN_001 (Panel 06)
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | undefined>(undefined);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isReVerifying, setIsReVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBidDetails = async () => {
    try {
      const res = await fetch(`/api/bids/${bidId}`);
      const data = await res.json();
      setBid(data.bid);
      setTender(data.tender);

      // Auto-select evidence for default requirement
      const currentReq = data.tender?.requirements?.find((r: any) => r.id === selectedReqId);
      const currentRes = data.bid?.requirementResults?.find((r: any) => r.requirementId === selectedReqId);
      if (currentRes && currentRes.evidence.length > 0) {
        setSelectedEvidence(currentRes.evidence[0]);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidDetails();
  }, [bidId]);

  const handleSelectRequirement = (reqId: string) => {
    setSelectedReqId(reqId);
    if (!bid) return;
    const res = bid.requirementResults.find((r) => r.requirementId === reqId);
    if (res && res.evidence.length > 0) {
      setSelectedEvidence(res.evidence[0]);
    } else {
      setSelectedEvidence(undefined);
    }
  };

  const handleReVerify = async () => {
    setIsReVerifying(true);
    try {
      await fetch(`/api/bids/${bidId}/verify`, { method: 'POST' });
      await fetchBidDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReVerifying(false);
    }
  };

  const handleSaveDecision = async (
    disposition: OfficerDisposition,
    justification: string
  ) => {
    const res = await fetch(`/api/bids/${bidId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirementId: selectedReqId,
        disposition,
        justification,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save officer decision');
    }
    await fetchBidDetails();
  };

  const handleManualMapSave = async (newEv: Partial<EvidenceItem>) => {
    if (!bid) return;
    const currentRes = bid.requirementResults.find((r) => r.requirementId === selectedReqId);
    if (currentRes) {
      const updatedEv: EvidenceItem = {
        id: `ev-manual-${Date.now()}`,
        documentId: selectedEvidence?.documentId || 'doc-manual',
        documentName: selectedEvidence?.documentName || 'Document.pdf',
        pageNumber: newEv.pageNumber || 1,
        boundingBox: newEv.boundingBox || { x: 20, y: 30, width: 50, height: 10 },
        sourceText: newEv.sourceText || '',
        fieldName: newEv.fieldName || 'FIELD',
        extractedValue: newEv.extractedValue || '',
        extractionMethod: 'OFFICER_CORRECTED',
        confidence: 1.0,
        sha256: 'manual-verified-sha',
        grounded: true,
      };
      currentRes.evidence = [updatedEv];
      setSelectedEvidence(updatedEv);
    }
    // Re-verify with updated evidence
    await handleReVerify();
  };

  if (loading || !bid || !tender) {
    return (
      <div className="py-16 text-center text-sm font-mono-tech text-[#5F6675]">
        Initializing 3-pane verification workspace...
      </div>
    );
  }

  const activeRequirement = tender.requirements.find((r) => r.id === selectedReqId) || tender.requirements[0];
  const activeResult =
    bid.requirementResults.find((r) => r.requirementId === activeRequirement.id) ||
    bid.requirementResults[0];

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-130px)]">
      {/* Top Context & Action Bar with Clear Visual Units */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Main Bidder Identity Unit */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-[#2A2826] tracking-tight">
              {bid.bidder.legalName}
            </h1>
            <RiskBadge level={bid.riskLevel} />
          </div>

          {/* Related Identifiers as distinct, readable chips */}
          <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#FBF9F6] border border-[#E5DFD9] text-[#2A2826]">
              <span className="text-[#5F6675] font-semibold">GSTIN:</span> <strong>{bid.bidder.gstin}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FBF9F6] border border-[#E5DFD9] text-[#2A2826]">
              <span className="text-[#5F6675] font-semibold">PAN:</span> <strong>{bid.bidder.pan}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#124E59]/10 border border-[#124E59]/25 text-[#124E59] font-bold">
              {tender.tenderNumber} (v{tender.currentVersion})
            </span>
          </div>
        </div>

        {/* Right: Score Stat Box + Primary Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Main Stat Unit: Compliance Score */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block font-mono-tech">
                COMPLIANCE SCORE
              </span>
              <span className="text-2xl font-black text-[#124E59] font-mono-tech leading-tight block">
                {bid.complianceScore}%
              </span>
            </div>
            <div className="w-12 h-1.5 bg-[#E5DFD9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#124E59] rounded-full"
                style={{ width: `${bid.complianceScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReVerify}
              disabled={isReVerifying}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5DFD9] bg-white text-xs font-mono-tech font-bold text-[#2A2826] hover:bg-[#F4EFEB] transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#124E59] ${isReVerifying ? 'animate-spin' : ''}`} />
              <span>{isReVerifying ? 'Re-running Rules...' : 'Re-verify Engine'}</span>
            </button>

            <button
              onClick={() => onNavigateReview(bid.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-mono-tech font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-sm"
            >
              <span>Final Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-PANE PERSISTENT WORKSPACE CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        {/* Pane 1: Requirements Navigator (col-span-3) */}
        <div className="lg:col-span-3 h-full overflow-hidden">
          <RequirementNavigator
            requirements={tender.requirements}
            results={bid.requirementResults}
            selectedReqId={selectedReqId}
            onSelectRequirement={handleSelectRequirement}
          />
        </div>

        {/* Pane 2: Verification Details & Advisory / Officer Decision (col-span-4) */}
        <div className="lg:col-span-4 h-full overflow-hidden">
          {activeRequirement && activeResult && (
            <VerificationDetailPane
              requirement={activeRequirement}
              result={activeResult}
              onSaveDecision={handleSaveDecision}
              onSelectEvidence={(ev) => setSelectedEvidence(ev)}
              onOpenPortalSimulator={onOpenPortalSimulator}
            />
          )}
        </div>

        {/* Pane 3: Document Evidence Viewer with Bounding Box Overlay (col-span-5) */}
        <div className="lg:col-span-5 h-full overflow-hidden">
          <DocumentEvidenceViewer
            documents={bid.documents}
            selectedEvidence={selectedEvidence}
            currentDocumentId={selectedEvidence?.documentId}
            onManualMap={() => setIsManualModalOpen(true)}
          />
        </div>
      </div>

      {/* Manual Evidence Mapping Modal */}
      {isManualModalOpen && (
        <ManualEvidenceModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          document={bid.documents[0]}
          currentEvidence={selectedEvidence}
          onSaveMapping={handleManualMapSave}
        />
      )}
    </div>
  );
};

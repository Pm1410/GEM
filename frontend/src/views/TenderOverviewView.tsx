import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Clock,
  Layers,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import { Tender, Requirement } from '../types';
import { ScoreRing } from '../components/common/ScoreRing';
import { RiskBadge } from '../components/common/RiskBadge';

interface TenderOverviewViewProps {
  tenderId: string;
  onNavigateBidders: (tenderId: string) => void;
  onNavigateVerification: (bidId: string) => void;
  onNavigateAudit: () => void;
}

export const TenderOverviewView: React.FC<TenderOverviewViewProps> = ({
  tenderId,
  onNavigateBidders,
  onNavigateVerification,
  onNavigateAudit,
}) => {
  const [tender, setTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REQUIREMENTS' | 'BIDS' | 'AUDIT'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    fetch(`/api/tenders/${tenderId}`)
      .then((res) => res.json())
      .then((data) => {
        setTender(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tenderId]);

  if (loading || !tender) {
    return (
      <div className="py-16 text-center text-sm font-mono-tech text-[#5F6675]">
        Loading tender overview...
      </div>
    );
  }

  const handleCopyRef = () => {
    navigator.clipboard.writeText(tender.tenderNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP IDENTITY & STATUS HEADER (Prominent Hero Typography) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#E5DFD9] bg-white shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono-tech px-3 py-1 rounded-md bg-[#124E59]/10 text-[#124E59] font-extrabold border border-[#124E59]/25">
                {tender.tenderNumber}
              </span>
              <span className="text-xs font-mono-tech px-3 py-1 rounded-md bg-[#124E59] text-[#FEFAF7] font-bold">
                TECHNICAL VERIFICATION IN PROGRESS
              </span>
              <span className="text-xs font-mono-tech px-2.5 py-1 rounded-md bg-[#FBF9F6] border border-[#E5DFD9] text-[#5F6675]">
                SIH Problem Statement 26100
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#2A2826] leading-tight">
              {tender.title}
            </h1>
            <p className="text-sm sm:text-base text-[#5F6675] font-medium">
              {tender.department} &bull; {tender.organisation}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateBidders(tender.id)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-mono-tech font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-sm"
            >
              <span>Inspect Bidders Queue ({tender.totalBidders})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. DEDICATED METADATA SHELF (Clearly Separated Panel with Distinct Subtle Typography) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F6] border border-[#E5DFD9] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-tech">
          {/* Metadata Item 1: Tender Ref */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5F6675] tracking-wider block">
              TENDER REFERENCE
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#2A2826]">{tender.tenderNumber}</span>
              <button
                onClick={handleCopyRef}
                className="p-1 rounded text-[#5F6675] hover:text-[#124E59] cursor-pointer"
                title="Copy Reference Number"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-[#124E59]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[11px] text-[#5F6675] block">GeM Order: GEM/2025/B/0012984</span>
          </div>

          {/* Metadata Item 2: Procuring Entity */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5F6675] tracking-wider block">
              PROCURING AUTHORITY
            </span>
            <span className="text-sm font-extrabold text-[#2A2826] block">CPCL Headquarters</span>
            <span className="text-[11px] text-[#5F6675] block">Ministry of Petroleum & Natural Gas</span>
          </div>

          {/* Metadata Item 3: Timeline & Dates */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5F6675] tracking-wider block">
              OFFICIAL TIMELINE
            </span>
            <span className="text-sm font-extrabold text-[#2A2826] block">{tender.openingDate}</span>
            <span className="text-[11px] text-[#124E59] font-bold block">Closing on {tender.closingDate} (16 days left)</span>
          </div>

          {/* Metadata Item 4: Rule Set Spec */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5F6675] tracking-wider block">
              GOVERNANCE STANDARD
            </span>
            <span className="text-sm font-extrabold text-[#124E59] block">Rule-set v{tender.ruleSetVersion}</span>
            <span className="text-[11px] text-[#5F6675] block">Deterministic Engine (Frozen)</span>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED SUMMARY DATA PANELS (Hero Metrics Strip with Large Typographic Weights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verification Progress Panel */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block font-mono-tech">
              VERIFICATION PROGRESS
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#124E59] font-mono-tech block mt-1">
              71%
            </span>
            <span className="text-xs text-[#5F6675] block pt-1 font-medium font-mono-tech">
              31 of 45 Bids Verified
            </span>
          </div>
          <ScoreRing score={71} size={70} strokeWidth={7} showSubtitle={false} />
        </div>

        {/* Configured Rules Panel */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block font-mono-tech">
            CONFIGURED RULES
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#124E59] font-mono-tech block mt-1">
            18
          </span>
          <span className="text-xs text-[#124E59] block pt-1 font-bold font-mono-tech">
            14 Mandatory &bull; 4 Optional
          </span>
        </div>

        {/* Total Submissions Panel */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block font-mono-tech">
            TOTAL SUBMITTED BIDS
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#2A2826] font-mono-tech block mt-1">
            {tender.totalBidders || 12}
          </span>
          <span className="text-xs text-[#2A2826] block pt-1 font-bold font-mono-tech">
            Active Scrutiny & Verification
          </span>
        </div>

        {/* Turnaround Velocity Panel */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block font-mono-tech">
            VERIFICATION VELOCITY
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#2A2826] font-mono-tech block mt-1">
            38s
          </span>
          <span className="text-xs text-[#5F6675] block pt-1 font-medium font-mono-tech">
            Average per 18-rule pack
          </span>
        </div>
      </div>

      {/* Tabs Row (Matches Panel 04) */}
      <div className="flex items-center gap-2 border-b border-[#E5DFD9] pb-3 text-xs font-mono-tech">
        {(['OVERVIEW', 'REQUIREMENTS', 'BIDS', 'AUDIT'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'BIDS') {
                onNavigateBidders(tender.id);
              } else if (tab === 'AUDIT') {
                onNavigateAudit();
              } else {
                setActiveTab(tab);
              }
            }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold ${
              activeTab === tab
                ? 'bg-[#124E59] text-[#FEFAF7] shadow-xs'
                : 'text-[#5F6675] hover:bg-white hover:text-[#2A2826]'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* 4. OVERVIEW TAB CONTENT WITH WELL-SPACED DATA PANELS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Attention-Required Bidders Quick-Action Panel */}
          <div className="p-6 rounded-2xl border border-[#2A2826]/30 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9]">
              <div>
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#2A2826] uppercase font-mono-tech">
                  <ShieldAlert className="w-4.5 h-4.5 text-[#2A2826]" />
                  <span>Immediate Officer Attention Required (3 Priority Bids)</span>
                </div>
                <p className="text-xs text-[#5F6675] mt-0.5">
                  Deterministic engine identified statutory breaches or missing credentials requiring officer disposition.
                </p>
              </div>

              <button
                onClick={() => onNavigateBidders(tender.id)}
                className="text-xs font-bold font-mono-tech text-[#124E59] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Bidders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-tech text-xs">
              {/* Card 1: ABC Infra */}
              <div
                onClick={() => onNavigateVerification('BID-001')}
                className="p-4 rounded-xl border border-[#2A2826]/20 bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-[#2A2826] text-sm">ABC Infra Solutions</span>
                    <RiskBadge level="HIGH" size="sm" />
                  </div>
                  <span className="text-[11px] text-[#5F6675] block">Ref: BID-001 &bull; Score: 72%</span>
                  <div className="p-2.5 rounded-lg bg-[#2A2826]/5 border border-[#2A2826]/15 mt-2">
                    <span className="font-bold text-[#2A2826] text-[11px] block">FAIL: CIN NOT IN MCA</span>
                    <p className="text-[11px] text-[#5F6675] mt-0.5">Overdue monthly GSTR-3B filings</p>
                  </div>
                </div>
                <span className="text-xs text-[#124E59] font-extrabold flex items-center gap-1 pt-1">
                  <span>Start Verification</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Card 2: Delta Constructions */}
              <div
                onClick={() => onNavigateVerification('BID-005')}
                className="p-4 rounded-xl border border-[#2A2826]/20 bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-[#2A2826] text-sm">Delta Constructions</span>
                    <RiskBadge level="HIGH" size="sm" />
                  </div>
                  <span className="text-[11px] text-[#5F6675] block">Ref: BID-005 &bull; Score: 41%</span>
                  <div className="p-2.5 rounded-lg bg-[#2A2826]/5 border border-[#2A2826]/15 mt-2">
                    <span className="font-bold text-[#2A2826] text-[11px] block">FAIL: DEBARMENT MATCH</span>
                    <p className="text-[11px] text-[#5F6675] mt-0.5">Active blacklisting under GFR 151</p>
                  </div>
                </div>
                <span className="text-xs text-[#124E59] font-extrabold flex items-center gap-1 pt-1">
                  <span>Start Verification</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Card 3: Premier Engineering */}
              <div
                onClick={() => onNavigateVerification('BID-006')}
                className="p-4 rounded-xl border border-[#2A2826]/20 bg-[#FBF9F6] hover:bg-white hover:border-[#124E59] transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-[#2A2826] text-sm">Premier Engineering</span>
                    <RiskBadge level="HIGH" size="sm" />
                  </div>
                  <span className="text-[11px] text-[#5F6675] block">Ref: BID-006 &bull; Score: 64%</span>
                  <div className="p-2.5 rounded-lg bg-[#2A2826]/5 border border-[#2A2826]/15 mt-2">
                    <span className="font-bold text-[#2A2826] text-[11px] block">FAIL: GSTIN CHECKSUM</span>
                    <p className="text-[11px] text-[#5F6675] mt-0.5">PAN structural discrepancy</p>
                  </div>
                </div>
                <span className="text-xs text-[#124E59] font-extrabold flex items-center gap-1 pt-1">
                  <span>Start Verification</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Tender Scope and Specifications Panel */}
          <div className="p-6 sm:p-8 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-[#2A2826]">
              Tender Specifications & Scope of Work
            </h3>
            <p className="text-sm text-[#2A2826] leading-relaxed font-normal">
              {tender.description}
            </p>

            <div className="pt-4 border-t border-[#E5DFD9] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-tech">
              <div className="p-4 bg-[#FBF9F6] rounded-xl border border-[#E5DFD9] space-y-1">
                <span className="text-[11px] uppercase font-bold text-[#5F6675] block">CONTRACTING AUTHORITY</span>
                <span className="text-sm font-bold text-[#2A2826] block">Chennai Petroleum Corporation Limited</span>
                <span className="text-[11px] text-[#5F6675] block">MoPNG Public Enterprise</span>
              </div>
              <div className="p-4 bg-[#FBF9F6] rounded-xl border border-[#E5DFD9] space-y-1">
                <span className="text-[11px] uppercase font-bold text-[#5F6675] block">GeM PORTAL REFERENCE</span>
                <span className="text-sm font-bold text-[#2A2826] block">GEM/2025/B/0012984</span>
                <span className="text-[11px] text-[#5F6675] block">Official Central e-Procurement</span>
              </div>
              <div className="p-4 bg-[#FBF9F6] rounded-xl border border-[#E5DFD9] space-y-1">
                <span className="text-[11px] uppercase font-bold text-[#5F6675] block">CRYPTOGRAPHIC AUDIT LEDGER</span>
                <button
                  onClick={onNavigateAudit}
                  className="text-xs text-[#124E59] font-extrabold hover:underline block pt-0.5 cursor-pointer"
                >
                  Verify SHA-256 Ledger Chain &rarr;
                </button>
                <span className="text-[11px] text-[#5F6675] block">Genesis block connected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. REQUIREMENTS TAB CONTENT */}
      {activeTab === 'REQUIREMENTS' && (
        <div className="rounded-2xl border border-[#E5DFD9] bg-white shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FBF9F6] border-b border-[#E5DFD9] flex items-center justify-between text-xs font-mono-tech">
            <span className="font-extrabold text-sm text-[#2A2826]">
              Configured Verification Rules ({tender.requirements.length})
            </span>
            <span className="text-xs text-[#124E59] font-bold">Rule-set Version 1.3</span>
          </div>

          <table className="w-full text-left text-xs font-mono-tech">
            <thead>
              <tr className="border-b border-[#E5DFD9] bg-[#FBF9F6] text-[#5F6675] text-[11px] font-extrabold uppercase">
                <th className="py-3.5 px-5 w-12">#</th>
                <th className="py-3.5 px-5">Rule Code</th>
                <th className="py-3.5 px-5">Requirement & Statutory Criteria</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Weight</th>
                <th className="py-3.5 px-5">Required Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD9]">
              {tender.requirements.map((req, idx) => (
                <tr key={req.id} className="hover:bg-[#FBF9F6] transition-colors">
                  <td className="py-3.5 px-5 text-[#5F6675] font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-5">
                    <span className="font-extrabold text-[#124E59] block">{req.code}</span>
                    <span className="text-[11px] text-[#5F6675]">{req.ruleName}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-sm text-[#2A2826] block font-sans">{req.title}</span>
                    <span className="text-xs text-[#5F6675] font-sans mt-0.5 block">{req.description}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-1 rounded-md bg-[#FBF9F6] border border-[#E5DFD9] text-xs font-bold text-[#2A2826]">
                      {req.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-[#2A2826]">
                    {req.mandatory ? 'Mandatory (3)' : 'Optional (1)'}
                  </td>
                  <td className="py-3.5 px-5 text-[#5F6675] text-xs">
                    {req.evidenceRequired.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Printer,
  Table,
  ExternalLink,
  Layers,
  FileCheck,
} from 'lucide-react';
import { ScoreRing } from '../components/common/ScoreRing';
import { RiskBadge } from '../components/common/RiskBadge';

interface ReportsViewProps {
  onNavigateVerification: (bidId: string) => void;
  onNavigateAudit: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onNavigateVerification,
  onNavigateAudit,
}) => {
  const [selectedTender, setSelectedTender] = useState('GEM/2025/0012');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const bidderMatrix = [
    {
      id: 'BID-001',
      bidder: 'ABC Infra Solutions',
      gstin: '22AAAAA0000A1Z5',
      score: 72,
      risk: 'HIGH' as const,
      statutory: 'FAIL (CIN & GST Return)',
      financial: 'PASS (Rs 42 Cr Turnover)',
      technical: 'PASS (Compliant Experience)',
      decision: 'REQUEST_CLARIFICATION',
      officerNote: 'CIN not found in MCA. Clarification notice issued.',
    },
    {
      id: 'BID-002',
      bidder: 'Shree Tech Pvt Ltd',
      gstin: '27BBBBB1111B2Z7',
      score: 98,
      risk: 'LOW' as const,
      statutory: 'PASS (All Active)',
      financial: 'PASS (Rs 68 Cr Turnover)',
      technical: 'PASS (Tier-1 OEM)',
      decision: 'ACCEPT',
      officerNote: 'Fully compliant on all 18 tender requirements.',
    },
    {
      id: 'BID-003',
      bidder: 'National BuildCorp',
      gstin: '29CCCCC2222C3Z9',
      score: 92,
      risk: 'LOW' as const,
      statutory: 'PASS (Active)',
      financial: 'PASS (Rs 55 Cr Turnover)',
      technical: 'REVIEW (OEM stamp)',
      decision: 'ACCEPT_EXCEPTION',
      officerNote: 'OEM certificate validated via direct email confirmation.',
    },
    {
      id: 'BID-004',
      bidder: 'Omkar Enterprises',
      gstin: '24DDDDD3333D4Z9',
      score: 84,
      risk: 'MEDIUM' as const,
      statutory: 'UNVERIFIABLE (EPFO)',
      financial: 'PASS (Rs 38 Cr Turnover)',
      technical: 'PASS',
      decision: 'REQUEST_CLARIFICATION',
      officerNote: 'EPFO portal offline; offline challan verification requested.',
    },
    {
      id: 'BID-005',
      bidder: 'Delta Constructions',
      gstin: '07EEEEE4444E5Z0',
      score: 41,
      risk: 'HIGH' as const,
      statutory: 'FAIL (Debarred)',
      financial: 'FAIL (Deficit net worth)',
      technical: 'FAIL',
      decision: 'REJECT',
      officerNote: 'Disqualified pursuant to GFR 2017 Rule 151 (Debarment).',
    },
    {
      id: 'BID-006',
      bidder: 'Premier Engineering Works',
      gstin: '33FFFFF5555F6Z2',
      score: 64,
      risk: 'HIGH' as const,
      statutory: 'FAIL (PAN Checksum Mismatch)',
      financial: 'PASS (Rs 45 Cr Turnover)',
      technical: 'PASS',
      decision: 'REJECT',
      officerNote: 'Non-matching PAN in GSTIN structure.',
    },
  ];

  const handleExport = (type: string) => {
    setDownloadSuccess(`Generated ${type} package for Tender GEM/2025/0012`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD9]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A2826]">
            Statutory Evaluation Reports & Bidder Matrix
          </h1>
          <p className="text-sm text-[#5F6675] font-medium mt-1">
            Comparative evaluation sheets and committee review records under GFR 2017
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono-tech text-xs">
          <button
            onClick={() => handleExport('CSV / Excel Matrix')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD9] text-[#2A2826] font-bold hover:bg-[#F4EFEB] transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#124E59]" />
            <span>Export Matrix</span>
          </button>

          <button
            onClick={() => handleExport('Cryptographic Audit Package (ZIP)')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Download Audit Package</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-[#124E59]/10 text-[#124E59] font-mono-tech text-xs font-bold flex items-center gap-2 border border-[#124E59]/25 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Tender Header Context Card */}
      <div className="p-6 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD9]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech px-2.5 py-0.5 rounded-md bg-[#124E59]/10 text-[#124E59] font-bold">
                Tender Ref: GEM/2025/0012
              </span>
              <span className="text-xs text-[#5F6675] font-mono-tech">Rule-set v1.3</span>
            </div>
            <h2 className="text-xl font-black text-[#2A2826]">
              Construction of Office Building - CPCL Headquarters
            </h2>
            <p className="text-xs text-[#5F6675] font-mono-tech mt-0.5">
              Chennai Petroleum Corporation Limited &bull; Ministry of Petroleum & Natural Gas
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono-tech">
            <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#E5DFD9] text-center">
              <span className="text-[11px] text-[#5F6675] uppercase font-bold block">TOTAL BIDS</span>
              <span className="text-xl font-black text-[#2A2826]">45</span>
            </div>
            <div className="p-3 bg-[#124E59]/5 rounded-xl border border-[#124E59]/20 text-center">
              <span className="text-[11px] text-[#124E59] uppercase font-bold block">COMPLIANT</span>
              <span className="text-xl font-black text-[#124E59]">31</span>
            </div>
            <div className="p-3 bg-[#2A2826]/5 rounded-xl border border-[#2A2826]/20 text-center">
              <span className="text-[11px] text-[#2A2826] uppercase font-bold block">FLAGGED</span>
              <span className="text-xl font-black text-[#2A2826]">6</span>
            </div>
          </div>
        </div>

        {/* Full Bidder Evaluation Matrix Table (Phase 11 Requirement) */}
        <div>
          <h3 className="text-sm font-extrabold text-[#2A2826] uppercase font-mono-tech tracking-wider mb-3">
            Technical Comparative Statement (Bidder Matrix)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-[#E5DFD9]">
            <table className="w-full text-left text-xs font-mono-tech border-collapse">
              <thead>
                <tr className="border-b border-[#E5DFD9] bg-[#FBF9F6] text-[#5F6675] text-[11px] uppercase font-extrabold">
                  <th className="py-3 px-4">Bidder Entity</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Statutory Criteria</th>
                  <th className="py-3 px-4">Financial Turnover</th>
                  <th className="py-3 px-4">Technical OEM</th>
                  <th className="py-3 px-4">Officer Disposition</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD9]">
                {bidderMatrix.map((bm) => (
                  <tr key={bm.id} className="hover:bg-[#FBF9F6] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-sm text-[#2A2826] block font-sans">
                        {bm.bidder}
                      </span>
                      <span className="text-[11px] text-[#5F6675]">GSTIN: {bm.gstin}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm text-[#2A2826]">
                      {bm.score}%
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={bm.risk} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#2A2826]">
                      {bm.statutory}
                    </td>
                    <td className="py-3.5 px-4 text-[#5F6675]">
                      {bm.financial}
                    </td>
                    <td className="py-3.5 px-4 text-[#5F6675]">
                      {bm.technical}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#124E59]/10 text-[#124E59] font-bold text-[11px]">
                        {bm.decision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigateVerification(bm.id)}
                        className="text-xs text-[#124E59] hover:underline font-extrabold cursor-pointer"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Exceptions and Clarifications Register */}
      <div className="p-6 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-3 font-mono-tech text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD9]">
          <h3 className="text-sm font-extrabold text-[#2A2826] uppercase tracking-wider">
            Exceptions & Clarifications Summary Register
          </h3>
          <span className="text-xs text-[#5F6675]">GFR 2017 Audit Compliance</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {bidderMatrix
            .filter((b) => b.decision !== 'ACCEPT')
            .map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#E5DFD9] bg-[#FBF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#2A2826] font-sans">
                      {item.bidder}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white border border-[#E5DFD9] text-[#124E59] font-bold">
                      {item.decision}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6675] font-sans mt-0.5">
                    Justification: &ldquo;{item.officerNote}&rdquo;
                  </p>
                </div>

                <button
                  onClick={() => onNavigateVerification(item.id)}
                  className="text-xs text-[#124E59] font-bold hover:underline shrink-0 cursor-pointer"
                >
                  View Details &rarr;
                </button>
              </div>
            ))}
        </div>

        <div className="pt-3 border-t border-[#E5DFD9] flex items-center justify-between text-xs text-[#5F6675]">
          <span>Cryptographic Hash Link: SHA-256 Chained Integrity Verified</span>
          <button
            onClick={onNavigateAudit}
            className="text-[#124E59] font-bold hover:underline cursor-pointer"
          >
            Inspect Immutable Ledger &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

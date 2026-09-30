import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Building2,
  Calendar,
  Hash,
  MapPin,
  FileCheck,
  AlertTriangle,
  LayoutGrid,
  List,
  Sparkles,
  Clock,
  FileText,
  Shield,
  Check,
  Globe,
  Server,
  Layers,
} from 'lucide-react';
import { Bid } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';

interface BiddersViewProps {
  tenderId?: string;
  onSelectBid: (bidId: string) => void;
}

export const BiddersView: React.FC<BiddersViewProps> = ({
  tenderId = 'TND-GEM-2025-0012',
  onSelectBid,
}) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'NEEDS_ATTENTION' | 'IN_REVIEW' | 'VERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'PANELS' | 'TABLE'>('PANELS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tenders/${tenderId}/bidders`)
      .then((res) => res.json())
      .then((data) => {
        setBids(data.bids || []);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [tenderId]);

  const filtered = bids.filter((b) => {
    if (filterTab === 'NEEDS_ATTENTION' && b.status !== 'NEEDS_ATTENTION') return false;
    if (filterTab === 'IN_REVIEW' && b.status !== 'IN_VERIFICATION') return false;
    if (filterTab === 'VERIFIED' && b.status !== 'VERIFIED' && b.status !== 'REVIEWED') return false;
    if (
      searchQuery &&
      !b.bidder.legalName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !b.bidder.gstin.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !b.bidder.pan.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !b.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const needsAttentionCount = bids.filter((b) => b.status === 'NEEDS_ATTENTION').length;
  const inReviewCount = bids.filter((b) => b.status === 'IN_VERIFICATION').length;
  const verifiedCount = bids.filter((b) => b.status === 'VERIFIED' || b.status === 'REVIEWED').length;

  // Helper to extract external portal gateway statuses for secondary metadata
  const getBidderPortalStatuses = (bidId: string) => {
    switch (bidId) {
      case 'BID-001':
        return [
          { portal: 'GSTN', status: 'FAIL', detail: 'Overdue Returns' },
          { portal: 'MCA21', status: 'FAIL', detail: 'Record Missing' },
          { portal: 'EPFO', status: 'TIMEOUT', detail: 'Gateway 5000ms' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
      case 'BID-002':
        return [
          { portal: 'GSTN', status: 'PASS', detail: 'Active' },
          { portal: 'MCA21', status: 'PASS', detail: 'Active' },
          { portal: 'EPFO', status: 'PASS', detail: 'Active' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
      case 'BID-003':
        return [
          { portal: 'GSTN', status: 'PASS', detail: 'Active' },
          { portal: 'MCA21', status: 'PASS', detail: 'Active' },
          { portal: 'EPFO', status: 'PASS', detail: 'Active' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
      case 'BID-004':
        return [
          { portal: 'GSTN', status: 'PASS', detail: 'Active' },
          { portal: 'MCA21', status: 'PASS', detail: 'Active' },
          { portal: 'EPFO', status: 'TIMEOUT', detail: 'Gateway 5000ms' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
      case 'BID-005':
        return [
          { portal: 'GSTN', status: 'PASS', detail: 'Active' },
          { portal: 'MCA21', status: 'PASS', detail: 'Active' },
          { portal: 'DEBARMENT', status: 'FAIL', detail: 'Blacklisted GFR 151' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
      case 'BID-006':
        return [
          { portal: 'GSTN', status: 'FAIL', detail: 'Mod-36 Checksum Mismatch' },
          { portal: 'MCA21', status: 'PASS', detail: 'Active' },
          { portal: 'EPFO', status: 'PASS', detail: 'Active' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
      default:
        return [
          { portal: 'GSTN', status: 'PASS', detail: 'Active' },
          { portal: 'MCA21', status: 'PASS', detail: 'Active' },
          { portal: 'EPFO', status: 'PASS', detail: 'Active' },
          { portal: 'UDYAM', status: 'PASS', detail: 'Active' },
        ];
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Tender Reference */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E5DFD9]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono-tech px-2.5 py-0.5 rounded-md bg-[#124E59]/10 text-[#124E59] font-extrabold border border-[#124E59]/25">
              CPCL Tender GEM/2025/0012
            </span>
            <span className="text-xs text-[#5F6675] font-mono-tech">
              Rule-set v1.3 &bull; 18 Configured Rules
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#2A2826]">
            Bidders Work Queue
          </h1>
          <p className="text-sm text-[#5F6675] font-medium mt-1">
            Operational verification workspace for submitted bidder packs. Primary compliance scores and risk evaluations are prioritized.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-[#FBF9F6] p-1 rounded-xl border border-[#E5DFD9]">
            <button
              onClick={() => setViewMode('PANELS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tech font-bold transition-all cursor-pointer ${
                viewMode === 'PANELS'
                  ? 'bg-white text-[#124E59] shadow-2xs'
                  : 'text-[#5F6675] hover:text-[#2A2826]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tech font-bold transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-[#124E59] shadow-2xs'
                  : 'text-[#5F6675] hover:text-[#2A2826]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] block font-mono-tech">
            TOTAL SUBMISSIONS
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#2A2826] font-mono-tech block mt-1">
            {bids.length || 45}
          </span>
          <span className="text-xs text-[#5F6675] block pt-1 font-medium">
            Active under technical scrutiny
          </span>
        </div>

        {/* Fully Compliant Pass */}
        <div className="p-5 rounded-2xl border border-[#124E59]/25 bg-[#124E59]/5 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#124E59] block font-mono-tech">
            FULLY COMPLIANT PASS
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#124E59] font-mono-tech block mt-1">
            {verifiedCount || 31}
          </span>
          <span className="text-xs text-[#124E59] block pt-1 font-bold">
            All statutory criteria satisfied
          </span>
        </div>

        {/* Critical Attention */}
        <div className="p-5 rounded-2xl border border-[#2A2826]/30 bg-[#2A2826]/5 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2A2826] block font-mono-tech">
            CRITICAL ATTENTION
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#2A2826] font-mono-tech block mt-1">
            {needsAttentionCount || 6}
          </span>
          <span className="text-xs text-[#2A2826] block pt-1 font-bold">
            MCA & Tax breaches detected
          </span>
        </div>

        {/* Under Active Review */}
        <div className="p-5 rounded-2xl border border-[#B7A08B]/40 bg-[#B7A08B]/10 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A6D56] block font-mono-tech">
            UNDER ACTIVE REVIEW
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#2A2826] font-mono-tech block mt-1">
            {inReviewCount || 8}
          </span>
          <span className="text-xs text-[#5F6675] block pt-1 font-medium">
            Awaiting committee disposition
          </span>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5DFD9] shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 font-mono-tech text-xs overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Bids', count: bids.length || 45 },
            { id: 'NEEDS_ATTENTION', label: 'Needs Attention', count: needsAttentionCount || 6 },
            { id: 'IN_REVIEW', label: 'In Review', count: inReviewCount || 8 },
            { id: 'VERIFIED', label: 'Verified', count: verifiedCount || 31 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 font-bold shrink-0 ${
                filterTab === tab.id
                  ? 'bg-[#124E59] text-[#FEFAF7] shadow-xs'
                  : 'text-[#5F6675] hover:bg-[#FBF9F6] hover:text-[#2A2826]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#E5DFD9] text-[#2A2826]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-[#5F6675] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bidder, GSTIN, PAN, ID..."
            className="w-full pl-10 pr-4 py-2 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs font-mono-tech text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* 4. VIEW MODE 1: GRID-BASED STRUCTURED LAYOUT BLOCKS */}
      {viewMode === 'PANELS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-sm font-mono-tech text-[#5F6675] bg-white rounded-2xl border border-[#E5DFD9]">
              Loading bidder evaluation packs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm font-mono-tech text-[#5F6675] bg-white rounded-2xl border border-[#E5DFD9]">
              No bidders found matching your filters.
            </div>
          ) : (
            filtered.map((b) => {
              const isNeedsAttention = b.status === 'NEEDS_ATTENTION';
              const isHighRisk = b.riskLevel === 'HIGH';

              const flagReason =
                b.id === 'BID-001'
                  ? 'CIN not found in MCA21 registry & GSTR-3B filings overdue'
                  : b.id === 'BID-005'
                  ? 'Entity actively flagged on Central Public Procurement Debarment Register (Order MoHUA/2024/77)'
                  : b.id === 'BID-006'
                  ? 'Structural PAN-GSTIN mismatch detected by Mod-36 check'
                  : null;

              const passCount = b.requirementResults ? b.requirementResults.filter((r) => r.state === 'PASS').length : Math.round((b.complianceScore / 100) * 18);
              const failCount = b.requirementResults ? b.requirementResults.filter((r) => r.state === 'FAIL').length : (isNeedsAttention ? 2 : 0);
              const reviewCount = b.requirementResults ? b.requirementResults.filter((r) => r.state === 'REVIEW').length : (b.riskLevel === 'MEDIUM' ? 2 : 0);
              const portalList = getBidderPortalStatuses(b.id);

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBid(b.id)}
                  className={`rounded-3xl border bg-white shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden group ${
                    isNeedsAttention || isHighRisk
                      ? 'border-[#2A2826]/30 hover:border-[#124E59]'
                      : 'border-[#E5DFD9] hover:border-[#124E59]'
                  }`}
                >
                  {/* UPPER EXECUTIVE TIER: PRIMARY SUMMARY DATA (Emphasizing Score, Risk & Status) */}
                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Top Identity Row */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-xl sm:text-2xl font-black text-[#2A2826] group-hover:text-[#124E59] transition-colors tracking-tight font-sans">
                            {b.bidder.legalName}
                          </h2>
                        </div>

                        <p className="text-xs text-[#5F6675] flex items-center gap-1.5 font-medium font-sans">
                          <MapPin className="w-3.5 h-3.5 text-[#B7A08B] shrink-0" />
                          <span>Registered Office: {b.bidder.city}, {b.bidder.state}</span>
                        </p>
                      </div>

                      {/* Primary Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBid(b.id);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-extrabold font-mono-tech hover:bg-[#0A323A] transition-all cursor-pointer shadow-xs self-start lg:self-center shrink-0"
                      >
                        <span>Review Bid Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* STRUCTURED GRID-BASED LAYOUT BLOCKS: SCORES, RISK, AND WORKFLOW STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Grid Block 1: BOLD COMPLIANCE SCORE */}
                      <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#E5DFD9] flex flex-col justify-between space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
                            COMPLIANCE SCORE
                          </span>
                          <span className="text-xs font-mono-tech text-[#5F6675] font-extrabold">
                            {passCount} / 18 Passed
                          </span>
                        </div>

                        <div className="flex items-baseline gap-3">
                          <span
                            className={`text-4xl sm:text-5xl font-black font-mono-tech tracking-tight leading-none ${
                              b.complianceScore >= 80
                                ? 'text-[#124E59]'
                                : b.complianceScore >= 60
                                ? 'text-[#8A6D56]'
                                : 'text-[#2A2826]'
                            }`}
                          >
                            {b.complianceScore}%
                          </span>

                          <span className="text-xs font-sans text-[#5F6675] font-semibold">
                            {b.complianceScore >= 80
                              ? 'Fully Compliant'
                              : b.complianceScore >= 60
                              ? 'Conditional Eligibility'
                              : 'High Risk / Non-Responsive'}
                          </span>
                        </div>

                        {/* Animated Visual Meter */}
                        <div className="space-y-1.5">
                          <div className="w-full h-2 bg-[#E5DFD9] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                b.complianceScore >= 80
                                  ? 'bg-[#124E59]'
                                  : b.complianceScore >= 60
                                  ? 'bg-[#8A6D56]'
                                  : 'bg-[#2A2826]'
                              }`}
                              style={{ width: `${b.complianceScore}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#5F6675] pt-0.5">
                            <span className="text-[#124E59] font-bold">{passCount} PASS</span>
                            <span className="text-[#2A2826] font-bold">{failCount} FAIL</span>
                            <span className="text-[#8A6D56] font-bold">{reviewCount} REVIEW</span>
                          </div>
                        </div>
                      </div>

                      {/* Grid Block 2: BOLD RISK LEVEL */}
                      <div
                        className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                          isHighRisk
                            ? 'bg-[#2A2826]/5 border-[#2A2826]/25'
                            : b.riskLevel === 'MEDIUM'
                            ? 'bg-[#B7A08B]/15 border-[#B7A08B]/40'
                            : 'bg-[#124E59]/5 border-[#124E59]/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
                            RISK LEVEL
                          </span>
                          <span className="text-xs font-mono-tech font-bold text-[#5F6675]">
                            Evaluation Tier
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl sm:text-3xl font-black font-mono-tech tracking-tight ${
                              isHighRisk
                                ? 'text-[#2A2826]'
                                : b.riskLevel === 'MEDIUM'
                                ? 'text-[#8A6D56]'
                                : 'text-[#124E59]'
                            }`}
                          >
                            {b.riskLevel} RISK
                          </span>
                          <RiskBadge level={b.riskLevel} size="md" />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-sans font-bold text-[#2A2826] block">
                            {isHighRisk
                              ? 'Statutory Breaches Present'
                              : b.riskLevel === 'MEDIUM'
                              ? 'Clarification Recommended'
                              : 'Clean Verified Record'}
                          </span>
                          <p className="text-[11px] text-[#5F6675] font-sans">
                            {isHighRisk
                              ? 'Officer review & formal justification required.'
                              : 'All statutory portals returned clean states.'}
                          </p>
                        </div>
                      </div>

                      {/* Grid Block 3: BOLD WORKFLOW STATUS LABEL */}
                      <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#E5DFD9] flex flex-col justify-between space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6675] font-mono-tech">
                            WORKFLOW STATUS
                          </span>
                          <span className="text-xs font-mono-tech text-[#5F6675]">
                            Governance Authority
                          </span>
                        </div>

                        <div>
                          <span
                            className={`text-lg sm:text-xl font-black font-mono-tech uppercase tracking-wide block ${
                              isNeedsAttention
                                ? 'text-[#2A2826]'
                                : b.status === 'VERIFIED'
                                ? 'text-[#124E59]'
                                : 'text-[#8A6D56]'
                            }`}
                          >
                            {b.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#E5DFD9]">
                          <span className="text-xs font-sans text-[#5F6675] font-medium block">
                            {isNeedsAttention
                              ? 'Decision pending on statutory flags'
                              : b.status === 'VERIFIED'
                              ? 'Ready for final committee award'
                              : 'Technical evaluation in progress'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Critical Finding Callout Banner (if applicable) */}
                    {flagReason && (
                      <div className="p-3.5 rounded-2xl bg-[#2A2826]/5 border border-[#2A2826]/20 flex items-center justify-between gap-3 text-xs font-mono-tech">
                        <div className="flex items-center gap-2.5 text-[#2A2826]">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-[#2A2826]" />
                          <span className="font-extrabold">{flagReason}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#5F6675] uppercase shrink-0">
                          Officer Review Mandatory
                        </span>
                      </div>
                    )}
                  </div>

                  {/* LOWER MUTED SUB-SECTION: IDS, TIMESTAMPS, AND PORTAL STATUS (Monospace Font) */}
                  <div className="px-6 py-4 bg-[#F7F5F2] border-t border-[#E5DFD9] space-y-3 font-mono-tech text-[11px] text-[#78716c]">
                    {/* Primary Identifiers & Timestamps */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD9]/70 pb-2.5">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase text-[#a8a29e] font-bold">BID ID:</span>
                          <span className="font-extrabold text-[#44403c]">{b.id}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="uppercase text-[#a8a29e] font-bold">GSTIN:</span>
                          <span className="font-extrabold text-[#44403c]">{b.bidder.gstin}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="uppercase text-[#a8a29e] font-bold">PAN:</span>
                          <span className="font-extrabold text-[#44403c]">{b.bidder.pan}</span>
                        </div>

                        {b.bidder.cin && (
                          <div className="flex items-center gap-1.5">
                            <span className="uppercase text-[#a8a29e] font-bold">CIN:</span>
                            <span className="font-extrabold text-[#44403c]">{b.bidder.cin}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[#78716c] shrink-0">
                        <Clock className="w-3.5 h-3.5 text-[#a8a29e]" />
                        <span>
                          {new Date(b.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(b.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Gateway Portal Status Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-[#a8a29e] shrink-0" />
                        <span className="uppercase text-[#a8a29e] font-bold">GATEWAY PORTALS:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {portalList.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-[#E5DFD9]"
                          >
                            <span className="text-[#a8a29e] font-bold">{p.portal}:</span>
                            <span
                              className={`font-black ${
                                p.status === 'PASS'
                                  ? 'text-[#124E59]'
                                  : p.status === 'TIMEOUT'
                                  ? 'text-[#8A6D56]'
                                  : 'text-[#2A2826]'
                              }`}
                            >
                              {p.status}
                            </span>
                            <span className="text-[#a8a29e] text-[10px]">({p.detail})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: STRUCTURED DATA TABLE */}
      {viewMode === 'TABLE' && (
        <div className="rounded-3xl border border-[#E5DFD9] bg-white shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-mono-tech">
            <thead>
              <tr className="border-b border-[#E5DFD9] bg-[#FBF9F6] text-[#5F6675] text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-5 w-12">#</th>
                <th className="py-3.5 px-5">Bidder Entity & Location</th>
                <th className="py-3.5 px-5">Compliance Score</th>
                <th className="py-3.5 px-5">Risk Level</th>
                <th className="py-3.5 px-5">Workflow State</th>
                <th className="py-3.5 px-5">Portal Verification Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD9]">
              {filtered.map((b, idx) => {
                const portalList = getBidderPortalStatuses(b.id);
                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBid(b.id)}
                    className="hover:bg-[#FBF9F6] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5 text-[#5F6675] font-bold">{idx + 1}</td>
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-sm text-[#2A2826] block group-hover:text-[#124E59] transition-colors font-sans">
                        {b.bidder.legalName}
                      </span>
                      <span className="text-[11px] text-[#78716c] font-mono-tech mt-0.5 block">
                        ID: {b.id} &bull; {b.bidder.city}, {b.bidder.state}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-black text-lg text-[#2A2826] font-mono-tech">
                        {b.complianceScore}%
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <RiskBadge level={b.riskLevel} size="sm" />
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#FBF9F6] border border-[#E5DFD9] text-[#2A2826]">
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[#78716c] text-[10px] font-mono-tech">
                      <div className="flex flex-wrap gap-1">
                        {portalList.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className={`px-1.5 py-0.5 rounded border ${
                              p.status === 'PASS'
                                ? 'bg-[#124E59]/5 border-[#124E59]/20 text-[#124E59]'
                                : 'bg-[#2A2826]/5 border-[#2A2826]/20 text-[#2A2826]'
                            }`}
                          >
                            {p.portal}:{p.status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBid(b.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#124E59] text-[#FEFAF7] text-xs font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-2xs"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

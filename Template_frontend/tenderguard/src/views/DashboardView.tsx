import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  History,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Radio,
  ArrowUpRight,
  Building2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';
import { ScoreRing } from '../components/common/ScoreRing';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

interface DashboardViewProps {
  user: User;
  onNavigate: (view: string, contextId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<'velocity' | 'categories'>('velocity');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, []);

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // 7-day velocity chart data points
  const velocityData = [
    { day: 'Mon', count: 8, height: 28 },
    { day: 'Tue', count: 14, height: 42 },
    { day: 'Wed', count: 22, height: 58 },
    { day: 'Thu', count: 29, height: 72 },
    { day: 'Fri', count: 36, height: 86 },
    { day: 'Sat', count: 42, height: 94 },
    { day: 'Sun', count: 48, height: 100 },
  ];

  const categoryCompliance = [
    { name: 'Statutory Compliance', rate: 84, rules: '5 Rules', state: 'PASS' },
    { name: 'Financial Eligibility', rate: 76, rules: '4 Rules', state: 'PASS' },
    { name: 'Technical Criteria', rate: 89, rules: '5 Rules', state: 'PASS' },
    { name: 'Prior Work Experience', rate: 92, rules: '4 Rules', state: 'PASS' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#124E59]/10 text-[#124E59] text-xs font-bold font-mono-tech border border-[#124E59]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CPCL SIH Procurement Environment</span>
            </span>
            <span className="text-xs font-medium text-[#5F6675]">{currentDateStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A2826] tracking-tight">
            Procurement Command Center
          </h1>
          <p className="text-sm text-[#5F6675] mt-1 font-medium">
            AI reads and advises. Deterministic rules verify. <span className="text-[#124E59] font-bold">The officer decides.</span>
          </p>
        </div>

        {/* Quick Workflow Jumps */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('verification', 'BID-001')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-bold font-mono-tech hover:bg-[#0A323A] transition-all shadow-sm cursor-pointer"
          >
            <span>Inspect ABC Infra (High Risk)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('bidders')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD9] hover:bg-[#F4EFEB] text-xs font-bold font-mono-tech text-[#2A2826] transition-colors cursor-pointer shadow-2xs"
          >
            <span>All Bidders Queue (45)</span>
          </button>
          <button
            onClick={() => onNavigate('audit')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5DFD9] hover:bg-[#F4EFEB] text-xs font-bold font-mono-tech text-[#124E59] transition-colors cursor-pointer shadow-2xs"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 4 Large, Vibrant KPI Cards with Visual Trend Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tenders */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6675]">Active Tenders</span>
            <div className="w-10 h-10 rounded-xl bg-[#124E59]/10 flex items-center justify-center text-[#124E59]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#2A2826] font-mono-tech">12</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono-tech text-[#124E59] bg-[#124E59]/10 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              +2 this week
            </span>
          </div>
          <p className="text-xs text-[#5F6675] mt-2 font-medium">3 tenders under active technical verification</p>
        </div>

        {/* Total Bids Received */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6675]">Total Bids Ingested</span>
            <div className="w-10 h-10 rounded-xl bg-[#B7A08B]/20 flex items-center justify-center text-[#2A2826]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#2A2826] font-mono-tech">48</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono-tech text-[#124E59] bg-[#124E59]/10 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              +14 this week
            </span>
          </div>
          <p className="text-xs text-[#5F6675] mt-2 font-medium">Across CPCL, MECL and HPCL tenders</p>
        </div>

        {/* Bids Need Attention */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6675]">Critical Attention</span>
            <div className="w-10 h-10 rounded-xl bg-[#2A2826]/10 flex items-center justify-center text-[#2A2826]">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#2A2826] font-mono-tech">6</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono-tech text-[#2A2826] bg-[#2A2826]/10 px-2 py-0.5 rounded-md">
              High Risk
            </span>
          </div>
          <p className="text-xs text-[#5F6675] mt-2 font-medium">MCA CIN discrepancy & overdue filings</p>
        </div>

        {/* Completed Reviews */}
        <div className="p-5 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6675]">Officer Reviewed</span>
            <div className="w-10 h-10 rounded-xl bg-[#124E59]/10 flex items-center justify-center text-[#124E59]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#124E59] font-mono-tech">32</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold font-mono-tech text-[#124E59] bg-[#124E59]/10 px-2 py-0.5 rounded-md">
              71% Done
            </span>
          </div>
          <p className="text-xs text-[#5F6675] mt-2 font-medium">Signed with immutable audit signatures</p>
        </div>
      </div>

      {/* Main Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Compliance Donut & Status Meter (col-span-6) */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9]">
            <div>
              <h2 className="text-base font-bold text-[#2A2826]">
                Bid Compliance Status Distribution
              </h2>
              <p className="text-xs text-[#5F6675] font-medium mt-0.5">
                Deterministic rule engine classification across 48 evaluated bids
              </p>
            </div>
            <button
              onClick={() => onNavigate('bidders')}
              className="text-xs font-bold font-mono-tech text-[#124E59] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Visual Donut Ring */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Track */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E5DFD9" strokeWidth="4" />
                  {/* Passed (45.8%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#124E59"
                    strokeWidth="4"
                    strokeDasharray="45.8 54.2"
                    strokeDashoffset="0"
                  />
                  {/* Failed (16.7%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#2A2826"
                    strokeWidth="4"
                    strokeDasharray="16.7 83.3"
                    strokeDashoffset="-45.8"
                  />
                  {/* Under Review (25%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#B7A08B"
                    strokeWidth="4"
                    strokeDasharray="25 75"
                    strokeDashoffset="-62.5"
                  />
                  {/* Unverifiable (12.5%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#5F6675"
                    strokeWidth="4"
                    strokeDasharray="12.5 87.5"
                    strokeDashoffset="-87.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-[#2A2826] font-mono-tech leading-none">
                    48
                  </span>
                  <span className="text-xs font-bold text-[#5F6675] uppercase tracking-wider mt-1">
                    Bids Total
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Breakdown Cards */}
            <div className="sm:col-span-7 space-y-2.5 font-mono-tech text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-[#124E59] shadow-2xs" />
                  <span className="font-bold text-[#2A2826]">✓ Passed (Compliant)</span>
                </div>
                <span className="font-extrabold text-[#124E59] text-sm">22 (45.8%)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-[#2A2826] shadow-2xs" />
                  <span className="font-bold text-[#2A2826]">× Failed (Statutory Flag)</span>
                </div>
                <span className="font-extrabold text-[#2A2826] text-sm">8 (16.7%)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-[#B7A08B] shadow-2xs" />
                  <span className="font-bold text-[#2A2826]">△ Under Review</span>
                </div>
                <span className="font-extrabold text-[#5F6675] text-sm">12 (25.0%)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF9F6] border border-[#E5DFD9]">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-[#5F6675] shadow-2xs" />
                  <span className="font-bold text-[#2A2826]">○ Unverifiable (Portal)</span>
                </div>
                <span className="font-extrabold text-[#5F6675] text-sm">6 (12.5%)</span>
              </div>
            </div>
          </div>

          {/* Stacked Risk Meter */}
          <div className="pt-3 border-t border-[#E5DFD9] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <span className="font-bold text-[#2A2826]">Risk Profile Meter</span>
              <span className="text-[#5F6675]">Independent of compliance score</span>
            </div>
            <div className="h-3 w-full bg-[#E5DFD9] rounded-full overflow-hidden flex">
              <div className="bg-[#124E59] h-full" style={{ width: '62.5%' }} title="Low Risk: 62.5%" />
              <div className="bg-[#B7A08B] h-full" style={{ width: '25.0%' }} title="Medium Risk: 25.0%" />
              <div className="bg-[#2A2826] h-full" style={{ width: '12.5%' }} title="High Risk: 12.5%" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#5F6675] pt-0.5">
              <span className="text-[#124E59] font-bold">● Low (30)</span>
              <span className="text-[#8A6D56] font-bold">● Medium (12)</span>
              <span className="text-[#2A2826] font-bold">● High (6)</span>
            </div>
          </div>
        </div>

        {/* Right: Verification Velocity Chart & Category Breakdown (col-span-6) */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-[#E5DFD9] bg-white shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9]">
              <div>
                <h2 className="text-base font-bold text-[#2A2826]">
                  {activeChartTab === 'velocity' ? '7-Day Ingestion & Verification Velocity' : 'Category Compliance Benchmark'}
                </h2>
                <p className="text-xs text-[#5F6675] font-medium mt-0.5">
                  {activeChartTab === 'velocity' ? 'Rate of documents processed and deterministic checks completed' : 'Statutory vs technical requirement pass rates'}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#F4EFEB] p-1 rounded-xl">
                <button
                  onClick={() => setActiveChartTab('velocity')}
                  className={`px-2.5 py-1 text-xs font-bold font-mono-tech rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'velocity'
                      ? 'bg-white text-[#124E59] shadow-2xs'
                      : 'text-[#5F6675] hover:text-[#2A2826]'
                  }`}
                >
                  Trend
                </button>
                <button
                  onClick={() => setActiveChartTab('categories')}
                  className={`px-2.5 py-1 text-xs font-bold font-mono-tech rounded-lg transition-all cursor-pointer ${
                    activeChartTab === 'categories'
                      ? 'bg-white text-[#124E59] shadow-2xs'
                      : 'text-[#5F6675] hover:text-[#2A2826]'
                  }`}
                >
                  Categories
                </button>
              </div>
            </div>

            {/* CHART VIEW 1: 7-DAY VELOCITY AREA/BAR CHART */}
            {activeChartTab === 'velocity' && (
              <div className="space-y-4 pt-4">
                <div className="h-44 flex items-end justify-between gap-3 px-2">
                  {velocityData.map((d, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <span className="text-[11px] font-mono-tech font-bold text-[#124E59] opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.count}
                      </span>
                      <div className="w-full bg-[#F4EFEB] rounded-t-lg h-36 flex items-end overflow-hidden p-0.5">
                        <div
                          className="w-full bg-gradient-to-t from-[#0A323A] to-[#124E59] rounded-t-md transition-all duration-700 ease-out group-hover:brightness-110"
                          style={{ height: `${d.height}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold font-mono-tech text-[#5F6675]">
                        {d.day}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-mono-tech bg-[#FBF9F6] p-3 rounded-xl border border-[#E5DFD9]">
                  <span className="text-[#5F6675]">Average Verification Turnaround:</span>
                  <span className="font-extrabold text-[#124E59]">38 seconds / 18 rules</span>
                </div>
              </div>
            )}

            {/* CHART VIEW 2: CATEGORY BENCHMARKS */}
            {activeChartTab === 'categories' && (
              <div className="space-y-4 pt-3">
                {categoryCompliance.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5 font-mono-tech text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2A2826]">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#5F6675]">{cat.rules}</span>
                        <span className="font-extrabold text-[#124E59] text-sm">{cat.rate}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-[#E5DFD9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#124E59] rounded-full transition-all duration-700"
                        style={{ width: `${cat.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E5DFD9] flex items-center justify-between text-xs font-mono-tech text-[#5F6675]">
            <span>Deterministic engine v1.3</span>
            <button
              onClick={() => onNavigate('evaluation')}
              className="text-[#124E59] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Scientific Benchmark Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Actionable Bidders Work Matrix (Visual Cards instead of Wall of Text!) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2A2826]">
              Priority Bidder Submissions (GEM/2025/0012)
            </h2>
            <p className="text-xs text-[#5F6675] font-medium mt-0.5">
              Immediate inspection queue based on deterministic failure flags and compliance scores
            </p>
          </div>
          <button
            onClick={() => onNavigate('bidders')}
            className="text-xs font-bold font-mono-tech text-[#124E59] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All 45 Bidders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-tech">
          {/* Card 1: ABC Infra Solutions (High Risk Demo Case) */}
          <div
            onClick={() => onNavigate('verification', 'BID-001')}
            className="p-5 rounded-2xl border border-[#2A2826]/30 bg-white hover:border-[#124E59] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5F6675]">BID-001 &bull; CPCL</span>
                <RiskBadge level="HIGH" size="sm" />
              </div>
              <h3 className="text-base font-extrabold text-[#2A2826] group-hover:text-[#124E59] transition-colors">
                ABC Infra Solutions
              </h3>
              <p className="text-xs text-[#5F6675]">GSTIN: 22AAAAA0000A1Z5</p>

              <div className="p-3 rounded-xl bg-[#2A2826]/5 border border-[#2A2826]/15 space-y-1">
                <span className="text-[11px] font-bold text-[#2A2826] block">
                  FAIL: CIN NOT FOUND IN MCA
                </span>
                <p className="text-xs text-[#5F6675]">
                  Also flagged for overdue monthly GSTR-3B filings on simulated portal.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DFD9] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#5F6675] block">Score</span>
                <span className="text-base font-extrabold text-[#2A2826]">72%</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#124E59] text-[#FEFAF7] text-xs font-bold">
                <span>Inspect Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Shree Tech Pvt Ltd (Clean Compliant Case) */}
          <div
            onClick={() => onNavigate('verification', 'BID-002')}
            className="p-5 rounded-2xl border border-[#E5DFD9] bg-white hover:border-[#124E59] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5F6675]">BID-002 &bull; CPCL</span>
                <RiskBadge level="LOW" size="sm" />
              </div>
              <h3 className="text-base font-extrabold text-[#2A2826] group-hover:text-[#124E59] transition-colors">
                Shree Tech Pvt Ltd
              </h3>
              <p className="text-xs text-[#5F6675]">GSTIN: 27BBBBB1111B2Z7</p>

              <div className="p-3 rounded-xl bg-[#124E59]/5 border border-[#124E59]/15 space-y-1">
                <span className="text-[11px] font-bold text-[#124E59] block">
                  18 / 18 CHECKS COMPLIANT
                </span>
                <p className="text-xs text-[#5F6675]">
                  Full Mod-36 checksum, MCA active record, and up-to-date return filings.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DFD9] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#5F6675] block">Score</span>
                <span className="text-base font-extrabold text-[#124E59]">98%</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#124E59]/10 text-[#124E59] text-xs font-bold group-hover:bg-[#124E59] group-hover:text-[#FEFAF7] transition-all">
                <span>Inspect Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Delta Constructions (Debarment Case) */}
          <div
            onClick={() => onNavigate('verification', 'BID-005')}
            className="p-5 rounded-2xl border border-[#2A2826]/30 bg-white hover:border-[#124E59] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5F6675]">BID-005 &bull; CPCL</span>
                <RiskBadge level="HIGH" size="sm" />
              </div>
              <h3 className="text-base font-extrabold text-[#2A2826] group-hover:text-[#124E59] transition-colors">
                Delta Constructions
              </h3>
              <p className="text-xs text-[#5F6675]">GSTIN: 07EEEEE4444E5Z0</p>

              <div className="p-3 rounded-xl bg-[#2A2826]/5 border border-[#2A2826]/15 space-y-1">
                <span className="text-[11px] font-bold text-[#2A2826] block">
                  FAIL: CENTRAL DEBARMENT MATCH
                </span>
                <p className="text-xs text-[#5F6675]">
                  Entity actively listed on MoHUA central debarment register.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DFD9] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#5F6675] block">Score</span>
                <span className="text-base font-extrabold text-[#2A2826]">41%</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#124E59]/10 text-[#124E59] text-xs font-bold group-hover:bg-[#124E59] group-hover:text-[#FEFAF7] transition-all">
                <span>Inspect Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

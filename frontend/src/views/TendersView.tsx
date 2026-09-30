import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Building2,
  Calendar,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Tender } from '../types';

interface TendersViewProps {
  onSelectTender: (tenderId: string) => void;
}

export const TendersView: React.FC<TendersViewProps> = ({ onSelectTender }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_PROGRESS' | 'DRAFT' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Tender Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newDept, setNewDept] = useState('CPCL (Chennai Petroleum Corporation Limited)');
  const [newCategory, setNewCategory] = useState('GOODS');
  const [newOpeningDate, setNewOpeningDate] = useState(new Date().toISOString().slice(0, 10));
  const [newClosingDate, setNewClosingDate] = useState('2026-11-30');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/tenders')
      .then((res) => res.json())
      .then((data) => {
        setTenders(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const inProgressCount = tenders.filter((t) => t.status === 'VERIFICATION' || t.status === 'OPEN').length;
  const draftCount = tenders.filter((t) => t.status === 'DRAFT').length;
  const closedCount = tenders.filter((t) => t.status === 'CLOSED' || t.status === 'COMPLETED').length;

  const filtered = tenders.filter((t) => {
    if (activeTab === 'IN_PROGRESS' && t.status !== 'VERIFICATION' && t.status !== 'OPEN') return false;
    if (activeTab === 'DRAFT' && t.status !== 'DRAFT') return false;
    if (activeTab === 'CLOSED' && t.status !== 'CLOSED' && t.status !== 'COMPLETED') return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.tenderNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.department.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRef.trim()) {
      setErrorMsg('Tender Title and Reference Number are required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          tenderNumber: newRef.trim().toUpperCase(),
          department: newDept.trim(),
          openingDate: newOpeningDate,
          closingDate: newClosingDate,
          ruleSetVersion: '1.3',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tender');
      }
      setTenders((prev) => [data.tender, ...prev]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewRef('');
      setSuccessMsg(`Tender ${data.tender.tenderNumber} created and published with 18 rule checks!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActiveTab('ALL');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-tech font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD9]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A2826]">
            Procurement Tenders
          </h1>
          <p className="text-sm text-[#5F6675] font-medium mt-1">
            Active tenders and configured compliance rule sets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5F6675] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tender name, tender ID..."
              className="pl-9 pr-4 py-2 bg-white border border-[#E5DFD9] rounded-xl text-xs font-mono-tech text-[#2A2826] focus:outline-hidden focus:border-[#124E59] w-64 sm:w-72 shadow-2xs"
            />
          </div>

          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5DFD9] bg-white text-xs font-mono-tech font-bold text-[#2A2826] hover:bg-[#F4EFEB] transition-colors cursor-pointer shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-[#5F6675]" />
            <span>Filters</span>
          </button>

          <button
            onClick={() => {
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-mono-tech font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Tender</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tabs Row */}
      <div className="flex items-center gap-2 border-b border-[#E5DFD9] pb-3 text-xs font-mono-tech">
        {[
          { id: 'ALL', label: 'All Tenders', count: tenders.length },
          { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
          { id: 'DRAFT', label: 'Draft', count: draftCount },
          { id: 'CLOSED', label: 'Closed', count: closedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#124E59] text-[#FEFAF7] font-bold shadow-xs'
                : 'text-[#5F6675] hover:bg-white hover:text-[#2A2826]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#E5DFD9] text-[#2A2826]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tenders Table */}
      <div className="rounded-2xl border border-[#E5DFD9] bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs font-mono-tech">
          <thead>
            <tr className="border-b border-[#E5DFD9] bg-[#FBF9F6] text-[#5F6675] text-xs font-extrabold uppercase tracking-wider">
              <th className="py-3.5 px-5 w-12">#</th>
              <th className="py-3.5 px-5">Tender Name & Reference</th>
              <th className="py-3.5 px-5">Department</th>
              <th className="py-3.5 px-5 text-center">Bids</th>
              <th className="py-3.5 px-5">Opening Date</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DFD9]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#5F6675] font-medium text-sm">
                  Loading procurement tenders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#5F6675] font-medium text-sm">
                  No tenders found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => (
                <tr
                  key={t.id}
                  onClick={() => onSelectTender(t.id)}
                  className="hover:bg-[#FBF9F6] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-5 text-[#5F6675] font-bold">{idx + 1}</td>
                  <td className="py-4 px-5">
                    <span className="font-extrabold text-sm text-[#2A2826] block group-hover:text-[#124E59] transition-colors">
                      {t.title}
                    </span>
                    <span className="text-xs text-[#5F6675] mt-0.5 block">{t.tenderNumber}</span>
                  </td>
                  <td className="py-4 px-5 text-[#2A2826] font-medium">
                    <span className="truncate block max-w-xs">{t.department}</span>
                  </td>
                  <td className="py-4 px-5 text-center font-extrabold text-sm text-[#2A2826]">
                    {t.totalBidders}
                  </td>
                  <td className="py-4 px-5 text-[#5F6675] font-medium">{t.openingDate}</td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-extrabold ${
                        t.status === 'VERIFICATION' || t.status === 'OPEN'
                          ? 'bg-[#124E59]/10 text-[#124E59] border border-[#124E59]/30'
                          : t.status === 'DRAFT'
                          ? 'bg-[#E5DFD9] text-[#2A2826]'
                          : 'bg-[#B7A08B]/25 text-[#3D3730]'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTender(t.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#124E59]/10 text-[#124E59] hover:bg-[#124E59] hover:text-[#FEFAF7] border border-[#124E59]/30 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Modal: Create New Tender */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5DFD9] shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E5DFD9]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono-tech px-2.5 py-0.5 rounded-md bg-[#124E59]/10 text-[#124E59] font-extrabold border border-[#124E59]/25">
                    GeM Procurement Engine
                  </span>
                  <span className="text-xs text-[#5F6675] font-mono-tech">v1.3 Statutory Rules</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2A2826] tracking-tight">
                  Configure New Tender
                </h2>
                <p className="text-xs text-[#5F6675] mt-1 font-medium">
                  Define tender specifications and bind statutory rule-sets for automated bid verification.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#5F6675] hover:text-[#2A2826] hover:bg-[#F4EFEB] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono-tech flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateTender} className="space-y-4 font-mono-tech text-xs">
              <div>
                <label className="block text-[#2A2826] font-extrabold uppercase text-[11px] mb-1.5">
                  Tender Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Supply of High-Performance Industrial Heat Exchangers"
                  className="w-full px-3.5 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2A2826] font-extrabold uppercase text-[11px] mb-1.5">
                    Tender Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="e.g., GEM/2026/0412"
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs text-[#2A2826] uppercase font-bold focus:outline-hidden focus:border-[#124E59] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#2A2826] font-extrabold uppercase text-[11px] mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs text-[#2A2826] font-bold focus:outline-hidden focus:border-[#124E59] focus:bg-white"
                  >
                    <option value="GOODS">Goods / Supplies</option>
                    <option value="WORKS">Civil Works / Construction</option>
                    <option value="SERVICES">Services / IT Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#2A2826] font-extrabold uppercase text-[11px] mb-1.5">
                  Procuring Department & Enterprise
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="e.g., CPCL (Chennai Petroleum Corporation Limited)"
                  className="w-full px-3.5 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs text-[#2A2826] focus:outline-hidden focus:border-[#124E59] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2A2826] font-extrabold uppercase text-[11px] mb-1.5">
                    Bid Opening Date
                  </label>
                  <input
                    type="date"
                    value={newOpeningDate}
                    onChange={(e) => setNewOpeningDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs text-[#2A2826] font-bold focus:outline-hidden focus:border-[#124E59] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#2A2826] font-extrabold uppercase text-[11px] mb-1.5">
                    Bid Closing Date
                  </label>
                  <input
                    type="date"
                    value={newClosingDate}
                    onChange={(e) => setNewClosingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F6] border border-[#E5DFD9] rounded-xl text-xs text-[#2A2826] font-bold focus:outline-hidden focus:border-[#124E59] focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#124E59]/5 border border-[#124E59]/20 flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-[#124E59] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#2A2826] leading-relaxed">
                  <span className="font-bold text-[#124E59] block">Rule Engine Auto-Binding:</span>
                  18 statutory compliance checks (GSTN Mod-36, PAN, MCA21, EPFO, Debarment) will be automatically assigned to this tender.
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DFD9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5DFD9] bg-white text-xs font-bold text-[#5F6675] hover:bg-[#FBF9F6] hover:text-[#2A2826] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating & Publishing...' : 'Create & Publish Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

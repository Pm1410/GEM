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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions (Matches Panel 03) */}
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

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] text-xs font-mono-tech font-bold hover:bg-[#0A323A] transition-all cursor-pointer shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Tender</span>
          </button>
        </div>
      </div>

      {/* Tabs Row (Matches Panel 03) */}
      <div className="flex items-center gap-2 border-b border-[#E5DFD9] pb-3 text-xs font-mono-tech">
        {[
          { id: 'ALL', label: 'All Tenders', count: 34 },
          { id: 'IN_PROGRESS', label: 'In Progress', count: 12 },
          { id: 'DRAFT', label: 'Draft', count: 5 },
          { id: 'CLOSED', label: 'Closed', count: 7 },
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

      {/* Tenders Table (Matches Panel 03) */}
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
                        t.status === 'VERIFICATION'
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
    </div>
  );
};

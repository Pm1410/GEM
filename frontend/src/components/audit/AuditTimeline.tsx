import React, { useState } from 'react';
import { AuditRecord } from '../../types';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
  Sparkles,
  AlertTriangle,
  Search,
  Key,
} from 'lucide-react';

interface AuditTimelineProps {
  records: AuditRecord[];
  onOpenVerifier: () => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ records, onOpenVerifier }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = records.filter((rec) => {
    if (filterAction !== 'ALL' && rec.eventType !== filterAction) return false;
    if (
      searchQuery &&
      !rec.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !rec.bidderName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !rec.hash.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'OFFICER_DECISION':
        return UserCheck;
      case 'ADVISORY_GENERATED':
        return Sparkles;
      case 'REQUIREMENT_VERIFIED':
        return CheckCircle2;
      case 'DOCUMENT_EXTRACTED':
        return FileText;
      default:
        return History;
    }
  };

  return (
    <div className="space-y-4 font-mono-tech text-xs">
      {/* Top Filter Bar (Matches Panel 09) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/80 rounded-xl border border-[#D8CFD0] backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#697184]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by keyword, bidder, or hash..."
            className="w-full bg-[#FEFAF7] border border-[#D8CFD0] rounded-md px-2.5 py-1.5 text-xs text-[#413F3D] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FEFAF7] border border-[#D8CFD0] rounded-md text-xs text-[#413F3D]"
          >
            <option value="ALL">All Actions ({records.length})</option>
            <option value="OFFICER_DECISION">Officer Decisions</option>
            <option value="REQUIREMENT_VERIFIED">Verification Runs</option>
            <option value="DOCUMENT_EXTRACTED">Document Extractions</option>
            <option value="BID_SUBMITTED">Bid Ingestions</option>
          </select>

          <button
            onClick={onOpenVerifier}
            className="px-3 py-1.5 rounded-md bg-[#154D57] text-[#FEFAF7] hover:bg-[#154D57]/90 font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Hash Chain Integrity</span>
          </button>
        </div>
      </div>

      {/* Timeline entries list */}
      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D8CFD0]">
        {filtered.map((record) => {
          const Icon = getEventIcon(record.eventType);
          const isTampered = record.isTampered;

          return (
            <div key={record.id} className="relative group">
              {/* Timeline Bullet */}
              <div
                className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isTampered
                    ? 'border-[#413F3D] bg-[#413F3D] text-white animate-pulse'
                    : 'border-[#154D57] bg-white text-[#154D57]'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Card Surface */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isTampered
                    ? 'bg-[#413F3D]/10 border-[#413F3D] shadow-md'
                    : 'bg-white/80 border-[#D8CFD0] hover:border-[#154D57]/40 shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#413F3D]">
                      {record.eventType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEFAF7] border border-[#D8CFD0] text-[#697184]">
                      Block #{record.id}
                    </span>
                    {isTampered && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#413F3D] text-white font-bold uppercase">
                        TAMPERED ENTRY
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[#697184]">
                    {new Date(record.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>

                <p className="text-xs text-[#413F3D] mb-3 leading-relaxed">{record.details}</p>

                {record.justification && (
                  <div className="p-2.5 rounded bg-[#FEFAF7] border border-[#D8CFD0] mb-3 text-xs">
                    <span className="text-[10px] font-bold text-[#154D57] block mb-0.5">
                      OFFICER DISPOSITION: {record.officerDisposition}
                    </span>
                    <p className="italic text-[#413F3D]">&ldquo;{record.justification}&rdquo;</p>
                  </div>
                )}

                {/* Hashes & Metadata Row */}
                <div className="pt-2 border-t border-[#D8CFD0]/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-[#697184]">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider">
                      PREVIOUS HASH:
                    </span>
                    <span className="text-[#413F3D] truncate block font-mono-tech">
                      {record.previousHash}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] uppercase tracking-wider">BLOCK SHA-256:</span>
                    <span className="text-[#154D57] font-semibold truncate block font-mono-tech">
                      {record.hash}
                    </span>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between text-[10px] pt-1">
                    <span>
                      Actor: <strong>{record.actor.name}</strong> ({record.actor.role}) &bull;{' '}
                      {record.actor.email}
                    </span>
                    <span>
                      Tender v{record.tenderVersion} &bull; Rule-set v{record.ruleSetVersion}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

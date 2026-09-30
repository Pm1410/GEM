import React, { useState, useEffect } from 'react';
import { AuditTimeline } from '../components/audit/AuditTimeline';
import { AuditIntegrityModal } from '../components/audit/AuditIntegrityModal';
import { AuditRecord } from '../types';
import { History, ShieldCheck } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit');
      const data = await res.json();
      setRecords(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header (Matches Panel 09) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8CFD0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#413F3D]">Audit Trail</h1>
          <p className="text-xs text-[#697184] font-mono-tech mt-0.5">
            Complete cryptographic history of verification, officer decisions and system actions.
          </p>
        </div>

        <button
          onClick={() => setIsVerifierOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#154D57] text-[#FEFAF7] text-xs font-mono-tech font-bold hover:bg-[#154D57]/90 transition-colors cursor-pointer shadow-xs"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify Hash Chain Integrity</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono-tech text-[#697184]">
          Loading cryptographic audit ledger...
        </div>
      ) : (
        <AuditTimeline records={records} onOpenVerifier={() => setIsVerifierOpen(true)} />
      )}

      {/* Integrity Verification Modal */}
      <AuditIntegrityModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
        onRefreshTrail={fetchRecords}
      />
    </div>
  );
};

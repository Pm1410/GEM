import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, RefreshCw, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface AuditIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshTrail?: () => void;
}

export const AuditIntegrityModal: React.FC<AuditIntegrityModalProps> = ({
  isOpen,
  onClose,
  onRefreshTrail,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [tampering, setTampering] = useState(false);

  if (!isOpen) return null;

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: 3 }),
      });
      await runVerification();
      if (onRefreshTrail) onRefreshTrail();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/audit/reset', { method: 'POST' });
      await runVerification();
      if (onRefreshTrail) onRefreshTrail();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl border border-[#B1A6A4] shadow-2xl max-w-xl w-full p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8CFD0]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#154D57]" />
            <div>
              <h3 className="text-base font-bold text-[#413F3D]">
                Cryptographic Hash Chain Integrity Verifier
              </h3>
              <p className="text-[11px] text-[#697184] font-mono-tech mt-0.5">
                Evaluates SHA-256 parent links & canonical payload signatures across audit records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#697184] hover:text-[#413F3D] rounded hover:bg-[#F2F1EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 font-mono-tech text-xs">
          {!result ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-[#697184]">
                Click below to iterate through the audit block chain and mathematically verify tamper resistance.
              </p>
              <button
                onClick={runVerification}
                disabled={verifying}
                className="px-4 py-2 rounded-md bg-[#154D57] text-[#FEFAF7] font-semibold hover:bg-[#154D57]/90 transition-colors cursor-pointer"
              >
                {verifying ? 'Calculating Hashes...' : 'Run Cryptographic Audit Check'}
              </button>
            </div>
          ) : result.valid ? (
            <div className="p-4 rounded-xl border border-[#154D57]/30 bg-[#154D57]/5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#154D57]">
                <CheckCircle2 className="w-5 h-5" />
                <span>INTEGRITY VERIFIED: ALL BLOCKS VALID</span>
              </div>
              <p className="text-[11px] text-[#413F3D]">
                {result.verifiedRecords} audit records sequentially verified. Zero hash collisions, zero altered payloads, unbroken genesis lineage.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#413F3D]/50 bg-[#413F3D]/10 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#413F3D]">
                <AlertOctagon className="w-5 h-5 text-[#413F3D]" />
                <span>CHAIN BROKEN: UNAUTHORIZED TAMPERING DETECTED!</span>
              </div>
              <p className="text-[11px] text-[#413F3D]">
                Broken at Record #{result.firstBrokenRecord}.
              </p>
              <div className="p-2.5 bg-white rounded border border-[#D8CFD0] space-y-1 text-[10px]">
                <div className="text-[#697184]">EXPECTED HASH (STORED):</div>
                <div className="text-[#413F3D] break-all">{result.expectedHash}</div>
                <div className="text-[#697184] mt-1">COMPUTED PAYLOAD HASH:</div>
                <div className="text-[#413F3D] font-bold break-all">{result.computedHash}</div>
              </div>
              <p className="text-[10px] text-[#697184]">
                {result.details}
              </p>
            </div>
          )}

          {/* Demonstration controls for SIH Case H */}
          <div className="p-3 bg-[#FEFAF7] border border-[#D8CFD0] rounded-lg space-y-2">
            <span className="text-[10px] font-bold text-[#697184] uppercase tracking-wide block">
              Demo Simulation Sandbox (Mandatory Case H)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateTamper}
                disabled={tampering}
                className="px-3 py-1.5 rounded bg-[#413F3D]/10 hover:bg-[#413F3D]/20 border border-[#413F3D]/30 text-[#413F3D] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {tampering ? 'Tampering...' : 'Simulate Out-Of-Band Tamper (Case H)'}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded bg-white hover:bg-[#F2F1EF] border border-[#D8CFD0] text-[#154D57] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Reset Valid Chain
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#D8CFD0] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#154D57] text-[#FEFAF7] text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

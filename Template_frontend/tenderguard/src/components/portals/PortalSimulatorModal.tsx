import React, { useState, useEffect } from 'react';
import { X, Radio, RefreshCw, AlertTriangle, ShieldCheck, Server } from 'lucide-react';
import { AdapterStatus } from '../../types';

interface PortalSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPortalsChanged?: () => void;
}

export const PortalSimulatorModal: React.FC<PortalSimulatorModalProps> = ({
  isOpen,
  onClose,
  onPortalsChanged,
}) => {
  const [portals, setPortals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPortals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portals');
      const data = await res.json();
      setPortals(data.portals || []);
    } catch (e) {
      console.error('Failed to load portals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPortals();
    }
  }, [isOpen]);

  const handleStatusChange = async (portalId: string, status: AdapterStatus) => {
    try {
      setUpdating(portalId);
      await fetch('/api/portals/set-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: portalId, status }),
      });
      await fetchPortals();
      if (onPortalsChanged) onPortalsChanged();
    } catch (e) {
      console.error('Failed to update portal status:', e);
    } finally {
      setUpdating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-mono-tech">
      <div className="bg-white rounded-3xl border border-[#E5DFD9] shadow-2xl max-w-2xl w-full p-6 sm:p-7 relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9]">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[#124E59] animate-pulse" />
            <div>
              <h3 className="text-base font-extrabold text-[#2A2826]">
                Simulated External Portal Gateway Controller
              </h3>
              <p className="text-xs text-[#5F6675] font-sans mt-0.5">
                Inject network latency, timeouts, or downtime to evaluate deterministic resilience.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5F6675] hover:text-[#2A2826] rounded-xl hover:bg-[#F4EFEB] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portals list */}
        <div className="py-2 space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-[#5F6675]">Loading simulated gateway states...</div>
          ) : (
            portals.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-[#E5DFD9] bg-[#FBF9F6] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-[#124E59]" />
                    <div>
                      <span className="font-extrabold text-sm text-[#2A2826] block">{p.name}</span>
                      <span className="text-[11px] text-[#5F6675]">{p.endpoint}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      p.status === 'SUCCESS'
                        ? 'bg-[#124E59]/10 text-[#124E59] border border-[#124E59]/25'
                        : p.status === 'TIMEOUT'
                        ? 'bg-[#B7A08B]/25 text-[#3D3730] border border-[#B7A08B]/50'
                        : 'bg-[#2A2826]/10 text-[#2A2826] border border-[#2A2826]/30'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-[#E5DFD9]">
                  <span className="text-[10px] text-[#5F6675] uppercase font-bold">
                    INJECT GATEWAY STATE:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['SUCCESS', 'TIMEOUT', 'DOWN', 'STALE'] as AdapterStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(p.id, st)}
                        disabled={updating === p.id}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          p.status === st
                            ? 'bg-[#124E59] text-white border-[#124E59] shadow-2xs'
                            : 'bg-white text-[#2A2826] border-[#E5DFD9] hover:bg-[#F4EFEB]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E5DFD9] flex items-center justify-between text-xs">
          <span className="text-[#5F6675] text-[11px]">
            * Injected states immediately influence deterministic rule verification.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#124E59] text-[#FEFAF7] font-bold hover:bg-[#0A323A] transition-colors cursor-pointer shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

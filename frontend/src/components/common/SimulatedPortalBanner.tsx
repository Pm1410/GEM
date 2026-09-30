import React from 'react';
import { Radio } from 'lucide-react';
import { ExternalVerification } from '../../types';

interface SimulatedPortalBannerProps {
  verification?: ExternalVerification;
  onOpenSimulator?: () => void;
}

export const SimulatedPortalBanner: React.FC<SimulatedPortalBannerProps> = ({
  verification,
  onOpenSimulator,
}) => {
  if (!verification) return null;

  return (
    <div className="rounded-lg border border-[#B7A08B]/40 bg-[#FEFAF7]/90 p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-tech uppercase tracking-wider bg-[#154D57]/10 text-[#154D57] border border-[#154D57]/30">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            SIMULATED ADAPTER
          </span>
          <span className="text-xs font-medium text-[#413F3D]">{verification.adapterName}</span>
        </div>

        {onOpenSimulator && (
          <button
            onClick={onOpenSimulator}
            className="text-[11px] text-[#154D57] hover:underline font-mono-tech cursor-pointer"
          >
            Configure Gateway &rarr;
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tech pt-1 border-t border-[#D8CFD0]/50">
        <div>
          <span className="text-[10px] text-[#697184] block">STATUS</span>
          <span
            className={`font-semibold ${
              verification.status === 'SUCCESS'
                ? 'text-[#154D57]'
                : verification.status === 'DOWN' || verification.status === 'TIMEOUT'
                ? 'text-[#413F3D] font-bold'
                : 'text-[#697184]'
            }`}
          >
            {verification.status}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#697184] block">LATENCY</span>
          <span className="text-[#413F3D]">{verification.latencyMs} ms</span>
        </div>

        <div>
          <span className="text-[10px] text-[#697184] block">SOURCE</span>
          <span className="text-[#413F3D] truncate block" title={verification.sourceLabel}>
            {verification.adapterName}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#697184] block">HASH (16c)</span>
          <span className="text-[#697184] truncate block">{verification.responseHash}</span>
        </div>
      </div>
    </div>
  );
};

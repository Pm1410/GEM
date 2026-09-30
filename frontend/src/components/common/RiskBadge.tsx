import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const isHigh = level === 'HIGH';
  const isMed = level === 'MEDIUM';

  const containerStyle = isHigh
    ? 'bg-[#2A2826]/12 text-[#2A2826] border-[#2A2826]/50 font-extrabold shadow-2xs'
    : isMed
    ? 'bg-[#B7A08B]/25 text-[#3D3730] border-[#B7A08B]/60 font-bold shadow-2xs'
    : 'bg-[#124E59]/12 text-[#124E59] border-[#124E59]/35 font-bold shadow-2xs';

  const sizeStyle = size === 'sm' ? 'text-xs px-2.5 py-1 gap-1.5' : 'text-xs px-3 py-1.5 gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono-tech uppercase tracking-wide ${containerStyle} ${sizeStyle}`}
    >
      {isHigh || isMed ? (
        <ShieldAlert className="w-3.5 h-3.5" />
      ) : (
        <ShieldCheck className="w-3.5 h-3.5" />
      )}
      <span>{level} RISK</span>
    </span>
  );
};

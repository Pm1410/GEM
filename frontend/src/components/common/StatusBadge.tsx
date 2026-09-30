import React from 'react';
import { VerificationState } from '../../types';
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  state: VerificationState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  state,
  size = 'md',
  showLabel = true,
}) => {
  const getStyle = () => {
    switch (state) {
      case 'PASS':
        return {
          icon: Check,
          text: 'PASS',
          container: 'bg-[#124E59]/10 text-[#124E59] border-[#124E59]/35 hover:bg-[#124E59]/15 shadow-2xs',
          iconColor: 'text-[#124E59]',
        };
      case 'FAIL':
        return {
          icon: X,
          text: 'FAIL',
          container: 'bg-[#2A2826]/10 text-[#2A2826] border-[#2A2826]/40 font-bold shadow-2xs',
          iconColor: 'text-[#2A2826]',
        };
      case 'REVIEW':
        return {
          icon: AlertTriangle,
          text: 'REVIEW',
          container: 'bg-[#B7A08B]/25 text-[#3D3730] border-[#B7A08B]/60 font-bold shadow-2xs',
          iconColor: 'text-[#8A6D56]',
        };
      case 'UNVERIFIABLE':
        return {
          icon: HelpCircle,
          text: 'UNVERIFIABLE',
          container: 'bg-[#5F6675]/15 text-[#3D4452] border-[#5F6675]/40 font-bold shadow-2xs',
          iconColor: 'text-[#5F6675]',
        };
    }
  };

  const config = getStyle();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    md: 'text-xs px-3 py-1.5 gap-2 font-bold',
    lg: 'text-sm px-3.5 py-2 gap-2.5 font-bold',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono-tech tracking-wider uppercase transition-all ${sizeClasses} ${config.container}`}
      title={`Verification State: ${config.text}`}
    >
      <Icon className={`${iconSizes} ${config.iconColor} stroke-[2.7]`} />
      {showLabel && <span>{config.text}</span>}
    </span>
  );
};

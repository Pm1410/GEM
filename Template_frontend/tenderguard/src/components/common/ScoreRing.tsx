import React from 'react';

interface ScoreRingProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showSubtitle?: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label = 'Score',
  showSubtitle = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5DFD9"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeOpacity={0.8}
        />
        {/* Active progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#124E59"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-extrabold tracking-tight text-[#2A2826] font-mono-tech leading-none">
          {score}
        </span>
        {showSubtitle && (
          <span className="text-[11px] font-bold font-mono-tech tracking-wider text-[#5F6675] mt-1 uppercase">
            / 100
          </span>
        )}
      </div>
    </div>
  );
};

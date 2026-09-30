import React, { useState } from 'react';
import { Requirement, RequirementResult } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ChevronRight, Filter } from 'lucide-react';

interface RequirementNavigatorProps {
  requirements: Requirement[];
  results: RequirementResult[];
  selectedReqId: string;
  onSelectRequirement: (reqId: string) => void;
}

export const RequirementNavigator: React.FC<RequirementNavigatorProps> = ({
  requirements,
  results,
  selectedReqId,
  onSelectRequirement,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const resultMap = new Map(results.map((r) => [r.requirementId, r]));

  const filtered = requirements.filter((r) => {
    if (filterCategory === 'ALL') return true;
    return r.category === filterCategory;
  });

  const passedCount = results.filter((r) => r.state === 'PASS').length;
  const failedCount = results.filter((r) => r.state === 'FAIL').length;
  const reviewCount = results.filter((r) => r.state === 'REVIEW').length;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#E5DFD9] bg-white shadow-xs overflow-hidden">
      {/* Header with count and filter */}
      <div className="p-4 border-b border-[#E5DFD9] bg-[#FBF9F6] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-[#2A2826] tracking-tight">
            Requirements ({requirements.length})
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-mono-tech mt-1">
            <span className="text-[#124E59] font-bold">{passedCount} Pass</span>
            <span className="text-[#B7A08B]">&bull;</span>
            <span className="text-[#2A2826] font-bold">{failedCount} Fail</span>
            <span className="text-[#B7A08B]">&bull;</span>
            <span className="text-[#5F6675] font-bold">{reviewCount} Review</span>
          </div>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs px-2.5 py-1.5 bg-white border border-[#E5DFD9] rounded-lg text-[#2A2826] font-medium focus:outline-hidden focus:border-[#124E59] shadow-2xs"
        >
          <option value="ALL">All Categories</option>
          <option value="STATUTORY">Statutory</option>
          <option value="FINANCIAL">Financial</option>
          <option value="TECHNICAL">Technical</option>
          <option value="EXPERIENCE">Experience</option>
        </select>
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E5DFD9]">
        {filtered.map((req) => {
          const res = resultMap.get(req.id);
          const isSelected = req.id === selectedReqId;
          const globalIdx = requirements.findIndex((r) => r.id === req.id) + 1;

          return (
            <button
              key={req.id}
              onClick={() => onSelectRequirement(req.id)}
              className={`w-full p-3.5 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#124E59]/10 border-l-4 border-l-[#124E59]'
                  : 'hover:bg-[#FBF9F6]'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-xs font-mono-tech font-extrabold text-[#5F6675] shrink-0 mt-0.5 w-5">
                  #{globalIdx}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm leading-snug line-clamp-2 ${
                      isSelected ? 'text-[#124E59] font-bold' : 'text-[#2A2826] font-semibold'
                    }`}
                  >
                    {req.title}
                  </p>
                  <p className="text-xs text-[#5F6675] font-mono-tech mt-1">
                    {req.code} &bull; {req.mandatory ? 'Mandatory' : 'Optional'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {res && <StatusBadge state={res.state} size="sm" showLabel={false} />}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isSelected ? 'text-[#124E59] translate-x-0.5' : 'text-[#B7A08B]'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

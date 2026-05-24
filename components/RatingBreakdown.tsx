'use client';

import { Star } from 'lucide-react';

interface RatingBreakdownProps {
  distribution: Record<number, number>;
  totalCount: number;
  starFilter: number | null;
  onStarFilterChange: (star: number | null) => void;
}

export default function RatingBreakdown({
  distribution,
  totalCount,
  starFilter,
  onStarFilterChange,
}: RatingBreakdownProps) {
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-4 glass-premium-white p-5 rounded-[24px] border border-[rgba(232,227,216,0.45)] shadow-sm select-none">
      <div className="flex items-center justify-between pb-1">
        <h4 className="font-display text-xs font-semibold uppercase tracking-widest text-[#18181B]">Rating Distribution</h4>
        {starFilter !== null && (
          <button
            onClick={() => onStarFilterChange(null)}
            className="text-[10px] font-bold text-[#CA8A04] hover:text-[#18181B] uppercase tracking-wider spring-transition cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="space-y-3">
        {stars.map((star) => {
          const count = distribution[star] || 0;
          const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
          const isActiveFilter = starFilter === star;

          return (
            <button
              key={star}
              onClick={() => onStarFilterChange(isActiveFilter ? null : star)}
              className={`flex items-center w-full gap-3 text-left spring-transition px-2 py-1.5 rounded-lg group cursor-pointer ${
                isActiveFilter
                  ? 'bg-[#F5F0E8] ring-1 ring-[#CA8A04]'
                  : 'hover:bg-[#F5F0E8]'
              }`}
            >
              <div className="flex items-center gap-0.5 w-8 shrink-0">
                <span className="text-xs font-semibold text-[#18181B]">{star}</span>
                <Star className="h-3 w-3 fill-[#CA8A04] text-[#CA8A04]" />
              </div>

              <div className="relative flex-1 h-2 rounded-full bg-[rgba(232,227,216,0.8)] overflow-hidden">
                <div
                  className="h-full bg-[#CA8A04] spring-transition rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="w-10 text-right shrink-0">
                <span className="text-xs font-medium text-[#71717A] group-hover:text-[#18181B] transition-colors">
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-center text-[#71717A] font-light italic mt-2">
        Click any rating bar above to filter reviews by star rating.
      </p>
    </div>
  );
}

'use client';

import { Restaurant } from '@/lib/types';

export interface CandidateListItemProps {
  restaurant: Restaurant;
  onViewDetail: (id: string) => void;
  onSelect: (id: string) => void;
  isSelectedToday?: boolean;
  selectedCount?: number;
}

function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-sm font-medium text-stone-800">
      <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function CandidateListItem({
  restaurant,
  onViewDetail,
  onSelect,
  isSelectedToday = false,
  selectedCount = 0,
}: CandidateListItemProps) {
  const handleViewDetail = () => {
    onViewDetail(restaurant.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(restaurant.id);
  };

  return (
    <div
      className="bg-white border-b border-stone-100 last:border-b-0 px-4 py-3 cursor-pointer hover:bg-stone-50 active:bg-stone-100 transition-colors duration-150"
      onClick={handleViewDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleViewDetail();
        }
      }}
    >
      <div className="flex gap-3">
        {/* Restaurant Image Placeholder / Category Icon */}
        <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🍜</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Name + Rating/Price */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-stone-800 leading-tight truncate flex-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {restaurant.rating && <StarRating rating={restaurant.rating} />}
              {restaurant.avgPrice && (
                <span className="text-[13px] text-stone-500 whitespace-nowrap">
                  ¥{restaurant.avgPrice}
                </span>
              )}
            </div>
          </div>

          {/* Middle Row: Category + Distance */}
          <div className="flex items-center gap-2 text-[13px] text-stone-500 mb-1.5">
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
              {restaurant.category}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {formatDistance(restaurant.distance)}
            </span>
          </div>

          {/* Bottom Row: Address + Selected Badge */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] text-stone-400 truncate flex-1" title={restaurant.address}>
              {restaurant.address}
            </p>
            {isSelectedToday && (
              <span className="text-[11px] text-orange-500 font-medium whitespace-nowrap">
                今日已选
              </span>
            )}
            {selectedCount > 0 && !isSelectedToday && (
              <span className="text-[11px] text-stone-400 whitespace-nowrap">
                被选{selectedCount}次
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (shown on hover/active) */}
      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleViewDetail}
          className="flex-1 h-9 text-[13px] font-medium text-stone-500 bg-stone-100 rounded-lg hover:bg-stone-200 active:bg-stone-300 transition-colors duration-150"
        >
          查看详情
        </button>
        <button
          type="button"
          onClick={handleSelect}
          disabled={isSelectedToday}
          className={`
            flex-1 h-9 text-[13px] font-medium rounded-lg transition-colors duration-150
            ${isSelectedToday
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
            }
          `}
        >
          {isSelectedToday ? '已选这家' : '选这家'}
        </button>
      </div>
    </div>
  );
}

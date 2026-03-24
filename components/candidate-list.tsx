'use client';

import { useState, useMemo } from 'react';
import { Restaurant } from '@/lib/types';
import CandidateListItem from './candidate-list-item';

export type SortOption = 'distance' | 'rating' | 'price';

export interface CandidateListProps {
  restaurants: Restaurant[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onViewDetail: (id: string) => void;
  onSelect: (id: string) => void;
  todaySelectedIds?: Set<string>;
  selectionCounts?: Map<string, number>;
  onClose?: () => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: '距离最近', value: 'distance' },
  { label: '评分最高', value: 'rating' },
  { label: '价格最低', value: 'price' },
];

export default function CandidateList({
  restaurants,
  sortBy,
  onSortChange,
  onViewDetail,
  onSelect,
  todaySelectedIds = new Set(),
  selectionCounts = new Map(),
  onClose,
}: CandidateListProps) {
  const sortedRestaurants = useMemo(() => {
    const sorted = [...restaurants];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => a.distance - b.distance);
      case 'rating':
        return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'price':
        return sorted.sort((a, b) => (a.avgPrice ?? 0) - (b.avgPrice ?? 0));
      default:
        return sorted;
    }
  }, [restaurants, sortBy]);

  return (
    <div className="bg-white border-t border-stone-200">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-stone-800">
              全部餐厅
            </h2>
            <span className="text-[13px] text-stone-400">
              ({restaurants.length}家)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Pills */}
            <div className="flex bg-stone-100 rounded-lg p-0.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSortChange(option.value)}
                  className={`
                    h-7 px-3 text-[12px] font-medium
                    rounded-md transition-all duration-150
                    ${sortBy === option.value
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors duration-150"
                aria-label="关闭列表"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="divide-y divide-stone-100">
        {sortedRestaurants.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-[14px]">
            暂无符合条件的餐厅
          </div>
        ) : (
          sortedRestaurants.map((restaurant) => (
            <CandidateListItem
              key={restaurant.id}
              restaurant={restaurant}
              onViewDetail={onViewDetail}
              onSelect={onSelect}
              isSelectedToday={todaySelectedIds.has(restaurant.id)}
              selectedCount={selectionCounts.get(restaurant.id) ?? 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

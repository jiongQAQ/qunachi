'use client';

import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  distance: number;
  address: string;
  rating?: number;
  avgPrice?: number;
  businessStatus?: string;
}

export interface RecommendationCardProps {
  restaurant: Restaurant;
  reasons: string[];
  onViewDetail: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected?: boolean;
  selectedCount?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}

function truncateAddress(address: string): string {
  // Extract district/street portion from address
  // Common patterns: "北京市朝阳区三里屯路" or "上海市浦东新区张江镇"
  const parts = address.split(/[省市区县镇街道路]/);
  if (parts.length >= 3) {
    // Return the last meaningful segment (usually district + street)
    const district = parts.slice(1, -1).join('').slice(-8);
    return district || address.slice(0, 15);
  }
  return address.slice(0, 15);
}

// ============================================================================
// Star Rating Component
// ============================================================================

interface StarRatingProps {
  rating: number;
}

function StarRating({ rating }: StarRatingProps) {
  return (
    <span className="flex items-center gap-1 text-[15px] font-medium text-stone-800">
      <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

// ============================================================================
// Loading Spinner Component
// ============================================================================

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Recommendation Card Component
// ============================================================================

export default function RecommendationCard({
  restaurant,
  reasons,
  onViewDetail,
  onSelect,
  isSelected = false,
  selectedCount = 0,
}: RecommendationCardProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelecting(true);
    try {
      await onSelect(restaurant.id);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleViewDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetail(restaurant.id);
  };

  const handleCardClick = () => {
    onViewDetail(restaurant.id);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      {/* Card Header: Category Tag + Rating Row */}
      <div className="flex justify-between items-start gap-3 mb-2.5">
        {/* Left: Category Tag */}
        <span className="inline-block text-[11px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
          {restaurant.category}
        </span>

        {/* Right: Rating + Price Row */}
        <div className="flex items-center gap-3">
          {restaurant.rating && (
            <StarRating rating={restaurant.rating} />
          )}
          {restaurant.avgPrice && (
            <span className="text-[13px] text-stone-500 whitespace-nowrap">
              人均{restaurant.avgPrice}元
            </span>
          )}
        </div>
      </div>

      {/* Restaurant Name */}
      <h3 className="text-[17px] font-semibold text-stone-800 leading-tight mb-1.5">
        {restaurant.name}
      </h3>

      {/* Distance + Address */}
      <div className="flex items-center gap-2 text-[13px] text-stone-500 mb-2.5">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {formatDistance(restaurant.distance)}
        </span>
        <span className="text-stone-300">·</span>
        <span className="truncate flex-1" title={restaurant.address}>
          {truncateAddress(restaurant.address)}
        </span>
      </div>

      {/* Recommendation Reasons */}
      {reasons.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {reasons.slice(0, 2).map((reason, index) => (
            <p
              key={index}
              className="text-[13px] text-stone-500 px-3 py-2 bg-stone-100 rounded-md leading-snug"
            >
              <span className="mr-1">💡</span>
              {reason}
            </p>
          ))}
        </div>
      )}

      {/* Selected Status Badge */}
      {isSelected && (
        <div className="mb-3 flex items-center gap-1.5 text-[12px] text-orange-600 font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          已选 {selectedCount > 1 && `(${selectedCount}次)}`}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {/* View Detail Button */}
        <button
          type="button"
          onClick={handleViewDetailClick}
          className="flex-1 h-11 text-[14px] font-medium text-orange-500 bg-transparent border border-orange-200 rounded-lg hover:bg-orange-50 active:bg-orange-100 transition-colors duration-150"
        >
          查看详情
        </button>

        {/* Select Button */}
        <button
          type="button"
          onClick={handleSelectClick}
          disabled={isSelecting}
          className={`
            flex-1 h-11 text-[14px] font-medium rounded-lg
            transition-all duration-150
            ${isSelected
              ? 'bg-orange-300 text-white cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 active:scale-[0.98]'
            }
            ${isSelecting ? 'opacity-80' : ''}
          `}
        >
          {isSelecting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              处理中...
            </span>
          ) : isSelected ? (
            '已选这家'
          ) : (
            '选这家'
          )}
        </button>
      </div>
    </div>
  );
}

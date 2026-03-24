'use client';

import { useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface RestaurantDetail {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: number;
  rating?: number;
  avgPrice?: number;
  businessStatus?: string;
  phone?: string;
}

export interface RestaurantDetailDrawerProps {
  restaurant: RestaurantDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onOpenNavigation: (id: string) => void;
  onCopy: (text: string, type: 'name' | 'address') => void;
  // 历史信息
  selectedCount?: number;
  lastSelectedAt?: string;
  isSelectedToday?: boolean;
  // 推荐理由
  reasons?: string[];
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

function formatLastSelectedDays(lastSelectedAt?: string): string {
  if (!lastSelectedAt) return '';
  const date = new Date(lastSelectedAt);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '1 天前';
  return `${diffDays} 天前`;
}

// ============================================================================
// Icons
// ============================================================================

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function NavigationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function RestaurantDetailDrawer({
  restaurant,
  isOpen,
  onClose,
  onSelect,
  onOpenNavigation,
  onCopy,
  selectedCount = 0,
  lastSelectedAt,
  isSelectedToday = false,
  reasons = [],
}: RestaurantDetailDrawerProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleSelect = useCallback(async () => {
    if (restaurant) {
      await onSelect(restaurant.id);
    }
  }, [restaurant, onSelect]);

  const handleCopyName = useCallback(() => {
    if (restaurant) {
      onCopy(restaurant.name, 'name');
    }
  }, [restaurant, onCopy]);

  const handleCopyAddress = useCallback(() => {
    if (restaurant) {
      onCopy(restaurant.address, 'address');
    }
  }, [restaurant, onCopy]);

  const handleOpenNavigation = useCallback(() => {
    if (restaurant) {
      onOpenNavigation(restaurant.id);
    }
  }, [restaurant, onOpenNavigation]);

  if (!isOpen || !restaurant) {
    return null;
  }

  const isBusinessOpen = restaurant.businessStatus === '营业中';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Drawer */}
      <div
        className={`
          w-full max-w-md md:max-w-[480px]
          bg-white md:rounded-2xl rounded-t-2xl
          max-h-[90vh] overflow-y-auto
          animate-slide-up md:animate-fade-in
          md:shadow-xl
        `}
      >
        {/* Content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              {/* Restaurant Name */}
              <h2 className="text-[22px] font-bold text-stone-800 leading-tight mb-2">
                {restaurant.name}
              </h2>
              {/* Category Tag */}
              <span className="inline-block text-[12px] font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
                {restaurant.category}
              </span>
            </div>
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors duration-150 flex-shrink-0"
              aria-label="关闭"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 py-3 border-y border-stone-100">
            {/* Rating */}
            {restaurant.rating && (
              <div className="flex items-center gap-1.5 text-[14px]">
                <StarIcon />
                <span className="font-medium text-stone-800">{restaurant.rating.toFixed(1)}</span>
              </div>
            )}
            {/* Avg Price */}
            {restaurant.avgPrice && (
              <div className="flex items-center gap-1.5 text-[14px] text-stone-500">
                <span>人均{restaurant.avgPrice}元</span>
              </div>
            )}
            {/* Distance */}
            <div className="flex items-center gap-1.5 text-[14px] text-stone-500">
              <MapPinIcon />
              <span>{formatDistance(restaurant.distance)}</span>
            </div>
          </div>

          {/* Info Section */}
          <div className="py-4 space-y-3">
            {/* Business Status */}
            <div className="flex items-center gap-2 text-[14px]">
              <span className={`w-2 h-2 rounded-full ${isBusinessOpen ? 'bg-green-500' : 'bg-stone-300'}`} />
              <span className={isBusinessOpen ? 'text-green-600' : 'text-stone-400'}>
                {restaurant.businessStatus || '营业状态未知'}
              </span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2.5 text-[14px] text-stone-500">
              <MapPinIcon />
              <span className="flex-1">{restaurant.address}</span>
            </div>

            {/* Phone */}
            {restaurant.phone && (
              <div className="flex items-center gap-2.5 text-[14px] text-stone-500">
                <PhoneIcon />
                <span>{restaurant.phone}</span>
              </div>
            )}
          </div>

          {/* Recommendation Reasons */}
          {reasons.length > 0 && (
            <div className="py-4 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <LightbulbIcon />
                <span className="text-[13px] font-semibold text-stone-400 uppercase tracking-wide">
                  推荐理由
                </span>
              </div>
              <div className="space-y-2">
                {reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2 text-[14px] text-stone-500">
                    <span className="text-orange-400 font-medium mt-0.5">·</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Info */}
          {(selectedCount > 0 || lastSelectedAt || isSelectedToday) && (
            <div className="py-4 border-t border-stone-100">
              <span className="text-[13px] font-semibold text-stone-400 uppercase tracking-wide mb-3 block">
                历史记录
              </span>
              <div className="flex gap-6">
                {isSelectedToday && (
                  <div className="flex items-center gap-1.5 text-[14px] text-orange-500 font-medium">
                    <CheckCircleIcon />
                    <span>今天已选过</span>
                  </div>
                )}
                {selectedCount > 0 && (
                  <div className="text-[14px] text-stone-500">
                    累计被选 <span className="font-medium text-stone-700">{selectedCount}</span> 次
                  </div>
                )}
                {lastSelectedAt && !isSelectedToday && (
                  <div className="text-[14px] text-stone-500">
                    上次选择：{formatLastSelectedDays(lastSelectedAt)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t border-stone-100 p-4 space-y-3">
          {/* Primary Action Buttons */}
          <div className="flex gap-3">
            {/* Open Navigation Button */}
            <button
              type="button"
              onClick={handleOpenNavigation}
              className="flex-1 h-12 flex items-center justify-center gap-2 text-[15px] font-medium text-orange-500 bg-transparent border border-orange-200 rounded-xl hover:bg-orange-50 active:bg-orange-100 transition-all duration-150"
            >
              <NavigationIcon />
              打开导航
            </button>

            {/* Select Button */}
            <button
              type="button"
              onClick={handleSelect}
              disabled={isSelectedToday}
              className={`
                flex-[2] h-12 text-[16px] font-semibold rounded-xl
                transition-all duration-150
                ${isSelectedToday
                  ? 'bg-orange-200 text-orange-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 active:scale-[0.98]'
                }
              `}
            >
              {isSelectedToday ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircleIcon />
                  已选这家
                </span>
              ) : (
                '选这家'
              )}
            </button>
          </div>

          {/* Copy Buttons */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={handleCopyName}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-stone-400 hover:text-stone-600 transition-colors duration-150"
            >
              <CopyIcon />
              复制店名
            </button>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-stone-400 hover:text-stone-600 transition-colors duration-150"
            >
              <CopyIcon />
              复制地址
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 250ms ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 250ms ease-out;
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Restaurant, FilterCriteria, ScoredRestaurant, RecommendationReason } from '@/lib/types';
import { generateCandidatePool } from '@/lib/candidate-pool';
import { generateTop3Recommendation } from '@/lib/recommendation';
import { generateReasons } from '@/lib/recommendation-reason';
import {
  recordSelection,
  getSelectionCount,
  getLastSelectedTime,
  getLocalHistory,
  getRecentBatches,
  addRecentBatch,
} from '@/lib/local-history';
import { useGeolocation } from '@/components/use-geolocation';
import { AddressInput } from '@/components/address-input';
import FilterBar from '@/components/filter-bar';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import RecommendationCard from '@/components/recommendation-card';
import CandidateList from '@/components/candidate-list';
import RestaurantDetailDrawer from '@/components/restaurant-detail-drawer';
import { SuccessToast } from '@/components/success-toast';

// ============================================================================
// Types
// ============================================================================

interface HomeState {
  address: string;
  position: { lat: number; lng: number } | null;
  isLocating: boolean;
  locationError: string | null;
  isGeocoding: boolean;
  isSearching: boolean;
  searchError: string | null;
  rawRestaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  recommendations: ScoredRestaurant[];
  recentBatchIds: string[];
  filters: FilterCriteria;
  sortBy: 'distance' | 'rating' | 'price';
  selectedRestaurant: Restaurant | null;
  isDetailOpen: boolean;
  showAllCandidates: boolean;
  selectionSuccess: string | null;
  todaySelectedIds: Set<string>;
}

type SortOption = 'distance' | 'rating' | 'price';

// ============================================================================
// Initial State
// ============================================================================

function getInitialState(): HomeState {
  return {
    address: '',
    position: null,
    isLocating: false,
    locationError: null,
    isGeocoding: false,
    isSearching: false,
    searchError: null,
    rawRestaurants: [],
    filteredRestaurants: [],
    recommendations: [],
    recentBatchIds: [],
    filters: {
      radius: 500,
      minPrice: undefined,
      maxPrice: undefined,
      categories: undefined,
      excludeCategories: [],
    },
    sortBy: 'distance',
    selectedRestaurant: null,
    isDetailOpen: false,
    showAllCandidates: false,
    selectionSuccess: null,
    todaySelectedIds: new Set(),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function poiToRestaurant(poi: {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  type: string;
  phone?: string;
}): Restaurant {
  // Extract main category from type string (e.g., "中餐|江浙菜" -> "江浙菜")
  const typeParts = poi.type.split('|');
  const category = typeParts.length > 1 ? typeParts[1] : typeParts[0];

  return {
    id: poi.id,
    name: poi.name,
    address: poi.address || '',
    distance: poi.distance,
    category: category || '未知',
    lat: poi.lat,
    lng: poi.lng,
    phone: poi.phone,
    source: 'amap',
  };
}

function buildCategoryHistory(): Map<string, number> {
  const history = getLocalHistory();
  const categoryCount = new Map<string, number>();

  Object.values(history.restaurants).forEach((record) => {
    if (record.lastSeenCategory) {
      categoryCount.set(
        record.lastSeenCategory,
        (categoryCount.get(record.lastSeenCategory) ?? 0) + record.selectedCount
      );
    }
  });

  return categoryCount;
}

function getTodaySelectedIds(): Set<string> {
  const history = getLocalHistory();
  const today = new Date().toDateString();
  const todayIds = new Set<string>();

  Object.entries(history.restaurants).forEach(([id, record]) => {
    if (record.lastSelectedAt) {
      const recordDate = new Date(record.lastSelectedAt).toDateString();
      if (recordDate === today) {
        todayIds.add(id);
      }
    }
  });

  return todayIds;
}

function getReasonsForRestaurant(
  restaurantId: string,
  allCandidates: Restaurant[],
  filterCriteria: FilterCriteria,
  todaySelectedIds: Set<string>
): string[] {
  const restaurant = allCandidates.find((r) => r.id === restaurantId);
  if (!restaurant) return [];

  const categoryHistory = buildCategoryHistory();
  const reasons = generateReasons(
    restaurant,
    allCandidates,
    filterCriteria,
    categoryHistory,
    todaySelectedIds
  );

  return reasons.map((r) => r.text);
}

// ============================================================================
// Main Component
// ============================================================================

export default function HomePage() {
  const [state, setState] = useState<HomeState>(getInitialState);
  const {
    position: geoPosition,
    error: geoError,
    isLoading: isGeoLoading,
    requestLocation,
  } = useGeolocation();

  // Sync geolocation position to state
  useEffect(() => {
    if (geoPosition) {
      setState((prev) => ({
        ...prev,
        position: geoPosition,
        isLocating: false,
        locationError: null,
      }));
    }
  }, [geoPosition]);

  // When position is available, trigger search with current filters
  useEffect(() => {
    if (state.position && !state.isGeocoding) {
      searchRestaurants(state.position.lat, state.position.lng, state.filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.position, state.filters.radius]);

  // Handle geolocation error
  useEffect(() => {
    if (geoError) {
      setState((prev) => ({
        ...prev,
        locationError: geoError,
        isLocating: false,
      }));
    }
  }, [geoError]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleUseLocation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLocating: true,
      locationError: null,
    }));
    requestLocation();
  }, [requestLocation]);

  const handleAddressSubmit = useCallback(async (address: string) => {
    if (!address.trim()) return;

    setState((prev) => ({
      ...prev,
      isGeocoding: true,
      searchError: null,
      address,
    }));

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setState((prev) => ({
          ...prev,
          position: { lat: data.data.lat, lng: data.data.lng },
          isGeocoding: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isGeocoding: false,
          searchError: data.error || '地址解析失败',
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        isGeocoding: false,
        searchError: '地址解析请求失败，请重试',
      }));
    }
  }, []);

  const searchRestaurants = useCallback(
    async (lat: number, lng: number, filters: FilterCriteria) => {
      setState((prev) => ({
        ...prev,
        isSearching: true,
        searchError: null,
      }));

      try {
        const res = await fetch('/api/poi/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            radius: filters.radius,
          }),
        });
        const data = await res.json();

        if (data.success && data.data) {
          const rawRestaurants = data.data.map(poiToRestaurant);
          updateRecommendations(rawRestaurants, filters);
        } else {
          setState((prev) => ({
            ...prev,
            isSearching: false,
            searchError: data.error || '周边搜索失败',
          }));
        }
      } catch {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          searchError: '搜索请求失败，请重试',
        }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateRecommendations = useCallback(
    (rawRestaurants: Restaurant[], filters: FilterCriteria) => {
      const recentBatches = getRecentBatches();
      const categoryHistory = buildCategoryHistory();
      const todayIds = getTodaySelectedIds();

      // Generate candidate pool from raw results
      const pool = generateCandidatePool(rawRestaurants, filters);

      // Score each restaurant with history context
      const scoredWithReasons = pool.filteredRestaurants.map((restaurant) => {
        const history = getLocalHistory().restaurants[restaurant.id];
        const reasons = generateReasons(
          restaurant,
          pool.filteredRestaurants,
          filters,
          categoryHistory,
          todayIds
        );
        return {
          restaurant,
          score: 0, // Score not needed for top3 generation here
          reasons,
        };
      });

      // Generate top 3 recommendations
      const result = generateTop3Recommendation(
        pool.filteredRestaurants,
        filters,
        recentBatches.flat()
      );

      // Attach reasons to the top3 results
      const recommendationsWithReasons = result.top3.map((scored) => {
        const existing = scoredWithReasons.find(
          (s) => s.restaurant.id === scored.restaurant.id
        );
        return {
          ...scored,
          reasons: existing?.reasons ?? scored.reasons,
        };
      });

      setState((prev) => ({
        ...prev,
        rawRestaurants,
        filteredRestaurants: pool.filteredRestaurants,
        recommendations: recommendationsWithReasons,
        recentBatchIds: recentBatches.flat(),
        isSearching: false,
        isGeocoding: false,
      }));

      // Record this batch
      addRecentBatch(recommendationsWithReasons.map((r) => r.restaurant.id));
    },
    []
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterCriteria) => {
      setState((prev) => {
        const updated = { ...prev, filters: newFilters };
        // Re-generate recommendations from existing raw results
        if (prev.rawRestaurants.length > 0) {
          const recentBatches = getRecentBatches();
          const categoryHistory = buildCategoryHistory();
          const todayIds = getTodaySelectedIds();

          const pool = generateCandidatePool(prev.rawRestaurants, newFilters);

          const scoredWithReasons = pool.filteredRestaurants.map((restaurant) => {
            const reasons = generateReasons(
              restaurant,
              pool.filteredRestaurants,
              newFilters,
              categoryHistory,
              todayIds
            );
            return { restaurant, score: 0, reasons };
          });

          const result = generateTop3Recommendation(
            pool.filteredRestaurants,
            newFilters,
            recentBatches.flat()
          );

          const recommendationsWithReasons = result.top3.map((scored) => {
            const existing = scoredWithReasons.find(
              (s) => s.restaurant.id === scored.restaurant.id
            );
            return {
              ...scored,
              reasons: existing?.reasons ?? scored.reasons,
            };
          });

          const newBatchIds = recommendationsWithReasons.map((r) => r.restaurant.id);

          return {
            ...updated,
            filteredRestaurants: pool.filteredRestaurants,
            recommendations: recommendationsWithReasons,
            recentBatchIds: newBatchIds,
          };
        }
        return updated;
      });
    },
    []
  );

  const handleRefreshRecommendations = useCallback(() => {
    if (state.filteredRestaurants.length === 0) return;

    const recentBatches = getRecentBatches();
    const result = generateTop3Recommendation(
      state.filteredRestaurants,
      state.filters,
      recentBatches.flat()
    );

    // Attach reasons
    const categoryHistory = buildCategoryHistory();
    const todayIds = getTodaySelectedIds();

    const recommendationsWithReasons = result.top3.map((scored) => {
      const reasons = generateReasons(
        scored.restaurant,
        state.filteredRestaurants,
        state.filters,
        categoryHistory,
        todayIds
      );
      return { ...scored, reasons };
    });

    setState((prev) => ({
      ...prev,
      recommendations: recommendationsWithReasons,
    }));

    addRecentBatch(recommendationsWithReasons.map((r) => r.restaurant.id));
  }, [state.filteredRestaurants, state.filters]);

  const handleViewDetail = useCallback(
    (id: string) => {
      const restaurant =
        state.recommendations.find((r) => r.restaurant.id === id)?.restaurant ??
        state.filteredRestaurants.find((r) => r.id === id);

      if (restaurant) {
        setState((prev) => ({
          ...prev,
          selectedRestaurant: restaurant,
          isDetailOpen: true,
        }));
      }
    },
    [state.recommendations, state.filteredRestaurants]
  );

  const handleSelectRestaurant = useCallback(
    (id: string) => {
      const restaurant =
        state.recommendations.find((r) => r.restaurant.id === id)?.restaurant ??
        state.filteredRestaurants.find((r) => r.id === id);

      if (!restaurant) return;

      recordSelection({
        id: restaurant.id,
        name: restaurant.name,
        category: restaurant.category,
      });

      setState((prev) => {
        const newTodayIds = new Set(prev.todaySelectedIds);
        newTodayIds.add(restaurant.id);
        return {
          ...prev,
          todaySelectedIds: newTodayIds,
          selectionSuccess: `已选择：${restaurant.name}`,
          isDetailOpen: false,
        };
      });
    },
    [state.recommendations, state.filteredRestaurants]
  );

  const handleCloseDetail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDetailOpen: false,
    }));
  }, []);

  const handleOpenNavigation = useCallback(
    (id: string) => {
      const restaurant =
        state.recommendations.find((r) => r.restaurant.id === id)?.restaurant ??
        state.filteredRestaurants.find((r) => r.id === id);

      if (!restaurant) return;

      // Open in external maps app
      const query = encodeURIComponent(restaurant.name);
      const url = `https://uri.amap.com/navigation?to=${restaurant.lng},${restaurant.lat},${query}&mode=car&callnative=1`;
      window.open(url, '_blank');
    },
    [state.recommendations, state.filteredRestaurants]
  );

  const handleCopy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).catch(() => {});
      setState((prev) => ({
        ...prev,
        selectionSuccess: '已复制到剪贴板',
      }));
    },
    []
  );

  const handleViewAllCandidates = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAllCandidates: true,
    }));
  }, []);

  const handleCloseCandidates = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAllCandidates: false,
    }));
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setState((prev) => ({
      ...prev,
      sortBy: sort,
    }));
  }, []);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    state.rawRestaurants.forEach((r) => {
      // Extract main category
      const parts = r.category.split('|');
      cats.add(parts[parts.length > 1 ? 1 : 0]);
    });
    return Array.from(cats);
  }, [state.rawRestaurants]);

  const selectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    state.filteredRestaurants.forEach((r) => {
      const count = getSelectionCount(r.id);
      if (count > 0) counts.set(r.id, count);
    });
    return counts;
  }, [state.filteredRestaurants]);

  const searchedAddress = state.address;

  const isLoading = state.isGeocoding || state.isSearching || state.isLocating;

  const selectedRestaurantReasons = useMemo(() => {
    if (!state.selectedRestaurant) return [];
    return getReasonsForRestaurant(
      state.selectedRestaurant.id,
      state.filteredRestaurants,
      state.filters,
      state.todaySelectedIds
    );
  }, [
    state.selectedRestaurant,
    state.filteredRestaurants,
    state.filters,
    state.todaySelectedIds,
  ]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#FBF8F4]">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-stone-800 leading-tight">
            去哪吃
          </h1>
          <p className="text-[13px] text-stone-500 mt-0.5">
            今天吃什么？系统帮你决定
          </p>
          {searchedAddress && (
            <div className="flex items-center gap-2 mt-2 text-[13px]">
              <svg
                className="w-3.5 h-3.5 text-stone-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-stone-600 font-medium truncate">{searchedAddress}</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-400">{state.filters.radius}m</span>
            </div>
          )}
        </div>
      </header>

      {/* Search Input */}
      <div className="bg-white border-b border-stone-100 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <AddressInput
                value={state.address}
                onChange={(val) => setState((prev) => ({ ...prev, address: val }))}
                onAddressSelect={handleAddressSubmit}
                placeholder="输入地址或使用当前位置..."
                disabled={isLoading}
                suggestions={[]}
                showSuggestions={false}
              />
            </div>
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLoading}
              className={`
                w-11 h-11 flex items-center justify-center rounded-lg border transition-all duration-150 flex-shrink-0
                ${isLoading
                  ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                  : 'border-orange-400 text-orange-500 hover:bg-orange-50 active:bg-orange-100'
                }
              `}
              aria-label="使用当前位置"
            >
              {state.isLocating ? (
                <svg
                  className="w-5 h-5 animate-spin"
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
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleAddressSubmit(state.address)}
              disabled={isLoading || !state.address.trim()}
              className={`
                h-11 px-5 text-[15px] font-medium rounded-lg transition-all duration-150 flex-shrink-0
                ${!state.address.trim() || isLoading
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 active:scale-[0.98]'
                }
              `}
            >
              搜索
            </button>
          </div>

          {/* Location Error */}
          {state.locationError && (
            <p className="mt-2 text-[13px] text-red-500">{state.locationError}</p>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={state.filters}
        onFiltersChange={handleFiltersChange}
        availableCategories={availableCategories}
      />

      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="p-4">
            <LoadingSkeleton count={3} type="card" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && state.searchError && (
          <div className="p-4">
            <ErrorState
              title="搜索失败"
              description={state.searchError}
              onRetry={
                state.position
                  ? () => searchRestaurants(state.position!.lat, state.position!.lng, state.filters)
                  : undefined
              }
            />
          </div>
        )}

        {/* Empty State - No search yet */}
        {!isLoading && !state.searchError && state.rawRestaurants.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="开始探索附近美食"
              description="输入地址或使用定位，系统将为你推荐附近的餐厅"
              icon="restaurant"
            />
          </div>
        )}

        {/* No Results after search */}
        {!isLoading && !state.searchError && state.rawRestaurants.length > 0 && state.filteredRestaurants.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="没有符合条件的餐厅"
              description="试试调整筛选条件，或者扩大搜索半径"
              icon="search"
              action={{
                label: '重置筛选',
                onClick: () =>
                  handleFiltersChange({
                    radius: 1000,
                    minPrice: undefined,
                    maxPrice: undefined,
                    categories: undefined,
                    excludeCategories: [],
                  }),
              }}
            />
          </div>
        )}

        {/* Recommendations */}
        {!isLoading && !state.searchError && state.recommendations.length > 0 && (
          <div className="p-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[16px] font-semibold text-stone-800">
                  为你推荐
                </h2>
                <p className="text-[12px] text-stone-400 mt-0.5">
                  共{state.filteredRestaurants.length}家，符合条件
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshRecommendations}
                className="flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium text-orange-500 bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 active:bg-orange-200 transition-colors duration-150"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                换一批
              </button>
            </div>

            {/* Recommendation Cards */}
            <div className="space-y-3">
              {state.recommendations.map((scored) => (
                <RecommendationCard
                  key={scored.restaurant.id}
                  restaurant={scored.restaurant}
                  reasons={scored.reasons.map((r) => r.text)}
                  onViewDetail={handleViewDetail}
                  onSelect={handleSelectRestaurant}
                  isSelected={state.todaySelectedIds.has(scored.restaurant.id)}
                  selectedCount={getSelectionCount(scored.restaurant.id)}
                />
              ))}
            </div>

            {/* View All Button */}
            {state.filteredRestaurants.length > 3 && !state.showAllCandidates && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleViewAllCandidates}
                  className="text-[14px] text-stone-500 hover:text-orange-500 transition-colors duration-150"
                >
                  查看全部{state.filteredRestaurants.length}家餐厅
                  <svg
                    className="inline w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Candidate List (Full Screen) */}
      {state.showAllCandidates && (
        <div className="fixed inset-0 z-40 bg-[#FBF8F4] overflow-y-auto">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-stone-800">
                全部餐厅
              </h2>
              <button
                type="button"
                onClick={handleCloseCandidates}
                className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors duration-150"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            <CandidateList
              restaurants={state.filteredRestaurants}
              sortBy={state.sortBy}
              onSortChange={handleSortChange}
              onViewDetail={handleViewDetail}
              onSelect={handleSelectRestaurant}
              todaySelectedIds={state.todaySelectedIds}
              selectionCounts={selectionCounts}
            />
          </div>
        </div>
      )}

      {/* Restaurant Detail Drawer */}
      <RestaurantDetailDrawer
        restaurant={state.selectedRestaurant}
        isOpen={state.isDetailOpen}
        onClose={handleCloseDetail}
        onSelect={handleSelectRestaurant}
        onOpenNavigation={handleOpenNavigation}
        onCopy={handleCopy}
        selectedCount={
          state.selectedRestaurant
            ? getSelectionCount(state.selectedRestaurant.id)
            : 0
        }
        lastSelectedAt={
          state.selectedRestaurant
            ? getLastSelectedTime(state.selectedRestaurant.id) ?? undefined
            : undefined
        }
        isSelectedToday={
          state.selectedRestaurant
            ? state.todaySelectedIds.has(state.selectedRestaurant.id)
            : false
        }
        reasons={selectedRestaurantReasons}
      />

      {/* Success Toast */}
      <SuccessToast
        message={state.selectionSuccess ?? ''}
        visible={!!state.selectionSuccess}
        onClose={() => setState((prev) => ({ ...prev, selectionSuccess: null }))}
      />
    </div>
  );
}

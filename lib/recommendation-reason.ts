import {
  Restaurant,
  FilterCriteria,
  ScoredRestaurant,
  RecommendationReason,
  RecommendationReasonType,
} from './types';

// Priority ordering for reasons (lower number = higher priority)
const REASON_PRIORITY: Record<RecommendationReasonType, number> = {
  nearby_top_rating: 1,
  price_match: 2,
  distance: 3,
  rare_category: 4,
  not_selected_today: 5,
  category_match: 6,
  high_rating: 7,
};

/**
 * Check if this restaurant is the top-rated among all candidates.
 */
export function isNearbyTopRating(
  restaurant: Restaurant,
  allCandidates: Restaurant[]
): boolean {
  if (!restaurant.rating || allCandidates.length < 2) return false;
  const maxRating = Math.max(...allCandidates.map((r) => r.rating ?? 0));
  return restaurant.rating === maxRating;
}

/**
 * Check if the restaurant's price falls within the filter criteria range.
 */
export function isPriceMatch(
  restaurant: Restaurant,
  filterCriteria: FilterCriteria
): boolean {
  if (!restaurant.avgPrice) return false;
  const { minPrice, maxPrice } = filterCriteria;
  if (minPrice !== undefined && restaurant.avgPrice < minPrice) return false;
  if (maxPrice !== undefined && restaurant.avgPrice > maxPrice) return false;
  return true;
}

/**
 * Check if restaurant distance is in the top 30% of all candidates (lower distance = better).
 */
export function isDistanceAdvantage(
  restaurant: Restaurant,
  allCandidates: Restaurant[]
): boolean {
  if (allCandidates.length < 2) return false;
  const distances = allCandidates.map((r) => r.distance).sort((a, b) => a - b);
  const percentileIndex = Math.ceil(distances.length * 0.3) - 1;
  const threshold = distances[Math.max(0, percentileIndex)];
  return restaurant.distance <= threshold;
}

/**
 * Check if this category has been rarely selected (based on selection history).
 * Considers a category "rare" if it has been selected 2 or fewer times.
 */
export function isRareCategory(
  category: string,
  categorySelectionHistory: Map<string, number>
): boolean {
  const count = categorySelectionHistory.get(category) ?? 0;
  return count <= 2;
}

/**
 * Check if the restaurant's category matches the user's filter criteria preferences.
 */
export function isCategoryMatch(
  restaurant: Restaurant,
  filterCriteria: FilterCriteria
): boolean {
  if (!filterCriteria.categories || filterCriteria.categories.length === 0) {
    return false;
  }
  return filterCriteria.categories.includes(restaurant.category);
}

/**
 * Check if the restaurant has a high rating relative to candidates.
 * This is considered true if rating is in the top 30% but not the absolute top.
 */
export function isHighRating(
  restaurant: Restaurant,
  allCandidates: Restaurant[]
): boolean {
  if (!restaurant.rating || allCandidates.length < 3) return false;
  // Already handled by nearby_top_rating, so skip the top one
  const ratings = allCandidates
    .map((r) => r.rating ?? 0)
    .sort((a, b) => b - a);
  const topRating = ratings[0];
  if (restaurant.rating === topRating) return false;
  const percentileIndex = Math.ceil(ratings.length * 0.3) - 1;
  const threshold = ratings[percentileIndex];
  return restaurant.rating >= threshold;
}

/**
 * Check if this restaurant was not selected today.
 * Requires a Set of restaurant IDs selected today (passed from caller).
 */
export function isNotSelectedToday(
  restaurantId: string,
  selectedTodayIds: Set<string>
): boolean {
  return !selectedTodayIds.has(restaurantId);
}

/**
 * Generate a friendly Chinese text for a recommendation reason.
 */
export function getReasonText(
  type: RecommendationReasonType,
  params: {
    distance?: number;
    avgPrice?: number;
    category?: string;
    rating?: number;
  }
): string {
  switch (type) {
    case 'distance':
      return `距离仅${params.distance ?? '?'}米，比较近`;
    case 'rare_category':
      return '这类餐厅你已经很久没吃了';
    case 'price_match':
      return `人均${params.avgPrice ?? '?'}元，符合你的预算`;
    case 'category_match':
      return `是你喜欢的${params.category ?? '这类'}类`;
    case 'high_rating':
      return `评分${params.rating ?? '?'}星，口碑不错`;
    case 'not_selected_today':
      return '今天还没选过这家';
    case 'nearby_top_rating':
      return '在附近餐厅中评分最高';
    default:
      return '';
  }
}

/**
 * Build a RecommendationReason object from a type and restaurant context.
 */
function buildReason(
  type: RecommendationReasonType,
  restaurant: Restaurant
): RecommendationReason {
  return {
    type,
    text: getReasonText(type, {
      distance: Math.round(restaurant.distance),
      avgPrice: restaurant.avgPrice,
      category: restaurant.category,
      rating: restaurant.rating,
    }),
    priority: REASON_PRIORITY[type],
  };
}

/**
 * Generate all applicable reasons for a restaurant.
 * Reasons are sorted by priority (lower number = higher priority).
 */
export function generateReasons(
  restaurant: Restaurant,
  allCandidates: Restaurant[],
  filterCriteria: FilterCriteria,
  categorySelectionHistory: Map<string, number>,
  selectedTodayIds: Set<string>
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];

  // 1. Nearby top rating (must have multiple candidates and be the top)
  if (isNearbyTopRating(restaurant, allCandidates)) {
    reasons.push(buildReason('nearby_top_rating', restaurant));
  }

  // 2. Price match
  if (isPriceMatch(restaurant, filterCriteria)) {
    reasons.push(buildReason('price_match', restaurant));
  }

  // 3. Distance advantage (top 30% closest)
  if (isDistanceAdvantage(restaurant, allCandidates)) {
    reasons.push(buildReason('distance', restaurant));
  }

  // 4. Rare category
  if (isRareCategory(restaurant.category, categorySelectionHistory)) {
    reasons.push(buildReason('rare_category', restaurant));
  }

  // 5. Not selected today
  if (isNotSelectedToday(restaurant.id, selectedTodayIds)) {
    reasons.push(buildReason('not_selected_today', restaurant));
  }

  // 6. Category match (user preference)
  if (isCategoryMatch(restaurant, filterCriteria)) {
    reasons.push(buildReason('category_match', restaurant));
  }

  // 7. High rating (top 30% but not #1)
  if (isHighRating(restaurant, allCandidates)) {
    reasons.push(buildReason('high_rating', restaurant));
  }

  // Sort by priority
  reasons.sort((a, b) => a.priority - b.priority);

  return reasons;
}

/**
 * Select the top N reasons (default: 2) after sorting by priority.
 */
export function selectTopReasons(
  reasons: RecommendationReason[],
  maxReasons: number = 2
): RecommendationReason[] {
  return [...reasons].sort((a, b) => a.priority - b.priority).slice(0, maxReasons);
}

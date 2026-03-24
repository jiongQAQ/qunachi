/**
 * Shared TypeScript types for the where-to-eat application.
 */

/**
 * Restaurant data structure for candidate pool and recommendations.
 * This is the internal representation after processing raw API data.
 */
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance: number;
  category: string;
  rating?: number;
  avgPrice?: number;
  businessStatus?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  source: 'amap';
}

/**
 * Filter criteria for candidate pool generation.
 */
export interface FilterCriteria {
  radius: number;           // Search radius in meters (required, default 500)
  maxPrice?: number;         // Maximum average price per person
  minPrice?: number;         // Minimum average price per person
  categories?: string[];     // Allowed categories (any match passes)
  excludeCategories?: string[];  // Categories to exclude
  excludeRestaurantIds?: string[];  // Restaurant IDs to exclude
  minRating?: number;        // Minimum rating
}

/**
 * The candidate pool generated from raw search results after applying filters.
 */
export interface CandidatePool {
  rawRestaurants: Restaurant[];      // Original search results
  filteredRestaurants: Restaurant[];  // Valid candidates after filtering
  appliedFilters: FilterCriteria;     // Filters that were applied
  totalCount: number;                // Original result count
  filteredCount: number;              // Filtered result count
  appliedAt: string;                 // ISO timestamp of generation
}

/**
 * Reason types for restaurant recommendations.
 */
export type RecommendationReasonType =
  | 'distance'
  | 'rare_category'
  | 'price_match'
  | 'category_match'
  | 'high_rating'
  | 'not_selected_today'
  | 'nearby_top_rating';

/**
 * A single recommendation reason with type, friendly text, and priority.
 */
export interface RecommendationReason {
  type: RecommendationReasonType;
  text: string;
  priority: number;
}

/**
 * A restaurant with a recommendation score and associated reasons.
 */
export interface ScoredRestaurant {
  restaurant: Restaurant;
  score: number;
  reasons: RecommendationReason[];
}

/**
 * Input for scoring a restaurant candidate.
 */
export interface ScoringInput {
  restaurant: Restaurant;
  filterCriteria: FilterCriteria;
  selectionHistory: {
    selectedCount: number;
    lastSelectedAt: string | null;
    lastSeenCategory: string;
  } | null;
  recentBatchIds: string[];  // Restaurant IDs from recent batches to de-duplicate
}

/**
 * Result of the recommendation generation.
 */
export interface RecommendationResult {
  top3: ScoredRestaurant[];
  totalAvailable: number;  // Total valid candidate pool count
  generatedAt: string;
}

/**
 * Smart Recommendation Algorithm Module
 *
 * Generates personalized Top 3 restaurant recommendations based on:
 * - Distance matching (closer = higher score)
 * - Budget matching (price closer to target = higher score)
 * - Category matching (matches user preferences = higher score)
 * - Rating (higher rating = higher score)
 * - Historical selection penalty (more selections = lower score)
 * - Recency bonus (not selected recently = higher score)
 *
 * Also implements batch deduplication to avoid identical results on "refresh".
 */

import {
  Restaurant,
  FilterCriteria,
  ScoredRestaurant,
  RecommendationResult,
  ScoringInput,
  RecommendationReason,
} from './types';

// Weight constants for scoring formula
const WEIGHT_DISTANCE = 0.25;
const WEIGHT_PRICE = 0.20;
const WEIGHT_CATEGORY = 0.15;
const WEIGHT_RATING = 0.20;
const WEIGHT_RECENCY = 0.10;
const WEIGHT_BASE = 0.10;

// Score bounds
const MAX_HISTORY_PENALTY = 3.0;
const MAX_RECENCY_BONUS = 1.5;
const NEVER_SELECTED_BONUS = 1.0;

// Top N selection constants
const TOP_N_MULTIPLIER = 2; // Take top K * 2 candidates for weighted random
const DEFAULT_TOP_N = 3;

/**
 * Generate Top 3 recommendations from a candidate pool.
 *
 * @param candidatePool - List of candidate restaurants (already filtered)
 * @param filterCriteria - The filter criteria used (for scoring context)
 * @param recentBatchIds - Restaurant IDs from recent batches to exclude
 * @returns RecommendationResult with top 3 scored restaurants
 */
export function generateTop3Recommendation(
  candidatePool: Restaurant[],
  filterCriteria: FilterCriteria,
  recentBatchIds: string[] = []
): RecommendationResult {
  const generatedAt = new Date().toISOString();

  if (candidatePool.length === 0) {
    return {
      top3: [],
      totalAvailable: 0,
      generatedAt,
    };
  }

  // Score all restaurants
  const scoredRestaurants = candidatePool.map((restaurant) =>
    scoreRestaurant({
      restaurant,
      filterCriteria,
      selectionHistory: null, // History is fetched per-restaurant in production
      recentBatchIds,
    })
  );

  // Select top 3 using weighted random
  const top3 = selectTopN(scoredRestaurants, DEFAULT_TOP_N, recentBatchIds);

  return {
    top3,
    totalAvailable: candidatePool.length,
    generatedAt,
  };
}

/**
 * Score a single restaurant candidate.
 *
 * @param input - ScoringInput containing restaurant and context data
 * @returns ScoredRestaurant with score and reasons
 */
export function scoreRestaurant(input: ScoringInput): ScoredRestaurant {
  const { restaurant, filterCriteria, selectionHistory, recentBatchIds } = input;

  const reasons: RecommendationReason[] = [];

  // 1. Distance score (closer = higher)
  const maxDistance = filterCriteria.radius ?? 1000;
  const distanceScore = calculateDistanceScore(restaurant.distance, maxDistance);

  // 2. Price score (closer to target budget = higher)
  const targetMaxPrice = filterCriteria.maxPrice;
  const priceScore = calculatePriceScore(restaurant.avgPrice, targetMaxPrice);

  // 3. Category score (matches preferences = higher)
  const categoryScore = calculateCategoryScore(
    restaurant.category,
    filterCriteria.categories
  );

  // 4. Rating score (higher rating = higher score)
  const ratingScore = calculateRatingScore(restaurant.rating);

  // 5. History penalty (more selected = lower score)
  const selectedCount = selectionHistory?.selectedCount ?? 0;
  const historyPenalty = calculateHistoryPenalty(selectedCount);

  // 6. Recency bonus (not selected recently = higher score)
  const lastSelectedAt = selectionHistory?.lastSelectedAt ?? null;
  const recencyBonus = calculateRecencyBonus(lastSelectedAt);

  // Build final score using the formula
  const baseScore = 5.0; // Base score before penalty
  const finalScore =
    distanceScore * WEIGHT_DISTANCE +
    priceScore * WEIGHT_PRICE +
    categoryScore * WEIGHT_CATEGORY +
    ratingScore * WEIGHT_RATING +
    recencyBonus * WEIGHT_RECENCY +
    (baseScore - historyPenalty) * WEIGHT_BASE;

  // Clamp final score to [0, 10]
  const clampedScore = Math.max(0, Math.min(10, finalScore));

  // Generate reasons based on score contributions
  if (distanceScore >= 7) {
    reasons.push({ type: 'distance', text: '距离很近', priority: 1 });
  }
  if (categoryScore >= 7) {
    reasons.push({ type: 'category_match', text: '符合你的口味偏好', priority: 2 });
  }
  if (priceScore >= 7) {
    reasons.push({ type: 'price_match', text: '符合预算', priority: 3 });
  }
  if (ratingScore >= 7) {
    reasons.push({ type: 'high_rating', text: '评分较高', priority: 4 });
  }
  if (recencyBonus >= 0.5) {
    reasons.push({ type: 'not_selected_today', text: '很久没选了', priority: 5 });
  }

  // Sort reasons by priority
  reasons.sort((a, b) => a.priority - b.priority);

  // Cap reasons at 2
  const topReasons = reasons.slice(0, 2);

  return {
    restaurant,
    score: Math.round(clampedScore * 100) / 100, // Round to 2 decimal places
    reasons: topReasons,
  };
}

/**
 * Calculate distance score (0-10 scale).
 * Closer distance = higher score.
 *
 * @param distance - Distance in meters
 * @param maxDistance - Maximum distance for normalization (default 1000m)
 * @returns Score from 0 to 10
 */
export function calculateDistanceScore(
  distance: number,
  maxDistance: number = 1000
): number {
  if (distance <= 0) return 10;
  if (distance >= maxDistance) return 0;

  // Linear interpolation: 0 at maxDistance, 10 at 0
  return 10 * (1 - distance / maxDistance);
}

/**
 * Calculate price score (0-10 scale).
 * Price closer to target = higher score.
 * If no target, give moderate score to those with prices.
 *
 * @param avgPrice - Average price per person
 * @param maxPrice - Target maximum price
 * @returns Score from 0 to 10
 */
export function calculatePriceScore(
  avgPrice: number | undefined,
  maxPrice?: number
): number {
  // If no price data, return neutral score
  if (avgPrice === undefined || avgPrice === null) {
    return 5;
  }

  // If no target price, prefer mid-range prices
  if (maxPrice === undefined || maxPrice === null) {
    // Score peaks around 50, decreases toward both extremes
    const idealPrice = 50;
    const deviation = Math.abs(avgPrice - idealPrice);
    return Math.max(0, 10 - deviation / 20);
  }

  // If price is at or below target, high score
  if (avgPrice <= maxPrice) {
    // Score from 10 (0 cost) to 6 (at max price)
    return 10 - (avgPrice / maxPrice) * 4;
  }

  // If price exceeds target, penalty
  const overage = (avgPrice - maxPrice) / maxPrice;
  return Math.max(0, 6 - overage * 6);
}

/**
 * Calculate category score (0-10 scale).
 * Matches preferred categories = higher score.
 *
 * @param category - Restaurant category
 * @param preferredCategories - User's preferred categories
 * @returns Score from 0 to 10
 */
export function calculateCategoryScore(
  category: string,
  preferredCategories?: string[]
): number {
  // If no preferences, return neutral
  if (!preferredCategories || preferredCategories.length === 0) {
    return 5;
  }

  // Check if category matches any preferred category
  const hasMatch = preferredCategories.some((pref) =>
    category.toLowerCase().includes(pref.toLowerCase())
  );

  return hasMatch ? 10 : 0;
}

/**
 * Calculate rating score (0-10 scale).
 * Higher rating = higher score.
 *
 * @param rating - Restaurant rating (typically 1-5)
 * @returns Score from 0 to 10
 */
export function calculateRatingScore(rating: number | undefined): number {
  if (rating === undefined || rating === null) {
    return 5; // Neutral score when no rating
  }

  // Assuming rating is on 1-5 scale, convert to 0-10
  return (rating / 5) * 10;
}

/**
 * Calculate history penalty (0-3 scale).
 * More selections = higher penalty (lower effective score).
 *
 * @param selectedCount - Number of times the restaurant was selected
 * @returns Penalty value from 0 to 3
 */
export function calculateHistoryPenalty(selectedCount: number): number {
  return Math.min(selectedCount * 0.5, MAX_HISTORY_PENALTY);
}

/**
 * Calculate recency bonus (0-1.5 scale).
 * Not selected recently = higher bonus.
 *
 * @param lastSelectedAt - ISO timestamp of last selection, or null if never
 * @returns Bonus value from 0 to 1.5
 */
export function calculateRecencyBonus(lastSelectedAt: string | null): number {
  // Never selected gets maximum bonus
  if (lastSelectedAt === null) {
    return NEVER_SELECTED_BONUS;
  }

  const now = Date.now();
  const lastTime = new Date(lastSelectedAt).getTime();
  const daysSince = (now - lastTime) / (1000 * 60 * 60 * 24);

  return Math.min(daysSince * 0.1, MAX_RECENCY_BONUS);
}

/**
 * Select Top N restaurants using weighted random selection.
 *
 * Algorithm:
 * 1. Sort by score descending
 * 2. Take top K * 2 candidates (K = n)
 * 3. From top K*2, select n using exponential decay probability
 *
 * @param scoredRestaurants - Pre-scored restaurants
 * @param n - Number to select
 * @param excludeIds - Restaurant IDs to exclude
 * @returns Array of selected ScoredRestaurants
 */
export function selectTopN(
  scoredRestaurants: ScoredRestaurant[],
  n: number,
  excludeIds: string[] = []
): ScoredRestaurant[] {
  if (scoredRestaurants.length === 0 || n <= 0) {
    return [];
  }

  // Filter out excluded IDs
  const available = scoredRestaurants.filter(
    (sr) => !excludeIds.includes(sr.restaurant.id)
  );

  if (available.length === 0) {
    return [];
  }

  // Sort by score descending
  const sorted = [...available].sort((a, b) => b.score - a.score);

  // Take top K * 2 candidates
  const topCandidates = sorted.slice(0, n * TOP_N_MULTIPLIER);

  if (topCandidates.length <= n) {
    return topCandidates;
  }

  // Weighted random selection with exponential decay
  const selected: ScoredRestaurant[] = [];
  const remaining = [...topCandidates];

  while (selected.length < n && remaining.length > 0) {
    // Calculate selection probabilities using exponential decay
    const maxScore = remaining[0].score;

    // Weights based on score difference (higher score = higher chance)
    const weights = remaining.map((sr, index) => {
      // Exponential decay: higher score = much higher weight
      const normalizedScore = sr.score / maxScore;
      const baseWeight = Math.exp(normalizedScore * 2);

      // Also boost higher-ranked items slightly
      const rankBoost = 1 + (topCandidates.length - index) * 0.1;

      return baseWeight * rankBoost;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Random selection based on weights
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    selected.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }

  return selected;
}

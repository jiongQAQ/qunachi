/**
 * Candidate Pool Generation Module
 *
 * Generates valid candidate pools from raw search results by applying filters
 * in the specified priority order:
 * 1. Remove invalid data (missing required fields)
 * 2. Remove duplicates
 * 3. Apply distance filter
 * 4. Apply price filter
 * 5. Apply category filter
 * 6. Apply excludes filter
 */

import { Restaurant, FilterCriteria, CandidatePool } from './types';

/**
 * Generate a complete candidate pool from raw restaurants with applied filters.
 */
export function generateCandidatePool(
  rawRestaurants: Restaurant[],
  filters: FilterCriteria
): CandidatePool {
  const appliedAt = new Date().toISOString();

  // Step 1: Remove invalid data (missing required fields)
  let filtered = removeInvalidRestaurants(rawRestaurants);

  // Step 2: Remove duplicates
  filtered = removeDuplicates(filtered);

  // Step 3: Apply distance filter
  filtered = applyDistanceFilter(filtered, filters.radius);

  // Step 4: Apply price filter
  filtered = applyPriceFilter(filtered, filters.minPrice, filters.maxPrice);

  // Step 5: Apply category filter
  filtered = applyCategoryFilter(filtered, filters.categories, filters.excludeCategories);

  // Step 6: Apply excludes filter
  filtered = applyExcludesFilter(filtered, filters.excludeRestaurantIds, filters.excludeCategories);

  return {
    rawRestaurants,
    filteredRestaurants: filtered,
    appliedFilters: filters,
    totalCount: rawRestaurants.length,
    filteredCount: filtered.length,
    appliedAt,
  };
}

/**
 * Apply distance filter - keep only restaurants within maxDistance.
 * @param restaurants - Restaurant list to filter
 * @param maxDistance - Maximum distance in meters (undefined means no filter)
 */
export function applyDistanceFilter(
  restaurants: Restaurant[],
  maxDistance?: number
): Restaurant[] {
  if (maxDistance === undefined || maxDistance === null) {
    return restaurants;
  }
  return restaurants.filter((r) => r.distance < maxDistance);
}

/**
 * Apply price filter - keep only restaurants within price range.
 * Restaurants without avgPrice are considered to pass the filter.
 * @param restaurants - Restaurant list to filter
 * @param minPrice - Minimum average price (undefined means no lower bound)
 * @param maxPrice - Maximum average price (undefined means no upper bound)
 */
export function applyPriceFilter(
  restaurants: Restaurant[],
  minPrice?: number,
  maxPrice?: number
): Restaurant[] {
  return restaurants.filter((r) => {
    // Restaurants without avgPrice pass the filter (undefined means price not specified)
    if (r.avgPrice === undefined || r.avgPrice === null) {
      return true;
    }

    if (minPrice !== undefined && r.avgPrice < minPrice) {
      return false;
    }

    if (maxPrice !== undefined && r.avgPrice > maxPrice) {
      return false;
    }

    return true;
  });
}

/**
 * Apply category filter - keep only restaurants in allowed categories
 * or exclude restaurants in excluded categories.
 * @param restaurants - Restaurant list to filter
 * @param categories - Allowed categories (undefined means all categories allowed)
 * @param excludeCategories - Categories to exclude (undefined means no exclusions)
 */
export function applyCategoryFilter(
  restaurants: Restaurant[],
  categories?: string[],
  excludeCategories?: string[]
): Restaurant[] {
  return restaurants.filter((r) => {
    // First check excludeCategories
    if (excludeCategories && excludeCategories.length > 0) {
      // Check if restaurant's category contains any of the excluded categories
      const isExcluded = excludeCategories.some((exclCat) =>
        r.category.includes(exclCat)
      );
      if (isExcluded) {
        return false;
      }
    }

    // Then check categories (if specified)
    if (categories && categories.length > 0) {
      // Restaurant must match at least one of the allowed categories
      const isAllowed = categories.some((cat) => r.category.includes(cat));
      if (!isAllowed) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Apply excludes filter - remove specific restaurant IDs and categories.
 * @param restaurants - Restaurant list to filter
 * @param excludeRestaurantIds - Restaurant IDs to exclude (undefined means none)
 * @param excludeCategories - Categories to exclude (undefined means none)
 */
export function applyExcludesFilter(
  restaurants: Restaurant[],
  excludeRestaurantIds?: string[],
  excludeCategories?: string[]
): Restaurant[] {
  return restaurants.filter((r) => {
    // Exclude specific restaurant IDs
    if (excludeRestaurantIds && excludeRestaurantIds.length > 0) {
      if (excludeRestaurantIds.includes(r.id)) {
        return false;
      }
    }

    // Exclude specific categories
    if (excludeCategories && excludeCategories.length > 0) {
      const isExcluded = excludeCategories.some((cat) =>
        r.category.includes(cat)
      );
      if (isExcluded) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Remove invalid restaurants - those with missing or invalid required fields.
 * A valid restaurant must have:
 * - id (non-empty string)
 * - name (non-empty string)
 * - category (non-empty string)
 * - distance (non-negative number)
 *
 * @param restaurants - Restaurant list to filter
 */
export function removeInvalidRestaurants(restaurants: Restaurant[]): Restaurant[] {
  return restaurants.filter((r) => {
    // Check required fields
    if (!r.id || typeof r.id !== 'string' || r.id.trim() === '') {
      return false;
    }
    if (!r.name || typeof r.name !== 'string' || r.name.trim() === '') {
      return false;
    }
    if (!r.category || typeof r.category !== 'string' || r.category.trim() === '') {
      return false;
    }
    if (typeof r.distance !== 'number' || r.distance < 0) {
      return false;
    }
    return true;
  });
}

/**
 * Remove duplicate restaurants - keep only the first occurrence of each unique ID.
 * Duplicates are identified by their id field.
 *
 * @param restaurants - Restaurant list to deduplicate
 */
export function removeDuplicates(restaurants: Restaurant[]): Restaurant[] {
  const seen = new Set<string>();
  return restaurants.filter((r) => {
    if (seen.has(r.id)) {
      return false;
    }
    seen.add(r.id);
    return true;
  });
}

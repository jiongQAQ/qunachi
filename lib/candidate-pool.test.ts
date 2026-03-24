/**
 * Unit tests for candidate-pool module
 *
 * These tests verify the candidate pool generation and filtering functionality.
 * Tests cover: normal filtering flow, distance/price/category/excludes filters,
 * invalid data filtering, duplicate removal, and empty results handling.
 */

import {
  generateCandidatePool,
  applyDistanceFilter,
  applyPriceFilter,
  applyCategoryFilter,
  applyExcludesFilter,
  removeInvalidRestaurants,
  removeDuplicates,
  CandidatePool,
} from './candidate-pool';
import { Restaurant, FilterCriteria } from './types';

// Helper function to create test restaurants
function createTestRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'test-id-1',
    name: 'Test Restaurant',
    address: '123 Test Street',
    distance: 300,
    category: '中餐|川菜',
    rating: 4.5,
    avgPrice: 50,
    businessStatus: '营业中',
    phone: '010-12345678',
    source: 'amap',
    ...overrides,
  };
}

describe('candidate-pool', () => {
  describe('removeInvalidRestaurants', () => {
    test('removes restaurant with missing id', () => {
      const restaurants = [
        createTestRestaurant({ id: '' }),
        createTestRestaurant({ id: 'valid-id' }),
      ];
      const result = removeInvalidRestaurants(restaurants);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid-id');
    });

    test('removes restaurant with missing name', () => {
      const restaurants = [
        createTestRestaurant({ name: '' }),
        createTestRestaurant({ name: 'Valid Name' }),
      ];
      const result = removeInvalidRestaurants(restaurants);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Valid Name');
    });

    test('removes restaurant with missing category', () => {
      const restaurants = [
        createTestRestaurant({ category: '' }),
        createTestRestaurant({ category: '中餐|川菜' }),
      ];
      const result = removeInvalidRestaurants(restaurants);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('中餐|川菜');
    });

    test('removes restaurant with negative distance', () => {
      const restaurants = [
        createTestRestaurant({ distance: -100 }),
        createTestRestaurant({ distance: 300 }),
      ];
      const result = removeInvalidRestaurants(restaurants);
      expect(result).toHaveLength(1);
      expect(result[0].distance).toBe(300);
    });

    test('keeps restaurant with valid data', () => {
      const restaurant = createTestRestaurant();
      const result = removeInvalidRestaurants([restaurant]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(restaurant);
    });

    test('handles empty array', () => {
      const result = removeInvalidRestaurants([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('removeDuplicates', () => {
    test('removes duplicate restaurants by id', () => {
      const restaurants = [
        createTestRestaurant({ id: 'duplicate-id', name: 'First' }),
        createTestRestaurant({ id: 'unique-id', name: 'Second' }),
        createTestRestaurant({ id: 'duplicate-id', name: 'Third' }),
      ];
      const result = removeDuplicates(restaurants);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Second');
    });

    test('keeps first occurrence of duplicate', () => {
      const restaurants = [
        createTestRestaurant({ id: 'dup', name: 'Keep This' }),
        createTestRestaurant({ id: 'other', name: 'Other' }),
        createTestRestaurant({ id: 'dup', name: 'Remove This' }),
      ];
      const result = removeDuplicates(restaurants);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Keep This');
    });

    test('handles array with no duplicates', () => {
      const restaurants = [
        createTestRestaurant({ id: 'id-1' }),
        createTestRestaurant({ id: 'id-2' }),
        createTestRestaurant({ id: 'id-3' }),
      ];
      const result = removeDuplicates(restaurants);
      expect(result).toHaveLength(3);
    });

    test('handles empty array', () => {
      const result = removeDuplicates([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('applyDistanceFilter', () => {
    test('filters out restaurants beyond maxDistance', () => {
      const restaurants = [
        createTestRestaurant({ distance: 100 }),
        createTestRestaurant({ distance: 300 }),
        createTestRestaurant({ distance: 500 }),
        createTestRestaurant({ distance: 700 }),
      ];
      const result = applyDistanceFilter(restaurants, 400);
      expect(result).toHaveLength(2);
      expect(result[0].distance).toBe(100);
      expect(result[1].distance).toBe(300);
    });

    test('keeps all restaurants when maxDistance is undefined', () => {
      const restaurants = [
        createTestRestaurant({ distance: 100 }),
        createTestRestaurant({ distance: 1000 }),
      ];
      const result = applyDistanceFilter(restaurants, undefined);
      expect(result).toHaveLength(2);
    });

    test('keeps restaurants within maxDistance of 1 meter', () => {
      const restaurants = [
        createTestRestaurant({ distance: 100 }),
        createTestRestaurant({ distance: 0 }),
      ];
      const result = applyDistanceFilter(restaurants, 1);
      expect(result).toHaveLength(1);
      expect(result[0].distance).toBe(0);
    });

    test('handles empty array', () => {
      const result = applyDistanceFilter([], 500);
      expect(result).toHaveLength(0);
    });
  });

  describe('applyPriceFilter', () => {
    test('filters out restaurants above maxPrice', () => {
      const restaurants = [
        createTestRestaurant({ avgPrice: 30 }),
        createTestRestaurant({ avgPrice: 50 }),
        createTestRestaurant({ avgPrice: 80 }),
        createTestRestaurant({ avgPrice: 100 }),
      ];
      const result = applyPriceFilter(restaurants, undefined, 70);
      expect(result).toHaveLength(2);
      expect(result[0].avgPrice).toBe(30);
      expect(result[1].avgPrice).toBe(50);
    });

    test('filters out restaurants below minPrice', () => {
      const restaurants = [
        createTestRestaurant({ avgPrice: 20 }),
        createTestRestaurant({ avgPrice: 50 }),
        createTestRestaurant({ avgPrice: 80 }),
      ];
      const result = applyPriceFilter(restaurants, 40, undefined);
      expect(result).toHaveLength(2);
      expect(result[0].avgPrice).toBe(50);
      expect(result[1].avgPrice).toBe(80);
    });

    test('applies both min and max price range', () => {
      const restaurants = [
        createTestRestaurant({ avgPrice: 20 }),
        createTestRestaurant({ avgPrice: 50 }),
        createTestRestaurant({ avgPrice: 80 }),
        createTestRestaurant({ avgPrice: 120 }),
      ];
      const result = applyPriceFilter(restaurants, 30, 100);
      expect(result).toHaveLength(2);
      expect(result[0].avgPrice).toBe(50);
      expect(result[1].avgPrice).toBe(80);
    });

    test('keeps restaurants without avgPrice', () => {
      const restaurants = [
        createTestRestaurant({ avgPrice: 50 }),
        createTestRestaurant({ avgPrice: undefined }),
        createTestRestaurant({ avgPrice: 80 }),
      ];
      const result = applyPriceFilter(restaurants, 30, 100);
      expect(result).toHaveLength(3);
    });

    test('keeps all when both minPrice and maxPrice are undefined', () => {
      const restaurants = [
        createTestRestaurant({ avgPrice: 10 }),
        createTestRestaurant({ avgPrice: 200 }),
      ];
      const result = applyPriceFilter(restaurants, undefined, undefined);
      expect(result).toHaveLength(2);
    });

    test('handles empty array', () => {
      const result = applyPriceFilter([], 20, 100);
      expect(result).toHaveLength(0);
    });
  });

  describe('applyCategoryFilter', () => {
    test('keeps restaurants in allowed categories', () => {
      const restaurants = [
        createTestRestaurant({ category: '中餐|川菜' }),
        createTestRestaurant({ category: '中餐|粤菜' }),
        createTestRestaurant({ category: '西餐|法餐' }),
      ];
      const result = applyCategoryFilter(restaurants, ['川菜', '粤菜'], undefined);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('中餐|川菜');
      expect(result[1].category).toBe('中餐|粤菜');
    });

    test('excludes restaurants in excluded categories', () => {
      const restaurants = [
        createTestRestaurant({ category: '中餐|川菜' }),
        createTestRestaurant({ category: '火锅|川渝火锅' }),
        createTestRestaurant({ category: '西餐|法餐' }),
      ];
      const result = applyCategoryFilter(restaurants, undefined, ['火锅']);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('中餐|川菜');
      expect(result[1].category).toBe('西餐|法餐');
    });

    test('applies both allowed and excluded categories', () => {
      const restaurants = [
        createTestRestaurant({ category: '中餐|川菜' }),
        createTestRestaurant({ category: '火锅|川渝火锅' }),
        createTestRestaurant({ category: '中餐|粤菜' }),
      ];
      const result = applyCategoryFilter(restaurants, ['中餐'], ['火锅']);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('中餐|川菜');
      expect(result[1].category).toBe('中餐|粤菜');
    });

    test('returns all when both categories and excludeCategories are undefined', () => {
      const restaurants = [
        createTestRestaurant({ category: '中餐|川菜' }),
        createTestRestaurant({ category: '西餐|法餐' }),
      ];
      const result = applyCategoryFilter(restaurants, undefined, undefined);
      expect(result).toHaveLength(2);
    });

    test('handles category matching with pipe separator', () => {
      const restaurants = [
        createTestRestaurant({ category: '中餐|江浙菜|绿茶餐厅' }),
        createTestRestaurant({ category: '西餐|意大利餐' }),
      ];
      const result = applyCategoryFilter(restaurants, ['江浙菜'], undefined);
      expect(result).toHaveLength(1);
      expect(result[0].category).toContain('江浙菜');
    });

    test('handles empty arrays for categories', () => {
      const restaurants = [
        createTestRestaurant({ category: '中餐|川菜' }),
        createTestRestaurant({ category: '西餐|法餐' }),
      ];
      const result = applyCategoryFilter(restaurants, [], []);
      expect(result).toHaveLength(2);
    });

    test('handles empty array', () => {
      const result = applyCategoryFilter([], ['川菜'], undefined);
      expect(result).toHaveLength(0);
    });
  });

  describe('applyExcludesFilter', () => {
    test('excludes specific restaurant IDs', () => {
      const restaurants = [
        createTestRestaurant({ id: 'keep-1' }),
        createTestRestaurant({ id: 'exclude-1' }),
        createTestRestaurant({ id: 'keep-2' }),
        createTestRestaurant({ id: 'exclude-1' }),
      ];
      const result = applyExcludesFilter(restaurants, ['exclude-1'], undefined);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('keep-1');
      expect(result[1].id).toBe('keep-2');
    });

    test('excludes specific categories', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', category: '中餐|川菜' }),
        createTestRestaurant({ id: '2', category: '火锅|川渝火锅' }),
        createTestRestaurant({ id: '3', category: '西餐|法餐' }),
      ];
      const result = applyExcludesFilter(restaurants, undefined, ['火锅']);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('中餐|川菜');
      expect(result[1].category).toBe('西餐|法餐');
    });

    test('applies both ID and category excludes', () => {
      const restaurants = [
        createTestRestaurant({ id: 'exclude-by-id', category: '中餐|川菜' }),
        createTestRestaurant({ id: 'keep-1', category: '火锅|川渝火锅' }),
        createTestRestaurant({ id: 'keep-2', category: '西餐|法餐' }),
      ];
      const result = applyExcludesFilter(restaurants, ['exclude-by-id'], ['火锅']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('keep-2');
    });

    test('keeps all when both exclude params are undefined', () => {
      const restaurants = [
        createTestRestaurant({ id: '1' }),
        createTestRestaurant({ id: '2' }),
      ];
      const result = applyExcludesFilter(restaurants, undefined, undefined);
      expect(result).toHaveLength(2);
    });

    test('handles empty arrays', () => {
      const restaurants = [
        createTestRestaurant({ id: '1' }),
        createTestRestaurant({ id: '2' }),
      ];
      const result = applyExcludesFilter(restaurants, [], []);
      expect(result).toHaveLength(2);
    });

    test('handles empty array', () => {
      const result = applyExcludesFilter([], ['some-id'], ['火锅']);
      expect(result).toHaveLength(0);
    });
  });

  describe('generateCandidatePool', () => {
    test('applies all filters in correct priority order', () => {
      const rawRestaurants: Restaurant[] = [
        // Invalid - missing name (filtered first)
        { id: '1', name: '', address: 'addr', distance: 100, category: '中餐', source: 'amap' },
        // Duplicate (filtered second)
        createTestRestaurant({ id: 'dup', name: 'Dup 1' }),
        createTestRestaurant({ id: 'dup', name: 'Dup 2' }),
        // Outside distance (filtered third)
        createTestRestaurant({ id: 'far', name: 'Far Away', distance: 1000 }),
        // Outside price (filtered fourth)
        createTestRestaurant({ id: 'pricey', name: 'Pricey', avgPrice: 500 }),
        // Excluded category (filtered fifth)
        createTestRestaurant({ id: 'exclude-cat', name: 'Exclude Cat', category: '火锅' }),
        // Excluded ID (filtered last)
        createTestRestaurant({ id: 'exclude-id', name: 'Exclude ID' }),
        // Valid
        createTestRestaurant({ id: 'valid', name: 'Valid', distance: 200, avgPrice: 50, category: '中餐|川菜' }),
      ];

      const filters: FilterCriteria = {
        radius: 500,
        minPrice: 20,
        maxPrice: 100,
        categories: ['中餐'],
        excludeCategories: ['火锅'],
        excludeRestaurantIds: ['exclude-id'],
      };

      const result = generateCandidatePool(rawRestaurants, filters);

      expect(result.totalCount).toBe(8);
      // 'dup' and 'valid' both pass all filters (distance<500, price within [20,100], category contains '中餐', not in excludes)
      expect(result.filteredCount).toBe(2);
      expect(result.filteredRestaurants.map(r => r.id).sort()).toEqual(['dup', 'valid']);
      expect(result.appliedAt).toBeTruthy();
    });

    test('returns empty pool when no restaurants match', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', distance: 1000 }),
      ];
      const filters: FilterCriteria = { radius: 100 };
      const result = generateCandidatePool(restaurants, filters);

      expect(result.totalCount).toBe(1);
      expect(result.filteredCount).toBe(0);
      expect(result.filteredRestaurants).toHaveLength(0);
    });

    test('returns empty pool when all restaurants are invalid', () => {
      const restaurants = [
        createTestRestaurant({ id: '' }),
        createTestRestaurant({ name: '' }),
        createTestRestaurant({ category: '' }),
      ];
      const filters: FilterCriteria = {};
      const result = generateCandidatePool(restaurants, filters);

      expect(result.totalCount).toBe(3);
      expect(result.filteredCount).toBe(0);
    });

    test('handles empty raw restaurants array', () => {
      const filters: FilterCriteria = { radius: 500 };
      const result = generateCandidatePool([], filters);

      expect(result.totalCount).toBe(0);
      expect(result.filteredCount).toBe(0);
      expect(result.filteredRestaurants).toHaveLength(0);
      expect(result.rawRestaurants).toHaveLength(0);
    });

    test('stores applied filters correctly', () => {
      const restaurants = [createTestRestaurant({ id: '1' })];
      const filters: FilterCriteria = {
        radius: 300,
        minPrice: 20,
        maxPrice: 100,
        categories: ['川菜'],
      };
      const result = generateCandidatePool(restaurants, filters);

      expect(result.appliedFilters).toEqual(filters);
    });

    test('preserves raw restaurants in output', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', name: 'First' }),
        createTestRestaurant({ id: '2', name: 'Second' }),
      ];
      const result = generateCandidatePool(restaurants, {});

      expect(result.rawRestaurants).toHaveLength(2);
      expect(result.rawRestaurants[0].name).toBe('First');
      expect(result.rawRestaurants[1].name).toBe('Second');
    });
  });

  describe('empty results handling', () => {
    test('handles empty input for removeInvalidRestaurants', () => {
      const result = removeInvalidRestaurants([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty input for removeDuplicates', () => {
      const result = removeDuplicates([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty input for applyDistanceFilter', () => {
      const result = applyDistanceFilter([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty input for applyPriceFilter', () => {
      const result = applyPriceFilter([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty input for applyCategoryFilter', () => {
      const result = applyCategoryFilter([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty input for applyExcludesFilter', () => {
      const result = applyExcludesFilter([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty input for generateCandidatePool', () => {
      const result = generateCandidatePool([], {});
      expect(result.totalCount).toBe(0);
      expect(result.filteredCount).toBe(0);
      expect(result.filteredRestaurants).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    test('handles restaurants with exact boundary distance', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', distance: 500 }),
        createTestRestaurant({ id: '2', distance: 499 }),
      ];
      const result = applyDistanceFilter(restaurants, 500);
      expect(result).toHaveLength(1);
      expect(result[0].distance).toBe(499);
    });

    test('handles exact boundary price', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', avgPrice: 50 }),
        createTestRestaurant({ id: '2', avgPrice: 100 }),
      ];
      const result = applyPriceFilter(restaurants, 50, 100);
      expect(result).toHaveLength(2);
    });

    test('handles null values in optional fields', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', rating: null, avgPrice: null }),
        createTestRestaurant({ id: '2', rating: 4.5, avgPrice: 50 }),
      ];
      const result = removeInvalidRestaurants(restaurants);
      expect(result).toHaveLength(2);
    });

    test('handles whitespace-only strings', () => {
      const restaurants = [
        createTestRestaurant({ id: '   ', name: 'Valid' }),
        createTestRestaurant({ id: 'valid', name: '   ' }),
      ];
      const result = removeInvalidRestaurants(restaurants);
      expect(result).toHaveLength(0);
    });

    test('handles category filter with partial matches', () => {
      const restaurants = [
        createTestRestaurant({ id: '1', category: '中餐' }),
        createTestRestaurant({ id: '2', category: '中餐|川菜' }),
        createTestRestaurant({ id: '3', category: '川菜' }),
      ];
      const result = applyCategoryFilter(restaurants, ['中餐'], undefined);
      expect(result).toHaveLength(2);
    });
  });
});

/**
 * Tests for the Recommendation Algorithm Module
 */

import {
  generateTop3Recommendation,
  scoreRestaurant,
  calculateDistanceScore,
  calculatePriceScore,
  calculateCategoryScore,
  calculateRatingScore,
  calculateHistoryPenalty,
  calculateRecencyBonus,
  selectTopN,
} from './recommendation';
import { Restaurant, FilterCriteria, ScoringInput } from './types';

describe('Recommendation Algorithm', () => {
  // Test data helpers
  const createMockRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({
    id: 'test-1',
    name: '测试餐厅',
    address: '测试地址',
    distance: 500,
    category: '川菜',
    rating: 4.0,
    avgPrice: 50,
    businessStatus: '营业中',
    phone: '12345678',
    source: 'amap',
    ...overrides,
  });

  const defaultFilter: FilterCriteria = {
    radius: 1000,
    maxPrice: 100,
    minPrice: 20,
    categories: ['川菜', '湘菜'],
  };

  describe('generateTop3Recommendation', () => {
    it('should return empty result for empty candidate pool', () => {
      const result = generateTop3Recommendation([], defaultFilter, []);
      expect(result.top3).toHaveLength(0);
      expect(result.totalAvailable).toBe(0);
      expect(result.generatedAt).toBeDefined();
    });

    it('should return top 3 restaurants from candidate pool', () => {
      const restaurants = [
        createMockRestaurant({ id: '1', name: '餐厅1', distance: 200 }),
        createMockRestaurant({ id: '2', name: '餐厅2', distance: 400 }),
        createMockRestaurant({ id: '3', name: '餐厅3', distance: 600 }),
        createMockRestaurant({ id: '4', name: '餐厅4', distance: 800 }),
        createMockRestaurant({ id: '5', name: '餐厅5', distance: 1000 }),
      ];

      const result = generateTop3Recommendation(restaurants, defaultFilter, []);

      expect(result.top3).toHaveLength(3);
      expect(result.totalAvailable).toBe(5);
      expect(result.generatedAt).toBeDefined();
    });

    it('should exclude restaurants in recent batches', () => {
      const restaurants = [
        createMockRestaurant({ id: '1', name: '餐厅1', distance: 200 }),
        createMockRestaurant({ id: '2', name: '餐厅2', distance: 300 }),
        createMockRestaurant({ id: '3', name: '餐厅3', distance: 400 }),
      ];

      const recentBatchIds = ['1', '2'];

      const result = generateTop3Recommendation(restaurants, defaultFilter, recentBatchIds);

      // All selected restaurants should not be in recentBatchIds
      const selectedIds = result.top3.map((sr) => sr.restaurant.id);
      expect(selectedIds).not.toContain('1');
      expect(selectedIds).not.toContain('2');
    });

    it('should produce non-identical results on multiple calls (weighted random)', () => {
      const restaurants = [
        createMockRestaurant({ id: '1', name: '餐厅1', distance: 200, rating: 4.5 }),
        createMockRestaurant({ id: '2', name: '餐厅2', distance: 300, rating: 4.0 }),
        createMockRestaurant({ id: '3', name: '餐厅3', distance: 400, rating: 4.2 }),
        createMockRestaurant({ id: '4', name: '餐厅4', distance: 500, rating: 4.1 }),
        createMockRestaurant({ id: '5', name: '餐厅5', distance: 600, rating: 4.3 }),
        createMockRestaurant({ id: '6', name: '餐厅6', distance: 700, rating: 4.4 }),
      ];

      // Generate multiple batches and check they can differ
      const results: string[][] = [];
      for (let i = 0; i < 10; i++) {
        const result = generateTop3Recommendation(restaurants, defaultFilter, []);
        results.push(result.top3.map((sr) => sr.restaurant.id));
      }

      // At least some results should be different from others
      // (This test could theoretically fail with extremely low probability)
      const allSame = results.every((r) => r.join(',') === results[0].join(','));
      expect(allSame).toBe(false);
    });

    it('should handle candidate pool smaller than 3', () => {
      const restaurants = [
        createMockRestaurant({ id: '1', name: '餐厅1', distance: 200 }),
        createMockRestaurant({ id: '2', name: '餐厅2', distance: 300 }),
      ];

      const result = generateTop3Recommendation(restaurants, defaultFilter, []);

      expect(result.top3).toHaveLength(2);
      expect(result.totalAvailable).toBe(2);
    });
  });

  describe('scoreRestaurant', () => {
    it('should calculate distance score correctly', () => {
      const restaurant = createMockRestaurant({ distance: 0 });
      const input: ScoringInput = {
        restaurant,
        filterCriteria: defaultFilter,
        selectionHistory: null,
        recentBatchIds: [],
      };

      const result = scoreRestaurant(input);

      // Distance score should be high for close restaurants
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons).toBeDefined();
    });

    it('should penalize frequently selected restaurants', () => {
      const restaurant = createMockRestaurant({ id: 'freq-1', name: '常去餐厅' });
      const input: ScoringInput = {
        restaurant,
        filterCriteria: defaultFilter,
        selectionHistory: {
          selectedCount: 10,
          lastSelectedAt: new Date().toISOString(),
          lastSeenCategory: '川菜',
        },
        recentBatchIds: [],
      };

      const frequentResult = scoreRestaurant(input);

      // Restaurant with no history should score higher
      const noHistoryInput: ScoringInput = {
        restaurant: createMockRestaurant({ id: 'new-1', name: '新餐厅' }),
        filterCriteria: defaultFilter,
        selectionHistory: null,
        recentBatchIds: [],
      };
      const noHistoryResult = scoreRestaurant(noHistoryInput);

      expect(frequentResult.score).toBeLessThan(noHistoryResult.score);
    });

    it('should give recency bonus to long-unselected restaurants', () => {
      const restaurant = createMockRestaurant();

      // Restaurant selected 30 days ago
      const oldSelection: ScoringInput = {
        restaurant,
        filterCriteria: defaultFilter,
        selectionHistory: {
          selectedCount: 1,
          lastSelectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastSeenCategory: '川菜',
        },
        recentBatchIds: [],
      };

      // Restaurant selected 1 day ago
      const recentSelection: ScoringInput = {
        restaurant,
        filterCriteria: defaultFilter,
        selectionHistory: {
          selectedCount: 1,
          lastSelectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          lastSeenCategory: '川菜',
        },
        recentBatchIds: [],
      };

      const oldResult = scoreRestaurant(oldSelection);
      const recentResult = scoreRestaurant(recentSelection);

      // Old selection should have higher score due to recency bonus
      expect(oldResult.score).toBeGreaterThan(recentResult.score);
    });

    it('should give max recency bonus to never-selected restaurants', () => {
      const restaurant = createMockRestaurant();

      const neverSelectedInput: ScoringInput = {
        restaurant,
        filterCriteria: defaultFilter,
        selectionHistory: null,
        recentBatchIds: [],
      };

      const result = scoreRestaurant(neverSelectedInput);

      // Should have a recency bonus in reasons
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('calculateDistanceScore', () => {
    it('should return 10 for distance 0', () => {
      expect(calculateDistanceScore(0, 1000)).toBe(10);
    });

    it('should return 0 for distance at maxDistance', () => {
      expect(calculateDistanceScore(1000, 1000)).toBe(0);
    });

    it('should return 5 for distance at half of maxDistance', () => {
      expect(calculateDistanceScore(500, 1000)).toBe(5);
    });

    it('should handle edge cases', () => {
      expect(calculateDistanceScore(-1, 1000)).toBe(10); // Negative treated as 0
      expect(calculateDistanceScore(1500, 1000)).toBe(0); // Beyond max
    });
  });

  describe('calculatePriceScore', () => {
    it('should return 5 for undefined price', () => {
      expect(calculatePriceScore(undefined, 100)).toBe(5);
    });

    it('should return high score for price at or below maxPrice', () => {
      expect(calculatePriceScore(50, 100)).toBeGreaterThan(5);
    });

    it('should penalize price above maxPrice', () => {
      const score100 = calculatePriceScore(100, 100);
      const score150 = calculatePriceScore(150, 100);
      expect(score150).toBeLessThan(score100);
    });

    it('should handle no maxPrice constraint', () => {
      const score = calculatePriceScore(50, undefined);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateCategoryScore', () => {
    it('should return 10 for matching category', () => {
      expect(calculateCategoryScore('川菜', ['川菜', '湘菜'])).toBe(10);
    });

    it('should return 0 for non-matching category', () => {
      expect(calculateCategoryScore('粤菜', ['川菜', '湘菜'])).toBe(0);
    });

    it('should return 5 for empty preferences', () => {
      expect(calculateCategoryScore('川菜', [])).toBe(5);
      expect(calculateCategoryScore('川菜', undefined)).toBe(5);
    });

    it('should handle partial category matches', () => {
      // '川菜' is contained within '川菜馆'
      expect(calculateCategoryScore('川菜馆', ['川菜'])).toBe(10);
    });
  });

  describe('calculateRatingScore', () => {
    it('should return 5 for undefined rating', () => {
      expect(calculateRatingScore(undefined)).toBe(5);
    });

    it('should return 10 for rating 5', () => {
      expect(calculateRatingScore(5)).toBe(10);
    });

    it('should scale ratings proportionally', () => {
      expect(calculateRatingScore(3)).toBe(6);
      expect(calculateRatingScore(4)).toBe(8);
    });
  });

  describe('calculateHistoryPenalty', () => {
    it('should return 0 for never selected', () => {
      expect(calculateHistoryPenalty(0)).toBe(0);
    });

    it('should increase penalty with selection count', () => {
      expect(calculateHistoryPenalty(1)).toBe(0.5);
      expect(calculateHistoryPenalty(2)).toBe(1.0);
      expect(calculateHistoryPenalty(4)).toBe(2.0);
    });

    it('should cap at maximum penalty', () => {
      expect(calculateHistoryPenalty(100)).toBe(3.0);
    });
  });

  describe('calculateRecencyBonus', () => {
    it('should return max bonus for never selected', () => {
      expect(calculateRecencyBonus(null)).toBe(1.0);
    });

    it('should return 0 for just selected', () => {
      const justNow = new Date().toISOString();
      expect(calculateRecencyBonus(justNow)).toBe(0);
    });

    it('should increase bonus for older selections', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      const oneDayBonus = calculateRecencyBonus(oneDayAgo);
      const fiveDayBonus = calculateRecencyBonus(fiveDaysAgo);

      expect(fiveDayBonus).toBeGreaterThan(oneDayBonus);
    });

    it('should cap at maximum bonus', () => {
      const longAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
      expect(calculateRecencyBonus(longAgo)).toBe(1.5);
    });
  });

  describe('selectTopN', () => {
    it('should return empty array for empty input', () => {
      expect(selectTopN([], 3)).toHaveLength(0);
    });

    it('should return all if fewer than N available', () => {
      const scored = [
        { restaurant: createMockRestaurant({ id: '1' }), score: 10, reasons: [] },
        { restaurant: createMockRestaurant({ id: '2' }), score: 8, reasons: [] },
      ];
      expect(selectTopN(scored, 5)).toHaveLength(2);
    });

    it('should exclude specified IDs', () => {
      const scored = [
        { restaurant: createMockRestaurant({ id: '1' }), score: 10, reasons: [] },
        { restaurant: createMockRestaurant({ id: '2' }), score: 8, reasons: [] },
        { restaurant: createMockRestaurant({ id: '3' }), score: 6, reasons: [] },
      ];

      const result = selectTopN(scored, 2, ['1']);

      const resultIds = result.map((r) => r.restaurant.id);
      expect(resultIds).not.toContain('1');
      expect(resultIds).toHaveLength(2);
    });

    it('should return unique restaurants (no duplicates)', () => {
      const scored = [
        { restaurant: createMockRestaurant({ id: '1' }), score: 10, reasons: [] },
        { restaurant: createMockRestaurant({ id: '2' }), score: 8, reasons: [] },
        { restaurant: createMockRestaurant({ id: '3' }), score: 6, reasons: [] },
        { restaurant: createMockRestaurant({ id: '4' }), score: 4, reasons: [] },
        { restaurant: createMockRestaurant({ id: '5' }), score: 2, reasons: [] },
      ];

      const result = selectTopN(scored, 3);
      const resultIds = result.map((r) => r.restaurant.id);
      const uniqueIds = new Set(resultIds);

      expect(uniqueIds.size).toBe(result.length);
    });

    it('should prioritize higher scored restaurants', () => {
      const scored = [
        { restaurant: createMockRestaurant({ id: '1', name: '最高分' }), score: 10, reasons: [] },
        { restaurant: createMockRestaurant({ id: '2', name: '中高分' }), score: 8, reasons: [] },
        { restaurant: createMockRestaurant({ id: '3', name: '中分' }), score: 6, reasons: [] },
        { restaurant: createMockRestaurant({ id: '4', name: '低分' }), score: 4, reasons: [] },
        { restaurant: createMockRestaurant({ id: '5', name: '最低分' }), score: 2, reasons: [] },
      ];

      // Run multiple times and check that highest scored appears most often
      const appearances: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        const result = selectTopN(scored, 1);
        const id = result[0].restaurant.id;
        appearances[id] = (appearances[id] || 0) + 1;
      }

      // ID '1' should appear most frequently
      expect(appearances['1']).toBeGreaterThan(appearances['5'] ?? 0);
    });
  });
});

import {
  generateReasons,
  isNearbyTopRating,
  isPriceMatch,
  isDistanceAdvantage,
  isRareCategory,
  isCategoryMatch,
  isHighRating,
  isNotSelectedToday,
  getReasonText,
  selectTopReasons,
} from './recommendation-reason';
import { Restaurant, FilterCriteria } from './types';

const makeRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({
  id: 'r1',
  name: '测试餐厅',
  address: '测试地址',
  distance: 300,
  category: '川菜',
  rating: 4.5,
  avgPrice: 50,
  businessStatus: '营业',
  phone: '010-12345678',
  source: 'amap',
  ...overrides,
});

const defaultFilter: FilterCriteria = {
  radius: 500,
  minPrice: 20,
  maxPrice: 100,
  categories: ['川菜', '火锅'],
  minRating: 3.0,
};

describe('recommendation-reason', () => {
  describe('isNearbyTopRating', () => {
    it('returns true when restaurant has highest rating in candidates', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 5.0 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 4.0 }),
        makeRestaurant({ id: 'r3', rating: 3.5 }),
      ];
      expect(isNearbyTopRating(restaurant, candidates)).toBe(true);
    });

    it('returns false when not the top rating', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 4.0 });
      const candidates = [
        makeRestaurant({ id: 'r2', rating: 5.0 }),
        restaurant,
        makeRestaurant({ id: 'r3', rating: 3.5 }),
      ];
      expect(isNearbyTopRating(restaurant, candidates)).toBe(false);
    });

    it('returns false with fewer than 2 candidates', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 5.0 });
      expect(isNearbyTopRating(restaurant, [restaurant])).toBe(false);
    });

    it('returns false when restaurant has no rating', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: undefined });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 4.0 }),
      ];
      expect(isNearbyTopRating(restaurant, candidates)).toBe(false);
    });
  });

  describe('isPriceMatch', () => {
    it('returns true when price is within filter range', () => {
      const restaurant = makeRestaurant({ avgPrice: 50 });
      expect(isPriceMatch(restaurant, defaultFilter)).toBe(true);
    });

    it('returns true when price equals minPrice boundary', () => {
      const restaurant = makeRestaurant({ avgPrice: 20 });
      expect(isPriceMatch(restaurant, defaultFilter)).toBe(true);
    });

    it('returns true when price equals maxPrice boundary', () => {
      const restaurant = makeRestaurant({ avgPrice: 100 });
      expect(isPriceMatch(restaurant, defaultFilter)).toBe(true);
    });

    it('returns false when price is below minPrice', () => {
      const restaurant = makeRestaurant({ avgPrice: 10 });
      expect(isPriceMatch(restaurant, defaultFilter)).toBe(false);
    });

    it('returns false when price exceeds maxPrice', () => {
      const restaurant = makeRestaurant({ avgPrice: 200 });
      expect(isPriceMatch(restaurant, defaultFilter)).toBe(false);
    });

    it('returns false when restaurant has no avgPrice', () => {
      const restaurant = makeRestaurant({ avgPrice: undefined });
      expect(isPriceMatch(restaurant, defaultFilter)).toBe(false);
    });
  });

  describe('isDistanceAdvantage', () => {
    it('returns true when distance is in top 30% closest', () => {
      const restaurant = makeRestaurant({ id: 'r1', distance: 100 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', distance: 300 }),
        makeRestaurant({ id: 'r3', distance: 500 }),
        makeRestaurant({ id: 'r4', distance: 700 }),
        makeRestaurant({ id: 'r5', distance: 900 }),
      ];
      expect(isDistanceAdvantage(restaurant, candidates)).toBe(true);
    });

    it('returns false when distance is not in top 30%', () => {
      const restaurant = makeRestaurant({ id: 'r1', distance: 900 });
      const candidates = [
        makeRestaurant({ id: 'r2', distance: 100 }),
        makeRestaurant({ id: 'r3', distance: 300 }),
        makeRestaurant({ id: 'r4', distance: 500 }),
        makeRestaurant({ id: 'r5', distance: 700 }),
        restaurant,
      ];
      expect(isDistanceAdvantage(restaurant, candidates)).toBe(false);
    });

    it('returns false with fewer than 2 candidates', () => {
      const restaurant = makeRestaurant({ id: 'r1', distance: 100 });
      expect(isDistanceAdvantage(restaurant, [restaurant])).toBe(false);
    });
  });

  describe('isRareCategory', () => {
    it('returns true when category count is 0', () => {
      const history = new Map<string, number>();
      expect(isRareCategory('川菜', history)).toBe(true);
    });

    it('returns true when category count is 1', () => {
      const history = new Map<string, number>([['川菜', 1]]);
      expect(isRareCategory('川菜', history)).toBe(true);
    });

    it('returns true when category count is 2', () => {
      const history = new Map<string, number>([['川菜', 2]]);
      expect(isRareCategory('川菜', history)).toBe(true);
    });

    it('returns false when category count is 3 or more', () => {
      const history = new Map<string, number>([['川菜', 3]]);
      expect(isRareCategory('川菜', history)).toBe(false);
    });

    it('returns true for unknown category', () => {
      const history = new Map<string, number>([['火锅', 10]]);
      expect(isRareCategory('川菜', history)).toBe(true);
    });
  });

  describe('isCategoryMatch', () => {
    it('returns true when restaurant category is in filter categories', () => {
      const restaurant = makeRestaurant({ category: '川菜' });
      expect(isCategoryMatch(restaurant, defaultFilter)).toBe(true);
    });

    it('returns false when restaurant category is not in filter categories', () => {
      const restaurant = makeRestaurant({ category: '粤菜' });
      expect(isCategoryMatch(restaurant, defaultFilter)).toBe(false);
    });

    it('returns false when filter has no categories', () => {
      const restaurant = makeRestaurant({ category: '川菜' });
      const filter: FilterCriteria = { radius: 500 };
      expect(isCategoryMatch(restaurant, filter)).toBe(false);
    });

    it('returns false when filter categories is empty array', () => {
      const restaurant = makeRestaurant({ category: '川菜' });
      const filter: FilterCriteria = { radius: 500, categories: [] };
      expect(isCategoryMatch(restaurant, filter)).toBe(false);
    });
  });

  describe('isHighRating', () => {
    it('returns true when rating is in top 30% but not #1', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 4.0 });
      const candidates = [
        makeRestaurant({ id: 'r2', rating: 5.0 }),
        restaurant,
        makeRestaurant({ id: 'r3', rating: 3.5 }),
        makeRestaurant({ id: 'r4', rating: 3.0 }),
        makeRestaurant({ id: 'r5', rating: 2.5 }),
      ];
      // Sorted ratings: [5.0, 4.0, 3.5, 3.0, 2.5]
      // top=5.0, restaurant=4.0 != top, percentileIndex=ceil(5*0.3)-1=1, threshold=ratings[1]=4.0
      // 4.0 >= 4.0 → true
      expect(isHighRating(restaurant, candidates)).toBe(true);
    });

    it('returns false when restaurant is the top rating', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 5.0 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 4.0 }),
        makeRestaurant({ id: 'r3', rating: 3.5 }),
      ];
      expect(isHighRating(restaurant, candidates)).toBe(false);
    });

    it('returns false with fewer than 3 candidates', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 5.0 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 4.0 }),
      ];
      expect(isHighRating(restaurant, candidates)).toBe(false);
    });

    it('returns false when rating is not in top 30%', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 2.0 });
      const candidates = [
        makeRestaurant({ id: 'r2', rating: 5.0 }),
        makeRestaurant({ id: 'r3', rating: 4.5 }),
        makeRestaurant({ id: 'r4', rating: 4.0 }),
        makeRestaurant({ id: 'r5', rating: 3.5 }),
        restaurant,
      ];
      expect(isHighRating(restaurant, candidates)).toBe(false);
    });
  });

  describe('isNotSelectedToday', () => {
    it('returns true when restaurant is not in selectedTodayIds', () => {
      const selectedIds = new Set<string>(['r2', 'r3']);
      expect(isNotSelectedToday('r1', selectedIds)).toBe(true);
    });

    it('returns false when restaurant is in selectedTodayIds', () => {
      const selectedIds = new Set<string>(['r1', 'r2']);
      expect(isNotSelectedToday('r1', selectedIds)).toBe(false);
    });

    it('returns true when selectedTodayIds is empty', () => {
      const selectedIds = new Set<string>();
      expect(isNotSelectedToday('r1', selectedIds)).toBe(true);
    });
  });

  describe('getReasonText', () => {
    it('generates correct text for distance reason', () => {
      expect(getReasonText('distance', { distance: 300 })).toBe('距离仅300米，比较近');
    });

    it('generates correct text for rare_category reason', () => {
      expect(getReasonText('rare_category', {})).toBe('这类餐厅你已经很久没吃了');
    });

    it('generates correct text for price_match reason', () => {
      expect(getReasonText('price_match', { avgPrice: 68 })).toBe('人均68元，符合你的预算');
    });

    it('generates correct text for category_match reason', () => {
      expect(getReasonText('category_match', { category: '川菜' })).toBe('是你喜欢的川菜类');
    });

    it('generates correct text for high_rating reason', () => {
      expect(getReasonText('high_rating', { rating: 4.5 })).toBe('评分4.5星，口碑不错');
    });

    it('generates correct text for not_selected_today reason', () => {
      expect(getReasonText('not_selected_today', {})).toBe('今天还没选过这家');
    });

    it('generates correct text for nearby_top_rating reason', () => {
      expect(getReasonText('nearby_top_rating', {})).toBe('在附近餐厅中评分最高');
    });
  });

  describe('generateReasons', () => {
    it('returns all applicable reasons', () => {
      // Restaurant that matches many conditions
      const restaurant = makeRestaurant({
        id: 'r1',
        rating: 4.0,
        distance: 200,
        category: '川菜',
        avgPrice: 50,
      });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 5.0, distance: 300 }),
        makeRestaurant({ id: 'r3', rating: 3.5, distance: 500 }),
        makeRestaurant({ id: 'r4', rating: 3.0, distance: 700 }),
        makeRestaurant({ id: 'r5', rating: 2.5, distance: 900 }),
      ];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      // Should have multiple reasons: price_match, distance, rare_category, not_selected_today, category_match
      expect(reasons.length).toBeGreaterThanOrEqual(3);
      // All reasons should have non-empty text
      for (const reason of reasons) {
        expect(reason.text.length).toBeGreaterThan(0);
      }
    });

    it('reasons are sorted by priority', () => {
      const restaurant = makeRestaurant({
        id: 'r1',
        rating: 4.0,
        distance: 200,
        category: '川菜',
        avgPrice: 50,
      });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 5.0, distance: 300 }),
        makeRestaurant({ id: 'r3', rating: 3.5, distance: 500 }),
        makeRestaurant({ id: 'r4', rating: 3.0, distance: 700 }),
        makeRestaurant({ id: 'r5', rating: 2.5, distance: 900 }),
      ];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      for (let i = 1; i < reasons.length; i++) {
        expect(reasons[i - 1].priority).toBeLessThanOrEqual(reasons[i].priority);
      }
    });

    it('includes nearby_top_rating for top-rated restaurant', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 5.0, avgPrice: 50 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 4.0, avgPrice: 60 }),
      ];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      const types = reasons.map((r) => r.type);
      expect(types).toContain('nearby_top_rating');
    });

    it('includes price_match when price is in range', () => {
      const restaurant = makeRestaurant({ id: 'r1', avgPrice: 50 });
      const candidates = [restaurant, makeRestaurant({ id: 'r2', avgPrice: 60 })];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      const types = reasons.map((r) => r.type);
      expect(types).toContain('price_match');
    });

    it('includes rare_category for rarely-selected categories', () => {
      const restaurant = makeRestaurant({ id: 'r1', category: '川菜' });
      const candidates = [restaurant, makeRestaurant({ id: 'r2', category: '火锅' })];
      const categoryHistory = new Map<string, number>([['川菜', 1]]);
      const selectedToday = new Set<string>();

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      const types = reasons.map((r) => r.type);
      expect(types).toContain('rare_category');
    });

    it('includes not_selected_today for restaurant not in today list', () => {
      const restaurant = makeRestaurant({ id: 'r1' });
      const candidates = [restaurant, makeRestaurant({ id: 'r2' })];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>(['r2', 'r3']);

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      const types = reasons.map((r) => r.type);
      expect(types).toContain('not_selected_today');
    });

    it('does not include not_selected_today when restaurant was selected today', () => {
      const restaurant = makeRestaurant({ id: 'r1' });
      const candidates = [restaurant, makeRestaurant({ id: 'r2' })];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>(['r1']);

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      const types = reasons.map((r) => r.type);
      expect(types).not.toContain('not_selected_today');
    });

    it('combine with selectTopReasons to get 1-2 reasons for display', () => {
      const restaurant = makeRestaurant({
        id: 'r1',
        rating: 4.0,
        distance: 200,
        category: '川菜',
        avgPrice: 50,
      });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 5.0, distance: 300 }),
        makeRestaurant({ id: 'r3', rating: 3.5, distance: 500 }),
        makeRestaurant({ id: 'r4', rating: 3.0, distance: 700 }),
        makeRestaurant({ id: 'r5', rating: 2.5, distance: 900 }),
      ];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const allReasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );
      const topReasons = selectTopReasons(allReasons);

      // Display limit is 1-2
      expect(topReasons.length).toBeGreaterThanOrEqual(1);
      expect(topReasons.length).toBeLessThanOrEqual(2);
      // Highest priority reason is first
      for (let i = 1; i < topReasons.length; i++) {
        expect(topReasons[i - 1].priority).toBeLessThanOrEqual(topReasons[i].priority);
      }
    });

    it('returns reasons with non-empty text', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 4.5 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 5.0 }),
        makeRestaurant({ id: 'r3', rating: 3.5 }),
      ];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      for (const reason of reasons) {
        expect(reason.text.length).toBeGreaterThan(0);
      }
    });

    it('all returned reasons have valid types', () => {
      const restaurant = makeRestaurant({ id: 'r1', rating: 4.0 });
      const candidates = [
        restaurant,
        makeRestaurant({ id: 'r2', rating: 5.0 }),
        makeRestaurant({ id: 'r3', rating: 3.5 }),
      ];
      const categoryHistory = new Map<string, number>();
      const selectedToday = new Set<string>();

      const validTypes = [
        'distance',
        'rare_category',
        'price_match',
        'category_match',
        'high_rating',
        'not_selected_today',
        'nearby_top_rating',
      ];

      const reasons = generateReasons(
        restaurant,
        candidates,
        defaultFilter,
        categoryHistory,
        selectedToday
      );

      for (const reason of reasons) {
        expect(validTypes).toContain(reason.type);
      }
    });
  });

  describe('selectTopReasons', () => {
    it('returns at most maxReasons (default 2)', () => {
      const reasons = [
        { type: 'nearby_top_rating' as const, text: '在附近餐厅中评分最高', priority: 1 },
        { type: 'price_match' as const, text: '人均50元，符合你的预算', priority: 2 },
        { type: 'distance' as const, text: '距离仅300米，比较近', priority: 3 },
        { type: 'rare_category' as const, text: '这类餐厅你已经很久没吃了', priority: 4 },
      ];

      const selected = selectTopReasons(reasons);
      expect(selected.length).toBeLessThanOrEqual(2);
    });

    it('returns at most custom maxReasons', () => {
      const reasons = [
        { type: 'nearby_top_rating' as const, text: '在附近餐厅中评分最高', priority: 1 },
        { type: 'price_match' as const, text: '人均50元，符合你的预算', priority: 2 },
        { type: 'distance' as const, text: '距离仅300米，比较近', priority: 3 },
      ];

      const selected = selectTopReasons(reasons, 1);
      expect(selected.length).toBe(1);
    });

    it('returns all reasons if fewer than maxReasons', () => {
      const reasons = [
        { type: 'nearby_top_rating' as const, text: '在附近餐厅中评分最高', priority: 1 },
      ];

      const selected = selectTopReasons(reasons, 2);
      expect(selected.length).toBe(1);
    });

    it('returns empty array for empty input', () => {
      const selected = selectTopReasons([]);
      expect(selected.length).toBe(0);
    });

    it('returns highest priority reasons', () => {
      const reasons = [
        { type: 'distance' as const, text: '距离仅300米，比较近', priority: 3 },
        { type: 'nearby_top_rating' as const, text: '在附近餐厅中评分最高', priority: 1 },
        { type: 'price_match' as const, text: '人均50元，符合你的预算', priority: 2 },
      ];

      const selected = selectTopReasons(reasons, 2);
      expect(selected[0].type).toBe('nearby_top_rating');
      expect(selected[1].type).toBe('price_match');
    });
  });
});

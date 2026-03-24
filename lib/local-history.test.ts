/**
 * Unit tests for local-history module
 *
 * These tests verify the localStorage-based history storage functionality.
 * Tests cover: initial empty state, recording selections, history retrieval,
 * temporary excludes, clearing history, and graceful degradation when
 * localStorage is unavailable.
 */

// Mock window and localStorage before importing the module
const mockStorage: Record<string, string> = {};

const createMockLocalStorage = () => ({
  getItem: (key: string): string | null => {
    return mockStorage[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    mockStorage[key] = value;
  },
  removeItem: (key: string): void => {
    delete mockStorage[key];
  },
  clear: (): void => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  },
});

// Set up window with localStorage
const mockLocalStorage = createMockLocalStorage();
(globalThis as Record<string, unknown>).window = {
  localStorage: mockLocalStorage,
};

// Now import the module
import {
  getLocalHistory,
  saveLocalHistory,
  getRestaurantHistory,
  recordSelection,
  getSelectionCount,
  getLastSelectedTime,
  getTemporaryExcludes,
  addTemporaryExclude,
  removeTemporaryExclude,
  clearHistory,
  getRecentBatches,
  addRecentBatch,
  clearRecentBatches,
  LocalHistory,
} from './local-history';

function clearMockStorage(): void {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
}

describe('local-history', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  describe('initial empty state', () => {
    test('getLocalHistory returns default structure when storage is empty', () => {
      const history = getLocalHistory();

      expect(history.version).toBe(1);
      expect(history.restaurants).toEqual({});
      expect(history.temporaryExcludes).toEqual([]);
      expect(history.recentRecommendationBatches).toEqual([]);
    });

    test('getRestaurantHistory returns null for non-existent restaurant', () => {
      const result = getRestaurantHistory('non-existent-id');
      expect(result).toBeNull();
    });

    test('getSelectionCount returns 0 for non-existent restaurant', () => {
      const count = getSelectionCount('non-existent-id');
      expect(count).toBe(0);
    });

    test('getLastSelectedTime returns null for non-existent restaurant', () => {
      const time = getLastSelectedTime('non-existent-id');
      expect(time).toBeNull();
    });

    test('getTemporaryExcludes returns empty array initially', () => {
      const excludes = getTemporaryExcludes();
      expect(excludes).toEqual([]);
    });

    test('getRecentBatches returns empty array initially', () => {
      const batches = getRecentBatches();
      expect(batches).toEqual([]);
    });
  });

  describe('recording selections', () => {
    test('recordSelection creates new restaurant record', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Test Restaurant',
        category: 'Chinese',
      });

      const history = getRestaurantHistory('restaurant-1');
      expect(history).not.toBeNull();
      expect(history?.name).toBe('Test Restaurant');
      expect(history?.selectedCount).toBe(1);
      expect(history?.lastSeenCategory).toBe('Chinese');
      expect(history?.lastSelectedAt).toBeTruthy();
    });

    test('recordSelection increments selection count', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Test Restaurant',
        category: 'Chinese',
      });

      recordSelection({
        id: 'restaurant-1',
        name: 'Test Restaurant',
        category: 'Chinese',
      });

      const history = getRestaurantHistory('restaurant-1');
      expect(history?.selectedCount).toBe(2);
    });

    test('recordSelection updates lastSelectedAt and category', () => {
      const beforeTime = new Date().toISOString();

      recordSelection({
        id: 'restaurant-1',
        name: 'Test Restaurant',
        category: 'Chinese',
      });

      const afterTime = new Date().toISOString();

      const history = getRestaurantHistory('restaurant-1');
      expect(history?.lastSeenCategory).toBe('Chinese');
      expect(history!.lastSelectedAt >= beforeTime).toBe(true);
      expect(history!.lastSelectedAt <= afterTime).toBe(true);
    });

    test('multiple restaurants can be recorded independently', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Restaurant One',
        category: 'Chinese',
      });

      recordSelection({
        id: 'restaurant-2',
        name: 'Restaurant Two',
        category: 'Japanese',
      });

      const history1 = getRestaurantHistory('restaurant-1');
      const history2 = getRestaurantHistory('restaurant-2');

      expect(history1?.name).toBe('Restaurant One');
      expect(history2?.name).toBe('Restaurant Two');
      expect(getSelectionCount('restaurant-1')).toBe(1);
      expect(getSelectionCount('restaurant-2')).toBe(1);
    });
  });

  describe('history retrieval', () => {
    test('getLocalHistory returns full history with all restaurants', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Restaurant One',
        category: 'Chinese',
      });

      recordSelection({
        id: 'restaurant-2',
        name: 'Restaurant Two',
        category: 'Japanese',
      });

      const history = getLocalHistory();
      expect(Object.keys(history.restaurants).length).toBe(2);
      expect(history.restaurants['restaurant-1']).toBeTruthy();
      expect(history.restaurants['restaurant-2']).toBeTruthy();
    });

    test('getLastSelectedTime returns correct time string', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Test Restaurant',
        category: 'Chinese',
      });

      const lastSelected = getLastSelectedTime('restaurant-1');
      expect(lastSelected).toBeTruthy();
      expect(new Date(lastSelected!).toISOString()).toBe(lastSelected);
    });

    test('saveLocalHistory persists arbitrary history structure', () => {
      const customHistory: LocalHistory = {
        version: 1,
        restaurants: {
          'custom-id': {
            name: 'Custom Restaurant',
            selectedCount: 5,
            lastSelectedAt: '2024-01-01T00:00:00.000Z',
            lastSeenCategory: 'Italian',
          },
        },
        temporaryExcludes: ['excluded-category'],
        recentRecommendationBatches: [['poi-1', 'poi-2']],
      };

      saveLocalHistory(customHistory);

      const retrieved = getLocalHistory();
      expect(retrieved.restaurants['custom-id']).toEqual(customHistory.restaurants['custom-id']);
      expect(retrieved.temporaryExcludes).toEqual(['excluded-category']);
      expect(retrieved.recentRecommendationBatches).toEqual([['poi-1', 'poi-2']]);
    });
  });

  describe('temporary excludes', () => {
    test('addTemporaryExclude adds item to excludes list', () => {
      addTemporaryExclude('Chinese');
      addTemporaryExclude('restaurant-123');

      const excludes = getTemporaryExcludes();
      expect(excludes).toContain('Chinese');
      expect(excludes).toContain('restaurant-123');
    });

    test('addTemporaryExclude does not add duplicates', () => {
      addTemporaryExclude('Chinese');
      addTemporaryExclude('Chinese');

      const excludes = getTemporaryExcludes();
      expect(excludes.filter((e) => e === 'Chinese').length).toBe(1);
    });

    test('removeTemporaryExclude removes existing item', () => {
      addTemporaryExclude('Chinese');
      addTemporaryExclude('Japanese');

      removeTemporaryExclude('Chinese');

      const excludes = getTemporaryExcludes();
      expect(excludes).not.toContain('Chinese');
      expect(excludes).toContain('Japanese');
    });

    test('removeTemporaryExclude does not error for non-existent item', () => {
      addTemporaryExclude('Chinese');
      removeTemporaryExclude('NonExistent');

      const excludes = getTemporaryExcludes();
      expect(excludes).toContain('Chinese');
      expect(excludes.length).toBe(1);
    });
  });

  describe('clearing history', () => {
    test('clearHistory removes all restaurants', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Restaurant One',
        category: 'Chinese',
      });

      recordSelection({
        id: 'restaurant-2',
        name: 'Restaurant Two',
        category: 'Japanese',
      });

      clearHistory();

      const history = getLocalHistory();
      expect(history.restaurants).toEqual({});
    });

    test('clearHistory removes all temporary excludes', () => {
      addTemporaryExclude('Chinese');
      addTemporaryExclude('Japanese');

      clearHistory();

      const history = getLocalHistory();
      expect(history.temporaryExcludes).toEqual([]);
    });

    test('clearHistory removes all recent batches', () => {
      addRecentBatch(['poi-1', 'poi-2']);
      addRecentBatch(['poi-3', 'poi-4']);

      clearHistory();

      const history = getLocalHistory();
      expect(history.recentRecommendationBatches).toEqual([]);
    });

    test('clearHistory preserves version', () => {
      clearHistory();

      const history = getLocalHistory();
      expect(history.version).toBe(1);
    });
  });

  describe('recent recommendation batches', () => {
    test('addRecentBatch adds batch to history', () => {
      addRecentBatch(['poi-1', 'poi-2', 'poi-3']);

      const batches = getRecentBatches();
      expect(batches.length).toBe(1);
      expect(batches[0]).toEqual(['poi-1', 'poi-2', 'poi-3']);
    });

    test('addRecentBatch adds new batch to front', () => {
      addRecentBatch(['poi-1', 'poi-2']);
      addRecentBatch(['poi-3', 'poi-4']);

      const batches = getRecentBatches();
      expect(batches[0]).toEqual(['poi-3', 'poi-4']);
      expect(batches[1]).toEqual(['poi-1', 'poi-2']);
    });

    test('addRecentBatch limits to 10 most recent batches', () => {
      for (let i = 0; i < 15; i++) {
        addRecentBatch([`poi-${i}`]);
      }

      const batches = getRecentBatches();
      expect(batches.length).toBe(10);
      expect(batches[0]).toEqual(['poi-14']);
    });

    test('clearRecentBatches removes all batches', () => {
      addRecentBatch(['poi-1', 'poi-2']);
      addRecentBatch(['poi-3', 'poi-4']);

      clearRecentBatches();

      const batches = getRecentBatches();
      expect(batches).toEqual([]);
    });
  });

  describe('localStorage unavailable degradation', () => {
    test('getLocalHistory returns default when localStorage throws', () => {
      // Save original localStorage
      const originalGetItem = mockLocalStorage.getItem;
      const originalSetItem = mockLocalStorage.setItem;

      // Simulate localStorage being unavailable
      mockLocalStorage.getItem = () => {
        throw new Error('localStorage not available');
      };
      mockLocalStorage.setItem = () => {
        throw new Error('localStorage not available');
      };

      const history = getLocalHistory();
      expect(history.version).toBe(1);
      expect(history.restaurants).toEqual({});
      expect(history.temporaryExcludes).toEqual([]);

      // Restore
      mockLocalStorage.getItem = originalGetItem;
      mockLocalStorage.setItem = originalSetItem;
    });

    test('saveLocalHistory does not throw when localStorage unavailable', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = () => {
        throw new Error('localStorage not available');
      };

      expect(() => {
        saveLocalHistory(getLocalHistory());
      }).not.toThrow();

      mockLocalStorage.setItem = originalSetItem;
    });

    test('recordSelection does not throw when localStorage unavailable', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = () => {
        throw new Error('localStorage not available');
      };

      expect(() => {
        recordSelection({
          id: 'restaurant-1',
          name: 'Test Restaurant',
          category: 'Chinese',
        });
      }).not.toThrow();

      mockLocalStorage.setItem = originalSetItem;
    });

    test('getTemporaryExcludes returns empty array when localStorage throws', () => {
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = () => {
        throw new Error('localStorage not available');
      };

      const excludes = getTemporaryExcludes();
      expect(excludes).toEqual([]);

      mockLocalStorage.getItem = originalGetItem;
    });

    test('addTemporaryExclude does not throw when localStorage unavailable', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = () => {
        throw new Error('localStorage not available');
      };

      expect(() => {
        addTemporaryExclude('Chinese');
      }).not.toThrow();

      mockLocalStorage.setItem = originalSetItem;
    });
  });

  describe('data persistence across operations', () => {
    test('multiple operations preserve data integrity', () => {
      // Add some data
      recordSelection({
        id: 'restaurant-1',
        name: 'Restaurant One',
        category: 'Chinese',
      });

      addTemporaryExclude('Japanese');
      addRecentBatch(['poi-1', 'poi-2']);

      // Perform some more operations
      recordSelection({
        id: 'restaurant-2',
        name: 'Restaurant Two',
        category: 'Italian',
      });

      removeTemporaryExclude('Japanese');
      addTemporaryExclude('Mexican');

      // Verify all data is correct
      const history = getLocalHistory();
      expect(history.restaurants['restaurant-1'].selectedCount).toBe(1);
      expect(history.restaurants['restaurant-2'].selectedCount).toBe(1);
      expect(history.temporaryExcludes).toEqual(['Mexican']);
      expect(history.recentRecommendationBatches).toEqual([['poi-1', 'poi-2']]);
    });

    test('data persists after getLocalHistory calls', () => {
      recordSelection({
        id: 'restaurant-1',
        name: 'Test Restaurant',
        category: 'Chinese',
      });

      // Multiple reads should not affect data
      getLocalHistory();
      getLocalHistory();
      getLocalHistory();

      const history = getRestaurantHistory('restaurant-1');
      expect(history?.selectedCount).toBe(1);
    });
  });
});

/**
 * Local History Storage Module
 *
 * Manages user restaurant selection history and preferences in localStorage.
 * Used for tracking user choices, temporary exclusions, and recommendation deduplication.
 */

const STORAGE_KEY = 'where-to-eat-history';
const CURRENT_VERSION = 1;
const MAX_RECENT_BATCHES = 10;

export interface RestaurantHistory {
  name: string;
  selectedCount: number;
  lastSelectedAt: string;
  lastSeenCategory: string;
}

export interface LocalHistory {
  version: number;
  restaurants: {
    [poiId: string]: RestaurantHistory;
  };
  temporaryExcludes: string[];
  recentRecommendationBatches: string[][];
}

interface StorageData {
  version?: number;
  restaurants?: { [poiId: string]: RestaurantHistory };
  temporaryExcludes?: string[];
  recentRecommendationBatches?: string[][];
}

/**
 * Get the default empty local history structure
 */
function getDefaultHistory(): LocalHistory {
  return {
    version: CURRENT_VERSION,
    restaurants: {},
    temporaryExcludes: [],
    recentRecommendationBatches: [],
  };
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read data from localStorage with error handling
 */
function readFromStorage(): StorageData {
  if (!isLocalStorageAvailable()) {
    return {};
  }
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data) as StorageData;
  } catch {
    return {};
  }
}

/**
 * Write data to localStorage with error handling
 */
function writeToStorage(data: StorageData): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate old data to current version
 */
function migrateIfNeeded(storedData: StorageData): LocalHistory {
  const version = storedData.version ?? 0;

  // If version is current or no data, return full history
  if (version >= CURRENT_VERSION && storedData.restaurants) {
    return {
      version: CURRENT_VERSION,
      restaurants: storedData.restaurants,
      temporaryExcludes: storedData.temporaryExcludes ?? [],
      recentRecommendationBatches: storedData.recentRecommendationBatches ?? [],
    };
  }

  // Migration from version 0 or missing version
  if (version === 0 && storedData.restaurants) {
    // Already has structure, just update version
    return {
      version: CURRENT_VERSION,
      restaurants: storedData.restaurants,
      temporaryExcludes: storedData.temporaryExcludes ?? [],
      recentRecommendationBatches: storedData.recentRecommendationBatches ?? [],
    };
  }

  // No valid data, return default
  return getDefaultHistory();
}

/**
 * Get the full local history from storage
 */
export function getLocalHistory(): LocalHistory {
  const storedData = readFromStorage();
  return migrateIfNeeded(storedData);
}

/**
 * Save the full local history to storage
 */
export function saveLocalHistory(history: LocalHistory): void {
  writeToStorage({
    version: history.version,
    restaurants: history.restaurants,
    temporaryExcludes: history.temporaryExcludes,
    recentRecommendationBatches: history.recentRecommendationBatches,
  });
}

/**
 * Get restaurant history for a specific poiId
 */
export function getRestaurantHistory(poiId: string): RestaurantHistory | null {
  const history = getLocalHistory();
  return history.restaurants[poiId] ?? null;
}

/**
 * Record a restaurant selection
 */
export function recordSelection(restaurant: {
  id: string;
  name: string;
  category: string;
}): void {
  const history = getLocalHistory();

  const existingRecord = history.restaurants[restaurant.id];
  const now = new Date().toISOString();

  history.restaurants[restaurant.id] = {
    name: restaurant.name,
    selectedCount: (existingRecord?.selectedCount ?? 0) + 1,
    lastSelectedAt: now,
    lastSeenCategory: restaurant.category,
  };

  saveLocalHistory(history);
}

/**
 * Get the number of times a restaurant has been selected
 */
export function getSelectionCount(poiId: string): number {
  const history = getRestaurantHistory(poiId);
  return history?.selectedCount ?? 0;
}

/**
 * Get the last selected time for a restaurant
 */
export function getLastSelectedTime(poiId: string): string | null {
  const history = getRestaurantHistory(poiId);
  return history?.lastSelectedAt ?? null;
}

/**
 * Get the list of temporary excludes
 */
export function getTemporaryExcludes(): string[] {
  const history = getLocalHistory();
  return [...history.temporaryExcludes];
}

/**
 * Add a temporary exclude (restaurant ID or category)
 */
export function addTemporaryExclude(item: string): void {
  const history = getLocalHistory();

  if (!history.temporaryExcludes.includes(item)) {
    history.temporaryExcludes.push(item);
    saveLocalHistory(history);
  }
}

/**
 * Remove a temporary exclude
 */
export function removeTemporaryExclude(item: string): void {
  const history = getLocalHistory();

  const index = history.temporaryExcludes.indexOf(item);
  if (index !== -1) {
    history.temporaryExcludes.splice(index, 1);
    saveLocalHistory(history);
  }
}

/**
 * Clear all history (restaurants, excludes, and batches)
 */
export function clearHistory(): void {
  const defaultHistory = getDefaultHistory();
  saveLocalHistory(defaultHistory);
}

/**
 * Get recent recommendation batches for deduplication
 */
export function getRecentBatches(): string[][] {
  const history = getLocalHistory();
  return [...history.recentRecommendationBatches];
}

/**
 * Add a new recommendation batch
 */
export function addRecentBatch(poiIds: string[]): void {
  const history = getLocalHistory();

  // Add new batch to the front
  history.recentRecommendationBatches.unshift(poiIds);

  // Keep only the most recent batches (limit to MAX_RECENT_BATCHES)
  if (history.recentRecommendationBatches.length > MAX_RECENT_BATCHES) {
    history.recentRecommendationBatches = history.recentRecommendationBatches.slice(
      0,
      MAX_RECENT_BATCHES
    );
  }

  saveLocalHistory(history);
}

/**
 * Clear all recent recommendation batches
 */
export function clearRecentBatches(): void {
  const history = getLocalHistory();
  history.recentRecommendationBatches = [];
  saveLocalHistory(history);
}

/**
 * Data optimization utilities for large data structures
 * Implements lazy loading, caching, and virtualization patterns
 */

// Cache for loaded data to prevent redundant operations
const dataCache = new Map<string, any>();
const indexCache = new Map<string, Map<string, any>>();

// Lazy loading wrapper
export function createLazyLoader<T>(
  loader: () => Promise<T> | T,
  cacheKey: string
): () => Promise<T> {
  return async () => {
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }
    
    const data = await loader();
    dataCache.set(cacheKey, data);
    return data;
  };
}

// Create indexed access for O(1) lookups instead of O(n) array searches
export function createIndexedAccess<T extends { id: string }>(
  data: T[],
  cacheKey: string
): {
  getById: (id: string) => T | undefined;
  getByIds: (ids: string[]) => T[];
  search: (predicate: (item: T) => boolean) => T[];
  getAll: () => T[];
} {
  let index = indexCache.get(cacheKey);
  
  if (!index) {
    index = new Map();
    data.forEach(item => index!.set(item.id, item));
    indexCache.set(cacheKey, index);
  }
  
  return {
    getById: (id: string) => index!.get(id),
    getByIds: (ids: string[]) => ids.map(id => index!.get(id)).filter(Boolean) as T[],
    search: (predicate: (item: T) => boolean) => data.filter(predicate),
    getAll: () => data
  };
}

// Virtual scrolling helper for large lists
export function createVirtualizedList<T>(
  items: T[],
  viewportHeight: number,
  itemHeight: number
) {
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const bufferSize = Math.max(5, Math.floor(visibleCount * 0.5));
  
  return {
    getVisibleItems: (scrollTop: number) => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const bufferedStart = Math.max(0, startIndex - bufferSize);
      const bufferedEnd = Math.min(items.length, startIndex + visibleCount + bufferSize);
      
      return {
        items: items.slice(bufferedStart, bufferedEnd),
        startIndex: bufferedStart,
        endIndex: bufferedEnd,
        totalHeight: items.length * itemHeight,
        offsetY: bufferedStart * itemHeight
      };
    },
    getTotalHeight: () => items.length * itemHeight,
    getItemCount: () => items.length
  };
}

// Chunk processing for large datasets
export function processInChunks<T, R>(
  items: T[],
  processor: (chunk: T[]) => R[],
  chunkSize: number = 50
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = [];
    let currentIndex = 0;
    
    function processNextChunk() {
      const chunk = items.slice(currentIndex, currentIndex + chunkSize);
      if (chunk.length === 0) {
        resolve(results);
        return;
      }
      
      const chunkResults = processor(chunk);
      results.push(...chunkResults);
      currentIndex += chunkSize;
      
      // Use setTimeout to yield control and prevent blocking
      setTimeout(processNextChunk, 0);
    }
    
    processNextChunk();
  });
}

// Memoization for expensive calculations
export function memoize<T extends any[], R>(
  fn: (...args: T) => R,
  keyGenerator?: (...args: T) => string
): (...args: T) => R {
  const cache = new Map<string, R>();
  
  return (...args: T): R => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Debounced search for large datasets
export function createDebouncedSearch<T>(
  searchFn: (query: string) => T[],
  debounceMs: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastResults: T[] = [];
  
  return {
    search: (query: string): Promise<T[]> => {
      return new Promise((resolve) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (query.trim() === '') {
          lastResults = [];
          resolve(lastResults);
          return;
        }
        
        timeoutId = setTimeout(() => {
          lastResults = searchFn(query);
          resolve(lastResults);
        }, debounceMs);
      });
    },
    getLastResults: () => lastResults,
    clearResults: () => {
      lastResults = [];
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}

// Clear caches to free memory
export function clearDataCaches() {
  dataCache.clear();
  indexCache.clear();
}
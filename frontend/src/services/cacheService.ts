/**
 * Advanced caching service with TTL, LRU eviction, and memory management
 * Caches frequently accessed data to improve performance
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  memoryThreshold: number; // bytes (rough estimate)
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = []; // For LRU tracking
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  
  private config: CacheConfig = {
    maxSize: 1000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000, // 1 minute
    memoryThreshold: 10 * 1024 * 1024 // 10MB
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  public set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const finalTTL = ttl || this.config.defaultTTL;
    
    // Remove from access order if it exists
    this.removeFromAccessOrder(key);
    
    // Add to cache
    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
      ttl: finalTTL
    });
    
    // Add to front of access order (most recently used)
    this.accessOrder.unshift(key);
    
    // Enforce size limits
    this.enforceSize();
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
      this.delete(key);
      return null;
    }
    
    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;
    
    // Move to front of access order (most recently used)
    this.removeFromAccessOrder(key);
    this.accessOrder.unshift(key);
    
    return entry.value;
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.ttl && (Date.now() - entry.timestamp) > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  public delete(key: string): boolean {
    this.removeFromAccessOrder(key);
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private enforceSize(): void {
    // Remove expired entries first
    this.removeExpired();
    
    // If still over size limit, remove least recently used
    while (this.cache.size > this.config.maxSize) {
      const lruKey = this.accessOrder.pop();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
  }

  private removeExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  private cleanup(): void {
    this.removeExpired();
    
    // Estimate memory usage and clean up if needed
    const estimatedMemory = this.estimateMemoryUsage();
    
    if (estimatedMemory > this.config.memoryThreshold) {
      this.aggressiveCleanup();
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Estimate size based on JSON serialization
      try {
        const serialized = JSON.stringify({ key, value: entry.value });
        totalSize += serialized.length * 2; // UTF-16 characters are 2 bytes
      } catch {
        // If can't serialize, assume 1KB
        totalSize += 1024;
      }
    }
    
    return totalSize;
  }

  private aggressiveCleanup(): void {
    // Remove least frequently accessed items
    const entries = Array.from(this.cache.entries());
    
    // Sort by access count (ascending) and last accessed (ascending)
    entries.sort(([, a], [, b]) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      return a.lastAccessed - b.lastAccessed;
    });
    
    // Remove bottom 25% of entries
    const removeCount = Math.floor(entries.length * 0.25);
    
    for (let i = 0; i < removeCount; i++) {
      const [key] = entries[i];
      this.delete(key);
    }
  }

  public getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let averageAge = 0;
    let totalAccessCount = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
        expiredCount++;
      }
      averageAge += (now - entry.timestamp);
      totalAccessCount += entry.accessCount;
    }
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      expiredCount,
      averageAge: this.cache.size > 0 ? averageAge / this.cache.size : 0,
      totalAccessCount,
      estimatedMemory: this.estimateMemoryUsage(),
      memoryThreshold: this.config.memoryThreshold
    };
  }

  public destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.clear();
  }
}

// Create specialized cache instances
const generalCache = new CacheService();

const characterCache = new CacheService({
  maxSize: 500,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  memoryThreshold: 5 * 1024 * 1024 // 5MB
});

const battleCache = new CacheService({
  maxSize: 100,
  defaultTTL: 2 * 60 * 1000, // 2 minutes
  memoryThreshold: 2 * 1024 * 1024 // 2MB
});

// Export cache instances and utilities
export { CacheService };

export const cache = {
  general: generalCache,
  characters: characterCache,
  battles: battleCache,
  
  // Convenience methods for general cache
  set: <T>(key: string, value: T, ttl?: number) => generalCache.set(key, value, ttl),
  get: <T>(key: string) => generalCache.get<T>(key),
  has: (key: string) => generalCache.has(key),
  delete: (key: string) => generalCache.delete(key),
  clear: () => generalCache.clear(),
  getStats: () => ({
    general: generalCache.getStats(),
    characters: characterCache.getStats(),
    battles: battleCache.getStats()
  })
};

export default cache;
/**
 * Optimized localStorage service with debouncing, batching, and error handling
 * Reduces I/O operations and prevents storage quota exceeded errors
 */

interface StorageOperation {
  key: string;
  value: any;
  timestamp: number;
}

interface StorageConfig {
  debounceMs: number;
  batchSize: number;
  maxRetries: number;
  compressionThreshold: number; // bytes
}

class OptimizedStorage {
  private pendingOperations = new Map<string, StorageOperation>();
  private flushTimeoutId: NodeJS.Timeout | null = null;
  private memoryCache = new Map<string, any>();
  
  private config: StorageConfig = {
    debounceMs: 500,
    batchSize: 10,
    maxRetries: 3,
    compressionThreshold: 1024 // 1KB
  };

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...this.config, ...config };
    
    // Load existing data into memory cache on initialization
    this.initializeCache();
    
    // Set up periodic flush to prevent data loss
    this.setupPeriodicFlush();
  }

  private initializeCache() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      // Load only essential keys into cache
      const essentialKeys = ['user-settings', 'game-progress', 'character-data'];
      
      essentialKeys.forEach(key => {
        try {
          const value = window.localStorage.getItem(key);
          if (value !== null) {
            this.memoryCache.set(key, JSON.parse(value));
          }
        } catch (error) {
          console.warn(`Failed to load cached data for key: ${key}`, error);
        }
      });
    } catch (error) {
      console.warn('Failed to initialize storage cache:', error);
    }
  }

  private setupPeriodicFlush() {
    // Flush pending operations every 5 seconds to prevent data loss
    setInterval(() => {
      if (this.pendingOperations.size > 0) {
        this.flushPendingOperations();
      }
    }, 5000);
  }

  public set(key: string, value: any): void {
    // Update memory cache immediately
    this.memoryCache.set(key, value);
    
    // Add to pending operations for batched write
    this.pendingOperations.set(key, {
      key,
      value,
      timestamp: Date.now()
    });

    this.scheduleFlush();
  }

  public get(key: string): any {
    // Try memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // Fall back to localStorage
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        const parsed = JSON.parse(value);
        this.memoryCache.set(key, parsed); // Cache for future reads
        return parsed;
      }
    } catch (error) {
      console.warn(`Failed to read from localStorage for key: ${key}`, error);
    }

    return null;
  }

  public remove(key: string): void {
    this.memoryCache.delete(key);
    this.pendingOperations.delete(key);
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Failed to remove from localStorage for key: ${key}`, error);
    }
  }

  public clear(): void {
    this.memoryCache.clear();
    this.pendingOperations.clear();
    
    if (this.flushTimeoutId) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimeoutId) {
      clearTimeout(this.flushTimeoutId);
    }

    // Immediate flush if batch size reached
    if (this.pendingOperations.size >= this.config.batchSize) {
      this.flushPendingOperations();
      return;
    }

    // Schedule debounced flush
    this.flushTimeoutId = setTimeout(() => {
      this.flushPendingOperations();
    }, this.config.debounceMs);
  }

  private async flushPendingOperations(): Promise<void> {
    if (this.pendingOperations.size === 0) return;

    const operations = Array.from(this.pendingOperations.values());
    this.pendingOperations.clear();

    if (this.flushTimeoutId) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }

    // Process operations in batches
    for (let i = 0; i < operations.length; i += this.config.batchSize) {
      const batch = operations.slice(i, i + this.config.batchSize);
      await this.processBatch(batch);
    }
  }

  private async processBatch(operations: StorageOperation[]): Promise<void> {
    for (const operation of operations) {
      await this.writeToStorage(operation.key, operation.value);
    }
  }

  private async writeToStorage(key: string, value: any, retryCount = 0): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      const serialized = JSON.stringify(value);
      
      // Check if compression might be needed
      if (serialized.length > this.config.compressionThreshold) {
        console.warn(`Large storage write for key: ${key} (${serialized.length} bytes)`);
      }

      window.localStorage.setItem(key, serialized);
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        // Handle quota exceeded errors
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          await this.handleQuotaExceeded();
          return this.writeToStorage(key, value, retryCount + 1);
        }
        
        // Retry for other errors
        setTimeout(() => {
          this.writeToStorage(key, value, retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        console.error(`Failed to write to localStorage after ${this.config.maxRetries} attempts:`, error);
      }
    }
  }

  private async handleQuotaExceeded(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      console.warn('Storage quota exceeded, attempting cleanup...');
      
      // Remove old cache entries first
      const keysToRemove: string[] = [];
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        
        // Remove cache entries older than maxAge
        if (key.startsWith('cache-') || key.startsWith('temp-')) {
          try {
            const item = window.localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.timestamp && (now - data.timestamp) > maxAge) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove identified keys
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove key during cleanup: ${key}`, error);
        }
      });
      
      console.log(`Cleaned up ${keysToRemove.length} old storage entries`);
    } catch (error) {
      console.error('Failed to handle quota exceeded error:', error);
    }
  }

  // Force flush all pending operations
  public async flush(): Promise<void> {
    await this.flushPendingOperations();
  }

  // Get current cache statistics
  public getStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      pendingOperations: this.pendingOperations.size,
      isFlushScheduled: this.flushTimeoutId !== null
    };
  }
}

// Singleton instance
let storageInstance: OptimizedStorage | null = null;

export function getOptimizedStorage(): OptimizedStorage {
  if (!storageInstance) {
    storageInstance = new OptimizedStorage();
  }
  return storageInstance;
}

// Convenience functions
export const storage = {
  set: (key: string, value: any) => getOptimizedStorage().set(key, value),
  get: (key: string) => getOptimizedStorage().get(key),
  remove: (key: string) => getOptimizedStorage().remove(key),
  clear: () => getOptimizedStorage().clear(),
  flush: () => getOptimizedStorage().flush(),
  getStats: () => getOptimizedStorage().getStats()
};

export default OptimizedStorage;
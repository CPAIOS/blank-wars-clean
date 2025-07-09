import { redisService, CacheInterface } from './redisService';

// Fallback in-memory cache for development/testing
class InMemoryCache implements CacheInterface {
  private cache = new Map<string, { value: string; expires?: number }>();
  private hashes = new Map<string, Map<string, string>>();
  private sets = new Map<string, Set<string>>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expires = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.cache.set(key, { value, expires });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.hashes.delete(key);
    this.sets.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expires = Date.now() + (ttlSeconds * 1000);
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    const current = await this.get(key);
    const value = (current ? parseInt(current, 10) : 0) + by;
    await this.set(key, value.toString());
    return value;
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    return this.increment(key, -by);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    this.hashes.get(key)!.set(field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hash = this.hashes.get(key);
    return hash ? hash.get(field) || null : null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    
    const result: Record<string, string> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    return result;
  }

  async hdel(key: string, field: string): Promise<void> {
    const hash = this.hashes.get(key);
    if (hash) {
      hash.delete(field);
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<void> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key)!.add(member);
  }

  async srem(key: string, member: string): Promise<void> {
    const set = this.sets.get(key);
    if (set) {
      set.delete(member);
    }
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const set = this.sets.get(key);
    return set ? set.has(member) : false;
  }

  // Pub/Sub (no-op for in-memory)
  async publish(channel: string, message: string): Promise<void> {
    console.log(`[InMemory] Would publish to ${channel}: ${message}`);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    console.log(`[InMemory] Would subscribe to ${channel}`);
  }
}

class CacheService {
  private redis: CacheInterface;
  private fallback: CacheInterface;
  private useRedis: boolean = false;

  constructor() {
    this.redis = redisService;
    this.fallback = new InMemoryCache();
    
    // Start with in-memory cache for development
    this.useRedis = false;
    
    // Skip Redis health check for development
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
      setTimeout(() => {
        this.checkRedisHealth();
      }, 100);
    }
  }

  private async checkRedisHealth(): Promise<void> {
    try {
      // Add timeout to prevent hanging
      const healthCheckPromise = (async () => {
        await this.redis.set('health_check', 'ok', 10);
        const result = await this.redis.get('health_check');
        return result === 'ok';
      })();
      
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Redis health check timeout')), 5000);
      });
      
      this.useRedis = await Promise.race([healthCheckPromise, timeoutPromise]);
      
      if (this.useRedis) {
        console.log('✅ Redis health check passed - using Redis cache');
      } else {
        console.warn('⚠️ Redis health check failed - falling back to in-memory cache');
      }
    } catch (error) {
      console.warn('⚠️ Redis unavailable - using in-memory cache:', error instanceof Error ? error.message : String(error));
      this.useRedis = false;
    }
  }

  private getCache(): CacheInterface {
    return this.useRedis ? this.redis : this.fallback;
  }

  // Basic cache operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.getCache().get(key);
    } catch (error) {
      if (this.useRedis) {
        console.warn('Redis operation failed, falling back to in-memory:', error instanceof Error ? error.message : String(error));
        return await this.fallback.get(key);
      }
      throw error;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      await this.getCache().set(key, value, ttlSeconds);
    } catch (error) {
      if (this.useRedis) {
        console.warn('Redis operation failed, falling back to in-memory:', error instanceof Error ? error.message : String(error));
        await this.fallback.set(key, value, ttlSeconds);
      } else {
        throw error;
      }
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.getCache().del(key);
    } catch (error) {
      if (this.useRedis) {
        console.warn('Redis operation failed, falling back to in-memory:', error instanceof Error ? error.message : String(error));
        await this.fallback.del(key);
      } else {
        throw error;
      }
    }
  }

  // Battle-specific methods
  async setBattleState(battleId: string, state: any): Promise<void> {
    await this.set(`battle:${battleId}`, JSON.stringify(state), 3600); // 1 hour TTL
  }

  async getBattleState(battleId: string): Promise<any | null> {
    const data = await this.get(`battle:${battleId}`);
    return data ? JSON.parse(data) : null;
  }

  async addPlayerToMatchmaking(playerId: string, playerData: any, mode: string = 'casual'): Promise<void> {
    const queueKey = `matchmaking:${mode}`;
    try {
      if (this.useRedis) {
        await this.redis.hset(queueKey, playerId, JSON.stringify(playerData));
        await this.redis.sadd(`${queueKey}:players`, playerId);
        await this.redis.expire(queueKey, 600); // 10 minutes
        await this.redis.expire(`${queueKey}:players`, 600);
      } else {
        await this.fallback.hset(queueKey, playerId, JSON.stringify(playerData));
        await this.fallback.sadd(`${queueKey}:players`, playerId);
      }
    } catch (error) {
      console.error('Failed to add player to matchmaking:', error);
      throw error;
    }
  }

  async removePlayerFromMatchmaking(playerId: string, mode: string = 'casual'): Promise<void> {
    const queueKey = `matchmaking:${mode}`;
    try {
      if (this.useRedis) {
        await this.redis.hdel(queueKey, playerId);
        await this.redis.srem(`${queueKey}:players`, playerId);
      } else {
        await this.fallback.hdel(queueKey, playerId);
        await this.fallback.srem(`${queueKey}:players`, playerId);
      }
    } catch (error) {
      console.error('Failed to remove player from matchmaking:', error);
      throw error;
    }
  }

  async getMatchmakingQueue(mode: string = 'casual'): Promise<Array<{ id: string; data: any }>> {
    const queueKey = `matchmaking:${mode}`;
    try {
      const cache = this.getCache();
      const playerIds = await cache.smembers(`${queueKey}:players`);
      const players = [];
      
      for (const playerId of playerIds) {
        const playerDataString = await cache.hget(queueKey, playerId);
        if (playerDataString) {
          players.push({
            id: playerId,
            data: JSON.parse(playerDataString)
          });
        }
      }
      
      return players;
    } catch (error) {
      console.error('Failed to get matchmaking queue:', error);
      return [];
    }
  }

  async getMatchmakingQueueSize(mode: string = 'casual'): Promise<number> {
    try {
      const queueKey = `matchmaking:${mode}:players`;
      const playerIds = await this.getCache().smembers(queueKey);
      return playerIds.length;
    } catch (error) {
      console.error('Failed to get queue size:', error);
      return 0;
    }
  }

  // Battle coordination methods
  async publishBattleEvent(battleId: string, event: any): Promise<void> {
    try {
      const channel = `battle:${battleId}:events`;
      const message = JSON.stringify(event);
      
      if (this.useRedis) {
        await this.redis.publish(channel, message);
      } else {
        // For in-memory cache, we can't really publish between servers
        console.log(`[InMemory] Battle event for ${battleId}:`, event);
      }
    } catch (error) {
      console.error('Failed to publish battle event:', error);
    }
  }

  async subscribeToBattleEvents(battleId: string, callback: (event: any) => void): Promise<void> {
    try {
      const channel = `battle:${battleId}:events`;
      
      if (this.useRedis) {
        await this.redis.subscribe(channel, (message: string) => {
          try {
            const event = JSON.parse(message);
            callback(event);
          } catch (error) {
            console.error('Failed to parse battle event:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to subscribe to battle events:', error);
    }
  }

  // Server coordination
  async registerServer(serverId: string, serverInfo: any): Promise<void> {
    try {
      await this.set(`server:${serverId}`, JSON.stringify(serverInfo), 60); // 1 minute heartbeat
    } catch (error) {
      console.error('Failed to register server:', error);
    }
  }

  async getActiveServers(): Promise<Array<{ id: string; info: any }>> {
    try {
      // This would require scanning in Redis, which is expensive
      // For now, return empty array for in-memory cache
      return [];
    } catch (error) {
      console.error('Failed to get active servers:', error);
      return [];
    }
  }

  // Health and debugging
  isUsingRedis(): boolean {
    return this.useRedis;
  }

  async getStats(): Promise<{ provider: string; health: boolean }> {
    return {
      provider: this.useRedis ? 'Redis' : 'InMemory',
      health: this.useRedis ? (redisService as any).isHealthy() : true
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
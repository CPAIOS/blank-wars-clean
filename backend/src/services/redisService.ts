import Redis from 'ioredis';
import { config } from 'dotenv';

// Load environment variables
config();

export interface CacheInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  increment(key: string, by?: number): Promise<number>;
  decrement(key: string, by?: number): Promise<number>;
  hset(key: string, field: string, value: string): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, field: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;
  publish(channel: string, message: string): Promise<void>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
}

class RedisService implements CacheInterface {
  private redis: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected = false;
  private subscribers = new Map<string, Set<(message: string) => void>>();

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    // Skip Redis entirely if no REDIS_URL is set (local development)
    if (!process.env.REDIS_URL) {
      console.log('📝 No REDIS_URL set - using in-memory cache for local development');
      this.isConnected = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL;
      const redisOptions = {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1, // Minimal retries for faster fallback
        lazyConnect: true,
        connectTimeout: 3000, // Short timeout for faster fallback
        enableOfflineQueue: false, // Don't queue commands when disconnected
        maxRetriesPerRequest: 1, // Ensure no hanging retries
      };

      console.log('🔄 Connecting to Redis...');
      
      this.redis = new Redis(redisUrl, redisOptions);
      this.subscriber = new Redis(redisUrl, redisOptions);

      // Comprehensive error handling to prevent unhandled errors
      const setupErrorHandlers = (instance: Redis, name: string) => {
        instance.on('error', (error) => {
          console.warn(`⚠️ Redis ${name} error (falling back to in-memory cache):`, error.message);
          this.isConnected = false;
        });

        instance.on('close', () => {
          if (this.isConnected) {
            console.warn(`⚠️ Redis ${name} connection closed`);
          }
          this.isConnected = false;
        });

        instance.on('end', () => {
          this.isConnected = false;
        });

        instance.on('reconnecting', () => {
          console.log(`🔄 Redis ${name} reconnecting...`);
        });

        // Handle any other events that might throw
        instance.on('connect', () => {
          console.log(`✅ Redis ${name} connected`);
        });
      };

      setupErrorHandlers(this.redis, 'client');
      setupErrorHandlers(this.subscriber, 'subscriber');

      // Connect with timeout protection
      const connectTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
      });

      await Promise.race([
        Promise.all([
          this.redis.connect(),
          this.subscriber.connect()
        ]),
        connectTimeout
      ]);

      this.isConnected = true;
      console.log('✅ Redis fully connected and ready');

      // Set up subscriber message handling
      this.subscriber.on('message', (channel, message) => {
        const callbacks = this.subscribers.get(channel);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error(`Error in subscriber callback for channel ${channel}:`, error);
            }
          });
        }
      });

    } catch (error) {
      console.warn('⚠️ Redis connection failed - using in-memory cache:', error instanceof Error ? error.message : String(error));
      this.isConnected = false;
      
      // Clean up failed connections
      if (this.redis) {
        try {
          this.redis.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (this.subscriber) {
        try {
          this.subscriber.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  private ensureConnection(): void {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis not connected. Using fallback cache.');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      this.ensureConnection();
      return await this.redis!.get(key);
    } catch (error) {
      console.warn(`Redis GET failed for key ${key}, falling back:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      this.ensureConnection();
      if (ttlSeconds) {
        await this.redis!.setex(key, ttlSeconds, value);
      } else {
        await this.redis!.set(key, value);
      }
    } catch (error) {
      console.warn(`Redis SET failed for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.del(key);
    } catch (error) {
      console.warn(`Redis DEL failed for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      this.ensureConnection();
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      console.warn(`Redis EXISTS failed for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.expire(key, ttlSeconds);
    } catch (error) {
      console.warn(`Redis EXPIRE failed for key ${key}:`, error);
      throw error;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      this.ensureConnection();
      return await this.redis!.incrby(key, by);
    } catch (error) {
      console.warn(`Redis INCR failed for key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      this.ensureConnection();
      return await this.redis!.decrby(key, by);
    } catch (error) {
      console.warn(`Redis DECR failed for key ${key}:`, error);
      throw error;
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.hset(key, field, value);
    } catch (error) {
      console.warn(`Redis HSET failed for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      this.ensureConnection();
      return await this.redis!.hget(key, field);
    } catch (error) {
      console.warn(`Redis HGET failed for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      this.ensureConnection();
      return await this.redis!.hgetall(key);
    } catch (error) {
      console.warn(`Redis HGETALL failed for key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.hdel(key, field);
    } catch (error) {
      console.warn(`Redis HDEL failed for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.sadd(key, member);
    } catch (error) {
      console.warn(`Redis SADD failed for key ${key}:`, error);
      throw error;
    }
  }

  async srem(key: string, member: string): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.srem(key, member);
    } catch (error) {
      console.warn(`Redis SREM failed for key ${key}:`, error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      this.ensureConnection();
      return await this.redis!.smembers(key);
    } catch (error) {
      console.warn(`Redis SMEMBERS failed for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      this.ensureConnection();
      const result = await this.redis!.sismember(key, member);
      return result === 1;
    } catch (error) {
      console.warn(`Redis SISMEMBER failed for key ${key}:`, error);
      return false;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<void> {
    try {
      this.ensureConnection();
      await this.redis!.publish(channel, message);
    } catch (error) {
      console.warn(`Redis PUBLISH failed for channel ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      if (!this.subscriber) {
        throw new Error('Redis subscriber not initialized');
      }

      // Add callback to subscribers map
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set());
        await this.subscriber.subscribe(channel);
      }
      this.subscribers.get(channel)!.add(callback);

    } catch (error) {
      console.warn(`Redis SUBSCRIBE failed for channel ${channel}:`, error);
      throw error;
    }
  }

  // Battle-specific methods
  async setBattleState(battleId: string, state: any, ttlSeconds: number = 3600): Promise<void> {
    await this.set(`battle:${battleId}`, JSON.stringify(state), ttlSeconds);
  }

  async getBattleState(battleId: string): Promise<any | null> {
    const data = await this.get(`battle:${battleId}`);
    return data ? JSON.parse(data) : null;
  }

  async addPlayerToQueue(queueName: string, playerId: string, playerData: any): Promise<void> {
    await this.hset(`queue:${queueName}`, playerId, JSON.stringify(playerData));
    await this.sadd(`queue:${queueName}:players`, playerId);
  }

  async removePlayerFromQueue(queueName: string, playerId: string): Promise<void> {
    await this.hdel(`queue:${queueName}`, playerId);
    await this.srem(`queue:${queueName}:players`, playerId);
  }

  async getQueuePlayers(queueName: string): Promise<Array<{ id: string; data: any }>> {
    const playerIds = await this.smembers(`queue:${queueName}:players`);
    const players = [];
    
    for (const playerId of playerIds) {
      const playerDataString = await this.hget(`queue:${queueName}`, playerId);
      if (playerDataString) {
        players.push({
          id: playerId,
          data: JSON.parse(playerDataString)
        });
      }
    }
    
    return players;
  }

  async getQueueSize(queueName: string): Promise<number> {
    const playerIds = await this.smembers(`queue:${queueName}:players`);
    return playerIds.length;
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.isConnected && this.redis !== null;
  }
}

// Export singleton instance
export const redisService = new RedisService();
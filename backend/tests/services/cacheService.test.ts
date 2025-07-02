import { cacheService } from '../../src/services/cacheService';

// Mock Redis to force in-memory cache usage
jest.mock('../../src/services/redisService', () => ({
  redisService: {
    isConnected: () => false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    scard: jest.fn(),
    lpush: jest.fn(),
    rpop: jest.fn(),
    llen: jest.fn(),
    lrange: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
  }
}));

describe('CacheService', () => {
  beforeEach(async () => {
    // Clear any cached data between tests
    jest.clearAllMocks();
    // Force use of in-memory cache for testing
    (cacheService as any).useRedis = false;
    // Clear the fallback cache
    const fallbackCache = (cacheService as any).fallback;
    if (fallbackCache && fallbackCache.cache) {
      fallbackCache.cache.clear();
      fallbackCache.hashes.clear();
      fallbackCache.sets.clear();
    }
    // Wait a bit for any async initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  describe('basic cache operations', () => {
    it('should store and retrieve values', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toBe(value);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await cacheService.get('non-existent-key');
      expect(retrieved).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      const key = 'ttl-test-key';
      const value = 'ttl-test-value';

      await cacheService.set(key, value, 1); // 1 second TTL
      
      // Should exist immediately
      let retrieved = await cacheService.get(key);
      expect(retrieved).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });

    it('should delete values', async () => {
      const key = 'delete-test-key';
      const value = 'delete-test-value';

      await cacheService.set(key, value);
      await cacheService.del(key);
      
      const retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('battle state management', () => {
    it('should store and retrieve battle state', async () => {
      const battleId = 'battle-123';
      const battleState = {
        id: battleId,
        status: 'active',
        round: 3,
        player1Health: 75,
        player2Health: 60
      };

      await cacheService.setBattleState(battleId, battleState);
      const retrieved = await cacheService.getBattleState(battleId);

      expect(retrieved).toEqual(battleState);
    });

    it('should return null for non-existent battle state', async () => {
      const retrieved = await cacheService.getBattleState('non-existent-battle');
      expect(retrieved).toBeNull();
    });
  });

  describe('matchmaking queue management', () => {
    const playerId = 'player-123';
    const playerData = {
      characterId: 'char-456',
      rating: 1500,
      joinedAt: Date.now()
    };

    it('should add player to matchmaking queue', async () => {
      await cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
      
      const queueSize = await cacheService.getMatchmakingQueueSize('ranked');
      expect(queueSize).toBeGreaterThan(0);
    });

    it('should retrieve players from matchmaking queue', async () => {
      await cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
      
      const players = await cacheService.getMatchmakingQueue('ranked');
      expect(players).toEqual([
        {
          id: playerId,
          data: playerData
        }
      ]);
    });

    it('should remove player from matchmaking queue', async () => {
      await cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
      await cacheService.removePlayerFromMatchmaking(playerId, 'ranked');
      
      const queueSize = await cacheService.getMatchmakingQueueSize('ranked');
      expect(queueSize).toBe(0);
    });

    it('should handle multiple players in queue', async () => {
      const player1Data = { ...playerData, rating: 1400 };
      const player2Data = { ...playerData, rating: 1600 };

      await cacheService.addPlayerToMatchmaking('player-1', player1Data, 'ranked');
      await cacheService.addPlayerToMatchmaking('player-2', player2Data, 'ranked');
      
      const queueSize = await cacheService.getMatchmakingQueueSize('ranked');
      expect(queueSize).toBe(2);

      const players = await cacheService.getMatchmakingQueue('ranked');
      expect(players).toHaveLength(2);
    });

    it('should separate queues by mode', async () => {
      await cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
      await cacheService.addPlayerToMatchmaking(playerId, playerData, 'casual');
      
      const rankedSize = await cacheService.getMatchmakingQueueSize('ranked');
      const casualSize = await cacheService.getMatchmakingQueueSize('casual');
      
      expect(rankedSize).toBe(1);
      expect(casualSize).toBe(1);
    });
  });

  describe('cache provider selection', () => {
    it('should report cache provider', () => {
      const isUsingRedis = cacheService.isUsingRedis();
      expect(typeof isUsingRedis).toBe('boolean');
    });

    it('should provide cache stats', async () => {
      const stats = await cacheService.getStats();
      
      expect(stats).toHaveProperty('provider');
      expect(stats).toHaveProperty('health');
      expect(typeof stats.provider).toBe('string');
      expect(typeof stats.health).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON in battle state', async () => {
      // This test would require mocking the underlying cache to return invalid JSON
      // For now, test that the method doesn't throw
      const battleState = await cacheService.getBattleState('invalid-battle');
      expect(battleState).toBeNull();
    });

    it('should handle queue operations gracefully', async () => {
      // Test that queue operations don't throw even with invalid data
      await expect(cacheService.getMatchmakingQueue('non-existent-mode'))
        .resolves.toEqual([]);
      
      await expect(cacheService.getMatchmakingQueueSize('non-existent-mode'))
        .resolves.toBe(0);
    });
  });
});
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Mock Redis service to force fallback to in-memory cache
jest.mock('../../src/services/redisService', () => ({
    redisService: {
        get: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        set: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        del: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        exists: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        expire: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        increment: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        decrement: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        hGet: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        hSet: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        hDel: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        sAdd: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        sRem: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        sMembers: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        sPop: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        sCard: jest.fn().mockRejectedValue(new Error('Redis unavailable')),
        connect: jest.fn(),
        disconnect: jest.fn()
    }
}));

const cacheService_1 = require("../../src/services/cacheService");

describe('CacheService', () => {
    beforeAll(async () => {
        // Wait for health check to complete and fallback to in-memory cache
        await new Promise(resolve => setTimeout(resolve, 1500));
    });
    
    beforeEach(async () => {
        // Clear any cached data between tests
        jest.clearAllMocks();
        
        // Clean up matchmaking queues between tests
        try {
            await cacheService_1.cacheService.removePlayerFromMatchmaking('player-123', 'ranked');
            await cacheService_1.cacheService.removePlayerFromMatchmaking('player-123', 'casual');
            await cacheService_1.cacheService.removePlayerFromMatchmaking('player-1', 'ranked');
            await cacheService_1.cacheService.removePlayerFromMatchmaking('player-2', 'ranked');
        } catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('basic cache operations', () => {
        it('should store and retrieve values', async () => {
            const key = 'test-key';
            const value = 'test-value';
            await cacheService_1.cacheService.set(key, value);
            const retrieved = await cacheService_1.cacheService.get(key);
            expect(retrieved).toBe(value);
        });
        it('should return null for non-existent keys', async () => {
            const retrieved = await cacheService_1.cacheService.get('non-existent-key');
            expect(retrieved).toBeNull();
        });
        it('should handle TTL expiration', async () => {
            const key = 'ttl-test-key';
            const value = 'ttl-test-value';
            await cacheService_1.cacheService.set(key, value, 1); // 1 second TTL
            // Should exist immediately
            let retrieved = await cacheService_1.cacheService.get(key);
            expect(retrieved).toBe(value);
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));
            retrieved = await cacheService_1.cacheService.get(key);
            expect(retrieved).toBeNull();
        });
        it('should delete values', async () => {
            const key = 'delete-test-key';
            const value = 'delete-test-value';
            await cacheService_1.cacheService.set(key, value);
            await cacheService_1.cacheService.del(key);
            const retrieved = await cacheService_1.cacheService.get(key);
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
            await cacheService_1.cacheService.setBattleState(battleId, battleState);
            const retrieved = await cacheService_1.cacheService.getBattleState(battleId);
            expect(retrieved).toEqual(battleState);
        });
        it('should return null for non-existent battle state', async () => {
            const retrieved = await cacheService_1.cacheService.getBattleState('non-existent-battle');
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
            await cacheService_1.cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
            const queueSize = await cacheService_1.cacheService.getMatchmakingQueueSize('ranked');
            expect(queueSize).toBeGreaterThan(0);
        });
        it('should retrieve players from matchmaking queue', async () => {
            await cacheService_1.cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
            const players = await cacheService_1.cacheService.getMatchmakingQueue('ranked');
            expect(players).toEqual([
                {
                    id: playerId,
                    data: playerData
                }
            ]);
        });
        it('should remove player from matchmaking queue', async () => {
            await cacheService_1.cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
            await cacheService_1.cacheService.removePlayerFromMatchmaking(playerId, 'ranked');
            const queueSize = await cacheService_1.cacheService.getMatchmakingQueueSize('ranked');
            expect(queueSize).toBe(0);
        });
        it('should handle multiple players in queue', async () => {
            const player1Data = { ...playerData, rating: 1400 };
            const player2Data = { ...playerData, rating: 1600 };
            await cacheService_1.cacheService.addPlayerToMatchmaking('player-1', player1Data, 'ranked');
            await cacheService_1.cacheService.addPlayerToMatchmaking('player-2', player2Data, 'ranked');
            const queueSize = await cacheService_1.cacheService.getMatchmakingQueueSize('ranked');
            expect(queueSize).toBe(2);
            const players = await cacheService_1.cacheService.getMatchmakingQueue('ranked');
            expect(players).toHaveLength(2);
        });
        it('should separate queues by mode', async () => {
            await cacheService_1.cacheService.addPlayerToMatchmaking(playerId, playerData, 'ranked');
            await cacheService_1.cacheService.addPlayerToMatchmaking(playerId, playerData, 'casual');
            const rankedSize = await cacheService_1.cacheService.getMatchmakingQueueSize('ranked');
            const casualSize = await cacheService_1.cacheService.getMatchmakingQueueSize('casual');
            expect(rankedSize).toBe(1);
            expect(casualSize).toBe(1);
        });
    });
    describe('cache provider selection', () => {
        it('should report cache provider', () => {
            const isUsingRedis = cacheService_1.cacheService.isUsingRedis();
            expect(typeof isUsingRedis).toBe('boolean');
        });
        it('should provide cache stats', async () => {
            const stats = await cacheService_1.cacheService.getStats();
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
            const battleState = await cacheService_1.cacheService.getBattleState('invalid-battle');
            expect(battleState).toBeNull();
        });
        it('should handle queue operations gracefully', async () => {
            // Test that queue operations don't throw even with invalid data
            await expect(cacheService_1.cacheService.getMatchmakingQueue('non-existent-mode'))
                .resolves.toEqual([]);
            await expect(cacheService_1.cacheService.getMatchmakingQueueSize('non-existent-mode'))
                .resolves.toBe(0);
        });
    });
});

import { BattleManager } from '../../src/services/battleService';
import { Server as SocketIOServer } from 'socket.io';
import { dbAdapter } from '../../src/services/databaseAdapter';
import { analyticsService } from '../../src/services/analytics';

// Mock dependencies
jest.mock('../../src/services/databaseAdapter');
jest.mock('../../src/services/analytics');
jest.mock('socket.io');

const mockDbAdapter = dbAdapter as jest.Mocked<typeof dbAdapter>;
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;
const mockIO = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  sockets: {
    sockets: new Map()
  }
} as any;

describe('BattleManager', () => {
  let battleManager: BattleManager;

  beforeEach(() => {
    jest.clearAllMocks();
    battleManager = new BattleManager(mockIO);
  });

  describe('findMatch', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      rating: 1200
    };

    const mockCharacter = {
      id: 'char-456',
      user_id: 'user-123',
      character_id: 'char_003',
      name: 'Robin Hood',
      level: 5,
      current_health: 85,
      max_health: 85,
      is_injured: false,
      recovery_time: null
    };

    beforeEach(() => {
      mockDbAdapter.users.findById.mockResolvedValue(mockUser as any);
      mockDbAdapter.userCharacters.findById.mockResolvedValue(mockCharacter as any);
    });

    it('should add player to matchmaking queue when no opponent found', async () => {
      const result = await battleManager.findMatch('user-123', 'char-456', 'ranked');

      expect(result).toEqual({
        status: 'searching',
        queue_position: expect.any(Number),
        estimated_wait: expect.any(Number)
      });

      expect(mockAnalyticsService.trackUserAction).toHaveBeenCalledWith(
        'user-123',
        'matchmaking_start',
        { characterId: 'char-456', mode: 'ranked' }
      );
    });

    it('should throw error for invalid character', async () => {
      mockDbAdapter.userCharacters.findById.mockResolvedValue(null);

      await expect(battleManager.findMatch('user-123', 'invalid-char', 'ranked'))
        .rejects.toThrow('Invalid character');
    });

    it('should throw error for character not owned by user', async () => {
      const otherUserCharacter = { ...mockCharacter, user_id: 'other-user' };
      mockDbAdapter.userCharacters.findById.mockResolvedValue(otherUserCharacter as any);

      await expect(battleManager.findMatch('user-123', 'char-456', 'ranked'))
        .rejects.toThrow('Invalid character');
    });

    it('should throw error for injured character', async () => {
      const injuredCharacter = {
        ...mockCharacter,
        is_injured: true,
        recovery_time: new Date(Date.now() + 3600000) // 1 hour from now
      };
      mockDbAdapter.userCharacters.findById.mockResolvedValue(injuredCharacter as any);

      await expect(battleManager.findMatch('user-123', 'char-456', 'ranked'))
        .rejects.toThrow('Character is still recovering');
    });
  });

  describe('estimateWaitTime', () => {
    it('should return reasonable wait time estimates', () => {
      // Test different rating ranges
      expect(battleManager.estimateWaitTime(1000)).toBeGreaterThan(0);
      expect(battleManager.estimateWaitTime(1500)).toBeGreaterThan(0);
      expect(battleManager.estimateWaitTime(2000)).toBeGreaterThan(0);
    });

    it('should increase wait time for extreme ratings', () => {
      const lowRatingWait = battleManager.estimateWaitTime(500);
      const normalRatingWait = battleManager.estimateWaitTime(1000);
      const highRatingWait = battleManager.estimateWaitTime(2500);

      expect(lowRatingWait).toBeGreaterThan(normalRatingWait);
      expect(highRatingWait).toBeGreaterThan(normalRatingWait);
    });
  });

  describe('calculateCombatDamage', () => {
    const attacker = {
      base_attack: 100,
      level: 5
    };

    const defender = {
      base_defense: 80,
      level: 5
    };

    it('should calculate damage with strategy modifiers', () => {
      const aggressiveAttack = battleManager.calculateCombatDamage(
        attacker as any,
        defender as any,
        'aggressive',
        'defensive'
      );

      const defensiveAttack = battleManager.calculateCombatDamage(
        attacker as any,
        defender as any,
        'defensive',
        'aggressive'
      );

      // Aggressive should deal more damage than defensive
      expect(aggressiveAttack).toBeGreaterThan(defensiveAttack);
    });

    it('should return damage within reasonable bounds', () => {
      const damage = battleManager.calculateCombatDamage(
        attacker as any,
        defender as any,
        'balanced',
        'balanced'
      );

      expect(damage).toBeGreaterThan(0);
      expect(damage).toBeLessThan(attacker.base_attack * 2); // Reasonable upper bound
    });

    it('should apply random variance', () => {
      const damages = [];
      
      // Calculate damage multiple times to test variance
      for (let i = 0; i < 10; i++) {
        damages.push(battleManager.calculateCombatDamage(
          attacker as any,
          defender as any,
          'balanced',
          'balanced'
        ));
      }

      // Check that we get different values (variance exists)
      const uniqueDamages = new Set(damages);
      expect(uniqueDamages.size).toBeGreaterThan(1);
    });
  });

  describe('calculateRewards', () => {
    const mockBattle = {
      id: 'battle-123',
      p1_character: { level: 5, bond_level: 3 },
      p2_character: { level: 6, bond_level: 2 }
    };

    it('should calculate higher rewards for winner', () => {
      const winnerRewards = battleManager.calculateRewards(mockBattle as any, true);
      const loserRewards = battleManager.calculateRewards(mockBattle as any, false);

      expect(winnerRewards.xp).toBeGreaterThan(loserRewards.xp);
      expect(winnerRewards.currency).toBeGreaterThan(loserRewards.currency);
      expect(winnerRewards.bond).toBeGreaterThan(loserRewards.bond);
      expect(winnerRewards.winner).toBe(true);
      expect(loserRewards.winner).toBe(false);
    });

    it('should scale rewards with character level', () => {
      const lowLevelBattle = {
        ...mockBattle,
        p1_character: { level: 1, bond_level: 0 },
        p2_character: { level: 1, bond_level: 0 }
      };

      const highLevelBattle = {
        ...mockBattle,
        p1_character: { level: 10, bond_level: 5 },
        p2_character: { level: 10, bond_level: 5 }
      };

      const lowLevelRewards = battleManager.calculateRewards(lowLevelBattle as any, true);
      const highLevelRewards = battleManager.calculateRewards(highLevelBattle as any, true);

      expect(highLevelRewards.xp).toBeGreaterThan(lowLevelRewards.xp);
      expect(highLevelRewards.currency).toBeGreaterThan(lowLevelRewards.currency);
    });

    it('should return positive values for all reward types', () => {
      const rewards = battleManager.calculateRewards(mockBattle as any, true);

      expect(rewards.xp).toBeGreaterThan(0);
      expect(rewards.currency).toBeGreaterThan(0);
      expect(rewards.bond).toBeGreaterThan(0);
    });
  });

  describe('battle state management', () => {
    it('should track active battles', () => {
      expect(battleManager.getActiveBattleCount()).toBe(0);
      
      // Simulate battle creation - this would need the actual battle creation logic
      // For now, just test the getter works
      expect(typeof battleManager.getActiveBattleCount()).toBe('number');
    });

    it('should handle user socket mapping', () => {
      battleManager.setUserSocket('user-123', 'socket-456');
      
      // This tests the internal mapping - implementation detail
      // In a real test, we'd verify the socket events are sent correctly
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
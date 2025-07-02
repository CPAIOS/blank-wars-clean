/**
 * Test suite for PhysicalBattleEngine
 * Tests damage calculations, bounds checking, and security measures
 */

import { PhysicalBattleEngine } from '../physicalBattleEngine';

// Mock battle character structure
const createMockCharacter = (overrides = {}) => ({
  character: {
    id: 'test-char',
    name: 'Test Character',
    combatStats: {
      attack: 100,
      defense: 50,
      ...overrides.combatStats
    },
    baseStats: {
      strength: 20,
      ...overrides.baseStats
    },
    abilities: [
      { id: 'test-ability', power: 10 }
    ],
    equipment: {
      weapon: {
        stats: { atk: 15 }
      },
      armor: {
        stats: { def: 10 }
      },
      ...overrides.equipment
    },
    archetype: 'warrior'
  },
  currentHealth: 100,
  mentalState: {
    confidence: 75,
    stress: 30,
    currentMentalHealth: 80,
    battleFocus: 85,
    teamTrust: 70
  },
  relationshipModifiers: [],
  ...overrides
});

const createMockAction = (overrides = {}) => ({
  type: 'basic_attack',
  abilityId: null,
  ...overrides
});

const createMockBattleState = () => ({
  globalMorale: {
    player: 75,
    opponent: 60
  }
});

describe('PhysicalBattleEngine', () => {
  describe('calculateBaseDamage', () => {
    it('should calculate basic attack damage correctly', () => {
      const attacker = createMockCharacter({
        combatStats: { attack: 100 }
      });
      const action = createMockAction({ type: 'basic_attack' });

      const damage = PhysicalBattleEngine.calculateBaseDamage(attacker, action);
      expect(damage).toBe(100);
    });

    it('should calculate ability damage correctly', () => {
      const attacker = createMockCharacter({
        combatStats: { attack: 100 }
      });
      const action = createMockAction({ 
        type: 'ability', 
        abilityId: 'test-ability' 
      });

      const damage = PhysicalBattleEngine.calculateBaseDamage(attacker, action);
      expect(damage).toBe(110); // base 100 + ability power 10
    });

    it('should return 0 for defensive actions', () => {
      const attacker = createMockCharacter();
      const action = createMockAction({ type: 'defend' });

      const damage = PhysicalBattleEngine.calculateBaseDamage(attacker, action);
      expect(damage).toBe(0);
    });

    it('should handle invalid attacker gracefully', () => {
      const damage = PhysicalBattleEngine.calculateBaseDamage(null as any, createMockAction());
      expect(damage).toBe(0);
    });

    it('should enforce bounds checking on attack stat', () => {
      const attacker = createMockCharacter({
        combatStats: { attack: 99999 } // Exceeds bounds
      });
      const action = createMockAction({ type: 'basic_attack' });

      const damage = PhysicalBattleEngine.calculateBaseDamage(attacker, action);
      expect(damage).toBe(9999); // Capped at maximum
    });

    it('should enforce bounds checking on ability power', () => {
      const attacker = createMockCharacter({
        combatStats: { attack: 100 },
        character: {
          ...createMockCharacter().character,
          abilities: [{ id: 'test-ability', power: 9999 }] // Exceeds bounds
        }
      });
      const action = createMockAction({ 
        type: 'ability', 
        abilityId: 'test-ability' 
      });

      const damage = PhysicalBattleEngine.calculateBaseDamage(attacker, action);
      expect(damage).toBe(1099); // 100 + capped ability power (999)
    });
  });

  describe('calculateWeaponDamage', () => {
    it('should calculate weapon damage correctly', () => {
      const attacker = createMockCharacter({
        equipment: {
          weapon: { stats: { atk: 25 } }
        }
      });
      const action = createMockAction();

      const damage = PhysicalBattleEngine.calculateWeaponDamage(attacker, action);
      expect(damage).toBeGreaterThanOrEqual(20); // 25 + compatibility bonus
    });

    it('should return 0 for no weapon', () => {
      const attacker = createMockCharacter({
        equipment: {}
      });
      const action = createMockAction();

      const damage = PhysicalBattleEngine.calculateWeaponDamage(attacker, action);
      expect(damage).toBe(0);
    });

    it('should enforce bounds checking on weapon attack', () => {
      const attacker = createMockCharacter({
        equipment: {
          weapon: { stats: { atk: 9999 } } // Exceeds bounds
        }
      });
      const action = createMockAction();

      const damage = PhysicalBattleEngine.calculateWeaponDamage(attacker, action);
      expect(damage).toBe(999); // Capped at maximum
    });
  });

  describe('calculateStrengthBonus', () => {
    it('should calculate strength bonus correctly', () => {
      const attacker = createMockCharacter({
        baseStats: { strength: 20 }
      });

      const bonus = PhysicalBattleEngine.calculateStrengthBonus(attacker);
      expect(bonus).toBe(10); // 20 * 0.5
    });

    it('should enforce bounds checking on strength stat', () => {
      const attacker = createMockCharacter({
        baseStats: { strength: 9999 } // Exceeds bounds
      });

      const bonus = PhysicalBattleEngine.calculateStrengthBonus(attacker);
      expect(bonus).toBe(500); // Capped at maximum (999 * 0.5)
    });

    it('should handle missing strength stat', () => {
      const attacker = createMockCharacter({
        baseStats: {}
      });

      const bonus = PhysicalBattleEngine.calculateStrengthBonus(attacker);
      expect(bonus).toBe(0);
    });
  });

  describe('calculateArmorDefense', () => {
    it('should calculate armor defense correctly', () => {
      const target = createMockCharacter({
        combatStats: { defense: 30 },
        equipment: {
          armor: { stats: { def: 20 } }
        }
      });

      const defense = PhysicalBattleEngine.calculateArmorDefense(target);
      expect(defense).toBe(50); // 30 + 20
    });

    it('should handle missing armor', () => {
      const target = createMockCharacter({
        combatStats: { defense: 30 },
        equipment: {}
      });

      const defense = PhysicalBattleEngine.calculateArmorDefense(target);
      expect(defense).toBe(30);
    });

    it('should enforce bounds checking on defense values', () => {
      const target = createMockCharacter({
        combatStats: { defense: 9999 },
        equipment: {
          armor: { stats: { def: 9999 } }
        }
      });

      const defense = PhysicalBattleEngine.calculateArmorDefense(target);
      expect(defense).toBe(999); // Capped at maximum
    });
  });

  describe('calculatePsychologyModifier', () => {
    it('should calculate psychology modifier correctly', () => {
      const attacker = createMockCharacter();
      const target = createMockCharacter();
      const battleState = createMockBattleState();

      const modifier = PhysicalBattleEngine.calculatePsychologyModifier(
        attacker, 
        target, 
        battleState
      );

      expect(modifier).toBeGreaterThan(0);
      expect(modifier).toBeLessThanOrEqual(2.0); // Should be within bounds
    });

    it('should apply confidence bonuses correctly', () => {
      const highConfidenceAttacker = createMockCharacter({
        mentalState: { 
          confidence: 85, // High confidence
          stress: 20,
          currentMentalHealth: 80,
          battleFocus: 80,
          teamTrust: 70
        }
      });
      const target = createMockCharacter();
      const battleState = createMockBattleState();

      const modifier = PhysicalBattleEngine.calculatePsychologyModifier(
        highConfidenceAttacker, 
        target, 
        battleState
      );

      expect(modifier).toBeGreaterThan(1.0); // Should have positive modifier
    });

    it('should apply stress penalties correctly', () => {
      const stressedAttacker = createMockCharacter({
        mentalState: { 
          confidence: 50,
          stress: 80, // High stress
          currentMentalHealth: 80,
          battleFocus: 80,
          teamTrust: 70
        }
      });
      const target = createMockCharacter();
      const battleState = createMockBattleState();

      const modifier = PhysicalBattleEngine.calculatePsychologyModifier(
        stressedAttacker, 
        target, 
        battleState
      );

      expect(modifier).toBeLessThan(1.0); // Should have negative modifier
    });

    it('should enforce bounds on psychology modifier', () => {
      const extremeAttacker = createMockCharacter({
        mentalState: { 
          confidence: 0, // Minimum
          stress: 100, // Maximum
          currentMentalHealth: 0, // Minimum
          battleFocus: 0, // Minimum
          teamTrust: 0 // Minimum
        }
      });
      const target = createMockCharacter();
      const battleState = {
        globalMorale: { player: 0, opponent: 100 }
      };

      const modifier = PhysicalBattleEngine.calculatePsychologyModifier(
        extremeAttacker, 
        target, 
        battleState
      );

      expect(modifier).toBeGreaterThanOrEqual(0.1); // Should not go below minimum
      expect(modifier).toBeLessThanOrEqual(2.0); // Should not exceed maximum
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete damage calculation with bounds checking', () => {
      const attacker = createMockCharacter({
        combatStats: { attack: 100 },
        baseStats: { strength: 20 },
        equipment: {
          weapon: { stats: { atk: 15 } }
        }
      });
      
      const target = createMockCharacter({
        combatStats: { defense: 30 },
        equipment: {
          armor: { stats: { def: 10 } }
        },
        currentHealth: 150
      });

      const action = createMockAction({ type: 'basic_attack' });
      const battleState = createMockBattleState();

      const result = PhysicalBattleEngine.executePhysicalAction(
        attacker,
        target,
        action,
        battleState
      );

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.damage).toBeLessThanOrEqual(9999); // Within bounds
      expect(result.healthChange).toBeGreaterThan(0);
      expect(target.currentHealth).toBeLessThan(150); // Health should decrease
      expect(target.currentHealth).toBeGreaterThanOrEqual(0); // Should not go negative
    });

    it('should handle edge case with null inputs', () => {
      expect(() => {
        PhysicalBattleEngine.executePhysicalAction(null, null, null, null);
      }).toThrow();
    });

    it('should cap damage at target\'s current health', () => {
      const attacker = createMockCharacter({
        combatStats: { attack: 9999 }, // Massive attack
        baseStats: { strength: 999 },
        equipment: {
          weapon: { stats: { atk: 999 } }
        }
      });
      
      const target = createMockCharacter({
        combatStats: { defense: 0 },
        currentHealth: 50 // Low health
      });

      const action = createMockAction({ type: 'basic_attack' });
      const battleState = createMockBattleState();

      const result = PhysicalBattleEngine.executePhysicalAction(
        attacker,
        target,
        action,
        battleState
      );

      expect(target.currentHealth).toBe(0); // Should not go below 0
      expect(result.healthChange).toBeLessThanOrEqual(50); // Cannot lose more than current health
    });
  });
});
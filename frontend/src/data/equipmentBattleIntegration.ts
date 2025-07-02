// Equipment Battle Integration
// Makes equipment effects work in the battle system

import { EquippedCharacter, EquipmentEffect } from './characterEquipment';

export interface BattleContext {
  turn: number;
  phase: 'start' | 'action' | 'end';
  attacker?: EquippedCharacter;
  defender?: EquippedCharacter;
  damage?: number;
  isCritical?: boolean;
  isHit?: boolean;
}

export interface EquipmentBattleEffect {
  characterId: string;
  effectId: string;
  name: string;
  description: string;
  value: number;
  applied: boolean;
  remaining?: number;
}

export class EquipmentBattleManager {
  private activeEffects: Map<string, EquipmentBattleEffect[]> = new Map();
  
  // Process equipment effects at battle start
  processBattleStartEffects(characters: EquippedCharacter[]): EquipmentBattleEffect[] {
    const battleEffects: EquipmentBattleEffect[] = [];
    
    characters.forEach(character => {
      character.activeEffects.forEach(effect => {
        if (this.shouldTriggerEffect(effect, { phase: 'start', turn: 1 })) {
          const battleEffect = this.createBattleEffect(character.id, effect);
          battleEffects.push(battleEffect);
          this.addActiveEffect(character.id, battleEffect);
        }
      });
    });
    
    return battleEffects;
  }
  
  // Process equipment effects on hit
  processOnHitEffects(
    attacker: EquippedCharacter, 
    defender: EquippedCharacter, 
    context: BattleContext
  ): EquipmentBattleEffect[] {
    const battleEffects: EquipmentBattleEffect[] = [];
    
    // Process attacker's on-hit effects
    attacker.activeEffects.forEach(effect => {
      if (this.shouldTriggerEffect(effect, { ...context, phase: 'action' })) {
        const battleEffect = this.createBattleEffect(attacker.id, effect);
        battleEffects.push(battleEffect);
        this.addActiveEffect(attacker.id, battleEffect);
      }
    });
    
    return battleEffects;
  }
  
  // Process equipment effects on critical hit
  processOnCritEffects(
    attacker: EquippedCharacter, 
    defender: EquippedCharacter, 
    context: BattleContext
  ): EquipmentBattleEffect[] {
    const battleEffects: EquipmentBattleEffect[] = [];
    
    if (!context.isCritical) return battleEffects;
    
    attacker.activeEffects.forEach(effect => {
      if (this.shouldTriggerEffect(effect, { ...context, phase: 'action' })) {
        const battleEffect = this.createBattleEffect(attacker.id, effect);
        battleEffects.push(battleEffect);
        this.addActiveEffect(attacker.id, battleEffect);
      }
    });
    
    return battleEffects;
  }
  
  // Calculate damage modifiers from equipment
  calculateDamageModifiers(
    attacker: EquippedCharacter, 
    defender: EquippedCharacter, 
    baseDamage: number,
    context: BattleContext
  ): {
    finalDamage: number;
    modifiers: string[];
  } {
    let finalDamage = baseDamage;
    const modifiers: string[] = [];
    
    // Apply attacker's weapon effects
    if (attacker.equippedItems.weapon) {
      attacker.equippedItems.weapon.effects.forEach(effect => {
        switch (effect.id) {
          case 'trojan_might':
            if (defender.archetype === 'warrior' || defender.archetype === 'tank') {
              finalDamage *= 1.2;
              modifiers.push(`+20% vs defenders (${effect.name})`);
            }
            break;
          case 'divine_charge':
            if (context.turn === 1) {
              finalDamage *= 1.5;
              modifiers.push(`+50% first attack (${effect.name})`);
            }
            break;
          case 'flame_strike':
            if (Math.random() < 0.2) {
              finalDamage += 10;
              modifiers.push(`+10 burn damage (${effect.name})`);
            }
            break;
          case 'surprise_strike':
            if (context.turn === 1) {
              finalDamage *= 2;
              modifiers.push(`Guaranteed critical (${effect.name})`);
            }
            break;
          case 'dual_wield':
            // Handle in separate attack
            modifiers.push(`Can attack twice (${effect.name})`);
            break;
        }
      });
    }
    
    // Apply defender's armor effects
    if (defender.equippedItems.armor) {
      defender.equippedItems.armor.effects.forEach(effect => {
        switch (effect.id) {
          case 'armor_mastery':
            finalDamage = Math.max(1, finalDamage - 3);
            modifiers.push(`-3 damage reduction (${effect.name})`);
            break;
          case 'divine_protection':
            if (Math.random() < 0.15) {
              finalDamage = 0;
              modifiers.push(`Damage negated (${effect.name})`);
            }
            break;
        }
      });
    }
    
    return { finalDamage: Math.round(finalDamage), modifiers };
  }
  
  // Calculate accuracy modifiers
  calculateAccuracyModifiers(
    attacker: EquippedCharacter, 
    defender: EquippedCharacter
  ): {
    finalAccuracy: number;
    modifiers: string[];
  } {
    let accuracy = attacker.finalStats.accuracy;
    const modifiers: string[] = [];
    
    // Apply weapon accuracy bonuses
    if (attacker.equippedItems.weapon) {
      const weaponAccuracy = attacker.equippedItems.weapon.stats.accuracy || 0;
      accuracy += weaponAccuracy;
      if (weaponAccuracy > 0) {
        modifiers.push(`+${weaponAccuracy} weapon accuracy`);
      }
    }
    
    // Apply special effects
    attacker.activeEffects.forEach(effect => {
      switch (effect.id) {
        case 'deductive_aim':
          // Increases over time - would need battle history
          break;
        case 'targeting_system':
          // Increases on misses - would need battle history  
          break;
      }
    });
    
    return { finalAccuracy: accuracy, modifiers };
  }
  
  // Calculate critical hit chance
  calculateCriticalChance(attacker: EquippedCharacter): {
    finalCritChance: number;
    modifiers: string[];
  } {
    let critChance = attacker.finalStats.criticalChance;
    const modifiers: string[] = [];
    
    // Apply weapon crit bonuses
    if (attacker.equippedItems.weapon) {
      const weaponCrit = attacker.equippedItems.weapon.stats.critRate || 0;
      critChance += weaponCrit;
      if (weaponCrit > 0) {
        modifiers.push(`+${weaponCrit}% weapon critical`);
      }
    }
    
    return { finalCritChance: critChance, modifiers };
  }
  
  // Update active effects each turn
  updateEffects(characterId: string): void {
    const effects = this.activeEffects.get(characterId) || [];
    
    effects.forEach(effect => {
      if (effect.remaining !== undefined) {
        effect.remaining -= 1;
        if (effect.remaining <= 0) {
          this.removeActiveEffect(characterId, effect.effectId);
        }
      }
    });
  }
  
  // Helper methods
  private shouldTriggerEffect(effect: EquipmentEffect, context: BattleContext): boolean {
    // Check if this equipment effect should trigger based on context
    const weaponEffect = effect.source; // equipment id
    
    // Map equipment effects to battle triggers
    const triggerMap: Record<string, (ctx: BattleContext) => boolean> = {
      'battle_start': (ctx) => ctx.phase === 'start' && ctx.turn === 1,
      'on_hit': (ctx) => ctx.phase === 'action' && ctx.isHit === true,
      'on_crit': (ctx) => ctx.phase === 'action' && ctx.isCritical === true,
      'turn_start': (ctx) => ctx.phase === 'start',
      'low_hp': (ctx) => false // Would need health percentage
    };
    
    return triggerMap[effect.type] ? triggerMap[effect.type](context) : false;
  }
  
  private createBattleEffect(characterId: string, effect: EquipmentEffect): EquipmentBattleEffect {
    return {
      characterId,
      effectId: effect.id,
      name: effect.name,
      description: effect.description,
      value: effect.value,
      applied: false,
      remaining: effect.duration
    };
  }
  
  private addActiveEffect(characterId: string, effect: EquipmentBattleEffect): void {
    const effects = this.activeEffects.get(characterId) || [];
    effects.push(effect);
    this.activeEffects.set(characterId, effects);
  }
  
  private removeActiveEffect(characterId: string, effectId: string): void {
    const effects = this.activeEffects.get(characterId) || [];
    const filtered = effects.filter(e => e.effectId !== effectId);
    this.activeEffects.set(characterId, filtered);
  }
  
  public getActiveEffects(characterId: string): EquipmentBattleEffect[] {
    return this.activeEffects.get(characterId) || [];
  }
  
  public clearAllEffects(): void {
    this.activeEffects.clear();
  }
}

// Helper functions for battle integration
export function applyEquipmentEffectsToDamage(
  attacker: EquippedCharacter,
  defender: EquippedCharacter,
  baseDamage: number,
  battleManager: EquipmentBattleManager,
  context: BattleContext
): number {
  const result = battleManager.calculateDamageModifiers(attacker, defender, baseDamage, context);
  return result.finalDamage;
}

export function checkForEquipmentTriggeredEffects(
  character: EquippedCharacter,
  battleManager: EquipmentBattleManager,
  context: BattleContext
): EquipmentBattleEffect[] {
  const effects: EquipmentBattleEffect[] = [];
  
  if (context.isHit) {
    effects.push(...battleManager.processOnHitEffects(character, context.defender!, context));
  }
  
  if (context.isCritical) {
    effects.push(...battleManager.processOnCritEffects(character, context.defender!, context));
  }
  
  return effects;
}

export function createBattleEquipmentSummary(character: EquippedCharacter): {
  weapon: string;
  effects: string[];
  statBonuses: string[];
} {
  const weapon = character.equippedItems.weapon?.name || 'None';
  const effects = character.activeEffects.map(e => e.name);
  const statBonuses: string[] = [];
  
  if (character.equipmentBonuses.atk) {
    statBonuses.push(`+${character.equipmentBonuses.atk} Attack`);
  }
  if (character.equipmentBonuses.def) {
    statBonuses.push(`+${character.equipmentBonuses.def} Defense`);
  }
  if (character.equipmentBonuses.spd) {
    statBonuses.push(`+${character.equipmentBonuses.spd} Speed`);
  }
  if (character.equipmentBonuses.critRate) {
    statBonuses.push(`+${character.equipmentBonuses.critRate}% Crit`);
  }
  
  return { weapon, effects, statBonuses };
}
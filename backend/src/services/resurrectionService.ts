import { query } from '../database/postgres';
import { v4 as uuidv4 } from 'uuid';

export interface ResurrectionOption {
  type: 'premium_instant' | 'wait_penalty' | 'level_reset';
  name: string;
  cost: { currency?: number; premium?: number };
  waitTime?: number; // hours
  xpPenalty?: number; // percentage
  levelReset?: boolean;
  description: string;
}

export interface DeathPenalty {
  characterId: string;
  deathCount: number;
  xpPenalty: number;
  levelPenalty: number;
  waitTimeHours: number;
}

export class ResurrectionService {

  /**
   * Calculate death penalties based on character level and death count
   */
  static calculateDeathPenalties(characterLevel: number, deathCount: number): DeathPenalty {
    // Base wait time: 24 hours for first death, increases with each death
    const baseWaitHours = 24;
    const waitTimeMultiplier = Math.pow(1.5, deathCount - 1); // 1.5x for each additional death
    const waitTimeHours = Math.floor(baseWaitHours * waitTimeMultiplier);
    
    // XP penalty: 10% for first death, +5% for each additional death (capped at 50%)
    const baseXPPenalty = 10;
    const xpPenalty = Math.min(50, baseXPPenalty + (deathCount - 1) * 5);
    
    // Level penalty: lose 1 level for every 3 deaths
    const levelPenalty = Math.floor(deathCount / 3);
    
    return {
      characterId: '',
      deathCount,
      xpPenalty,
      levelPenalty,
      waitTimeHours
    };
  }

  /**
   * Calculate resurrection costs based on character level and rarity
   */
  static calculateResurrectionCosts(characterLevel: number, characterRarity: string): { currency: number; premium: number } {
    const rarityMultipliers = {
      'common': 1,
      'uncommon': 1.5,
      'rare': 2,
      'epic': 3,
      'legendary': 5,
      'mythic': 8
    };
    
    const multiplier = rarityMultipliers[characterRarity as keyof typeof rarityMultipliers] || 1;
    
    return {
      currency: Math.floor(1000 * characterLevel * multiplier),
      premium: Math.floor(10 * characterLevel * multiplier)
    };
  }

  /**
   * Handle character death in battle
   */
  static async handleCharacterDeath(characterId: string, battleContext?: any): Promise<void> {
    try {
      // Get character details
      const characterResult = await query(
        `SELECT uc.*, c.rarity FROM user_characters uc
         JOIN characters c ON uc.character_id = c.id
         WHERE uc.id = $1`,
        [characterId]
      );
      
      if (characterResult.rows.length === 0) {
        throw new Error('Character not found');
      }
      
      const character = characterResult.rows[0];
      const newDeathCount = (character.death_count || 0) + 1;
      const penalties = this.calculateDeathPenalties(character.level, newDeathCount);
      
      // Calculate when natural resurrection becomes available
      const resurrectionAvailableAt = new Date(Date.now() + penalties.waitTimeHours * 60 * 60 * 1000);
      
      // Mark character as dead and store pre-death stats
      await query(
        `UPDATE user_characters 
         SET is_dead = true,
             is_injured = false,
             injury_severity = 'dead',
             current_health = 0,
             death_timestamp = CURRENT_TIMESTAMP,
             resurrection_available_at = $1,
             death_count = $2,
             pre_death_level = $3,
             pre_death_experience = $4
         WHERE id = $5`,
        [
          resurrectionAvailableAt,
          newDeathCount,
          character.level,
          character.experience,
          characterId
        ]
      );
      
      console.log(`💀 Character ${character.name || characterId} has died (death #${newDeathCount})`);
      console.log(`⏰ Natural resurrection available at: ${resurrectionAvailableAt}`);
      console.log(`📊 Penalties: ${penalties.xpPenalty}% XP, ${penalties.levelPenalty} levels`);
      
    } catch (error) {
      console.error('Error handling character death:', error);
      throw error;
    }
  }

  /**
   * Get resurrection options for a dead character
   */
  static async getResurrectionOptions(characterId: string): Promise<ResurrectionOption[]> {
    try {
      // Get character details
      const characterResult = await query(
        `SELECT uc.*, c.rarity FROM user_characters uc
         JOIN characters c ON uc.character_id = c.id
         WHERE uc.id = $1 AND uc.is_dead = true`,
        [characterId]
      );
      
      if (characterResult.rows.length === 0) {
        return []; // Character not found or not dead
      }
      
      const character = characterResult.rows[0];
      const costs = this.calculateResurrectionCosts(character.level, character.rarity);
      const penalties = this.calculateDeathPenalties(character.level, character.death_count);
      
      const options: ResurrectionOption[] = [];
      
      // Premium instant resurrection (no penalties)
      options.push({
        type: 'premium_instant',
        name: 'Premium Resurrection',
        cost: { premium: costs.premium },
        description: `Instantly resurrect with no penalties using ${costs.premium} premium currency`
      });
      
      // Wait with XP penalty
      options.push({
        type: 'wait_penalty',
        name: 'Natural Resurrection',
        cost: {},
        waitTime: penalties.waitTimeHours,
        xpPenalty: penalties.xpPenalty,
        description: `Wait ${penalties.waitTimeHours} hours and lose ${penalties.xpPenalty}% experience`
      });
      
      // Restart at level 1 (immediate, but harsh)
      options.push({
        type: 'level_reset',
        name: 'Reincarnation',
        cost: {},
        levelReset: true,
        description: `Immediately return to life, but restart at level 1 with base stats`
      });
      
      return options;
    } catch (error) {
      console.error('Error getting resurrection options:', error);
      throw error;
    }
  }

  /**
   * Execute resurrection based on chosen option
   */
  static async executeResurrection(
    characterId: string, 
    resurrectionType: 'premium_instant' | 'wait_penalty' | 'level_reset'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get character details
      const characterResult = await query(
        `SELECT uc.*, c.rarity FROM user_characters uc
         JOIN characters c ON uc.character_id = c.id
         WHERE uc.id = $1 AND uc.is_dead = true`,
        [characterId]
      );
      
      if (characterResult.rows.length === 0) {
        return { success: false, message: 'Character not found or not dead' };
      }
      
      const character = characterResult.rows[0];
      
      switch (resurrectionType) {
        case 'premium_instant':
          return await this.executePremiumResurrection(character);
          
        case 'wait_penalty':
          return await this.executeNaturalResurrection(character);
          
        case 'level_reset':
          return await this.executeReincarnation(character);
          
        default:
          return { success: false, message: 'Invalid resurrection type' };
      }
    } catch (error) {
      console.error('Error executing resurrection:', error);
      return { success: false, message: 'Resurrection failed due to an error' };
    }
  }

  /**
   * Execute premium instant resurrection
   */
  private static async executePremiumResurrection(character: any): Promise<{ success: boolean; message: string }> {
    try {
      const costs = this.calculateResurrectionCosts(character.level, character.rarity);
      
      // Check if user has enough premium currency
      const currencyResult = await query(
        `SELECT premium_currency FROM user_currency WHERE user_id = $1`,
        [character.user_id]
      );
      
      if (currencyResult.rows.length === 0 || currencyResult.rows[0].premium_currency < costs.premium) {
        return { success: false, message: `Insufficient premium currency. Need ${costs.premium}` };
      }
      
      // Deduct premium currency
      await query(
        `UPDATE user_currency SET premium_currency = premium_currency - $1 WHERE user_id = $2`,
        [costs.premium, character.user_id]
      );
      
      // Resurrect character with no penalties
      await query(
        `UPDATE user_characters 
         SET is_dead = false,
             is_injured = false,
             injury_severity = 'healthy',
             current_health = max_health,
             death_timestamp = NULL,
             resurrection_available_at = NULL
         WHERE id = $1`,
        [character.id]
      );
      
      return { success: true, message: `Character resurrected instantly for ${costs.premium} premium currency` };
      
    } catch (error) {
      console.error('Error in premium resurrection:', error);
      return { success: false, message: 'Premium resurrection failed' };
    }
  }

  /**
   * Execute natural resurrection with penalties
   */
  private static async executeNaturalResurrection(character: any): Promise<{ success: boolean; message: string }> {
    try {
      // Check if resurrection time has passed
      const resurrectionTime = new Date(character.resurrection_available_at);
      const now = new Date();
      
      if (now < resurrectionTime) {
        const hoursLeft = Math.ceil((resurrectionTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        return { success: false, message: `Must wait ${hoursLeft} more hours for natural resurrection` };
      }
      
      const penalties = this.calculateDeathPenalties(character.level, character.death_count);
      
      // Calculate new experience after penalty
      const currentXP = character.experience || 0;
      const xpLoss = Math.floor(currentXP * (penalties.xpPenalty / 100));
      const newXP = Math.max(0, currentXP - xpLoss);
      
      // Calculate new level after penalty (if any)
      const newLevel = Math.max(1, character.level - penalties.levelPenalty);
      
      // Resurrect character with penalties
      await query(
        `UPDATE user_characters 
         SET is_dead = false,
             is_injured = false,
             injury_severity = 'healthy',
             current_health = max_health,
             level = $1,
             experience = $2,
             death_timestamp = NULL,
             resurrection_available_at = NULL
         WHERE id = $3`,
        [newLevel, newXP, character.id]
      );
      
      return { 
        success: true, 
        message: `Character resurrected naturally. Lost ${penalties.xpPenalty}% experience${penalties.levelPenalty > 0 ? ` and ${penalties.levelPenalty} levels` : ''}` 
      };
      
    } catch (error) {
      console.error('Error in natural resurrection:', error);
      return { success: false, message: 'Natural resurrection failed' };
    }
  }

  /**
   * Execute reincarnation (level 1 reset)
   */
  private static async executeReincarnation(character: any): Promise<{ success: boolean; message: string }> {
    try {
      // Reset character to level 1
      await query(
        `UPDATE user_characters 
         SET is_dead = false,
             is_injured = false,
             injury_severity = 'healthy',
             current_health = max_health,
             level = 1,
             experience = 0,
             death_timestamp = NULL,
             resurrection_available_at = NULL
         WHERE id = $1`,
        [character.id]
      );
      
      return { 
        success: true, 
        message: 'Character reincarnated at level 1. All progress has been reset, but they live again!' 
      };
      
    } catch (error) {
      console.error('Error in reincarnation:', error);
      return { success: false, message: 'Reincarnation failed' };
    }
  }

  /**
   * Check for characters eligible for natural resurrection
   */
  static async processNaturalResurrections(): Promise<void> {
    try {
      const eligibleCharacters = await query(
        `SELECT id FROM user_characters 
         WHERE is_dead = true 
         AND resurrection_available_at <= CURRENT_TIMESTAMP`
      );
      
      console.log(`🔄 Found ${eligibleCharacters.rows.length} characters eligible for natural resurrection`);
      
      // Note: We don't automatically resurrect - we just make them eligible
      // Players must still choose their resurrection option
      
    } catch (error) {
      console.error('Error processing natural resurrections:', error);
    }
  }

  /**
   * Get death statistics for a character
   */
  static async getCharacterDeathStats(characterId: string): Promise<any> {
    try {
      const result = await query(
        `SELECT death_count, death_timestamp, resurrection_available_at, 
                pre_death_level, pre_death_experience, is_dead
         FROM user_characters WHERE id = $1`,
        [characterId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const stats = result.rows[0];
      
      if (stats.is_dead) {
        const penalties = this.calculateDeathPenalties(stats.pre_death_level || 1, stats.death_count || 1);
        stats.calculatedPenalties = penalties;
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting character death stats:', error);
      return null;
    }
  }
}
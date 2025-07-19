import { query } from '../database/postgres';
import { v4 as uuidv4 } from 'uuid';

export interface CharacterProgression {
  characterId: string;
  userId: string;
  level: number;
  experience: number;
  totalExperience: number;
  statPoints: number;
  skillPoints: number;
  abilityPoints: number;
  tier: string;
  title: string;
  lastUpdated: Date;
}

export interface SkillProgression {
  id: string;
  characterId: string;
  skillId: string;
  skillName: string;
  level: number;
  experience: number;
  maxLevel: number;
  unlocked: boolean;
  lastUpdated: Date;
}

export interface AbilityProgression {
  id: string;
  characterId: string;
  abilityId: string;
  abilityName: string;
  rank: number;
  maxRank: number;
  unlocked: boolean;
  unlockedAt: Date;
}

export interface ExperienceGain {
  id: string;
  characterId: string;
  source: 'battle' | 'training' | 'quest' | 'achievement' | 'daily' | 'event';
  amount: number;
  multiplier: number;
  description: string;
  timestamp: Date;
}

export class CharacterProgressionService {
  // XP curve configuration
  private static readonly XP_CURVE_BASE = 100;
  private static readonly XP_CURVE_MULTIPLIER = 1.5;
  private static readonly XP_CURVE_EXPONENT = 1.2;

  // Progression tiers
  private static readonly TIERS = {
    novice: { min: 1, max: 10, title: 'Novice' },
    apprentice: { min: 11, max: 20, title: 'Apprentice' },
    adept: { min: 21, max: 30, title: 'Adept' },
    expert: { min: 31, max: 40, title: 'Expert' },
    master: { min: 41, max: 50, title: 'Master' },
    legend: { min: 51, max: 100, title: 'Legend' }
  };

  /**
   * Calculate XP required for a specific level
   */
  static calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(
      this.XP_CURVE_BASE * 
      Math.pow(this.XP_CURVE_MULTIPLIER, level - 1) * 
      Math.pow(level - 1, this.XP_CURVE_EXPONENT)
    );
  }

  /**
   * Calculate total XP required to reach a level
   */
  static calculateTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += this.calculateXPForLevel(i);
    }
    return total;
  }

  /**
   * Get character's current progression data
   */
  static async getCharacterProgression(characterId: string): Promise<CharacterProgression | null> {
    try {
      const result = await query(
        `SELECT uc.*, cp.stat_points, cp.skill_points, cp.ability_points, cp.tier, cp.title, cp.last_updated
         FROM user_characters uc
         LEFT JOIN character_progression cp ON uc.id = cp.character_id
         WHERE uc.id = $1`,
        [characterId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        characterId: row.id,
        userId: row.user_id,
        level: row.level || 1,
        experience: row.experience || 0,
        totalExperience: this.calculateTotalXPForLevel(row.level || 1) + (row.experience || 0),
        statPoints: row.stat_points || 0,
        skillPoints: row.skill_points || 0,
        abilityPoints: row.ability_points || 0,
        tier: row.tier || 'novice',
        title: row.title || 'Novice',
        lastUpdated: row.last_updated || new Date()
      };
    } catch (error) {
      console.error('Error getting character progression:', error);
      throw error;
    }
  }

  /**
   * Award experience to a character
   */
  static async awardExperience(
    characterId: string,
    amount: number,
    source: ExperienceGain['source'],
    description: string,
    multiplier: number = 1.0
  ): Promise<{ leveledUp: boolean; oldLevel: number; newLevel: number; progression: CharacterProgression }> {
    try {
      const finalAmount = Math.floor(amount * multiplier);
      
      // Get current progression
      const currentProgression = await this.getCharacterProgression(characterId);
      if (!currentProgression) {
        throw new Error('Character not found');
      }

      const oldLevel = currentProgression.level;
      const newExperience = currentProgression.experience + finalAmount;
      
      // Calculate new level
      let newLevel = oldLevel;
      let remainingXP = newExperience;
      
      while (remainingXP >= this.calculateXPForLevel(newLevel + 1) && newLevel < 100) {
        remainingXP -= this.calculateXPForLevel(newLevel + 1);
        newLevel++;
      }

      const leveledUp = newLevel > oldLevel;
      
      // Calculate rewards for level ups
      let statPointsGained = 0;
      let skillPointsGained = 0;
      let abilityPointsGained = 0;
      
      if (leveledUp) {
        const levelsGained = newLevel - oldLevel;
        statPointsGained = levelsGained * 5; // 5 stat points per level
        skillPointsGained = levelsGained * 3; // 3 skill points per level
        abilityPointsGained = Math.floor(levelsGained / 5); // 1 ability point every 5 levels
      }

      // Determine tier and title
      const tier = this.getTierForLevel(newLevel);
      const title = this.getTitleForLevel(newLevel);

      // Update character progression
      await query(
        `UPDATE user_characters 
         SET level = $1, experience = $2 
         WHERE id = $3`,
        [newLevel, remainingXP, characterId]
      );

      // Insert or update character_progression record
      await query(
        `INSERT INTO character_progression (character_id, stat_points, skill_points, ability_points, tier, title, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (character_id) 
         DO UPDATE SET 
           stat_points = character_progression.stat_points + $2,
           skill_points = character_progression.skill_points + $3,
           ability_points = character_progression.ability_points + $4,
           tier = $5,
           title = $6,
           last_updated = CURRENT_TIMESTAMP`,
        [characterId, statPointsGained, skillPointsGained, abilityPointsGained, tier, title]
      );

      // Log the experience gain
      await query(
        `INSERT INTO character_experience_log (id, character_id, source, amount, multiplier, description, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [uuidv4(), characterId, source, finalAmount, multiplier, description]
      );

      // Get updated progression
      const updatedProgression = await this.getCharacterProgression(characterId);
      if (!updatedProgression) {
        throw new Error('Failed to get updated progression');
      }

      return {
        leveledUp,
        oldLevel,
        newLevel,
        progression: updatedProgression
      };
    } catch (error) {
      console.error('Error awarding experience:', error);
      throw error;
    }
  }

  /**
   * Get tier for a specific level
   */
  private static getTierForLevel(level: number): string {
    for (const [tierName, tierInfo] of Object.entries(this.TIERS)) {
      if (level >= tierInfo.min && level <= tierInfo.max) {
        return tierName;
      }
    }
    return 'legend'; // Default for high levels
  }

  /**
   * Get title for a specific level
   */
  private static getTitleForLevel(level: number): string {
    for (const [tierName, tierInfo] of Object.entries(this.TIERS)) {
      if (level >= tierInfo.min && level <= tierInfo.max) {
        return tierInfo.title;
      }
    }
    return 'Legendary Master'; // Default for high levels
  }

  /**
   * Get character's skill progressions
   */
  static async getCharacterSkills(characterId: string): Promise<SkillProgression[]> {
    try {
      const result = await query(
        `SELECT * FROM character_skills WHERE character_id = $1 ORDER BY skill_name`,
        [characterId]
      );

      return result.rows.map(row => ({
        id: row.id,
        characterId: row.character_id,
        skillId: row.skill_id,
        skillName: row.skill_name,
        level: row.level,
        experience: row.experience,
        maxLevel: row.max_level,
        unlocked: row.unlocked,
        lastUpdated: row.last_updated
      }));
    } catch (error) {
      console.error('Error getting character skills:', error);
      throw error;
    }
  }

  /**
   * Unlock a skill for a character
   */
  static async unlockSkill(characterId: string, skillId: string, skillName: string, maxLevel: number = 10): Promise<SkillProgression> {
    try {
      const id = uuidv4();
      await query(
        `INSERT INTO character_skills (id, character_id, skill_id, skill_name, level, experience, max_level, unlocked, last_updated)
         VALUES ($1, $2, $3, $4, 1, 0, $5, true, CURRENT_TIMESTAMP)
         ON CONFLICT (character_id, skill_id) 
         DO UPDATE SET unlocked = true, last_updated = CURRENT_TIMESTAMP`,
        [id, characterId, skillId, skillName, maxLevel]
      );

      const result = await query(
        `SELECT * FROM character_skills WHERE character_id = $1 AND skill_id = $2`,
        [characterId, skillId]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        characterId: row.character_id,
        skillId: row.skill_id,
        skillName: row.skill_name,
        level: row.level,
        experience: row.experience,
        maxLevel: row.max_level,
        unlocked: row.unlocked,
        lastUpdated: row.last_updated
      };
    } catch (error) {
      console.error('Error unlocking skill:', error);
      throw error;
    }
  }

  /**
   * Progress a skill by gaining experience
   */
  static async progressSkill(characterId: string, skillId: string, experienceGained: number): Promise<{ leveledUp: boolean; newLevel: number }> {
    try {
      // Get current skill progression
      const result = await query(
        `SELECT * FROM character_skills WHERE character_id = $1 AND skill_id = $2`,
        [characterId, skillId]
      );

      if (result.rows.length === 0) {
        throw new Error('Skill not found or not unlocked');
      }

      const skill = result.rows[0];
      const newExperience = skill.experience + experienceGained;
      
      // Calculate skill level (simple: 100 XP per level)
      const newLevel = Math.min(Math.floor(newExperience / 100) + 1, skill.max_level);
      const leveledUp = newLevel > skill.level;

      // Update skill progression
      await query(
        `UPDATE character_skills 
         SET level = $1, experience = $2, last_updated = CURRENT_TIMESTAMP
         WHERE character_id = $3 AND skill_id = $4`,
        [newLevel, newExperience, characterId, skillId]
      );

      return { leveledUp, newLevel };
    } catch (error) {
      console.error('Error progressing skill:', error);
      throw error;
    }
  }

  /**
   * Get character's unlocked abilities
   */
  static async getCharacterAbilities(characterId: string): Promise<AbilityProgression[]> {
    try {
      const result = await query(
        `SELECT * FROM character_abilities WHERE character_id = $1 ORDER BY unlocked_at DESC`,
        [characterId]
      );

      return result.rows.map(row => ({
        id: row.id,
        characterId: row.character_id,
        abilityId: row.ability_id,
        abilityName: row.ability_name,
        rank: row.rank,
        maxRank: row.max_rank,
        unlocked: row.unlocked,
        unlockedAt: row.unlocked_at
      }));
    } catch (error) {
      console.error('Error getting character abilities:', error);
      throw error;
    }
  }

  /**
   * Unlock an ability for a character
   */
  static async unlockAbility(characterId: string, abilityId: string, abilityName: string, maxRank: number = 5): Promise<AbilityProgression> {
    try {
      const id = uuidv4();
      await query(
        `INSERT INTO character_abilities (id, character_id, ability_id, ability_name, rank, max_rank, unlocked, unlocked_at)
         VALUES ($1, $2, $3, $4, 1, $5, true, CURRENT_TIMESTAMP)
         ON CONFLICT (character_id, ability_id) 
         DO UPDATE SET unlocked = true`,
        [id, characterId, abilityId, abilityName, maxRank]
      );

      const result = await query(
        `SELECT * FROM character_abilities WHERE character_id = $1 AND ability_id = $2`,
        [characterId, abilityId]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        characterId: row.character_id,
        abilityId: row.ability_id,
        abilityName: row.ability_name,
        rank: row.rank,
        maxRank: row.max_rank,
        unlocked: row.unlocked,
        unlockedAt: row.unlocked_at
      };
    } catch (error) {
      console.error('Error unlocking ability:', error);
      throw error;
    }
  }

  /**
   * Get experience gain history for a character
   */
  static async getExperienceHistory(characterId: string, limit: number = 50): Promise<ExperienceGain[]> {
    try {
      const result = await query(
        `SELECT * FROM character_experience_log 
         WHERE character_id = $1 
         ORDER BY timestamp DESC 
         LIMIT $2`,
        [characterId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        characterId: row.character_id,
        source: row.source,
        amount: row.amount,
        multiplier: row.multiplier,
        description: row.description,
        timestamp: row.timestamp
      }));
    } catch (error) {
      console.error('Error getting experience history:', error);
      throw error;
    }
  }
}
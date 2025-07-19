import { query } from '../database/postgres';
import { v4 as uuidv4 } from 'uuid';

export interface HealingFacility {
  id: string;
  name: string;
  facilityType: 'basic_medical' | 'advanced_medical' | 'premium_medical' | 'resurrection_chamber';
  healingRateMultiplier: number;
  currencyCostPerHour: number;
  premiumCostPerHour: number;
  maxInjurySeverity: 'light' | 'moderate' | 'severe' | 'critical' | 'dead';
  headquartersTierRequired?: string;
  description: string;
}

export interface HealingSession {
  id: string;
  characterId: string;
  facilityId: string;
  sessionType: 'injury_healing' | 'resurrection';
  startTime: Date;
  estimatedCompletionTime: Date;
  currencyPaid: number;
  premiumPaid: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface HealingOption {
  type: 'natural' | 'currency' | 'premium' | 'facility';
  name: string;
  cost: { currency?: number; premium?: number };
  timeReduction: number; // hours reduced
  description: string;
  facilityId?: string;
}

export class HealingService {
  
  /**
   * Calculate natural recovery time based on injury severity
   */
  static calculateNaturalRecoveryTime(severity: string): number {
    const recoveryHours = {
      'light': 2,      // 2 hours
      'moderate': 8,   // 8 hours 
      'severe': 24,    // 1 day
      'critical': 72,  // 3 days
      'dead': 168      // 7 days for natural resurrection
    };
    
    return recoveryHours[severity as keyof typeof recoveryHours] || 2;
  }

  /**
   * Calculate healing costs based on character level and injury severity
   */
  static calculateHealingCost(characterLevel: number, severity: string): { currency: number; premium: number } {
    const baseCosts = {
      'light': { currency: 50, premium: 1 },
      'moderate': { currency: 200, premium: 3 },
      'severe': { currency: 500, premium: 8 },
      'critical': { currency: 1000, premium: 15 },
      'dead': { currency: 2000, premium: 25 }
    };
    
    const base = baseCosts[severity as keyof typeof baseCosts] || baseCosts.light;
    const levelMultiplier = Math.max(1, characterLevel / 10);
    
    return {
      currency: Math.floor(base.currency * levelMultiplier),
      premium: Math.floor(base.premium * levelMultiplier)
    };
  }

  /**
   * Get available healing options for a character
   */
  static async getHealingOptions(characterId: string): Promise<HealingOption[]> {
    try {
      // Get character info
      const characterResult = await query(
        `SELECT level, injury_severity, is_dead FROM user_characters WHERE id = $1`,
        [characterId]
      );
      
      if (characterResult.rows.length === 0) {
        throw new Error('Character not found');
      }
      
      const character = characterResult.rows[0];
      const severity = character.injury_severity || 'healthy';
      const level = character.level || 1;
      
      if (severity === 'healthy' && !character.is_dead) {
        return []; // No healing needed
      }
      
      const naturalTime = this.calculateNaturalRecoveryTime(severity);
      const costs = this.calculateHealingCost(level, severity);
      const options: HealingOption[] = [];
      
      // Natural recovery (always available)
      options.push({
        type: 'natural',
        name: 'Natural Recovery',
        cost: {},
        timeReduction: 0,
        description: `Wait ${naturalTime} hours for natural recovery`
      });
      
      // Currency-based healing (reduces time by 50%)
      options.push({
        type: 'currency',
        name: 'Medical Treatment',
        cost: { currency: costs.currency },
        timeReduction: naturalTime * 0.5,
        description: `Reduce recovery time by 50% using battle tokens`
      });
      
      // Premium healing (instant recovery)
      options.push({
        type: 'premium',
        name: 'Premium Medical Care',
        cost: { premium: costs.premium },
        timeReduction: naturalTime,
        description: 'Instant recovery using premium currency'
      });
      
      // Get available facilities
      const facilitiesResult = await query(
        `SELECT * FROM healing_facilities 
         WHERE max_injury_severity = $1 OR max_injury_severity = 'dead'
         ORDER BY healing_rate_multiplier DESC`,
        [severity]
      );
      
      // Add facility options
      for (const facility of facilitiesResult.rows) {
        const facilityTimeReduction = naturalTime * (1 - (1 / facility.healing_rate_multiplier));
        options.push({
          type: 'facility',
          name: facility.name,
          cost: { 
            currency: facility.currency_cost_per_hour * (naturalTime - facilityTimeReduction),
            premium: facility.premium_cost_per_hour * (naturalTime - facilityTimeReduction)
          },
          timeReduction: facilityTimeReduction,
          description: facility.description,
          facilityId: facility.id
        });
      }
      
      return options;
    } catch (error) {
      console.error('Error getting healing options:', error);
      throw error;
    }
  }

  /**
   * Start a healing session for a character
   */
  static async startHealingSession(
    characterId: string,
    healingType: 'natural' | 'currency' | 'premium' | 'facility',
    facilityId?: string,
    paymentMethod?: 'currency' | 'premium'
  ): Promise<HealingSession> {
    try {
      // Get character current state
      const characterResult = await query(
        `SELECT level, injury_severity, is_dead, current_health, max_health FROM user_characters WHERE id = $1`,
        [characterId]
      );
      
      if (characterResult.rows.length === 0) {
        throw new Error('Character not found');
      }
      
      const character = characterResult.rows[0];
      const severity = character.injury_severity || 'healthy';
      const level = character.level || 1;
      
      const naturalTime = this.calculateNaturalRecoveryTime(severity);
      const costs = this.calculateHealingCost(level, severity);
      
      let timeReduction = 0;
      let currencyPaid = 0;
      let premiumPaid = 0;
      let sessionFacilityId = facilityId;
      
      // Calculate healing parameters based on type
      switch (healingType) {
        case 'natural':
          timeReduction = 0;
          break;
          
        case 'currency':
          timeReduction = naturalTime * 0.5;
          currencyPaid = costs.currency;
          break;
          
        case 'premium':
          timeReduction = naturalTime;
          premiumPaid = costs.premium;
          break;
          
        case 'facility':
          if (!facilityId) throw new Error('Facility ID required for facility healing');
          
          const facilityResult = await query(
            `SELECT * FROM healing_facilities WHERE id = $1`,
            [facilityId]
          );
          
          if (facilityResult.rows.length === 0) {
            throw new Error('Facility not found');
          }
          
          const facility = facilityResult.rows[0];
          timeReduction = naturalTime * (1 - (1 / facility.healing_rate_multiplier));
          
          if (paymentMethod === 'currency') {
            currencyPaid = facility.currency_cost_per_hour * (naturalTime - timeReduction);
          } else {
            premiumPaid = facility.premium_cost_per_hour * (naturalTime - timeReduction);
          }
          break;
      }
      
      const completionTime = new Date(Date.now() + (naturalTime - timeReduction) * 60 * 60 * 1000);
      
      // Create healing session
      const sessionId = uuidv4();
      await query(
        `INSERT INTO character_healing_sessions 
         (id, character_id, facility_id, session_type, estimated_completion_time, currency_paid, premium_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          characterId,
          sessionFacilityId || 'natural',
          character.is_dead ? 'resurrection' : 'injury_healing',
          completionTime,
          currencyPaid,
          premiumPaid
        ]
      );
      
      // Update character recovery time
      await query(
        `UPDATE user_characters 
         SET recovery_time = $1 
         WHERE id = $2`,
        [completionTime, characterId]
      );
      
      // Deduct currency/premium if needed
      if (currencyPaid > 0 || premiumPaid > 0) {
        await this.deductHealingCosts(characterId, currencyPaid, premiumPaid);
      }
      
      return {
        id: sessionId,
        characterId,
        facilityId: sessionFacilityId || 'natural',
        sessionType: character.is_dead ? 'resurrection' : 'injury_healing',
        startTime: new Date(),
        estimatedCompletionTime: completionTime,
        currencyPaid,
        premiumPaid,
        isActive: true,
        isCompleted: false
      };
      
    } catch (error) {
      console.error('Error starting healing session:', error);
      throw error;
    }
  }

  /**
   * Check and complete healing sessions that are finished
   */
  static async processCompletedHealingSessions(): Promise<void> {
    try {
      // Find completed sessions
      const completedSessions = await query(
        `SELECT * FROM character_healing_sessions 
         WHERE is_active = true AND estimated_completion_time <= CURRENT_TIMESTAMP`
      );
      
      for (const session of completedSessions.rows) {
        await this.completeHealingSession(session.id);
      }
    } catch (error) {
      console.error('Error processing completed healing sessions:', error);
    }
  }

  /**
   * Complete a healing session and restore character
   */
  static async completeHealingSession(sessionId: string): Promise<void> {
    try {
      // Get session details
      const sessionResult = await query(
        `SELECT * FROM character_healing_sessions WHERE id = $1`,
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Healing session not found');
      }
      
      const session = sessionResult.rows[0];
      
      // Restore character health
      if (session.session_type === 'resurrection') {
        // Handle resurrection
        await query(
          `UPDATE user_characters 
           SET is_dead = false, 
               is_injured = false,
               injury_severity = 'healthy',
               current_health = max_health,
               death_timestamp = NULL,
               resurrection_available_at = NULL,
               recovery_time = NULL
           WHERE id = $1`,
          [session.character_id]
        );
      } else {
        // Handle injury healing
        await query(
          `UPDATE user_characters 
           SET is_injured = false,
               injury_severity = 'healthy', 
               current_health = max_health,
               recovery_time = NULL
           WHERE id = $1`,
          [session.character_id]
        );
      }
      
      // Mark session as completed
      await query(
        `UPDATE character_healing_sessions 
         SET is_active = false, is_completed = true 
         WHERE id = $1`,
        [sessionId]
      );
      
      console.log(`✅ Completed healing session for character ${session.character_id}`);
      
    } catch (error) {
      console.error('Error completing healing session:', error);
      throw error;
    }
  }

  /**
   * Deduct healing costs from user's currency
   */
  private static async deductHealingCosts(characterId: string, currencyCost: number, premiumCost: number): Promise<void> {
    try {
      // Get user ID from character
      const userResult = await query(
        `SELECT user_id FROM user_characters WHERE id = $1`,
        [characterId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('Character not found');
      }
      
      const userId = userResult.rows[0].user_id;
      
      // Deduct costs
      if (currencyCost > 0) {
        await query(
          `UPDATE user_currency 
           SET battle_tokens = battle_tokens - $1 
           WHERE user_id = $2 AND battle_tokens >= $1`,
          [currencyCost, userId]
        );
      }
      
      if (premiumCost > 0) {
        await query(
          `UPDATE user_currency 
           SET premium_currency = premium_currency - $1 
           WHERE user_id = $2 AND premium_currency >= $1`,
          [premiumCost, userId]
        );
      }
      
    } catch (error) {
      console.error('Error deducting healing costs:', error);
      throw error;
    }
  }

  /**
   * Get active healing sessions for a user
   */
  static async getUserHealingSessions(userId: string): Promise<HealingSession[]> {
    try {
      const result = await query(
        `SELECT chs.* FROM character_healing_sessions chs
         JOIN user_characters uc ON chs.character_id = uc.id
         WHERE uc.user_id = $1 AND chs.is_active = true
         ORDER BY chs.estimated_completion_time ASC`,
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        characterId: row.character_id,
        facilityId: row.facility_id,
        sessionType: row.session_type,
        startTime: new Date(row.start_time),
        estimatedCompletionTime: new Date(row.estimated_completion_time),
        currencyPaid: row.currency_paid,
        premiumPaid: row.premium_paid,
        isActive: row.is_active,
        isCompleted: row.is_completed
      }));
    } catch (error) {
      console.error('Error getting user healing sessions:', error);
      throw error;
    }
  }
}
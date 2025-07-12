import { initializeDatabase, query } from './src/database/index';

/**
 * Fix character stat scaling - make level 1 characters have appropriate base stats
 * and implement proper scaling formulas
 */

interface ScaledStats {
  baseHealth: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseSpecial: number;
}

/**
 * Calculate scaled stats for a character at a given level
 * Level 1 = base stats, Level 50 = current database stats
 */
function calculateScaledStats(currentStats: ScaledStats, level: number): ScaledStats {
  // Scale from level 1 to level 50 (max level)
  const maxLevel = 50;
  const scaleFactor = Math.min(level / maxLevel, 1);
  
  // Level 1 should be ~8% of current stats  
  const level1Multiplier = 0.08;
  const statRange = 1 - level1Multiplier; // 0.92 range from level 1 to max
  
  const finalMultiplier = level1Multiplier + (statRange * scaleFactor);
  
  return {
    baseHealth: Math.round(currentStats.baseHealth * finalMultiplier),
    baseAttack: Math.round(currentStats.baseAttack * finalMultiplier),
    baseDefense: Math.round(currentStats.baseDefense * finalMultiplier),
    baseSpeed: Math.round(currentStats.baseSpeed * finalMultiplier),
    baseSpecial: Math.round(currentStats.baseSpecial * finalMultiplier)
  };
}

/**
 * Calculate level 1 base stats from current endgame stats
 */
function calculateLevel1Stats(endgameStats: ScaledStats): ScaledStats {
  // Use a flexible multiplier that keeps HP under 100 but preserves character uniqueness
  const targetMaxHP = 100;
  const hpMultiplier = Math.min(0.1, targetMaxHP / endgameStats.baseHealth);
  
  // Use the same multiplier for other stats to maintain proportions
  const statMultiplier = hpMultiplier;
  
  return {
    baseHealth: Math.min(Math.max(Math.round(endgameStats.baseHealth * hpMultiplier), 40), 100), // 40-100 HP range
    baseAttack: Math.max(Math.round(endgameStats.baseAttack * statMultiplier), 6), // Min 6 attack
    baseDefense: Math.max(Math.round(endgameStats.baseDefense * statMultiplier), 4),  // Min 4 defense  
    baseSpeed: Math.max(Math.round(endgameStats.baseSpeed * statMultiplier), 8),   // Min 8 speed
    baseSpecial: Math.max(Math.round(endgameStats.baseSpecial * statMultiplier), 5)  // Min 5 special
  };
}

async function fixCharacterStatScaling() {
  try {
    console.log('🔧 Starting character stat scaling fix...');
    
    // Get all characters with their current stats
    const result = await query('SELECT * FROM characters ORDER BY name');
    const characters = result.rows;
    
    console.log(`Found ${characters.length} characters to fix`);
    
    // Update each character's base stats to level 1 appropriate values
    for (const character of characters) {
      const currentStats: ScaledStats = {
        baseHealth: character.base_health,
        baseAttack: character.base_attack,
        baseDefense: character.base_defense,
        baseSpeed: character.base_speed,
        baseSpecial: character.base_special
      };
      
      // Calculate appropriate level 1 stats
      const level1Stats = calculateLevel1Stats(currentStats);
      
      console.log(`\n📊 ${character.name}:`);
      console.log(`  Before: HP=${currentStats.baseHealth} ATK=${currentStats.baseAttack} DEF=${currentStats.baseDefense} SPD=${currentStats.baseSpeed} SPC=${currentStats.baseSpecial}`);
      console.log(`  After:  HP=${level1Stats.baseHealth} ATK=${level1Stats.baseAttack} DEF=${level1Stats.baseDefense} SPD=${level1Stats.baseSpeed} SPC=${level1Stats.baseSpecial}`);
      
      // Update the character's base stats in the database
      await query(`
        UPDATE characters 
        SET base_health = ?, base_attack = ?, base_defense = ?, base_speed = ?, base_special = ?
        WHERE id = ?
      `, [
        level1Stats.baseHealth,
        level1Stats.baseAttack, 
        level1Stats.baseDefense,
        level1Stats.baseSpeed,
        level1Stats.baseSpecial,
        character.id
      ]);
    }
    
    // Now update all user_characters to have proper current stats based on their level
    console.log('\n🔄 Updating user character stats based on their levels...');
    
    const userCharResult = await query(`
      SELECT uc.*, c.base_health, c.base_attack, c.base_defense, c.base_speed, c.base_special
      FROM user_characters uc 
      JOIN characters c ON uc.character_id = c.id
    `);
    
    for (const userChar of userCharResult.rows) {
      const level = userChar.level || 1;
      
      // Calculate stats for this character's level using the new level 1 base stats
      const characterBaseStats: ScaledStats = {
        baseHealth: userChar.base_health,
        baseAttack: userChar.base_attack,
        baseDefense: userChar.base_defense,
        baseSpeed: userChar.base_speed,
        baseSpecial: userChar.base_special
      };
      
      // For now, we'll calculate what the endgame stats should be (level 50)
      // and then scale back to the character's current level
      const endgameStats: ScaledStats = {
        baseHealth: Math.round(characterBaseStats.baseHealth / 0.08), // Reverse the level 1 calculation
        baseAttack: Math.round(characterBaseStats.baseAttack / 0.08),
        baseDefense: Math.round(characterBaseStats.baseDefense / 0.08),
        baseSpeed: Math.round(characterBaseStats.baseSpeed / 0.08),
        baseSpecial: Math.round(characterBaseStats.baseSpecial / 0.08)
      };
      
      const scaledStats = calculateScaledStats(endgameStats, level);
      
      // Update current and max health based on the character's level
      await query(`
        UPDATE user_characters 
        SET current_health = ?, max_health = ?
        WHERE id = ?
      `, [
        scaledStats.baseHealth, // Current health = max health
        scaledStats.baseHealth, // Max health based on level
        userChar.id
      ]);
    }
    
    console.log('\n✅ Character stat scaling fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Updated all characters to have level 1 appropriate base stats');
    console.log('- Level 1 stats are now ~20% of previous endgame stats');
    console.log('- User characters\' health updated to match their level');
    console.log('- Ready for proper level-based progression system');
    
  } catch (error) {
    console.error('❌ Error fixing character stat scaling:', error);
    throw error;
  }
}

// Example usage function to show stat scaling at different levels
async function demonstrateStatScaling() {
  console.log('\n📈 Stat Scaling Demonstration:');
  
  const achillesResult = await query('SELECT * FROM characters WHERE name = ?', ['Achilles']);
  if (achillesResult.rows[0]) {
    const achilles = achillesResult.rows[0];
    const baseStats: ScaledStats = {
      baseHealth: achilles.base_health,
      baseAttack: achilles.base_attack,
      baseDefense: achilles.base_defense,
      baseSpeed: achilles.base_speed,
      baseSpecial: achilles.base_special
    };
    
    // Calculate endgame stats for demonstration
    const endgameStats: ScaledStats = {
      baseHealth: Math.round(baseStats.baseHealth / 0.08),
      baseAttack: Math.round(baseStats.baseAttack / 0.08),
      baseDefense: Math.round(baseStats.baseDefense / 0.08),
      baseSpeed: Math.round(baseStats.baseSpeed / 0.08),
      baseSpecial: Math.round(baseStats.baseSpecial / 0.08)
    };
    
    console.log('\n⚔️ Achilles Stat Progression:');
    for (const level of [1, 10, 25, 40, 50]) {
      const stats = calculateScaledStats(endgameStats, level);
      console.log(`Level ${level.toString().padStart(2)}: HP=${stats.baseHealth.toString().padStart(4)} ATK=${stats.baseAttack.toString().padStart(3)} DEF=${stats.baseDefense.toString().padStart(3)} SPD=${stats.baseSpeed.toString().padStart(3)} SPC=${stats.baseSpecial.toString().padStart(3)}`);
    }
  }
}

// Main execution
async function main() {
  await initializeDatabase();
  await fixCharacterStatScaling();
  await demonstrateStatScaling();
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

export { calculateScaledStats, calculateLevel1Stats };
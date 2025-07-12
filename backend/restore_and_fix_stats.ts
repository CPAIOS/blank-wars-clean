import { initializeDatabase, query } from './src/database/index';

// Original endgame stats for all characters
const originalStats = {
  'achilles': { hp: 1200, atk: 185, def: 120, spd: 140, spc: 90 },
  'agent_x': { hp: 700, atk: 130, def: 80, spd: 170, spc: 85 },
  'alien_grey': { hp: 600, atk: 75, def: 85, spd: 110, spc: 95 },
  'billy_the_kid': { hp: 650, atk: 140, def: 60, spd: 160, spc: 75 },
  'cleopatra': { hp: 900, atk: 80, def: 95, spd: 110, spc: 95 },
  'dracula': { hp: 1100, atk: 140, def: 110, spd: 120, spc: 85 },
  'fenrir': { hp: 1400, atk: 170, def: 100, spd: 180, spc: 95 },
  'frankenstein_monster': { hp: 1500, atk: 160, def: 140, spd: 50, spc: 60 },
  'genghis_khan': { hp: 1100, atk: 155, def: 105, spd: 130, spc: 92 },
  'holmes': { hp: 700, atk: 70, def: 60, spd: 85, spc: 98 },
  'joan': { hp: 1000, atk: 130, def: 120, spd: 100, spc: 88 },
  'merlin': { hp: 800, atk: 60, def: 80, spd: 90, spc: 100 },
  'robin_hood': { hp: 800, atk: 120, def: 75, spd: 150, spc: 80 },
  'sammy_slugger': { hp: 950, atk: 160, def: 85, spd: 120, spc: 65 },
  'space_cyborg': { hp: 1300, atk: 145, def: 160, spd: 70, spc: 75 },
  'sun_wukong': { hp: 1000, atk: 150, def: 90, spd: 200, spc: 95 },
  'tesla': { hp: 750, atk: 85, def: 70, spd: 90, spc: 100 }
};

interface ScaledStats {
  baseHealth: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseSpecial: number;
}

/**
 * Calculate level 1 stats that maintain character uniqueness while keeping HP under 100
 */
function calculateLevel1Stats(endgameStats: ScaledStats): ScaledStats {
  // Target 50-95 HP for level 1, maintaining relative differences
  const minHP = 50;
  const maxHP = 95;
  
  // Calculate a scaling factor based on original HP
  const hpRange = 1500 - 600; // Range from weakest to strongest character
  const relativeStrength = (endgameStats.baseHealth - 600) / hpRange; // 0-1 scale
  const targetHP = minHP + (relativeStrength * (maxHP - minHP));
  
  const hpMultiplier = targetHP / endgameStats.baseHealth;
  
  return {
    baseHealth: Math.round(targetHP),
    baseAttack: Math.max(Math.round(endgameStats.baseAttack * hpMultiplier), 8),
    baseDefense: Math.max(Math.round(endgameStats.baseDefense * hpMultiplier), 5),
    baseSpeed: Math.max(Math.round(endgameStats.baseSpeed * hpMultiplier), 10),
    baseSpecial: Math.max(Math.round(endgameStats.baseSpecial * hpMultiplier), 6)
  };
}

async function restoreAndFixStats() {
  try {
    console.log('🔄 Restoring original endgame stats...');
    
    // First restore all original stats
    for (const [charId, stats] of Object.entries(originalStats)) {
      await query(`
        UPDATE characters 
        SET base_health = ?, base_attack = ?, base_defense = ?, base_speed = ?, base_special = ?
        WHERE id = ?
      `, [stats.hp, stats.atk, stats.def, stats.spd, stats.spc, charId]);
    }
    
    console.log('✅ Original stats restored');
    console.log('\n🔧 Applying improved level 1 scaling...');
    
    // Now apply the new level 1 scaling
    const result = await query('SELECT * FROM characters ORDER BY name');
    const characters = result.rows;
    
    for (const character of characters) {
      const endgameStats: ScaledStats = {
        baseHealth: character.base_health,
        baseAttack: character.base_attack,
        baseDefense: character.base_defense,
        baseSpeed: character.base_speed,
        baseSpecial: character.base_special
      };
      
      const level1Stats = calculateLevel1Stats(endgameStats);
      
      console.log(`📊 ${character.name}:`);
      console.log(`  Endgame: HP=${endgameStats.baseHealth} ATK=${endgameStats.baseAttack} DEF=${endgameStats.baseDefense} SPD=${endgameStats.baseSpeed} SPC=${endgameStats.baseSpecial}`);
      console.log(`  Level 1: HP=${level1Stats.baseHealth} ATK=${level1Stats.baseAttack} DEF=${level1Stats.baseDefense} SPD=${level1Stats.baseSpeed} SPC=${level1Stats.baseSpecial}`);
      
      // Update to level 1 stats
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
    
    console.log('\n✅ Level 1 stat scaling applied successfully!');
    console.log('\n📋 Summary:');
    console.log('- All characters now have level 1 appropriate stats (50-95 HP)');
    console.log('- Character uniqueness preserved');
    console.log('- Ready for proper progression system');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  await initializeDatabase();
  await restoreAndFixStats();
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}
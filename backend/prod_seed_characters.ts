import { query } from './src/database/index';

/**
 * Production-safe character seeding with only supported archetypes
 * Uses only: warrior, scholar, beast, mage, mystic
 */

async function prodSeedCharacters() {
  try {
    console.log('🌱 Starting production-safe character seeding...\n');

    // Clear existing characters
    console.log('🗑️  Clearing existing characters...');
    await query('DELETE FROM user_characters', []); 
    await query('DELETE FROM characters', []); 
    console.log('✅ Cleared existing character data');

    // Characters with only supported archetypes
    const productionCharacters = [
      {
        id: 'achilles',
        name: 'Achilles',
        title: 'Hero of Troy',
        archetype: 'warrior', // ✅ Supported
        origin_era: 'Ancient Greece (1200 BCE)',
        rarity: 'legendary',
        base_health: 1200,
        base_attack: 185,
        base_defense: 120,
        base_speed: 140,
        base_special: 90,
        personality_traits: JSON.stringify(['Honorable', 'Wrathful', 'Courageous', 'Prideful']),
        conversation_style: 'Noble and passionate',
        backstory: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
        conversation_topics: JSON.stringify(['Glory', 'Honor', 'Revenge', 'Troy', 'Combat']),
        avatar_emoji: '⚔️',
        abilities: JSON.stringify({
          baseStats: { strength: 95, agility: 85, intelligence: 60, vitality: 90, wisdom: 45, charisma: 80 },
          combatStats: { maxHealth: 1200, maxMana: 300, magicAttack: 50, magicDefense: 80, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 20 }
        })
      },
      {
        id: 'merlin',
        name: 'Merlin',
        title: 'Archmage of Camelot',
        archetype: 'mage', // ✅ Supported
        origin_era: 'Medieval Britain (5th-6th century)',
        rarity: 'mythic',
        base_health: 800,
        base_attack: 60,
        base_defense: 80,
        base_speed: 90,
        base_special: 100,
        personality_traits: JSON.stringify(['Wise', 'Mysterious', 'Patient', 'Calculating']),
        conversation_style: 'Archaic and profound',
        backstory: 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
        conversation_topics: JSON.stringify(['Knowledge', 'Balance', 'Protecting the realm', 'Magic', 'Time']),
        avatar_emoji: '🔮',
        abilities: JSON.stringify({
          baseStats: { strength: 30, agility: 50, intelligence: 98, vitality: 70, wisdom: 95, charisma: 85 },
          combatStats: { maxHealth: 800, maxMana: 2000, magicAttack: 200, magicDefense: 180, criticalChance: 15, criticalDamage: 300, accuracy: 95, evasion: 25 }
        })
      },
      {
        id: 'fenrir',
        name: 'Fenrir',
        title: 'The Great Wolf',
        archetype: 'beast', // ✅ Supported
        origin_era: 'Norse Age (8th-11th century)',
        rarity: 'legendary',
        base_health: 1400,
        base_attack: 170,
        base_defense: 100,
        base_speed: 180,
        base_special: 95,
        personality_traits: JSON.stringify(['Savage', 'Loyal', 'Vengeful', 'Primal']),
        conversation_style: 'Growling and direct',
        backstory: 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
        conversation_topics: JSON.stringify(['Freedom', 'Vengeance', 'Pack loyalty', 'The hunt']),
        avatar_emoji: '🐺',
        abilities: JSON.stringify({
          baseStats: { strength: 90, agility: 95, intelligence: 40, vitality: 95, wisdom: 30, charisma: 50 },
          combatStats: { maxHealth: 1400, maxMana: 200, magicAttack: 30, magicDefense: 60, criticalChance: 30, criticalDamage: 220, accuracy: 88, evasion: 30 }
        })
      },
      {
        id: 'cleopatra',
        name: 'Cleopatra VII',
        title: 'Last Pharaoh of Egypt',
        archetype: 'mystic', // ✅ Supported
        origin_era: 'Ptolemaic Egypt (69-30 BCE)',
        rarity: 'epic',
        base_health: 900,
        base_attack: 80,
        base_defense: 95,
        base_speed: 110,
        base_special: 95,
        personality_traits: JSON.stringify(['Brilliant', 'Charismatic', 'Ambitious', 'Diplomatic']),
        conversation_style: 'Regal and commanding',
        backstory: 'The brilliant and charismatic final pharaoh of Ancient Egypt, master of politics and ancient mysteries.',
        conversation_topics: JSON.stringify(['Power', 'Legacy', 'Egyptian restoration', 'Politics']),
        avatar_emoji: '👑',
        abilities: JSON.stringify({
          baseStats: { strength: 50, agility: 70, intelligence: 95, vitality: 80, wisdom: 90, charisma: 98 },
          combatStats: { maxHealth: 900, maxMana: 1500, magicAttack: 150, magicDefense: 140, criticalChance: 20, criticalDamage: 180, accuracy: 85, evasion: 25 }
        })
      },
      {
        id: 'sherlock',
        name: 'Sherlock Holmes',
        title: 'Consulting Detective',
        archetype: 'scholar', // ✅ Supported
        origin_era: 'Victorian London (1880s-1910s)',
        rarity: 'rare',
        base_health: 700,
        base_attack: 70,
        base_defense: 60,
        base_speed: 85,
        base_special: 98,
        personality_traits: JSON.stringify(['Analytical', 'Observant', 'Eccentric', 'Logical']),
        conversation_style: 'Precise and deductive',
        backstory: 'The world\'s first consulting detective, master of observation and deductive reasoning.',
        conversation_topics: JSON.stringify(['Mystery', 'Logic', 'Investigation', 'Crime', 'Science']),
        avatar_emoji: '🔍',
        abilities: JSON.stringify({
          baseStats: { strength: 40, agility: 60, intelligence: 98, vitality: 55, wisdom: 85, charisma: 70 },
          combatStats: { maxHealth: 700, maxMana: 1200, magicAttack: 120, magicDefense: 100, criticalChance: 35, criticalDamage: 250, accuracy: 95, evasion: 30 }
        })
      },
      {
        id: 'dracula',
        name: 'Count Dracula',
        title: 'Lord of the Undead',
        archetype: 'mystic', // ✅ Supported (changed from scholar)
        origin_era: 'Gothic Victorian (1897)',
        rarity: 'legendary',
        base_health: 1100,
        base_attack: 140,
        base_defense: 110,
        base_speed: 120,
        base_special: 85,
        personality_traits: JSON.stringify(['Aristocratic', 'Cunning', 'Predatory', 'Charismatic']),
        conversation_style: 'Elegant and menacing',
        backstory: 'The immortal vampire lord of Transylvania, master of dark magic and eternal night.',
        conversation_topics: JSON.stringify(['Immortality', 'Power', 'The hunt', 'Darkness', 'Aristocracy']),
        avatar_emoji: '🧛',
        abilities: JSON.stringify({
          baseStats: { strength: 85, agility: 80, intelligence: 75, vitality: 90, wisdom: 70, charisma: 85 },
          combatStats: { maxHealth: 1100, maxMana: 800, magicAttack: 160, magicDefense: 120, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 35 }
        })
      },
      {
        id: 'joan',
        name: 'Joan of Arc',
        title: 'The Maid of Orleans',
        archetype: 'warrior', // ✅ Supported (changed from leader)
        origin_era: 'Medieval France (1412-1431)',
        rarity: 'epic',
        base_health: 1000,
        base_attack: 130,
        base_defense: 120,
        base_speed: 100,
        base_special: 88,
        personality_traits: JSON.stringify(['Devout', 'Courageous', 'Inspirational', 'Determined']),
        conversation_style: 'Passionate and inspiring',
        backstory: 'The peasant girl who became a saint, led France to victory against the English through divine visions.',
        conversation_topics: JSON.stringify(['Faith', 'Justice', 'France', 'Leadership', 'Divine calling']),
        avatar_emoji: '⚡',
        abilities: JSON.stringify({
          baseStats: { strength: 80, agility: 75, intelligence: 70, vitality: 85, wisdom: 90, charisma: 95 },
          combatStats: { maxHealth: 1000, maxMana: 1000, magicAttack: 140, magicDefense: 130, criticalChance: 20, criticalDamage: 190, accuracy: 88, evasion: 22 }
        })
      },
      {
        id: 'frankenstein',
        name: 'Frankenstein\'s Monster',
        title: 'The Created',
        archetype: 'warrior', // ✅ Supported
        origin_era: 'Gothic Literature (1818)',
        rarity: 'rare',
        base_health: 1500,
        base_attack: 160,
        base_defense: 140,
        base_speed: 50,
        base_special: 60,
        personality_traits: JSON.stringify(['Lonely', 'Vengeful', 'Philosophical', 'Tormented']),
        conversation_style: 'Melancholic and profound',
        backstory: 'The artificial being created by Victor Frankenstein, struggling with existence and seeking acceptance.',
        conversation_topics: JSON.stringify(['Existence', 'Loneliness', 'Creation', 'Revenge', 'Humanity']),
        avatar_emoji: '⚡',
        abilities: JSON.stringify({
          baseStats: { strength: 98, agility: 30, intelligence: 65, vitality: 98, wisdom: 60, charisma: 25 },
          combatStats: { maxHealth: 1500, maxMana: 400, magicAttack: 40, magicDefense: 80, criticalChance: 15, criticalDamage: 180, accuracy: 70, evasion: 10 }
        })
      },
      {
        id: 'sun_wukong',
        name: 'Sun Wukong',
        title: 'The Monkey King',
        archetype: 'beast', // ✅ Supported (changed from trickster)
        origin_era: 'Chinese Mythology (Journey to the West)',
        rarity: 'mythic',
        base_health: 1000,
        base_attack: 150,
        base_defense: 90,
        base_speed: 200,
        base_special: 95,
        personality_traits: JSON.stringify(['Mischievous', 'Rebellious', 'Loyal', 'Proud']),
        conversation_style: 'Playful and irreverent',
        backstory: 'The immortal Monkey King, master of 72 transformations and legendary troublemaker of Heaven.',
        conversation_topics: JSON.stringify(['Freedom', 'Mischief', 'Immortality', 'Adventure', 'Rebellion']),
        avatar_emoji: '🐒',
        abilities: JSON.stringify({
          baseStats: { strength: 90, agility: 98, intelligence: 80, vitality: 85, wisdom: 75, charisma: 80 },
          combatStats: { maxHealth: 1000, maxMana: 1200, magicAttack: 180, magicDefense: 160, criticalChance: 40, criticalDamage: 250, accuracy: 95, evasion: 45 }
        })
      },
      {
        id: 'billy_kid',
        name: 'Billy the Kid',
        title: 'The Outlaw',
        archetype: 'warrior', // ✅ Supported (changed from trickster)
        origin_era: 'American Old West (1870s-1880s)',
        rarity: 'uncommon',
        base_health: 650,
        base_attack: 140,
        base_defense: 60,
        base_speed: 160,
        base_special: 75,
        personality_traits: JSON.stringify(['Quick-tempered', 'Loyal', 'Reckless', 'Charismatic']),
        conversation_style: 'Casual and confident',
        backstory: 'The notorious young gunslinger of the American frontier, quick on the draw and quicker to anger.',
        conversation_topics: JSON.stringify(['Freedom', 'Justice', 'The frontier', 'Gunfights', 'Loyalty']),
        avatar_emoji: '🤠',
        abilities: JSON.stringify({
          baseStats: { strength: 65, agility: 95, intelligence: 55, vitality: 60, wisdom: 45, charisma: 75 },
          combatStats: { maxHealth: 650, maxMana: 300, magicAttack: 20, magicDefense: 40, criticalChance: 45, criticalDamage: 280, accuracy: 98, evasion: 40 }
        })
      }
    ];

    console.log(`🎯 Inserting ${productionCharacters.length} production-safe characters...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const char of productionCharacters) {
      try {
        await query(`
          INSERT INTO characters (
            id, name, title, archetype, origin_era, rarity,
            base_health, base_attack, base_defense, base_speed, base_special,
            personality_traits, conversation_style, backstory, conversation_topics,
            avatar_emoji, abilities
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          char.id, char.name, char.title, char.archetype, char.origin_era, char.rarity,
          char.base_health, char.base_attack, char.base_defense, char.base_speed, char.base_special,
          char.personality_traits, char.conversation_style, char.backstory, char.conversation_topics,
          char.avatar_emoji, char.abilities
        ]);
        
        console.log(`   ✅ ${char.name} (${char.id}) - ${char.archetype}`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to insert ${char.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Seeding Results:`);
    console.log(`   ✅ Successfully inserted: ${successCount} characters`);
    console.log(`   ❌ Failed to insert: ${errorCount} characters`);

    // Verify final count
    const finalCount = await query('SELECT COUNT(*) as count FROM characters', []);
    console.log(`   📋 Total characters in database: ${finalCount.rows[0].count}`);

    console.log('\n✅ Production-safe character seeding completed!');

  } catch (error) {
    console.error('❌ Error during production seeding:', error);
  }
}

// Run the script
prodSeedCharacters();
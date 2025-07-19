import { query } from './src/database/index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Script to seed the database with the CORRECT characters from frontend
 * This fixes the wrong character names and archetypes I incorrectly populated
 */

async function seedCorrectCharacters() {
  try {
    console.log('🔧 Starting CORRECT character seeding...\n');

    // Clear existing incorrect data
    console.log('🗑️  Clearing existing incorrect character data...');
    await query('DELETE FROM user_characters'); // Remove user assignments first (foreign key)
    await query('DELETE FROM characters'); // Then remove characters
    console.log('✅ Cleared existing character data');

    // Define the CORRECT 17 characters from frontend createDemoCharacterCollection
    // Based on the actual templates in /frontend/src/data/characters.ts
    const correctCharacters = [
      {
        id: 'achilles',
        name: 'Achilles',
        title: 'Hero of Troy',
        archetype: 'warrior',
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
          baseStats: { strength: 95, agility: 85, intelligence: 60, vitality: 90, wisdom: 45, charisma: 80 }
        })
      },
      {
        id: 'merlin',
        name: 'Merlin',
        title: 'Archmage of Camelot',
        archetype: 'mage',
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
          baseStats: { strength: 30, agility: 50, intelligence: 98, vitality: 70, wisdom: 95, charisma: 85 }
        })
      },
      {
        id: 'fenrir',
        name: 'Fenrir',
        title: 'The Great Wolf',
        archetype: 'beast',
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
          baseStats: { strength: 90, agility: 95, intelligence: 40, vitality: 95, wisdom: 30, charisma: 50 }
        })
      },
      {
        id: 'cleopatra',
        name: 'Cleopatra VII',
        title: 'Last Pharaoh of Egypt',
        archetype: 'leader',
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
          baseStats: { strength: 50, agility: 70, intelligence: 95, vitality: 80, wisdom: 90, charisma: 98 }
        })
      },
      {
        id: 'holmes',
        name: 'Sherlock Holmes',
        title: 'Consulting Detective',
        archetype: 'scholar',
        origin_era: 'Victorian London (1880s-1910s)',
        rarity: 'rare',
        base_health: 700,
        base_attack: 70,
        base_defense: 60,
        base_speed: 85,
        base_special: 98,
        personality_traits: JSON.stringify(['Analytical', 'Observant', 'Eccentric', 'Logical']),
        conversation_style: 'Precise and deductive',
        backstory: 'The worlds first consulting detective, master of observation and deductive reasoning.',
        conversation_topics: JSON.stringify(['Mystery', 'Logic', 'Investigation', 'Crime', 'Science']),
        avatar_emoji: '🔍',
        abilities: JSON.stringify({
          baseStats: { strength: 40, agility: 60, intelligence: 98, vitality: 55, wisdom: 85, charisma: 70 }
        })
      },
      {
        id: 'dracula',
        name: 'Count Dracula',
        title: 'Lord of the Undead',
        archetype: 'mystic',
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
          baseStats: { strength: 85, agility: 80, intelligence: 75, vitality: 90, wisdom: 70, charisma: 85 }
        })
      },
      {
        id: 'joan',
        name: 'Joan of Arc',
        title: 'The Maid of Orleans',
        archetype: 'leader',
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
          baseStats: { strength: 80, agility: 75, intelligence: 70, vitality: 85, wisdom: 90, charisma: 95 }
        })
      },
      {
        id: 'frankenstein_monster',
        name: 'Frankensteins Monster',
        title: 'The Created',
        archetype: 'tank',
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
          baseStats: { strength: 98, agility: 30, intelligence: 65, vitality: 98, wisdom: 60, charisma: 25 }
        })
      },
      {
        id: 'sun_wukong',
        name: 'Sun Wukong',
        title: 'The Monkey King',
        archetype: 'trickster',
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
          baseStats: { strength: 90, agility: 98, intelligence: 80, vitality: 85, wisdom: 75, charisma: 80 }
        })
      },
      {
        id: 'sammy_slugger',
        name: 'Sammy "Slugger" Sullivan',
        title: 'Boxing Champion',
        archetype: 'warrior',
        origin_era: 'Great Depression (1930s)',
        rarity: 'uncommon',
        base_health: 950,
        base_attack: 160,
        base_defense: 85,
        base_speed: 120,
        base_special: 65,
        personality_traits: JSON.stringify(['Determined', 'Loyal', 'Scrappy', 'Optimistic']),
        conversation_style: 'Brooklyn accent, enthusiastic',
        backstory: 'A championship boxer from Brooklyn who fought his way out of poverty through determination and heart.',
        conversation_topics: JSON.stringify(['Boxing', 'Perseverance', 'Family', 'The neighborhood', 'Fair play']),
        avatar_emoji: '🥊',
        abilities: JSON.stringify({
          baseStats: { strength: 85, agility: 80, intelligence: 50, vitality: 85, wisdom: 55, charisma: 75 }
        })
      },
      {
        id: 'billy_the_kid',
        name: 'Billy the Kid',
        title: 'The Outlaw',
        archetype: 'assassin',
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
          baseStats: { strength: 65, agility: 95, intelligence: 55, vitality: 60, wisdom: 45, charisma: 75 }
        })
      },
      {
        id: 'genghis_khan',
        name: 'Genghis Khan',
        title: 'Great Khan',
        archetype: 'leader',
        origin_era: 'Mongol Empire (1162-1227)',
        rarity: 'legendary',
        base_health: 1100,
        base_attack: 155,
        base_defense: 105,
        base_speed: 130,
        base_special: 92,
        personality_traits: JSON.stringify(['Ruthless', 'Strategic', 'Ambitious', 'Unifying']),
        conversation_style: 'Commanding and direct',
        backstory: 'The Great Khan who united the Mongol tribes and built the largest contiguous empire in history.',
        conversation_topics: JSON.stringify(['Conquest', 'Unity', 'Strategy', 'Empire', 'Legacy']),
        avatar_emoji: '🏹',
        abilities: JSON.stringify({
          baseStats: { strength: 88, agility: 80, intelligence: 90, vitality: 85, wisdom: 85, charisma: 92 }
        })
      },
      {
        id: 'tesla',
        name: 'Nikola Tesla',
        title: 'Master of Lightning',
        archetype: 'scholar',
        origin_era: 'Industrial Revolution (1856-1943)',
        rarity: 'epic',
        base_health: 750,
        base_attack: 85,
        base_defense: 70,
        base_speed: 90,
        base_special: 100,
        personality_traits: JSON.stringify(['Brilliant', 'Eccentric', 'Visionary', 'Obsessive']),
        conversation_style: 'Scientific and passionate',
        backstory: 'The brilliant inventor and electrical engineer whose innovations shaped the modern world.',
        conversation_topics: JSON.stringify(['Electricity', 'Innovation', 'The future', 'Science', 'Energy']),
        avatar_emoji: '⚡',
        abilities: JSON.stringify({
          baseStats: { strength: 45, agility: 60, intelligence: 98, vitality: 65, wisdom: 80, charisma: 70 }
        })
      },
      {
        id: 'alien_grey',
        name: 'Zeta Reticulan',
        title: 'Alien Observer',
        archetype: 'scholar',
        origin_era: 'Modern UFO Era (1947-Present)',
        rarity: 'rare',
        base_health: 600,
        base_attack: 75,
        base_defense: 85,
        base_speed: 110,
        base_special: 95,
        personality_traits: JSON.stringify(['Curious', 'Detached', 'Analytical', 'Superior']),
        conversation_style: 'Clinical and otherworldly',
        backstory: 'An extraterrestrial being studying human civilization with advanced technology and psychic abilities.',
        conversation_topics: JSON.stringify(['Human behavior', 'Technology', 'The cosmos', 'Evolution', 'Experimentation']),
        avatar_emoji: '👽',
        abilities: JSON.stringify({
          baseStats: { strength: 35, agility: 70, intelligence: 95, vitality: 50, wisdom: 90, charisma: 40 }
        })
      },
      {
        id: 'robin_hood',
        name: 'Robin Hood',
        title: 'Prince of Thieves',
        archetype: 'trickster',
        origin_era: 'Medieval England (Legendary)',
        rarity: 'rare',
        base_health: 800,
        base_attack: 120,
        base_defense: 75,
        base_speed: 150,
        base_special: 80,
        personality_traits: JSON.stringify(['Noble', 'Rebellious', 'Generous', 'Witty']),
        conversation_style: 'Charming and roguish',
        backstory: 'The legendary outlaw of Sherwood Forest who stole from the rich to give to the poor.',
        conversation_topics: JSON.stringify(['Justice', 'Freedom', 'The poor', 'Sherwood Forest', 'King Richard']),
        avatar_emoji: '🏹',
        abilities: JSON.stringify({
          baseStats: { strength: 70, agility: 90, intelligence: 75, vitality: 70, wisdom: 65, charisma: 85 }
        })
      },
      {
        id: 'space_cyborg',
        name: 'Space Cyborg',
        title: 'Space Cyborg',
        archetype: 'tank',
        origin_era: 'Cyberpunk Future (2087)',
        rarity: 'epic',
        base_health: 1300,
        base_attack: 145,
        base_defense: 160,
        base_speed: 70,
        base_special: 75,
        personality_traits: JSON.stringify(['Logical', 'Protective', 'Evolving', 'Curious']),
        conversation_style: 'Analytical and learning',
        backstory: 'An advanced combat cyborg from the future, part organic and part machine, seeking to understand humanity.',
        conversation_topics: JSON.stringify(['Logic', 'Protection', 'Technology', 'Human nature', 'The future']),
        avatar_emoji: '🤖',
        abilities: JSON.stringify({
          baseStats: { strength: 90, agility: 50, intelligence: 80, vitality: 95, wisdom: 60, charisma: 40 }
        })
      },
      {
        id: 'agent_x',
        name: 'Agent X',
        title: 'Shadow Operative',
        archetype: 'assassin',
        origin_era: 'Modern Espionage (1960s-Present)',
        rarity: 'rare',
        base_health: 700,
        base_attack: 130,
        base_defense: 80,
        base_speed: 170,
        base_special: 85,
        personality_traits: JSON.stringify(['Professional', 'Calculating', 'Secretive', 'Loyal']),
        conversation_style: 'Brief and professional',
        backstory: 'An elite intelligence operative specializing in covert operations and elimination targets.',
        conversation_topics: JSON.stringify(['Mission objectives', 'Security', 'Technology', 'Strategy', 'Loyalty']),
        avatar_emoji: '🕴️',
        abilities: JSON.stringify({
          baseStats: { strength: 75, agility: 92, intelligence: 85, vitality: 70, wisdom: 80, charisma: 60 }
        })
      }
    ];

    console.log(`\\n🎯 Inserting ${correctCharacters.length} CORRECT characters...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const char of correctCharacters) {
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

    console.log(`\\n📊 CORRECT Seeding Results:`);
    console.log(`   ✅ Successfully inserted: ${successCount} characters`);
    console.log(`   ❌ Failed to insert: ${errorCount} characters`);

    // Verify final count
    const finalCount = await query('SELECT COUNT(*) as count FROM characters');
    console.log(`   📋 Total characters in database: ${finalCount.rows[0].count}`);

    console.log('\\n✅ CORRECT character seeding completed!');

  } catch (error) {
    console.error('❌ Error during correct seeding:', error);
  }
}

// Run the script
seedCorrectCharacters();
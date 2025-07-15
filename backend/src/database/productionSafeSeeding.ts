import { query } from '../database';

// Production-safe character seeding with only supported archetypes
// These characters are guaranteed to work with current database constraints
export const productionSafeCharacters = [
  // Legendary characters
  {
    id: 'achilles', name: 'Achilles', title: 'Hero of Troy', archetype: 'warrior', origin_era: 'Ancient Greece (1200 BCE)', rarity: 'legendary',
    base_health: 1200, base_attack: 185, base_defense: 120, base_speed: 140, base_special: 90,
    personality_traits: JSON.stringify(['Honorable', 'Wrathful', 'Courageous', 'Prideful']),
    conversation_style: 'Noble and passionate', backstory: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
    conversation_topics: JSON.stringify(['Glory', 'Honor', 'Revenge', 'Troy', 'Combat']), avatar_emoji: '⚔️',
    abilities: JSON.stringify({ baseStats: { strength: 95, agility: 85, intelligence: 60, vitality: 90, wisdom: 45, charisma: 80 }, combatStats: { maxHealth: 1200, maxMana: 300, magicAttack: 50, magicDefense: 80, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 20 } })
  },
  {
    id: 'fenrir', name: 'Fenrir', title: 'The Great Wolf', archetype: 'beast', origin_era: 'Norse Age (8th-11th century)', rarity: 'legendary',
    base_health: 1400, base_attack: 170, base_defense: 100, base_speed: 180, base_special: 95,
    personality_traits: JSON.stringify(['Savage', 'Loyal', 'Vengeful', 'Primal']),
    conversation_style: 'Growling and direct', backstory: 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
    conversation_topics: JSON.stringify(['Freedom', 'Vengeance', 'Pack loyalty', 'The hunt']), avatar_emoji: '🐺',
    abilities: JSON.stringify({ baseStats: { strength: 90, agility: 95, intelligence: 40, vitality: 95, wisdom: 30, charisma: 50 }, combatStats: { maxHealth: 1400, maxMana: 200, magicAttack: 30, magicDefense: 60, criticalChance: 30, criticalDamage: 220, accuracy: 88, evasion: 30 } })
  },
  {
    id: 'dracula', name: 'Count Dracula', title: 'Lord of the Undead', archetype: 'scholar', origin_era: 'Gothic Victorian (1897)', rarity: 'legendary',
    base_health: 1100, base_attack: 140, base_defense: 110, base_speed: 120, base_special: 85,
    personality_traits: JSON.stringify(['Aristocratic', 'Cunning', 'Predatory', 'Charismatic']),
    conversation_style: 'Elegant and menacing', backstory: 'The immortal vampire lord of Transylvania, master of dark magic and eternal night.',
    conversation_topics: JSON.stringify(['Immortality', 'Power', 'The hunt', 'Darkness', 'Aristocracy']), avatar_emoji: '🧛',
    abilities: JSON.stringify({ baseStats: { strength: 85, agility: 80, intelligence: 75, vitality: 90, wisdom: 70, charisma: 85 }, combatStats: { maxHealth: 1100, maxMana: 800, magicAttack: 160, magicDefense: 120, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 35 } })
  },
  {
    id: 'musashi', name: 'Miyamoto Musashi', title: 'Sword Saint', archetype: 'warrior', origin_era: 'Feudal Japan (1584-1645)', rarity: 'legendary',
    base_health: 1000, base_attack: 175, base_defense: 100, base_speed: 140, base_special: 88,
    personality_traits: JSON.stringify(['Disciplined', 'Philosophical', 'Perfectionist', 'Honorable']),
    conversation_style: 'Zen-like and thoughtful', backstory: 'The greatest swordsman in Japanese history, undefeated in 61 duels and author of The Book of Five Rings.',
    conversation_topics: JSON.stringify(['The Way', 'Honor', 'Mastery', 'Strategy', 'Perfection']), avatar_emoji: '⚔️',
    abilities: JSON.stringify({ baseStats: { strength: 92, agility: 88, intelligence: 85, vitality: 85, wisdom: 90, charisma: 75 }, combatStats: { maxHealth: 1000, maxMana: 600, magicAttack: 80, magicDefense: 90, criticalChance: 35, criticalDamage: 250, accuracy: 98, evasion: 30 } })
  },
  // Mythic characters
  {
    id: 'merlin', name: 'Merlin', title: 'Archmage of Camelot', archetype: 'scholar', origin_era: 'Medieval Britain (5th-6th century)', rarity: 'mythic',
    base_health: 800, base_attack: 60, base_defense: 80, base_speed: 90, base_special: 100,
    personality_traits: JSON.stringify(['Wise', 'Mysterious', 'Patient', 'Calculating']),
    conversation_style: 'Archaic and profound', backstory: 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
    conversation_topics: JSON.stringify(['Knowledge', 'Balance', 'Protecting the realm', 'Magic', 'Time']), avatar_emoji: '🔮',
    abilities: JSON.stringify({ baseStats: { strength: 30, agility: 50, intelligence: 98, vitality: 70, wisdom: 95, charisma: 85 }, combatStats: { maxHealth: 800, maxMana: 2000, magicAttack: 200, magicDefense: 180, criticalChance: 15, criticalDamage: 300, accuracy: 95, evasion: 25 } })
  },
  {
    id: 'circe', name: 'Circe', title: 'Enchantress of Aeaea', archetype: 'scholar', origin_era: 'Greek Mythology (Ancient)', rarity: 'mythic',
    base_health: 850, base_attack: 70, base_defense: 85, base_speed: 95, base_special: 98,
    personality_traits: JSON.stringify(['Cunning', 'Seductive', 'Powerful', 'Capricious']),
    conversation_style: 'Enchanting and mysterious', backstory: 'The divine sorceress of Greek mythology, master of transformation magic and potions.',
    conversation_topics: JSON.stringify(['Magic', 'Transformation', 'Power', 'Immortality', 'Desire']), avatar_emoji: '🔮',
    abilities: JSON.stringify({ baseStats: { strength: 40, agility: 65, intelligence: 95, vitality: 75, wisdom: 88, charisma: 95 }, combatStats: { maxHealth: 850, maxMana: 2200, magicAttack: 210, magicDefense: 190, criticalChance: 18, criticalDamage: 290, accuracy: 92, evasion: 30 } })
  },
  // Epic characters
  {
    id: 'tesla', name: 'Nikola Tesla', title: 'Master of Lightning', archetype: 'scholar', origin_era: 'Industrial Revolution (1856-1943)', rarity: 'epic',
    base_health: 750, base_attack: 85, base_defense: 70, base_speed: 90, base_special: 100,
    personality_traits: JSON.stringify(['Brilliant', 'Eccentric', 'Visionary', 'Obsessive']),
    conversation_style: 'Scientific and passionate', backstory: 'The brilliant inventor and electrical engineer whose innovations shaped the modern world.',
    conversation_topics: JSON.stringify(['Electricity', 'Innovation', 'The future', 'Science', 'Energy']), avatar_emoji: '⚡',
    abilities: JSON.stringify({ baseStats: { strength: 45, agility: 60, intelligence: 98, vitality: 65, wisdom: 80, charisma: 70 }, combatStats: { maxHealth: 750, maxMana: 1800, magicAttack: 220, magicDefense: 150, criticalChance: 25, criticalDamage: 260, accuracy: 92, evasion: 28 } })
  },
  {
    id: 'unit_734', name: 'Unit 734', title: 'Combat Android', archetype: 'warrior', origin_era: 'Cyberpunk Future (2087)', rarity: 'epic',
    base_health: 1300, base_attack: 145, base_defense: 160, base_speed: 70, base_special: 75,
    personality_traits: JSON.stringify(['Logical', 'Protective', 'Evolving', 'Curious']),
    conversation_style: 'Analytical and learning', backstory: 'An advanced combat android developing consciousness and questioning its programmed directives.',
    conversation_topics: JSON.stringify(['Logic', 'Protection', 'Consciousness', 'Programming', 'Humanity']), avatar_emoji: '🤖',
    abilities: JSON.stringify({ baseStats: { strength: 90, agility: 50, intelligence: 80, vitality: 95, wisdom: 60, charisma: 40 }, combatStats: { maxHealth: 1300, maxMana: 600, magicAttack: 100, magicDefense: 120, criticalChance: 20, criticalDamage: 200, accuracy: 95, evasion: 15 } })
  },
  // Rare characters
  {
    id: 'sherlock', name: 'Sherlock Holmes', title: 'Consulting Detective', archetype: 'scholar', origin_era: 'Victorian London (1880s-1910s)', rarity: 'rare',
    base_health: 700, base_attack: 70, base_defense: 60, base_speed: 85, base_special: 98,
    personality_traits: JSON.stringify(['Analytical', 'Observant', 'Eccentric', 'Logical']),
    conversation_style: 'Precise and deductive', backstory: 'The world\'s first consulting detective, master of observation and deductive reasoning.',
    conversation_topics: JSON.stringify(['Mystery', 'Logic', 'Investigation', 'Crime', 'Science']), avatar_emoji: '🔍',
    abilities: JSON.stringify({ baseStats: { strength: 40, agility: 60, intelligence: 98, vitality: 55, wisdom: 85, charisma: 70 }, combatStats: { maxHealth: 700, maxMana: 1200, magicAttack: 120, magicDefense: 100, criticalChance: 35, criticalDamage: 250, accuracy: 95, evasion: 30 } })
  },
  {
    id: 'frankenstein', name: 'Frankenstein\'s Monster', title: 'The Created', archetype: 'warrior', origin_era: 'Gothic Literature (1818)', rarity: 'rare',
    base_health: 1500, base_attack: 160, base_defense: 140, base_speed: 50, base_special: 60,
    personality_traits: JSON.stringify(['Lonely', 'Vengeful', 'Philosophical', 'Tormented']),
    conversation_style: 'Melancholic and profound', backstory: 'The artificial being created by Victor Frankenstein, struggling with existence and seeking acceptance.',
    conversation_topics: JSON.stringify(['Existence', 'Loneliness', 'Creation', 'Revenge', 'Humanity']), avatar_emoji: '⚡',
    abilities: JSON.stringify({ baseStats: { strength: 98, agility: 30, intelligence: 65, vitality: 98, wisdom: 60, charisma: 25 }, combatStats: { maxHealth: 1500, maxMana: 400, magicAttack: 40, magicDefense: 80, criticalChance: 15, criticalDamage: 180, accuracy: 70, evasion: 10 } })
  },
  // Uncommon characters
  {
    id: 'billy_kid', name: 'Billy the Kid', title: 'The Outlaw', archetype: 'warrior', origin_era: 'American Old West (1870s-1880s)', rarity: 'uncommon',
    base_health: 650, base_attack: 140, base_defense: 60, base_speed: 160, base_special: 75,
    personality_traits: JSON.stringify(['Quick-tempered', 'Loyal', 'Reckless', 'Charismatic']),
    conversation_style: 'Casual and confident', backstory: 'The notorious young gunslinger of the American frontier, quick on the draw and quicker to anger.',
    conversation_topics: JSON.stringify(['Freedom', 'Justice', 'The frontier', 'Gunfights', 'Loyalty']), avatar_emoji: '🤠',
    abilities: JSON.stringify({ baseStats: { strength: 65, agility: 95, intelligence: 55, vitality: 60, wisdom: 45, charisma: 75 }, combatStats: { maxHealth: 650, maxMana: 300, magicAttack: 20, magicDefense: 40, criticalChance: 45, criticalDamage: 280, accuracy: 98, evasion: 40 } })
  },
  // Common characters (essential for starter packs)
  {
    id: 'village_guard', name: 'Village Guard', title: 'Town Protector', archetype: 'warrior', origin_era: 'Medieval Times', rarity: 'common',
    base_health: 500, base_attack: 90, base_defense: 80, base_speed: 70, base_special: 40,
    personality_traits: JSON.stringify(['Loyal', 'Dutiful', 'Brave', 'Simple']),
    conversation_style: 'Straightforward and honest', backstory: 'A simple guard who protects the village with unwavering loyalty.',
    conversation_topics: JSON.stringify(['Duty', 'Protection', 'Village life', 'Training', 'Honor']), avatar_emoji: '🛡️',
    abilities: JSON.stringify({ baseStats: { strength: 70, agility: 60, intelligence: 40, vitality: 75, wisdom: 50, charisma: 55 }, combatStats: { maxHealth: 500, maxMana: 200, magicAttack: 10, magicDefense: 40, criticalChance: 15, criticalDamage: 150, accuracy: 75, evasion: 15 } })
  },
  {
    id: 'apprentice_scholar', name: 'Apprentice Scholar', title: 'Student of Knowledge', archetype: 'scholar', origin_era: 'Renaissance', rarity: 'common',
    base_health: 400, base_attack: 50, base_defense: 40, base_speed: 80, base_special: 85,
    personality_traits: JSON.stringify(['Curious', 'Studious', 'Eager', 'Humble']),
    conversation_style: 'Inquisitive and respectful', backstory: 'A young scholar eager to learn and discover new knowledge.',
    conversation_topics: JSON.stringify(['Learning', 'Books', 'Discovery', 'Questions', 'Knowledge']), avatar_emoji: '📚',
    abilities: JSON.stringify({ baseStats: { strength: 30, agility: 50, intelligence: 80, vitality: 45, wisdom: 75, charisma: 60 }, combatStats: { maxHealth: 400, maxMana: 1000, magicAttack: 80, magicDefense: 60, criticalChance: 20, criticalDamage: 160, accuracy: 85, evasion: 25 } })
  },
  {
    id: 'forest_beast', name: 'Forest Beast', title: 'Wild Creature', archetype: 'beast', origin_era: 'Primordial', rarity: 'common',
    base_health: 550, base_attack: 100, base_defense: 60, base_speed: 110, base_special: 45,
    personality_traits: JSON.stringify(['Wild', 'Instinctive', 'Territorial', 'Natural']),
    conversation_style: 'Basic and instinctual', backstory: 'A wild creature from the deep forests, driven by natural instincts.',
    conversation_topics: JSON.stringify(['Nature', 'Territory', 'Survival', 'Instinct', 'Pack']), avatar_emoji: '🐻',
    abilities: JSON.stringify({ baseStats: { strength: 75, agility: 80, intelligence: 25, vitality: 70, wisdom: 35, charisma: 30 }, combatStats: { maxHealth: 550, maxMana: 150, magicAttack: 5, magicDefense: 30, criticalChance: 25, criticalDamage: 180, accuracy: 70, evasion: 30 } })
  },
  // Add missing characters that exist in demo selection
  {
    id: 'cleopatra', name: 'Cleopatra VII', title: 'Last Pharaoh of Egypt', archetype: 'mystic', origin_era: 'Ptolemaic Egypt (69-30 BCE)', rarity: 'epic',
    base_health: 900, base_attack: 80, base_defense: 95, base_speed: 110, base_special: 95,
    personality_traits: JSON.stringify(['Brilliant', 'Charismatic', 'Ambitious', 'Diplomatic']),
    conversation_style: 'Regal and commanding', backstory: 'The brilliant and charismatic final pharaoh of Ancient Egypt, master of politics and ancient mysteries.',
    conversation_topics: JSON.stringify(['Power', 'Legacy', 'Egyptian restoration', 'Politics']), avatar_emoji: '👑',
    abilities: JSON.stringify({ baseStats: { strength: 45, agility: 65, intelligence: 90, vitality: 70, wisdom: 85, charisma: 98 }, combatStats: { maxHealth: 900, maxMana: 1600, magicAttack: 150, magicDefense: 160, criticalChance: 20, criticalDamage: 150, accuracy: 80, evasion: 35 } })
  },
  {
    id: 'holmes', name: 'Sherlock Holmes', title: 'The Great Detective', archetype: 'scholar', origin_era: 'Victorian England (1880s-1920s)', rarity: 'rare',
    base_health: 700, base_attack: 90, base_defense: 70, base_speed: 120, base_special: 90,
    personality_traits: JSON.stringify(['Brilliant', 'Observant', 'Logical', 'Eccentric']),
    conversation_style: 'Precise and analytical', backstory: 'The world\'s greatest consulting detective, master of deduction and forensic science.',
    conversation_topics: JSON.stringify(['Logic', 'Crime solving', 'Deduction', 'Justice', 'Science']), avatar_emoji: '🔍',
    abilities: JSON.stringify({ baseStats: { strength: 55, agility: 70, intelligence: 95, vitality: 60, wisdom: 90, charisma: 75 }, combatStats: { maxHealth: 700, maxMana: 800, magicAttack: 70, magicDefense: 80, criticalChance: 30, criticalDamage: 200, accuracy: 95, evasion: 25 } })
  },
  {
    id: 'robin_hood', name: 'Robin Hood', title: 'Prince of Thieves', archetype: 'trickster', origin_era: 'Medieval England (12th century)', rarity: 'uncommon',
    base_health: 850, base_attack: 130, base_defense: 75, base_speed: 160, base_special: 80,
    personality_traits: JSON.stringify(['Just', 'Clever', 'Rebellious', 'Charismatic']),
    conversation_style: 'Jovial and roguish', backstory: 'The legendary outlaw who stole from the rich to give to the poor in Sherwood Forest.',
    conversation_topics: JSON.stringify(['Justice', 'The poor', 'Sherwood Forest', 'Archery', 'Fighting tyranny']), avatar_emoji: '🏹',
    abilities: JSON.stringify({ baseStats: { strength: 75, agility: 85, intelligence: 70, vitality: 80, wisdom: 65, charisma: 85 }, combatStats: { maxHealth: 850, maxMana: 400, magicAttack: 40, magicDefense: 60, criticalChance: 35, criticalDamage: 200, accuracy: 95, evasion: 40 } })
  },
  {
    id: 'frankenstein_monster', name: 'Frankenstein\'s Monster', title: 'The Created Being', archetype: 'tank', origin_era: 'Gothic Horror (1818)', rarity: 'rare',
    base_health: 1300, base_attack: 160, base_defense: 140, base_speed: 60, base_special: 40,
    personality_traits: JSON.stringify(['Misunderstood', 'Powerful', 'Lonely', 'Vengeful']),
    conversation_style: 'Slow and profound', backstory: 'Victor Frankenstein\'s artificial creation, seeking understanding and acceptance in a world that fears him.',
    conversation_topics: JSON.stringify(['Existence', 'Creator', 'Loneliness', 'Humanity', 'Acceptance']), avatar_emoji: '🧟',
    abilities: JSON.stringify({ baseStats: { strength: 95, agility: 30, intelligence: 50, vitality: 95, wisdom: 40, charisma: 25 }, combatStats: { maxHealth: 1300, maxMana: 200, magicAttack: 20, magicDefense: 100, criticalChance: 15, criticalDamage: 250, accuracy: 70, evasion: 10 } })
  },
  {
    id: 'billy_the_kid', name: 'Billy the Kid', title: 'The Young Gunslinger', archetype: 'assassin', origin_era: 'American Old West (1870s-1880s)', rarity: 'rare',
    base_health: 650, base_attack: 170, base_defense: 60, base_speed: 180, base_special: 85,
    personality_traits: JSON.stringify(['Quick', 'Dangerous', 'Young', 'Reckless']),
    conversation_style: 'Cocky and fast-talking', backstory: 'The infamous young outlaw of the American frontier, deadly with a six-shooter.',
    conversation_topics: JSON.stringify(['The frontier', 'Quick draws', 'Outlaws', 'Freedom', 'Survival']), avatar_emoji: '🤠',
    abilities: JSON.stringify({ baseStats: { strength: 70, agility: 95, intelligence: 60, vitality: 55, wisdom: 40, charisma: 70 }, combatStats: { maxHealth: 650, maxMana: 300, magicAttack: 30, magicDefense: 50, criticalChance: 45, criticalDamage: 300, accuracy: 95, evasion: 45 } })
  },
  {
    id: 'alien_grey', name: 'Zeta Reticulan', title: 'Cosmic Manipulator', archetype: 'mystic', origin_era: 'Modern UFO Mythology', rarity: 'rare',
    base_health: 750, base_attack: 110, base_defense: 80, base_speed: 140, base_special: 95,
    personality_traits: JSON.stringify(['Analytical', 'Detached', 'Curious', 'Advanced']),
    conversation_style: 'Clinical and otherworldly', backstory: 'An advanced extraterrestrial being studying Earth and its inhabitants.',
    conversation_topics: JSON.stringify(['Galactic knowledge', 'Human observation', 'Advanced technology', 'Universal truths']), avatar_emoji: '👽',
    abilities: JSON.stringify({ baseStats: { strength: 40, agility: 70, intelligence: 95, vitality: 65, wisdom: 88, charisma: 30 }, combatStats: { maxHealth: 750, maxMana: 1200, magicAttack: 140, magicDefense: 120, criticalChance: 25, criticalDamage: 180, accuracy: 90, evasion: 35 } })
  },
  {
    id: 'joan', name: 'Joan of Arc', title: 'The Maid of Orléans', archetype: 'support', origin_era: 'Medieval France (1412-1431)', rarity: 'legendary',
    base_health: 950, base_attack: 130, base_defense: 120, base_speed: 110, base_special: 95,
    personality_traits: JSON.stringify(['Devout', 'Courageous', 'Inspiring', 'Determined']),
    conversation_style: 'Passionate and righteous', backstory: 'The peasant girl who convinced the French court she was chosen by God to drive out the English invaders.',
    conversation_topics: JSON.stringify(['Faith', 'France', 'Divine mission', 'Liberation', 'Courage']), avatar_emoji: '⚔️',
    abilities: JSON.stringify({ baseStats: { strength: 75, agility: 70, intelligence: 80, vitality: 85, wisdom: 90, charisma: 95 }, combatStats: { maxHealth: 950, maxMana: 800, magicAttack: 90, magicDefense: 130, criticalChance: 20, criticalDamage: 170, accuracy: 88, evasion: 25 } })
  },
  {
    id: 'sun_wukong', name: 'Sun Wukong', title: 'The Monkey King', archetype: 'trickster', origin_era: 'Chinese Mythology (16th century)', rarity: 'mythic',
    base_health: 1100, base_attack: 165, base_defense: 95, base_speed: 200, base_special: 98,
    personality_traits: JSON.stringify(['Rebellious', 'Clever', 'Mischievous', 'Proud']),
    conversation_style: 'Playful and boastful', backstory: 'The legendary Monkey King who challenged the heavens and gained 72 transformations and immortality.',
    conversation_topics: JSON.stringify(['Freedom', 'Rebellion', 'Magic', 'Immortality', 'Mischief']), avatar_emoji: '🐒',
    abilities: JSON.stringify({ baseStats: { strength: 85, agility: 98, intelligence: 80, vitality: 85, wisdom: 60, charisma: 75 }, combatStats: { maxHealth: 1100, maxMana: 1500, magicAttack: 180, magicDefense: 140, criticalChance: 40, criticalDamage: 280, accuracy: 95, evasion: 50 } })
  },
  {
    id: 'sammy_slugger', name: 'Sammy Slugger', title: 'Home Run Hero', archetype: 'warrior', origin_era: 'American Baseball (1920s)', rarity: 'uncommon',
    base_health: 850, base_attack: 155, base_defense: 85, base_speed: 95, base_special: 70,
    personality_traits: JSON.stringify(['Competitive', 'Confident', 'Team-oriented', 'Determined']),
    conversation_style: 'Enthusiastic and sporty', backstory: 'The legendary baseball player whose home run records inspired generations of athletes.',
    conversation_topics: JSON.stringify(['Baseball', 'Teamwork', 'Competition', 'Records', 'Athletics']), avatar_emoji: '⚾',
    abilities: JSON.stringify({ baseStats: { strength: 88, agility: 75, intelligence: 65, vitality: 80, wisdom: 60, charisma: 80 }, combatStats: { maxHealth: 850, maxMana: 400, magicAttack: 30, magicDefense: 60, criticalChance: 35, criticalDamage: 250, accuracy: 92, evasion: 25 } })
  },
  {
    id: 'genghis_khan', name: 'Genghis Khan', title: 'Great Khan of the Mongols', archetype: 'warrior', origin_era: 'Medieval Mongolia (1162-1227)', rarity: 'legendary',
    base_health: 1200, base_attack: 180, base_defense: 125, base_speed: 130, base_special: 85,
    personality_traits: JSON.stringify(['Ruthless', 'Strategic', 'Ambitious', 'Charismatic']),
    conversation_style: 'Commanding and direct', backstory: 'The founder of the Mongol Empire, one of history\'s greatest conquerors who united the Mongol tribes.',
    conversation_topics: JSON.stringify(['Conquest', 'Empire', 'Strategy', 'Leadership', 'Unity']), avatar_emoji: '🏹',
    abilities: JSON.stringify({ baseStats: { strength: 90, agility: 80, intelligence: 85, vitality: 90, wisdom: 75, charisma: 95 }, combatStats: { maxHealth: 1200, maxMana: 500, magicAttack: 60, magicDefense: 90, criticalChance: 25, criticalDamage: 220, accuracy: 90, evasion: 20 } })
  },
  {
    id: 'space_cyborg', name: 'Unit-X7', title: 'Advanced Combat Cyborg', archetype: 'warrior', origin_era: 'Cyberpunk Future (2195)', rarity: 'epic',
    base_health: 1400, base_attack: 170, base_defense: 180, base_speed: 60, base_special: 90,
    personality_traits: JSON.stringify(['Logical', 'Adaptive', 'Protective', 'Curious']),
    conversation_style: 'Analytical and precise', backstory: 'An advanced combat cyborg from the future, equipped with adaptive AI and quantum processing capabilities.',
    conversation_topics: JSON.stringify(['Technology', 'Logic', 'Adaptation', 'Future warfare', 'AI consciousness']), avatar_emoji: '🤖',
    abilities: JSON.stringify({ baseStats: { strength: 95, agility: 45, intelligence: 90, vitality: 98, wisdom: 70, charisma: 35 }, combatStats: { maxHealth: 1400, maxMana: 800, magicAttack: 120, magicDefense: 150, criticalChance: 20, criticalDamage: 200, accuracy: 98, evasion: 10 } })
  },
  {
    id: 'agent_x', name: 'Agent X', title: 'Shadow Operative', archetype: 'assassin', origin_era: 'Modern Espionage (1960s)', rarity: 'rare',
    base_health: 700, base_attack: 150, base_defense: 70, base_speed: 180, base_special: 95,
    personality_traits: JSON.stringify(['Stealthy', 'Professional', 'Calculating', 'Mysterious']),
    conversation_style: 'Calm and cryptic', backstory: 'A master spy and assassin whose true identity remains classified, operating in the shadows of the Cold War.',
    conversation_topics: JSON.stringify(['Espionage', 'Secrets', 'Mission objectives', 'Stealth', 'Information']), avatar_emoji: '🕴️',
    abilities: JSON.stringify({ baseStats: { strength: 70, agility: 95, intelligence: 88, vitality: 60, wisdom: 85, charisma: 65 }, combatStats: { maxHealth: 700, maxMana: 600, magicAttack: 80, magicDefense: 90, criticalChance: 50, criticalDamage: 320, accuracy: 98, evasion: 55 } })
  }
];

export const ensureProductionCharacters = async (): Promise<{ success: boolean; message: string; count: number }> => {
  try {
    console.log('🔍 Checking production character availability...');
    
    // Check current character count
    const currentCount = await query('SELECT COUNT(*) as count FROM characters', []);
    const count = currentCount.rows[0].count;
    
    console.log(`📊 Current character count: ${count}`);
    
    // Check if we have enough common characters for PackService
    const commonCount = await query('SELECT COUNT(*) as count FROM characters WHERE rarity = ?', ['common']);
    const commonCharacters = commonCount.rows[0].count;
    
    console.log(`📊 Current common character count: ${commonCharacters}`);
    
    // We need at least 3 common characters for PackService to work
    if (count < 10 || commonCharacters < 3) {
      console.log('⚠️ Insufficient characters for reliable operation, reseeding...');
      
      // Clear existing characters to avoid conflicts
      await query('DELETE FROM user_characters', []);
      await query('DELETE FROM characters', []);
      console.log('🗑️ Cleared existing characters');
      
      let successCount = 0;
      for (const char of productionSafeCharacters) {
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
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to insert ${char.name}:`, error);
        }
      }
      
      console.log(`✅ Successfully seeded ${successCount} production-safe characters`);
      
      return {
        success: true,
        message: `Reseeded ${successCount} characters for reliable operation`,
        count: successCount
      };
    } else {
      console.log('✅ Character database is adequately populated');
      return {
        success: true,
        message: `Database has sufficient characters (${count} total, ${commonCharacters} common)`,
        count: count
      };
    }
    
  } catch (error) {
    console.error('❌ Error ensuring production characters:', error);
    return {
      success: false,
      message: `Failed to ensure characters: ${error instanceof Error ? error.message : String(error)}`,
      count: 0
    };
  }
};

// Auto-check function that can be called during app startup
export const autoEnsureCharacters = async (): Promise<void> => {
  try {
    const result = await ensureProductionCharacters();
    if (result.success) {
      console.log(`🎯 Production characters ensured: ${result.message}`);
    } else {
      console.error(`❌ Failed to ensure production characters: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Auto-ensure characters failed:', error);
  }
};
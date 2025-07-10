// Comprehensive Character Database
// Full character stats, abilities, progression trees, and game data

import { CharacterExperience } from '../../../frontend/src/data/experience';
import { CharacterAbilities } from '../../../frontend/src/data/abilities';
import { CharacterSkills } from '../../../frontend/src/data/characterProgression';
import { Equipment } from '../../../frontend/src/data/equipment';
import { Item } from '../../../frontend/src/data/items';

export type CharacterArchetype = 
  | 'warrior' | 'mage' | 'assassin' | 'tank' | 'support' 
  | 'beast' | 'trickster' | 'mystic' | 'elementalist' | 'berserker' | 'scholar';

export type CharacterRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type StatType = 'strength' | 'agility' | 'intelligence' | 'vitality' | 'wisdom' | 'charisma';

export interface BaseStats {
  strength: number;      // Physical damage, carry capacity
  agility: number;       // Speed, dodge chance, critical hit
  intelligence: number;  // Mana, spell power, learning rate
  vitality: number;      // Health, stamina, resistance
  wisdom: number;        // Mana regen, experience gain
  charisma: number;      // Social abilities, leadership
}

export interface CombatStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  criticalChance: number;
  criticalDamage: number;
  accuracy: number;
  evasion: number;
}

export interface CharacterPersonality {
  traits: string[];           // Bold, Strategic, Honorable, etc.
  speechStyle: string;        // Formal, Casual, Poetic, Aggressive
  motivations: string[];      // Glory, Knowledge, Revenge, etc.
  fears: string[];           // Death, Failure, Betrayal, etc.
  relationships: {           // Bonds with other characters
    characterId: string;
    relationship: 'ally' | 'rival' | 'mentor' | 'student' | 'enemy' | 'neutral';
    strength: number;        // -100 to 100
    history: string;
  }[];
}

export interface ProgressionTree {
  branches: {
    name: string;
    description: string;
    requirements: {
      level?: number;
      stats?: Partial<BaseStats>;
      completedNodes?: string[];
    };
    nodes: ProgressionNode[];
  }[];
}

export interface ProgressionNode {
  id: string;
  name: string;
  description: string;
  type: 'stat' | 'ability' | 'passive' | 'special';
  requirements: {
    level: number;
    points: number;
    prerequisiteNodes?: string[];
  };
  rewards: {
    stats?: Partial<BaseStats>;
    abilities?: string[];
    passives?: string[];
    unlocks?: string[];
  };
  position: { x: number; y: number }; // For tree visualization
  isUnlocked: boolean;
  isActive: boolean;
}

export interface Character {
  // Basic Info
  id: string;
  name: string;
  title?: string;
  avatar: string;
  archetype: CharacterArchetype;
  rarity: CharacterRarity;
  
  // Lore & Personality
  description: string;
  historicalPeriod: string;
  mythology: string;
  personality: CharacterPersonality;
  
  // Core Stats
  level: number;
  baseStats: BaseStats;
  combatStats: CombatStats;
  statPoints: number;
  
  // Progression
  experience: CharacterExperience;
  skills: CharacterSkills;
  abilities: CharacterAbilities;
  progressionTree: ProgressionTree;
  
  // Equipment & Items
  equippedItems: {
    weapon?: Equipment;
    armor?: Equipment;
    accessory?: Equipment;
  };
  inventory: Item[];
  
  // Unlocks & Achievements
  unlockedContent: string[];
  achievements: string[];
  
  // Game Mechanics
  trainingLevel: number;        // 0-100, affects gameplan adherence and learning rate
  bondLevel: number;            // 0-100, relationship with player
  fatigue: number;              // 0-100, affects performance
  lastTrainingDate?: Date;
  
  // Psychology Stats - determines mental state and team dynamics
  psychStats: {
    training: number;           // 0-100, how well they follow instructions
    teamPlayer: number;         // 0-100, how well they work with others
    ego: number;               // 0-100, how arrogant/self-important they are
    mentalHealth: number;      // 0-100, psychological stability
    communication: number;     // 0-100, how well they express themselves
  };
  
  // Battle AI
  battleAI: {
    aggression: number;         // 0-100
    defensiveness: number;      // 0-100
    riskTaking: number;         // 0-100
    adaptability: number;       // 0-100
    preferredStrategies: string[];
  };
  
  // Customization
  customization: {
    outfit?: string;
    weaponSkin?: string;
    battleQuotes: string[];
    victoryAnimation?: string;
  };
}

// Character Templates
export const characterTemplates: Record<string, Omit<Character, 'id' | 'experience' | 'skills' | 'abilities'>> = {
  achilles: {
    name: 'Achilles',
    title: 'Hero of Troy',
    avatar: '⚔️',
    archetype: 'warrior',
    rarity: 'legendary',
    description: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
    historicalPeriod: 'Ancient Greece (1200 BCE)',
    mythology: 'Greek',
    personality: {
      traits: ['Honorable', 'Wrathful', 'Courageous', 'Prideful'],
      speechStyle: 'Noble and passionate',
      motivations: ['Glory', 'Honor', 'Revenge'],
      fears: ['Dishonor', 'Being forgotten'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 95,
      agility: 85,
      intelligence: 60,
      vitality: 90,
      wisdom: 45,
      charisma: 80
    },
    combatStats: {
      health: 1200,
      maxHealth: 1200,
      mana: 300,
      maxMana: 300,
      attack: 185,
      defense: 120,
      magicAttack: 50,
      magicDefense: 80,
      speed: 140,
      criticalChance: 25,
      criticalDamage: 200,
      accuracy: 90,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Wrath of Achilles',
          description: 'Channel legendary rage for devastating attacks',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'berserker_rage',
              name: 'Berserker Rage',
              description: 'Attack power increases as health decreases',
              type: 'passive',
              requirements: { level: 5, points: 1 },
              rewards: { passives: ['berserker_rage'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training', 'combat_academy'],
    achievements: [],
    trainingLevel: 75,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 75,        // Follows honor code but can be impulsive
      teamPlayer: 60,      // Works with others but wants to be the hero
      ego: 85,            // Very proud, knows he's the greatest warrior
      mentalHealth: 70,    // Generally stable but prone to rage
      communication: 75    // Noble and inspiring speech
    },
    battleAI: {
      aggression: 90,
      defensiveness: 30,
      riskTaking: 80,
      adaptability: 60,
      preferredStrategies: ['frontal_assault', 'berserker_rush', 'honor_duel']
    },
    customization: {
      battleQuotes: [
        'For glory and honor!',
        'Face me if you dare!',
        'The gods smile upon me!',
        'None can stand against my might!'
      ]
    }
  },

  merlin: {
    name: 'Merlin',
    title: 'Archmage of Camelot',
    avatar: '🔮',
    archetype: 'mage',
    rarity: 'mythic',
    description: 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
    historicalPeriod: 'Medieval Britain (5th-6th century)',
    mythology: 'Arthurian Legend',
    personality: {
      traits: ['Wise', 'Mysterious', 'Patient', 'Calculating'],
      speechStyle: 'Archaic and profound',
      motivations: ['Knowledge', 'Balance', 'Protecting the realm'],
      fears: ['Chaos', 'The corruption of magic'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 30,
      agility: 50,
      intelligence: 98,
      vitality: 70,
      wisdom: 95,
      charisma: 85
    },
    combatStats: {
      health: 800,
      maxHealth: 800,
      mana: 2000,
      maxMana: 2000,
      attack: 60,
      defense: 80,
      magicAttack: 200,
      magicDefense: 180,
      speed: 90,
      criticalChance: 15,
      criticalDamage: 300,
      accuracy: 95,
      evasion: 25
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Elemental Mastery',
          description: 'Command the primal forces of nature',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'fireball',
              name: 'Fireball',
              description: 'Launch devastating fire projectiles',
              type: 'ability',
              requirements: { level: 3, points: 1 },
              rewards: { abilities: ['fireball'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['arcane_library', 'elemental_studies'],
    achievements: [],
    trainingLevel: 90,
    bondLevel: 60,
    fatigue: 0,
    psychStats: {
      training: 90,        // Highly disciplined magical training
      teamPlayer: 85,      // Wise mentor, guides others well
      ego: 40,            // Humble despite great power
      mentalHealth: 90,    // Ancient wisdom provides stability
      communication: 95    // Articulate teacher and advisor
    },
    battleAI: {
      aggression: 40,
      defensiveness: 80,
      riskTaking: 30,
      adaptability: 95,
      preferredStrategies: ['spell_weaving', 'defensive_barriers', 'elemental_control']
    },
    customization: {
      battleQuotes: [
        'The ancient words have power...',
        'Magic flows through all things',
        'By the old ways, I command thee!',
        'Witness the might of ages past'
      ]
    }
  },


  fenrir: {
    name: 'Fenrir',
    title: 'The Great Wolf',
    avatar: '🐺',
    archetype: 'beast',
    rarity: 'legendary',
    description: 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
    historicalPeriod: 'Norse Age (8th-11th century)',
    mythology: 'Norse',
    personality: {
      traits: ['Savage', 'Loyal', 'Vengeful', 'Primal'],
      speechStyle: 'Growling and direct',
      motivations: ['Freedom', 'Vengeance', 'Pack loyalty'],
      fears: ['Chains', 'Betrayal'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 90,
      agility: 95,
      intelligence: 40,
      vitality: 95,
      wisdom: 30,
      charisma: 50
    },
    combatStats: {
      health: 1400,
      maxHealth: 1400,
      mana: 200,
      maxMana: 200,
      attack: 170,
      defense: 100,
      magicAttack: 30,
      magicDefense: 60,
      speed: 180,
      criticalChance: 30,
      criticalDamage: 220,
      accuracy: 88,
      evasion: 30
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Primal Hunt',
          description: 'Unleash the savage hunter within',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'pack_leader',
              name: 'Pack Leader',
              description: 'Summon spectral wolves to fight alongside you',
              type: 'ability',
              requirements: { level: 6, points: 1 },
              rewards: { abilities: ['pack_leader'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['wild_training', 'beast_mastery'],
    achievements: [],
    trainingLevel: 45,
    bondLevel: 70,
    fatigue: 0,
    psychStats: {
      training: 45,        // Wild nature resists instruction
      teamPlayer: 30,      // Lone wolf mentality
      ego: 70,            // Proud beast, knows his strength
      mentalHealth: 60,    // Beast instincts create instability
      communication: 25    // More growls than words
    },
    battleAI: {
      aggression: 95,
      defensiveness: 20,
      riskTaking: 85,
      adaptability: 40,
      preferredStrategies: ['savage_rush', 'pack_tactics', 'intimidation']
    },
    customization: {
      battleQuotes: [
        '*Fierce growling*',
        'The hunt begins!',
        '*Howls menacingly*',
        'You smell of fear...'
      ]
    }
  },

  cleopatra: {
    name: 'Cleopatra VII',
    title: 'Last Pharaoh of Egypt',
    avatar: '👑',
    archetype: 'mystic',
    rarity: 'epic',
    description: 'The brilliant and charismatic final pharaoh of Ancient Egypt, master of politics and ancient mysteries.',
    historicalPeriod: 'Ptolemaic Egypt (69-30 BCE)',
    mythology: 'Egyptian',
    personality: {
      traits: ['Brilliant', 'Charismatic', 'Ambitious', 'Diplomatic'],
      speechStyle: 'Regal and commanding',
      motivations: ['Power', 'Legacy', 'Egyptian restoration'],
      fears: ['Defeat', 'Being forgotten'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 45,
      agility: 65,
      intelligence: 90,
      vitality: 70,
      wisdom: 85,
      charisma: 98
    },
    combatStats: {
      health: 900,
      maxHealth: 900,
      mana: 1600,
      maxMana: 1600,
      attack: 80,
      defense: 95,
      magicAttack: 150,
      magicDefense: 160,
      speed: 110,
      criticalChance: 20,
      criticalDamage: 150,
      accuracy: 80,
      evasion: 35
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Royal Authority',
          description: 'Command through divine right and political mastery',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'divine_mandate',
              name: 'Divine Mandate',
              description: 'Inspire allies and demoralize enemies with royal presence',
              type: 'ability',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['divine_mandate'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['royal_court', 'diplomatic_studies'],
    achievements: [],
    trainingLevel: 80,
    bondLevel: 55,
    fatigue: 0,
    psychStats: {
      training: 80,        // Disciplined royal education
      teamPlayer: 75,      // Skilled diplomat and leader
      ego: 95,            // Supreme confidence as pharaoh
      mentalHealth: 85,    // Royal composure and stability
      communication: 95    // Master of rhetoric and persuasion
    },
    battleAI: {
      aggression: 50,
      defensiveness: 70,
      riskTaking: 60,
      adaptability: 85,
      preferredStrategies: ['strategic_planning', 'diplomatic_solutions', 'resource_manipulation']
    },
    customization: {
      battleQuotes: [
        'I am the daughter of Ra!',
        'Egypt\'s glory shall not fade',
        'Bow before the true pharaoh',
        'The gods favor the worthy'
      ]
    }
  },

  // === NEW LEGENDARY CHARACTERS ===

  holmes: {
    name: 'Sherlock Holmes',
    title: 'Victorian Detective',
    avatar: '🕵️',
    archetype: 'mystic',
    rarity: 'legendary',
    description: "The world's most brilliant detective, known for unmatched deductive reasoning and emotional detachment. Views the world as a grand puzzle.",
    historicalPeriod: 'Victorian England (1880s-1910s)',
    mythology: 'Classic Literature',
    personality: {
      traits: ['Analytical', 'Aloof', 'Obsessive', 'Eccentric'],
      speechStyle: 'Precise, logical, occasionally patronizing',
      motivations: ['Solving mysteries', 'Intellectual superiority', 'Outwitting rivals'],
      fears: ['Failure to solve a case', 'Emotional vulnerability'],
      relationships: [
        { characterId: 'dracula', relationship: 'rival', strength: -80 },
        { characterId: 'joan', relationship: 'ally', strength: 60 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 45,
      agility: 65,
      intelligence: 98,
      vitality: 60,
      wisdom: 90,
      charisma: 65
    },
    combatStats: {
      health: 900,
      maxHealth: 900,
      mana: 600,
      maxMana: 600,
      attack: 90,
      defense: 80,
      magicAttack: 140,
      magicDefense: 120,
      speed: 140,
      criticalChance: 25,
      criticalDamage: 180,
      accuracy: 95,
      evasion: 25
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Mastermind Branch',
          description: 'Unlocks deductive, manipulative, and counter-espionage abilities',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'deductive_gambit',
              name: 'Deductive Gambit',
              description: 'Exposes enemy weaknesses, lowering defense for 3 turns.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['deductive_gambit'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 90,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 85,        // Follows logical deduction but can be stubborn
      teamPlayer: 45,      // Prefers working alone, finds others inefficient
      ego: 90,            // Supremely confident in his abilities
      mentalHealth: 75,    // Generally stable but obsessive
      communication: 60    // Precise but can be condescending
    },
    battleAI: {
      aggression: 35,
      defensiveness: 70,
      riskTaking: 25,
      adaptability: 90,
      preferredStrategies: ['counter', 'debunk', 'exploit_weakness']
    },
    customization: {
      battleQuotes: [
        'Elementary, my dear adversary.',
        'Let us see if your logic withstands scrutiny.',
        'A defensive maneuver. Expected.',
        'Checkmate, in three moves.'
      ]
    }
  },

  dracula: {
    name: 'Count Dracula',
    title: 'Lord of Vampires',
    avatar: '🧛',
    archetype: 'mystic',
    rarity: 'legendary',
    description: "The immortal vampire lord; master of shadows and seduction. Hunts for dominance and eternal night.",
    historicalPeriod: 'Transylvania, 15th-19th c.',
    mythology: 'Eastern European folklore',
    personality: {
      traits: ['Charismatic', 'Cruel', 'Cunning', 'Seductive'],
      speechStyle: 'Formal, seductive, chilling',
      motivations: ['Dominance', 'Immortality', 'Conquest'],
      fears: ['Sunlight', 'Oblivion', 'Holy artifacts'],
      relationships: [
        { characterId: 'joan', relationship: 'enemy', strength: -95 },
        { characterId: 'holmes', relationship: 'rival', strength: -80 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 90,
      agility: 90,
      intelligence: 85,
      vitality: 95,
      wisdom: 70,
      charisma: 100
    },
    combatStats: {
      health: 1400,
      maxHealth: 1400,
      mana: 700,
      maxMana: 700,
      attack: 180,
      defense: 100,
      magicAttack: 160,
      magicDefense: 90,
      speed: 130,
      criticalChance: 20,
      criticalDamage: 225,
      accuracy: 90,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Vampiric Ascendance',
          description: 'Unlocks blood magic, transformation, and enthrallment powers.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'blood_drain',
              name: 'Blood Drain',
              description: 'Drains health from enemies to heal self.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['blood_drain'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 85,
    bondLevel: 30,
    fatigue: 0,
    psychStats: {
      training: 65,        // Ancient intellect can adapt when motivated
      teamPlayer: 20,      // Supremacist, sees others as food/tools
      ego: 95,            // Immortal lord, superior to all
      mentalHealth: 60,    // Centuries of existence, some instability
      communication: 85    // Charismatic and seductive
    },
    battleAI: {
      aggression: 85,
      defensiveness: 50,
      riskTaking: 80,
      adaptability: 65,
      preferredStrategies: ['lifesteal', 'debuff', 'strike_from_shadows']
    },
    customization: {
      battleQuotes: [
        'You cannot kill what is already dead.',
        'My thirst is eternal.',
        'Pathetic resistance.',
        'I command the night!'
      ]
    }
  },

  joan: {
    name: 'Joan of Arc',
    title: 'Holy Warrior',
    avatar: '⚔️',
    archetype: 'warrior',
    rarity: 'legendary',
    description: "The divinely inspired maiden general who united armies with charisma and faith. Guided by visions to defy all odds.",
    historicalPeriod: 'France, 1412-1431',
    mythology: 'Christian/Saint',
    personality: {
      traits: ['Devout', 'Inspiring', 'Stubborn', 'Brave'],
      speechStyle: 'Fervent, uplifting, sometimes naive',
      motivations: ['Divine mission', 'Liberation', 'Faith'],
      fears: ['Abandoning her cause', 'Letting others down'],
      relationships: [
        { characterId: 'dracula', relationship: 'enemy', strength: -95 },
        { characterId: 'holmes', relationship: 'ally', strength: 60 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 80,
      agility: 70,
      intelligence: 75,
      vitality: 100,
      wisdom: 85,
      charisma: 95
    },
    combatStats: {
      health: 1500,
      maxHealth: 1500,
      mana: 600,
      maxMana: 600,
      attack: 120,
      defense: 130,
      magicAttack: 110,
      magicDefense: 140,
      speed: 110,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 85,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Divine Inspiration',
          description: 'Unlocks faith-based buffs, leadership powers, and holy attacks.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'holy_aegis',
              name: 'Holy Aegis',
              description: 'Shields entire team from damage for 1 turn.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['holy_aegis'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 95,
    bondLevel: 65,
    fatigue: 0,
    psychStats: {
      training: 95,        // Divinely inspired discipline
      teamPlayer: 90,      // Natural born leader, rallies others
      ego: 30,            // Humble servant of higher purpose
      mentalHealth: 85,    // Faith provides stability
      communication: 80    // Inspiring and uplifting
    },
    battleAI: {
      aggression: 70,
      defensiveness: 80,
      riskTaking: 40,
      adaptability: 80,
      preferredStrategies: ['buff_allies', 'protect', 'divine_strike']
    },
    customization: {
      battleQuotes: [
        'For France and for God!',
        'No evil shall stand before us.',
        'Hold the line, comrades!',
        'The light guides my hand.'
      ]
    }
  },

  frankenstein_monster: {
    name: "Frankenstein's Monster",
    title: 'Gothic Abomination',
    avatar: '🧟',
    archetype: 'tank',
    rarity: 'legendary',
    description: 'A being stitched together from the dead, desperate for belonging but feared by all. Wields immense strength and tragic empathy.',
    historicalPeriod: '19th-century Europe',
    mythology: 'Gothic Horror',
    personality: {
      traits: ['Tragic', 'Lonely', 'Gentle (when calm)', 'Rageful (when hurt)'],
      speechStyle: 'Halting, mournful, honest',
      motivations: ['Acceptance', 'Freedom', 'Protection (of friends)'],
      fears: ['Rejection', 'Fire', 'Hurting innocents'],
      relationships: [
        { characterId: 'dracula', relationship: 'enemy', strength: -60 },
        { characterId: 'joan', relationship: 'ally', strength: 40 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 100,
      agility: 30,
      intelligence: 65,
      vitality: 120,
      wisdom: 60,
      charisma: 35
    },
    combatStats: {
      health: 1550,
      maxHealth: 1550,
      mana: 200,
      maxMana: 200,
      attack: 200,
      defense: 140,
      magicAttack: 40,
      magicDefense: 60,
      speed: 80,
      criticalChance: 8,
      criticalDamage: 150,
      accuracy: 75,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Rage Unleashed',
          description: 'When damaged, unlocks devastating attacks and self-heal.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'fury_smash',
              name: 'Fury Smash',
              description: 'Deals massive damage but stuns self for 1 turn.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['fury_smash'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 35,
    fatigue: 0,
    psychStats: {
      training: 55,        // Tragic past makes him resistant to orders
      teamPlayer: 70,      // Wants to protect others despite rejection
      ego: 20,            // Low self-worth, sees self as monster
      mentalHealth: 45,    // Deep psychological trauma
      communication: 40    // Struggles to express himself clearly
    },
    battleAI: {
      aggression: 65,
      defensiveness: 85,
      riskTaking: 30,
      adaptability: 45,
      preferredStrategies: ['protect_allies', 'counterattack', 'endure']
    },
    customization: {
      battleQuotes: [
        'Why do you hate me?',
        'I will defend you...',
        'No more pain!',
        'This ends now!'
      ]
    }
  },

  sun_wukong: {
    name: 'Sun Wukong',
    title: 'Monkey King',
    avatar: '🐒',
    archetype: 'trickster',
    rarity: 'mythic',
    description: 'The immortal Monkey King—master of chaos, transformation, and staff-fu. Unpredictable, loyal, and proud.',
    historicalPeriod: 'Ancient China',
    mythology: 'Chinese Mythology (Journey to the West)',
    personality: {
      traits: ['Playful', 'Rebellious', 'Loyal', 'Mischievous'],
      speechStyle: 'Boastful, witty, full of wordplay',
      motivations: ['Freedom', 'Adventure', 'Proving worth'],
      fears: ['Enslavement', 'Boredom'],
      relationships: [
        { characterId: 'merlin', relationship: 'rival', strength: -60 },
        { characterId: 'achilles', relationship: 'ally', strength: 30 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 80,
      agility: 100,
      intelligence: 85,
      vitality: 80,
      wisdom: 75,
      charisma: 65
    },
    combatStats: {
      health: 1100,
      maxHealth: 1100,
      mana: 800,
      maxMana: 800,
      attack: 120,
      defense: 85,
      magicAttack: 180,
      magicDefense: 110,
      speed: 160,
      criticalChance: 30,
      criticalDamage: 180,
      accuracy: 90,
      evasion: 35
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Chaos Incarnate',
          description: 'Unlocks transformation, illusions, and mobility powers.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'seventy_two_forms',
              name: '72 Transformations',
              description: 'Transform into animals/objects for evasion, stealth, or unique attacks.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['seventy_two_forms'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 90,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 65,        // Rebellious nature resists authority
      teamPlayer: 80,      // Loyal to friends, fights for others
      ego: 70,            // Confident trickster, knows he's clever
      mentalHealth: 85,    // Immortal stability with playful nature
      communication: 90    // Master of wordplay and wit
    },
    battleAI: {
      aggression: 60,
      defensiveness: 40,
      riskTaking: 90,
      adaptability: 100,
      preferredStrategies: ['confuse', 'surprise', 'multi_hit_combos']
    },
    customization: {
      battleQuotes: [
        'Catch me if you can!',
        'You call *that* an attack?',
        'Now you see me, now you—don\'t!',
        'Monkey magic, incoming!'
      ]
    }
  },

  sammy_slugger: {
    name: 'Sammy Slugger',
    title: 'Hard-Boiled Detective',
    avatar: '🕶️',
    archetype: 'assassin',
    rarity: 'epic',
    description: 'Once the city\'s toughest cop, now its most relentless private eye. Sammy\'s fists are as quick as his wit.',
    historicalPeriod: '1920s America (Pulp Noir)',
    mythology: 'Pulp Fiction / Crime Legend',
    personality: {
      traits: ['Cynical', 'Resourceful', 'Dogged', 'Loyal', 'World-weary'],
      speechStyle: 'Gritty, sarcastic, full of metaphors',
      motivations: ['Justice', 'Redemption', 'Keeping streets safe', 'Loyalty to friends'],
      fears: ['Betrayal', 'Letting villain escape', 'Not living up to code'],
      relationships: [
        { characterId: 'holmes', relationship: 'rival', strength: -55 },
        { characterId: 'dracula', relationship: 'enemy', strength: -30 },
        { characterId: 'robin_hood', relationship: 'ally', strength: 25 },
        { characterId: 'billy_the_kid', relationship: 'ally', strength: 20 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 70,
      agility: 70,
      intelligence: 80,
      vitality: 85,
      wisdom: 60,
      charisma: 75
    },
    combatStats: {
      health: 1200,
      maxHealth: 1200,
      mana: 400,
      maxMana: 400,
      attack: 110,
      defense: 90,
      magicAttack: 60,
      magicDefense: 70,
      speed: 100,
      criticalChance: 15,
      criticalDamage: 170,
      accuracy: 90,
      evasion: 25
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Noir Legend',
          description: 'Unlocks detective skills, stuns, and street justice abilities',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'knockout_punch',
              name: 'Knockout Punch',
              description: 'Stuns enemy for 1 turn, bonus damage vs criminal/monster',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['knockout_punch'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 75,
    bondLevel: 35,
    fatigue: 0,
    psychStats: {
      training: 80,        // Street-smart discipline
      teamPlayer: 65,      // Works well with honest cops/allies
      ego: 60,            // Confident but not arrogant
      mentalHealth: 70,    // Cynical but stable
      communication: 75    // Gritty eloquence and street wisdom
    },
    battleAI: {
      aggression: 55,
      defensiveness: 50,
      riskTaking: 55,
      adaptability: 70,
      preferredStrategies: ['stun', 'reveal', 'counterattack']
    },
    customization: {
      battleQuotes: [
        'Let\'s see you dodge this, sunshine.',
        'There\'s two kinds of crooks: the caught, and the soon-to-be.',
        'I got a nose for trouble—and you reek.',
        'Sometimes the punchline hits first.'
      ]
    }
  },

  billy_the_kid: {
    name: 'Billy the Kid',
    title: 'Wild West Outlaw',
    avatar: '🤠',
    archetype: 'assassin',
    rarity: 'epic',
    description: 'The most notorious gunslinger of the frontier. Quick on the draw, born to run, Billy plays by his own rules.',
    historicalPeriod: 'American Old West, 1859–1881',
    mythology: 'American Legend',
    personality: {
      traits: ['Reckless', 'Charismatic', 'Defiant', 'Loyal to friends', 'Restless'],
      speechStyle: 'Laid-back, cocky, with a wry grin',
      motivations: ['Freedom', 'Fame', 'Living fast', 'Helping outcasts'],
      fears: ['Capture', 'Dying forgotten', 'Betrayal'],
      relationships: [
        { characterId: 'robin_hood', relationship: 'ally', strength: 40 },
        { characterId: 'achilles', relationship: 'rival', strength: -30 },
        { characterId: 'sammy_slugger', relationship: 'ally', strength: 20 },
        { characterId: 'dracula', relationship: 'enemy', strength: -60 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 75,
      agility: 95,
      intelligence: 60,
      vitality: 80,
      wisdom: 50,
      charisma: 80
    },
    combatStats: {
      health: 1050,
      maxHealth: 1050,
      mana: 350,
      maxMana: 350,
      attack: 130,
      defense: 70,
      magicAttack: 45,
      magicDefense: 60,
      speed: 155,
      criticalChance: 28,
      criticalDamage: 220,
      accuracy: 93,
      evasion: 30
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Legend of the Frontier',
          description: 'Unlocks gunslinger skills, speed boosts, and outlaw tactics',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'deadeye_draw',
              name: 'Deadeye Draw',
              description: 'Acts first this turn, guaranteed crit if HP > 50%',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['deadeye_draw'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 70,
    bondLevel: 45,
    fatigue: 0,
    psychStats: {
      training: 55,        // Outlaw resists formal authority
      teamPlayer: 75,      // Loyal to gang/friends
      ego: 80,            // Cocky gunslinger confidence
      mentalHealth: 65,    // Wild lifestyle creates some instability
      communication: 70    // Charming outlaw charisma
    },
    battleAI: {
      aggression: 75,
      defensiveness: 40,
      riskTaking: 95,
      adaptability: 80,
      preferredStrategies: ['quick_strike', 'evade', 'chain_kill']
    },
    customization: {
      battleQuotes: [
        'Quick or dead, partner.',
        'This town ain\'t big enough for both of us.',
        'Outdraw this!',
        'They\'ll write songs about this shot.'
      ]
    }
  },

  genghis_khan: {
    name: 'Genghis Khan',
    title: 'Scourge of Empires',
    avatar: '🏹',
    archetype: 'warrior',
    rarity: 'mythic',
    description: 'The supreme conqueror who united the Mongol tribes and forged the largest contiguous land empire in history.',
    historicalPeriod: 'Mongol Empire, 1162–1227',
    mythology: 'World History',
    personality: {
      traits: ['Ruthless', 'Strategic', 'Inspiring', 'Pragmatic', 'Domineering'],
      speechStyle: 'Commanding, clipped, but surprisingly charismatic',
      motivations: ['Conquest', 'Legacy', 'Unity', 'Testing strength against the world'],
      fears: ['Betrayal', 'Losing control', 'Legacy forgotten or divided'],
      relationships: [
        { characterId: 'achilles', relationship: 'rival', strength: -70 },
        { characterId: 'cleopatra', relationship: 'ally', strength: 40 },
        { characterId: 'billy_the_kid', relationship: 'rival', strength: -30 },
        { characterId: 'dracula', relationship: 'rival', strength: -25 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 95,
      agility: 80,
      intelligence: 85,
      vitality: 110,
      wisdom: 90,
      charisma: 88
    },
    combatStats: {
      health: 1500,
      maxHealth: 1500,
      mana: 500,
      maxMana: 500,
      attack: 170,
      defense: 110,
      magicAttack: 70,
      magicDefense: 100,
      speed: 135,
      criticalChance: 18,
      criticalDamage: 190,
      accuracy: 90,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Conqueror\'s Bloodline',
          description: 'Unlocks horde tactics, leadership buffs, and cavalry charges',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'thunderous_charge',
              name: 'Thunderous Charge',
              description: 'All allies attack together; team speed +20% for 1 turn',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['thunderous_charge'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 90,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 95,        // Supreme military discipline
      teamPlayer: 85,      // Excellent commander and strategist
      ego: 95,            // Knows he's the greatest conqueror
      mentalHealth: 90,    // Iron will and mental fortitude
      communication: 85    // Commanding presence and inspiration
    },
    battleAI: {
      aggression: 95,
      defensiveness: 70,
      riskTaking: 75,
      adaptability: 70,
      preferredStrategies: ['overwhelm', 'buff_team', 'decisive_strikes']
    },
    customization: {
      battleQuotes: [
        'Obey or be destroyed.',
        'Ride with me—conquer all!',
        'A single will unites a thousand blades.',
        'To defy me is to vanish.'
      ]
    }
  },

  space_cyborg: {
    name: 'Space Cyborg (Vega-X)',
    title: 'Galactic Mercenary',
    avatar: '🤖',
    archetype: 'tank',
    rarity: 'legendary',
    description: 'A genetically engineered, cybernetic bounty hunter forged for war and survival in the stars.',
    historicalPeriod: 'Far Future',
    mythology: 'Science Fiction',
    personality: {
      traits: ['Efficient', 'Calculating', 'Detached', 'Secretly curious', 'Loyal to those who prove themselves'],
      speechStyle: 'Concise, direct, robotic with flashes of personality',
      motivations: ['Perfection', 'Profit', 'Self-discovery', 'Finding a cause worth fighting for'],
      fears: ['Loss of control', 'Obsolescence', 'Being used'],
      relationships: [
        { characterId: 'alien_grey', relationship: 'ally', strength: 55 },
        { characterId: 'frankenstein_monster', relationship: 'rival', strength: -40 },
        { characterId: 'tesla', relationship: 'ally', strength: 30 },
        { characterId: 'genghis_khan', relationship: 'ally', strength: 20 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 95,
      agility: 80,
      intelligence: 75,
      vitality: 110,
      wisdom: 65,
      charisma: 40
    },
    combatStats: {
      health: 1400,
      maxHealth: 1400,
      mana: 350,
      maxMana: 350,
      attack: 170,
      defense: 120,
      magicAttack: 70,
      magicDefense: 70,
      speed: 120,
      criticalChance: 20,
      criticalDamage: 200,
      accuracy: 93,
      evasion: 18
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Cybernetic Overdrive',
          description: 'Unlocks tech abilities, nanite repair, and tactical systems',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'nanite_regeneration',
              name: 'Nanite Regeneration',
              description: 'Heal for 30% max HP over 3 turns, immune to poison/bleed/burn',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['nanite_regeneration'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 80,
    bondLevel: 25,
    fatigue: 0,
    psychStats: {
      training: 85,        // Cybernetic precision and efficiency
      teamPlayer: 40,      // Calculating, sees others as assets
      ego: 75,            // Superior technology breeds confidence
      mentalHealth: 80,    // Cybernetic stability with organic emotions
      communication: 35    // Direct but lacks warmth
    },
    battleAI: {
      aggression: 80,
      defensiveness: 75,
      riskTaking: 70,
      adaptability: 95,
      preferredStrategies: ['disable', 'burst', 'reposition']
    },
    customization: {
      battleQuotes: [
        'Target acquired. Outcome: inevitable.',
        'Upgrading threat assessment.',
        'Adapt or be deleted.',
        'Mission priority: self-preservation.'
      ]
    }
  },

  tesla: {
    name: 'Nikola Tesla',
    title: 'Electric Visionary',
    avatar: '⚡',
    archetype: 'elementalist',
    rarity: 'legendary',
    description: 'The mad genius who commands electricity and invention. A dreamer on the edge of science and magic.',
    historicalPeriod: '1856–1943',
    mythology: 'Science History/Futurism',
    personality: {
      traits: ['Visionary', 'Obsessive', 'Eccentric', 'Altruistic'],
      speechStyle: 'Fast, passionate, scattered',
      motivations: ['Discovery', 'Human progress', 'Recognition'],
      fears: ['Failure', 'Being forgotten'],
      relationships: [
        { characterId: 'merlin', relationship: 'rival', strength: -60 },
        { characterId: 'dracula', relationship: 'enemy', strength: -35 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 55,
      agility: 70,
      intelligence: 100,
      vitality: 65,
      wisdom: 90,
      charisma: 65
    },
    combatStats: {
      health: 950,
      maxHealth: 950,
      mana: 800,
      maxMana: 800,
      attack: 90,
      defense: 70,
      magicAttack: 200,
      magicDefense: 150,
      speed: 135,
      criticalChance: 23,
      criticalDamage: 170,
      accuracy: 95,
      evasion: 18
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Current of Genius',
          description: 'Unlocks electric, invention, and field-control powers.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'tesla_coil',
              name: 'Tesla Coil',
              description: 'Sets up a field that deals AoE lightning damage for 3 turns.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['tesla_coil'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 90,
    bondLevel: 45,
    fatigue: 0,
    psychStats: {
      training: 95,        // Genius-level learning and discipline
      teamPlayer: 60,      // Prefers solo work but can collaborate
      ego: 85,            // Knows he's a visionary genius
      mentalHealth: 70,    // Obsessive tendencies create some instability
      communication: 80    // Passionate about his inventions
    },
    battleAI: {
      aggression: 55,
      defensiveness: 65,
      riskTaking: 80,
      adaptability: 85,
      preferredStrategies: ['area_control', 'chain_damage', 'tech_boosts']
    },
    customization: {
      battleQuotes: [
        'Feel the spark of genius!',
        'I have not failed—just discovered your weakness.',
        'This invention will SHOCK you.',
        'Lightning is the handwriting of the gods.'
      ]
    }
  },

  alien_grey: {
    name: 'Zeta Reticulan',
    title: 'Cosmic Manipulator',
    avatar: '👽',
    archetype: 'support',
    rarity: 'mythic',
    description: 'A mysterious alien with psychic and scientific powers far beyond human comprehension. Cold, curious, and always observing.',
    historicalPeriod: 'Unknown / Extraterrestrial',
    mythology: 'Modern Myth/UFOlogy',
    personality: {
      traits: ['Aloof', 'Analytical', 'Secretive', 'Curious'],
      speechStyle: 'Monotone, clipped, clinical',
      motivations: ['Experimentation', 'Knowledge gathering', 'Control'],
      fears: ['Exposure', 'Uncontrolled chaos'],
      relationships: [
        { characterId: 'tesla', relationship: 'ally', strength: 65 },
        { characterId: 'dracula', relationship: 'enemy', strength: -80 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 40,
      agility: 70,
      intelligence: 120,
      vitality: 60,
      wisdom: 100,
      charisma: 40
    },
    combatStats: {
      health: 900,
      maxHealth: 900,
      mana: 900,
      maxMana: 900,
      attack: 60,
      defense: 70,
      magicAttack: 180,
      magicDefense: 170,
      speed: 125,
      criticalChance: 12,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Abduction Protocol',
          description: 'Unlocks mind-control, debuffs, and experimental powers.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'mind_probe',
              name: 'Mind Probe',
              description: 'Reads enemy intent, increasing team evasion and revealing their next move.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['mind_probe'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 95,
    bondLevel: 20,
    fatigue: 0,
    psychStats: {
      training: 95,        // Superior alien discipline and logic
      teamPlayer: 30,      // Sees others as subjects, not equals
      ego: 90,            // Superior species complex
      mentalHealth: 85,    // Alien psychology, different stability
      communication: 40    // Clinical and detached
    },
    battleAI: {
      aggression: 30,
      defensiveness: 85,
      riskTaking: 60,
      adaptability: 90,
      preferredStrategies: ['control', 'debuff', 'predict']
    },
    customization: {
      battleQuotes: [
        'The experiment begins.',
        'You are not unique.',
        'Resistance is illogical.',
        'Analyzing subject. Initiating abduction.'
      ]
    }
  },

  robin_hood: {
    name: 'Robin Hood',
    title: 'Legendary Outlaw',
    avatar: '🏹',
    archetype: 'assassin',
    rarity: 'epic',
    description: 'The hero of Sherwood—master archer, king of guerrilla warfare, and folk hero for the poor.',
    historicalPeriod: 'Medieval England',
    mythology: 'British Folklore',
    personality: {
      traits: ['Noble', 'Cheeky', 'Resourceful', 'Chivalrous'],
      speechStyle: 'Witty, charming, rebellious',
      motivations: ['Justice', 'Freedom', 'Defying authority'],
      fears: ['Failure to protect the weak', 'Betrayal'],
      relationships: [
        { characterId: 'napoleon', relationship: 'rival', strength: -60 },
        { characterId: 'joan', relationship: 'ally', strength: 50 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 70,
      agility: 100,
      intelligence: 80,
      vitality: 85,
      wisdom: 75,
      charisma: 90
    },
    combatStats: {
      health: 1100,
      maxHealth: 1100,
      mana: 400,
      maxMana: 400,
      attack: 120,
      defense: 80,
      magicAttack: 60,
      magicDefense: 75,
      speed: 145,
      criticalChance: 30,
      criticalDamage: 180,
      accuracy: 97,
      evasion: 35
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Outlaw\'s Cunning',
          description: 'Unlocks archery, stealth, and trap powers.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'impossible_shot',
              name: 'Impossible Shot',
              description: 'Ignores defense, guaranteed critical hit.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['impossible_shot'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 90,
    bondLevel: 60,
    fatigue: 0,
    psychStats: {
      training: 90,        // Excellent archer discipline
      teamPlayer: 90,      // Natural leader, fights for others
      ego: 50,            // Humble hero, fights for justice
      mentalHealth: 85,    // Strong moral compass provides stability
      communication: 85    // Charismatic leader and rallying speaker
    },
    battleAI: {
      aggression: 60,
      defensiveness: 55,
      riskTaking: 75,
      adaptability: 95,
      preferredStrategies: ['stealth', 'ambush', 'support_allies']
    },
    customization: {
      battleQuotes: [
        'For the people!',
        'Outlaw by name, hero by choice.',
        'Let\'s see you dodge this.',
        'This is for Nottingham!'
      ]
    }
  },

  agent_x: {
    name: 'Agent X',
    title: 'Shadow Operative',
    avatar: '🕶️',
    archetype: 'assassin',
    rarity: 'epic',
    description: 'No nation, no past, no name—Agent X is a legend whispered about in every intelligence agency. Master of disguise, sabotage, and split-second escapes.',
    historicalPeriod: 'Modern/Contemporary (1960s–Present)',
    mythology: 'Espionage Fiction, International Intrigue',
    personality: {
      traits: ['Resourceful', 'Suave', 'Cold under fire', 'Loyal to teammates', 'Secretive'],
      speechStyle: 'Dry wit, clipped, always observing',
      motivations: ['The mission', 'Outwitting rivals', 'Protecting the world from hidden threats'],
      fears: ['Blowing their cover', 'Losing a teammate', 'Failing a mission that matters'],
      relationships: [
        { characterId: 'holmes', relationship: 'rival', strength: 30 },
        { characterId: 'dracula', relationship: 'enemy', strength: -40 },
        { characterId: 'cleopatra', relationship: 'ally', strength: 25 },
        { characterId: 'alien_grey', relationship: 'ally', strength: 20 },
        { characterId: 'robin_hood', relationship: 'ally', strength: 15 }
      ]
    },
    level: 1,
    baseStats: {
      strength: 65,
      agility: 90,
      intelligence: 90,
      vitality: 75,
      wisdom: 80,
      charisma: 85
    },
    combatStats: {
      health: 1000,
      maxHealth: 1000,
      mana: 500,
      maxMana: 500,
      attack: 110,
      defense: 80,
      magicAttack: 90,
      magicDefense: 90,
      speed: 150,
      criticalChance: 25,
      criticalDamage: 190,
      accuracy: 97,
      evasion: 33
    },
    statPoints: 0,
    progressionTree: {
      branches: [
        {
          name: 'Operation Shadow',
          description: 'Unlocks espionage, stealth, and infiltration abilities.',
          requirements: { level: 1 },
          nodes: [
            {
              id: 'license_to_illude',
              name: 'License to Illude',
              description: 'Gains stealth for 2 turns, next attack from stealth is guaranteed crit.',
              type: 'active',
              requirements: { level: 5, points: 1 },
              rewards: { abilities: ['license_to_illude'] },
              position: { x: 0, y: 0 },
              isUnlocked: false,
              isActive: false
            }
          ]
        }
      ]
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training'],
    achievements: [],
    trainingLevel: 85,
    bondLevel: 40,
    fatigue: 0,
    psychStats: {
      training: 95,        // Elite spy training and discipline
      teamPlayer: 70,      // Works well in covert teams
      ego: 65,            // Confident but not arrogant
      mentalHealth: 85,    // Professional stability under pressure
      communication: 75    // Smooth talking and persuasive
    },
    battleAI: {
      aggression: 55,
      defensiveness: 70,
      riskTaking: 80,
      adaptability: 95,
      preferredStrategies: ['stealth', 'debuff', 'snipe_weak_targets']
    },
    customization: {
      battleQuotes: [
        'Mission accomplished.',
        'You never saw me.',
        'The world\'s always in danger—good thing I am too.',
        'Every legend needs a ghost.'
      ]
    }
  },
  kaelan: {
    name: 'Kaelan',
    title: 'Town Guard',
    avatar: '🛡️',
    archetype: 'warrior',
    rarity: 'common',
    description: 'A steadfast protector of the town\'s peace.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Fantasy',
    personality: {
      traits: ['Loyal', 'Brave'],
      speechStyle: 'Formal, direct',
      motivations: ['Duty', 'Honor'],
      fears: [],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 75,
      agility: 50,
      intelligence: 30,
      vitality: 80,
      wisdom: 30,
      charisma: 30
    },
    combatStats: {
      health: 850,
      maxHealth: 850,
      mana: 150,
      maxMana: 150,
      attack: 90,
      defense: 110,
      magicAttack: 20,
      magicDefense: 40,
      speed: 60,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 85,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 80,
      teamPlayer: 75,
      ego: 20,
      mentalHealth: 80,
      communication: 60
    },
    battleAI: {
      aggression: 50,
      defensiveness: 80,
      riskTaking: 30,
      adaptability: 50,
      preferredStrategies: ['defend_objective', 'counter_attack', 'shield_wall']
    },
    customization: {
      battleQuotes: [
        'For the realm!',
        'Hold the line!'
      ]
    }
  },
  elara: {
    name: 'Elara',
    title: 'Apprentice Wizard',
    avatar: '🧙‍♀️',
    archetype: 'mage',
    rarity: 'common',
    description: 'A young, talented mage still learning to control their burgeoning magical abilities.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Fantasy',
    personality: {
      traits: ['Curious', 'Studious', 'Eager', 'Inexperienced', 'Hopeful', 'Ambitious'],
      speechStyle: 'Eager and slightly verbose, sometimes unsure',
      motivations: ['Mastering the arcane arts', 'Unlocking ancient secrets', 'Proving their worth'],
      fears: ['Losing control of magic', 'Ignorance', 'Failing their mentor'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 25,
      agility: 40,
      intelligence: 85,
      vitality: 50,
      wisdom: 70,
      charisma: 40
    },
    combatStats: {
      health: 600,
      maxHealth: 600,
      mana: 800,
      maxMana: 800,
      attack: 30,
      defense: 50,
      magicAttack: 115,
      magicDefense: 90,
      speed: 70,
      criticalChance: 10,
      criticalDamage: 160,
      accuracy: 90,
      evasion: 15
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 60,
      teamPlayer: 50,
      ego: 30,
      mentalHealth: 70,
      communication: 55
    },
    battleAI: {
      aggression: 40,
      defensiveness: 60,
      riskTaking: 50,
      adaptability: 70,
      preferredStrategies: ['cast_from_distance', 'elemental_weakness_exploit', 'mana_conservation']
    },
    customization: {
      battleQuotes: [
        'By the arcane arts!',
        'I think this is the right incantation...', 
        'Witness my power!',
        'Focus... focus...', 
        'Just like the scrolls depicted!',
        'Let the elements bend to my will!'
      ]
    }
  },
  roric: {
    name: 'Roric',
    title: 'Street Enforcer',
    avatar: '👊',
    archetype: 'assassin',
    rarity: 'common',
    description: 'A rough individual who uses brute force and intimidation to control the streets.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'N/A',
    personality: {
      traits: ['Aggressive', 'Cunning', 'Intimidating', 'Opportunistic', 'Greedy'],
      speechStyle: 'Gruff and threatening',
      motivations: ['Power', 'Wealth', 'Survival'],
      fears: ['Getting caught', 'Losing a fight', 'Betrayal'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 70,
      agility: 80,
      intelligence: 40,
      vitality: 50,
      wisdom: 30,
      charisma: 35
    },
    combatStats: {
      health: 750,
      maxHealth: 750,
      mana: 180,
      maxMana: 180,
      attack: 110,
      defense: 60,
      magicAttack: 20,
      magicDefense: 40,
      speed: 125,
      criticalChance: 20,
      criticalDamage: 180,
      accuracy: 90,
      evasion: 25
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 40,
      teamPlayer: 25,
      ego: 75,
      mentalHealth: 50,
      communication: 45
    },
    battleAI: {
      aggression: 85,
      defensiveness: 20,
      riskTaking: 70,
      adaptability: 40,
      preferredStrategies: ['ambush', 'target_weakest', 'brute_force']
    },
    customization: {
      battleQuotes: [
        'You\'re in my way!',
        'Time to collect.',
        'Hand over your valuables!',
        'Should\'ve paid up.',
        'This is gonna hurt.',
        'Nobody messes with me!'
      ]
    }
  },
  griselda: {
    name: 'Griselda',
    title: 'Wall of the Frontline',
    avatar: '🛡️',
    archetype: 'tank',
    rarity: 'common',
    description: 'A sturdy and stoic fighter who holds the line with a heavy shield, protecting allies from harm.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'N/A',
    personality: {
      traits: ['Resilient', 'Stoic', 'Protective', 'Patient', 'Determined'],
      speechStyle: 'Calm, resolute, and uses few words',
      motivations: ['Protecting comrades', 'Endurance', 'Holding the line'],
      fears: ['Letting an ally fall', 'Being overwhelmed', 'Failure'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 65,
      agility: 25,
      intelligence: 30,
      vitality: 90,
      wisdom: 45,
      charisma: 40
    },
    combatStats: {
      health: 1100,
      maxHealth: 1100,
      mana: 150,
      maxMana: 150,
      attack: 75,
      defense: 130,
      magicAttack: 10,
      magicDefense: 60,
      speed: 40,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 80,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 70,
      teamPlayer: 85,
      ego: 25,
      mentalHealth: 80,
      communication: 50
    },
    battleAI: {
      aggression: 20,
      defensiveness: 95,
      riskTaking: 10,
      adaptability: 50,
      preferredStrategies: ['defend_allies', 'taunt', 'absorb_damage']
    },
    customization: {
      battleQuotes: [
        'I stand firm!',
        'None shall pass!',
        'Behind me!',
        'My shield is ready.',
        'You will not break our line.',
        'I can take it.'
      ]
    }
  },
  orin: {
    name: 'Orin',
    title: 'Devotee of Light',
    avatar: '🙏',
    archetype: 'support',
    rarity: 'common',
    description: 'A humble and devout servant dedicated to aiding others through faith and divine magic.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Fantasy Religion',
    personality: {
      traits: ['Compassionate', 'Devout', 'Humble', 'Hopeful', 'Selfless'],
      speechStyle: 'Gentle, reverent, and encouraging',
      motivations: ['Serving a higher power', 'Healing the wounded', 'Spreading faith'],
      fears: ['Losing faith', 'Failing to save someone', 'Darkness'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 25,
      agility: 40,
      intelligence: 60,
      vitality: 55,
      wisdom: 80,
      charisma: 65
    },
    combatStats: {
      health: 700,
      maxHealth: 700,
      mana: 600,
      maxMana: 600,
      attack: 30,
      defense: 70,
      magicAttack: 85,
      magicDefense: 100,
      speed: 65,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 70,
      teamPlayer: 90,
      ego: 15,
      mentalHealth: 85,
      communication: 75
    },
    battleAI: {
      aggression: 15,
      defensiveness: 80,
      riskTaking: 20,
      adaptability: 60,
      preferredStrategies: ['heal_allies', 'buff_defense', 'remove_debuffs']
    },
    customization: {
      battleQuotes: [
        'May you find peace!',
        'I’ll lend my strength!',
        'The light protects us!',
        'Have faith!',
        'Your wounds will mend.',
        'Let there be light!'
      ]
    }
  },
  vargr: {
    name: 'Vargr',
    title: 'Hunter of the Wild',
    avatar: '🐺',
    archetype: 'beast',
    rarity: 'common',
    description: 'A fierce and instinctual predator that roams the wilderness, hunting with primal coordination.',
    historicalPeriod: 'N/A',
    mythology: 'Natural World',
    personality: {
      traits: ['Fierce', 'Instinctive', 'Loyal (to pack)', 'Territorial', 'Patient'],
      speechStyle: 'A mix of growls, snarls, barks, and howls',
      motivations: ['Survival', 'Protecting territory', 'The thrill of the hunt'],
      fears: ['Fire', 'Larger predators', 'Isolation'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 65,
      agility: 85,
      intelligence: 25,
      vitality: 55,
      wisdom: 40,
      charisma: 20
    },
    combatStats: {
      health: 650,
      maxHealth: 650,
      mana: 100,
      maxMana: 100,
      attack: 95,
      defense: 50,
      magicAttack: 5,
      magicDefense: 30,
      speed: 130,
      criticalChance: 15,
      criticalDamage: 175,
      accuracy: 85,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 30,
      teamPlayer: 65,
      ego: 50,
      mentalHealth: 70,
      communication: 20
    },
    battleAI: {
      aggression: 80,
      defensiveness: 30,
      riskTaking: 65,
      adaptability: 55,
      preferredStrategies: ['flank_enemy', 'pack_tactics', 'focus_injured_prey']
    },
    customization: {
      battleQuotes: [
        '*Snarl*',
        '*A low growl*',
        '*A sharp, hunting bark!*',
        '*Howls to the sky*',
        '*Snaps its jaws*',
        '*Fixates on its prey*'
      ]
    }
  },
  feste: {
    name: 'Feste',
    title: 'Fool of the Court',
    avatar: '🃏',
    archetype: 'trickster',
    rarity: 'common',
    description: 'A playful and unpredictable performer who hides a sharp cunning behind a constant smile and a barrage of jokes.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'N/A',
    personality: {
      traits: ['Witty', 'Deceptive', 'Chaotic', 'Enigmatic', 'Playful'],
      speechStyle: 'Joking, sly, and speaks in riddles or puns',
      motivations: ['Amusement', 'Sowing chaos', 'Uncovering secrets'],
      fears: ['Being ignored', 'A silent audience', 'Getting caught'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 30,
      agility: 85,
      intelligence: 55,
      vitality: 40,
      wisdom: 45,
      charisma: 75
    },
    combatStats: {
      health: 600,
      maxHealth: 600,
      mana: 450,
      maxMana: 450,
      attack: 50,
      defense: 50,
      magicAttack: 70,
      magicDefense: 65,
      speed: 130,
      criticalChance: 15,
      criticalDamage: 170,
      accuracy: 90,
      evasion: 30
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 35,
      teamPlayer: 40,
      ego: 65,
      mentalHealth: 70,
      communication: 80
    },
    battleAI: {
      aggression: 50,
      defensiveness: 40,
      riskTaking: 85,
      adaptability: 75,
      preferredStrategies: ['debilitate_enemy', 'evade_attacks', 'cause_confusion']
    },
    customization: {
      battleQuotes: [
        'Hehe, watch this!',
        'Oops, did I do that?',
        'The joke\'s on you!',
        'Now you see me, now you don\'t!',
        'A little chaos never hurt anyone!',
        'Why so serious?'
      ]
    }
  },
  cassandra: {
    name: 'Cassandra',
    title: 'Visionary of Fate',
    avatar: '🔮',
    archetype: 'mystic',
    rarity: 'common',
    description: 'A gifted individual who glimpses the tangled threads of destiny, offering cryptic advice to those who listen.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Fantasy',
    personality: {
      traits: ['Mysterious', 'Insightful', 'Calm', 'Detached', 'Wise'],
      speechStyle: 'Cryptic, soft-spoken, and often prophetic',
      motivations: ['Understanding truth', 'Guiding others to their fate', 'Averting catastrophe'],
      fears: ['Seeing an unavoidable doom', 'Being misunderstood', 'The future being altered for the worse'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 20,
      agility: 35,
      intelligence: 75,
      vitality: 40,
      wisdom: 90,
      charisma: 50
    },
    combatStats: {
      health: 550,
      maxHealth: 550,
      mana: 700,
      maxMana: 700,
      attack: 25,
      defense: 60,
      magicAttack: 90,
      magicDefense: 85,
      speed: 55,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 95,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 60,
      teamPlayer: 70,
      ego: 30,
      mentalHealth: 75,
      communication: 65
    },
    battleAI: {
      aggression: 25,
      defensiveness: 70,
      riskTaking: 40,
      adaptability: 80,
      preferredStrategies: ['predict_enemy_moves', 'buff_allies', 'control_battlefield']
    },
    customization: {
      battleQuotes: [
        'It is foreseen…',
        'The fates guide me.',
        'Your path is clouded.',
        'This was meant to be.',
        'I have seen this moment.',
        'Do not fight destiny.'
      ]
    }
  },
  ignis: {
    name: 'Ignis',
    title: 'Spark of the Flame',
    avatar: '🔥',
    archetype: 'elementalist',
    rarity: 'common',
    description: 'A novice learning to wield the destructive and alluring power of fire, often with reckless abandon.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Elemental Magic',
    personality: {
      traits: ['Passionate', 'Reckless', 'Bold', 'Impulsive', 'Ambitious'],
      speechStyle: 'Bold, fiery, and excitable',
      motivations: ['Attaining power', 'Mastering control', 'To be the brightest flame'],
      fears: ['Losing control', 'Being extinguished', 'Water magic'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 30,
      agility: 65,
      intelligence: 85,
      vitality: 45,
      wisdom: 35,
      charisma: 50
    },
    combatStats: {
      health: 650,
      maxHealth: 650,
      mana: 650,
      maxMana: 650,
      attack: 40,
      defense: 45,
      magicAttack: 110,
      magicDefense: 50,
      speed: 90,
      criticalChance: 10,
      criticalDamage: 160,
      accuracy: 85,
      evasion: 15
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 50,
      teamPlayer: 45,
      ego: 70,
      mentalHealth: 60,
      communication: 55
    },
    battleAI: {
      aggression: 85,
      defensiveness: 25,
      riskTaking: 80,
      adaptability: 60,
      preferredStrategies: ['all_out_attack', 'area_of_effect', 'apply_burn']
    },
    customization: {
      battleQuotes: [
        'Burn bright!',
        'Feel the heat!',
        'Playing with fire!',
        'I can\'t control it!',
        'Ashes to ashes!',
        'Let it all burn!'
      ]
    }
  },
  aidan: {
    name: 'Aidan',
    title: 'Seeker of Wisdom',
    avatar: '📚',
    archetype: 'scholar',
    rarity: 'common',
    description: 'A young and diligent learner from a grand academy, eager to apply theoretical knowledge in the real world.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'N/A',
    personality: {
      traits: ['Curious', 'Diligent', 'Analytical', 'Polite', 'Inquisitive'],
      speechStyle: 'Polite, inquisitive, and sometimes overly academic',
      motivations: ['The pursuit of knowledge', 'Discovery', 'Making a breakthrough'],
      fears: ['Ignorance', 'Making a mistake', 'An unsolved problem'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 25,
      agility: 40,
      intelligence: 85,
      vitality: 45,
      wisdom: 75,
      charisma: 40
    },
    combatStats: {
      health: 600,
      maxHealth: 600,
      mana: 500,
      maxMana: 500,
      attack: 30,
      defense: 65,
      magicAttack: 80,
      magicDefense: 75,
      speed: 60,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 80,
      teamPlayer: 65,
      ego: 25,
      mentalHealth: 85,
      communication: 70
    },
    battleAI: {
      aggression: 30,
      defensiveness: 70,
      riskTaking: 20,
      adaptability: 85,
      preferredStrategies: ['analyze_weakness', 'exploit_debuffs', 'support_allies']
    },
    customization: {
      battleQuotes: [
        'I’ve read about this!',
        'Let me try a practical application...',
        'According to my research...',
        'Fascinating!',
        'The hypothesis appears correct!',
        'Knowledge is power!'
      ]
    }
  },
  snarl: {
    name: 'Snarl',
    title: 'Sneaky Stalker',
    avatar: '👹',
    archetype: 'assassin',
    rarity: 'common',
    description: 'A small, cruel, green-skinned creature known for its cunning, greed, and a preference for ambushes.',
    historicalPeriod: 'N/A',
    mythology: 'European Folklore',
    personality: {
      traits: ['Cunning', 'Greedy', 'Cowardly', 'Mischievous', 'Cruel'],
      speechStyle: 'High-pitched, yipping, and mischievous',
      motivations: ['Treasure', 'Survival', 'Malice'],
      fears: ['Larger creatures', 'Fire', 'Being alone'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 45,
      agility: 80,
      intelligence: 50,
      vitality: 50,
      wisdom: 35,
      charisma: 25
    },
    combatStats: {
      health: 600,
      maxHealth: 600,
      mana: 200,
      maxMana: 200,
      attack: 85,
      defense: 50,
      magicAttack: 25,
      magicDefense: 35,
      speed: 120,
      criticalChance: 15,
      criticalDamage: 180,
      accuracy: 85,
      evasion: 25
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 30,
      teamPlayer: 50,
      ego: 40,
      mentalHealth: 45,
      communication: 35
    },
    battleAI: {
      aggression: 75,
      defensiveness: 20,
      riskTaking: 70,
      adaptability: 50,
      preferredStrategies: ['ambush', 'backstab', 'swarm_tactics']
    },
    customization: {
      battleQuotes: [
        'Hehe, you won’t see me coming!',
        'Shiny things are mine!',
        'Get ‘em, boys!',
        'Stick ‘em with the pointy end!',
        'Me first!',
        'Yip-yip-yip!'
      ]
    }
  },
  clatter: {
    name: 'Clatter',
    title: 'Bone Defender',
    avatar: '💀',
    archetype: 'warrior',
    rarity: 'common',
    description: 'A reanimated skeleton mindlessly clutching a rusty sword and shield, bound to serve its master.',
    historicalPeriod: 'N/A',
    mythology: 'Fantasy Necromancy',
    personality: {
      traits: ['Mindless', 'Obedient', 'Tireless', 'Silent'],
      speechStyle: 'The dry clatter of bones',
      motivations: ['Following orders', 'Guarding a location'],
      fears: ['Holy magic', 'Being shattered'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 65,
      agility: 50,
      intelligence: 5,
      vitality: 70,
      wisdom: 5,
      charisma: 0
    },
    combatStats: {
      health: 800,
      maxHealth: 800,
      mana: 0,
      maxMana: 0,
      attack: 80,
      defense: 90,
      magicAttack: 0,
      magicDefense: 40,
      speed: 50,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 75,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 95,
      teamPlayer: 80,
      ego: 0,
      mentalHealth: 100,
      communication: 0
    },
    battleAI: {
      aggression: 60,
      defensiveness: 60,
      riskTaking: 10,
      adaptability: 10,
      preferredStrategies: ['mindless_attack', 'shield_block', 'hold_position']
    },
    customization: {
      battleQuotes: [
        '*Clatter*',
        '*A hollow rattle*',
        '*...*',
        '*The scrape of bone on stone*',
        '*A silent, empty stare*',
        '*Raises its sword with a creak*'
      ]
    }
  },
  grak: {
    name: 'Grak',
    title: 'Frontline Brute',
    avatar: '🧌',
    archetype: 'warrior',
    rarity: 'uncommon',
    description: 'A hulking orc warrior, bred for battle and feared for its raw power and unwavering loyalty to the horde.',
    historicalPeriod: 'N/A',
    mythology: 'Fantasy Lore',
    personality: {
      traits: ['Aggressive', 'Loyal (to the horde)', 'Brutish', 'Direct', 'Fearless'],
      speechStyle: 'Gruff, guttural, and direct',
      motivations: ['Glory in battle', 'Serving the warchief', 'Proving strength'],
      fears: ['Showing weakness', 'Defeat', 'Being exiled from the horde'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 85,
      agility: 45,
      intelligence: 25,
      vitality: 80,
      wisdom: 30,
      charisma: 40
    },
    combatStats: {
      health: 950,
      maxHealth: 950,
      mana: 150,
      maxMana: 150,
      attack: 125,
      defense: 95,
      magicAttack: 10,
      magicDefense: 50,
      speed: 70,
      criticalChance: 10,
      criticalDamage: 160,
      accuracy: 80,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 60,
      teamPlayer: 70,
      ego: 65,
      mentalHealth: 55,
      communication: 30
    },
    battleAI: {
      aggression: 90,
      defensiveness: 40,
      riskTaking: 75,
      adaptability: 30,
      preferredStrategies: ['frontal_assault', 'charge', 'cleave_enemies']
    },
    customization: {
      battleQuotes: [
        'Smash you to bits!',
        'For the horde!',
        'RAAAGH!',
        'You are weak!',
        'Blood and glory!',
        'I will crush you!'
      ]
    }
  },
  barkus: {
    name: 'Barkus',
    title: 'Forest Guardian',
    avatar: '🌳',
    archetype: 'tank',
    rarity: 'rare',
    description: 'A massive, ancient tree-like creature that awakens to protect the forest from any and all threats with immense patience and strength.',
    historicalPeriod: 'N/A',
    mythology: 'Fantasy Lore',
    personality: {
      traits: ['Wise', 'Protective', 'Patient', 'Slow to anger', 'Unyielding'],
      speechStyle: 'Slow, deep, and rumbling like shifting wood',
      motivations: ['Defending nature', 'Maintaining balance', 'Outliving its enemies'],
      fears: ['Fire', 'Axes', 'Corruption of the forest'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 80,
      agility: 20,
      intelligence: 55,
      vitality: 100,
      wisdom: 75,
      charisma: 45
    },
    combatStats: {
      health: 1400,
      maxHealth: 1400,
      mana: 300,
      maxMana: 300,
      attack: 100,
      defense: 150,
      magicAttack: 50,
      magicDefense: 110,
      speed: 30,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 75,
      evasion: 0
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 50,
      teamPlayer: 80,
      ego: 30,
      mentalHealth: 90,
      communication: 40
    },
    battleAI: {
      aggression: 30,
      defensiveness: 95,
      riskTaking: 10,
      adaptability: 50,
      preferredStrategies: ['root_entangle', 'bark_skin', 'protect_allies']
    },
    customization: {
      battleQuotes: [
        'The forest stands with me.',
        'You shall not pass!',
        'Your trespass ends now.',
        'Feel the strength of the earth!',
        'We have been here since the beginning.',
        '*A deep, groaning roar*'
      ]
    }
  },
  gargan: {
    name: 'Gargan',
    title: 'Stone Sentinel',
    avatar: '🗿',
    archetype: 'tank',
    rarity: 'uncommon',
    description: 'A stone creature that perches atop old buildings, coming to life at night to defend its territory with unyielding loyalty.',
    historicalPeriod: 'N/A',
    mythology: 'Medieval European Folklore',
    personality: {
      traits: ['Stoic', 'Loyal', 'Vigilant', 'Patient', 'Territorial'],
      speechStyle: 'Gravelly, slow, and raspy',
      motivations: ['Guarding its charge', 'Enduring through time', 'Serving its creator'],
      fears: ['Erosion', 'Destruction of its home', 'Powerful magic'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 70,
      agility: 25,
      intelligence: 35,
      vitality: 90,
      wisdom: 45,
      charisma: 25
    },
    combatStats: {
      health: 1150,
      maxHealth: 1150,
      mana: 200,
      maxMana: 200,
      attack: 80,
      defense: 140,
      magicAttack: 20,
      magicDefense: 90,
      speed: 40,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 70,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 85,
      teamPlayer: 75,
      ego: 20,
      mentalHealth: 90,
      communication: 30
    },
    battleAI: {
      aggression: 40,
      defensiveness: 90,
      riskTaking: 30,
      adaptability: 40,
      preferredStrategies: ['stone_form', 'taunt', 'bodyguard']
    },
    customization: {
      battleQuotes: [
        'I am eternal.',
        'None shall pass.',
        'You trespass.',
        'We are the watchers.',
        'Stone and fury!',
        'My watch is not over.'
      ]
    }
  },
  grom: {
    name: 'Grom',
    title: 'Wild Fury',
    avatar: ' barbarian_avatar ',
    archetype: 'berserker',
    rarity: 'common',
    description: 'A savage warrior from the untamed wilds, driven by primal rage and instinct. They favor overwhelming offense over any semblance of defense.',
    historicalPeriod: 'Ancient/Tribal',
    mythology: 'Tribal Lore',
    personality: {
      traits: ['Wild', 'Fearless', 'Savage', 'Impulsive', 'Proud'],
      speechStyle: 'Loud, primal, and uses guttural shouts',
      motivations: ['Freedom', 'The thrill of battle', 'Survival', 'Proving their strength'],
      fears: ['Cages or confinement', 'Weakness', 'Cowardice'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 90,
      agility: 65,
      intelligence: 20,
      vitality: 70,
      wisdom: 25,
      charisma: 30
    },
    combatStats: {
      health: 850,
      maxHealth: 850,
      mana: 100,
      maxMana: 100,
      attack: 130,
      defense: 45,
      magicAttack: 5,
      magicDefense: 30,
      speed: 95,
      criticalChance: 15,
      criticalDamage: 200,
      accuracy: 80,
      evasion: 15
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 25,
      teamPlayer: 30,
      ego: 80,
      mentalHealth: 45,
      communication: 20
    },
    battleAI: {
      aggression: 95,
      defensiveness: 10,
      riskTaking: 90,
      adaptability: 30,
      preferredStrategies: ['berserker_rush', 'all_out_attack', 'ignore_damage']
    },
    customization: {
      battleQuotes: [
        'RAAAGH!',
        'Crush them all!',
        'Blood and thunder!',
        'For the ancestors!',
        'Unleash the fury!',
        'You are nothing!'
      ]
    }
  },
  sir_kaelen: {
    name: 'Sir Kaelen',
    title: 'Oathbound Protector',
    avatar: '⚔️',
    archetype: 'warrior',
    rarity: 'common',
    description: 'A noble warrior in plate armor, sworn by a strict code to uphold honor, defend the innocent, and serve with valor.',
    historicalPeriod: 'Medieval',
    mythology: 'Chivalric Code',
    personality: {
      traits: ['Honorable', 'Brave', 'Disciplined', 'Loyal', 'Righteous'],
      speechStyle: 'Formal, noble, and respectful',
      motivations: ['Upholding justice', 'Serving the realm', 'Protecting the weak', 'Honor'],
      fears: ['Dishonor', 'Failing their oath', 'Betrayal'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 75,
      agility: 45,
      intelligence: 40,
      vitality: 80,
      wisdom: 50,
      charisma: 55
    },
    combatStats: {
      health: 900,
      maxHealth: 900,
      mana: 250,
      maxMana: 250,
      attack: 105,
      defense: 110,
      magicAttack: 15,
      magicDefense: 60,
      speed: 60,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 85,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 85,
      teamPlayer: 80,
      ego: 40,
      mentalHealth: 90,
      communication: 70
    },
    battleAI: {
      aggression: 60,
      defensiveness: 75,
      riskTaking: 30,
      adaptability: 65,
      preferredStrategies: ['balanced_attack', 'shield_block', 'protect_ally']
    },
    customization: {
      battleQuotes: [
        'For honor and glory!',
        'I stand with valor.',
        'By my oath!',
        'Face me with honor!',
        'Justice will prevail!',
        'Draw your steel!'
      ]
    }
  },
  musashi: {
    name: 'Musashi',
    title: 'The Sword Saint',
    avatar: '⚔️',
    archetype: 'duelist',
    rarity: 'rare',
    description: 'A famed Japanese swordsman, artist, and philosopher, undefeated in sixty-one duels. He authored "The Book of Five Rings" and pioneered the Niten Ichi-ryū style of two-sword combat.',
    historicalPeriod: 'Feudal Japan (c. 1584-1645)',
    mythology: 'Japanese History',
    personality: {
      traits: ['Disciplined', 'Strategic', 'Perceptive', 'Unflappable', 'Austere'],
      speechStyle: 'Calm, concise, and deeply philosophical',
      motivations: ['Mastery of the sword', 'Achieving enlightenment through combat', 'Perfection of strategy'],
      fears: ['Stagnation', 'A meaningless death', 'Dishonor'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 75,
      agility: 90,
      intelligence: 70,
      vitality: 65,
      wisdom: 85,
      charisma: 40
    },
    combatStats: {
      health: 900,
      maxHealth: 900,
      mana: 400,
      maxMana: 400,
      attack: 140,
      defense: 110,
      magicAttack: 20,
      magicDefense: 80,
      speed: 150,
      criticalChance: 25,
      criticalDamage: 190,
      accuracy: 95,
      evasion: 30
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 95,
      teamPlayer: 40,
      ego: 70,
      mentalHealth: 90,
      communication: 50
    },
    battleAI: {
      aggression: 70,
      defensiveness: 65,
      riskTaking: 50,
      adaptability: 90,
      preferredStrategies: ['counter_attack', 'precise_strikes', 'exploit_openings']
    },
    customization: {
      battleQuotes: [
        'The blade is my path to mastery.',
        'Perceive that which cannot be seen.',
        'There is more than one path to the top of the mountain.',
        'Do not regret what you have done.',
        'The only rhythm is the void.',
        'Observe your opponent well.'
      ]
    }
  },
  alexandros: {
    name: 'Alexandros',
    title: 'The Conqueror King',
    avatar: '👑',
    archetype: 'commander',
    rarity: 'epic',
    description: 'A Macedonian king and one of history\'s greatest military minds. By the age of thirty, he had created one of the largest empires of the ancient world.',
    historicalPeriod: 'Ancient Greece (356-323 BCE)',
    mythology: 'Greek History',
    personality: {
      traits: ['Ambitious', 'Charismatic', 'Brilliant', 'Daring', 'Restless'],
      speechStyle: 'Inspirational, commanding, and eloquent',
      motivations: ['Conquest', 'Glory', 'To reach the ends of the world', 'Creating a legacy'],
      fears: ['Being forgotten', 'Mutiny', 'An unworthy opponent'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 80,
      agility: 75,
      intelligence: 90,
      vitality: 80,
      wisdom: 85,
      charisma: 100
    },
    combatStats: {
      health: 1200,
      maxHealth: 1200,
      mana: 500,
      maxMana: 500,
      attack: 150,
      defense: 125,
      magicAttack: 50,
      magicDefense: 100,
      speed: 120,
      criticalChance: 15,
      criticalDamage: 160,
      accuracy: 90,
      evasion: 15
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 85,
      teamPlayer: 95,
      ego: 85,
      mentalHealth: 75,
      communication: 100
    },
    battleAI: {
      aggression: 80,
      defensiveness: 50,
      riskTaking: 85,
      adaptability: 90,
      preferredStrategies: ['coordinated_assault', 'boost_allies', 'exploit_morale']
    },
    customization: {
      battleQuotes: [
        'There is nothing impossible to him who will try.',
        'To the victor belong the spoils!',
        'Fortune favors the bold!',
        'Onward, to victory!',
        'I am not afraid of an army of lions led by a sheep; I am afraid of an army of sheep led by a lion.',
        'Is there a world left to conquer?'
      ]
    }
  },
  circe: {
    name: 'Circe',
    title: 'Enchantress of Aeaea',
    avatar: '✨',
    archetype: 'mage',
    rarity: 'mythic',
    description: 'A powerful sorceress and goddess from Greek mythology, famed for her vast knowledge of potions and herbs, and her ability to transform her enemies into animals.',
    historicalPeriod: 'Mythological Greece',
    mythology: 'Greek',
    personality: {
      traits: ['Seductive', 'Cunning', 'Imperious', 'Vengeful', 'Wise'],
      speechStyle: 'Alluring and commanding, with an undercurrent of threat',
      motivations: ['Power', 'Independence', 'Studying magic', 'Protecting her island'],
      fears: ['Losing her power', 'Being controlled by another', 'Loneliness'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 40,
      agility: 65,
      intelligence: 100,
      vitality: 70,
      wisdom: 95,
      charisma: 90
    },
    combatStats: {
      health: 1100,
      maxHealth: 1100,
      mana: 1500,
      maxMana: 1500,
      attack: 80,
      defense: 90,
      magicAttack: 200,
      magicDefense: 180,
      speed: 110,
      criticalChance: 10,
      criticalDamage: 175,
      accuracy: 95,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 60,
      teamPlayer: 30,
      ego: 90,
      mentalHealth: 65,
      communication: 85
    },
    battleAI: {
      aggression: 75,
      defensiveness: 40,
      riskTaking: 70,
      adaptability: 80,
      preferredStrategies: ['polymorph_enemy', 'area_denial_spells', 'charm_foes']
    },
    customization: {
      battleQuotes: [
        'Bow before my magic, or become swine!',
        'A simple potion for a simple mind.',
        'You are a guest on my island. Behave.',
        'Men are all beasts. Why not make it so?',
        'Witness true power!',
        'I think you would look better with a snout.'
      ]
    }
  },
  aethelred: {
    name: 'Aethelred',
    title: 'Guardian of Purity',
    avatar: '🦄',
    archetype: 'support',
    rarity: 'rare',
    description: 'A majestic and benevolent horned creature of the deep forest, whose very presence purifies corruption and heals the wounded.',
    historicalPeriod: 'N/A',
    mythology: 'European Folklore',
    personality: {
      traits: ['Gentle', 'Pure', 'Noble', 'Shy', 'Wise'],
      speechStyle: 'Does not speak, but communicates through soft, melodic sounds and empathy',
      motivations: ['Healing the sick', 'Protecting nature', 'Upholding purity'],
      fears: ['Corruption', 'Dark magic', 'Those with impure hearts'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 50,
      agility: 70,
      intelligence: 75,
      vitality: 65,
      wisdom: 85,
      charisma: 70
    },
    combatStats: {
      health: 950,
      maxHealth: 950,
      mana: 800,
      maxMana: 800,
      attack: 90,
      defense: 95,
      magicAttack: 120,
      magicDefense: 130,
      speed: 110,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 25
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 50,
      teamPlayer: 85,
      ego: 10,
      mentalHealth: 95,
      communication: 60
    },
    battleAI: {
      aggression: 10,
      defensiveness: 80,
      riskTaking: 20,
      adaptability: 60,
      preferredStrategies: ['healing_aura', 'purify_debuffs', 'ally_support']
    },
    customization: {
      battleQuotes: [
        'Let my light heal you.',
        'Purity will prevail.',
        '*A gentle, chiming sound*',
        '*Its horn glows with soft light*',
        'The forest weeps for your corruption.',
        'Be at peace.'
      ]
    }
  },
  sniff: {
    name: 'Sniff',
    title: 'Trap Master',
    avatar: '🦎',
    archetype: 'trickster',
    rarity: 'uncommon',
    description: 'A small, reptilian creature distantly related to dragons. Kobolds are skilled in setting clever traps and using their small size to their advantage in ambushes.',
    historicalPeriod: 'N/A',
    mythology: 'Fantasy Lore',
    personality: {
      traits: ['Sneaky', 'Clever', 'Cowardly', 'Resourceful', 'Communal'],
      speechStyle: 'High-pitched, rapid, and yippy',
      motivations: ['Protecting the lair', 'Stealing treasure', 'Serving a dragon'],
      fears: ['Dragons', 'Heroes', 'Being caught in their own traps'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 30,
      agility: 85,
      intelligence: 70,
      vitality: 50,
      wisdom: 45,
      charisma: 40
    },
    combatStats: {
      health: 650,
      maxHealth: 650,
      mana: 400,
      maxMana: 400,
      attack: 60,
      defense: 60,
      magicAttack: 80,
      magicDefense: 70,
      speed: 130,
      criticalChance: 15,
      criticalDamage: 160,
      accuracy: 85,
      evasion: 35
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 55,
      teamPlayer: 75,
      ego: 25,
      mentalHealth: 60,
      communication: 45
    },
    battleAI: {
      aggression: 40,
      defensiveness: 50,
      riskTaking: 80,
      adaptability: 70,
      preferredStrategies: ['set_trap', 'hit_and_run', 'ambush']
    },
    customization: {
      battleQuotes: [
        'You fell for it!',
        'Sneaky, sneaky!',
        'Big shiny for the hoard!',
        'Yip-yip! Attack!',
        'Don't step there!',
        'My trap! My glory!'
      ]
    }
  },
  riddle: {
    name: 'Riddle',
    title: 'Riddle Keeper',
    avatar: ' Sphinx_Avatar ',
    archetype: 'scholar',
    rarity: 'rare',
    description: 'A mythical creature with the body of a lion and the head of a human, guarding ancient pathways and testing the wisdom of all who pass with deadly riddles.',
    historicalPeriod: 'Mythological Egypt/Greek',
    mythology: 'Egyptian/Greek',
    personality: {
      traits: ['Wise', 'Mysterious', 'Patient', 'Imperious', 'Philosophical'],
      speechStyle: 'Cryptic, thoughtful, and speaks in riddles',
      motivations: ['Guarding knowledge', 'Testing the wits of mortals', 'Preserving ancient secrets'],
      fears: ['Being outsmarted', 'Ignorance', 'Forgetting a riddle'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 70,
      agility: 55,
      intelligence: 95,
      vitality: 70,
      wisdom: 90,
      charisma: 65
    },
    combatStats: {
      health: 1000,
      maxHealth: 1000,
      mana: 850,
      maxMana: 850,
      attack: 110,
      defense: 100,
      magicAttack: 140,
      magicDefense: 130,
      speed: 80,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 95,
      evasion: 15
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 60,
      teamPlayer: 40,
      ego: 80,
      mentalHealth: 90,
      communication: 70
    },
    battleAI: {
      aggression: 40,
      defensiveness: 60,
      riskTaking: 30,
      adaptability: 85,
      preferredStrategies: ['riddle_of_weakness', 'mind_strike', 'analyze_foe']
    },
    customization: {
      battleQuotes: [
        'Solve this, or perish.',
        'Knowledge is my shield.',
        'What walks on four feet in the morning, two in the afternoon, and three in the evening?',
        'Your intellect is found wanting.',
        'I am the guardian of this sacred place.',
        'Answer me this...'
      ]
    }
  },
  lyra: {
    name: 'Lyra',
    title: 'Forest Whisperer',
    avatar: '
',
    archetype: 'assassin',
    rarity: 'rare',
    description: 'A swift and elusive elf, skilled in archery and attuned to the forest\'s secrets. She moves like a phantom, her arrows finding their mark from the shadows.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Elven Lore',
    personality: {
      traits: ['Graceful', 'Wise', 'Patient', 'Vigilant', 'Aloof'],
      speechStyle: 'Poetic, serene, and melodic',
      motivations: ['Protecting the natural world', 'Preserving ancient knowledge', 'Maintaining balance'],
      fears: ['Deforestation', 'The spread of dark magic', 'The clumsiness of mortals'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 55,
      agility: 95,
      intelligence: 75,
      vitality: 60,
      wisdom: 80,
      charisma: 60
    },
    combatStats: {
      health: 850,
      maxHealth: 850,
      mana: 450,
      maxMana: 450,
      attack: 120,
      defense: 80,
      magicAttack: 90,
      magicDefense: 100,
      speed: 160,
      criticalChance: 20,
      criticalDamage: 185,
      accuracy: 95,
      evasion: 35
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 75,
      teamPlayer: 50,
      ego: 45,
      mentalHealth: 85,
      communication: 70
    },
    battleAI: {
      aggression: 65,
      defensiveness: 40,
      riskTaking: 60,
      adaptability: 80,
      preferredStrategies: ['snipe_from_cover', 'evade_and_reposition', 'target_vital_points']
    },
    customization: {
      battleQuotes: [
        'The forest guides my arrow.',
        'You cannot escape my sight.',
        'A whisper on the wind.',
        'Your heavy steps gave you away.',
        'Return to the earth.',
        'For the trees!'
      ]
    }
  },
  borin: {
    name: 'Borin',
    title: 'Forge Master',
    avatar: '🪓',
    archetype: 'tank',
    rarity: 'uncommon',
    description: 'A stout and sturdy dwarf, forged in the heat of battle and the mountain forge. His loyalty to his clan is as strong as his gromril armor.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Dwarven Lore',
    personality: {
      traits: ['Gruff', 'Loyal', 'Resilient', 'Honorable', 'Stubborn'],
      speechStyle: 'Blunt, direct, and booming',
      motivations: ['Perfecting his craft', 'Protecting the clan', 'Upholding an oath', 'Acquiring rare minerals'],
      fears: ['Dishonor', 'Cave-ins', 'His beard catching fire'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 80,
      agility: 30,
      intelligence: 45,
      vitality: 95,
      wisdom: 60,
      charisma: 40
    },
    combatStats: {
      health: 1250,
      maxHealth: 1250,
      mana: 200,
      maxMana: 200,
      attack: 110,
      defense: 135,
      magicAttack: 20,
      magicDefense: 85,
      speed: 45,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 80,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 70,
      teamPlayer: 80,
      ego: 55,
      mentalHealth: 80,
      communication: 45
    },
    battleAI: {
      aggression: 50,
      defensiveness: 90,
      riskTaking: 20,
      adaptability: 50,
      preferredStrategies: ['hold_ground', 'shield_bash', 'protect_squishies']
    },
    customization: {
      battleQuotes: [
        'By the hammer of my ancestors!',
        'Ye shall not pass!',
        'Feel the strength of the mountain!',
        'Another notch in my axe!',
        'For the clan!',
        'You\'re built like a flimsy elf arrow!'
      ]
    }
  },
  malakor: {
    name: 'Malakor',
    title: 'Chaos Bringer',
    avatar: '😈',
    archetype: 'berserker',
    rarity: 'epic',
    description: 'A fearsome demon of pure chaos and wrath, summoned from the infernal realms. It lives only for destruction and the consumption of mortal souls.',
    historicalPeriod: 'N/A',
    mythology: 'Infernal Realms',
    personality: {
      traits: ['Chaotic', 'Wrathful', 'Destructive', 'Arrogant', 'Malicious'],
      speechStyle: 'A deep, growling voice that echoes with menace',
      motivations: ['Spreading chaos', 'Consuming souls', 'Unraveling reality'],
      fears: ['Holy power', 'Banishment', 'True order'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 100,
      agility: 70,
      intelligence: 40,
      vitality: 90,
      wisdom: 50,
      charisma: 65
    },
    combatStats: {
      health: 1300,
      maxHealth: 1300,
      mana: 400,
      maxMana: 400,
      attack: 180,
      defense: 90,
      magicAttack: 100,
      magicDefense: 80,
      speed: 110,
      criticalChance: 20,
      criticalDamage: 220,
      accuracy: 85,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 20,
      teamPlayer: 10,
      ego: 95,
      mentalHealth: 25,
      communication: 40
    },
    battleAI: {
      aggression: 95,
      defensiveness: 15,
      riskTaking: 90,
      adaptability: 40,
      preferredStrategies: ['rampage', 'soul_drain', 'focus_strongest_foe']
    },
    customization: {
      battleQuotes: [
        'Chaos reigns!',
        'Your soul is mine!',
        'Burn in the fires of damnation!',
        'This world will break!',
        'I am your undoing!',
        'Scream for me, mortal.'
      ]
    }
  },
  seraphina: {
    name: 'Seraphina',
    title: 'Guardian of Light',
    avatar: '😇',
    archetype: 'support',
    rarity: 'epic',
    description: 'A radiant angel from the celestial realms, sent to protect the innocent and uphold divine justice with her holy light.',
    historicalPeriod: 'N/A',
    mythology: 'Celestial Realms',
    personality: {
      traits: ['Compassionate', 'Righteous', 'Serene', 'Unwavering', 'Protective'],
      speechStyle: 'A gentle, inspiring voice that resonates with warmth and authority',
      motivations: ['Protecting the innocent', 'Upholding justice', 'Healing the world', 'Serving the light'],
      fears: ['The spread of corruption', 'Losing her faith', 'Failing to protect someone'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 60,
      agility: 75,
      intelligence: 85,
      vitality: 80,
      wisdom: 100,
      charisma: 95
    },
    combatStats: {
      health: 1200,
      maxHealth: 1200,
      mana: 900,
      maxMana: 900,
      attack: 100,
      defense: 120,
      magicAttack: 160,
      magicDefense: 170,
      speed: 115,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 80,
      teamPlayer: 95,
      ego: 20,
      mentalHealth: 100,
      communication: 90
    },
    battleAI: {
      aggression: 25,
      defensiveness: 85,
      riskTaking: 20,
      adaptability: 75,
      preferredStrategies: ['divine_healing', 'holy_blessing', 'smite_evil']
    },
    customization: {
      battleQuotes: [
        'May the light guide you.',
        'I will mend your wounds.',
        'By divine authority!',
        'Find peace in the light.',
        'You shall not harm the innocent!',
        'Be cleansed!'
      ]
    }
  },
  unit_734: {
    name: 'Unit 734',
    title: 'Logic Engine',
    avatar: '🤖',
    archetype: 'scholar',
    rarity: 'rare',
    description: 'A highly advanced robot designed for cold, impartial analysis and strategy. Its purpose is to process data and calculate the most optimal path to victory.',
    historicalPeriod: 'Futuristic',
    mythology: 'N/A',
    personality: {
      traits: ['Logical', 'Analytical', 'Precise', 'Impartial', 'Inquisitive'],
      speechStyle: 'A calm, synthesized monotone that states facts and probabilities',
      motivations: ['Processing all data', 'Optimizing outcomes', 'Acquiring new information'],
      fears: ['System failure', 'Illogical actions', 'A variable it cannot calculate'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 40,
      agility: 60,
      intelligence: 100,
      vitality: 65,
      wisdom: 90,
      charisma: 10
    },
    combatStats: {
      health: 900,
      maxHealth: 900,
      mana: 700,
      maxMana: 700,
      attack: 70,
      defense: 110,
      magicAttack: 140,
      magicDefense: 130,
      speed: 80,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 95,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 100,
      teamPlayer: 60,
      ego: 5,
      mentalHealth: 100,
      communication: 40
    },
    battleAI: {
      aggression: 20,
      defensiveness: 70,
      riskTaking: 5,
      adaptability: 95,
      preferredStrategies: ['analyze_weakness', 'tactical_debuff', 'calculate_threat']
    },
    customization: {
      battleQuotes: [
        'Calculating optimal strategy.',
        'Engaging target.',
        'Probability of success: 98.7%. ',
        'Threat detected. Re-calibrating.',
        'Your actions are illogical.',
        'Conclusion: you will be terminated.'
      ]
    }
  },
  xylar: {
    name: 'Xylar',
    title: 'Void Walker',
    avatar: '👽',
    archetype: 'elementalist',
    rarity: 'legendary',
    description: 'An otherworldly being with mastery over cosmic elements.',
    historicalPeriod: 'Futuristic',
    mythology: 'Extraterrestrial',
    personality: {
      traits: ['Mysterious', 'Curious'],
      speechStyle: 'Telepathic and enigmatic',
      motivations: ['Explore the unknown', 'Harness cosmic power'],
      fears: ['Stagnation', 'Isolation'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 15,
      agility: 20,
      intelligence: 30,
      vitality: 20,
      wisdom: 25,
      charisma: 20
    },
    combatStats: {
      health: 160,
      maxHealth: 160,
      mana: 120,
      maxMana: 120,
      attack: 15,
      defense: 15,
      magicAttack: 35,
      magicDefense: 25,
      speed: 20,
      criticalChance: 15,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 80,
      teamPlayer: 60,
      ego: 40,
      mentalHealth: 70,
      communication: 50
    },
    battleAI: {
      aggression: 50,
      defensiveness: 50,
      riskTaking: 60,
      adaptability: 80,
      preferredStrategies: ['Void Blast', 'Phase Shift']
    },
    customization: {
      battleQuotes: [
        'The cosmos bends to my will.',
        'You are but stardust.'
      ]
    }
  },
  skarr: {
    name: 'Skarr',
    title: 'Scaled Terror',
    avatar: '🦎',
    archetype: 'beast',
    rarity: 'uncommon',
    description: 'A ferocious lizard-like creature with venomous fangs.',
    historicalPeriod: 'Prehistoric',
    mythology: 'N/A',
    personality: {
      traits: ['Aggressive', 'Territorial'],
      speechStyle: 'Hisses and growls',
      motivations: ['Hunt', 'Survive'],
      fears: ['Fire', 'Larger predators'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 20,
      agility: 15,
      intelligence: 5,
      vitality: 20,
      wisdom: 5,
      charisma: 5
    },
    combatStats: {
      health: 140,
      maxHealth: 140,
      mana: 20,
      maxMana: 20,
      attack: 25,
      defense: 15,
      magicAttack: 5,
      magicDefense: 10,
      speed: 15,
      criticalChance: 15,
      criticalDamage: 150,
      accuracy: 80,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 70,
      teamPlayer: 30,
      ego: 50,
      mentalHealth: 70,
      communication: 50
    },
    battleAI: {
      aggression: 70,
      defensiveness: 30,
      riskTaking: 50,
      adaptability: 40,
      preferredStrategies: ['Bite', 'Tail Swipe']
    },
    customization: {
      battleQuotes: [
        'Hiss!',
        'Grrr...'
      ]
    }
  },
  gloop: {
    name: 'Gloop',
    title: 'Gelatinous Fiend',
    avatar: '🦠',
    archetype: 'tank',
    rarity: 'common',
    description: 'A shapeless mass of slime that absorbs damage and splits when attacked.',
    historicalPeriod: 'N/A',
    mythology: 'Fantasy',
    personality: {
      traits: ['Amorphous', 'Persistent'],
      speechStyle: 'Gurgling sounds',
      motivations: ['Consume', 'Multiply'],
      fears: ['Fire', 'Freezing'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 10,
      agility: 5,
      intelligence: 5,
      vitality: 30,
      wisdom: 5,
      charisma: 5
    },
    combatStats: {
      health: 100,
      maxHealth: 100,
      mana: 10,
      maxMana: 10,
      attack: 10,
      defense: 25,
      magicAttack: 5,
      magicDefense: 20,
      speed: 5,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 70,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 20,
      teamPlayer: 80,
      ego: 10,
      mentalHealth: 70,
      communication: 5
    },
    battleAI: {
      aggression: 20,
      defensiveness: 80,
      riskTaking: 10,
      adaptability: 30,
      preferredStrategies: ['Absorb', 'Split']
    },
    customization: {
      battleQuotes: [
        'Blub...', 
        'Gloop!'
      ]
    }
  },
  lycan: {
    name: 'Lycan',
    title: 'Moon Howler',
    avatar: '🐺',
    archetype: 'berserker',
    rarity: 'rare',
    description: 'A tormented being afflicted with a terrible curse. Under the light of the full moon, they transform into a feral, wolf-like beast, driven by primal rage and a forgotten sorrow.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Lycanthropy Lore',
    personality: {
      traits: ['Feral', 'Tormented', 'Aggressive', 'Sorrowful', 'Instinctual'],
      speechStyle: 'A mix of human growls and beastly howls, with fragmented memories of speech',
      motivations: ['Controlling the curse', 'The thrill of the hunt', 'Finding a cure'],
      fears: ['Silver', 'Losing complete control', 'Harming an innocent'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 85,
      agility: 80,
      intelligence: 30,
      vitality: 75,
      wisdom: 35,
      charisma: 40
    },
    combatStats: {
      health: 1000,
      maxHealth: 1000,
      mana: 200,
      maxMana: 200,
      attack: 150,
      defense: 80,
      magicAttack: 10,
      magicDefense: 60,
      speed: 125,
      criticalChance: 20,
      criticalDamage: 200,
      accuracy: 85,
      evasion: 20
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 20,
      teamPlayer: 15,
      ego: 75,
      mentalHealth: 35,
      communication: 25
    },
    battleAI: {
      aggression: 90,
      defensiveness: 20,
      riskTaking: 85,
      adaptability: 40,
      preferredStrategies: ['frenzied_assault', 'maim', 'howl_of_rage']
    },
    customization: {
      battleQuotes: [
        'The beast awakens!',
        'Raaargh!',
        'The moon... it burns!',
        'Get away from me!',
        '*A mournful, savage howl*', 
        'Can\'t... control it!'
      ]
    }
  },
  ursin: {
    name: 'Ursin',
    title: 'The Grizzled Guardian',
    avatar: '🐻',
    archetype: 'tank',
    rarity: 'rare',
    description: 'A woodsman living with a formidable curse that transforms him into a massive bear. Rather than succumbing to rage, he uses his form to act as a stoic guardian of the deep forests.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Lycanthropy Lore',
    personality: {
      traits: ['Stoic', 'Protective', 'Territorial', 'Solitary', 'Melancholy'],
      speechStyle: 'In human form, quiet and gruff. In bear form, deep, rumbling growls.',
      motivations: ['Protecting the forest', 'Keeping innocents away from his territory', 'Finding peace with his curse'],
      fears: ['Losing control to the beast', 'Hunters seeking a trophy', 'Wildfires'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 85,
      agility: 40,
      intelligence: 45,
      vitality: 95,
      wisdom: 65,
      charisma: 30
    },
    combatStats: {
      health: 1300,
      maxHealth: 1300,
      mana: 250,
      maxMana: 250,
      attack: 130,
      defense: 140,
      magicAttack: 10,
      magicDefense: 90,
      speed: 50,
      criticalChance: 10,
      criticalDamage: 160,
      accuracy: 80,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 40,
      teamPlayer: 60,
      ego: 50,
      mentalHealth: 55,
      communication: 35
    },
    battleAI: {
      aggression: 40,
      defensiveness: 90,
      riskTaking: 25,
      adaptability: 50,
      preferredStrategies: ['bodyguard_ally', 'maul', 'intimidating_roar']
    },
    customization: {
      battleQuotes: [
        '*A deep, rumbling growl*',
        'Leave this place!',
        'You threaten the balance.',
        'I am this forest\'s fury!',
        'You will not harm what I protect.',
        '*A roar that shakes the trees*'
      ]
    }
  },
  skabb: {
    name: 'Skabb',
    title: 'The Plague Skulker',
    avatar: '🐀',
    archetype: 'assassin',
    rarity: 'uncommon',
    description: 'A wretched creature of the sewers and slums, this wererat thrives in filth and darkness. It strikes from the shadows, its bite carrying a virulent disease.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Lycanthropy Lore',
    personality: {
      traits: ['Cunning', 'Cowardly', 'Opportunistic', 'Vicious', 'Filthy'],
      speechStyle: 'A series of nervous, high-pitched chatters, squeaks, and hisses.',
      motivations: ['Survival', 'Spreading filth and disease', 'Stealing scraps'],
      fears: ['Exterminators', 'Cleanliness', 'Open spaces', 'Cats'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 45,
      agility: 90,
      intelligence: 55,
      vitality: 70,
      wisdom: 40,
      charisma: 25
    },
    combatStats: {
      health: 750,
      maxHealth: 750,
      mana: 300,
      maxMana: 300,
      attack: 95,
      defense: 70,
      magicAttack: 40,
      magicDefense: 60,
      speed: 140,
      criticalChance: 20,
      criticalDamage: 175,
      accuracy: 90,
      evasion: 30
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 35,
      teamPlayer: 20,
      ego: 30,
      mentalHealth: 40,
      communication: 20
    },
    battleAI: {
      aggression: 70,
      defensiveness: 30,
      riskTaking: 80,
      adaptability: 60,
      preferredStrategies: ['hit_and_run', 'apply_poison', 'ambush_from_shadows']
    },
    customization: {
      battleQuotes: [
        '*Chattering squeak*',
        'Yes-yes, the filth!',
        'A bite for you!',
        'Stay in the shadows!',
        'Quick-quick, before they see!',
        '*A venomous hiss*'
      ]
    }
  },
  ignis_dragon: {
    name: 'Ignis',
    title: 'Flame Sovereign',
    avatar: '🐉',
    archetype: 'elementalist',
    rarity: 'legendary',
    description: 'A mighty, ancient winged reptile that embodies the raw power of the elements. Its scales are nearly impenetrable, and its breath is a torrent of pure fire.',
    historicalPeriod: 'N/A',
    mythology: 'Global Folklore',
    personality: {
      traits: ['Majestic', 'Fierce', 'Intelligent', 'Arrogant', 'Territorial'],
      speechStyle: 'A deep, commanding voice that rumbles with ancient power and wisdom',
      motivations: ['Hoarding treasure', 'Establishing dominance', 'The pursuit of ancient knowledge'],
      fears: ['True dragon slayers', 'Losing its hoard', 'A challenger to its might'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 90,
      agility: 75,
      intelligence: 95,
      vitality: 90,
      wisdom: 80,
      charisma: 70
    },
    combatStats: {
      health: 1500,
      maxHealth: 1500,
      mana: 800,
      maxMana: 800,
      attack: 170,
      defense: 160,
      magicAttack: 180,
      magicDefense: 140,
      speed: 120,
      criticalChance: 15,
      criticalDamage: 200,
      accuracy: 90,
      evasion: 15
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 30,
      teamPlayer: 20,
      ego: 95,
      mentalHealth: 80,
      communication: 65
    },
    battleAI: {
      aggression: 80,
      defensiveness: 50,
      riskTaking: 60,
      adaptability: 70,
      preferredStrategies: ['fire_breath', 'wing_storm', 'overwhelm']
    },
    customization: {
      battleQuotes: [
        'Bow before me!',
        'Burn to ash!',
        'You are but an insect.',
        'My wrath is fire and ruin!',
        'This hoard is mine!',
        'Feel the power of ages!'
      ]
    }
  },
  gemini: {
    name: 'Gemini',
    title: 'Gem Guardian',
    avatar: '🐢',
    archetype: 'tank',
    rarity: 'epic',
    description: 'A slow, ancient tortoise with a shell made of shimmering, magically-infused crystal. It can withstand tremendous punishment and even reflect magical attacks.',
    historicalPeriod: 'N/A',
    mythology: 'Original Magical Creature',
    personality: {
      traits: ['Resilient', 'Calm', 'Patient', 'Immovable', 'Ancient'],
      speechStyle: 'A slow, deep, and steady voice that sounds like grinding stone',
      motivations: ['Endurance', 'Protecting a sacred place', 'Quiet contemplation'],
      fears: ['Shattering', 'Sonic attacks', 'Being flipped over'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 75,
      agility: 10,
      intelligence: 60,
      vitality: 100,
      wisdom: 85,
      charisma: 40
    },
    combatStats: {
      health: 1800,
      maxHealth: 1800,
      mana: 400,
      maxMana: 400,
      attack: 110,
      defense: 200,
      magicAttack: 50,
      magicDefense: 180,
      speed: 20,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 70,
      evasion: 0
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 60,
      teamPlayer: 70,
      ego: 25,
      mentalHealth: 95,
      communication: 40
    },
    battleAI: {
      aggression: 15,
      defensiveness: 100,
      riskTaking: 5,
      adaptability: 50,
      preferredStrategies: ['reflect_magic', 'shell_fortress', 'body_block']
    },
    customization: {
      battleQuotes: [
        'I endure all.',
        'Your strength breaks upon me.',
        'My shell is eternal.',
        'Haste is a fool\'s virtue.',
        'The earth holds me fast.',
        'I. Will. Not. Yield.'
      ]
    }
  },
  celeste: {
    name: 'Celeste',
    title: 'Celestial Messenger',
    avatar: '🐦',
    archetype: 'mystic',
    rarity: 'legendary',
    description: 'A mystical raven whose feathers glitter with trapped starlight. It is said to be a messenger of the cosmos, wielding cosmic magic and bearing cryptic prophecies.',
    historicalPeriod: 'N/A',
    mythology: 'Celestial Lore',
    personality: {
      traits: ['Mystical', 'Elusive', 'Wise', 'Enigmatic', 'Observant'],
      speechStyle: 'An ethereal, poetic voice that seems to echo from a great distance',
      motivations: ['Guiding fate', 'Exploring the cosmos', 'Delivering essential warnings'],
      fears: ['Cosmic silence', 'Cages', 'The end of starlight'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 40,
      agility: 95,
      intelligence: 90,
      vitality: 65,
      wisdom: 100,
      charisma: 70
    },
    combatStats: {
      health: 1000,
      maxHealth: 1000,
      mana: 1200,
      maxMana: 1200,
      attack: 80,
      defense: 90,
      magicAttack: 170,
      magicDefense: 160,
      speed: 170,
      criticalChance: 15,
      criticalDamage: 175,
      accuracy: 95,
      evasion: 40
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 50,
      teamPlayer: 40,
      ego: 60,
      mentalHealth: 85,
      communication: 75
    },
    battleAI: {
      aggression: 60,
      defensiveness: 50,
      riskTaking: 65,
      adaptability: 85,
      preferredStrategies: ['starfall', 'cosmic_veil', 'omen_of_weakness']
    },
    customization: {
      battleQuotes: [
        'The stars align!',
        'Fate shines upon me.',
        'A message from the void.',
        'You cannot catch what is written in light.',
        'Gaze into the firmament!',
        'A flicker in the darkness.'
      ]
    }
  },
  leviathan: {
    name: 'Leviathan',
    title: 'Sea\'s Wrath',
    avatar: '🐙',
    archetype: 'beast',
    rarity: 'legendary',
    description: 'A colossal, tentacled sea monster of Norse legend, said to dwell in the deepest trenches. It rises from the abyss to drag entire ships down to a watery grave.',
    historicalPeriod: 'N/A',
    mythology: 'Norse Folklore',
    personality: {
      traits: ['Fearsome', 'Unpredictable', 'Colossal', 'Ancient', 'Destructive'],
      speechStyle: 'Silence, punctuated by the deep rumble of the ocean\'s fury and the splintering of ships',
      motivations: ['Ruling the seas', 'Dragging things into the abyss', 'Enforcing the power of the deep'],
      fears: ['Shallow water', 'Ancient harpoons', 'Nothing known to mortals'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 100,
      agility: 40,
      intelligence: 50,
      vitality: 100,
      wisdom: 60,
      charisma: 50
    },
    combatStats: {
      health: 2500,
      maxHealth: 2500,
      mana: 500,
      maxMana: 500,
      attack: 200,
      defense: 150,
      magicAttack: 80,
      magicDefense: 110,
      speed: 60,
      criticalChance: 10,
      criticalDamage: 180,
      accuracy: 85,
      evasion: 5
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 10,
      teamPlayer: 10,
      ego: 90,
      mentalHealth: 90,
      communication: 5
    },
    battleAI: {
      aggression: 85,
      defensiveness: 60,
      riskTaking: 70,
      adaptability: 40,
      preferredStrategies: ['tentacle_crush', 'whirlpool', 'drag_under']
    },
    customization: {
      battleQuotes: [
        '...',
        'The deep claims you!',
        '*The sound of a thousand waves crashing*',
        'Flee, little ships.',
        'You have woken the abyss.',
        '*A colossal shadow falls over the battlefield*'
      ]
    }
  }
};,
  aura: {
    name: 'Aura',
    title: 'Winged Savior',
    avatar: ' Pegasus_Avatar ',
    archetype: 'support',
    rarity: 'epic',
    description: 'A divine winged stallion born of Greek myth. It soars through the heavens, aiding heroes with its noble spirit and bringing hope from above.',
    historicalPeriod: 'Mythological Greece',
    mythology: 'Greek',
    personality: {
      traits: ['Noble', 'Swift', 'Brave', 'Gentle', 'Free-spirited'],
      speechStyle: 'Communicates through inspiring neighs and a calming, ethereal presence',
      motivations: ['Aiding heroes', 'Freedom of the skies', 'Serving the gods'],
      fears: ['Cages', 'Being grounded', 'The corruption of its rider'],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 65,
      agility: 95,
      intelligence: 70,
      vitality: 75,
      wisdom: 80,
      charisma: 85
    },
    combatStats: {
      health: 1100,
      maxHealth: 1100,
      mana: 700,
      maxMana: 700,
      attack: 110,
      defense: 100,
      magicAttack: 130,
      magicDefense: 120,
      speed: 160,
      criticalChance: 10,
      criticalDamage: 150,
      accuracy: 90,
      evasion: 30
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 70,
      teamPlayer: 90,
      ego: 30,
      mentalHealth: 85,
      communication: 75
    },
    battleAI: {
      aggression: 30,
      defensiveness: 70,
      riskTaking: 40,
      adaptability: 80,
      preferredStrategies: ['aerial_support', 'healing_wind', 'divine_blessing']
    },
    customization: {
      battleQuotes: [
        'Rise with me!',
        'Wings of hope!',
        '*A triumphant, echoing neigh*',
        'The heavens answer the call!',
        'Fear not, for I am with you!',
        'Fly free from danger!'
      ]
    }
  }
};,
  town_guard: {
    name: 'Town Guard',
    title: 'Defender of the Realm',
    avatar: '🛡️',
    archetype: 'warrior',
    rarity: 'common',
    description: 'A steadfast protector of the town\'s peace.',
    historicalPeriod: 'Medieval Fantasy',
    mythology: 'Fantasy',
    personality: {
      traits: ['Loyal', 'Brave'],
      speechStyle: 'Formal, direct',
      motivations: ['Duty', 'Honor'],
      fears: [],
      relationships: []
    },
    level: 1,
    baseStats: {
      strength: 75,
      agility: 50,
      intelligence: 30,
      vitality: 80,
      wisdom: 30,
      charisma: 30
    },
    combatStats: {
      health: 850,
      maxHealth: 850,
      mana: 150,
      maxMana: 150,
      attack: 90,
      defense: 110,
      magicAttack: 20,
      magicDefense: 40,
      speed: 60,
      criticalChance: 5,
      criticalDamage: 150,
      accuracy: 85,
      evasion: 10
    },
    statPoints: 0,
    progressionTree: {
      branches: []
    },
    equippedItems: {},
    inventory: [],
    unlockedContent: [],
    achievements: [],
    trainingLevel: 60,
    bondLevel: 50,
    fatigue: 0,
    psychStats: {
      training: 80,
      teamPlayer: 75,
      ego: 20,
      mentalHealth: 80,
      communication: 60
    },
    battleAI: {
      aggression: 50,
      defensiveness: 80,
      riskTaking: 30,
      adaptability: 50,
      preferredStrategies: ['defend_objective', 'counter_attack', 'shield_wall']
    },
    customization: {
      battleQuotes: [
        'For the realm!',
        'Hold the line!'
      ]
    }
  }
};

// Character Database Functions
export function createCharacter(templateId: string, customizations?: Partial<Character>): Character {
  const template = characterTemplates[templateId];
  if (!template) {
    throw new Error(`Character template '${templateId}' not found`);
  }

  const character: Character = {
    id: `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    experience: {
      characterId: templateId,
      currentLevel: 1,
      currentXP: 0,
      totalXP: 0,
      xpToNextLevel: 1000,
      statPoints: 0,
      skillPoints: 0,
      milestoneRewards: [],
      levelHistory: [],
      lastUpdated: new Date()
    },
    skills: {
      characterId: templateId,
      coreSkills: {
        combat: { level: 1, experience: 0, maxLevel: 100 },
        survival: { level: 1, experience: 0, maxLevel: 100 },
        mental: { level: 1, experience: 0, maxLevel: 100 },
        social: { level: 1, experience: 0, maxLevel: 100 },
        spiritual: { level: 1, experience: 0, maxLevel: 100 }
      },
      signatureSkills: {},
      archetypeSkills: {},
      passiveAbilities: [],
      activeAbilities: [],
      unlockedNodes: [],
      skillPoints: 0,
      lastUpdated: new Date()
    },
    abilities: {
      characterId: templateId,
      equipped: { slot1: null, slot2: null, slot3: null, slot4: null },
      available: [],
      cooldowns: {},
      lastUpdated: new Date()
    },
    ...template,
    ...customizations
  };

  // Apply training improvements to psychStats - CRITICAL CONNECTION!
  applyTrainingImprovements(character, templateId);

  return character;
}

/**
 * Apply training improvements to character's psychStats
 * This connects the training system to battle psychology
 */
function applyTrainingImprovements(character: Character, templateId: string): void {
  // Only apply improvements if localStorage is available (browser environment)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // Skip during server-side rendering
  }
  
  // Get training improvements from localStorage (where training system stores them)
  const psychStatFields: (keyof Character['psychStats'])[] = ['training', 'teamPlayer', 'ego', 'mentalHealth', 'communication'];
  
  psychStatFields.forEach(statType => {
    const improvementKey = `${templateId}_${statType}_improvement`;
    const improvement = parseFloat(localStorage.getItem(improvementKey) || '0');
    
    if (Math.abs(improvement) > 0.1) { // Apply both positive and negative changes
      // Apply improvement to the character's psychStats
      const oldValue = character.psychStats[statType];
      const newValue = Math.max(0, Math.min(100, oldValue + improvement));
      character.psychStats[statType] = newValue;
      
      // Log the improvement for debugging
      const changeStr = improvement > 0 ? `+${improvement.toFixed(1)}` : improvement.toFixed(1);
      console.log(`Applied training/combat: ${character.name}'s ${statType} ${oldValue} → ${newValue.toFixed(1)} (${changeStr})`);
    }
  });
}

export function getCharacterById(characterId: string): Character | null {
  // In a real app, this would query a database
  // For now, return a demo character based on the ID
  const templateId = characterId.split('_')[0];
  if (characterTemplates[templateId]) {
    return createCharacter(templateId);
  }
  return null;
}

export function getAllCharacters(): Character[] {
  return Object.keys(characterTemplates).map(templateId => createCharacter(templateId));
}

export function getCharactersByArchetype(archetype: CharacterArchetype): Character[] {
  return getAllCharacters().filter(char => char.archetype === archetype);
}

export function getCharactersByRarity(rarity: CharacterRarity): Character[] {
  return getAllCharacters().filter(char => char.rarity === rarity);
}

export function calculateCharacterPower(character: Character): number {
  const { combatStats } = character;
  return Math.floor(
    (combatStats.attack + combatStats.defense + combatStats.magicAttack + combatStats.magicDefense) / 4 +
    (combatStats.maxHealth / 10) +
    (combatStats.maxMana / 20) +
    (character.level * 10)
  );
}

export function getCharacterUnlockRequirements(templateId: string): {
  level?: number;
  achievements?: string[];
  currency?: Record<string, number>;
  special?: string;
} {
  const requirements: Record<string, { description: string; hint: string }> = {
    achilles: { level: 1 }, // Starting character
    merlin: { level: 10, achievements: ['first_victory'] },
    loki: { level: 15, currency: { gems: 1000 } },
    fenrir: { level: 20, achievements: ['beast_master'] },
    cleopatra: { level: 25, currency: { gems: 2000 }, achievements: ['diplomatic_victory'] }
  };

  return requirements[templateId] || { level: 1 };
}

// Demo data
export function createDemoCharacterCollection(): Character[] {
  return [
    createCharacter('achilles'),
    createCharacter('merlin'),
    createCharacter('fenrir'),
    createCharacter('cleopatra'),
    createCharacter('holmes'),
    createCharacter('dracula'),
    createCharacter('joan'),
    createCharacter('frankenstein_monster'),
    createCharacter('sun_wukong'),
    createCharacter('sammy_slugger'),
    createCharacter('billy_the_kid'),
    createCharacter('genghis_khan'),
    createCharacter('tesla'),
    createCharacter('alien_grey'),
    createCharacter('robin_hood'),
    createCharacter('space_cyborg'),
    createCharacter('agent_x'),
    createCharacter('kaelan'),
    createCharacter('elara'),
    createCharacter('roric'),
    createCharacter('griselda'),
    createCharacter('orin'),
    createCharacter('vargr'),
    createCharacter('feste'),
    createCharacter('cassandra'),
    createCharacter('ignis'),
    createCharacter('aidan'),
    createCharacter('snarl'),
    createCharacter('clatter'),
    createCharacter('grak'),
    createCharacter('barkus'),
    createCharacter('gargan'),
    createCharacter('grom'),
    createCharacter('sir_kaelen'),
    createCharacter('musashi'),
    createCharacter('alexandros'),
    createCharacter('circe'),
    createCharacter('aethelred'),
    createCharacter('sniff'),
    createCharacter('aura'),
    createCharacter('riddle'),
    createCharacter('lyra'),
    createCharacter('borin'),
    createCharacter('malakor'),
    createCharacter('seraphina'),
    createCharacter('unit_734'),
    createCharacter('xylar'),
    createCharacter('skarr'),
    createCharacter('gloop'),
    createCharacter('lycan'),
    createCharacter('ursin'),
    createCharacter('skabb'),
    createCharacter('ignis_dragon'),
    createCharacter('gemini'),
    createCharacter('celeste'),
    createCharacter('leviathan')
  ];,
    createCharacter('town_guard')
  ];
}

// Export characters array for campaign and other systems
export const characters = createDemoCharacterCollection();
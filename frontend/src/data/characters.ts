// Comprehensive Character Database
// Full character stats, abilities, progression trees, and game data

import { CharacterExperience } from '../../../frontend/src/data/experience';
import { CharacterSkills } from '../../../frontend/src/data/characterProgression';
import { Equipment, allEquipment } from '../../../frontend/src/data/equipment';
import { Item } from '../../../frontend/src/data/items';

// Simple abilities type alias
export type CharacterAbilities = {
  active: string[];
  passive: string[];
  signature: string[];
};

export type CharacterArchetype =
  | 'warrior' | 'mage' | 'assassin' | 'tank' | 'support'
  | 'beast' | 'trickster' | 'mystic' | 'elementalist' | 'berserker' | 'scholar';

export type CharacterRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type StatType = 'strength' | 'agility' | 'intelligence' | 'vitality' | 'wisdom' | 'charisma';

// Financial Decision interface for character financial history
export interface FinancialDecision {
  id: string;
  characterId: string;
  amount: number;
  decision: 'investment' | 'real_estate' | 'luxury_purchase' | 'party' | 'wildcard' | 'other';
  outcome: 'positive' | 'negative' | 'neutral' | 'pending';
  coachAdvice?: string;
  followedAdvice: boolean;
  timestamp: Date;
  description: string;
  financialImpact: number; // How much money gained/lost
  stressImpact: number; // How much stress gained/lost
  relationshipImpact: number; // How it affected coach relationship
}

// Financial personality traits that are part of character templates (immutable)
export interface FinancialPersonality {
  spendingStyle: 'conservative' | 'moderate' | 'impulsive' | 'strategic';
  moneyMotivations: string[]; // ['glory', 'status', 'security', 'power', 'family']
  financialWisdom: number; // 0-100, base financial intelligence
  riskTolerance: number; // 0-100, willingness to take financial risks
  luxuryDesire: number; // 0-100, desire for expensive things
  generosity: number; // 0-100, willingness to spend on others
  financialTraumas: string[]; // Past financial experiences that shape behavior
  moneyBeliefs: string[]; // Core beliefs about money and wealth
}

export interface BaseStats {
  strength: number;      // Physical damage, carry capacity
  agility: number;       // Speed, dodge chance, critical hit
  intelligence: number;  // Mana, spell power, learning rate
  vitality: number;      // Health, stamina, resistance
  wisdom: number;        // Mana regen, experience gain
  charisma: number;      // Social abilities, leadership
}

// Traditional stats from TeamCharacter (battle system compatibility)
export interface TraditionalStats {
  strength: number;      // Physical damage output (0-100)
  vitality: number;      // HP and damage resistance (0-100)
  speed: number;         // Turn order, dodge chance (0-100)
  dexterity: number;     // Accuracy, critical chance (0-100)
  stamina: number;       // Actions per turn (0-100)
  intelligence: number;  // Spell power, tactics (0-100)
  charisma: number;      // Social attacks, inspiration (0-100)
  spirit: number;        // Special ability power (0-100)
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

// Battle-specific interfaces from TeamCharacter
export interface BattleAbility {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'special' | 'support';
  power: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  icon: string;
  mentalHealthRequired: number; // Minimum mental health to use reliably
}

export interface SpecialPower {
  id: string;
  name: string;
  type: 'passive' | 'active' | 'combo';
  description: string;
  effect: string;
  icon: string;
  cooldown: number;
  currentCooldown: number;
  teamPlayerRequired?: number; // Some abilities require teamwork
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

  // Financial Personality (immutable template data)
  financialPersonality: FinancialPersonality;

  // Financial System - Dynamic Data (runtime only)
  financials: {
    wallet: number;                    // Current money available
    monthlyEarnings: number;           // Average monthly income from battles
    financialStress: number;           // 0-100, stress from money issues
    coachFinancialTrust: number;       // 0-100, trust in coach's financial advice
    recentDecisions: FinancialDecision[];  // Recent financial choices made
    totalEarningsLifetime: number;     // Total money earned throughout career
    totalSpentLifetime: number;        // Total money spent throughout career
    financialGoals: string[];          // Personal financial aspirations
    moneyRelatedStress: number;        // 0-100, anxiety specifically about money
    lastFinancialDecision?: Date;      // When they last made a major financial choice
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

  // Battle-specific fields from TeamCharacter
  traditionalStats: TraditionalStats;          // Battle system stats
  temporaryStats: TraditionalStats;            // Coaching boosts (reset each battle)
  currentHp: number;                           // Current HP in battle
  maxHp: number;                              // Maximum HP in battle
  experienceToNext: number;                   // Experience needed for next level

  // Battle personality traits (different from main personality)
  personalityTraits: string[];                // ['Brilliant', 'Arrogant', etc.]
  speakingStyle: 'formal' | 'casual' | 'archaic' | 'technical' | 'poetic' | 'gruff' | 'mysterious';
  decisionMaking: 'logical' | 'emotional' | 'impulsive' | 'calculated';
  conflictResponse: 'aggressive' | 'diplomatic' | 'withdrawn' | 'manipulative';

  // Battle status
  statusEffects: string[];                    // Active status effects in battle
  injuries: string[];                         // Current injuries affecting performance
  restDaysNeeded: number;                     // Recovery time needed

  // Battle abilities (enhanced from abilities)
  battleAbilities: BattleAbility[];           // Battle-specific abilities with cooldowns
  specialPowers: SpecialPower[];              // Special powers with team requirements
}

// Character Templates (excluding runtime fields that get initialized when character is created)
export const characterTemplates: Record<string, Omit<Character, 'id' | 'experience' | 'skills' | 'abilities' | 'financials' | 'traditionalStats' | 'temporaryStats' | 'currentHp' | 'maxHp' | 'experienceToNext' | 'personalityTraits' | 'speakingStyle' | 'decisionMaking' | 'conflictResponse' | 'statusEffects' | 'injuries' | 'restDaysNeeded' | 'battleAbilities' | 'specialPowers' | 'financialPersonality' | 'traditionalStats' >> = {
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
        { characterId: 'dracula', relationship: 'rival', strength: -80, history: 'Ancient rivalry between warriors' },
        { characterId: 'joan', relationship: 'ally', strength: 60, history: 'Mutual respect for honor and courage' }
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
              type: 'ability',
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
        { characterId: 'joan', relationship: 'enemy', strength: -95, history: 'Historic relationship' },
        { characterId: 'holmes', relationship: 'rival', strength: -80, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'dracula', relationship: 'enemy', strength: -95, history: 'Historic relationship' },
        { characterId: 'holmes', relationship: 'ally', strength: 60, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'dracula', relationship: 'enemy', strength: -60, history: 'Historic relationship' },
        { characterId: 'joan', relationship: 'ally', strength: 40, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'merlin', relationship: 'rival', strength: -60, history: 'Historic relationship' },
        { characterId: 'achilles', relationship: 'ally', strength: 30, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'holmes', relationship: 'rival', strength: -55, history: 'Historic relationship' },
        { characterId: 'dracula', relationship: 'enemy', strength: -30, history: 'Historic relationship' },
        { characterId: 'robin_hood', relationship: 'ally', strength: 25, history: 'Historic relationship' },
        { characterId: 'billy_the_kid', relationship: 'ally', strength: 20, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'robin_hood', relationship: 'ally', strength: 40, history: 'Historic relationship' },
        { characterId: 'achilles', relationship: 'rival', strength: -30, history: 'Historic relationship' },
        { characterId: 'sammy_slugger', relationship: 'ally', strength: 20, history: 'Historic relationship' },
        { characterId: 'dracula', relationship: 'enemy', strength: -60, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'achilles', relationship: 'rival', strength: -70, history: 'Historic relationship' },
        { characterId: 'cleopatra', relationship: 'ally', strength: 40, history: 'Historic relationship' },
        { characterId: 'billy_the_kid', relationship: 'rival', strength: -30, history: 'Historic relationship' },
        { characterId: 'dracula', relationship: 'rival', strength: -25, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'alien_grey', relationship: 'ally', strength: 55, history: 'Historic relationship' },
        { characterId: 'frankenstein_monster', relationship: 'rival', strength: -40, history: 'Historic relationship' },
        { characterId: 'tesla', relationship: 'ally', strength: 30, history: 'Historic relationship' },
        { characterId: 'genghis_khan', relationship: 'ally', strength: 20, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'merlin', relationship: 'rival', strength: -60, history: 'Historic relationship' },
        { characterId: 'dracula', relationship: 'enemy', strength: -35, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'tesla', relationship: 'ally', strength: 65, history: 'Historic relationship' },
        { characterId: 'dracula', relationship: 'enemy', strength: -80, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'napoleon', relationship: 'rival', strength: -60, history: 'Historic relationship' },
        { characterId: 'joan', relationship: 'ally', strength: 50, history: 'Historic relationship' }
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
              type: 'ability',
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
        { characterId: 'holmes', relationship: 'rival', strength: 30, history: 'Historic relationship' },
        { characterId: 'dracula', relationship: 'enemy', strength: -40, history: 'Historic relationship' },
        { characterId: 'cleopatra', relationship: 'ally', strength: 25, history: 'Historic relationship' },
        { characterId: 'alien_grey', relationship: 'ally', strength: 20, history: 'Historic relationship' },
        { characterId: 'robin_hood', relationship: 'ally', strength: 15, history: 'Historic relationship' }
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
              type: 'ability',
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
  }
};

/**
 * Generate financial personality based on character archetype and traits
 */
function generateFinancialPersonality(templateId: string, archetype: CharacterArchetype): FinancialPersonality {
  const personalityMap: Record<string, Partial<FinancialPersonality>> = {
    // Warriors - Generally impulsive spenders focused on glory
    achilles: {
      spendingStyle: 'impulsive',
      moneyMotivations: ['glory', 'status', 'honor'],
      financialWisdom: 30,
      riskTolerance: 85,
      luxuryDesire: 70,
      generosity: 80,
      financialTraumas: ['Lost family fortune in war'],
      moneyBeliefs: ['Money is for glory', 'Wealth should serve honor', 'Riches come to the victorious']
    },
    // Mages - Strategic with money, focused on knowledge
    merlin: {
      spendingStyle: 'strategic',
      moneyMotivations: ['knowledge', 'power', 'legacy'],
      financialWisdom: 90,
      riskTolerance: 40,
      luxuryDesire: 30,
      generosity: 70,
      financialTraumas: [],
      moneyBeliefs: ['Wisdom is worth more than gold', 'Invest in knowledge', 'Money is a tool, not a goal']
    }
  };

  // Get specific personality or generate default based on archetype
  const specific = personalityMap[templateId];
  const defaultByArchetype: Record<CharacterArchetype, Partial<FinancialPersonality>> = {
    warrior: { spendingStyle: 'impulsive', riskTolerance: 80, luxuryDesire: 60 },
    mage: { spendingStyle: 'strategic', riskTolerance: 30, financialWisdom: 70 },
    assassin: { spendingStyle: 'strategic', riskTolerance: 60, luxuryDesire: 40 },
    tank: { spendingStyle: 'conservative', riskTolerance: 20, generosity: 80 },
    support: { spendingStyle: 'moderate', riskTolerance: 40, generosity: 90 },
    beast: { spendingStyle: 'impulsive', riskTolerance: 70, financialWisdom: 20 },
    trickster: { spendingStyle: 'strategic', riskTolerance: 90, luxuryDesire: 50 },
    mystic: { spendingStyle: 'strategic', riskTolerance: 50, financialWisdom: 80 },
    elementalist: { spendingStyle: 'moderate', riskTolerance: 60, luxuryDesire: 40 },
    berserker: { spendingStyle: 'impulsive', riskTolerance: 95, financialWisdom: 10 },
    scholar: { spendingStyle: 'conservative', riskTolerance: 20, financialWisdom: 95 }
  };

  const base = defaultByArchetype[archetype] || defaultByArchetype.warrior;

  return {
    spendingStyle: specific?.spendingStyle || base.spendingStyle || 'moderate',
    moneyMotivations: specific?.moneyMotivations || ['security', 'status'],
    financialWisdom: specific?.financialWisdom || base.financialWisdom || 50,
    riskTolerance: specific?.riskTolerance || base.riskTolerance || 50,
    luxuryDesire: specific?.luxuryDesire || base.luxuryDesire || 50,
    generosity: specific?.generosity || base.generosity || 50,
    financialTraumas: specific?.financialTraumas || [],
    moneyBeliefs: specific?.moneyBeliefs || ['Money provides security', 'Save for the future']
  };
}

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
      levelHistory: [],
      xpHistory: []
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
      unlockedNodes: []
    },
    abilities: {
      active: [],
      passive: [],
      signature: []
    },
    ...template,
    // Add missing required properties
    traditionalStats: {
      strength: template.baseStats.strength,
      vitality: template.baseStats.vitality,
      speed: template.baseStats.agility,
      dexterity: template.baseStats.agility,
      stamina: template.baseStats.vitality,
      intelligence: template.baseStats.intelligence,
      charisma: template.baseStats.charisma,
      spirit: template.baseStats.wisdom
    },
    temporaryStats: {
      strength: 0,
      vitality: 0,
      speed: 0,
      dexterity: 0,
      stamina: 0,
      intelligence: 0,
      charisma: 0,
      spirit: 0
    },
    // Add other missing battle system properties
    currentHp: template.combatStats.health,
    maxHp: template.combatStats.maxHealth,
    experienceToNext: 1000,
    personalityTraits: template.personality.traits,
    speakingStyle: 'formal',
    decisionMaking: 'logical',
    conflictResponse: 'aggressive',
    statusEffects: [],
    injuries: [],
    restDaysNeeded: 0,
    battleAbilities: [],
    specialPowers: [],
    // Generate financial personality based on character template
    financialPersonality: generateFinancialPersonality(templateId, template.archetype),
    // Initialize dynamic financial data
    financials: {
      wallet: Math.floor(Math.random() * 5000) + 1000, // $1k-$6k starting money
      monthlyEarnings: 0, // Will be calculated from battle history
      financialStress: Math.floor(Math.random() * 20), // Low initial stress (0-20%)
      coachFinancialTrust: 60 + Math.floor(Math.random() * 20), // 60-80% initial trust
      recentDecisions: [],
      totalEarningsLifetime: 0,
      totalSpentLifetime: 0,
      financialGoals: [], // Will be populated based on personality
      moneyRelatedStress: Math.floor(Math.random() * 15), // Very low initial money stress
      lastFinancialDecision: undefined
    },
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
  const requirements: Record<string, {
    level?: number;
    achievements?: string[];
    currency?: Record<string, number>;
    special?: string;
  }> = {
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
    createCharacter('agent_x')
  ];
}

// Export characters array for campaign and other systems
export const characters = createDemoCharacterCollection();

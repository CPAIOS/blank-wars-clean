// Weapons and Equipment System for _____ Wars
// Comprehensive gear system with stats, rarities, and archetype specialization

import { historicalWeapons } from './historical_weapons';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type WeaponType = 'sword' | 'bow' | 'staff' | 'dagger' | 'hammer' | 'claws' | 'orb' | 'shield' | 'spear' | 'crown' | 'whip' | 'sonic' | 'club' | 'cane' | 'revolver' | 'rifle' | 'chalice' | 'generator' | 'cudgel' | 'tommy_gun' | 'fedora' | 'knife' | 'coil' | 'cannon' | 'energy_blade' | 'plasma_rifle' | 'disruptor' | 'probe_staff' | 'mind_control' | 'reality_warper' | 'pistol' | 'briefcase' | 'cloak' | 'banner' | 'knuckles' | 'rod';
export type ArmorType = 'light' | 'medium' | 'heavy' | 'robes' | 'leather' | 'plate';
export type AccessoryType = 'ring' | 'amulet' | 'charm' | 'relic' | 'tome' | 'trinket';
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface EquipmentStats {
  atk?: number;
  def?: number;
  spd?: number;
  hp?: number;
  critRate?: number;
  critDamage?: number;
  accuracy?: number;
  evasion?: number;
  energyRegen?: number;
  xpBonus?: number;
}

export interface EquipmentEffect {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'trigger';
  trigger?: 'battle_start' | 'turn_start' | 'on_hit' | 'on_crit' | 'on_kill' | 'low_hp';
  value?: number;
  duration?: number;
  cooldown?: number;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  type: WeaponType | ArmorType | AccessoryType;
  rarity: EquipmentRarity;
  level: number;
  requiredLevel: number;
  requiredArchetype?: string[];
  preferredCharacter?: string;
  stats: EquipmentStats;
  effects: EquipmentEffect[];
  icon: string;
  image?: string;
  flavor: string;
  obtainMethod: 'shop' | 'craft' | 'drop' | 'quest' | 'event' | 'premium';
  price?: number;
  craftingMaterials?: { item: string; quantity: number }[];
}

// Rarity configuration
export const rarityConfig: Record<EquipmentRarity, {
  name: string;
  color: string;
  textColor: string;
  statMultiplier: number;
  dropRate: number;
  icon: string;
  glow: string;
}> = {
  common: {
    name: 'Common',
    color: 'from-gray-500 to-gray-600',
    textColor: 'text-gray-300',
    statMultiplier: 1.0,
    dropRate: 0.6,
    icon: '⚪',
    glow: 'shadow-gray-500/50'
  },
  uncommon: {
    name: 'Uncommon',
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-300',
    statMultiplier: 1.2,
    dropRate: 0.25,
    icon: '🟢',
    glow: 'shadow-green-500/50'
  },
  rare: {
    name: 'Rare',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-300',
    statMultiplier: 1.5,
    dropRate: 0.1,
    icon: '🔵',
    glow: 'shadow-blue-500/50'
  },
  epic: {
    name: 'Epic',
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-300',
    statMultiplier: 2.0,
    dropRate: 0.04,
    icon: '🟣',
    glow: 'shadow-purple-500/50'
  },
  legendary: {
    name: 'Legendary',
    color: 'from-yellow-500 to-orange-600',
    textColor: 'text-yellow-300',
    statMultiplier: 3.0,
    dropRate: 0.009,
    icon: '🟡',
    glow: 'shadow-yellow-500/50'
  },
  mythic: {
    name: 'Mythic',
    color: 'from-pink-500 via-purple-500 to-blue-500',
    textColor: 'text-pink-300',
    statMultiplier: 5.0,
    dropRate: 0.001,
    icon: '🌟',
    glow: 'shadow-pink-500/50'
  }
};

// Equipment database
export const weapons: Equipment[] = [
  // === CHARACTER-SPECIFIC HISTORICAL WEAPONS ===
  // Note: Character-specific weapons are now imported from historical_weapons.ts
  
  // ACHILLES - Ancient Greece (moved to historical_weapons.ts)
  {
    id: 'iron_sword_achilles',
    name: 'Iron Sword of Troy', 
    description: 'A masterfully forged iron blade from the siege of Troy',
    slot: 'weapon',
    type: 'sword',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'achilles',
    stats: { atk: 35, critRate: 15, spd: 5 },
    effects: [
      {
        id: 'trojan_might',
        name: 'Trojan Might',
        description: '+20% damage against defenders',
        type: 'passive',
        value: 20
      }
    ],
    icon: '⚔️',
    flavor: 'Forged in the flames of a ten-year war',
    obtainMethod: 'quest'
  },
  {
    id: 'shield_invulnerability',
    name: 'Shield of Invulnerability',
    description: 'The divine shield that makes its bearer nearly untouchable',
    slot: 'weapon',
    type: 'shield',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'achilles',
    stats: { atk: 25, def: 50, hp: 100 },
    effects: [
      {
        id: 'divine_protection',
        name: 'Divine Protection',
        description: '15% chance to completely negate damage',
        type: 'trigger',
        trigger: 'on_hit',
        value: 15
      }
    ],
    icon: '🛡️',
    flavor: 'Blessed by Thetis and forged by Hephaestus himself',
    obtainMethod: 'event'
  },

  // CLEOPATRA - Ptolemaic Egypt
  {
    id: 'ceremonial_dagger',
    name: 'Ceremonial Dagger',
    description: 'An ornate dagger used in royal ceremonies',
    slot: 'weapon',
    type: 'dagger',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['assassin', 'mage'],
    preferredCharacter: 'cleopatra',
    stats: { atk: 12, critRate: 20 },
    effects: [],
    icon: '🗡️',
    flavor: 'Sharp enough to cut through political intrigue',
    obtainMethod: 'shop',
    price: 80
  },
  {
    id: 'royal_khopesh',
    name: 'Royal Khopesh',
    description: 'The curved sword of Egyptian royalty',
    slot: 'weapon',
    type: 'sword',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['assassin', 'mage'],
    preferredCharacter: 'cleopatra',
    stats: { atk: 32, critRate: 25, magicAttack: 15 },
    effects: [
      {
        id: 'pharaohs_command',
        name: 'Pharaoh\'s Command',
        description: 'Attacks may charm enemies for 1 turn',
        type: 'trigger',
        trigger: 'on_crit',
        value: 30
      }
    ],
    icon: '🏺',
    flavor: 'Symbol of divine authority over the Nile',
    obtainMethod: 'craft'
  },
  {
    id: 'serpent_crown',
    name: 'Serpent Crown of the Nile',
    description: 'Ancient crown that strikes like a cobra',
    slot: 'weapon',
    type: 'crown',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['assassin', 'mage'],
    preferredCharacter: 'cleopatra',
    stats: { atk: 28, magicAttack: 45, critRate: 30 },
    effects: [
      {
        id: 'asp_strike',
        name: 'Asp Strike',
        description: 'Critical hits inflict poison damage over time',
        type: 'trigger',
        trigger: 'on_crit',
        value: 25
      }
    ],
    icon: '👑',
    flavor: 'The last pharaoh\'s final weapon',
    obtainMethod: 'event'
  },

  // FENRIR - Norse Age
  {
    id: 'reinforced_claws',
    name: 'Reinforced Claws',
    description: 'Iron caps fitted over natural claws',
    slot: 'weapon',
    type: 'claws',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['beast'],
    preferredCharacter: 'fenrir',
    stats: { atk: 16, spd: 8, critRate: 15 },
    effects: [],
    icon: '🐾',
    flavor: 'Simple but effective enhancement to natural weapons',
    obtainMethod: 'shop',
    price: 100
  },
  {
    id: 'chain_whip',
    name: 'Broken Chain Whip',
    description: 'The chains that once bound the great wolf, now a weapon',
    slot: 'weapon',
    type: 'whip',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['beast'],
    preferredCharacter: 'fenrir',
    stats: { atk: 30, spd: 12, accuracy: 20 },
    effects: [
      {
        id: 'binding_strike',
        name: 'Binding Strike',
        description: 'Attacks may reduce enemy speed for 2 turns',
        type: 'trigger',
        trigger: 'on_hit',
        value: 25
      }
    ],
    icon: '⛓️',
    flavor: 'Freedom forged into a weapon of vengeance',
    obtainMethod: 'quest'
  },
  {
    id: 'ragnarok_howl',
    name: 'Ragnarök Howl',
    description: 'A devastating sonic weapon that brings the end of worlds',
    slot: 'weapon',
    type: 'sonic',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['beast'],
    preferredCharacter: 'fenrir',
    stats: { atk: 55, spd: 20, accuracy: 100 },
    effects: [
      {
        id: 'world_ender',
        name: 'World Ender',
        description: 'Attacks hit all enemies and reduce their defense',
        type: 'passive',
        value: 30
      }
    ],
    icon: '🌪️',
    flavor: 'The sound that will herald the twilight of the gods',
    obtainMethod: 'event'
  },

  // SHERLOCK HOLMES - Victorian England
  {
    id: 'police_club_holmes',
    name: 'Police Billy Club',
    description: 'Standard Victorian police truncheon',
    slot: 'weapon',
    type: 'club',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['assassin', 'support'],
    preferredCharacter: 'sherlock_holmes',
    stats: { atk: 13, accuracy: 20 },
    effects: [],
    icon: '🥢',
    flavor: 'The long arm of the law in compact form',
    obtainMethod: 'shop',
    price: 50
  },
  {
    id: 'sword_cane_holmes',
    name: 'Gentleman\'s Sword Cane',
    description: 'Concealed blade within a walking stick',
    slot: 'weapon',
    type: 'cane',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['assassin', 'support'],
    preferredCharacter: 'sherlock_holmes',
    stats: { atk: 28, critRate: 30, accuracy: 25 },
    effects: [
      {
        id: 'surprise_strike',
        name: 'Surprise Strike',
        description: 'First attack each battle is guaranteed critical',
        type: 'trigger',
        trigger: 'battle_start',
        value: 100
      }
    ],
    icon: '🦯',
    flavor: 'Elementary, my dear Watson - the blade was hidden all along',
    obtainMethod: 'craft'
  },
  {
    id: 'minds_eye_revolver',
    name: 'Mind\'s Eye Revolver',
    description: 'A revolver enhanced by deductive reasoning',
    slot: 'weapon',
    type: 'revolver',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['assassin', 'support'],
    preferredCharacter: 'sherlock_holmes',
    stats: { atk: 45, critRate: 40, accuracy: 50 },
    effects: [
      {
        id: 'deductive_aim',
        name: 'Deductive Aim',
        description: 'Each successful hit increases accuracy and crit chance',
        type: 'trigger',
        trigger: 'on_hit',
        value: 10
      }
    ],
    icon: '🔫',
    flavor: 'When you eliminate the impossible, only the target remains',
    obtainMethod: 'event'
  },

  // COUNT DRACULA - Transylvania
  {
    id: 'victorian_cane_dracula',
    name: 'Victorian Walking Cane',
    description: 'An elegant cane befitting a nobleman',
    slot: 'weapon',
    type: 'cane',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['mage', 'assassin'],
    preferredCharacter: 'count_dracula',
    stats: { atk: 11, magicAttack: 8 },
    effects: [],
    icon: '🦯',
    flavor: 'Sophisticated and deadly in equal measure',
    obtainMethod: 'shop',
    price: 70
  },
  {
    id: 'blood_chalice',
    name: 'Chalice of Crimson',
    description: 'A goblet that thirsts for blood',
    slot: 'weapon',
    type: 'chalice',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['mage', 'assassin'],
    preferredCharacter: 'count_dracula',
    stats: { atk: 25, magicAttack: 35, hp: 20 },
    effects: [
      {
        id: 'life_drain',
        name: 'Life Drain',
        description: 'Attacks heal you for 25% of damage dealt',
        type: 'trigger',
        trigger: 'on_hit',
        value: 25
      }
    ],
    icon: '🍷',
    flavor: 'The essence of eternal life',
    obtainMethod: 'quest'
  },
  {
    id: 'bat_swarm_cloak',
    name: 'Cloak of a Thousand Bats',
    description: 'A cloak that transforms into a swarm of bats',
    slot: 'weapon',
    type: 'cloak',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['mage', 'assassin'],
    preferredCharacter: 'count_dracula',
    stats: { atk: 35, magicAttack: 50, evasion: 30 },
    effects: [
      {
        id: 'bat_swarm',
        name: 'Bat Swarm',
        description: 'Attacks may confuse enemies and reduce their accuracy',
        type: 'trigger',
        trigger: 'on_crit',
        value: 40
      }
    ],
    icon: '🦇',
    flavor: 'Children of the night, heed my call',
    obtainMethod: 'event'
  },

  // JOAN OF ARC - Medieval France
  {
    id: 'peasant_sword_joan',
    name: 'Peasant Sword',
    description: 'A simple but sturdy blade',
    slot: 'weapon',
    type: 'sword',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'joan_of_arc',
    stats: { atk: 16, def: 5 },
    effects: [],
    icon: '⚔️',
    flavor: 'Blessed by faith and determination',
    obtainMethod: 'shop',
    price: 90
  },
  {
    id: 'knights_lance_joan',
    name: 'Knight\'s Lance',
    description: 'A cavalry lance blessed by divine purpose',
    slot: 'weapon',
    type: 'spear',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'joan_of_arc',
    stats: { atk: 38, accuracy: 15, critRate: 20 },
    effects: [
      {
        id: 'divine_charge',
        name: 'Divine Charge',
        description: 'First attack deals +50% damage',
        type: 'trigger',
        trigger: 'battle_start',
        value: 50
      }
    ],
    icon: '🗡️',
    flavor: 'Guided by heavenly visions',
    obtainMethod: 'craft'
  },
  {
    id: 'banner_of_orleans',
    name: 'Banner of Orleans',
    description: 'The sacred banner that rallied France',
    slot: 'weapon',
    type: 'banner',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'joan_of_arc',
    stats: { atk: 40, def: 25, hp: 50 },
    effects: [
      {
        id: 'rally_cry',
        name: 'Rally Cry',
        description: 'Boosts all allies\' attack and defense for 5 turns',
        type: 'trigger',
        trigger: 'battle_start',
        value: 30
      }
    ],
    icon: '🏴',
    flavor: 'For God and France!',
    obtainMethod: 'event'
  },
  // === WARRIOR WEAPONS ===
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A reliable blade forged from quality iron',
    slot: 'weapon',
    type: 'sword',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['warrior', 'leader'],
    stats: { atk: 15, critRate: 5 },
    effects: [],
    icon: '⚔️',
    flavor: 'The backbone of any warrior\'s arsenal',
    obtainMethod: 'shop',
    price: 100
  },
  {
    id: 'flame_blade',
    name: 'Flame Blade',
    description: 'A sword wreathed in eternal flames',
    slot: 'weapon',
    type: 'sword',
    rarity: 'epic',
    level: 25,
    requiredLevel: 25,
    requiredArchetype: ['warrior'],
    stats: { atk: 45, critRate: 15, critDamage: 25 },
    effects: [
      {
        id: 'flame_strike',
        name: 'Flame Strike',
        description: 'Attacks have 20% chance to inflict burn damage',
        type: 'trigger',
        trigger: 'on_hit',
        value: 20
      }
    ],
    icon: '🔥',
    flavor: 'Forged in the heart of a volcano by master smiths',
    obtainMethod: 'craft'
  },
  {
    id: 'excalibur',
    name: 'Excalibur',
    description: 'The legendary sword of kings',
    slot: 'weapon',
    type: 'sword',
    rarity: 'mythic',
    level: 45,
    requiredLevel: 40,
    requiredArchetype: ['warrior', 'leader'],
    stats: { atk: 80, def: 20, critRate: 30, critDamage: 50, accuracy: 100 },
    effects: [
      {
        id: 'royal_authority',
        name: 'Royal Authority',
        description: 'Grants +50% damage vs evil enemies',
        type: 'passive',
        value: 50
      },
      {
        id: 'light_of_hope',
        name: 'Light of Hope',
        description: 'Heals 10% HP when landing critical hits',
        type: 'trigger',
        trigger: 'on_crit',
        value: 10
      }
    ],
    icon: '👑',
    flavor: 'Only the worthy may wield this blade of legends',
    obtainMethod: 'quest'
  },

  // === MAGE WEAPONS ===
  {
    id: 'apprentice_staff',
    name: 'Apprentice Staff',
    description: 'A simple wooden staff for aspiring mages',
    slot: 'weapon',
    type: 'staff',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['mage', 'scholar'],
    stats: { atk: 12, energyRegen: 2 },
    effects: [],
    icon: '🪄',
    flavor: 'Every great mage started with one of these',
    obtainMethod: 'shop',
    price: 80
  },
  {
    id: 'elemental_orb',
    name: 'Elemental Orb',
    description: 'A crystalline orb containing raw magical energy',
    slot: 'weapon',
    type: 'orb',
    rarity: 'rare',
    level: 20,
    requiredLevel: 18,
    requiredArchetype: ['mage'],
    stats: { atk: 35, energyRegen: 5, critRate: 20 },
    effects: [
      {
        id: 'elemental_mastery',
        name: 'Elemental Mastery',
        description: 'Spells cycle through fire, ice, and lightning elements',
        type: 'passive'
      }
    ],
    icon: '🔮',
    flavor: 'The elements bend to your will',
    obtainMethod: 'drop'
  },

  // === TRICKSTER WEAPONS ===
  {
    id: 'shadow_dagger',
    name: 'Shadow Dagger',
    description: 'A blade that seems to absorb light itself',
    slot: 'weapon',
    type: 'dagger',
    rarity: 'uncommon',
    level: 10,
    requiredLevel: 8,
    requiredArchetype: ['trickster'],
    stats: { atk: 20, spd: 8, critRate: 25 },
    effects: [
      {
        id: 'stealth_strike',
        name: 'Stealth Strike',
        description: 'First attack each battle deals +100% damage',
        type: 'trigger',
        trigger: 'battle_start',
        value: 100
      }
    ],
    icon: '🗡️',
    flavor: 'Strike from the shadows, vanish into the night',
    obtainMethod: 'craft'
  },

  // === BEAST WEAPONS ===
  {
    id: 'primal_claws',
    name: 'Primal Claws',
    description: 'Razor-sharp claws that enhance natural attacks',
    slot: 'weapon',
    type: 'claws',
    rarity: 'rare',
    level: 15,
    requiredLevel: 12,
    requiredArchetype: ['beast'],
    stats: { atk: 30, spd: 12, critRate: 20, critDamage: 30 },
    effects: [
      {
        id: 'feral_rage',
        name: 'Feral Rage',
        description: 'Attack speed increases by 10% each turn in combat',
        type: 'trigger',
        trigger: 'turn_start',
        value: 10
      }
    ],
    icon: '🐾',
    flavor: 'Embrace your primal nature',
    obtainMethod: 'drop'
  }
];

export const armor: Equipment[] = [
  // === LIGHT ARMOR ===
  {
    id: 'leather_vest',
    name: 'Leather Vest',
    description: 'Basic protection that doesn\'t hinder movement',
    slot: 'armor',
    type: 'leather',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    stats: { def: 8, spd: 2 },
    effects: [],
    icon: '🦺',
    flavor: 'Simple but effective protection',
    obtainMethod: 'shop',
    price: 75
  },
  {
    id: 'assassin_garb',
    name: 'Assassin\'s Garb',
    description: 'Dark clothing that aids in stealth operations',
    slot: 'armor',
    type: 'light',
    rarity: 'epic',
    level: 30,
    requiredLevel: 25,
    requiredArchetype: ['trickster'],
    stats: { def: 25, spd: 15, evasion: 20 },
    effects: [
      {
        id: 'shadow_step',
        name: 'Shadow Step',
        description: '+30% chance to avoid first attack each turn',
        type: 'passive',
        value: 30
      }
    ],
    icon: '🥷',
    flavor: 'Move like a shadow, strike like lightning',
    obtainMethod: 'quest'
  },

  // === HEAVY ARMOR ===
  {
    id: 'plate_mail',
    name: 'Plate Mail',
    description: 'Full body protection forged from steel',
    slot: 'armor',
    type: 'plate',
    rarity: 'uncommon',
    level: 15,
    requiredLevel: 12,
    requiredArchetype: ['warrior'],
    stats: { def: 25, hp: 20 },
    effects: [
      {
        id: 'armor_mastery',
        name: 'Armor Mastery',
        description: 'Reduces all damage by 3 points (minimum 1)',
        type: 'passive',
        value: 3
      }
    ],
    icon: '🛡️',
    flavor: 'Impenetrable defense for the frontline warrior',
    obtainMethod: 'craft'
  },

  // === MAGIC ROBES ===
  {
    id: 'archmage_robes',
    name: 'Archmage Robes',
    description: 'Magnificent robes woven with magical threads',
    slot: 'armor',
    type: 'robes',
    rarity: 'legendary',
    level: 40,
    requiredLevel: 35,
    requiredArchetype: ['mage', 'scholar'],
    stats: { def: 30, energyRegen: 10, xpBonus: 25 },
    effects: [
      {
        id: 'mana_shield',
        name: 'Mana Shield',
        description: 'Can spend energy to negate damage (2 energy = 1 damage)',
        type: 'passive'
      },
      {
        id: 'spell_echo',
        name: 'Spell Echo',
        description: '15% chance for spells to cast twice',
        type: 'trigger',
        trigger: 'on_hit',
        value: 15
      }
    ],
    icon: '🧙',
    flavor: 'The pinnacle of magical craftsmanship',
    obtainMethod: 'event'
  }
];

export const accessories: Equipment[] = [
  // === RINGS ===
  {
    id: 'power_ring',
    name: 'Ring of Power',
    description: 'A simple ring that enhances physical strength',
    slot: 'accessory',
    type: 'ring',
    rarity: 'common',
    level: 5,
    requiredLevel: 3,
    stats: { atk: 5 },
    effects: [],
    icon: '💍',
    flavor: 'Small but noticeable improvement',
    obtainMethod: 'shop',
    price: 150
  },
  {
    id: 'phoenix_feather',
    name: 'Phoenix Feather Charm',
    description: 'A charm made from a legendary phoenix feather',
    slot: 'accessory',
    type: 'charm',
    rarity: 'legendary',
    level: 35,
    requiredLevel: 30,
    stats: { hp: 50, energyRegen: 8 },
    effects: [
      {
        id: 'rebirth',
        name: 'Rebirth',
        description: 'Once per battle, revive with 50% HP when defeated',
        type: 'trigger',
        trigger: 'on_kill',
        cooldown: 1
      }
    ],
    icon: '🪶',
    flavor: 'Death is but a temporary setback',
    obtainMethod: 'event'
  },

  // === AMULETS ===
  {
    id: 'scholars_pendant',
    name: 'Scholar\'s Pendant',
    description: 'An amulet that enhances learning and wisdom',
    slot: 'accessory',
    type: 'amulet',
    rarity: 'rare',
    level: 20,
    requiredLevel: 15,
    requiredArchetype: ['scholar', 'mage'],
    stats: { xpBonus: 15, energyRegen: 3 },
    effects: [
      {
        id: 'quick_learner',
        name: 'Quick Learner',
        description: 'Gain +1 training point when leveling up',
        type: 'passive'
      }
    ],
    icon: '📿',
    flavor: 'Knowledge is the greatest treasure',
    obtainMethod: 'quest'
  }
];

// All equipment combined
export const allEquipment: Equipment[] = [...weapons, ...historicalWeapons, ...armor, ...accessories];

// Helper functions
export function getEquipmentBySlot(slot: EquipmentSlot): Equipment[] {
  return allEquipment.filter(item => item.slot === slot);
}

export function getEquipmentByRarity(rarity: EquipmentRarity): Equipment[] {
  return allEquipment.filter(item => item.rarity === rarity);
}

export function getEquipmentByArchetype(archetype: string): Equipment[] {
  return allEquipment.filter(item => 
    !item.requiredArchetype || item.requiredArchetype.includes(archetype)
  );
}

export function canEquip(equipment: Equipment, characterLevel: number, characterArchetype: string): boolean {
  const levelCheck = characterLevel >= equipment.requiredLevel;
  const archetypeCheck = !equipment.requiredArchetype || equipment.requiredArchetype.includes(characterArchetype);
  return levelCheck && archetypeCheck;
}

export function calculateEquipmentStats(equipment: Equipment[]): EquipmentStats {
  return equipment.reduce((total, item) => {
    const stats = item.stats;
    return {
      atk: (total.atk || 0) + (stats.atk || 0),
      def: (total.def || 0) + (stats.def || 0),
      spd: (total.spd || 0) + (stats.spd || 0),
      hp: (total.hp || 0) + (stats.hp || 0),
      critRate: (total.critRate || 0) + (stats.critRate || 0),
      critDamage: (total.critDamage || 0) + (stats.critDamage || 0),
      accuracy: (total.accuracy || 0) + (stats.accuracy || 0),
      evasion: (total.evasion || 0) + (stats.evasion || 0),
      energyRegen: (total.energyRegen || 0) + (stats.energyRegen || 0),
      xpBonus: (total.xpBonus || 0) + (stats.xpBonus || 0)
    };
  }, {});
}

export function getRandomEquipment(characterLevel: number, archetype: string): Equipment {
  const availableEquipment = allEquipment.filter(item => 
    canEquip(item, characterLevel, archetype)
  );
  
  // Weight by rarity drop rates
  const weightedPool: Equipment[] = [];
  availableEquipment.forEach(item => {
    const rarity = rarityConfig[item.rarity];
    const count = Math.ceil(rarity.dropRate * 100);
    for (let i = 0; i < count; i++) {
      weightedPool.push(item);
    }
  });
  
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

export function getCharacterSpecificWeapons(characterId: string): Equipment[] {
  return allEquipment.filter(item => 
    item.preferredCharacter === characterId && item.slot === 'weapon'
  );
}

export function getCharacterWeaponProgression(characterId: string): {
  basic: Equipment | null;
  elite: Equipment | null;
  legendary: Equipment | null;
} {
  const weapons = getCharacterSpecificWeapons(characterId);
  
  return {
    basic: weapons.find(w => w.rarity === 'common') || null,
    elite: weapons.find(w => w.rarity === 'rare') || null,
    legendary: weapons.find(w => w.rarity === 'legendary') || null
  };
}

export function getAllCharacterWeapons(): Record<string, Equipment[]> {
  const characterWeapons: Record<string, Equipment[]> = {};
  
  allEquipment
    .filter(item => item.slot === 'weapon' && item.preferredCharacter)
    .forEach(weapon => {
      const characterId = weapon.preferredCharacter!;
      if (!characterWeapons[characterId]) {
        characterWeapons[characterId] = [];
      }
      characterWeapons[characterId].push(weapon);
    });
  
  return characterWeapons;
}

// Equipment set bonuses (for future expansion)
export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  items: string[];
  bonuses: {
    pieces: number;
    stats: EquipmentStats;
    effects: EquipmentEffect[];
  }[];
}

export const equipmentSets: EquipmentSet[] = [
  {
    id: 'shadow_assassin',
    name: 'Shadow Assassin Set',
    description: 'Equipment favored by elite assassins',
    items: ['shadow_dagger', 'assassin_garb', 'stealth_ring'],
    bonuses: [
      {
        pieces: 2,
        stats: { spd: 10, critRate: 15 },
        effects: []
      },
      {
        pieces: 3,
        stats: { spd: 20, critRate: 25, evasion: 20 },
        effects: [
          {
            id: 'master_assassin',
            name: 'Master Assassin',
            description: 'First attack each battle is guaranteed critical hit',
            type: 'trigger',
            trigger: 'battle_start'
          }
        ]
      }
    ]
  }
];
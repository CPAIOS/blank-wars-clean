// Complete Historical Weapons for All 17 Characters
// Character-specific weapon progressions by era

import { Equipment } from './equipment';

export const historicalWeapons: Equipment[] = [
  // ACHILLES - Ancient Greece
  {
    id: 'bronze_spear_achilles',
    name: 'Bronze Spear',
    description: 'A sturdy bronze-tipped spear from the Trojan War era',
    slot: 'weapon',
    type: 'spear',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'achilles',
    stats: { atk: 18, accuracy: 10 },
    effects: [],
    icon: '🔱',
    flavor: 'The weapon of heroes in the age of bronze',
    obtainMethod: 'shop',
    price: 120
  },
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

  // MERLIN - Medieval Britain
  {
    id: 'wooden_staff_merlin',
    name: 'Wooden Staff',
    description: 'A simple oak staff for channeling magical energy',
    slot: 'weapon',
    type: 'staff',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['mage'],
    preferredCharacter: 'merlin',
    stats: { atk: 10, magicAttack: 20, energyRegen: 3 },
    effects: [],
    icon: '🪄',
    flavor: 'Every great wizard starts with humble beginnings',
    obtainMethod: 'shop',
    price: 75
  },
  {
    id: 'crystal_orb_merlin',
    name: 'Crystal Orb of Avalon',
    description: 'A mystical orb containing ancient British magic',
    slot: 'weapon',
    type: 'orb',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['mage'],
    preferredCharacter: 'merlin',
    stats: { atk: 15, magicAttack: 40, energyRegen: 8 },
    effects: [
      {
        id: 'foresight',
        name: 'Foresight',
        description: 'Spells have increased accuracy and critical chance',
        type: 'passive',
        value: 20
      }
    ],
    icon: '🔮',
    flavor: 'The future whispers its secrets to those who listen',
    obtainMethod: 'quest'
  },
  {
    id: 'excalibur_merlin',
    name: 'Excalibur (Creator\'s Version)',
    description: 'The legendary sword, wielded by its creator',
    slot: 'weapon',
    type: 'sword',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['mage'],
    preferredCharacter: 'merlin',
    stats: { atk: 45, magicAttack: 60, critRate: 25 },
    effects: [
      {
        id: 'creators_mastery',
        name: 'Creator\'s Mastery',
        description: 'Each spell cast increases sword damage for 3 turns',
        type: 'trigger',
        trigger: 'on_hit',
        value: 15
      }
    ],
    icon: '⚔️',
    flavor: 'The sword knows its maker\'s touch',
    obtainMethod: 'event'
  },

  // FENRIR - Norse Age (reinforced_claws moved to equipment.ts to avoid duplicate keys)
  {
    id: 'chain_whip_fenrir',
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

  // CLEOPATRA VII - Ptolemaic Egypt
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
    id: 'historical_peasant_sword_joan',
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

  // FRANKENSTEIN'S MONSTER - 19th Century
  {
    id: 'lab_hammer_monster',
    name: 'Laboratory Hammer',
    description: 'A heavy hammer from Dr. Frankenstein\'s lab',
    slot: 'weapon',
    type: 'hammer',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['tank', 'warrior'],
    preferredCharacter: 'frankensteins_monster',
    stats: { atk: 17, hp: 10 },
    effects: [],
    icon: '🔨',
    flavor: 'Tools of creation, repurposed for destruction',
    obtainMethod: 'shop',
    price: 110
  },
  {
    id: 'chain_shackles_monster',
    name: 'Broken Shackles',
    description: 'The chains that once bound the creature',
    slot: 'weapon',
    type: 'whip',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['tank', 'warrior'],
    preferredCharacter: 'frankensteins_monster',
    stats: { atk: 32, hp: 25, accuracy: 15 },
    effects: [
      {
        id: 'binding_terror',
        name: 'Binding Terror',
        description: 'Attacks may immobilize enemies for 1 turn',
        type: 'trigger',
        trigger: 'on_hit',
        value: 20
      }
    ],
    icon: '⛓️',
    flavor: 'Freedom written in broken metal',
    obtainMethod: 'quest'
  },
  {
    id: 'lightning_generator',
    name: 'Lightning Generator',
    description: 'The apparatus that gave the monster life',
    slot: 'weapon',
    type: 'generator',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['tank', 'warrior'],
    preferredCharacter: 'frankensteins_monster',
    stats: { atk: 50, hp: 40, magicAttack: 30 },
    effects: [
      {
        id: 'spark_of_life',
        name: 'Spark of Life',
        description: 'When health drops below 25%, fully restore health once per battle',
        type: 'trigger',
        trigger: 'low_hp',
        cooldown: 1
      }
    ],
    icon: '⚡',
    flavor: 'The power of creation and destruction intertwined',
    obtainMethod: 'event'
  },

  // SUN WUKONG - Ancient China
  {
    id: 'wooden_staff_wukong',
    name: 'Wooden Training Staff',
    description: 'A simple wooden training staff',
    slot: 'weapon',
    type: 'staff',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['warrior', 'trickster'],
    preferredCharacter: 'sun_wukong',
    stats: { atk: 15, spd: 5 },
    effects: [],
    icon: '🥢',
    flavor: 'Every master was once a beginner',
    obtainMethod: 'shop',
    price: 85
  },
  {
    id: 'iron_cudgel_wukong',
    name: 'Iron Cudgel',
    description: 'A heavy iron staff for serious combat',
    slot: 'weapon',
    type: 'cudgel',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['warrior', 'trickster'],
    preferredCharacter: 'sun_wukong',
    stats: { atk: 36, spd: 8, critRate: 15 },
    effects: [
      {
        id: 'monkey_agility',
        name: 'Monkey Agility',
        description: 'Each dodge increases attack speed for 2 turns',
        type: 'trigger',
        trigger: 'on_hit',
        value: 15
      }
    ],
    icon: '🪨',
    flavor: 'Strength and technique in perfect harmony',
    obtainMethod: 'craft'
  },
  {
    id: 'ruyi_jingu_bang',
    name: 'Ruyi Jingu Bang',
    description: 'The legendary size-changing golden staff',
    slot: 'weapon',
    type: 'staff',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['warrior', 'trickster'],
    preferredCharacter: 'sun_wukong',
    stats: { atk: 55, spd: 25, critRate: 30 },
    effects: [
      {
        id: 'size_mastery',
        name: 'Size Mastery',
        description: 'Can attack multiple enemies or focus all power on one',
        type: 'passive',
        value: 25
      }
    ],
    icon: '🪄',
    flavor: 'As the mind commands, so does the staff obey',
    obtainMethod: 'event'
  },

  // SAMMY SLUGGER - 1920s America
  {
    id: 'brass_knuckles_sammy',
    name: 'Brass Knuckles',
    description: 'Street fighter\'s weapon of choice',
    slot: 'weapon',
    type: 'knuckles',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['assassin', 'warrior'],
    preferredCharacter: 'sammy_slugger',
    stats: { atk: 14, critRate: 25 },
    effects: [],
    icon: '👊',
    flavor: 'For when words ain\'t enough',
    obtainMethod: 'shop',
    price: 65
  },
  {
    id: 'tommy_gun_sammy',
    name: 'Tommy Gun',
    description: 'The gangster\'s favorite automatic weapon',
    slot: 'weapon',
    type: 'tommy_gun',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['assassin', 'warrior'],
    preferredCharacter: 'sammy_slugger',
    stats: { atk: 42, accuracy: 20, spd: 10 },
    effects: [
      {
        id: 'spray_fire',
        name: 'Spray Fire',
        description: 'Can hit multiple enemies with reduced accuracy',
        type: 'passive',
        value: 3
      }
    ],
    icon: '🔫',
    flavor: 'Say hello to my little friend',
    obtainMethod: 'craft'
  },
  {
    id: 'fedora_of_shadows',
    name: 'Fedora of Shadows',
    description: 'A mystical hat that conceals the wearer',
    slot: 'weapon',
    type: 'fedora',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['assassin', 'warrior'],
    preferredCharacter: 'sammy_slugger',
    stats: { atk: 35, evasion: 40, critRate: 35 },
    effects: [
      {
        id: 'shadow_step',
        name: 'Shadow Step',
        description: 'First attack each turn has guaranteed critical and high evasion',
        type: 'trigger',
        trigger: 'turn_start',
        value: 50
      }
    ],
    icon: '🎩',
    flavor: 'The darkness is my ally',
    obtainMethod: 'event'
  },

  // BILLY THE KID - American West
  {
    id: 'bowie_knife_billy',
    name: 'Bowie Knife',
    description: 'A large frontier knife for close combat',
    slot: 'weapon',
    type: 'knife',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'billy_the_kid',
    stats: { atk: 14, spd: 7, critRate: 18 },
    effects: [],
    icon: '🔪',
    flavor: 'Sharp enough to settle any argument',
    obtainMethod: 'shop',
    price: 75
  },
  {
    id: 'colt_revolver_billy',
    name: 'Colt Single Action',
    description: 'The classic revolver of the American frontier',
    slot: 'weapon',
    type: 'revolver',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'billy_the_kid',
    stats: { atk: 40, accuracy: 25, critRate: 25 },
    effects: [
      {
        id: 'quick_draw',
        name: 'Quick Draw',
        description: 'High chance to attack first each turn',
        type: 'passive',
        value: 75
      }
    ],
    icon: '🔫',
    flavor: 'Faster than lightning, deadlier than thunder',
    obtainMethod: 'craft'
  },
  {
    id: 'dual_peacemakers',
    name: 'Dual Peacemakers',
    description: 'Twin revolvers for the fastest gun in the West',
    slot: 'weapon',
    type: 'revolver',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'billy_the_kid',
    stats: { atk: 45, accuracy: 40, critRate: 35, spd: 15 },
    effects: [
      {
        id: 'dual_wield',
        name: 'Dual Wield',
        description: 'Can attack twice per turn',
        type: 'passive',
        value: 2
      }
    ],
    icon: '🔫',
    flavor: 'Two guns, one legend',
    obtainMethod: 'event'
  },

  // GENGHIS KHAN - Mongol Empire
  {
    id: 'curved_saber_khan',
    name: 'Mongol Saber',
    description: 'A curved blade perfect for mounted combat',
    slot: 'weapon',
    type: 'sword',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'genghis_khan',
    stats: { atk: 16, spd: 6 },
    effects: [],
    icon: '⚔️',
    flavor: 'Swift as the wind across the steppes',
    obtainMethod: 'shop',
    price: 95
  },
  {
    id: 'composite_bow_khan',
    name: 'Mongol Composite Bow',
    description: 'A powerful bow designed for horseback archery',
    slot: 'weapon',
    type: 'bow',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'genghis_khan',
    stats: { atk: 38, accuracy: 30, spd: 10 },
    effects: [
      {
        id: 'mounted_archery',
        name: 'Mounted Archery',
        description: 'Attacks from range increase movement speed',
        type: 'trigger',
        trigger: 'on_hit',
        value: 20
      }
    ],
    icon: '🏹',
    flavor: 'Strike from afar, strike with precision',
    obtainMethod: 'craft'
  },
  {
    id: 'war_banner_khan',
    name: 'Khan\'s War Banner',
    description: 'The banner that united the tribes',
    slot: 'weapon',
    type: 'banner',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['warrior'],
    preferredCharacter: 'genghis_khan',
    stats: { atk: 42, def: 20, hp: 60 },
    effects: [
      {
        id: 'empire_builder',
        name: 'Empire Builder',
        description: 'All allies gain +25% attack and movement speed',
        type: 'passive',
        value: 25
      }
    ],
    icon: '🏴',
    flavor: 'Under this banner, the world trembles',
    obtainMethod: 'event'
  },

  // SPACE CYBORG - Far Future
  {
    id: 'energy_blade_vega',
    name: 'Plasma Energy Blade',
    description: 'A high-tech blade of pure energy',
    slot: 'weapon',
    type: 'energy_blade',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['warrior', 'assassin'],
    preferredCharacter: 'space_cyborg',
    stats: { atk: 18, spd: 8 },
    effects: [],
    icon: '⚡',
    flavor: 'Cutting through matter at the molecular level',
    obtainMethod: 'shop',
    price: 150
  },
  {
    id: 'plasma_rifle_vega',
    name: 'Quantum Plasma Rifle',
    description: 'Advanced energy weapon with targeting systems',
    slot: 'weapon',
    type: 'plasma_rifle',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['warrior', 'assassin'],
    preferredCharacter: 'space_cyborg',
    stats: { atk: 44, accuracy: 35, magicAttack: 20 },
    effects: [
      {
        id: 'targeting_system',
        name: 'Targeting System',
        description: 'Each miss increases accuracy for next shot',
        type: 'trigger',
        trigger: 'on_hit',
        value: 15
      }
    ],
    icon: '🔫',
    flavor: 'Precision calculated to the nanosecond',
    obtainMethod: 'craft'
  },
  {
    id: 'quantum_disruptor',
    name: 'Quantum Reality Disruptor',
    description: 'A weapon that breaks the laws of physics',
    slot: 'weapon',
    type: 'disruptor',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['warrior', 'assassin'],
    preferredCharacter: 'space_cyborg',
    stats: { atk: 60, magicAttack: 40, accuracy: 50 },
    effects: [
      {
        id: 'reality_fracture',
        name: 'Reality Fracture',
        description: 'Attacks ignore all defenses and may stun enemies',
        type: 'passive',
        value: 30
      }
    ],
    icon: '🌌',
    flavor: 'Where science ends, impossibility begins',
    obtainMethod: 'event'
  },

  // NIKOLA TESLA - 1856-1943
  {
    id: 'copper_rod_tesla',
    name: 'Copper Conducting Rod',
    description: 'A simple copper rod for electrical experiments',
    slot: 'weapon',
    type: 'rod',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['mage', 'support'],
    preferredCharacter: 'nikola_tesla',
    stats: { atk: 12, magicAttack: 15 },
    effects: [],
    icon: '🔶',
    flavor: 'Conductor of both electricity and innovation',
    obtainMethod: 'shop',
    price: 80
  },
  {
    id: 'tesla_coil',
    name: 'Tesla Coil',
    description: 'A device that harnesses electrical energy',
    slot: 'weapon',
    type: 'coil',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['mage', 'support'],
    preferredCharacter: 'nikola_tesla',
    stats: { atk: 25, magicAttack: 40, energyRegen: 10 },
    effects: [
      {
        id: 'electrical_discharge',
        name: 'Electrical Discharge',
        description: 'Attacks may chain to nearby enemies',
        type: 'trigger',
        trigger: 'on_hit',
        value: 40
      }
    ],
    icon: '⚡',
    flavor: 'The future is electric',
    obtainMethod: 'craft'
  },
  {
    id: 'wireless_energy_cannon',
    name: 'Wireless Energy Transmission Cannon',
    description: 'Tesla\'s ultimate invention weaponized',
    slot: 'weapon',
    type: 'cannon',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['mage', 'support'],
    preferredCharacter: 'nikola_tesla',
    stats: { atk: 40, magicAttack: 65, energyRegen: 15 },
    effects: [
      {
        id: 'wireless_energy',
        name: 'Wireless Energy',
        description: 'Can attack any enemy regardless of position, energizes allies',
        type: 'passive',
        value: 100
      }
    ],
    icon: '📡',
    flavor: 'Unlimited power, transmitted without wires',
    obtainMethod: 'event'
  },

  // ZETA RETICULAN - Extraterrestrial
  {
    id: 'probe_staff_zeta',
    name: 'Bio-Probe Staff',
    description: 'An alien device for studying organic life',
    slot: 'weapon',
    type: 'probe_staff',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['mage', 'support'],
    preferredCharacter: 'zeta_reticulan',
    stats: { atk: 10, magicAttack: 18 },
    effects: [],
    icon: '🛸',
    flavor: 'Technology beyond human comprehension',
    obtainMethod: 'shop',
    price: 120
  },
  {
    id: 'mind_control_device',
    name: 'Psychic Amplification Device',
    description: 'Enhances telepathic abilities',
    slot: 'weapon',
    type: 'mind_control',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['mage', 'support'],
    preferredCharacter: 'zeta_reticulan',
    stats: { atk: 20, magicAttack: 45, accuracy: 25 },
    effects: [
      {
        id: 'mind_control',
        name: 'Mind Control',
        description: 'May turn enemies against each other temporarily',
        type: 'trigger',
        trigger: 'on_crit',
        value: 25
      }
    ],
    icon: '🧠',
    flavor: 'Your thoughts are not your own',
    obtainMethod: 'craft'
  },
  {
    id: 'reality_warper',
    name: 'Dimensional Reality Warper',
    description: 'A device that bends space and time',
    slot: 'weapon',
    type: 'reality_warper',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['mage', 'support'],
    preferredCharacter: 'zeta_reticulan',
    stats: { atk: 30, magicAttack: 70, accuracy: 100 },
    effects: [
      {
        id: 'reality_shift',
        name: 'Reality Shift',
        description: 'Can teleport, phase through attacks, or duplicate itself',
        type: 'passive',
        value: 50
      }
    ],
    icon: '🌀',
    flavor: 'What is real? What is possible? The distinction is irrelevant',
    obtainMethod: 'event'
  },

  // ROBIN HOOD - Medieval England
  {
    id: 'hunting_knife_robin',
    name: 'Forest Hunting Knife',
    description: 'A practical knife for forest survival',
    slot: 'weapon',
    type: 'knife',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'robin_hood',
    stats: { atk: 14, spd: 6, accuracy: 15 },
    effects: [],
    icon: '🔪',
    flavor: 'Sharp enough to carve arrows and cut purse strings',
    obtainMethod: 'shop',
    price: 60
  },
  {
    id: 'longbow_robin',
    name: 'Sherwood Longbow',
    description: 'A masterfully crafted English longbow',
    slot: 'weapon',
    type: 'bow',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'robin_hood',
    stats: { atk: 35, accuracy: 25, critRate: 20 },
    effects: [
      {
        id: 'precise_shot',
        name: 'Precise Shot',
        description: 'Critical hits ignore armor',
        type: 'trigger',
        trigger: 'on_crit',
        value: 100
      }
    ],
    icon: '🏹',
    flavor: 'Draw back the string and let justice fly',
    obtainMethod: 'craft'
  },
  {
    id: 'sherwood_quiver',
    name: 'Endless Quiver of Sherwood',
    description: 'Magical quiver that never runs out of arrows',
    slot: 'weapon',
    type: 'bow',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'robin_hood',
    stats: { atk: 50, accuracy: 40, critRate: 35 },
    effects: [
      {
        id: 'endless_arrows',
        name: 'Endless Arrows',
        description: 'Can attack multiple times per turn without penalty',
        type: 'passive',
        value: 2
      }
    ],
    icon: '🏹',
    flavor: 'As long as injustice exists, the arrows will never cease',
    obtainMethod: 'event'
  },

  // AGENT X - Modern/Contemporary
  {
    id: 'combat_knife_agent',
    name: 'Tactical Combat Knife',
    description: 'Military-grade knife for stealth operations',
    slot: 'weapon',
    type: 'knife',
    rarity: 'common',
    level: 1,
    requiredLevel: 1,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'agent_x',
    stats: { atk: 15, spd: 8, critRate: 20 },
    effects: [],
    icon: '🔪',
    flavor: 'Silent, swift, and deadly',
    obtainMethod: 'shop',
    price: 85
  },
  {
    id: 'silenced_pistol_agent',
    name: 'Silenced Pistol',
    description: 'High-tech pistol with noise suppression',
    slot: 'weapon',
    type: 'pistol',
    rarity: 'rare',
    level: 15,
    requiredLevel: 15,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'agent_x',
    stats: { atk: 38, accuracy: 30, critRate: 25 },
    effects: [
      {
        id: 'stealth_kill',
        name: 'Stealth Kill',
        description: 'Attacks from stealth deal +100% damage',
        type: 'trigger',
        trigger: 'battle_start',
        value: 100
      }
    ],
    icon: '🔫',
    flavor: 'The last sound they\'ll never hear',
    obtainMethod: 'craft'
  },
  {
    id: 'multi_tool_briefcase',
    name: 'Multi-Tool Briefcase',
    description: 'High-tech briefcase with hidden weapons and gadgets',
    slot: 'weapon',
    type: 'briefcase',
    rarity: 'legendary',
    level: 30,
    requiredLevel: 30,
    requiredArchetype: ['assassin'],
    preferredCharacter: 'agent_x',
    stats: { atk: 45, accuracy: 35, spd: 12, evasion: 20 },
    effects: [
      {
        id: 'gadget_master',
        name: 'Gadget Master',
        description: 'Can deploy different tools: shield, smoke bomb, or explosive',
        type: 'passive',
        value: 3
      }
    ],
    icon: '💼',
    flavor: 'A spy\'s best friend comes in many forms',
    obtainMethod: 'event'
  }
];
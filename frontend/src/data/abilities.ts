// Special Powers and Abilities System for _____ Wars
// Unique abilities for each character that define their combat identity

export type AbilityType = 'active' | 'passive' | 'ultimate' | 'combo';
export type AbilityTarget = 'self' | 'enemy' | 'all_enemies' | 'all_allies' | 'battlefield';
export type DamageType = 'physical' | 'magical' | 'true' | 'heal';

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'stat_modifier' | 'status_effect' | 'special';
  value: number;
  duration?: number; // turns
  target: AbilityTarget;
  damageType?: DamageType;
  stat?: 'atk' | 'def' | 'spd' | 'hp' | 'energy' | 'all';
  statusEffect?: 'burn' | 'freeze' | 'stun' | 'poison' | 'blind' | 'rage' | 'shield' | 'stealth';
}

export interface AbilityCost {
  energy: number;
  cooldown: number; // turns
  requirements?: {
    level?: number;
    hp_threshold?: number; // percentage (e.g., 50 = below 50% HP)
    combo_points?: number;
  };
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  characterId: string;
  archetype: string;
  icon: string;
  effects: AbilityEffect[];
  cost: AbilityCost;
  animation?: string;
  sound?: string;
  flavor: string;
  unlockLevel: number;
  maxRank: number;
  rankBonuses: {
    rank: number;
    improvements: string[];
  }[];
}

// === ACHILLES (Warrior) ===
export const achillesAbilities: Ability[] = [
  {
    id: 'achilles_wrath',
    name: 'Wrath of Achilles',
    description: 'Channel legendary fury to deal massive damage and gain temporary invulnerability',
    type: 'ultimate',
    characterId: 'achilles',
    archetype: 'warrior',
    icon: '⚔️',
    effects: [
      {
        type: 'damage',
        value: 200,
        target: 'enemy',
        damageType: 'physical'
      },
      {
        type: 'status_effect',
        value: 2,
        duration: 2,
        target: 'self',
        statusEffect: 'rage'
      },
      {
        type: 'stat_modifier',
        value: 50,
        duration: 3,
        target: 'self',
        stat: 'atk'
      }
    ],
    cost: {
      energy: 80,
      cooldown: 5,
      requirements: { level: 10 }
    },
    flavor: 'The rage of the greatest warrior burns like the fires of Troy',
    unlockLevel: 10,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['+50 damage', '+1 turn rage duration'] },
      { rank: 3, improvements: ['+100 damage', 'Heals 25% HP on kill'] }
    ]
  },
  {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Strike with shield to deal damage and stun the enemy',
    type: 'active',
    characterId: 'achilles',
    archetype: 'warrior',
    icon: '🛡️',
    effects: [
      {
        type: 'damage',
        value: 80,
        target: 'enemy',
        damageType: 'physical'
      },
      {
        type: 'status_effect',
        value: 1,
        duration: 1,
        target: 'enemy',
        statusEffect: 'stun'
      }
    ],
    cost: {
      energy: 25,
      cooldown: 3
    },
    flavor: 'A warrior\'s shield is both protection and weapon',
    unlockLevel: 5,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['+20 damage', '50% chance for 2-turn stun'] },
      { rank: 3, improvements: ['+40 damage', 'Reduces enemy speed by 20%'] }
    ]
  },
  {
    id: 'warrior_instinct',
    name: 'Warrior\'s Instinct',
    description: 'Passive ability that increases critical hit chance and damage',
    type: 'passive',
    characterId: 'achilles',
    archetype: 'warrior',
    icon: '👁️',
    effects: [
      {
        type: 'stat_modifier',
        value: 15,
        target: 'self',
        stat: 'atk'
      },
      {
        type: 'special',
        value: 20, // crit chance increase
        target: 'self'
      }
    ],
    cost: {
      energy: 0,
      cooldown: 0
    },
    flavor: 'Experience honed through countless battles',
    unlockLevel: 1,
    maxRank: 5,
    rankBonuses: [
      { rank: 2, improvements: ['+5% crit chance'] },
      { rank: 3, improvements: ['+10% crit damage'] },
      { rank: 4, improvements: ['+5% crit chance'] },
      { rank: 5, improvements: ['+15% crit damage', 'Crits heal 10% HP'] }
    ]
  }
];

// === MERLIN (Mage) ===
export const merlinAbilities: Ability[] = [
  {
    id: 'arcane_mastery',
    name: 'Arcane Mastery',
    description: 'Unleash devastating magical energy that pierces all defenses',
    type: 'ultimate',
    characterId: 'merlin',
    archetype: 'mage',
    icon: '🔮',
    effects: [
      {
        type: 'damage',
        value: 180,
        target: 'enemy',
        damageType: 'magical'
      },
      {
        type: 'damage',
        value: 60,
        target: 'all_enemies',
        damageType: 'magical'
      },
      {
        type: 'stat_modifier',
        value: 30,
        duration: 4,
        target: 'self',
        stat: 'energy'
      }
    ],
    cost: {
      energy: 70,
      cooldown: 6,
      requirements: { level: 12 }
    },
    flavor: 'The wisdom of ages channeled into pure magical force',
    unlockLevel: 12,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['+50 main damage', '+20 AoE damage'] },
      { rank: 3, improvements: ['+100 main damage', 'Ignores magical resistance'] }
    ]
  },
  {
    id: 'elemental_bolt',
    name: 'Elemental Bolt',
    description: 'Fire a bolt of elemental energy that applies random status effects',
    type: 'active',
    characterId: 'merlin',
    archetype: 'mage',
    icon: '⚡',
    effects: [
      {
        type: 'damage',
        value: 70,
        target: 'enemy',
        damageType: 'magical'
      },
      {
        type: 'special',
        value: 33, // 33% chance each for burn, freeze, or shock
        target: 'enemy'
      }
    ],
    cost: {
      energy: 30,
      cooldown: 2
    },
    flavor: 'The elements answer to those who understand their secrets',
    unlockLevel: 3,
    maxRank: 4,
    rankBonuses: [
      { rank: 2, improvements: ['+15 damage', '+10% status chance'] },
      { rank: 3, improvements: ['+25 damage', 'Can target 2 enemies'] },
      { rank: 4, improvements: ['+40 damage', 'Guaranteed status effect'] }
    ]
  },
  {
    id: 'mana_surge',
    name: 'Mana Surge',
    description: 'Passive ability that regenerates energy and boosts magical damage',
    type: 'passive',
    characterId: 'merlin',
    archetype: 'mage',
    icon: '💙',
    effects: [
      {
        type: 'special',
        value: 5, // energy per turn
        target: 'self'
      },
      {
        type: 'stat_modifier',
        value: 20,
        target: 'self',
        stat: 'energy'
      }
    ],
    cost: {
      energy: 0,
      cooldown: 0
    },
    flavor: 'Magic flows through you like a river of stars',
    unlockLevel: 1,
    maxRank: 5,
    rankBonuses: [
      { rank: 2, improvements: ['+1 energy per turn'] },
      { rank: 3, improvements: ['+10% magical damage'] },
      { rank: 4, improvements: ['+1 energy per turn'] },
      { rank: 5, improvements: ['+20% magical damage', 'Immune to silence'] }
    ]
  }
];

// === LOKI (Trickster) ===
export const lokiAbilities: Ability[] = [
  {
    id: 'chaos_unleashed',
    name: 'Chaos Unleashed',
    description: 'Create complete battlefield chaos with unpredictable but powerful effects',
    type: 'ultimate',
    characterId: 'loki',
    archetype: 'trickster',
    icon: '🎭',
    effects: [
      {
        type: 'special',
        value: 100, // chaos effect - random powerful ability
        target: 'battlefield'
      },
      {
        type: 'status_effect',
        value: 1,
        duration: 3,
        target: 'self',
        statusEffect: 'stealth'
      }
    ],
    cost: {
      energy: 75,
      cooldown: 7,
      requirements: { level: 15 }
    },
    flavor: 'When chaos reigns, the trickster is king',
    unlockLevel: 15,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['More powerful chaos effects', '+1 stealth turn'] },
      { rank: 3, improvements: ['Can trigger 2 chaos effects', 'Stealth grants +50% damage'] }
    ]
  },
  {
    id: 'shadow_clone',
    name: 'Shadow Clone',
    description: 'Create illusions that confuse enemies and deal surprise damage',
    type: 'active',
    characterId: 'loki',
    archetype: 'trickster',
    icon: '👥',
    effects: [
      {
        type: 'damage',
        value: 50,
        target: 'enemy',
        damageType: 'physical'
      },
      {
        type: 'status_effect',
        value: 1,
        duration: 2,
        target: 'enemy',
        statusEffect: 'blind'
      },
      {
        type: 'stat_modifier',
        value: 25,
        duration: 2,
        target: 'self',
        stat: 'spd'
      }
    ],
    cost: {
      energy: 35,
      cooldown: 3
    },
    flavor: 'Which one is real? Does it matter?',
    unlockLevel: 6,
    maxRank: 4,
    rankBonuses: [
      { rank: 2, improvements: ['+20 damage', '+1 blind turn'] },
      { rank: 3, improvements: ['+30 damage', 'Creates 2 clones'] },
      { rank: 4, improvements: ['+50 damage', 'Clones can crit for 200% damage'] }
    ]
  },
  {
    id: 'cunning',
    name: 'Cunning',
    description: 'Passive ability that provides evasion and counter-attack chances',
    type: 'passive',
    characterId: 'loki',
    archetype: 'trickster',
    icon: '🦊',
    effects: [
      {
        type: 'special',
        value: 25, // evasion chance
        target: 'self'
      },
      {
        type: 'special',
        value: 30, // counter-attack chance
        target: 'self'
      }
    ],
    cost: {
      energy: 0,
      cooldown: 0
    },
    flavor: 'The clever fox outsmarts the strong wolf',
    unlockLevel: 1,
    maxRank: 5,
    rankBonuses: [
      { rank: 2, improvements: ['+5% evasion'] },
      { rank: 3, improvements: ['+10% counter chance'] },
      { rank: 4, improvements: ['+5% evasion', '+5% counter chance'] },
      { rank: 5, improvements: ['Counter-attacks apply random debuff'] }
    ]
  }
];

// === ATHENA (Leader) ===
export const athenaAbilities: Ability[] = [
  {
    id: 'divine_strategy',
    name: 'Divine Strategy',
    description: 'Grant powerful buffs to all allies and debuff all enemies',
    type: 'ultimate',
    characterId: 'athena',
    archetype: 'leader',
    icon: '🦉',
    effects: [
      {
        type: 'stat_modifier',
        value: 40,
        duration: 4,
        target: 'all_allies',
        stat: 'all'
      },
      {
        type: 'stat_modifier',
        value: -25,
        duration: 3,
        target: 'all_enemies',
        stat: 'all'
      },
      {
        type: 'heal',
        value: 100,
        target: 'all_allies'
      }
    ],
    cost: {
      energy: 85,
      cooldown: 6,
      requirements: { level: 14 }
    },
    flavor: 'Wisdom and strategy triumph over brute force',
    unlockLevel: 14,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['+20% buff strength', '+1 turn duration'] },
      { rank: 3, improvements: ['+40% buff strength', 'Grants immunity to debuffs'] }
    ]
  },
  {
    id: 'tactical_strike',
    name: 'Tactical Strike',
    description: 'Precise attack that reduces enemy defenses and buffs ally damage',
    type: 'active',
    characterId: 'athena',
    archetype: 'leader',
    icon: '🎯',
    effects: [
      {
        type: 'damage',
        value: 85,
        target: 'enemy',
        damageType: 'physical'
      },
      {
        type: 'stat_modifier',
        value: -30,
        duration: 3,
        target: 'enemy',
        stat: 'def'
      },
      {
        type: 'stat_modifier',
        value: 20,
        duration: 2,
        target: 'all_allies',
        stat: 'atk'
      }
    ],
    cost: {
      energy: 40,
      cooldown: 4
    },
    flavor: 'Every strike serves a greater purpose',
    unlockLevel: 8,
    maxRank: 4,
    rankBonuses: [
      { rank: 2, improvements: ['+25 damage', '+10% defense reduction'] },
      { rank: 3, improvements: ['+40 damage', '+1 turn ally buff'] },
      { rank: 4, improvements: ['+60 damage', 'Marks enemy for +50% team damage'] }
    ]
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    description: 'Passive ability that boosts all allies and provides battle leadership',
    type: 'passive',
    characterId: 'athena',
    archetype: 'leader',
    icon: '⭐',
    effects: [
      {
        type: 'stat_modifier',
        value: 15,
        target: 'all_allies',
        stat: 'all'
      },
      {
        type: 'special',
        value: 10, // team energy regeneration
        target: 'all_allies'
      }
    ],
    cost: {
      energy: 0,
      cooldown: 0
    },
    flavor: 'A true leader lifts others to greatness',
    unlockLevel: 1,
    maxRank: 5,
    rankBonuses: [
      { rank: 2, improvements: ['+5% team stats'] },
      { rank: 3, improvements: ['+1 energy regen for team'] },
      { rank: 4, improvements: ['+10% team stats'] },
      { rank: 5, improvements: ['Team immune to fear/charm effects'] }
    ]
  }
];

// === ARISTOTLE (Scholar) ===
export const aristotleAbilities: Ability[] = [
  {
    id: 'perfect_knowledge',
    name: 'Perfect Knowledge',
    description: 'Analyze enemy weaknesses to deal true damage and gain tactical advantages',
    type: 'ultimate',
    characterId: 'aristotle',
    archetype: 'scholar',
    icon: '📜',
    effects: [
      {
        type: 'damage',
        value: 160,
        target: 'enemy',
        damageType: 'true'
      },
      {
        type: 'special',
        value: 100, // reveals all enemy abilities and cooldowns
        target: 'all_enemies'
      },
      {
        type: 'stat_modifier',
        value: 50,
        duration: 5,
        target: 'self',
        stat: 'all'
      }
    ],
    cost: {
      energy: 60,
      cooldown: 8,
      requirements: { level: 16 }
    },
    flavor: 'Knowledge is the ultimate weapon',
    unlockLevel: 16,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['+50 damage', 'Reveals enemy items/equipment'] },
      { rank: 3, improvements: ['+100 damage', 'Team gains +25% damage vs analyzed enemies'] }
    ]
  },
  {
    id: 'logical_deduction',
    name: 'Logical Deduction',
    description: 'Use logic to predict and counter enemy actions',
    type: 'active',
    characterId: 'aristotle',
    archetype: 'scholar',
    icon: '🧠',
    effects: [
      {
        type: 'special',
        value: 75, // chance to predict and counter next enemy ability
        target: 'self'
      },
      {
        type: 'stat_modifier',
        value: 30,
        duration: 2,
        target: 'self',
        stat: 'spd'
      },
      {
        type: 'heal',
        value: 50,
        target: 'self'
      }
    ],
    cost: {
      energy: 35,
      cooldown: 4
    },
    flavor: 'If A leads to B, then B leads to your defeat',
    unlockLevel: 7,
    maxRank: 4,
    rankBonuses: [
      { rank: 2, improvements: ['+15% counter chance', '+20 healing'] },
      { rank: 3, improvements: ['+25% counter chance', 'Counter deals damage'] },
      { rank: 4, improvements: ['Guaranteed counter', 'Counter silences enemy'] }
    ]
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    description: 'Passive ability that provides knowledge-based bonuses and energy efficiency',
    type: 'passive',
    characterId: 'aristotle',
    archetype: 'scholar',
    icon: '📚',
    effects: [
      {
        type: 'special',
        value: 25, // ability cost reduction
        target: 'self'
      },
      {
        type: 'stat_modifier',
        value: 20,
        target: 'self',
        stat: 'energy'
      },
      {
        type: 'special',
        value: 15, // XP gain bonus
        target: 'self'
      }
    ],
    cost: {
      energy: 0,
      cooldown: 0
    },
    flavor: 'The wise warrior wins before the battle begins',
    unlockLevel: 1,
    maxRank: 5,
    rankBonuses: [
      { rank: 2, improvements: ['+5% cost reduction'] },
      { rank: 3, improvements: ['+10% XP gain'] },
      { rank: 4, improvements: ['+10% cost reduction'] },
      { rank: 5, improvements: ['All abilities gain +1 max rank'] }
    ]
  }
];

// === FENRIR (Beast) ===
export const fenrirAbilities: Ability[] = [
  {
    id: 'ragnarok_howl',
    name: 'Ragnarok Howl',
    description: 'Unleash a primal howl that devastates all enemies and empowers the pack',
    type: 'ultimate',
    characterId: 'fenrir',
    archetype: 'beast',
    icon: '🐺',
    effects: [
      {
        type: 'damage',
        value: 120,
        target: 'all_enemies',
        damageType: 'physical'
      },
      {
        type: 'status_effect',
        value: 1,
        duration: 3,
        target: 'all_enemies',
        statusEffect: 'stun'
      },
      {
        type: 'stat_modifier',
        value: 60,
        duration: 4,
        target: 'all_allies',
        stat: 'atk'
      }
    ],
    cost: {
      energy: 90,
      cooldown: 6,
      requirements: { level: 18, hp_threshold: 50 }
    },
    flavor: 'The wolf that will devour the gods themselves',
    unlockLevel: 18,
    maxRank: 3,
    rankBonuses: [
      { rank: 2, improvements: ['+40 damage', '+1 stun turn'] },
      { rank: 3, improvements: ['+80 damage', 'Allies gain life steal for duration'] }
    ]
  },
  {
    id: 'pack_hunt',
    name: 'Pack Hunt',
    description: 'Coordinate with allies for devastating combination attacks',
    type: 'active',
    characterId: 'fenrir',
    archetype: 'beast',
    icon: '🏃',
    effects: [
      {
        type: 'damage',
        value: 90,
        target: 'enemy',
        damageType: 'physical'
      },
      {
        type: 'special',
        value: 50, // bonus damage per ally
        target: 'enemy'
      },
      {
        type: 'stat_modifier',
        value: 20,
        duration: 2,
        target: 'all_allies',
        stat: 'spd'
      }
    ],
    cost: {
      energy: 45,
      cooldown: 3
    },
    flavor: 'The pack that hunts together, wins together',
    unlockLevel: 9,
    maxRank: 4,
    rankBonuses: [
      { rank: 2, improvements: ['+30 base damage', '+10 per ally bonus'] },
      { rank: 3, improvements: ['+50 base damage', 'Can target 2 enemies'] },
      { rank: 4, improvements: ['+70 base damage', 'Allies join attack for 25% damage'] }
    ]
  },
  {
    id: 'primal_instinct',
    name: 'Primal Instinct',
    description: 'Passive ability that grows stronger as health decreases',
    type: 'passive',
    characterId: 'fenrir',
    archetype: 'beast',
    icon: '🔥',
    effects: [
      {
        type: 'special',
        value: 2, // +2% all stats per 1% HP missing
        target: 'self'
      },
      {
        type: 'special',
        value: 15, // life steal percentage
        target: 'self'
      }
    ],
    cost: {
      energy: 0,
      cooldown: 0
    },
    flavor: 'A wounded beast is the most dangerous prey',
    unlockLevel: 1,
    maxRank: 5,
    rankBonuses: [
      { rank: 2, improvements: ['+1% stat gain per HP missing'] },
      { rank: 3, improvements: ['+5% life steal'] },
      { rank: 4, improvements: ['+1% stat gain per HP missing'] },
      { rank: 5, improvements: ['Immune to death when below 10% HP for 1 turn'] }
    ]
  }
];

// All character abilities combined
export const allAbilities: Ability[] = [
  ...achillesAbilities,
  ...merlinAbilities,
  ...lokiAbilities,
  ...athenaAbilities,
  ...aristotleAbilities,
  ...fenrirAbilities
];

// Helper functions
export function getAbilitiesForCharacter(characterId: string): Ability[] {
  return allAbilities.filter(ability => ability.characterId === characterId);
}

export function getAbilitiesForArchetype(archetype: string): Ability[] {
  return allAbilities.filter(ability => ability.archetype === archetype);
}

export function getAvailableAbilities(characterId: string, level: number): Ability[] {
  return getAbilitiesForCharacter(characterId).filter(ability => ability.unlockLevel <= level);
}

export function canUseAbility(ability: Ability, characterState: {
  energy: number;
  level: number;
  hp: number;
  maxHp: number;
  cooldowns: Record<string, number>;
}): boolean {
  // Check energy
  if (characterState.energy < ability.cost.energy) return false;
  
  // Check level
  if (characterState.level < ability.unlockLevel) return false;
  
  // Check cooldown
  if (characterState.cooldowns[ability.id] > 0) return false;
  
  // Check requirements
  if (ability.cost.requirements) {
    const req = ability.cost.requirements;
    
    if (req.level && characterState.level < req.level) return false;
    
    if (req.hp_threshold) {
      const hpPercentage = (characterState.hp / characterState.maxHp) * 100;
      if (hpPercentage > req.hp_threshold) return false;
    }
  }
  
  return true;
}

export function calculateAbilityDamage(
  ability: Ability, 
  effect: AbilityEffect, 
  casterStats: { atk: number; def: number; spd: number },
  targetStats: { atk: number; def: number; spd: number }
): number {
  let baseDamage = effect.value;
  
  // Apply stat scaling based on damage type
  if (effect.damageType === 'physical') {
    baseDamage = baseDamage + (casterStats.atk * 0.5);
    // Physical damage reduced by defense
    baseDamage = Math.max(1, baseDamage - (targetStats.def * 0.3));
  } else if (effect.damageType === 'magical') {
    baseDamage = baseDamage + (casterStats.spd * 0.4); // mages use speed for magic power
    // Magical damage reduced by a portion of defense
    baseDamage = Math.max(1, baseDamage - (targetStats.def * 0.2));
  } else if (effect.damageType === 'true') {
    // True damage ignores defenses but still scales with stats
    baseDamage = baseDamage + (casterStats.atk * 0.3);
  }
  
  return Math.floor(baseDamage);
}

// Ability rank progression system
export interface AbilityProgress {
  abilityId: string;
  currentRank: number;
  experience: number;
  experienceToNext: number;
}

export function getExperienceToNextRank(currentRank: number): number {
  return currentRank * 100 + 200; // Increasing XP requirements
}

export function gainAbilityExperience(
  progress: AbilityProgress, 
  experienceGained: number
): { newProgress: AbilityProgress; rankUp: boolean } {
  const ability = allAbilities.find(a => a.id === progress.abilityId);
  if (!ability) return { newProgress: progress, rankUp: false };
  
  let newExperience = progress.experience + experienceGained;
  let newRank = progress.currentRank;
  let rankUp = false;
  
  // Check for rank up
  while (newExperience >= progress.experienceToNext && newRank < ability.maxRank) {
    newExperience -= progress.experienceToNext;
    newRank++;
    rankUp = true;
  }
  
  return {
    newProgress: {
      ...progress,
      currentRank: newRank,
      experience: newExperience,
      experienceToNext: getExperienceToNextRank(newRank)
    },
    rankUp
  };
}
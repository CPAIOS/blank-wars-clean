// Legendary Abilities System - Full 6-ability sets for all 17 characters
// Implements the detailed ability designs with cooldowns, power scaling, and special effects

export interface LegendaryAbility {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive' | 'ultimate';
  cooldown: number;
  manaCost: number;
  targetType: 'self' | 'ally' | 'enemy' | 'all_allies' | 'all_enemies' | 'all';
  effects: AbilityEffect[];
  requirements?: {
    level?: number;
    mentalHealth?: number;
    teamPlayer?: number;
  };
  icon: string;
}

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  value: number;
  duration?: number;
  condition?: string;
  scaling?: 'strength' | 'intelligence' | 'charisma' | 'level';
}

// === ACHILLES - THE UNDYING HERO ===
export const achillesAbilities: LegendaryAbility[] = [
  {
    id: 'wrath_of_achilles',
    name: 'Wrath of Achilles',
    description: 'Gains 10% attack and speed for every 25% HP lost. At <25% HP, attacks ignore enemy defense.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 10, condition: 'per_25_hp_lost' },
      { type: 'special', value: 1, condition: 'ignore_defense_below_25_hp' }
    ],
    icon: '⚔️'
  },
  {
    id: 'phalanx_breaker',
    name: 'Phalanx Breaker',
    description: 'Single-target charge that ignores all defense and stuns for 1 turn.',
    type: 'active',
    cooldown: 3,
    manaCost: 40,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 150, scaling: 'strength' },
      { type: 'special', value: 1, condition: 'ignore_defense' },
      { type: 'debuff', value: 1, duration: 1, condition: 'stun' }
    ],
    icon: '🛡️'
  },
  {
    id: 'heel_of_fate',
    name: 'Heel of Fate',
    description: 'Massive all-in attack—if it crits, instantly KOs target, but if it fails, Achilles is stunned for 1 turn.',
    type: 'active',
    cooldown: 4,
    manaCost: 60,
    targetType: 'enemy',
    requirements: { mentalHealth: 40 },
    effects: [
      { type: 'damage', value: 250, scaling: 'strength' },
      { type: 'special', value: 1, condition: 'instant_ko_on_crit' },
      { type: 'special', value: 1, condition: 'self_stun_on_miss' }
    ],
    icon: '🦶'
  },
  {
    id: 'battle_roar',
    name: 'Battle Roar',
    description: 'All allies gain +15% attack, +10% speed for 2 turns. If an ally is KOd, bonuses double next use.',
    type: 'active',
    cooldown: 3,
    manaCost: 35,
    targetType: 'all_allies',
    effects: [
      { type: 'buff', value: 15, duration: 2, condition: 'attack_boost' },
      { type: 'buff', value: 10, duration: 2, condition: 'speed_boost' },
      { type: 'special', value: 2, condition: 'double_if_ally_ko' }
    ],
    icon: '🗣️'
  },
  {
    id: 'heroic_stand',
    name: 'Heroic Stand',
    description: 'Reduces all incoming damage for team by 50% this turn; Achilles taunts all enemies.',
    type: 'active',
    cooldown: 4,
    manaCost: 50,
    targetType: 'all_allies',
    effects: [
      { type: 'buff', value: 50, duration: 1, condition: 'damage_reduction' },
      { type: 'special', value: 1, condition: 'taunt_all_enemies' }
    ],
    icon: '🛡️'
  },
  {
    id: 'legend_never_dies',
    name: 'Legend Never Dies',
    description: 'When defeated, revives at 35% HP with +20% attack and +20% damage resistance. Triggers once per battle.',
    type: 'ultimate',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 35, condition: 'revive_on_death' },
      { type: 'buff', value: 20, condition: 'attack_boost_on_revive' },
      { type: 'buff', value: 20, condition: 'damage_resistance_on_revive' }
    ],
    icon: '👑'
  }
];

// === MERLIN - ARCHMAGE OF LEGEND ===
export const merlinAbilities: LegendaryAbility[] = [
  {
    id: 'prophecy',
    name: 'Prophecy',
    description: '15% chance to dodge and gain 10 mana when targeted. At start of battle, reveals all enemy archetypes.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 15, condition: 'dodge_chance_with_mana' },
      { type: 'special', value: 1, condition: 'reveal_enemy_archetypes' }
    ],
    icon: '🔮'
  },
  {
    id: 'arcane_blast',
    name: 'Arcane Blast',
    description: 'Area attack that deals high magic damage. If 2+ enemies hit, 30% chance to silence one.',
    type: 'active',
    cooldown: 3,
    manaCost: 45,
    targetType: 'all_enemies',
    effects: [
      { type: 'damage', value: 120, scaling: 'intelligence' },
      { type: 'special', value: 30, condition: 'silence_if_multi_hit' }
    ],
    icon: '💥'
  },
  {
    id: 'time_reversal',
    name: 'Time Reversal',
    description: 'Rewind the last round for all (negates damage, resets buffs/debuffs applied that turn).',
    type: 'ultimate',
    cooldown: 0,
    manaCost: 80,
    targetType: 'all',
    effects: [
      { type: 'special', value: 1, condition: 'rewind_last_round' }
    ],
    icon: '⏰'
  },
  {
    id: 'foresight',
    name: 'Foresight',
    description: 'Reveal all enemy intended actions next turn. Allies gain +20% crit for 1 turn.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'all_allies',
    effects: [
      { type: 'special', value: 1, condition: 'reveal_enemy_actions' },
      { type: 'buff', value: 20, duration: 1, condition: 'crit_boost' }
    ],
    icon: '👁️'
  },
  {
    id: 'dragonfire_conjure',
    name: 'Dragonfire Conjure',
    description: 'Massive single-target or minor AoE fire attack. 50% chance to burn monsters/beasts.',
    type: 'active',
    cooldown: 4,
    manaCost: 55,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 180, scaling: 'intelligence' },
      { type: 'special', value: 50, condition: 'burn_monsters_beasts' }
    ],
    icon: '🔥'
  },
  {
    id: 'elders_counsel',
    name: "Elder's Counsel",
    description: 'When any ally is KOd, Merlin gains +25 magic attack and +20 wisdom (stacks).',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 25, condition: 'magic_attack_on_ally_ko' },
      { type: 'buff', value: 20, condition: 'wisdom_on_ally_ko' }
    ],
    icon: '📚'
  }
];

// === SHERLOCK HOLMES - MASTER DETECTIVE ===
export const holmesAbilities: LegendaryAbility[] = [
  {
    id: 'deductive_gambit',
    name: 'Deductive Gambit',
    description: 'Exposes enemy weaknesses, lowering defense and evasion by 25% for 2 turns.',
    type: 'active',
    cooldown: 3,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'debuff', value: 25, duration: 2, condition: 'defense_reduction' },
      { type: 'debuff', value: 25, duration: 2, condition: 'evasion_reduction' }
    ],
    icon: '🕵️'
  },
  {
    id: 'logical_trap',
    name: 'Logical Trap',
    description: 'Sets a counter: if any enemy repeats an attack, Holmes instantly counters for 180% damage.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'self',
    effects: [
      { type: 'special', value: 180, condition: 'counter_repeated_attacks' }
    ],
    icon: '🪤'
  },
  {
    id: 'forensic_insight',
    name: 'Forensic Insight',
    description: 'Reveals all hidden buffs/debuffs and enemy stat modifiers. Allies gain +10% accuracy for 2 turns.',
    type: 'active',
    cooldown: 2,
    manaCost: 25,
    targetType: 'all_allies',
    effects: [
      { type: 'special', value: 1, condition: 'reveal_hidden_effects' },
      { type: 'buff', value: 10, duration: 2, condition: 'accuracy_boost' }
    ],
    icon: '🔍'
  },
  {
    id: 'cold_reading',
    name: 'Cold Reading',
    description: 'Disrupts one enemy\'s next ability; 60% chance to block a special move, 40% chance to confuse.',
    type: 'active',
    cooldown: 4,
    manaCost: 40,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 60, condition: 'block_next_ability' },
      { type: 'special', value: 40, condition: 'confuse_target' }
    ],
    icon: '🧠'
  },
  {
    id: 'mind_palace',
    name: 'Mind Palace',
    description: 'Next attack is guaranteed crit, but suffers -20 defense until next turn.',
    type: 'active',
    cooldown: 3,
    manaCost: 30,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 100, duration: 1, condition: 'guaranteed_crit' },
      { type: 'debuff', value: 20, duration: 1, condition: 'defense_reduction' }
    ],
    icon: '🏛️'
  },
  {
    id: 'unmask_impostor',
    name: 'Unmask Impostor',
    description: 'Strips disguise/invisibility, stuns for 1 turn, and reveals their next 2 actions.',
    type: 'ultimate',
    cooldown: 0,
    manaCost: 60,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, condition: 'strip_invisibility' },
      { type: 'debuff', value: 1, duration: 1, condition: 'stun' },
      { type: 'special', value: 2, condition: 'reveal_next_actions' }
    ],
    icon: '🎭'
  }
];

// === DRACULA - LORD OF VAMPIRES ===
export const draculaAbilities: LegendaryAbility[] = [
  {
    id: 'blood_drain',
    name: 'Blood Drain',
    description: 'Steals HP equal to 30% of damage dealt. If target is debuffed, lifesteal doubles.',
    type: 'active',
    cooldown: 3,
    manaCost: 35,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 120, scaling: 'strength' },
      { type: 'heal', value: 30, condition: 'lifesteal_percentage' },
      { type: 'special', value: 2, condition: 'double_if_debuffed' }
    ],
    icon: '🩸'
  },
  {
    id: 'night_form',
    name: 'Night Form',
    description: 'Transform into mist/bat: evade next attack (100%), then counterattack for 100% magic damage.',
    type: 'active',
    cooldown: 3,
    manaCost: 40,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 100, duration: 1, condition: 'evasion_boost' },
      { type: 'special', value: 100, condition: 'counterattack_magic' }
    ],
    icon: '🦇'
  },
  {
    id: 'enthrall',
    name: 'Enthrall',
    description: 'Mind-controls a low-WIS enemy for one turn. Target acts as Dracula\'s minion.',
    type: 'active',
    cooldown: 5,
    manaCost: 50,
    targetType: 'enemy',
    requirements: { teamPlayer: 25 },
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'mind_control' }
    ],
    icon: '🌀'
  },
  {
    id: 'immortal_will',
    name: 'Immortal Will',
    description: 'Upon lethal damage, revives at 30% HP, gains +25% attack, immune to stuns/charms for 2 turns.',
    type: 'ultimate',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 30, condition: 'revive_on_death' },
      { type: 'buff', value: 25, duration: 2, condition: 'attack_boost' },
      { type: 'buff', value: 1, duration: 2, condition: 'immunity_stun_charm' }
    ],
    icon: '⚰️'
  },
  {
    id: 'vampires_kiss',
    name: "Vampire's Kiss",
    description: 'Charms enemy (chance based on CHA); target cannot attack Dracula, -20% attack for 2 turns.',
    type: 'active',
    cooldown: 4,
    manaCost: 45,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, duration: 2, condition: 'charm_based_on_charisma' },
      { type: 'debuff', value: 20, duration: 2, condition: 'attack_reduction' }
    ],
    icon: '💋'
  },
  {
    id: 'unholy_presence',
    name: 'Unholy Presence',
    description: 'All enemies lose 5% mana and -5% attack each turn while Dracula is alive.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'all_enemies',
    effects: [
      { type: 'debuff', value: 5, condition: 'mana_drain_per_turn' },
      { type: 'debuff', value: 5, condition: 'attack_reduction_per_turn' }
    ],
    icon: '👻'
  }
];

// === FRANKENSTEIN'S MONSTER - PATCHWORK TITAN ===
export const frankensteinAbilities: LegendaryAbility[] = [
  {
    id: 'fury_smash',
    name: 'Fury Smash',
    description: 'Slams the ground, damaging all enemies and stunning for 1 turn. Self-stuns if HP > 50%.',
    type: 'active',
    cooldown: 5,
    manaCost: 45,
    targetType: 'all_enemies',
    effects: [
      { type: 'damage', value: 140, scaling: 'strength' },
      { type: 'debuff', value: 1, duration: 1, condition: 'stun' },
      { type: 'special', value: 1, condition: 'self_stun_if_healthy' }
    ],
    icon: '👊'
  },
  {
    id: 'patchwork_resilience',
    name: 'Patchwork Resilience',
    description: 'Heals 8% max HP every turn. Immune to bleed/poison. +25% defense when below 35% HP.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'heal', value: 8, condition: 'per_turn_percentage' },
      { type: 'special', value: 1, condition: 'immunity_bleed_poison' },
      { type: 'buff', value: 25, condition: 'defense_when_low_hp' }
    ],
    icon: '🧬'
  },
  {
    id: 'tragic_empathy',
    name: 'Tragic Empathy',
    description: 'For 2 turns, redirects 50% of all damage from chosen ally to self.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'ally',
    effects: [
      { type: 'special', value: 50, duration: 2, condition: 'redirect_damage' }
    ],
    icon: '💔'
  },
  {
    id: 'rampaging_outcast',
    name: 'Rampaging Outcast',
    description: 'When below 50% HP, attack increases by 30%. Under 25%, also gains lifesteal.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 30, condition: 'attack_when_wounded' },
      { type: 'special', value: 1, condition: 'lifesteal_when_critical' }
    ],
    icon: '😡'
  },
  {
    id: 'revenge_unleashed',
    name: 'Revenge Unleashed',
    description: 'If attacked twice by same enemy in a round, counter for double damage and inflict Fear.',
    type: 'active',
    cooldown: 3,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 200, condition: 'counter_repeated_attacker' },
      { type: 'debuff', value: 1, duration: 1, condition: 'fear' }
    ],
    icon: '⚡'
  },
  {
    id: 'defiant_roar',
    name: 'Defiant Roar',
    description: 'Taunt all enemies (they must attack Monster next turn), gains +40% defense for 1 turn.',
    type: 'active',
    cooldown: 4,
    manaCost: 40,
    targetType: 'all_enemies',
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'taunt_all' },
      { type: 'buff', value: 40, duration: 1, condition: 'defense_boost' }
    ],
    icon: '🦁'
  }
];

// === SAMMY SLUGGER - HARD-BOILED DETECTIVE ===
export const sammySluggerAbilities: LegendaryAbility[] = [
  {
    id: 'knockout_punch',
    name: 'Knockout Punch',
    description: 'Stuns enemy for 1 turn and deals bonus damage if enemy is "criminal" or "monster."',
    type: 'active',
    cooldown: 3,
    manaCost: 25,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 120, scaling: 'strength' },
      { type: 'special', value: 1, duration: 1, condition: 'stun' },
      { type: 'special', value: 50, condition: 'bonus_vs_criminal_monster' }
    ],
    icon: '👊'
  },
  {
    id: 'clue_hunter',
    name: 'Clue Hunter',
    description: 'Exposes enemy secrets—reveals all moves, lowers evasion by 25% for 2 turns.',
    type: 'active',
    cooldown: 4,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, condition: 'reveal_all_moves' },
      { type: 'debuff', value: -25, duration: 2, condition: 'evasion_reduction' }
    ],
    icon: '🔍'
  },
  {
    id: 'bulletproof_wit',
    name: 'Bulletproof Wit',
    description: 'Once per battle, automatically dodges a lethal hit. Immune to mind control.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, condition: 'survive_lethal_once' },
      { type: 'special', value: 1, condition: 'immune_mind_control' }
    ],
    icon: '🛡️'
  },
  {
    id: 'interrogation',
    name: 'Interrogation',
    description: 'Forces enemy to reveal all buffs and weaknesses. 50% chance to remove a random buff.',
    type: 'active',
    cooldown: 3,
    manaCost: 20,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, condition: 'reveal_buffs_weaknesses' },
      { type: 'special', value: 50, condition: 'remove_random_buff' }
    ],
    icon: '💬'
  },
  {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    description: 'All allies gain +30% evasion for 1 turn and can escape from battle.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'all_allies',
    effects: [
      { type: 'buff', value: 30, duration: 1, condition: 'evasion_boost' },
      { type: 'special', value: 50, condition: 'battle_escape_chance' }
    ],
    icon: '💨'
  },
  {
    id: 'street_justice',
    name: 'Street Justice',
    description: 'Crit chance and attack rise by +10% each time an ally falls (stacks).',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 10, condition: 'crit_per_fallen_ally' },
      { type: 'buff', value: 10, condition: 'attack_per_fallen_ally' }
    ],
    icon: '⚖️'
  }
];

// === BILLY THE KID - WILD WEST OUTLAW ===
export const billyTheKidAbilities: LegendaryAbility[] = [
  {
    id: 'deadeye_draw',
    name: 'Deadeye Draw',
    description: 'Acts first this turn, guaranteed crit if HP > 50%. If used below 50% HP, gains +25% evasion.',
    type: 'active',
    cooldown: 3,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, condition: 'act_first' },
      { type: 'special', value: 100, condition: 'guaranteed_crit_if_healthy' },
      { type: 'buff', value: 25, duration: 1, condition: 'evasion_if_wounded' }
    ],
    icon: '🎯'
  },
  {
    id: 'ricochet_shot',
    name: 'Ricochet Shot',
    description: 'Hits 2–3 enemies with one bullet. Each extra hit deals -20% damage. 20% chance to stun random target.',
    type: 'active',
    cooldown: 4,
    manaCost: 40,
    targetType: 'multiple_enemies',
    effects: [
      { type: 'damage', value: 130, scaling: 'agility' },
      { type: 'special', value: -20, condition: 'damage_reduction_per_extra_hit' },
      { type: 'special', value: 20, condition: 'stun_random_chance' }
    ],
    icon: '🔫'
  },
  {
    id: 'smoke_and_mirrors',
    name: 'Smoke and Mirrors',
    description: 'Boosts evasion by 40% for 2 turns. If attacked while active, automatically counters for 75% attack.',
    type: 'active',
    cooldown: 5,
    manaCost: 35,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 40, duration: 2, condition: 'evasion_boost' },
      { type: 'special', value: 75, condition: 'counter_if_attacked' }
    ],
    icon: '🌫️'
  },
  {
    id: 'wanted_poster',
    name: 'Wanted Poster',
    description: 'Draws enemy focus for 2 turns; gains +30% speed and +20% crit chance.',
    type: 'active',
    cooldown: 4,
    manaCost: 25,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, duration: 2, condition: 'taunt_enemies' },
      { type: 'buff', value: 30, duration: 2, condition: 'speed_boost' },
      { type: 'buff', value: 20, duration: 2, condition: 'crit_boost' }
    ],
    icon: '📋'
  },
  {
    id: 'last_stand',
    name: 'Last Stand',
    description: 'When below 25% HP, gains +40% attack and +30% crit chance.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 40, condition: 'attack_when_wounded' },
      { type: 'buff', value: 30, condition: 'crit_when_wounded' }
    ],
    icon: '💀'
  },
  {
    id: 'six_shooter_blitz',
    name: 'Six-Shooter Blitz',
    description: 'Multi-hit attack (up to 6 shots). If last shot KOs a target, gains another action.',
    type: 'active',
    cooldown: 5,
    manaCost: 50,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 80, condition: 'multi_hit_up_to_6' },
      { type: 'special', value: 1, condition: 'extra_action_if_kill' }
    ],
    icon: '🎰'
  }
];

// === GENGHIS KHAN - SCOURGE OF EMPIRES ===
export const genghisKhanAbilities: LegendaryAbility[] = [
  {
    id: 'thunderous_charge',
    name: 'Thunderous Charge',
    description: 'All allies attack together; team speed +20% for 1 turn. Extra 15% damage if "cavalry" or "beast" allies present.',
    type: 'active',
    cooldown: 4,
    manaCost: 50,
    targetType: 'all_allies',
    effects: [
      { type: 'special', value: 1, condition: 'team_coordinated_attack' },
      { type: 'buff', value: 20, duration: 1, condition: 'team_speed_boost' },
      { type: 'special', value: 15, condition: 'bonus_if_cavalry_beast' }
    ],
    icon: '🐎'
  },
  {
    id: 'unbreakable_horde',
    name: 'Unbreakable Horde',
    description: 'All allies gain +30% defense and +10% attack for 3 turns.',
    type: 'active',
    cooldown: 5,
    manaCost: 45,
    targetType: 'all_allies',
    effects: [
      { type: 'buff', value: 30, duration: 3, condition: 'defense_boost' },
      { type: 'buff', value: 10, duration: 3, condition: 'attack_boost' }
    ],
    icon: '🛡️'
  },
  {
    id: 'divide_and_conquer',
    name: 'Divide and Conquer',
    description: 'Random enemy is stunned for 1 turn and loses 20% defense for 2 turns.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'stun_random_enemy' },
      { type: 'debuff', value: -20, duration: 2, condition: 'defense_reduction' }
    ],
    icon: '⚔️'
  },
  {
    id: 'merciless_edict',
    name: 'Merciless Edict',
    description: 'Khan deals +25% damage vs "leader" or "support" archetype enemies.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 25, condition: 'bonus_vs_leader_support' }
    ],
    icon: '👑'
  },
  {
    id: 'unity_of_the_steppes',
    name: 'Unity of the Steppes',
    description: 'Heals all allies for 15% max HP and grants +15% attack if 3+ allies remain.',
    type: 'active',
    cooldown: 4,
    manaCost: 40,
    targetType: 'all_allies',
    effects: [
      { type: 'heal', value: 15, condition: 'percentage_heal_all' },
      { type: 'buff', value: 15, condition: 'attack_if_3_plus_allies' }
    ],
    icon: '🌄'
  },
  {
    id: 'wrath_of_khan',
    name: 'Wrath of Khan',
    description: 'Double attack for 1 turn (strikes all enemies once, then can attack again). Crits against weakened targets.',
    type: 'ultimate',
    cooldown: 0,
    manaCost: 60,
    targetType: 'all_enemies',
    effects: [
      { type: 'special', value: 2, condition: 'double_attack_turn' },
      { type: 'special', value: 100, condition: 'crit_vs_weakened' }
    ],
    icon: '💥'
  }
];

// === SPACE CYBORG (VEGA-X) - GALACTIC MERCENARY ===
export const spaceCyborgAbilities: LegendaryAbility[] = [
  {
    id: 'nanite_regeneration',
    name: 'Nanite Regeneration',
    description: 'Heal for 30% max HP over 3 turns. Immune to poison, bleed, and burn while active.',
    type: 'active',
    cooldown: 5,
    manaCost: 40,
    targetType: 'self',
    effects: [
      { type: 'heal', value: 30, duration: 3, condition: 'heal_over_time' },
      { type: 'special', value: 1, duration: 3, condition: 'immune_poison_bleed_burn' }
    ],
    icon: '🔧'
  },
  {
    id: 'overclocked_reflexes',
    name: 'Overclocked Reflexes',
    description: 'Gain +30% speed and +20% evasion for 2 turns. Next enemy attack has 50% chance to miss.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'self',
    effects: [
      { type: 'buff', value: 30, duration: 2, condition: 'speed_boost' },
      { type: 'buff', value: 20, duration: 2, condition: 'evasion_boost' },
      { type: 'special', value: 50, condition: 'next_attack_miss_chance' }
    ],
    icon: '⚡'
  },
  {
    id: 'emp_blast',
    name: 'EMP Blast',
    description: 'Disables enemy tech and magic for 1 turn (cannot use abilities), deals 90 damage. Double damage vs "robot" or "mage."',
    type: 'active',
    cooldown: 4,
    manaCost: 45,
    targetType: 'all_enemies',
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'disable_abilities' },
      { type: 'damage', value: 90, scaling: 'intelligence' },
      { type: 'special', value: 200, condition: 'double_vs_robot_mage' }
    ],
    icon: '💥'
  },
  {
    id: 'target_lock',
    name: 'Target Lock',
    description: 'Marks a single enemy: all attacks against them from Vega-X are guaranteed crits for 2 turns.',
    type: 'active',
    cooldown: 5,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, duration: 2, condition: 'guaranteed_crit_vs_target' }
    ],
    icon: '🎯'
  },
  {
    id: 'cybernetic_counter',
    name: 'Cybernetic Counter',
    description: 'Reflects the first negative status effect each battle. If triggered, also gains +10% defense for 2 turns.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, condition: 'reflect_first_debuff' },
      { type: 'buff', value: 10, duration: 2, condition: 'defense_if_reflected' }
    ],
    icon: '🔄'
  },
  {
    id: 'tactical_uplink',
    name: 'Tactical Uplink',
    description: 'All allies gain +15% accuracy and +20% speed for 2 turns.',
    type: 'active',
    cooldown: 5,
    manaCost: 40,
    targetType: 'all_allies',
    effects: [
      { type: 'buff', value: 15, duration: 2, condition: 'accuracy_boost' },
      { type: 'buff', value: 20, duration: 2, condition: 'speed_boost' }
    ],
    icon: '📡'
  }
];

// === ALIEN GREY - COSMIC MANIPULATOR ===
export const alienGreyAbilities: LegendaryAbility[] = [
  {
    id: 'mind_probe',
    name: 'Mind Probe',
    description: 'Reads enemy intent: reveals all enemy actions next turn, team evasion +20% for 2 turns.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'all_enemies',
    effects: [
      { type: 'special', value: 1, condition: 'reveal_enemy_actions' },
      { type: 'buff', value: 20, duration: 2, condition: 'team_evasion_boost' }
    ],
    icon: '🧠'
  },
  {
    id: 'telekinetic_wave',
    name: 'Telekinetic Wave',
    description: 'Deals 110 psychic damage to all enemies, 40% chance to stun for 1 turn.',
    type: 'active',
    cooldown: 4,
    manaCost: 50,
    targetType: 'all_enemies',
    effects: [
      { type: 'damage', value: 110, scaling: 'intelligence' },
      { type: 'special', value: 40, duration: 1, condition: 'stun_chance' }
    ],
    icon: '🌀'
  },
  {
    id: 'abduction',
    name: 'Abduction',
    description: 'Removes one enemy from battle for 1 turn. If used on a "human," returns with random debuff.',
    type: 'active',
    cooldown: 5,
    manaCost: 45,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'remove_from_battle' },
      { type: 'special', value: 1, condition: 'debuff_if_human' }
    ],
    icon: '🛸'
  },
  {
    id: 'dissection_beam',
    name: 'Dissection Beam',
    description: 'Ignores defense, deals 170 damage to one target. 50% chance to inflict "analyzed" (debuffs last longer).',
    type: 'active',
    cooldown: 3,
    manaCost: 40,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 170, condition: 'ignore_defense' },
      { type: 'special', value: 50, condition: 'analyzed_debuff' }
    ],
    icon: '🔬'
  },
  {
    id: 'reality_warp',
    name: 'Reality Warp',
    description: 'Randomizes all enemy buffs/debuffs (each is either swapped, removed, or inverted).',
    type: 'active',
    cooldown: 6,
    manaCost: 55,
    targetType: 'all_enemies',
    effects: [
      { type: 'special', value: 1, condition: 'randomize_all_effects' }
    ],
    icon: '🔮'
  },
  {
    id: 'universal_translator',
    name: 'Universal Translator',
    description: 'Next negative status on any ally is blocked and reflected (once per battle).',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'all_allies',
    effects: [
      { type: 'special', value: 1, condition: 'block_and_reflect_debuff' }
    ],
    icon: '🛡️'
  }
];

// === ROBIN HOOD - LEGENDARY OUTLAW ===
export const robinHoodAbilities: LegendaryAbility[] = [
  {
    id: 'impossible_shot',
    name: 'Impossible Shot',
    description: 'Ignores enemy defense, always crits, and if target is "tyrant" or "rich" archetype, deals bonus damage.',
    type: 'active',
    cooldown: 3,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 140, condition: 'ignore_defense' },
      { type: 'special', value: 100, condition: 'guaranteed_crit' },
      { type: 'special', value: 50, condition: 'bonus_vs_tyrant_rich' }
    ],
    icon: '🎯'
  },
  {
    id: 'merry_mens_ambush',
    name: "Merry Men's Ambush",
    description: 'Summons Merry Men to strike all enemies; 25% chance for each to be stunned for 1 turn.',
    type: 'active',
    cooldown: 4,
    manaCost: 45,
    targetType: 'all_enemies',
    effects: [
      { type: 'damage', value: 100, scaling: 'agility' },
      { type: 'special', value: 25, duration: 1, condition: 'stun_chance_each' }
    ],
    icon: '🏹'
  },
  {
    id: 'steal_from_the_rich',
    name: 'Steal From the Rich',
    description: 'Steals a random buff or resource from an enemy, then heals or buffs a random ally.',
    type: 'active',
    cooldown: 3,
    manaCost: 25,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, condition: 'steal_buff_or_resource' },
      { type: 'special', value: 1, condition: 'heal_or_buff_ally' }
    ],
    icon: '💰'
  },
  {
    id: 'forest_camouflage',
    name: 'Forest Camouflage',
    description: "Robin can't be targeted for 1 turn; next attack gains +50% crit chance.",
    type: 'active',
    cooldown: 4,
    manaCost: 20,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'untargetable' },
      { type: 'buff', value: 50, duration: 1, condition: 'crit_boost_next' }
    ],
    icon: '🌲'
  },
  {
    id: 'rebel_rally',
    name: 'Rebel Rally',
    description: 'Boosts all allies\' attack and morale (+20% attack, +10% speed) for 2 turns.',
    type: 'active',
    cooldown: 5,
    manaCost: 40,
    targetType: 'all_allies',
    effects: [
      { type: 'buff', value: 20, duration: 2, condition: 'attack_boost' },
      { type: 'buff', value: 10, duration: 2, condition: 'speed_boost' }
    ],
    icon: '🚩'
  },
  {
    id: 'quick_escape',
    name: 'Quick Escape',
    description: 'Once per battle, evades a fatal attack and immediately gains another action.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, condition: 'evade_fatal_once' },
      { type: 'special', value: 1, condition: 'extra_action_after' }
    ],
    icon: '💨'
  }
];

// === AGENT X - SHADOW OPERATIVE ===
export const agentXAbilities: LegendaryAbility[] = [
  {
    id: 'license_to_illude',
    name: 'License to Illude',
    description: 'Gains stealth for 2 turns (cannot be targeted except by AoE). Next attack from stealth is guaranteed crit.',
    type: 'active',
    cooldown: 4,
    manaCost: 30,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, duration: 2, condition: 'stealth' },
      { type: 'special', value: 100, condition: 'guaranteed_crit_from_stealth' }
    ],
    icon: '👤'
  },
  {
    id: 'gadget_blitz',
    name: 'Gadget Blitz',
    description: 'Throws random gadget: smoke bomb (+30% team evasion), EMP (disables enemy actives), or poison dart (90 damage + weaken).',
    type: 'active',
    cooldown: 3,
    manaCost: 25,
    targetType: 'variable',
    effects: [
      { type: 'special', value: 1, condition: 'random_gadget_effect' }
    ],
    icon: '🎒'
  },
  {
    id: 'interrogate_intel',
    name: 'Interrogate Intel',
    description: 'Reveals all enemy moves for next turn and marks weakest target—team deals +20% damage to that foe.',
    type: 'active',
    cooldown: 4,
    manaCost: 35,
    targetType: 'all_enemies',
    effects: [
      { type: 'special', value: 1, condition: 'reveal_enemy_moves' },
      { type: 'special', value: 20, condition: 'team_damage_vs_marked' }
    ],
    icon: '📋'
  },
  {
    id: 'seductive_deception',
    name: 'Seductive Deception',
    description: 'Charms a single enemy for 1 turn (cannot attack Agent X, reduced defense). If target is opposite gender, charm is 100%.',
    type: 'active',
    cooldown: 5,
    manaCost: 30,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, duration: 1, condition: 'charm' },
      { type: 'debuff', value: -20, duration: 1, condition: 'defense_reduction' },
      { type: 'special', value: 100, condition: 'guaranteed_if_opposite_gender' }
    ],
    icon: '💋'
  },
  {
    id: 'escape_protocol',
    name: 'Escape Protocol',
    description: 'If HP drops below 20%, automatically escapes to backline, healing 30% HP and cleansing all debuffs.',
    type: 'passive',
    cooldown: 0,
    manaCost: 0,
    targetType: 'self',
    effects: [
      { type: 'special', value: 1, condition: 'auto_escape_when_low' },
      { type: 'heal', value: 30, condition: 'heal_on_escape' },
      { type: 'special', value: 1, condition: 'cleanse_on_escape' }
    ],
    icon: '🚪'
  },
  {
    id: 'mission_complete',
    name: 'Mission Complete',
    description: 'Instantly KOs a debuffed enemy under 15% HP, and resets all cooldowns for Agent X.',
    type: 'ultimate',
    cooldown: 0,
    manaCost: 40,
    targetType: 'enemy',
    effects: [
      { type: 'special', value: 1, condition: 'execute_if_debuffed_low' },
      { type: 'special', value: 1, condition: 'reset_all_cooldowns' }
    ],
    icon: '✅'
  }
];

// Character ability mapping
export const legendaryAbilitiesMap: Record<string, LegendaryAbility[]> = {
  achilles: achillesAbilities,
  merlin: merlinAbilities,
  holmes: holmesAbilities,
  dracula: draculaAbilities,
  frankenstein_monster: frankensteinAbilities,
  sammy_slugger: sammySluggerAbilities,
  billy_the_kid: billyTheKidAbilities,
  genghis_khan: genghisKhanAbilities,
  space_cyborg: spaceCyborgAbilities,
  fenrir: fenrirAbilities,
  cleopatra: cleopatraAbilities,
  sun_wukong: sunWukongAbilities,
  tesla: teslaAbilities,
  joan: joanAbilities,
  alien_grey: alienGreyAbilities,
  robin_hood: robinHoodAbilities,
  agent_x: agentXAbilities
  // All 17 characters now have complete ability sets
};

// Ability system functions
export function getCharacterAbilities(characterId: string): LegendaryAbility[] {
  return legendaryAbilitiesMap[characterId] || [];
}

export function canUseAbility(ability: LegendaryAbility, character: any): boolean {
  if (ability.requirements) {
    if (ability.requirements.level && character.level < ability.requirements.level) return false;
    if (ability.requirements.mentalHealth && character.psychStats?.mentalHealth < ability.requirements.mentalHealth) return false;
    if (ability.requirements.teamPlayer && character.psychStats?.teamPlayer < ability.requirements.teamPlayer) return false;
  }
  return true;
}

export function calculateAbilityDamage(ability: LegendaryAbility, character: any): number {
  const damageEffect = ability.effects.find(e => e.type === 'damage');
  if (!damageEffect) return 0;
  
  let baseDamage = damageEffect.value;
  
  // Apply scaling
  if (damageEffect.scaling) {
    const scalingStat = character.baseStats[damageEffect.scaling] || 50;
    baseDamage *= (scalingStat / 50); // Scale relative to average stat of 50
  }
  
  return Math.floor(baseDamage);
}
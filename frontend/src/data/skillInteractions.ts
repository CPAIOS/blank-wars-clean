// Skill Interaction System
// Core + Signature skill combinations for powerful synergy effects

export interface SkillInteraction {
  id: string;
  name: string;
  description: string;
  requirements: {
    coreSkills: { skill: string; minLevel: number }[];
    signatureSkills: { skill: string; minLevel: number }[];
    character?: string; // Character-specific interactions
    archetype?: string; // Archetype-specific interactions
  };
  effects: {
    type: 'combat' | 'utility' | 'passive' | 'social';
    bonuses: Record<string, number>;
    abilities?: string[];
    duration?: number; // For temporary effects
    cooldown?: number;
  };
  triggerConditions: {
    combatPhase?: 'start' | 'during' | 'end';
    healthThreshold?: number; // Trigger at certain health %
    enemyCondition?: string;
    environment?: string;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  visualEffect: string;
}

export interface ActiveInteraction {
  interactionId: string;
  activatedAt: Date;
  duration?: number;
  remainingCooldown: number;
  bonuses: Record<string, number>;
}

export interface SkillSynergy {
  characterId: string;
  availableInteractions: string[];
  activeInteractions: ActiveInteraction[];
  masteredInteractions: string[]; // Unlocked through repeated use
  comboCount: number; // Total successful combinations
  lastUpdated: Date;
}

// Core Skill Interactions (Universal across all characters)
export const coreSkillInteractions: SkillInteraction[] = [
  {
    id: 'combat_survival_synergy',
    name: 'Battle Hardened',
    description: 'Combat experience enhances survival instincts, reducing damage taken',
    requirements: {
      coreSkills: [
        { skill: 'combat', minLevel: 25 },
        { skill: 'survival', minLevel: 20 }
      ],
      signatureSkills: []
    },
    effects: {
      type: 'passive',
      bonuses: {
        damageReduction: 15,
        statusResistance: 20
      }
    },
    triggerConditions: {},
    rarity: 'common',
    icon: '🛡️',
    visualEffect: 'defensive_aura'
  },

  {
    id: 'mental_social_synergy',
    name: 'Tactical Leadership',
    description: 'Mental prowess combined with social skills allows commanding allies effectively',
    requirements: {
      coreSkills: [
        { skill: 'mental', minLevel: 30 },
        { skill: 'social', minLevel: 25 }
      ],
      signatureSkills: []
    },
    effects: {
      type: 'utility',
      bonuses: {
        teamAttackBonus: 25,
        teamDefenseBonus: 15
      },
      duration: 300 // 5 minutes
    },
    triggerConditions: {
      combatPhase: 'start'
    },
    rarity: 'uncommon',
    icon: '👑',
    visualEffect: 'leadership_aura'
  },

  {
    id: 'spiritual_mental_synergy',
    name: 'Inner Focus',
    description: 'Spiritual awareness enhances mental clarity, boosting mana regeneration and spell power',
    requirements: {
      coreSkills: [
        { skill: 'spiritual', minLevel: 20 },
        { skill: 'mental', minLevel: 25 }
      ],
      signatureSkills: []
    },
    effects: {
      type: 'passive',
      bonuses: {
        manaRegeneration: 50,
        spellPower: 20,
        criticalChance: 10
      }
    },
    triggerConditions: {},
    rarity: 'uncommon',
    icon: '🧘',
    visualEffect: 'meditation_glow'
  },

  {
    id: 'combat_mental_synergy',
    name: 'Strategic Warrior',
    description: 'Combining combat skill with mental acuity for precise strikes',
    requirements: {
      coreSkills: [
        { skill: 'combat', minLevel: 35 },
        { skill: 'mental', minLevel: 30 }
      ],
      signatureSkills: []
    },
    effects: {
      type: 'combat',
      bonuses: {
        criticalChance: 25,
        accuracy: 20,
        criticalDamage: 40
      }
    },
    triggerConditions: {
      combatPhase: 'during'
    },
    rarity: 'rare',
    icon: '🎯',
    visualEffect: 'precision_strikes'
  },

  {
    id: 'survival_spiritual_synergy',
    name: 'Primal Instinct',
    description: 'Survival skills enhanced by spiritual connection to nature',
    requirements: {
      coreSkills: [
        { skill: 'survival', minLevel: 30 },
        { skill: 'spiritual', minLevel: 25 }
      ],
      signatureSkills: []
    },
    effects: {
      type: 'utility',
      bonuses: {
        healthRegeneration: 100,
        poisonResistance: 80,
        environmentalDamageReduction: 50
      }
    },
    triggerConditions: {
      healthThreshold: 50
    },
    rarity: 'rare',
    icon: '🌿',
    visualEffect: 'nature_regeneration'
  }
];

// Character-Specific Signature Interactions
export const signatureInteractions: SkillInteraction[] = [
  // Achilles Interactions
  {
    id: 'achilles_wrath_combat',
    name: 'Legendary Fury',
    description: 'Achilles\' wrath combined with supreme combat skill unleashes devastating attacks',
    requirements: {
      coreSkills: [{ skill: 'combat', minLevel: 40 }],
      signatureSkills: [{ skill: 'divine_wrath', minLevel: 15 }],
      character: 'achilles'
    },
    effects: {
      type: 'combat',
      bonuses: {
        attackPower: 100,
        criticalChance: 50,
        speed: 30
      },
      duration: 30,
      cooldown: 180
    },
    triggerConditions: {
      healthThreshold: 30
    },
    rarity: 'legendary',
    icon: '⚡',
    visualEffect: 'fury_explosion'
  },

  {
    id: 'achilles_honor_social',
    name: 'Hero\'s Inspiration',
    description: 'Achilles\' honor and charisma inspire allies to fight harder',
    requirements: {
      coreSkills: [{ skill: 'social', minLevel: 25 }],
      signatureSkills: [{ skill: 'heroic_presence', minLevel: 10 }],
      character: 'achilles'
    },
    effects: {
      type: 'utility',
      bonuses: {
        teamMorale: 75,
        teamDamage: 35,
        teamCriticalChance: 20
      },
      duration: 120
    },
    triggerConditions: {
      combatPhase: 'start'
    },
    rarity: 'epic',
    icon: '🏆',
    visualEffect: 'heroic_aura'
  },

  // Merlin Interactions
  {
    id: 'merlin_arcane_mental',
    name: 'Arcane Mastery',
    description: 'Merlin\'s vast mental capacity unlocks the deepest secrets of magic',
    requirements: {
      coreSkills: [{ skill: 'mental', minLevel: 45 }],
      signatureSkills: [{ skill: 'ancient_knowledge', minLevel: 20 }],
      character: 'merlin'
    },
    effects: {
      type: 'combat',
      bonuses: {
        spellPower: 150,
        manaEfficiency: 50,
        spellCriticalChance: 40
      },
      abilities: ['reality_warp', 'time_distortion']
    },
    triggerConditions: {},
    rarity: 'legendary',
    icon: '🌟',
    visualEffect: 'arcane_storm'
  },

  {
    id: 'merlin_wisdom_spiritual',
    name: 'Cosmic Awareness',
    description: 'Merlin\'s wisdom combined with spiritual enlightenment reveals hidden truths',
    requirements: {
      coreSkills: [{ skill: 'spiritual', minLevel: 35 }],
      signatureSkills: [{ skill: 'prophetic_sight', minLevel: 15 }],
      character: 'merlin'
    },
    effects: {
      type: 'utility',
      bonuses: {
        experienceGain: 100,
        enemyWeaknessDetection: 100,
        futureEventPrediction: 80
      }
    },
    triggerConditions: {},
    rarity: 'epic',
    icon: '👁️',
    visualEffect: 'cosmic_sight'
  },

  // Loki Interactions
  {
    id: 'loki_trickery_social',
    name: 'Master Manipulator',
    description: 'Loki\'s trickery enhanced by social mastery allows controlling enemy actions',
    requirements: {
      coreSkills: [{ skill: 'social', minLevel: 40 }],
      signatureSkills: [{ skill: 'shapeshifting', minLevel: 20 }],
      character: 'loki'
    },
    effects: {
      type: 'combat',
      bonuses: {
        enemyConfusion: 80,
        illusion_power: 100,
        mind_control_chance: 30
      },
      duration: 45,
      cooldown: 120
    },
    triggerConditions: {
      combatPhase: 'during'
    },
    rarity: 'legendary',
    icon: '🎭',
    visualEffect: 'reality_distortion'
  },

  {
    id: 'loki_chaos_mental',
    name: 'Chaotic Genius',
    description: 'Loki\'s chaotic nature combined with sharp intellect creates unpredictable advantages',
    requirements: {
      coreSkills: [{ skill: 'mental', minLevel: 35 }],
      signatureSkills: [{ skill: 'chaos_magic', minLevel: 15 }],
      character: 'loki'
    },
    effects: {
      type: 'utility',
      bonuses: {
        randomBonusChance: 50,
        adaptability: 100,
        surpriseAttackDamage: 200
      }
    },
    triggerConditions: {},
    rarity: 'epic',
    icon: '🌀',
    visualEffect: 'chaos_swirl'
  },

  // Fenrir Interactions
  {
    id: 'fenrir_hunt_survival',
    name: 'Alpha Predator',
    description: 'Fenrir\'s hunting instincts combined with supreme survival skills',
    requirements: {
      coreSkills: [{ skill: 'survival', minLevel: 40 }],
      signatureSkills: [{ skill: 'pack_leader', minLevel: 20 }],
      character: 'fenrir'
    },
    effects: {
      type: 'combat',
      bonuses: {
        attackSpeed: 75,
        criticalChance: 60,
        bleedDamage: 100,
        packDamageBonus: 150
      },
      abilities: ['blood_frenzy', 'pack_coordination']
    },
    triggerConditions: {
      enemyCondition: 'wounded'
    },
    rarity: 'legendary',
    icon: '🐺',
    visualEffect: 'primal_hunt'
  },

  {
    id: 'fenrir_rage_combat',
    name: 'Berserker\'s Fury',
    description: 'Fenrir\'s primal rage amplifies combat prowess beyond mortal limits',
    requirements: {
      coreSkills: [{ skill: 'combat', minLevel: 35 }],
      signatureSkills: [{ skill: 'primal_rage', minLevel: 15 }],
      character: 'fenrir'
    },
    effects: {
      type: 'combat',
      bonuses: {
        damageOutput: 200,
        damageReduction: -50, // Takes more damage
        speed: 100,
        fearResistance: 100
      },
      duration: 60,
      cooldown: 300
    },
    triggerConditions: {
      healthThreshold: 25
    },
    rarity: 'epic',
    icon: '💥',
    visualEffect: 'berserker_aura'
  },

  // Cleopatra Interactions
  {
    id: 'cleopatra_diplomacy_mental',
    name: 'Political Mastermind',
    description: 'Cleopatra\'s diplomatic skills enhanced by strategic thinking',
    requirements: {
      coreSkills: [{ skill: 'mental', minLevel: 40 }],
      signatureSkills: [{ skill: 'royal_authority', minLevel: 18 }],
      character: 'cleopatra'
    },
    effects: {
      type: 'utility',
      bonuses: {
        enemyRecruitmentChance: 25,
        allyLoyalty: 100,
        resourceGeneration: 75
      }
    },
    triggerConditions: {},
    rarity: 'epic',
    icon: '👑',
    visualEffect: 'royal_influence'
  },

  {
    id: 'cleopatra_mysticism_spiritual',
    name: 'Divine Pharaoh',
    description: 'Cleopatra\'s connection to Egyptian gods grants divine powers',
    requirements: {
      coreSkills: [{ skill: 'spiritual', minLevel: 35 }],
      signatureSkills: [{ skill: 'divine_connection', minLevel: 20 }],
      character: 'cleopatra'
    },
    effects: {
      type: 'combat',
      bonuses: {
        divine_protection: 50,
        curse_immunity: 100,
        healing_power: 100,
        mana_amplification: 75
      },
      abilities: ['divine_blessing', 'pharaoh_curse']
    },
    triggerConditions: {},
    rarity: 'legendary',
    icon: '☥',
    visualEffect: 'divine_radiance'
  }
];

// Archetype-Based Interactions
export const archetypeInteractions: SkillInteraction[] = [
  {
    id: 'warrior_archetype_synergy',
    name: 'Warrior\'s Discipline',
    description: 'All warrior archetypes can combine combat and mental skills for superior battlefield control',
    requirements: {
      coreSkills: [
        { skill: 'combat', minLevel: 30 },
        { skill: 'mental', minLevel: 20 }
      ],
      signatureSkills: [],
      archetype: 'warrior'
    },
    effects: {
      type: 'passive',
      bonuses: {
        accuracy: 25,
        tactical_awareness: 50,
        leadership: 30
      }
    },
    triggerConditions: {},
    rarity: 'uncommon',
    icon: '⚔️',
    visualEffect: 'warrior_focus'
  },

  {
    id: 'mage_archetype_synergy',
    name: 'Arcane Intellect',
    description: 'Mage archetypes excel at combining mental and spiritual skills for enhanced magic',
    requirements: {
      coreSkills: [
        { skill: 'mental', minLevel: 35 },
        { skill: 'spiritual', minLevel: 30 }
      ],
      signatureSkills: [],
      archetype: 'mage'
    },
    effects: {
      type: 'passive',
      bonuses: {
        spellPower: 50,
        manaRegeneration: 75,
        magical_resistance: 40
      }
    },
    triggerConditions: {},
    rarity: 'uncommon',
    icon: '🔮',
    visualEffect: 'arcane_enhancement'
  },

  {
    id: 'trickster_archetype_synergy',
    name: 'Cunning Adaptability',
    description: 'Trickster archetypes combine social and mental skills for unpredictable advantages',
    requirements: {
      coreSkills: [
        { skill: 'social', minLevel: 30 },
        { skill: 'mental', minLevel: 25 }
      ],
      signatureSkills: [],
      archetype: 'trickster'
    },
    effects: {
      type: 'utility',
      bonuses: {
        deception: 60,
        adaptability: 80,
        critical_thinking: 40
      }
    },
    triggerConditions: {},
    rarity: 'uncommon',
    icon: '🎭',
    visualEffect: 'trickster_shimmer'
  },

  {
    id: 'beast_archetype_synergy',
    name: 'Primal Instincts',
    description: 'Beast archetypes naturally combine combat and survival skills',
    requirements: {
      coreSkills: [
        { skill: 'combat', minLevel: 25 },
        { skill: 'survival', minLevel: 35 }
      ],
      signatureSkills: [],
      archetype: 'beast'
    },
    effects: {
      type: 'passive',
      bonuses: {
        tracking: 100,
        environmental_adaptation: 75,
        pack_coordination: 50
      }
    },
    triggerConditions: {},
    rarity: 'uncommon',
    icon: '🐺',
    visualEffect: 'primal_connection'
  },

  {
    id: 'mystic_archetype_synergy',
    name: 'Divine Wisdom',
    description: 'Mystic archetypes excel at spiritual and social skill combinations',
    requirements: {
      coreSkills: [
        { skill: 'spiritual', minLevel: 40 },
        { skill: 'social', minLevel: 30 }
      ],
      signatureSkills: [],
      archetype: 'mystic'
    },
    effects: {
      type: 'utility',
      bonuses: {
        divine_insight: 80,
        prophecy: 60,
        spiritual_leadership: 70
      }
    },
    triggerConditions: {},
    rarity: 'rare',
    icon: '👁️‍🗨️',
    visualEffect: 'divine_aura'
  }
];

// Skill Interaction Management Functions
export function getAvailableInteractions(
  characterId: string,
  archetype: string,
  coreSkills: Record<string, { level: number }>,
  signatureSkills: Record<string, { level: number }>
): SkillInteraction[] {
  const allInteractions = [
    ...coreSkillInteractions,
    ...signatureInteractions,
    ...archetypeInteractions
  ];

  return allInteractions.filter(interaction => {
    // Check character requirement
    if (interaction.requirements.character && interaction.requirements.character !== characterId) {
      return false;
    }

    // Check archetype requirement
    if (interaction.requirements.archetype && interaction.requirements.archetype !== archetype) {
      return false;
    }

    // Check core skill requirements
    for (const requirement of interaction.requirements.coreSkills) {
      const skill = coreSkills[requirement.skill];
      if (!skill || skill.level < requirement.minLevel) {
        return false;
      }
    }

    // Check signature skill requirements
    for (const requirement of interaction.requirements.signatureSkills) {
      const skill = signatureSkills[requirement.skill];
      if (!skill || skill.level < requirement.minLevel) {
        return false;
      }
    }

    return true;
  });
}

export function activateInteraction(
  synergy: SkillSynergy,
  interactionId: string
): { success: boolean; updatedSynergy: SkillSynergy; error?: string } {
  const interaction = [...coreSkillInteractions, ...signatureInteractions, ...archetypeInteractions]
    .find(i => i.id === interactionId);

  if (!interaction) {
    return {
      success: false,
      updatedSynergy: synergy,
      error: 'Interaction not found'
    };
  }

  // Check if interaction is on cooldown
  const activeInteraction = synergy.activeInteractions.find(ai => ai.interactionId === interactionId);
  if (activeInteraction && activeInteraction.remainingCooldown > 0) {
    return {
      success: false,
      updatedSynergy: synergy,
      error: 'Interaction is on cooldown'
    };
  }

  const now = new Date();
  const newActiveInteraction: ActiveInteraction = {
    interactionId,
    activatedAt: now,
    duration: interaction.effects.duration,
    remainingCooldown: interaction.effects.cooldown || 0,
    bonuses: interaction.effects.bonuses
  };

  const updatedSynergy: SkillSynergy = {
    ...synergy,
    activeInteractions: [...synergy.activeInteractions.filter(ai => ai.interactionId !== interactionId), newActiveInteraction],
    comboCount: synergy.comboCount + 1,
    lastUpdated: now
  };

  // Add to mastered interactions if used enough times
  const usageCount = synergy.comboCount + 1;
  if (usageCount >= 10 && !synergy.masteredInteractions.includes(interactionId)) {
    updatedSynergy.masteredInteractions = [...synergy.masteredInteractions, interactionId];
  }

  return {
    success: true,
    updatedSynergy
  };
}

export function updateInteractionCooldowns(synergy: SkillSynergy, deltaTimeSeconds: number): SkillSynergy {
  const updatedActiveInteractions = synergy.activeInteractions
    .map(interaction => ({
      ...interaction,
      remainingCooldown: Math.max(0, interaction.remainingCooldown - deltaTimeSeconds)
    }))
    .filter(interaction => {
      // Remove expired duration-based interactions
      if (interaction.duration) {
        const elapsedTime = (Date.now() - interaction.activatedAt.getTime()) / 1000;
        return elapsedTime < interaction.duration;
      }
      return true;
    });

  return {
    ...synergy,
    activeInteractions: updatedActiveInteractions,
    lastUpdated: new Date()
  };
}

export function calculateCombinedBonuses(activeInteractions: ActiveInteraction[]): Record<string, number> {
  const combinedBonuses: Record<string, number> = {};

  for (const interaction of activeInteractions) {
    for (const [bonus, value] of Object.entries(interaction.bonuses)) {
      combinedBonuses[bonus] = (combinedBonuses[bonus] || 0) + value;
    }
  }

  return combinedBonuses;
}

// Demo data
export function createDemoSkillSynergy(characterId: string): SkillSynergy {
  return {
    characterId,
    availableInteractions: [],
    activeInteractions: [],
    masteredInteractions: [],
    comboCount: 0,
    lastUpdated: new Date()
  };
}
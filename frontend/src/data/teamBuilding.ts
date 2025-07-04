// Team Building and Character Selection System for _____ Wars
// Strategic team composition with synergies, roles, and formation tactics

export type TeamRole = 'leader' | 'attacker' | 'defender' | 'support' | 'specialist';
export type FormationType = 'balanced' | 'aggressive' | 'defensive' | 'speed' | 'magic' | 'custom';
export type SynergyType = 'archetype' | 'historical' | 'elemental' | 'tactical' | 'legendary';

export interface TeamPosition {
  id: string;
  name: string;
  role: TeamRole;
  position: { x: number; y: number }; // battlefield position
  requirements?: {
    archetype?: string[];
    minLevel?: number;
    maxLevel?: number;
    abilities?: string[];
  };
  bonuses: {
    stat: 'atk' | 'def' | 'spd' | 'hp' | 'energy' | 'critRate';
    value: number;
    description: string;
  }[];
}

export interface TeamSynergy {
  id: string;
  name: string;
  description: string;
  type: SynergyType;
  icon: string;
  requirements: {
    characters?: string[]; // specific character IDs
    archetypes?: { archetype: string; count: number }[];
    minTeamSize?: number;
    conditions?: string[];
  };
  effects: {
    type: 'stat_boost' | 'ability_enhancement' | 'special_effect' | 'cost_reduction';
    target: 'team' | 'individual' | 'leader';
    stat?: string;
    value: number;
    description: string;
  }[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface TeamFormation {
  id: string;
  name: string;
  description: string;
  type: FormationType;
  icon: string;
  maxTeamSize: number;
  positions: TeamPosition[];
  formationBonuses: {
    stat: string;
    value: number;
    condition?: string;
  }[];
  recommendedFor: string[];
}

export interface TeamComposition {
  id: string;
  name: string;
  description?: string;
  formation: string; // formation ID
  members: {
    characterId: string;
    position: string; // position ID
    isLeader: boolean;
  }[];
  activeSynergies: string[]; // synergy IDs
  teamStats: {
    totalPower: number;
    avgLevel: number;
    synergiesCount: number;
    formationBonus: number;
  };
  createdDate: Date;
  lastUsed?: Date;
  wins: number;
  losses: number;
  isActive: boolean;
  isFavorite: boolean;
}

// Predefined team formations
export const teamFormations: TeamFormation[] = [
  {
    id: 'balanced_trio',
    name: 'Balanced Trio',
    description: 'A well-rounded 3-character formation for versatile combat',
    type: 'balanced',
    icon: '⚖️',
    maxTeamSize: 3,
    positions: [
      {
        id: 'leader',
        name: 'Team Leader',
        role: 'leader',
        position: { x: 50, y: 30 },
        bonuses: [
          { stat: 'atk', value: 15, description: 'Leadership presence' },
          { stat: 'energy', value: 10, description: 'Tactical advantage' }
        ]
      },
      {
        id: 'attacker',
        name: 'Primary Attacker',
        role: 'attacker',
        position: { x: 20, y: 60 },
        requirements: {
          archetype: ['warrior', 'trickster', 'beast']
        },
        bonuses: [
          { stat: 'atk', value: 20, description: 'Frontline aggression' },
          { stat: 'critRate', value: 10, description: 'Combat focus' }
        ]
      },
      {
        id: 'support',
        name: 'Support Specialist',
        role: 'support',
        position: { x: 80, y: 60 },
        requirements: {
          archetype: ['mage', 'mystic', 'support']
        },
        bonuses: [
          { stat: 'def', value: 15, description: 'Protective aura' },
          { stat: 'energy', value: 15, description: 'Tactical support' }
        ]
      }
    ],
    formationBonuses: [
      { stat: 'teamCohesion', value: 25, condition: 'All positions filled' }
    ],
    recommendedFor: ['Beginners', 'Balanced gameplay', 'Learning synergies']
  },
  {
    id: 'aggressive_assault',
    name: 'Aggressive Assault',
    description: 'High-damage formation focused on overwhelming offense',
    type: 'aggressive',
    icon: '⚔️',
    maxTeamSize: 4,
    positions: [
      {
        id: 'vanguard',
        name: 'Vanguard',
        role: 'attacker',
        position: { x: 30, y: 20 },
        requirements: {
          archetype: ['warrior', 'beast'],
          minLevel: 10
        },
        bonuses: [
          { stat: 'atk', value: 30, description: 'Vanguard fury' },
          { stat: 'spd', value: 20, description: 'First strike' }
        ]
      },
      {
        id: 'main_assault',
        name: 'Main Assault',
        role: 'attacker',
        position: { x: 50, y: 40 },
        requirements: {
          archetype: ['warrior', 'trickster']
        },
        bonuses: [
          { stat: 'atk', value: 25, description: 'Coordinated assault' },
          { stat: 'critRate', value: 15, description: 'Precision strikes' }
        ]
      },
      {
        id: 'flanker',
        name: 'Flanker',
        role: 'specialist',
        position: { x: 70, y: 20 },
        requirements: {
          archetype: ['trickster', 'beast']
        },
        bonuses: [
          { stat: 'spd', value: 35, description: 'Flanking speed' },
          { stat: 'critRate', value: 20, description: 'Surprise attacks' }
        ]
      },
      {
        id: 'battle_coordinator',
        name: 'Battle Coordinator',
        role: 'leader',
        position: { x: 50, y: 70 },
        requirements: {
          archetype: ['mystic', 'warrior']
        },
        bonuses: [
          { stat: 'atk', value: 15, description: 'Battle coordination' },
          { stat: 'energy', value: 20, description: 'Tactical efficiency' }
        ]
      }
    ],
    formationBonuses: [
      { stat: 'attackPower', value: 40, condition: 'All attackers present' },
      { stat: 'firstTurnDamage', value: 25, condition: 'Formation intact' }
    ],
    recommendedFor: ['Experienced players', 'Quick battles', 'High-risk high-reward']
  },
  {
    id: 'fortress_defense',
    name: 'Fortress Defense',
    description: 'Impenetrable defensive formation for endurance battles',
    type: 'defensive',
    icon: '🛡️',
    maxTeamSize: 4,
    positions: [
      {
        id: 'shield_wall',
        name: 'Shield Wall',
        role: 'defender',
        position: { x: 50, y: 20 },
        requirements: {
          archetype: ['warrior', 'mystic'],
          minLevel: 15
        },
        bonuses: [
          { stat: 'def', value: 40, description: 'Immovable defense' },
          { stat: 'hp', value: 30, description: 'Fortress endurance' }
        ]
      },
      {
        id: 'guardian_left',
        name: 'Left Guardian',
        role: 'defender',
        position: { x: 20, y: 40 },
        requirements: {
          archetype: ['warrior', 'beast']
        },
        bonuses: [
          { stat: 'def', value: 25, description: 'Flank protection' },
          { stat: 'hp', value: 20, description: 'Guardian resilience' }
        ]
      },
      {
        id: 'guardian_right',
        name: 'Right Guardian',
        role: 'defender',
        position: { x: 80, y: 40 },
        requirements: {
          archetype: ['warrior', 'beast']
        },
        bonuses: [
          { stat: 'def', value: 25, description: 'Flank protection' },
          { stat: 'hp', value: 20, description: 'Guardian resilience' }
        ]
      },
      {
        id: 'strategic_commander',
        name: 'Strategic Commander',
        role: 'leader',
        position: { x: 50, y: 70 },
        requirements: {
          archetype: ['mystic', 'mage']
        },
        bonuses: [
          { stat: 'def', value: 20, description: 'Strategic positioning' },
          { stat: 'energy', value: 25, description: 'Efficient tactics' }
        ]
      }
    ],
    formationBonuses: [
      { stat: 'damageReduction', value: 30, condition: 'All defenders present' },
      { stat: 'healingBonus', value: 50, condition: 'Formation maintains integrity' }
    ],
    recommendedFor: ['Long battles', 'Survival challenges', 'Defensive specialists']
  },
  {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    description: 'Ultra-fast formation prioritizing speed and first-turn advantages',
    type: 'speed',
    icon: '⚡',
    maxTeamSize: 3,
    positions: [
      {
        id: 'speed_leader',
        name: 'Speed Leader',
        role: 'leader',
        position: { x: 50, y: 30 },
        requirements: {
          archetype: ['trickster', 'beast'],
          minLevel: 12
        },
        bonuses: [
          { stat: 'spd', value: 40, description: 'Lightning leadership' },
          { stat: 'energy', value: 20, description: 'Quick thinking' }
        ]
      },
      {
        id: 'swift_striker',
        name: 'Swift Striker',
        role: 'attacker',
        position: { x: 25, y: 60 },
        requirements: {
          archetype: ['trickster', 'beast', 'warrior']
        },
        bonuses: [
          { stat: 'spd', value: 35, description: 'Swift assault' },
          { stat: 'critRate', value: 25, description: 'Precision timing' }
        ]
      },
      {
        id: 'blur_assassin',
        name: 'Blur Assassin',
        role: 'specialist',
        position: { x: 75, y: 60 },
        requirements: {
          archetype: ['trickster', 'beast']
        },
        bonuses: [
          { stat: 'spd', value: 45, description: 'Untouchable speed' },
          { stat: 'atk', value: 20, description: 'Momentum strikes' }
        ]
      }
    ],
    formationBonuses: [
      { stat: 'initiativeBonus', value: 100, condition: 'All speed specialists' },
      { stat: 'evasionBonus', value: 35, condition: 'Formation speed threshold' }
    ],
    recommendedFor: ['Speed specialists', 'First-turn victories', 'Hit-and-run tactics']
  },
  {
    id: 'arcane_circle',
    name: 'Arcane Circle',
    description: 'Magical formation maximizing elemental power and spell synergy',
    type: 'magic',
    icon: '🔮',
    maxTeamSize: 3,
    positions: [
      {
        id: 'archmage',
        name: 'Archmage',
        role: 'leader',
        position: { x: 50, y: 30 },
        requirements: {
          archetype: ['mage', 'mystic'],
          minLevel: 20
        },
        bonuses: [
          { stat: 'energy', value: 40, description: 'Arcane mastery' },
          { stat: 'atk', value: 30, description: 'Spell power' }
        ]
      },
      {
        id: 'elemental_left',
        name: 'Elemental Mage',
        role: 'specialist',
        position: { x: 20, y: 70 },
        requirements: {
          archetype: ['mage', 'scholar']
        },
        bonuses: [
          { stat: 'energy', value: 25, description: 'Elemental focus' },
          { stat: 'atk', value: 25, description: 'Spell amplification' }
        ]
      },
      {
        id: 'mystic_right',
        name: 'Mystic Scholar',
        role: 'support',
        position: { x: 80, y: 70 },
        requirements: {
          archetype: ['mystic', 'mage', 'support']
        },
        bonuses: [
          { stat: 'energy', value: 30, description: 'Mystical knowledge' },
          { stat: 'def', value: 20, description: 'Protective wards' }
        ]
      }
    ],
    formationBonuses: [
      { stat: 'spellPower', value: 60, condition: 'All magic users' },
      { stat: 'energyEfficiency', value: 40, condition: 'Arcane synergy' }
    ],
    recommendedFor: ['Magic specialists', 'Spell combinations', 'Energy management']
  }
];

// Team synergies
export const teamSynergies: TeamSynergy[] = [
  {
    id: 'warrior_brotherhood',
    name: 'Warrior Brotherhood',
    description: 'Warriors fight with increased ferocity when together',
    type: 'archetype',
    icon: '⚔️',
    requirements: {
      archetypes: [{ archetype: 'warrior', count: 2 }]
    },
    effects: [
      {
        type: 'stat_boost',
        target: 'team',
        stat: 'atk',
        value: 20,
        description: '+20% ATK for all warriors'
      },
      {
        type: 'special_effect',
        target: 'team',
        value: 15,
        description: '+15% critical hit chance when ally warrior is present'
      }
    ],
    rarity: 'common'
  },
  {
    id: 'ancient_legends',
    name: 'Ancient Legends',
    description: 'Legendary heroes from myth inspire each other to greatness',
    type: 'historical',
    icon: '🏛️',
    requirements: {
      characters: ['achilles', 'merlin', 'loki'],
      minTeamSize: 2
    },
    effects: [
      {
        type: 'stat_boost',
        target: 'team',
        stat: 'all',
        value: 25,
        description: '+25% to all stats for legendary characters'
      },
      {
        type: 'ability_enhancement',
        target: 'individual',
        value: 30,
        description: 'Ultimate abilities cost 30% less energy'
      }
    ],
    rarity: 'legendary'
  },
  {
    id: 'tactical_formation',
    name: 'Tactical Formation',
    description: 'Leaders and scholars create tactical advantages',
    type: 'tactical',
    icon: '🎯',
    requirements: {
      archetypes: [
        { archetype: 'mystic', count: 1 },
        { archetype: 'mage', count: 1 }
      ]
    },
    effects: [
      {
        type: 'stat_boost',
        target: 'team',
        stat: 'energy',
        value: 30,
        description: 'Team energy efficiency increased'
      },
      {
        type: 'special_effect',
        target: 'team',
        value: 20,
        description: 'All abilities gain +1 effective rank'
      }
    ],
    rarity: 'rare'
  },
  {
    id: 'primal_pack',
    name: 'Primal Pack',
    description: 'Beast characters hunt together with pack coordination',
    type: 'archetype',
    icon: '🐺',
    requirements: {
      archetypes: [{ archetype: 'beast', count: 2 }]
    },
    effects: [
      {
        type: 'stat_boost',
        target: 'team',
        stat: 'spd',
        value: 35,
        description: 'Pack speed bonus'
      },
      {
        type: 'special_effect',
        target: 'team',
        value: 25,
        description: 'Coordinated attacks deal bonus damage'
      }
    ],
    rarity: 'uncommon'
  },
  {
    id: 'elemental_mastery',
    name: 'Elemental Mastery',
    description: 'Mages combine elemental powers for devastating effects',
    type: 'elemental',
    icon: '🔥',
    requirements: {
      archetypes: [{ archetype: 'mage', count: 2 }]
    },
    effects: [
      {
        type: 'ability_enhancement',
        target: 'team',
        value: 40,
        description: 'Elemental abilities gain +40% power'
      },
      {
        type: 'special_effect',
        target: 'team',
        value: 50,
        description: 'Spell combinations create chain reactions'
      }
    ],
    rarity: 'epic'
  },
  {
    id: 'divine_trinity',
    name: 'Divine Trinity',
    description: 'Perfect balance of mind, body, and spirit',
    type: 'legendary',
    icon: '✨',
    requirements: {
      archetypes: [
        { archetype: 'warrior', count: 1 },
        { archetype: 'mage', count: 1 },
        { archetype: 'scholar', count: 1 }
      ]
    },
    effects: [
      {
        type: 'stat_boost',
        target: 'team',
        stat: 'all',
        value: 30,
        description: 'Perfect balance grants supreme power'
      },
      {
        type: 'special_effect',
        target: 'team',
        value: 100,
        description: 'Unlocks special trinity combination attacks'
      }
    ],
    rarity: 'legendary'
  }
];

// Helper functions
export function calculateTeamSynergies(
  teamMembers: { characterId: string; archetype: string }[]
): string[] {
  const activeSynergies: string[] = [];
  
  // Count archetypes
  const archetypeCounts: Record<string, number> = {};
  teamMembers.forEach(member => {
    archetypeCounts[member.archetype] = (archetypeCounts[member.archetype] || 0) + 1;
  });
  
  // Get character IDs
  const characterIds = teamMembers.map(m => m.characterId);
  
  teamSynergies.forEach(synergy => {
    let meetsRequirements = true;
    
    // Check archetype requirements
    if (synergy.requirements.archetypes) {
      meetsRequirements = synergy.requirements.archetypes.every(req => 
        (archetypeCounts[req.archetype] || 0) >= req.count
      );
    }
    
    // Check character requirements
    if (synergy.requirements.characters && meetsRequirements) {
      const requiredCharacterCount = synergy.requirements.minTeamSize || synergy.requirements.characters.length;
      const presentCharacters = synergy.requirements.characters.filter(charId => 
        characterIds.includes(charId)
      );
      meetsRequirements = presentCharacters.length >= requiredCharacterCount;
    }
    
    // Check team size requirements
    if (synergy.requirements.minTeamSize && meetsRequirements) {
      meetsRequirements = teamMembers.length >= synergy.requirements.minTeamSize;
    }
    
    if (meetsRequirements) {
      activeSynergies.push(synergy.id);
    }
  });
  
  return activeSynergies;
}

export function calculateTeamPower(
  teamMembers: { level: number; baseStats: { atk: number; def: number; spd: number; hp: number } }[],
  formation: TeamFormation,
  synergies: string[]
): number {
  let totalPower = 0;
  
  // Base power from character levels and stats
  teamMembers.forEach(member => {
    const levelMultiplier = 1 + (member.level * 0.05); // 5% per level
    const statSum = member.baseStats.atk + member.baseStats.def + member.baseStats.spd + (member.baseStats.hp * 0.1);
    totalPower += statSum * levelMultiplier;
  });
  
  // Formation bonuses
  formation.formationBonuses.forEach(bonus => {
    if (bonus.stat === 'teamCohesion') {
      totalPower *= (1 + bonus.value / 100);
    }
  });
  
  // Synergy bonuses
  synergies.forEach(synergyId => {
    const synergy = teamSynergies.find(s => s.id === synergyId);
    if (synergy) {
      synergy.effects.forEach(effect => {
        if (effect.type === 'stat_boost') {
          totalPower *= (1 + effect.value / 100);
        }
      });
    }
  });
  
  return Math.floor(totalPower);
}

export function getFormationRecommendations(
  characters: { characterId: string; archetype: string; level: number }[]
): TeamFormation[] {
  const archetypes = [...new Set(characters.map(c => c.archetype))];
  const avgLevel = characters.reduce((sum, c) => sum + c.level, 0) / characters.length;
  
  return teamFormations.filter(formation => {
    // Check if we have enough characters for the formation
    if (characters.length < formation.maxTeamSize) return false;
    
    // Check if we can fill required positions
    const canFillPositions = formation.positions.every(position => {
      if (!position.requirements?.archetype) return true;
      return position.requirements.archetype.some(reqArchetype => 
        archetypes.includes(reqArchetype)
      );
    });
    
    return canFillPositions;
  }).sort((a, b) => {
    // Prioritize formations based on team composition
    const aScore = a.positions.filter(pos => 
      pos.requirements?.archetype?.some(arch => archetypes.includes(arch))
    ).length;
    const bScore = b.positions.filter(pos => 
      pos.requirements?.archetype?.some(arch => archetypes.includes(arch))
    ).length;
    
    return bScore - aScore;
  });
}

export function validateTeamComposition(
  members: { characterId: string; position: string }[],
  formation: TeamFormation
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check team size
  if (members.length > formation.maxTeamSize) {
    errors.push(`Team size exceeds formation limit of ${formation.maxTeamSize}`);
  }
  
  // Check position assignments
  const usedPositions = new Set(members.map(m => m.position));
  const availablePositions = formation.positions.map(p => p.id);
  
  members.forEach(member => {
    if (!availablePositions.includes(member.position)) {
      errors.push(`Invalid position: ${member.position}`);
    }
  });
  
  // Check for duplicate positions
  if (usedPositions.size !== members.length) {
    errors.push('Multiple characters cannot occupy the same position');
  }
  
  // Check leader requirement
  const hasLeader = members.some(member => {
    const position = formation.positions.find(p => p.id === member.position);
    return position?.role === 'leader';
  });
  
  if (members.length >= 2 && !hasLeader) {
    errors.push('Teams with 2+ members must have a leader');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
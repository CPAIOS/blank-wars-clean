// Team Battle System - Revolutionary Character Management
// Implements the psychological stat system and team dynamics

export interface TraditionalStats {
  strength: number; // Physical damage output (0-100)
  vitality: number; // HP and damage resistance (0-100)
  speed: number; // Turn order, dodge chance (0-100)
  dexterity: number; // Accuracy, critical chance (0-100)
  stamina: number; // Actions per turn (0-100)
  intelligence: number; // Spell power, tactics (0-100)
  charisma: number; // Social attacks, inspiration (0-100)
  spirit: number; // Special ability power (0-100)
}

export interface PsychologicalStats {
  training: number; // How well they follow coaching (0-100)
  teamPlayer: number; // Natural cooperation inclination (0-100)
  ego: number; // Need for personal glory (0-100)
  mentalHealth: number; // Current psychological state (0-100)
  communication: number; // Team coordination ability (0-100)
}

export interface TeamCharacter {
  // Basic Identity
  id: string;
  name: string;
  avatar: string;
  archetype: 'warrior' | 'mage' | 'trickster' | 'beast' | 'leader' | 'detective' | 'monster' | 'alien' | 'mercenary' | 'cowboy' | 'biker';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  
  // Core Stats
  level: number;
  experience: number;
  experienceToNext: number;
  
  // Combat Stats (Traditional)
  traditionalStats: TraditionalStats;
  currentHp: number;
  maxHp: number;
  
  // Psychological Stats (Revolutionary)
  psychStats: PsychologicalStats;
  
  // Character Personality
  personalityTraits: string[];
  speakingStyle: 'formal' | 'casual' | 'archaic' | 'technical' | 'poetic' | 'gruff' | 'mysterious';
  decisionMaking: 'logical' | 'emotional' | 'impulsive' | 'calculated';
  conflictResponse: 'aggressive' | 'diplomatic' | 'withdrawn' | 'manipulative';
  
  // Current Status
  statusEffects: string[];
  injuries: string[];
  restDaysNeeded: number;
  
  // Abilities
  abilities: CharacterAbility[];
  specialPowers: SpecialPower[];
}

export interface CharacterAbility {
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

export interface Team {
  id: string;
  name: string;
  coachName: string;
  characters: TeamCharacter[];
  
  // Team Dynamics
  teamChemistry: number; // 0-100, affects all battles
  teamCulture: 'military' | 'family' | 'divas' | 'chaos' | 'brotherhood';
  
  // Team Stats (derived from characters)
  averageLevel: number;
  totalPower: number;
  psychologyScore: number; // Overall team mental health
  
  // History
  wins: number;
  losses: number;
  battlesPlayed: number;
  lastBattleDate: Date;
}

export interface BattleSetup {
  playerTeam: Team;
  opponentTeam: Team;
  battleType: 'friendly' | 'ranked' | 'tournament';
  weightClass: 'rookie' | 'amateur' | 'pro' | 'championship';
  stakes: 'normal' | 'high' | 'death_match';
}

export interface BattleMorale {
  currentMorale: number; // 0-100, affects all team members
  moraleHistory: MoraleEvent[];
}

export interface MoraleEvent {
  round: number;
  event: string;
  moraleChange: number;
  affectedCharacters: string[];
  timestamp: Date;
}

export interface RoundResult {
  round: number;
  attacker: TeamCharacter;
  defender: TeamCharacter;
  attackerAction: CharacterAbility | 'refused' | 'rogue_action';
  damage: number;
  wasStrategyAdherent: boolean; // Did they follow strategy?
  rogueDescription?: string; // If they went off-script
  moraleImpact: number;
  newAttackerHp: number;
  newDefenderHp: number;
  narrativeDescription: string;
}

export interface BattleState {
  setup: BattleSetup;
  currentRound: number;
  phase: 'pre_battle' | 'huddle' | 'round_combat' | 'coaching_timeout' | 'post_battle';
  
  // Dynamic Battle State
  playerMorale: BattleMorale;
  opponentMorale: BattleMorale;
  
  // Round History
  roundResults: RoundResult[];
  
  // Current Round
  currentFighters: {
    player: TeamCharacter;
    opponent: TeamCharacter;
  };
  
  // Battle Outcome
  winner?: 'player' | 'opponent' | 'draw';
  battleEndReason?: 'total_victory' | 'forfeit' | 'mutual_destruction' | 'time_limit';
}

// Mental Health Categories
export type MentalHealthLevel = 'stable' | 'stressed' | 'troubled' | 'crisis';

export function getMentalHealthLevel(mentalHealth: number): MentalHealthLevel {
  if (mentalHealth >= 80) return 'stable';
  if (mentalHealth >= 50) return 'stressed';
  if (mentalHealth >= 25) return 'troubled';
  return 'crisis';
}

export function getMentalHealthModifier(level: MentalHealthLevel): number {
  switch (level) {
    case 'stable': return 1.0; // No penalty
    case 'stressed': return 0.9; // -10% performance
    case 'troubled': return 0.8; // -20% performance
    case 'crisis': return 0.7; // -30% performance
  }
}

export function getMoraleModifier(morale: number): number {
  if (morale >= 80) return 1.2; // +20% all stats
  if (morale >= 60) return 1.1; // +10% stats
  if (morale >= 40) return 0.9; // -10% stats
  if (morale >= 20) return 0.8; // -20% stats
  return 0.7; // -30% stats
}

// Team Chemistry Calculation
export function calculateTeamChemistry(characters: TeamCharacter[]): number {
  if (characters.length === 0) return 0;
  
  const avgTeamPlayer = characters.reduce((sum, char) => sum + char.psychStats.teamPlayer, 0) / characters.length;
  const avgCommunication = characters.reduce((sum, char) => sum + char.psychStats.communication, 0) / characters.length;
  const avgEgo = characters.reduce((sum, char) => sum + char.psychStats.ego, 0) / characters.length;
  const avgMentalHealth = characters.reduce((sum, char) => sum + char.psychStats.mentalHealth, 0) / characters.length;
  
  // High team player and communication boost chemistry
  // High ego hurts chemistry
  // Good mental health helps chemistry
  const baseChemistry = (avgTeamPlayer + avgCommunication + avgMentalHealth) / 3;
  const egoReduction = (avgEgo - 50) * 0.3; // Ego above 50 hurts chemistry
  
  return Math.max(0, Math.min(100, baseChemistry - egoReduction));
}

// Gameplan Adherence Check - Will character follow coach's strategy?
export function checkGameplanAdherence(
  character: TeamCharacter, 
  teamMorale: number, 
  isInjured: boolean = false,
  isLosing: boolean = false
): { willFollow: boolean; adherenceScore: number; reason: string } {
  
  let adherenceScore = character.psychStats.training;
  
  // Modifiers
  const mentalHealthMod = character.psychStats.mentalHealth * 0.4;
  const teamPlayerMod = character.psychStats.teamPlayer * 0.3;
  const egoMod = (100 - character.psychStats.ego) * 0.2;
  const moraleMod = teamMorale * 0.3;
  
  adherenceScore += mentalHealthMod + teamPlayerMod + egoMod + moraleMod;
  
  // Stress factors reduce strategy adherence
  if (isInjured) adherenceScore -= 20;
  if (isLosing) adherenceScore -= 15;
  if (character.psychStats.mentalHealth < 30) adherenceScore -= 25;
  
  // Random factor (chaos element)
  const randomFactor = (Math.random() - 0.5) * 20;
  adherenceScore += randomFactor;
  
  const willFollow = adherenceScore > 50;
  
  let reason = '';
  if (!willFollow) {
    if (character.psychStats.mentalHealth < 30) reason = 'Mental breakdown affects decision making';
    else if (character.psychStats.ego > 80) reason = 'Believes their approach is better than the gameplan';
    else if (isInjured) reason = 'Pain and emotion override strategic thinking';
    else if (teamMorale < 30) reason = 'Low team morale leads to independent decisions';
    else reason = 'Prefers to adapt strategy based on field conditions';
  }
  
  return { willFollow, adherenceScore: Math.max(0, Math.min(100, adherenceScore)), reason };
}

// Legacy compatibility function
export function checkObedience(
  character: TeamCharacter, 
  teamMorale: number, 
  isInjured: boolean = false,
  isLosing: boolean = false
): { willObey: boolean; obedienceScore: number; reason: string } {
  const result = checkGameplanAdherence(character, teamMorale, isInjured, isLosing);
  return {
    willObey: result.willFollow,
    obedienceScore: result.adherenceScore,
    reason: result.reason
  };
}

// Create demo teams for testing
export function createDemoPlayerTeam(): Team {
  const sherlock: TeamCharacter = {
    id: 'holmes_001',
    name: 'Sherlock Holmes',
    avatar: '🕵️',
    archetype: 'detective',
    rarity: 'legendary',
    level: 15,
    experience: 2400,
    experienceToNext: 800,
    traditionalStats: {
      strength: 60,
      vitality: 70,
      speed: 85,
      dexterity: 90,
      stamina: 75,
      intelligence: 95,
      charisma: 70,
      spirit: 80
    },
    currentHp: 280,
    maxHp: 280,
    psychStats: {
      training: 85, // Highly educated but...
      teamPlayer: 45, // Prefers working alone
      ego: 90, // Knows he's brilliant
      mentalHealth: 75, // Generally stable
      communication: 60 // Clear but condescending
    },
    personalityTraits: ['Brilliant', 'Arrogant', 'Observant', 'Impatient'],
    speakingStyle: 'formal',
    decisionMaking: 'logical',
    conflictResponse: 'diplomatic',
    statusEffects: [],
    injuries: [],
    restDaysNeeded: 0,
    abilities: [
      {
        id: 'deduction',
        name: 'Deductive Strike',
        type: 'attack',
        power: 25,
        cooldown: 1,
        currentCooldown: 0,
        description: 'Analyzes opponent weakness for precise attack',
        icon: '🔍',
        mentalHealthRequired: 60
      }
    ],
    specialPowers: []
  };
  
  const dracula: TeamCharacter = {
    id: 'dracula_001',
    name: 'Dracula',
    avatar: '🧛',
    archetype: 'monster',
    rarity: 'legendary',
    level: 18,
    experience: 3200,
    experienceToNext: 1000,
    traditionalStats: {
      strength: 85,
      vitality: 90,
      speed: 75,
      dexterity: 80,
      stamina: 85,
      intelligence: 80,
      charisma: 95,
      spirit: 85
    },
    currentHp: 360,
    maxHp: 360,
    psychStats: {
      training: 40, // Centuries of independence
      teamPlayer: 25, // Extreme individualist
      ego: 95, // Immortal superiority complex
      mentalHealth: 60, // Centuries of isolation
      communication: 80 // Commanding presence
    },
    personalityTraits: ['Ancient', 'Commanding', 'Ruthless', 'Aristocratic'],
    speakingStyle: 'archaic',
    decisionMaking: 'calculated',
    conflictResponse: 'aggressive',
    statusEffects: [],
    injuries: [],
    restDaysNeeded: 0,
    abilities: [],
    specialPowers: []
  };
  
  const joan: TeamCharacter = {
    id: 'joan_001',
    name: 'Joan of Arc',
    avatar: '⚔️',
    archetype: 'leader',
    rarity: 'legendary',
    level: 16,
    experience: 2800,
    experienceToNext: 900,
    traditionalStats: {
      strength: 75,
      vitality: 80,
      speed: 70,
      dexterity: 75,
      stamina: 90,
      intelligence: 70,
      charisma: 90,
      spirit: 95
    },
    currentHp: 320,
    maxHp: 320,
    psychStats: {
      training: 95, // Divine mission focus
      teamPlayer: 90, // Natural leader
      ego: 30, // Humble servant
      mentalHealth: 85, // Strong faith
      communication: 95 // Inspiring speaker
    },
    personalityTraits: ['Devout', 'Inspiring', 'Brave', 'Righteous'],
    speakingStyle: 'formal',
    decisionMaking: 'emotional',
    conflictResponse: 'diplomatic',
    statusEffects: [],
    injuries: [],
    restDaysNeeded: 0,
    abilities: [],
    specialPowers: []
  };
  
  const team: Team = {
    id: 'demo_team_001',
    name: 'Legendary Squad',
    coachName: 'Demo Coach',
    characters: [sherlock, dracula, joan],
    teamChemistry: 45, // Will be calculated
    teamCulture: 'divas', // High ego characters
    averageLevel: 16.3,
    totalPower: 850,
    psychologyScore: 73,
    wins: 12,
    losses: 3,
    battlesPlayed: 15,
    lastBattleDate: new Date()
  };
  
  // Calculate actual team chemistry
  team.teamChemistry = calculateTeamChemistry(team.characters);
  
  return team;
}

export function createDemoOpponentTeam(): Team {
  // Simpler opponent team for demo
  const viking: TeamCharacter = {
    id: 'viking_001',
    name: 'Erik the Red',
    avatar: '🪓',
    archetype: 'warrior',
    rarity: 'epic',
    level: 14,
    experience: 2000,
    experienceToNext: 700,
    traditionalStats: {
      strength: 90,
      vitality: 85,
      speed: 60,
      dexterity: 70,
      stamina: 95,
      intelligence: 50,
      charisma: 60,
      spirit: 75
    },
    currentHp: 340,
    maxHp: 340,
    psychStats: {
      training: 70,
      teamPlayer: 80,
      ego: 60,
      mentalHealth: 80,
      communication: 70
    },
    personalityTraits: ['Fierce', 'Loyal', 'Honor-bound', 'Aggressive'],
    speakingStyle: 'gruff',
    decisionMaking: 'emotional',
    conflictResponse: 'aggressive',
    statusEffects: [],
    injuries: [],
    restDaysNeeded: 0,
    abilities: [],
    specialPowers: []
  };
  
  // Add two more characters...
  return {
    id: 'demo_opponent_001',
    name: 'Nordic Raiders',
    coachName: 'AI Coach',
    characters: [viking], // Simplified for now
    teamChemistry: 75,
    teamCulture: 'military',
    averageLevel: 14,
    totalPower: 750,
    psychologyScore: 80,
    wins: 8,
    losses: 7,
    battlesPlayed: 15,
    lastBattleDate: new Date()
  };
}
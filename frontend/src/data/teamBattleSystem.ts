// Team Battle System - Revolutionary Character Management
// Implements the psychological stat system and team dynamics

import { getAllCharacters, type Character, characterTemplates } from './characters';
import { initializeCharacterWithStartingEquipment } from './characterInitialization';
import { calculateFinalStats, getCharacterPowerLevel } from './characterEquipment';

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
  archetype: 'warrior' | 'mage' | 'assassin' | 'tank' | 'support' | 'beast' | 'trickster' | 'mystic' | 'elementalist' | 'berserker' | 'scholar' | 'leader';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

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

  // In-battle temporary stats (from coaching boosts)
  // These are applied during battle and reset when a new battle starts
  // Coaching sessions add to these stats for the duration of the battle
  temporaryStats: TraditionalStats;

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
  characters: Character[];

  // Team Dynamics
  coachingPoints: number; // Points to spend on coaching actions
  consecutiveLosses: number; // Track losses for coaching points degradation (0-3)
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

// Team Chemistry Modifier - Revolutionary team synergy system!
export function getTeamChemistryModifier(chemistry: number): number {
  if (chemistry >= 90) return 1.25; // +25% damage - Perfect synergy
  if (chemistry >= 75) return 1.15; // +15% damage - Great teamwork
  if (chemistry >= 60) return 1.05; // +5% damage - Good coordination
  if (chemistry >= 40) return 0.95; // -5% damage - Some friction
  if (chemistry >= 25) return 0.85; // -15% damage - Poor teamwork
  return 0.75; // -25% damage - Team dysfunction
}

// Team Chemistry Calculation
export function calculateTeamChemistry(
  characters: TeamCharacter[],
  headquartersEffects?: { bonuses: Record<string, number>, penalties: Record<string, number> }
): number {
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

  // Factor in living conditions
  let environmentalPenalty = 0;
  if (headquartersEffects?.penalties) {
    const moralePenalty = Math.abs(headquartersEffects.penalties['Morale'] || 0);
    const teamworkPenalty = Math.abs(headquartersEffects.penalties['Teamwork'] || 0);

    // Poor living conditions and personality conflicts devastate team chemistry
    environmentalPenalty = moralePenalty + teamworkPenalty; // -30 morale + -25 teamwork = -55 chemistry
  }

  return Math.max(0, Math.min(100, baseChemistry - egoReduction - environmentalPenalty));
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

// Coaching Points Progression System
/**
 * Get effective stats for battle calculations (traditional + temporary)
 */
export function getEffectiveStats(character: TeamCharacter): TraditionalStats {
  return {
    strength: character.traditionalStats.strength + character.temporaryStats.strength,
    vitality: character.traditionalStats.vitality + character.temporaryStats.vitality,
    speed: character.traditionalStats.speed + character.temporaryStats.speed,
    dexterity: character.traditionalStats.dexterity + character.temporaryStats.dexterity,
    stamina: character.traditionalStats.stamina + character.temporaryStats.stamina,
    intelligence: character.traditionalStats.intelligence + character.temporaryStats.intelligence,
    charisma: character.traditionalStats.charisma + character.temporaryStats.charisma,
    spirit: character.traditionalStats.spirit + character.temporaryStats.spirit
  };
}

export function updateCoachingPointsAfterBattle(team: Team, isWin: boolean): Team {
  if (isWin) {
    // Win: Reset to 3 points and clear consecutive losses
    return {
      ...team,
      coachingPoints: 3,
      consecutiveLosses: 0,
      wins: team.wins + 1,
      battlesPlayed: team.battlesPlayed + 1
    };
  } else {
    // Loss: Increment consecutive losses and reduce coaching points
    const newConsecutiveLosses = team.consecutiveLosses + 1;
    let newCoachingPoints: number;

    switch (newConsecutiveLosses) {
      case 1: newCoachingPoints = 2; break; // 3→2
      case 2: newCoachingPoints = 1; break; // 2→1
      case 3: newCoachingPoints = 0; break; // 1→0
      default: newCoachingPoints = 0; break; // Stay at 0
    }

    return {
      ...team,
      coachingPoints: newCoachingPoints,
      consecutiveLosses: newConsecutiveLosses,
      losses: team.losses + 1,
      battlesPlayed: team.battlesPlayed + 1
    };
  }
}

// Enhanced team creation with headquarters bonuses and penalties
export function createDemoPlayerTeamWithBonuses(
  headquartersBonuses?: Record<string, number>,
  headquartersPenalties?: Record<string, number>
): Team {
  const baseTeam = createDemoPlayerTeam();

  // Apply headquarters effects to all team characters
  baseTeam.characters = baseTeam.characters.map(character => {
    let modifiedStats = { ...character.temporaryStats };

    // Apply bonuses
    if (headquartersBonuses) {
      Object.entries(headquartersBonuses).forEach(([bonusName, bonusValue]) => {
        switch (bonusName) {
          case 'Strength':
            modifiedStats.strength += bonusValue;
            break;
          case 'Vitality':
            modifiedStats.vitality += bonusValue;
            break;
          case 'Speed':
            modifiedStats.speed += bonusValue;
            break;
          case 'Dexterity':
          case 'Accuracy':
            modifiedStats.dexterity += bonusValue;
            break;
          case 'Stamina':
            modifiedStats.stamina += bonusValue;
            break;
          case 'Intelligence':
            modifiedStats.intelligence += bonusValue;
            break;
          case 'Charisma':
            modifiedStats.charisma += bonusValue;
            break;
          case 'Spirit':
            modifiedStats.spirit += bonusValue;
            break;
        }
      });
    }

    // Apply penalties
    if (headquartersPenalties) {
      Object.entries(headquartersPenalties).forEach(([penaltyName, penaltyValue]) => {
        if (penaltyName === 'All Stats') {
          // Apply to all stats
          modifiedStats.strength += penaltyValue;
          modifiedStats.vitality += penaltyValue;
          modifiedStats.speed += penaltyValue;
          modifiedStats.dexterity += penaltyValue;
          modifiedStats.stamina += penaltyValue;
          modifiedStats.intelligence += penaltyValue;
          modifiedStats.charisma += penaltyValue;
          modifiedStats.spirit += penaltyValue;
        } else {
          // Apply to specific stats
          switch (penaltyName) {
            case 'Strength':
              modifiedStats.strength += penaltyValue;
              break;
            case 'Vitality':
              modifiedStats.vitality += penaltyValue;
              break;
            case 'Speed':
              modifiedStats.speed += penaltyValue;
              break;
            case 'Dexterity':
            case 'Accuracy':
              modifiedStats.dexterity += penaltyValue;
              break;
            case 'Stamina':
              modifiedStats.stamina += penaltyValue;
              break;
            case 'Intelligence':
              modifiedStats.intelligence += penaltyValue;
              break;
            case 'Charisma':
              modifiedStats.charisma += penaltyValue;
              break;
            case 'Spirit':
              modifiedStats.spirit += penaltyValue;
              break;
            case 'Morale':
              // Morale affects multiple stats
              modifiedStats.charisma += penaltyValue * 0.5;
              modifiedStats.spirit += penaltyValue * 0.3;
              break;
            case 'Teamwork':
              // Teamwork affects coordination stats
              modifiedStats.charisma += penaltyValue * 0.4;
              modifiedStats.intelligence += penaltyValue * 0.3;
              break;
          }
        }
      });
    }

    return {
      ...character,
      temporaryStats: modifiedStats
    };
  });

  // Recalculate team chemistry with headquarters effects
  const teamCharacters = baseTeam.characters.map(convertToTeamCharacter);
  baseTeam.teamChemistry = calculateTeamChemistry(
    teamCharacters,
    { bonuses: headquartersBonuses || {}, penalties: headquartersPenalties || {} }
  );

  return baseTeam;
}

// Convert Character to TeamCharacter for team chemistry calculations
function convertToTeamCharacter(character: Character): TeamCharacter {
  return {
    id: character.id,
    name: character.name,
    avatar: character.avatar,
    archetype: character.archetype,
    rarity: character.rarity,
    level: character.level,
    experience: character.experience.currentXP,
    experienceToNext: character.experience.experienceToNext,
    traditionalStats: character.traditionalStats,
    currentHp: character.currentHp,
    maxHp: character.maxHp,
    psychStats: character.psychStats,
    temporaryStats: character.temporaryStats,
    personalityTraits: character.personalityTraits,
    speakingStyle: character.speakingStyle,
    decisionMaking: character.decisionMaking,
    conflictResponse: character.conflictResponse,
    statusEffects: character.statusEffects,
    injuries: character.injuries,
    restDaysNeeded: character.restDaysNeeded,
    abilities: character.battleAbilities.map(ability => ({
      id: ability.id,
      name: ability.name,
      type: ability.type as 'attack' | 'defense' | 'support',
      power: ability.power,
      cooldown: ability.cooldown,
      currentCooldown: ability.currentCooldown,
      description: ability.description,
      icon: ability.icon,
      mentalHealthRequired: ability.mentalHealthRequired
    })),
    specialPowers: character.specialPowers
  };
}

// Helper function to create a full Character from template
// Create properly initialized character with equipment and real stats
export function createBattleReadyCharacter(templateKey: string, characterId: string, level: number = 1): Character {
  // Use the proper initialization system that includes weapons!
  const character = initializeCharacterWithStartingEquipment(templateKey, level);

  // Override the ID to match battle system naming
  return {
    ...character,
    id: characterId
  };
}

// Create demo teams for testing
export function createDemoPlayerTeam(): Team {
  // Create properly initialized characters with realistic levels and equipment
  const achilles = createBattleReadyCharacter('achilles', 'achilles_001', 12);
  const merlin = createBattleReadyCharacter('merlin', 'merlin_001', 15);
  const fenrir = createBattleReadyCharacter('fenrir', 'fenrir_001', 8);

  // Debug: Log weapon status to verify weapons are equipped
  console.log('🗡️ WEAPON DEBUG:');
  console.log(`Achilles weapon: ${achilles.equippedItems?.weapon?.name || 'NO WEAPON'}`);
  console.log(`Merlin weapon: ${merlin.equippedItems?.weapon?.name || 'NO WEAPON'}`);
  console.log(`Fenrir weapon: ${fenrir.equippedItems?.weapon?.name || 'NO WEAPON'}`);

  const characters = [achilles, merlin, fenrir] as Character[];

  const team: Team = {
    id: 'demo_team_001',
    name: 'Legendary Squad',
    coachName: 'Demo Coach',
    characters: characters,
    coachingPoints: 3,
    consecutiveLosses: 0,
    teamChemistry: 75, // Will be calculated below
    teamCulture: 'family', // Team of diverse character types working as family
    // Calculate real averages from character data
    averageLevel: Math.round(characters.reduce((sum, char) => sum + char.level, 0) / characters.length),
    totalPower: characters.reduce((sum, char) => sum + getCharacterPowerLevel(char), 0),
    psychologyScore: Math.round(characters.reduce((sum, char) => sum + char.psychStats.mentalHealth, 0) / characters.length),
    wins: 0, // Fresh team starts with no battle history
    losses: 0,
    battlesPlayed: 0,
    lastBattleDate: new Date()
  };

  // Calculate actual team chemistry (using safe fallback for now due to interface mismatch)
  try {
    team.teamChemistry = calculateTeamChemistry(team.characters as any, undefined);
  } catch (error) {
    console.log('Team chemistry calculation failed, using default value');
    team.teamChemistry = 75; // Default reasonable value
  }

  return team;
}

export function createDemoOpponentTeam(): Team {
  const allAvailableCharacters = getAllCharacters();
  const opponentCharacters: Character[] = [];

  // Randomly select 3 unique character templates and create full Characters
  const selectedTemplateIds: string[] = [];
  while (opponentCharacters.length < 3) {
    const randomIndex = Math.floor(Math.random() * allAvailableCharacters.length);
    const selectedCharacterTemplate = allAvailableCharacters[randomIndex];

    // Skip if already selected
    if (selectedTemplateIds.includes(selectedCharacterTemplate.id)) {
      continue;
    }

    selectedTemplateIds.push(selectedCharacterTemplate.id);

    // Create a full Character using the same pattern as createDemoPlayerTeam
    const templateKey = Object.keys(characterTemplates).find(key =>
      characterTemplates[key].name === selectedCharacterTemplate.name
    );

    if (templateKey) {
      const character = createBattleReadyCharacter(
        templateKey,
        `${templateKey}_opponent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        Math.floor(Math.random() * 15) + 1 // Random level 1-15
      );
      opponentCharacters.push(character);
    }
  }

  return {
    id: `opponent_team_${Date.now()}`,
    name: 'Random Opponents',
    coachName: 'Rival Coach',
    characters: opponentCharacters,
    coachingPoints: 50,
    consecutiveLosses: 0,
    teamChemistry: calculateTeamChemistry(opponentCharacters.map(convertToTeamCharacter), undefined),
    teamCulture: 'chaos',
    averageLevel: opponentCharacters.reduce((sum, char) => sum + char.level, 0) / opponentCharacters.length,
    totalPower: opponentCharacters.reduce((sum, char) => sum + char.combatStats.attack + char.combatStats.defense, 0),
    psychologyScore: opponentCharacters.reduce((sum, char) => sum + char.psychStats.mentalHealth, 0) / opponentCharacters.length,
    wins: Math.floor(Math.random() * 20),
    losses: Math.floor(Math.random() * 15),
    battlesPlayed: 0,
    lastBattleDate: new Date()
  };
}

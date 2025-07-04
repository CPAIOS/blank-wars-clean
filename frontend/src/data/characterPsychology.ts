// AI Character Psychology & Breakdown System
// The revolutionary system that turns AI unpredictability into gameplay

import { TeamCharacter } from './teamBattleSystem';

export interface PsychologyState {
  // Core Stability Metrics (0-100)
  mentalStability: number;    // How stable the character is
  confidence: number;         // Current confidence level
  stress: number;            // Current stress level (higher = worse)
  teamHarmony: number;       // How well they get along with teammates
  
  // Battle-Specific States
  battleFocus: number;       // How focused they are on the current battle
  strategicAlignment: number; // How much they agree with coach's strategy
  painTolerance: number;     // How well they handle taking damage
  
  // Personality Modifiers
  volatility: number;        // How likely they are to have extreme reactions (0-100)
  independence: number;      // How much they prefer doing their own thing (0-100)
  leadership: number;        // How much they want to take control (0-100)
}

export interface StabilityFactors {
  // Positive Factors (improve stability)
  recentVictories: number;   // Recent wins boost confidence
  goodTeamWork: number;      // Working well with team
  strategicSuccess: number;  // Coach's strategies working
  optimalHealth: number;     // Character is at high HP
  
  // Negative Factors (reduce stability)
  recentDefeats: number;     // Recent losses hurt confidence
  teamConflicts: number;     // Disagreements with teammates
  strategicFailures: number; // Coach's strategies failing
  lowHealth: number;         // Character is badly wounded
  overwhelming: number;      // Facing much stronger opponents
}

export type DeviationType = 
  | 'minor_insubordination'    // Slightly ignore strategy
  | 'strategy_override'        // Completely ignore strategy 
  | 'friendly_fire'           // Attack teammate instead of enemy
  | 'pacifist_mode'           // Refuse to fight
  | 'berserker_rage'          // Attack everyone indiscriminately
  | 'identity_crisis'         // Become something else entirely
  | 'dimensional_escape'      // Try to leave the battle arena
  | 'environmental_chaos'     // Attack the environment/judges
  | 'complete_breakdown';     // Total psychological collapse

export interface DeviationEvent {
  characterId: string;
  type: DeviationType;
  severity: 'minor' | 'moderate' | 'major' | 'extreme';
  description: string;
  gameplayEffect: string;
  aiGeneratedAction?: string; // What the AI decided to do
  judgeRuling?: string;       // How the judge interpreted it
  timestamp: Date;
}

export interface DeviationRisk {
  character: TeamCharacter;
  currentRisk: number;        // 0-100, chance of deviation this turn
  riskFactors: string[];      // What's contributing to the risk
  potentialDeviations: {
    type: DeviationType;
    probability: number;
    description: string;
  }[];
}

// Initialize psychology state for a character
export function initializePsychologyState(character: TeamCharacter): PsychologyState {
  // Base on character's existing psychological stats
  const psychStats = character.psychStats;
  
  return {
    // Start with character's base psychological profile
    mentalStability: psychStats.mentalHealth,
    confidence: 50 + (character.level * 2), // Higher level = more confident
    stress: 25, // Start with moderate stress
    teamHarmony: psychStats.teamPlayer,
    
    // Battle states start neutral
    battleFocus: psychStats.training, // Training affects focus
    strategicAlignment: psychStats.training, // Training affects obedience  
    painTolerance: 50 + psychStats.mentalHealth / 2,
    
    // Personality traits derived from existing stats
    volatility: 100 - psychStats.mentalHealth, // Lower mental health = more volatile
    independence: psychStats.ego, // High ego = more independent
    leadership: Math.min(100, psychStats.ego + psychStats.communication) // Ego + communication = leadership desire
  };
}

// Calculate current stability factors affecting a character
export function calculateStabilityFactors(
  character: TeamCharacter,
  battleContext: {
    recentDamage: number;
    teamPerformance: number;
    strategySuccessRate: number;
    opponentLevelDifference: number;
    roundsWon: number;
    roundsLost: number;
  }
): StabilityFactors {
  return {
    // Positive factors
    recentVictories: Math.max(0, battleContext.roundsWon * 20 - battleContext.roundsLost * 10),
    goodTeamWork: battleContext.teamPerformance,
    strategicSuccess: battleContext.strategySuccessRate,
    optimalHealth: Math.max(0, (character.currentHp / character.maxHp) * 100 - 50) * 2,
    
    // Negative factors  
    recentDefeats: Math.max(0, battleContext.roundsLost * 25 - battleContext.roundsWon * 5),
    teamConflicts: Math.max(0, 50 - battleContext.teamPerformance),
    strategicFailures: Math.max(0, 75 - battleContext.strategySuccessRate),
    lowHealth: Math.max(0, 75 - (character.currentHp / character.maxHp) * 100),
    overwhelming: Math.max(0, battleContext.opponentLevelDifference * 15) // Each level difference adds stress
  };
}

// Update psychology state based on battle events
export function updatePsychologyState(
  currentState: PsychologyState,
  factors: StabilityFactors,
  event?: 'damage_taken' | 'damage_dealt' | 'teammate_helped' | 'strategy_ignored' | 'victory' | 'defeat'
): PsychologyState {
  const newState = { ...currentState };
  
  // Apply stability factors
  const stabilityChange = (
    factors.recentVictories + factors.goodTeamWork + factors.strategicSuccess + factors.optimalHealth
  ) - (
    factors.recentDefeats + factors.teamConflicts + factors.strategicFailures + factors.lowHealth + factors.overwhelming
  );
  
  newState.mentalStability = Math.max(0, Math.min(100, newState.mentalStability + stabilityChange * 0.1));
  
  // Event-specific updates
  switch (event) {
    case 'damage_taken':
      newState.stress = Math.min(100, newState.stress + 10);
      newState.confidence = Math.max(0, newState.confidence - 5);
      newState.painTolerance = Math.max(0, newState.painTolerance - 3);
      break;
      
    case 'damage_dealt':
      newState.confidence = Math.min(100, newState.confidence + 8);
      newState.stress = Math.max(0, newState.stress - 5);
      break;
      
    case 'teammate_helped':
      newState.teamHarmony = Math.min(100, newState.teamHarmony + 10);
      newState.strategicAlignment = Math.min(100, newState.strategicAlignment + 5);
      break;
      
    case 'strategy_ignored':
      newState.strategicAlignment = Math.max(0, newState.strategicAlignment - 15);
      newState.independence = Math.min(100, newState.independence + 10);
      break;
      
    case 'victory':
      newState.confidence = Math.min(100, newState.confidence + 20);
      newState.stress = Math.max(0, newState.stress - 15);
      newState.mentalStability = Math.min(100, newState.mentalStability + 10);
      break;
      
    case 'defeat':
      newState.confidence = Math.max(0, newState.confidence - 15);
      newState.stress = Math.min(100, newState.stress + 20);
      newState.mentalStability = Math.max(0, newState.mentalStability - 5);
      break;
  }
  
  return newState;
}

// Calculate deviation risk for a character
export function calculateDeviationRisk(
  character: TeamCharacter,
  psychState: PsychologyState,
  factors: StabilityFactors
): DeviationRisk {
  const riskFactors: string[] = [];
  let baseRisk = 0;
  
  // Risk from low stability
  if (psychState.mentalStability < 30) {
    baseRisk += 25;
    riskFactors.push('Mental instability');
  }
  
  // Risk from high stress
  if (psychState.stress > 70) {
    baseRisk += 20;
    riskFactors.push('High stress levels');
  }
  
  // Risk from low confidence
  if (psychState.confidence < 25) {
    baseRisk += 15;
    riskFactors.push('Shattered confidence');
  }
  
  // Risk from team conflicts
  if (psychState.teamHarmony < 30) {
    baseRisk += 15;
    riskFactors.push('Poor team relationships');
  }
  
  // Risk from strategic disagreement
  if (psychState.strategicAlignment < 20) {
    baseRisk += 20;
    riskFactors.push('Rejecting coach guidance');
  }
  
  // Risk from low health
  if (character.currentHp < character.maxHp * 0.3) {
    baseRisk += 10;
    riskFactors.push('Critically wounded');
  }
  
  // Personality amplifiers
  const volatilityMultiplier = 1 + (psychState.volatility / 100);
  const finalRisk = Math.min(95, baseRisk * volatilityMultiplier);
  
  // Determine potential deviation types based on character archetype and state
  const potentialDeviations = getPotentialDeviations(character, psychState, finalRisk);
  
  return {
    character,
    currentRisk: finalRisk,
    riskFactors,
    potentialDeviations
  };
}

// Get potential deviation types based on character and state
function getPotentialDeviations(
  character: TeamCharacter,
  psychState: PsychologyState,
  riskLevel: number
): DeviationRisk['potentialDeviations'] {
  const deviations: DeviationRisk['potentialDeviations'] = [];
  
  if (riskLevel < 20) return deviations; // No risk if below threshold
  
  // Minor deviations (always possible at low risk)
  if (riskLevel > 15) {
    deviations.push({
      type: 'minor_insubordination',
      probability: Math.min(50, riskLevel),
      description: 'Might slightly modify the coach\'s strategy'
    });
  }
  
  // Strategy override (independent characters more likely)
  if (riskLevel > 25) {
    const probability = riskLevel * (psychState.independence / 100);
    deviations.push({
      type: 'strategy_override',
      probability,
      description: 'Could completely ignore coaching and do their own thing'
    });
  }
  
  // Archetype-specific deviations
  switch (character.archetype) {
    case 'warrior':
      if (riskLevel > 40) {
        deviations.push({
          type: 'berserker_rage',
          probability: riskLevel * 0.8,
          description: 'Warrior bloodlust could take over, attacking everyone'
        });
      }
      break;
      
    case 'beast':
    case 'monster':
      if (riskLevel > 35) {
        deviations.push({
          type: 'berserker_rage',
          probability: riskLevel * 1.2,
          description: 'Primal instincts could override all reasoning'
        });
        deviations.push({
          type: 'environmental_chaos',
          probability: riskLevel * 0.6,
          description: 'Might start destroying everything in sight'
        });
      }
      break;
      
    case 'mage':
      if (riskLevel > 50) {
        deviations.push({
          type: 'dimensional_escape',
          probability: riskLevel * 0.7,
          description: 'Could teleport away to avoid the conflict'
        });
        deviations.push({
          type: 'identity_crisis',
          probability: riskLevel * 0.5,
          description: 'Might transform into something completely different'
        });
      }
      break;
      
    case 'trickster':
      if (riskLevel > 30) {
        deviations.push({
          type: 'friendly_fire',
          probability: riskLevel * 0.9,
          description: 'Could play a "prank" on their own teammate'
        });
        deviations.push({
          type: 'environmental_chaos',
          probability: riskLevel * 0.8,
          description: 'Might cause chaos just for fun'
        });
      }
      break;
      
    case 'detective':
      if (riskLevel > 45) {
        deviations.push({
          type: 'pacifist_mode',
          probability: riskLevel * 0.6,
          description: 'Could decide violence isn\'t the answer'
        });
      }
      break;
  }
  
  // Universal high-risk deviations
  if (riskLevel > 70) {
    deviations.push({
      type: 'complete_breakdown',
      probability: riskLevel * 0.3,
      description: 'Total psychological collapse - anything could happen'
    });
  }
  
  return deviations.sort((a, b) => b.probability - a.probability);
}

// Roll for deviation occurrence
export function rollForDeviation(risk: DeviationRisk): DeviationEvent | null {
  const roll = Math.random() * 100;
  
  if (roll > risk.currentRisk) {
    return null; // No deviation
  }
  
  // Select which deviation type occurs based on probabilities
  let cumulativeProbability = 0;
  const adjustedRoll = Math.random() * 100;
  
  for (const potential of risk.potentialDeviations) {
    cumulativeProbability += potential.probability;
    if (adjustedRoll <= cumulativeProbability) {
      return createDeviationEvent(risk.character, potential.type);
    }
  }
  
  // Fallback to minor insubordination
  return createDeviationEvent(risk.character, 'minor_insubordination');
}

// Create a deviation event
function createDeviationEvent(character: TeamCharacter, type: DeviationType): DeviationEvent {
  const severity = getSeverity(type);
  const description = getDeviationDescription(character, type);
  const gameplayEffect = getGameplayEffect(type);
  
  return {
    characterId: character.id,
    type,
    severity,
    description,
    gameplayEffect,
    timestamp: new Date()
  };
}

function getSeverity(type: DeviationType): DeviationEvent['severity'] {
  switch (type) {
    case 'minor_insubordination': return 'minor';
    case 'strategy_override': return 'moderate';
    case 'friendly_fire': return 'moderate';
    case 'pacifist_mode': return 'major';
    case 'berserker_rage': return 'major';
    case 'identity_crisis': return 'major';
    case 'dimensional_escape': return 'major';
    case 'environmental_chaos': return 'extreme';
    case 'complete_breakdown': return 'extreme';
  }
}

function getDeviationDescription(character: TeamCharacter, type: DeviationType): string {
  const name = character.name;
  
  switch (type) {
    case 'minor_insubordination':
      return `${name} decides to modify the strategy slightly, trusting their instincts over coaching.`;
    case 'strategy_override':
      return `${name} completely ignores the coach's strategy and does their own thing!`;
    case 'friendly_fire':
      return `${name} gets confused and attacks their own teammate instead of the enemy!`;
    case 'pacifist_mode':
      return `${name} suddenly refuses to fight, believing violence is not the answer.`;
    case 'berserker_rage':
      return `${name} enters a blind rage and starts attacking everyone in sight!`;
    case 'identity_crisis':
      return `${name} has an existential crisis and believes they are something completely different!`;
    case 'dimensional_escape':
      return `${name} attempts to escape by teleporting to another dimension!`;
    case 'environmental_chaos':
      return `${name} starts attacking the arena itself, destroying equipment and threatening the judges!`;
    case 'complete_breakdown':
      return `${name} has a complete psychological breakdown - their actions become completely unpredictable!`;
  }
}

function getGameplayEffect(type: DeviationType): string {
  switch (type) {
    case 'minor_insubordination':
      return 'Slight penalty to strategy effectiveness (-10%)';
    case 'strategy_override':
      return 'Strategy bonuses completely lost this turn';
    case 'friendly_fire':
      return 'Attacks teammate instead of enemy this turn';
    case 'pacifist_mode':
      return 'Refuses to attack anyone this turn';
    case 'berserker_rage':
      return 'Attacks random target (enemy, teammate, or environment)';
    case 'identity_crisis':
      return 'Actions determined by AI interpretation of new identity';
    case 'dimensional_escape':
      return 'Character may leave battle temporarily or permanently';
    case 'environmental_chaos':
      return 'May damage arena, affect future rounds, or threaten judges';
    case 'complete_breakdown':
      return 'AI-generated chaos - anything could happen';
  }
}
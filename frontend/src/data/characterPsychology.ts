// AI Character Psychology & Breakdown System
// The revolutionary system that turns AI unpredictability into gameplay

import { TeamCharacter } from './teamBattleSystem';

// Archetype-based nature modifiers - the fundamental character essence
export interface ArchetypeNature {
  baseVolatility: number;        // 0-100: How naturally chaotic/unpredictable
  trainingEfficiency: number;    // 0.1-2.0: How well training works on this archetype
  naturalDiscipline: number;     // 0-50: Innate self-control bonus
  berserkerTendency: number;     // 0-100: Likelihood of rage-based deviations
  socialAdaptability: number;    // 0-100: How well they work in teams
  stressThreshold: number;       // 10-90: Stress level before breakdown starts
}

// Define nature by archetype - this determines base psychology before any training
export const ARCHETYPE_NATURES: Record<string, ArchetypeNature> = {
  // FERAL/WILD ARCHETYPES - High volatility, need massive training
  'dragon': {
    baseVolatility: 90,
    trainingEfficiency: 0.3,     // Very hard to train
    naturalDiscipline: 0,
    berserkerTendency: 85,
    socialAdaptability: 20,
    stressThreshold: 40          // Low stress tolerance
  },
  'beast': {
    baseVolatility: 85,
    trainingEfficiency: 0.4,
    naturalDiscipline: 5,
    berserkerTendency: 80,
    socialAdaptability: 25,
    stressThreshold: 45
  },
  'monster': {
    baseVolatility: 88,
    trainingEfficiency: 0.2,     // Extremely hard to train
    naturalDiscipline: 0,
    berserkerTendency: 90,
    socialAdaptability: 15,
    stressThreshold: 35
  },
  'trickster': {
    baseVolatility: 75,
    trainingEfficiency: 0.6,
    naturalDiscipline: 10,
    berserkerTendency: 30,       // More chaos than rage
    socialAdaptability: 60,
    stressThreshold: 55
  },
  
  // WARRIOR ARCHETYPES - Moderate volatility, responds well to training
  'warrior': {
    baseVolatility: 50,
    trainingEfficiency: 1.2,     // Good at following training
    naturalDiscipline: 25,
    berserkerTendency: 60,       // Battle rage potential
    socialAdaptability: 70,
    stressThreshold: 65
  },
  'assassin': {
    baseVolatility: 40,
    trainingEfficiency: 1.5,     // Excellent training response
    naturalDiscipline: 35,
    berserkerTendency: 20,       // Cold, calculated
    socialAdaptability: 45,
    stressThreshold: 75
  },
  
  // SCHOLARLY/DISCIPLINED ARCHETYPES - Low volatility, naturally controlled
  'detective': {
    baseVolatility: 20,
    trainingEfficiency: 1.4,
    naturalDiscipline: 40,
    berserkerTendency: 10,
    socialAdaptability: 60,
    stressThreshold: 80
  },
  'mage': {
    baseVolatility: 30,
    trainingEfficiency: 1.3,
    naturalDiscipline: 35,
    berserkerTendency: 15,
    socialAdaptability: 50,
    stressThreshold: 70
  },
  
  // HIGHLY DISCIPLINED ARCHETYPES - Very low volatility, maximum control
  'monk': {
    baseVolatility: 15,
    trainingEfficiency: 1.8,     // Exceptional training response
    naturalDiscipline: 45,
    berserkerTendency: 5,
    socialAdaptability: 80,
    stressThreshold: 85
  },
  
  // ADDITIONAL ARCHETYPES
  'mystic': {
    baseVolatility: 25,
    trainingEfficiency: 1.4,
    naturalDiscipline: 35,
    berserkerTendency: 15,
    socialAdaptability: 55,
    stressThreshold: 75
  },
  'tank': {
    baseVolatility: 35,
    trainingEfficiency: 1.1,
    naturalDiscipline: 30,
    berserkerTendency: 45,
    socialAdaptability: 75,
    stressThreshold: 70
  },
  'elementalist': {
    baseVolatility: 40,
    trainingEfficiency: 1.2,
    naturalDiscipline: 25,
    berserkerTendency: 25,
    socialAdaptability: 50,
    stressThreshold: 65
  },
  'support': {
    baseVolatility: 20,
    trainingEfficiency: 1.5,
    naturalDiscipline: 35,
    berserkerTendency: 10,
    socialAdaptability: 85,
    stressThreshold: 75
  },
  'leader': {
    baseVolatility: 30,
    trainingEfficiency: 1.3,
    naturalDiscipline: 40,
    berserkerTendency: 25,
    socialAdaptability: 80,
    stressThreshold: 70
  },
  'alien': {
    baseVolatility: 60,
    trainingEfficiency: 0.7,     // Alien logic hard to train
    naturalDiscipline: 15,
    berserkerTendency: 50,
    socialAdaptability: 30,
    stressThreshold: 50
  },
  'mercenary': {
    baseVolatility: 45,
    trainingEfficiency: 1.1,
    naturalDiscipline: 25,
    berserkerTendency: 35,
    socialAdaptability: 50,
    stressThreshold: 60
  },
  'cowboy': {
    baseVolatility: 55,
    trainingEfficiency: 0.9,
    naturalDiscipline: 20,
    berserkerTendency: 40,
    socialAdaptability: 65,
    stressThreshold: 55
  },
  'biker': {
    baseVolatility: 65,
    trainingEfficiency: 0.8,
    naturalDiscipline: 15,
    berserkerTendency: 55,
    socialAdaptability: 60,
    stressThreshold: 50
  },
  
  // DEFAULT for unknown archetypes
  'default': {
    baseVolatility: 50,
    trainingEfficiency: 1.0,
    naturalDiscipline: 20,
    berserkerTendency: 40,
    socialAdaptability: 60,
    stressThreshold: 60
  }
};

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

// Relationship-based deviation modifiers
export interface CharacterRelationship {
  characterId: string;
  relationship: 'ally' | 'rival' | 'enemy' | 'neutral' | 'romantic' | 'mentor' | 'protege';
  strength: number; // -100 to +100, negative = hate, positive = love
  reason?: string;  // Why they have this relationship
}

export function calculateRelationshipStress(
  character: TeamCharacter,
  teammates: TeamCharacter[]
): { stress: number, riskFactors: string[], friendlyFireTargets: string[] } {
  let relationshipStress = 0;
  const riskFactors: string[] = [];
  const friendlyFireTargets: string[] = [];
  
  // Check relationships with current teammates
  teammates.forEach(teammate => {
    if (teammate.id === character.id) return;
    
    // Look for relationship in character's personality data
    const relationship = character.personalityTraits?.find(trait => 
      trait.includes(teammate.name) || trait.includes(teammate.id)
    );
    
    // Check for known character conflicts (hardcoded for now)
    const conflictStrength = getCharacterConflictStrength(character.name, teammate.name);
    
    if (conflictStrength < -50) {
      relationshipStress += Math.abs(conflictStrength) * 0.5; // Strong hatred = major stress
      riskFactors.push(`Hates ${teammate.name} (${conflictStrength})`);
      friendlyFireTargets.push(teammate.id);
    } else if (conflictStrength < -20) {
      relationshipStress += Math.abs(conflictStrength) * 0.3; // Dislike = moderate stress
      riskFactors.push(`Dislikes ${teammate.name} (${conflictStrength})`);
    }
  });
  
  return { stress: relationshipStress, riskFactors, friendlyFireTargets };
}

// Hardcoded character relationships - in real implementation this would come from character data
function getCharacterConflictStrength(char1: string, char2: string): number {
  const conflicts: Record<string, Record<string, number>> = {
    'Sherlock Holmes': {
      'Count Dracula': -70,  // Holmes vs supernatural = major conflict
      'Loki': -60,          // Logic vs chaos
      'Frankenstein Monster': -50 // Science vs abomination
    },
    'Count Dracula': {
      'Sherlock Holmes': -70,
      'Joan of Arc': -85,    // Evil vs holy = extreme conflict
      'Tesla': -45          // Old world vs new science
    },
    'Joan of Arc': {
      'Count Dracula': -85,
      'Loki': -75,          // Good vs evil trickster
      'Achilles': -30       // Different warrior codes
    },
    'Achilles': {
      'Joan of Arc': -30,
      'Tesla': -40,         // Ancient vs modern
      'Genghis Khan': -60   // Rival conquerors
    },
    'Genghis Khan': {
      'Achilles': -60,
      'Cleopatra': -50,     // Rival rulers
      'Tesla': -35          // Conqueror vs inventor
    },
    'Tesla': {
      'Count Dracula': -45,
      'Achilles': -40,
      'Genghis Khan': -35,
      'Merlin': 30          // Science + magic = interesting
    }
  };
  
  return conflicts[char1]?.[char2] || conflicts[char2]?.[char1] || 0;
}

// Initialize psychology state for a character
export function initializePsychologyState(
  character: TeamCharacter, 
  headquartersEffects?: { bonuses: Record<string, number>, penalties: Record<string, number> },
  teammates?: TeamCharacter[]
): PsychologyState {
  // Get archetype nature - this is the foundation of character psychology
  const nature = ARCHETYPE_NATURES[character.archetype] || ARCHETYPE_NATURES['default'];
  const psychStats = character.psychStats;
  
  // Training effectiveness based on archetype nature
  const effectiveTraining = psychStats.training * nature.trainingEfficiency;
  const trainingStressResistance = Math.min(50, effectiveTraining * 0.5); // Max 50 stress reduction
  const trainingDiscipline = Math.min(40, effectiveTraining * 0.4); // Max 40 discipline bonus
  
  // Calculate environmental stress from living conditions
  let environmentalStress = 0;
  let teamChemistryPenalty = 0;
  let mentalStabilityPenalty = 0;
  
  if (headquartersEffects?.penalties) {
    // Convert headquarters penalties to psychology effects
    const moralePenalty = headquartersEffects.penalties['Morale'] || 0;
    const teamworkPenalty = headquartersEffects.penalties['Teamwork'] || 0;
    const allStatsPenalty = headquartersEffects.penalties['All Stats'] || 0;
    
    // Environmental stress modified by archetype stress threshold
    const baseDormStress = Math.abs(moralePenalty) * 2; // -30 morale = +60 stress
    environmentalStress = baseDormStress * (100 - nature.stressThreshold) / 100; // High threshold = less affected
    
    // Team chemistry penalty modified by social adaptability
    const baseTeamPenalty = Math.abs(teamworkPenalty); // -25 teamwork = -25 harmony
    teamChemistryPenalty = baseTeamPenalty * (100 - nature.socialAdaptability) / 100; // High adaptability = less affected
    
    // Mental stability penalty - some archetypes naturally more fragile
    mentalStabilityPenalty = Math.abs(allStatsPenalty) * 1.5; // -18 all stats = -27 stability
  }
  
  // Calculate relationship stress with teammates
  let relationshipStress = 0;
  if (teammates && teammates.length > 0) {
    const relationshipData = calculateRelationshipStress(character, teammates);
    relationshipStress = relationshipData.stress;
    // Additional team chemistry penalty from bad relationships
    teamChemistryPenalty += relationshipStress * 0.3;
  }
  
  return {
    // Mental stability: base health + training bonus - environmental damage
    mentalStability: Math.max(0, 
      psychStats.mentalHealth + 
      (trainingDiscipline * 0.3) - 
      mentalStabilityPenalty
    ),
    
    confidence: 50 + (character.level * 2), // Higher level = more confident
    
    // Stress: archetype threshold + environmental + relationship - training resistance
    stress: Math.max(5, Math.min(100, 
      (100 - nature.stressThreshold) + 
      environmentalStress + 
      relationshipStress - 
      trainingStressResistance
    )),
    
    // Team harmony: base teamPlayer + nature adaptability - conflicts
    teamHarmony: Math.max(0, 
      psychStats.teamPlayer + 
      (nature.socialAdaptability * 0.3) - 
      teamChemistryPenalty
    ),
    
    // Battle focus: training + natural discipline - stress effects
    battleFocus: Math.max(0, 
      effectiveTraining + 
      nature.naturalDiscipline - 
      (environmentalStress * 0.2)
    ),
    
    // Strategic alignment: training effectiveness + discipline - team conflicts
    strategicAlignment: Math.max(0, 
      effectiveTraining + 
      nature.naturalDiscipline - 
      (teamChemistryPenalty * 0.3)
    ),
    
    painTolerance: 50 + psychStats.mentalHealth / 2,
    
    // Volatility: archetype base - training discipline + environmental stress
    volatility: Math.max(5, Math.min(100, 
      nature.baseVolatility - 
      trainingDiscipline + 
      (environmentalStress * 0.3)
    )),
    
    independence: psychStats.ego + (nature.baseVolatility * 0.2), // Wild nature = more independent
    leadership: Math.min(100, psychStats.ego + psychStats.communication) // Unchanged
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
  factors: StabilityFactors,
  teammates?: TeamCharacter[]
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
  
  // Risk from relationship conflicts
  let relationshipRisk = 0;
  let friendlyFireTargets: string[] = [];
  if (teammates && teammates.length > 0) {
    const relationshipData = calculateRelationshipStress(character, teammates);
    relationshipRisk = relationshipData.stress * 0.2; // Convert stress to risk
    riskFactors.push(...relationshipData.riskFactors);
    friendlyFireTargets = relationshipData.friendlyFireTargets;
    baseRisk += relationshipRisk;
  }
  
  // Personality amplifiers
  const volatilityMultiplier = 1 + (psychState.volatility / 100);
  const finalRisk = Math.min(95, baseRisk * volatilityMultiplier);
  
  // Determine potential deviation types based on character archetype and state
  const potentialDeviations = getPotentialDeviations(character, psychState, finalRisk, friendlyFireTargets);
  
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
  riskLevel: number,
  friendlyFireTargets: string[] = []
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
  
  // Archetype-specific deviations based on nature
  const nature = ARCHETYPE_NATURES[character.archetype] || ARCHETYPE_NATURES['default'];
  
  // BERSERKER RAGE - based on berserker tendency
  if (riskLevel > 25 && nature.berserkerTendency > 50) {
    const berserkerProbability = (riskLevel * nature.berserkerTendency) / 100;
    deviations.push({
      type: 'berserker_rage',
      probability: berserkerProbability,
      description: `${character.archetype === 'dragon' ? 'Draconic fury' : 
                    character.archetype === 'beast' ? 'Primal instincts' :
                    character.archetype === 'monster' ? 'Monstrous rage' :
                    character.archetype === 'warrior' ? 'Battle fury' : 'Uncontrolled rage'} takes over, attacking everyone in sight`
    });
  }
  
  // ENVIRONMENTAL CHAOS - wild archetypes love destruction
  if (riskLevel > 30 && (character.archetype === 'dragon' || character.archetype === 'beast' || character.archetype === 'monster')) {
    deviations.push({
      type: 'environmental_chaos',
      probability: riskLevel * 0.7,
      description: `${character.archetype === 'dragon' ? 'Breathes fire at the arena itself' :
                    'Starts destroying everything in a wild rampage'}`
    });
  }
  
  // FRIENDLY FIRE - tricksters, unstable archetypes, or character hatred
  const hasFriendlyFireTargets = friendlyFireTargets.length > 0;
  if (riskLevel > 35 && (character.archetype === 'trickster' || nature.socialAdaptability < 40 || hasFriendlyFireTargets)) {
    const probability = hasFriendlyFireTargets ? 
      riskLevel * 1.2 : // Much higher chance if they hate someone
      riskLevel * (character.archetype === 'trickster' ? 0.9 : 0.6);
      
    deviations.push({
      type: 'friendly_fire',
      probability,
      description: hasFriendlyFireTargets ?
        `Hatred for teammate overrides strategy - "accidentally" attacks them` :
        character.archetype === 'trickster' ? 
          'Plays a dangerous "prank" on their teammate' :
          'Confusion and chaos leads to attacking the wrong target'
    });
  }
  
  // PACIFIST MODE - highly disciplined archetypes might refuse violence
  if (riskLevel > 45 && (character.archetype === 'detective' || character.archetype === 'monk')) {
    deviations.push({
      type: 'pacifist_mode',
      probability: riskLevel * 0.6,
      description: 'Decides violence is not the answer and refuses to fight'
    });
  }
  
  // DIMENSIONAL ESCAPE - magical archetypes
  if (riskLevel > 50 && character.archetype === 'mage') {
    deviations.push({
      type: 'dimensional_escape',
      probability: riskLevel * 0.7,
      description: 'Attempts to teleport away from the conflict entirely'
    });
  }
  
  // IDENTITY CRISIS - magical or unstable archetypes
  if (riskLevel > 55 && (character.archetype === 'mage' || nature.baseVolatility > 70)) {
    deviations.push({
      type: 'identity_crisis',
      probability: riskLevel * 0.5,
      description: 'Has an existential breakdown and believes they are something else entirely'
    });
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
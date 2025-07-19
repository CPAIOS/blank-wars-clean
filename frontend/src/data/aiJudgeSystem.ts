// AI Judge System - Hanging Judge for Character Chaos
// Interprets AI-generated chaos and converts it into game mechanics

import { DeviationEvent, DeviationType } from './characterPsychology';
import { TeamCharacter } from './teamBattleSystem';
import { FinancialDecision } from './characters';

export interface JudgeDecision {
  ruling: string;                    // The judge's explanation
  mechanicalEffect: JudgeEffect;     // How it affects the game
  narrative: string;                 // Flavor text for what happened
  precedent?: string;                // Sets precedent for similar future events
}

export interface JudgeEffect {
  type: 'damage' | 'heal' | 'skip_turn' | 'redirect_attack' | 'stat_change' | 'environmental' | 'special';
  target?: 'self' | 'teammate' | 'opponent' | 'all' | 'environment' | 'judges';
  amount?: number;                   // Damage/healing amount
  duration?: number;                 // How many turns the effect lasts
  statChanges?: {                    // Temporary stat modifications
    stat: string;
    change: number;
    duration: number;
  }[];
  specialEffect?: string;            // Custom effects that need manual handling
}

// Financial-specific Judge interfaces
export interface FinancialJudgeDecision {
  ruling: string;
  commentary: string;
  riskAssessment: 'excellent' | 'good' | 'questionable' | 'poor' | 'catastrophic';
  coachEvaluation: 'excellent_guidance' | 'good_advice' | 'missed_opportunity' | 'poor_advice' | 'harmful_guidance';
  interventionRecommendation?: string;
  precedent?: string;
}

export interface FinancialEventContext {
  characterId: string;
  eventType: 'decision' | 'outcome' | 'spiral' | 'intervention' | 'wildcard';
  financialImpact: number;
  stressLevel: number;
  spiralIntensity?: number;
  coachInvolvement: boolean;
  battleContext?: {
    emotionalState: string;
    triggerEvent: string;
    performanceLevel: string;
  };
}

export interface JudgePersonality {
  name: string;
  style: 'strict' | 'lenient' | 'chaotic' | 'theatrical' | 'logical';
  description: string;
  rulingTendencies: {
    favorsDamage: number;      // 0-100, how much they like damage-based solutions
    favorsCreativity: number;  // 0-100, how much they reward creative chaos
    strictnessLevel: number;   // 0-100, how much they punish deviations
    narrativeFocus: number;    // 0-100, how much they prioritize story over mechanics
  };
  financialTendencies: {
    riskTolerance: number;     // 0-100, how much they tolerate financial risks
    disciplineFocus: number;   // 0-100, how much they value financial discipline
    sympathyForStruggles: number; // 0-100, how much they understand financial stress
    coachSupportLevel: number; // 0-100, how much they support coach interventions
  };
}

// Different judge personalities for variety
export const judgePersonalities: JudgePersonality[] = [
  {
    name: 'Judge Executioner',
    style: 'strict',
    description: 'A no-nonsense military judge who values order and discipline',
    rulingTendencies: {
      favorsDamage: 70,
      favorsCreativity: 20,
      strictnessLevel: 90,
      narrativeFocus: 40
    },
    financialTendencies: {
      riskTolerance: 20,
      disciplineFocus: 95,
      sympathyForStruggles: 30,
      coachSupportLevel: 85
    }
  },
  {
    name: 'Judge Chaos',
    style: 'chaotic',
    description: 'A wild card who embraces unpredictability and rewards bold moves',
    rulingTendencies: {
      favorsDamage: 60,
      favorsCreativity: 95,
      strictnessLevel: 10,
      narrativeFocus: 80
    },
    financialTendencies: {
      riskTolerance: 90,
      disciplineFocus: 15,
      sympathyForStruggles: 70,
      coachSupportLevel: 40
    }
  },
  {
    name: 'Judge Wisdom',
    style: 'logical',
    description: 'A calculated AI judge who makes decisions based on pure logic',
    rulingTendencies: {
      favorsDamage: 50,
      favorsCreativity: 60,
      strictnessLevel: 70,
      narrativeFocus: 30
    },
    financialTendencies: {
      riskTolerance: 55,
      disciplineFocus: 80,
      sympathyForStruggles: 60,
      coachSupportLevel: 75
    }
  },
  {
    name: 'Judge Spectacle',
    style: 'theatrical',
    description: 'A theatrical judge who favors spectacular combat and dramatic moments',
    rulingTendencies: {
      favorsDamage: 80,
      favorsCreativity: 85,
      strictnessLevel: 30,
      narrativeFocus: 95
    },
    financialTendencies: {
      riskTolerance: 75,
      disciplineFocus: 40,
      sympathyForStruggles: 85,
      coachSupportLevel: 60
    }
  },
  {
    name: 'Judge Mercy',
    style: 'lenient',
    description: 'A compassionate judge who tries to minimize harm while maintaining fairness',
    rulingTendencies: {
      favorsDamage: 20,
      favorsCreativity: 70,
      strictnessLevel: 40,
      narrativeFocus: 60
    },
    financialTendencies: {
      riskTolerance: 45,
      disciplineFocus: 60,
      sympathyForStruggles: 95,
      coachSupportLevel: 90
    }
  }
];

// Store previous rulings to maintain consistency
const rulingPrecedents: Map<string, JudgeDecision[]> = new Map();
const financialRulingPrecedents: Map<string, FinancialJudgeDecision[]> = new Map();

// Main judge decision function
export function makeJudgeDecision(
  deviation: DeviationEvent,
  character: TeamCharacter,
  battleContext: {
    currentRound: number;
    opponentCharacter: TeamCharacter;
    teammateCharacter?: TeamCharacter;
    arenaCondition: 'pristine' | 'damaged' | 'destroyed';
  },
  activeJudge?: JudgePersonality,
  aiGeneratedAction?: string
): JudgeDecision {
  
  const judge = activeJudge || getRandomJudge();
  const precedentKey = `${deviation.type}_${judge.name}`;
  
  // Check for precedents
  const pastRulings = rulingPrecedents.get(precedentKey) || [];
  
  // Base decision on deviation type and judge personality
  let decision: JudgeDecision;
  
  if (aiGeneratedAction) {
    // AI provided specific action - judge interprets it
    decision = interpretAIAction(deviation, aiGeneratedAction, judge, battleContext, character);
  } else {
    // Standard deviation - use template decision
    decision = getTemplateDecision(deviation, judge, battleContext, character);
  }
  
  // Store precedent
  pastRulings.push(decision);
  rulingPrecedents.set(precedentKey, pastRulings);
  
  return decision;
}

// Main financial decision evaluation function
export function makeFinancialJudgeDecision(
  context: FinancialEventContext,
  decision: FinancialDecision,
  outcome?: { success: boolean; actualImpact: number; stressChange: number },
  activeJudge?: JudgePersonality
): FinancialJudgeDecision {
  
  const judge = activeJudge || getRandomJudge();
  const precedentKey = `${context.eventType}_${judge.name}`;
  
  // Check for precedents
  const pastRulings = financialRulingPrecedents.get(precedentKey) || [];
  
  let judgeDecision: FinancialJudgeDecision;
  
  if (outcome) {
    // Evaluate completed decision with known outcome
    judgeDecision = evaluateFinancialOutcome(context, decision, outcome, judge);
  } else {
    // Evaluate decision in progress or prevention opportunity
    judgeDecision = evaluateFinancialDecision(context, decision, judge);
  }
  
  // Store precedent
  pastRulings.push(judgeDecision);
  financialRulingPrecedents.set(precedentKey, pastRulings);
  
  return judgeDecision;
}

// Interpret AI-generated action into game mechanics
function interpretAIAction(
  deviation: DeviationEvent,
  aiAction: string,
  judge: JudgePersonality,
  battleContext: any,
  character: TeamCharacter
): JudgeDecision {
  
  const action = aiAction.toLowerCase();
  let effect: JudgeEffect;
  let ruling: string;
  let narrative: string;
  
  // Pattern matching on AI action to determine mechanical effect
  if (action.includes('attack') && action.includes('everyone')) {
    // Berserker attacking everyone
    effect = {
      type: 'redirect_attack',
      target: 'all',
      amount: Math.floor(character.traditionalStats.strength * 0.7) // Reduced damage to all
    };
    ruling = `${judge.name} rules: Berserker rage affects all combatants equally!`;
    narrative = `${character.name} ${aiAction}`;
    
  } else if (action.includes('refuse') || action.includes("won't fight")) {
    // Pacifist mode
    effect = {
      type: 'skip_turn',
      target: 'self',
      duration: 1
    };
    ruling = `${judge.name} rules: Pacifist stance respected, but turn is forfeit.`;
    narrative = `${character.name} ${aiAction}`;
    
  } else if (action.includes('teammate') || action.includes('friend')) {
    // Friendly fire
    effect = {
      type: 'redirect_attack',
      target: 'teammate',
      amount: Math.floor(character.traditionalStats.strength * 0.8)
    };
    ruling = `${judge.name} rules: Misdirected aggression penalized!`;
    narrative = `${character.name} ${aiAction}`;
    
  } else if (action.includes('teleport') || action.includes('dimension') || action.includes('escape')) {
    // Dimensional escape
    const escapeSuccessful = Math.random() < 0.6; // 60% chance of success
    if (escapeSuccessful) {
      effect = {
        type: 'special',
        specialEffect: 'temporary_removal',
        duration: Math.floor(Math.random() * 3) + 1 // 1-3 rounds
      };
      ruling = `${judge.name} rules: Dimensional travel successful! Character temporarily removed from battle.`;
    } else {
      effect = {
        type: 'damage',
        target: 'self',
        amount: 15 // Backfire damage
      };
      ruling = `${judge.name} rules: Dimensional travel failed! Teleportation backfire!`;
    }
    narrative = `${character.name} ${aiAction}`;
    
  } else if (action.includes('destroy') || action.includes('arena') || action.includes('environment')) {
    // Environmental destruction
    effect = {
      type: 'environmental',
      specialEffect: 'arena_damage',
      amount: 25 // Damage to arena
    };
    ruling = `${judge.name} rules: Environmental destruction noted! Arena repair costs will be deducted!`;
    narrative = `${character.name} ${aiAction}`;
    
  } else if (action.includes('judge') || action.includes('referee')) {
    // Attacking judges
    effect = {
      type: 'special',
      specialEffect: 'judge_threatened',
      amount: 50 // Heavy penalty
    };
    ruling = `${judge.name} rules: CONTEMPT OF COURT! Security intervention required!`;
    narrative = `${character.name} ${aiAction} - Security rushes in!`;
    
  } else if (action.includes('grass') || action.includes('tree') || action.includes('become')) {
    // Identity crisis transformations
    effect = {
      type: 'stat_change',
      statChanges: [
        { stat: 'speed', change: -50, duration: 3 },
        { stat: 'defense', change: 20, duration: 3 }
      ]
    };
    ruling = `${judge.name} rules: Identity transformation affects combat capability!`;
    narrative = `${character.name} ${aiAction}`;
    
  } else {
    // Generic chaos - judge improvises
    effect = interpretGenericChaos(aiAction, judge, character);
    ruling = `${judge.name} rules: Unprecedented action requires creative interpretation!`;
    narrative = `${character.name} ${aiAction}`;
  }
  
  // Apply judge personality to ruling
  ruling = applyJudgePersonality(ruling, judge, deviation.severity);
  
  return {
    ruling,
    mechanicalEffect: effect,
    narrative,
    precedent: `${deviation.type}: ${effect.type}`
  };
}

// Get template decision for standard deviations
function getTemplateDecision(
  deviation: DeviationEvent,
  judge: JudgePersonality,
  battleContext: any,
  character: TeamCharacter
): JudgeDecision {
  
  let effect: JudgeEffect;
  let ruling: string;
  let narrative: string;
  
  switch (deviation.type) {
    case 'minor_insubordination':
      effect = {
        type: 'stat_change',
        statChanges: [{ stat: 'effectiveness', change: -10, duration: 1 }]
      };
      ruling = `${judge.name}: Minor coaching violation noted. Slight performance penalty.`;
      narrative = deviation.description;
      break;
      
    case 'strategy_override':
      effect = {
        type: 'special',
        specialEffect: 'lose_strategy_bonuses'
      };
      ruling = `${judge.name}: Complete strategic insubordination. All coaching bonuses revoked this turn.`;
      narrative = deviation.description;
      break;
      
    case 'friendly_fire':
      effect = {
        type: 'redirect_attack',
        target: 'teammate',
        amount: Math.floor(character.traditionalStats.strength * 0.6)
      };
      ruling = `${judge.name}: Misdirected aggression results in friendly fire incident!`;
      narrative = deviation.description;
      break;
      
    case 'berserker_rage':
      const targets = ['opponent', 'teammate', 'environment'];
      const randomTarget = targets[Math.floor(Math.random() * targets.length)];
      effect = {
        type: 'redirect_attack',
        target: randomTarget as any,
        amount: Math.floor(character.traditionalStats.strength * 1.2) // Stronger but random
      };
      ruling = `${judge.name}: Berserker rage redirects violence unpredictably!`;
      narrative = deviation.description;
      break;
      
    default:
      effect = {
        type: 'special',
        specialEffect: 'ai_interpretation_required'
      };
      ruling = `${judge.name}: Unprecedented situation requires AI interpretation!`;
      narrative = deviation.description;
  }
  
  ruling = applyJudgePersonality(ruling, judge, deviation.severity);
  
  return {
    ruling,
    mechanicalEffect: effect,
    narrative
  };
}

// Interpret completely chaotic AI actions
function interpretGenericChaos(
  aiAction: string,
  judge: JudgePersonality,
  character: TeamCharacter
): JudgeEffect {
  
  // Use judge personality to determine interpretation style
  if (judge.rulingTendencies.favorsDamage > 70) {
    // Damage-focused interpretation
    return {
      type: 'damage',
      target: Math.random() > 0.5 ? 'opponent' : 'self',
      amount: Math.floor(Math.random() * 30) + 10
    };
  } else if (judge.rulingTendencies.favorsCreativity > 80) {
    // Creative interpretation
    return {
      type: 'special',
      specialEffect: `creative_chaos: ${aiAction.substring(0, 50)}`,
      duration: Math.floor(Math.random() * 3) + 1
    };
  } else {
    // Balanced interpretation
    return {
      type: 'stat_change',
      statChanges: [
        { 
          stat: ['strength', 'speed', 'defense'][Math.floor(Math.random() * 3)], 
          change: (Math.random() - 0.5) * 40, // -20 to +20
          duration: 2 
        }
      ]
    };
  }
}

// Apply judge personality to ruling text
function applyJudgePersonality(
  baseRuling: string,
  judge: JudgePersonality,
  severity: 'minor' | 'moderate' | 'major' | 'extreme'
): string {
  
  let personalityFlavor = '';
  
  switch (judge.style) {
    case 'strict':
      personalityFlavor = severity === 'extreme' ? ' UNACCEPTABLE CONDUCT!' : 
                         severity === 'major' ? ' This disruption will not be tolerated!' :
                         ' Maintain discipline, combatant.';
      break;
      
    case 'chaotic':
      personalityFlavor = severity === 'extreme' ? ' NOW WE\'RE COOKING WITH FIRE!' :
                         severity === 'major' ? ' I LOVE the creativity!' :
                         ' Spice things up, why don\'t you?';
      break;
      
    case 'theatrical':
      personalityFlavor = severity === 'extreme' ? ' LADIES AND GENTLEMEN, WITNESS PURE CHAOS!' :
                         severity === 'major' ? ' What a spectacular display!' :
                         ' The crowd is on the edge of their seats!';
      break;
      
    case 'logical':
      personalityFlavor = severity === 'extreme' ? ' Probability calculations indicate unprecedented outcomes.' :
                         severity === 'major' ? ' Logical analysis suggests adaptive ruling required.' :
                         ' Standard protocols apply.';
      break;
      
    case 'lenient':
      personalityFlavor = severity === 'extreme' ? ' While concerning, we must show understanding.' :
                         severity === 'major' ? ' Perhaps rehabilitation rather than punishment?' :
                         ' Everyone deserves a second chance.';
      break;
  }
  
  return baseRuling + personalityFlavor;
}

// Get random judge for variety
export function getRandomJudge(): JudgePersonality {
  return judgePersonalities[Math.floor(Math.random() * judgePersonalities.length)];
}

// Generate AI prompt for character going rogue
export function generateDeviationPrompt(
  character: TeamCharacter,
  deviation: DeviationEvent,
  battleContext: {
    currentRound: number;
    opponentName: string;
    teammateName?: string;
    currentSituation: string;
  }
): string {
  
  const basePrompt = `
You are ${character.name}, a ${character.archetype} in the middle of an intense battle.

Current Situation: ${battleContext.currentSituation}
Round: ${battleContext.currentRound}
Opponent: ${battleContext.opponentName}
${battleContext.teammateName ? `Teammate: ${battleContext.teammateName}` : ''}

Your psychological state has deteriorated and you are experiencing: ${deviation.description}

Your personality:
- Archetype: ${character.archetype}
- Mental state: Highly unstable
- Current crisis: ${deviation.type.replace('_', ' ')}

Describe in 1-2 sentences exactly what chaotic action you take right now. Be creative and embrace the unpredictability, but stay true to your character archetype.

Examples based on your crisis type:
${getDeviationExamples(deviation.type, character.archetype)}

Your action:`;

  return basePrompt;
}

// Financial evaluation helper functions
function evaluateFinancialOutcome(
  context: FinancialEventContext,
  decision: FinancialDecision,
  outcome: { success: boolean; actualImpact: number; stressChange: number },
  judge: JudgePersonality
): FinancialJudgeDecision {
  
  const riskAssessment = assessRiskLevel(decision, outcome, judge);
  const coachEvaluation = evaluateCoachPerformance(decision, outcome, judge);
  const ruling = generateFinancialRuling(context, decision, outcome, judge);
  const commentary = generateFinancialCommentary(context, decision, outcome, judge);
  
  return {
    ruling,
    commentary,
    riskAssessment,
    coachEvaluation,
    interventionRecommendation: shouldRecommendIntervention(context, outcome, judge) ? 
      generateInterventionRecommendation(context, judge) : undefined,
    precedent: `${context.eventType}: ${riskAssessment}_outcome`
  };
}

function evaluateFinancialDecision(
  context: FinancialEventContext,
  decision: FinancialDecision,
  judge: JudgePersonality
): FinancialJudgeDecision {
  
  // Evaluate decision potential without knowing outcome
  const riskAssessment = assessDecisionRisk(decision, context, judge);
  const coachEvaluation = evaluateCoachAdvice(decision, judge);
  const ruling = generateDecisionRuling(context, decision, judge);
  const commentary = generateDecisionCommentary(context, decision, judge);
  
  return {
    ruling,
    commentary,
    riskAssessment,
    coachEvaluation,
    interventionRecommendation: shouldRecommendPreventiveIntervention(context, decision, judge) ? 
      generateInterventionRecommendation(context, judge) : undefined,
    precedent: `${context.eventType}: ${riskAssessment}_decision`
  };
}

function assessRiskLevel(
  decision: FinancialDecision,
  outcome: { success: boolean; actualImpact: number; stressChange: number },
  judge: JudgePersonality
): 'excellent' | 'good' | 'questionable' | 'poor' | 'catastrophic' {
  
  const impactSeverity = Math.abs(outcome.actualImpact);
  const stressSeverity = Math.abs(outcome.stressChange);
  
  if (outcome.success && outcome.actualImpact > 0 && outcome.stressChange <= 0) {
    return 'excellent';
  } else if (outcome.success && stressSeverity <= 10) {
    return 'good';
  } else if (!outcome.success && stressSeverity <= 20) {
    return 'questionable';
  } else if (!outcome.success && stressSeverity <= 40) {
    return 'poor';
  } else {
    return 'catastrophic';
  }
}

function evaluateCoachPerformance(
  decision: FinancialDecision,
  outcome: { success: boolean; actualImpact: number; stressChange: number },
  judge: JudgePersonality
): 'excellent_guidance' | 'good_advice' | 'missed_opportunity' | 'poor_advice' | 'harmful_guidance' {
  
  if (!decision.coachAdvice) {
    return outcome.success ? 'missed_opportunity' : 'missed_opportunity';
  }
  
  if (decision.followedAdvice) {
    if (outcome.success && outcome.stressChange <= 0) {
      return 'excellent_guidance';
    } else if (outcome.success) {
      return 'good_advice';
    } else if (outcome.stressChange > 30) {
      return 'harmful_guidance';
    } else {
      return 'poor_advice';
    }
  } else {
    // Ignored advice
    if (outcome.success) {
      return judge.financialTendencies.coachSupportLevel > 70 ? 'missed_opportunity' : 'good_advice';
    } else {
      return 'excellent_guidance'; // Coach was right to warn
    }
  }
}

function assessDecisionRisk(
  decision: FinancialDecision,
  context: FinancialEventContext,
  judge: JudgePersonality
): 'excellent' | 'good' | 'questionable' | 'poor' | 'catastrophic' {
  
  const riskFactors = [
    decision.amount > 10000 ? 20 : 0,
    context.stressLevel > 70 ? 30 : 0,
    context.spiralIntensity && context.spiralIntensity > 50 ? 25 : 0,
    !decision.coachAdvice && context.stressLevel > 50 ? 15 : 0,
    context.battleContext ? 10 : 0 // Battle emotions add risk
  ];
  
  const totalRisk = riskFactors.reduce((sum, factor) => sum + factor, 0);
  
  if (totalRisk <= 10) return 'excellent';
  if (totalRisk <= 25) return 'good';
  if (totalRisk <= 50) return 'questionable';
  if (totalRisk <= 75) return 'poor';
  return 'catastrophic';
}

function evaluateCoachAdvice(
  decision: FinancialDecision,
  judge: JudgePersonality
): 'excellent_guidance' | 'good_advice' | 'missed_opportunity' | 'poor_advice' | 'harmful_guidance' {
  
  if (!decision.coachAdvice) {
    return 'missed_opportunity';
  }
  
  // Evaluate advice quality based on judge's perspective
  if (judge.financialTendencies.coachSupportLevel > 80) {
    return decision.followedAdvice ? 'excellent_guidance' : 'good_advice';
  } else if (judge.financialTendencies.coachSupportLevel > 60) {
    return 'good_advice';
  } else {
    return 'missed_opportunity';
  }
}

function shouldRecommendIntervention(
  context: FinancialEventContext,
  outcome: { success: boolean; actualImpact: number; stressChange: number },
  judge: JudgePersonality
): boolean {
  
  return (
    (context.spiralIntensity && context.spiralIntensity > 60) ||
    (outcome.stressChange > 25 && judge.financialTendencies.sympathyForStruggles > 70) ||
    (!outcome.success && outcome.stressChange > 40)
  );
}

function shouldRecommendPreventiveIntervention(
  context: FinancialEventContext,
  decision: FinancialDecision,
  judge: JudgePersonality
): boolean {
  
  return (
    (context.stressLevel > 80 && judge.financialTendencies.sympathyForStruggles > 60) ||
    (context.spiralIntensity && context.spiralIntensity > 70) ||
    (decision.amount > 15000 && context.stressLevel > 60)
  );
}

function generateInterventionRecommendation(
  context: FinancialEventContext,
  judge: JudgePersonality
): string {
  
  if (context.spiralIntensity && context.spiralIntensity > 70) {
    return judge.financialTendencies.coachSupportLevel > 80 ? 
      'Emergency coaching intervention required - spiral pattern detected' :
      'Cooling-off period recommended before further decisions';
  } else if (context.stressLevel > 80) {
    return 'Stress management support needed before continuing financial decisions';
  } else {
    return 'Coach consultation recommended for next major financial decision';
  }
}

function generateFinancialRuling(
  context: FinancialEventContext,
  decision: FinancialDecision,
  outcome: { success: boolean; actualImpact: number; stressChange: number },
  judge: JudgePersonality
): string {
  
  const baseRuling = outcome.success ? 
    `${judge.name} rules: Financial decision resulted in positive outcome` :
    `${judge.name} rules: Financial decision resulted in negative consequences`;
    
  return applyJudgePersonalityToFinancial(baseRuling, judge, context, outcome);
}

function generateFinancialCommentary(
  context: FinancialEventContext,
  decision: FinancialDecision,
  outcome: { success: boolean; actualImpact: number; stressChange: number },
  judge: JudgePersonality
): string {
  
  let commentary = '';
  
  if (context.battleContext) {
    commentary += `Battle emotions clearly influenced this ${decision.decision} decision. `;
  }
  
  if (decision.followedAdvice && outcome.success) {
    commentary += 'Coach guidance proved valuable. ';
  } else if (!decision.followedAdvice && !outcome.success) {
    commentary += 'Perhaps coach consultation would have helped. ';
  }
  
  if (outcome.stressChange > 20) {
    commentary += 'The psychological impact requires attention. ';
  }
  
  return commentary.trim() || 'Standard financial decision processing.';
}

function generateDecisionRuling(
  context: FinancialEventContext,
  decision: FinancialDecision,
  judge: JudgePersonality
): string {
  
  const baseRuling = context.stressLevel > 70 ? 
    `${judge.name} observes: High-stress financial decision in progress` :
    `${judge.name} observes: Financial decision under evaluation`;
    
  return applyJudgePersonalityToFinancial(baseRuling, judge, context);
}

function generateDecisionCommentary(
  context: FinancialEventContext,
  decision: FinancialDecision,
  judge: JudgePersonality
): string {
  
  let commentary = '';
  
  if (context.battleContext) {
    commentary += `Battle-triggered financial decision detected. ${judge.financialTendencies.riskTolerance > 70 ? 'Emotional decisions can be enlightening' : 'Emotional decisions require caution'}. `;
  }
  
  if (!decision.coachAdvice && context.stressLevel > 60) {
    commentary += 'Coach consultation could provide valuable perspective. ';
  }
  
  if (context.spiralIntensity && context.spiralIntensity > 50) {
    commentary += 'Spiral pattern detected - intervention may be warranted. ';
  }
  
  return commentary.trim() || 'Monitoring financial decision progress.';
}

function applyJudgePersonalityToFinancial(
  baseRuling: string,
  judge: JudgePersonality,
  context: FinancialEventContext,
  outcome?: { success: boolean; actualImpact: number; stressChange: number }
): string {
  
  let personalityFlavor = '';
  
  const severity = outcome ? 
    (outcome.stressChange > 30 ? 'extreme' : outcome.stressChange > 15 ? 'major' : 'minor') :
    (context.stressLevel > 80 ? 'extreme' : context.stressLevel > 60 ? 'major' : 'minor');
  
  switch (judge.style) {
    case 'strict':
      personalityFlavor = severity === 'extreme' ? ' FINANCIAL DISCIPLINE MUST BE RESTORED!' : 
                         severity === 'major' ? ' Better money management is required!' :
                         ' Maintain financial responsibility.';
      break;
      
    case 'chaotic':
      personalityFlavor = severity === 'extreme' ? ' MAGNIFICENT FINANCIAL CHAOS!' :
                         severity === 'major' ? ' Love the bold money moves!' :
                         ' Spice up those investment choices!';
      break;
      
    case 'theatrical':
      personalityFlavor = severity === 'extreme' ? ' BEHOLD THE DRAMA OF FINANCIAL RUIN!' :
                         severity === 'major' ? ' What a spectacular monetary gamble!' :
                         ' The audience watches your financial choices with bated breath!';
      break;
      
    case 'logical':
      personalityFlavor = severity === 'extreme' ? ' Probability analysis indicates severe financial distress.' :
                         severity === 'major' ? ' Risk assessment suggests corrective measures.' :
                         ' Financial data processing complete.';
      break;
      
    case 'lenient':
      personalityFlavor = severity === 'extreme' ? ' Everyone faces financial challenges - support is available.' :
                         severity === 'major' ? ' Money troubles are temporary with proper guidance.' :
                         ' Financial learning is part of growth.';
      break;
  }
  
  return baseRuling + personalityFlavor;
}

function getDeviationExamples(type: DeviationType, archetype: TeamCharacter['archetype']): string {
  switch (type) {
    case 'berserker_rage':
      return archetype === 'beast' ? 
        '- "I roar and start clawing at everything - my opponent, my teammate, even the arena walls!"' :
        '- "I see red and swing my weapon wildly at anyone within reach!"';
        
    case 'identity_crisis':
      return archetype === 'mage' ?
        '- "I suddenly believe I am a peaceful butterfly and start trying to pollinate the arena flowers."' :
        '- "I become convinced I\'m actually the referee and start trying to call fouls on everyone."';
        
    case 'dimensional_escape':
      return '- "I attempt to open a portal to the snack dimension to escape this madness!"';
      
    case 'environmental_chaos':
      return '- "I start attacking the arena\'s support pillars because they\'re clearly the real enemy!"';
      
    default:
      return '- Be creative and unpredictable while staying true to your character!';
  }
}
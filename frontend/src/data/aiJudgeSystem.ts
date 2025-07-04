// AI Judge System - Judge Dread for Character Chaos
// Interprets AI-generated chaos and converts it into game mechanics

import { DeviationEvent, DeviationType } from './characterPsychology';
import { TeamCharacter } from './teamBattleSystem';

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
    }
  },
  {
    name: 'Judge Spectacle',
    style: 'theatrical',
    description: 'A showman who prioritizes entertainment value above all else',
    rulingTendencies: {
      favorsDamage: 80,
      favorsCreativity: 85,
      strictnessLevel: 30,
      narrativeFocus: 95
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
    }
  }
];

// Store previous rulings to maintain consistency
const rulingPrecedents: Map<string, JudgeDecision[]> = new Map();

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
function getRandomJudge(): JudgePersonality {
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
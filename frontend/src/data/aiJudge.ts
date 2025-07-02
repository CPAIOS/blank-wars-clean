// AI Judge System - Handles unpredictable character actions dynamically
// This system interprets when characters go "off-script" and determines outcomes

import { TeamCharacter, RoundResult, CharacterAbility } from './teamBattleSystem';

export interface RogueAction {
  type: 'reckless_attack' | 'refuse_fight' | 'attack_teammate' | 'creative_strategy' | 'panic_flee' | 'berserker_rage' | 'protective_sacrifice';
  description: string;
  reason: string;
  character: TeamCharacter;
}

export interface JudgeRuling {
  damage: number;
  targetDamage?: number; // If action affects multiple targets
  moraleChange: number;
  statusEffects: string[];
  narrativeDescription: string;
  teamChemistryChange?: number;
  characterMentalHealthChange?: number;
}

export class AIJudge {
  
  static generateRogueAction(
    character: TeamCharacter, 
    opponent: TeamCharacter,
    teamMorale: number,
    situation: 'winning' | 'losing' | 'even'
  ): RogueAction {
    
    const mentalHealthLevel = character.psychStats.mentalHealth;
    const ego = character.psychStats.ego;
    const teamPlayer = character.psychStats.teamPlayer;
    
    // Determine most likely rogue action based on character psychology
    if (mentalHealthLevel < 25) {
      // Crisis level - extreme actions
      if (ego > 80) {
        return {
          type: 'berserker_rage',
          description: `${character.name} loses all control and enters a berserker rage!`,
          reason: 'Mental breakdown combined with massive ego',
          character
        };
      } else {
        return {
          type: 'panic_flee',
          description: `${character.name} panics and tries to flee the battle!`,
          reason: 'Complete mental breakdown',
          character
        };
      }
    }
    
    if (situation === 'losing' && ego > 70) {
      return {
        type: 'reckless_attack',
        description: `${character.name} ignores defense and charges recklessly!`,
        reason: 'Pride refuses to accept defeat',
        character
      };
    }
    
    if (teamPlayer < 30 && teamMorale < 40) {
      return {
        type: 'refuse_fight',
        description: `${character.name} crosses their arms and refuses to fight!`,
        reason: 'Low team loyalty and poor morale',
        character
      };
    }
    
    if (character.psychStats.ego > 85 && situation === 'winning') {
      return {
        type: 'creative_strategy',
        description: `${character.name} improvises a flashy, unorthodox attack!`,
        reason: 'Ego drives showboating when ahead',
        character
      };
    }
    
    // Default fallback
    return {
      type: 'reckless_attack',
      description: `${character.name} acts unpredictably!`,
      reason: 'General deviation from gameplan',
      character
    };
  }
  
  static judgeRogueAction(
    action: RogueAction,
    opponent: TeamCharacter,
    teamMorale: number
  ): JudgeRuling {
    
    switch (action.type) {
      case 'reckless_attack':
        return this.judgeRecklessAttack(action, opponent, teamMorale);
      
      case 'refuse_fight':
        return this.judgeRefuseFight(action, opponent, teamMorale);
      
      case 'attack_teammate':
        return this.judgeTeammateAttack(action, teamMorale);
      
      case 'creative_strategy':
        return this.judgeCreativeStrategy(action, opponent, teamMorale);
      
      case 'panic_flee':
        return this.judgePanicFlee(action, opponent, teamMorale);
      
      case 'berserker_rage':
        return this.judgeBerserkerRage(action, opponent, teamMorale);
      
      case 'protective_sacrifice':
        return this.judgeProtectiveSacrifice(action, opponent, teamMorale);
      
      default:
        return this.judgeDefault(action, opponent, teamMorale);
    }
  }
  
  private static judgeRecklessAttack(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    const baseDamage = action.character.traditionalStats.strength * 1.5; // 50% more damage
    const damageTaken = opponent.traditionalStats.strength * 2; // But takes double damage
    
    return {
      damage: Math.floor(baseDamage),
      targetDamage: Math.floor(damageTaken), // Damage to self
      moraleChange: teamMorale > 60 ? -10 : -5, // Team worried about recklessness
      statusEffects: ['vulnerable'], // Easier to hit next round
      narrativeDescription: `${action.character.name} throws caution to the wind! Their reckless assault hits hard but leaves them exposed!`,
      characterMentalHealthChange: -5 // Acting against training is stressful
    };
  }
  
  private static judgeRefuseFight(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    return {
      damage: 0, // No damage dealt
      targetDamage: opponent.traditionalStats.strength, // Takes full hit
      moraleChange: -15, // Team demoralized by cowardice
      statusEffects: ['demoralized'],
      narrativeDescription: `${action.character.name} refuses to engage! The opponent gets a free hit while the team watches in dismay!`,
      teamChemistryChange: -10,
      characterMentalHealthChange: -10 // Guilt and shame
    };
  }
  
  private static judgeTeammateAttack(
    action: RogueAction, 
    teamMorale: number
  ): JudgeRuling {
    
    const friendlyDamage = action.character.traditionalStats.strength * 0.8;
    
    return {
      damage: 0, // No damage to opponent
      targetDamage: Math.floor(friendlyDamage), // Friendly fire
      moraleChange: -25, // Devastating to team morale
      statusEffects: ['betrayal_trauma'],
      narrativeDescription: `In a shocking turn, ${action.character.name} turns on their own teammate! The crowd gasps in horror!`,
      teamChemistryChange: -30, // Permanent chemistry damage
      characterMentalHealthChange: -15 // Acting against core values
    };
  }
  
  private static judgeCreativeStrategy(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    // Creative strategies can backfire or succeed spectacularly
    const success = Math.random() > 0.3; // 70% chance of success
    
    if (success) {
      const creativeDamage = action.character.traditionalStats.strength * 1.3;
      return {
        damage: Math.floor(creativeDamage),
        targetDamage: 0,
        moraleChange: 15, // Team inspired by creativity
        statusEffects: ['inspired'],
        narrativeDescription: `${action.character.name}'s improvised strategy catches everyone off guard! A brilliant display of tactical innovation!`,
        characterMentalHealthChange: 5 // Success feels good
      };
    } else {
      return {
        damage: Math.floor(action.character.traditionalStats.strength * 0.5),
        targetDamage: Math.floor(action.character.traditionalStats.strength * 0.3), // Backfire
        moraleChange: -8, // Team disappointed
        statusEffects: ['overconfident_backfire'],
        narrativeDescription: `${action.character.name}'s flashy move backfires! Sometimes simpler is better!`,
        characterMentalHealthChange: -8 // Embarrassment hurts
      };
    }
  }
  
  private static judgePanicFlee(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    return {
      damage: 0,
      targetDamage: 0, // No damage exchanged
      moraleChange: -20, // Team loses hope
      statusEffects: ['fled', 'cowardice'],
      narrativeDescription: `${action.character.name} breaks under pressure and flees the battle! Their teammates watch in disbelief!`,
      teamChemistryChange: -15,
      characterMentalHealthChange: -20 // Shame spiral
    };
  }
  
  private static judgeBerserkerRage(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    // Berserker rage: massive damage but completely unpredictable
    const rageDamage = action.character.traditionalStats.strength * 2;
    const selfDamage = action.character.maxHp * 0.15; // 15% self damage from exhaustion
    
    return {
      damage: Math.floor(rageDamage),
      targetDamage: Math.floor(selfDamage),
      moraleChange: 0, // Team doesn't know how to feel
      statusEffects: ['berserker_exhaustion'],
      narrativeDescription: `${action.character.name} enters a terrifying berserker rage! Devastating but uncontrollable fury!`,
      characterMentalHealthChange: -15 // Mental strain from losing control
    };
  }
  
  private static judgeProtectiveSacrifice(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    const sacrificeDamage = action.character.maxHp * 0.4; // Takes heavy damage
    
    return {
      damage: Math.floor(action.character.traditionalStats.strength * 0.8),
      targetDamage: Math.floor(sacrificeDamage),
      moraleChange: 20, // Team inspired by sacrifice
      statusEffects: ['heroic_inspiration'],
      narrativeDescription: `${action.character.name} throws themselves into harm's way to protect their team! A noble sacrifice!`,
      teamChemistryChange: 10,
      characterMentalHealthChange: 10 // Heroic acts boost confidence
    };
  }
  
  private static judgeDefault(
    action: RogueAction, 
    opponent: TeamCharacter, 
    teamMorale: number
  ): JudgeRuling {
    
    return {
      damage: Math.floor(action.character.traditionalStats.strength * 0.7),
      targetDamage: Math.floor(opponent.traditionalStats.strength * 0.8),
      moraleChange: -5,
      statusEffects: ['unpredictable'],
      narrativeDescription: `${action.character.name} acts erratically! The battle becomes chaotic!`,
      characterMentalHealthChange: -3
    };
  }
  
  // Generate coaching dialogue based on character actions
  static generateCoachingResponse(
    action: RogueAction,
    ruling: JudgeRuling,
    coachName: string
  ): string {
    
    const responses = {
      'reckless_attack': [
        `${coachName}: ${action.character.name}! What are you doing?! Stick to the plan!`,
        `${coachName}: That's not what we practiced! Control yourself!`,
        `${coachName}: Brilliant damage, but you're going to get yourself killed!`
      ],
      'refuse_fight': [
        `${coachName}: Get back in there! This is not the time for this!`,
        `${coachName}: ${action.character.name}, your team needs you! Fight!`,
        `${coachName}: What's gotten into you? We talked about this!`
      ],
      'creative_strategy': [
        `${coachName}: That wasn't the plan, but... not bad!`,
        `${coachName}: Improvisation! I like the creativity!`,
        `${coachName}: Next time warn me before you try something like that!`
      ],
      'panic_flee': [
        `${coachName}: Come back here! We can work through this!`,
        `${coachName}: ${action.character.name}! Remember your training!`,
        `${coachName}: It's okay to be scared, but don't abandon your team!`
      ]
    };
    
    const actionResponses = responses[action.type] || [
      `${coachName}: What are you thinking?! Get it together!`
    ];
    
    return actionResponses[Math.floor(Math.random() * actionResponses.length)];
  }
}

// Character response generator for rogue actions
export class CharacterResponseGenerator {
  
  static generateResponse(
    character: TeamCharacter,
    action: RogueAction,
    coachResponse: string
  ): string {
    
    const personality = character.personalityTraits;
    const ego = character.psychStats.ego;
    const mentalHealth = character.psychStats.mentalHealth;
    
    // High ego characters defend their actions
    if (ego > 80) {
      const defensiveResponses = [
        `I know what I'm doing!`,
        `Trust me, I've been doing this longer than you!`,
        `My way is better!`,
        `Don't question my methods!`
      ];
      return defensiveResponses[Math.floor(Math.random() * defensiveResponses.length)];
    }
    
    // Low mental health characters are erratic
    if (mentalHealth < 30) {
      const erraticResponses = [
        `I... I can't think straight!`,
        `Everything is falling apart!`,
        `I don't know what came over me!`,
        `The pressure... it's too much!`
      ];
      return erraticResponses[Math.floor(Math.random() * erraticResponses.length)];
    }
    
    // Default apologetic response
    const apologeticResponses = [
      `Sorry coach, I lost my focus for a moment.`,
      `You're right, I should stick to the gameplan.`,
      `I'll do better next time.`,
      `My emotions got the better of me.`
    ];
    
    return apologeticResponses[Math.floor(Math.random() * apologeticResponses.length)];
  }
}
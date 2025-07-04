// Coaching System - The heart of character psychology management
// This system handles all coach-character interactions and mental health management

import { TeamCharacter, Team, checkObedience } from './teamBattleSystem';

export interface CoachingSession {
  id: string;
  characterId: string;
  coachName: string;
  sessionType: 'individual' | 'team' | 'therapy' | 'strategy' | 'motivational';
  startTime: Date;
  duration: number; // minutes
  topics: string[];
  characterMood: 'receptive' | 'resistant' | 'neutral' | 'desperate';
  outcome: CoachingOutcome;
}

export interface CoachingOutcome {
  mentalHealthChange: number;
  trainingChange: number;
  teamPlayerChange: number;
  egoChange: number;
  communicationChange: number;
  characterResponse: string;
  coachNotes: string;
  relationshipChange: number; // How much the character trusts/likes the coach
}

export interface TherapySession {
  id: string;
  characterId: string;
  therapistName: string;
  sessionNumber: number;
  focusArea: 'trauma' | 'anger' | 'depression' | 'anxiety' | 'ego' | 'relationships';
  breakthrough: boolean;
  mentalHealthGain: number;
  characterInsights: string[];
  nextSessionRecommendation: string;
}

export interface TeamBuildingActivity {
  id: string;
  activityType: 'dinner' | 'retreat' | 'training' | 'game_night' | 'group_therapy';
  participants: string[]; // character IDs
  duration: number; // hours
  cost: number; // in-game currency
  teamChemistryGain: number;
  individualEffects: { characterId: string; effect: string; statChange: number }[];
  conflicts: { character1: string; character2: string; description: string }[];
  bonds: { character1: string; character2: string; description: string }[];
}

export class CoachingEngine {
  
  // One-on-one coaching session
  // COACHING POINTS SYSTEM:
  // - Each coaching session costs 1 point
  // - Teams start with 3 points (distribute among 3 characters)
  // - Win: Reset to 3 points | Loss progression: 3→2→1→0, reset to 3 on any win
  // - Strategic decisions: spread coaching or focus on key characters
  static conductIndividualCoaching(
    character: TeamCharacter,
    team: Team,
    focus: 'performance' | 'mental_health' | 'team_relations' | 'strategy',
    coachingSkill: number = 75 // Coach's skill level
  ): CoachingSession {
    const coachingCost = 1; // Each coaching session costs 1 point

    if (team.coachingPoints < coachingCost) {
      return {
        id: `coaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        characterId: character.id,
        coachName: team.coachName,
        sessionType: 'individual',
        startTime: new Date(),
        duration: 0,
        topics: [focus],
        characterMood: 'neutral',
        outcome: {
          mentalHealthChange: 0,
          trainingChange: 0,
          teamPlayerChange: 0,
          egoChange: 0,
          communicationChange: 0,
          characterResponse: "I'm ready for my coaching, coach.",
          coachNotes: "Not enough coaching points to conduct the session.",
          relationshipChange: 0,
        },
      };
    }

    // Deduct points
    team.coachingPoints -= coachingCost;
    
    const characterMood = this.determineCharacterMood(character);
    const sessionEffectiveness = this.calculateSessionEffectiveness(character, characterMood, coachingSkill);
    
    let outcome: CoachingOutcome;
    
    switch (focus) {
      case 'performance':
        outcome = this.handlePerformanceCoaching(character, sessionEffectiveness, characterMood);
        break;
      case 'mental_health':
        outcome = this.handleMentalHealthCoaching(character, sessionEffectiveness, characterMood);
        break;
      case 'team_relations':
        outcome = this.handleTeamRelationsCoaching(character, sessionEffectiveness, characterMood);
        break;
      case 'strategy':
        outcome = this.handleStrategyCoaching(character, sessionEffectiveness, characterMood);
        break;
      default:
        outcome = this.handleGeneralCoaching(character, sessionEffectiveness, characterMood);
    }
    
    return {
      id: `coaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characterId: character.id,
      coachName: team.coachName,
      sessionType: 'individual',
      startTime: new Date(),
      duration: 30,
      topics: [focus],
      characterMood,
      outcome
    };
  }
  
  // Group therapy session
  static conductGroupTherapy(
    characters: TeamCharacter[],
    therapistName: string = 'Dr. Mindwell'
  ): { sessions: TherapySession[]; teamChemistryChange: number } {
    
    const sessions: TherapySession[] = [];
    let teamChemistryChange = 0;
    
    for (const character of characters) {
      const session = this.conductTherapySession(character, therapistName);
      sessions.push(session);
      
      if (session.breakthrough) {
        teamChemistryChange += 5; // Breakthroughs help team chemistry
      }
    }
    
    // Group therapy bonus
    if (sessions.every(s => s.mentalHealthGain > 0)) {
      teamChemistryChange += 10; // Everyone improved
    }
    
    return { sessions, teamChemistryChange };
  }
  
  // Individual therapy session
  static conductTherapySession(
    character: TeamCharacter,
    therapistName: string = 'Dr. Mindwell'
  ): TherapySession {
    
    const sessionNumber = this.getSessionNumber(character.id);
    const focusArea = this.determineFocusArea(character);
    const breakthrough = this.calculateBreakthrough(character, sessionNumber);
    
    let mentalHealthGain = Math.floor(Math.random() * 15) + 5; // 5-20 base gain
    
    if (breakthrough) {
      mentalHealthGain += 15; // Breakthrough bonus
    }
    
    // Character-specific therapy responses
    const insights = this.generateTherapyInsights(character, focusArea, breakthrough);
    const nextRecommendation = this.generateNextSessionRecommendation(character, focusArea);
    
    return {
      id: `therapy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characterId: character.id,
      therapistName,
      sessionNumber,
      focusArea,
      breakthrough,
      mentalHealthGain,
      characterInsights: insights,
      nextSessionRecommendation: nextRecommendation
    };
  }
  
  // Team building activities
  static planTeamBuildingActivity(
    team: Team,
    activityType: TeamBuildingActivity['activityType'],
    budget: number
  ): TeamBuildingActivity {
    
    const activityCosts = {
      dinner: 100,
      retreat: 500,
      training: 200,
      game_night: 50,
      group_therapy: 300
    };
    
    const cost = activityCosts[activityType];
    
    if (budget < cost) {
      throw new Error(`Insufficient funds. Need ${cost}, have ${budget}`);
    }
    
    const baseChemistryGain = {
      dinner: 8,
      retreat: 20,
      training: 5,
      game_night: 12,
      group_therapy: 15
    }[activityType];
    
    // Calculate individual effects based on character personalities
    const individualEffects = team.characters.map(char => ({
      characterId: char.id,
      effect: this.getActivityEffect(char, activityType),
      statChange: this.getActivityStatChange(char, activityType)
    }));
    
    // Determine potential conflicts and bonds
    const { conflicts, bonds } = this.calculateActivityDynamics(team.characters, activityType);
    
    return {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activityType,
      participants: team.characters.map(c => c.id),
      duration: this.getActivityDuration(activityType),
      cost,
      teamChemistryGain: baseChemistryGain,
      individualEffects,
      conflicts,
      bonds
    };
  }
  
  // Helper methods
  private static determineCharacterMood(character: TeamCharacter): CoachingSession['characterMood'] {
    const mentalHealth = character.psychStats.mentalHealth;
    const ego = character.psychStats.ego;
    const training = character.psychStats.training;
    
    if (mentalHealth < 25) return 'desperate';
    if (ego > 80 && training < 50) return 'resistant';
    if (mentalHealth > 70 && training > 70) return 'receptive';
    return 'neutral';
  }
  
  private static calculateSessionEffectiveness(
    character: TeamCharacter,
    mood: CoachingSession['characterMood'],
    coachSkill: number
  ): number {
    let effectiveness = coachSkill;
    
    // Mood modifiers
    switch (mood) {
      case 'receptive': effectiveness += 20; break;
      case 'resistant': effectiveness -= 30; break;
      case 'desperate': effectiveness += 10; break;
      case 'neutral': break;
    }
    
    // Character trait modifiers
    if (character.psychStats.ego > 90) effectiveness -= 15;
    if (character.psychStats.communication < 40) effectiveness -= 10;
    
    return Math.max(0, Math.min(100, effectiveness));
  }
  
  private static handlePerformanceCoaching(
    character: TeamCharacter,
    effectiveness: number,
    mood: CoachingSession['characterMood']
  ): CoachingOutcome {
    
    // Apply temporary stat boosts directly to the character's temporaryStats
    const strengthGain = Math.floor((effectiveness / 100) * 5); // Example: up to 5 strength
    const dexterityGain = Math.floor((effectiveness / 100) * 5); // Example: up to 5 dexterity
    const speedGain = Math.floor((effectiveness / 100) * 3); // Example: up to 3 speed

    character.temporaryStats.strength += strengthGain;
    character.temporaryStats.dexterity += dexterityGain;
    character.temporaryStats.speed += speedGain;
    
    const mentalHealthChange = mood === 'desperate' ? 5 : 0;
    
    const responses = {
      'receptive': `I appreciate the feedback, coach. I'll work on those techniques.`,
      'resistant': `I've been doing this my way for years. But... I'll consider your suggestions.`,
      'neutral': `Understood. I see what you're getting at.`,
      'desperate': `Please, I need to get better. Tell me what to do!`
    };
    
    return {
      mentalHealthChange,
      trainingChange: 0, // No direct training change from this coaching type
      teamPlayerChange: 0,
      egoChange: character.psychStats.ego > 80 ? -2 : 0,
      communicationChange: 1,
      characterResponse: responses[mood],
      coachNotes: `Worked on combat techniques and strategy execution. ${character.name} showed ${mood} attitude. Applied temporary boosts: Str +${strengthGain}, Dex +${dexterityGain}, Spd +${speedGain}.`,
      relationshipChange: effectiveness > 70 ? 2 : -1
    };
  }
  
  private static handleMentalHealthCoaching(
    character: TeamCharacter,
    effectiveness: number,
    mood: CoachingSession['characterMood']
  ): CoachingOutcome {
    
    const mentalHealthGain = Math.floor((effectiveness / 100) * 15);
    const vitalityGain = Math.floor((effectiveness / 100) * 4); // Example: temporary HP boost
    const spiritGain = Math.floor((effectiveness / 100) * 3); // Example: temporary spirit boost

    character.temporaryStats.vitality += vitalityGain;
    character.temporaryStats.spirit += spiritGain;

    const responses = {
      'receptive': `Thank you for listening, coach. It helps to talk about these things.`,
      'resistant': `I don't need therapy! But... maybe it's good to vent sometimes.`,
      'neutral': `I suppose talking through problems can be useful.`,
      'desperate': `I really needed this. Thank you for being here for me.`
    };
    
    return {
      mentalHealthChange: mentalHealthGain,
      trainingChange: 0,
      teamPlayerChange: 2,
      egoChange: mood === 'resistant' ? -5 : 0,
      communicationChange: 3,
      characterResponse: responses[mood],
      coachNotes: `Focused on mental wellness and emotional support. Progress made on psychological barriers. Applied temporary boosts: Vit +${vitalityGain}, Spirit +${spiritGain}.`,
      relationshipChange: effectiveness > 60 ? 5 : 1
    };
  }
  
  private static handleTeamRelationsCoaching(
    character: TeamCharacter,
    effectiveness: number,
    mood: CoachingSession['characterMood']
  ): CoachingOutcome {
    
    const teamPlayerGain = Math.floor((effectiveness / 100) * 8);
    const communicationGain = Math.floor((effectiveness / 100) * 6);
    const charismaGain = Math.floor((effectiveness / 100) * 5); // Example: temporary charisma boost

    character.temporaryStats.charisma += charismaGain;

    const responses = {
      'receptive': `You're right, working together makes us all stronger.`,
      'resistant': `Fine, I'll try to be more... collaborative. But I work best alone.`,
      'neutral': `I can see the value in better teamwork.`,
      'desperate': `I don't want to be the reason we lose. Help me be a better teammate.`
    };
    
    return {
      mentalHealthChange: 2,
      trainingChange: 1,
      teamPlayerChange: teamPlayerGain,
      egoChange: -3,
      communicationChange: communicationGain,
      characterResponse: responses[mood],
      coachNotes: `Discussed team dynamics and cooperation strategies. Emphasized shared goals. Applied temporary boosts: Charisma +${charismaGain}.`,
      relationshipChange: 3
    };
  }
  
  private static handleStrategyCoaching(
    character: TeamCharacter,
    effectiveness: number,
    mood: CoachingSession['characterMood']
  ): CoachingOutcome {
    
    const intelligenceGain = Math.floor((effectiveness / 100) * 6); // Example: temporary intelligence boost
    const staminaGain = Math.floor((effectiveness / 100) * 4); // Example: temporary stamina boost

    character.temporaryStats.intelligence += intelligenceGain;
    character.temporaryStats.stamina += staminaGain;

    return {
      mentalHealthChange: 1,
      trainingChange: 0,
      teamPlayerChange: 1,
      egoChange: 0,
      communicationChange: 2,
      characterResponse: `I understand the tactical considerations better now.`,
      coachNotes: `Reviewed battle strategies and decision-making frameworks. Applied temporary boosts: Int +${intelligenceGain}, Stamina +${staminaGain}.`,
      relationshipChange: 2
    };
  }
  
  private static handleGeneralCoaching(
    character: TeamCharacter,
    effectiveness: number,
    mood: CoachingSession['characterMood']
  ): CoachingOutcome {
    
    const allStatGain = Math.floor((effectiveness / 100) * 2); // Small boost to all stats

    character.temporaryStats.strength += allStatGain;
    character.temporaryStats.vitality += allStatGain;
    character.temporaryStats.speed += allStatGain;
    character.temporaryStats.dexterity += allStatGain;
    character.temporaryStats.stamina += allStatGain;
    character.temporaryStats.intelligence += allStatGain;
    character.temporaryStats.charisma += allStatGain;
    character.temporaryStats.spirit += allStatGain;

    return {
      mentalHealthChange: 3,
      trainingChange: 2,
      teamPlayerChange: 1,
      egoChange: -1,
      communicationChange: 2,
      characterResponse: `Thanks for the chat, coach. It's good to have someone in your corner.`,
      coachNotes: `General check-in and motivation session. Applied small temporary boosts to all stats.`,
      relationshipChange: 1
    };
  }
  
  private static getSessionNumber(characterId: string): number {
    // In a real implementation, this would query the database
    return Math.floor(Math.random() * 10) + 1;
  }
  
  private static determineFocusArea(character: TeamCharacter): TherapySession['focusArea'] {
    const mentalHealth = character.psychStats.mentalHealth;
    const ego = character.psychStats.ego;
    const teamPlayer = character.psychStats.teamPlayer;
    
    if (mentalHealth < 30) return 'depression';
    if (ego > 90) return 'ego';
    if (teamPlayer < 30) return 'relationships';
    if (character.personalityTraits.includes('Angry')) return 'anger';
    
    return 'anxiety'; // Default
  }
  
  private static calculateBreakthrough(character: TeamCharacter, sessionNumber: number): boolean {
    // Higher chance of breakthrough with more sessions and lower mental health
    const baseChance = 0.15;
    const sessionBonus = sessionNumber * 0.02;
    const desperation = character.psychStats.mentalHealth < 40 ? 0.1 : 0;
    
    return Math.random() < (baseChance + sessionBonus + desperation);
  }
  
  private static generateTherapyInsights(
    character: TeamCharacter,
    focusArea: TherapySession['focusArea'],
    breakthrough: boolean
  ): string[] {
    
    const insights = [];
    
    if (breakthrough) {
      insights.push(`Major breakthrough: ${character.name} finally opened up about their core fears.`);
    }
    
    const focusInsights = {
      trauma: [`Identified source of combat anxiety`, `Worked through past battlefield experiences`],
      anger: [`Explored anger triggers`, `Developed coping mechanisms for frustration`],
      depression: [`Addressed feelings of hopelessness`, `Built positive self-talk strategies`],
      anxiety: [`Identified anxiety patterns`, `Practiced relaxation techniques`],
      ego: [`Challenged superiority complex`, `Explored need for validation`],
      relationships: [`Discussed trust issues`, `Worked on empathy development`]
    };
    
    insights.push(...focusInsights[focusArea]);
    
    return insights;
  }
  
  private static generateNextSessionRecommendation(
    character: TeamCharacter,
    focusArea: TherapySession['focusArea']
  ): string {
    
    const recommendations = {
      trauma: `Continue EMDR therapy for combat trauma processing`,
      anger: `Practice anger management techniques before next battle`,
      depression: `Work on building positive daily routines`,
      anxiety: `Implement mindfulness meditation practice`,
      ego: `Focus on team contribution over individual glory`,
      relationships: `Practice active listening with teammates`
    };
    
    return recommendations[focusArea];
  }
  
  private static getActivityEffect(character: TeamCharacter, activityType: TeamBuildingActivity['activityType']): string {
    // Different characters respond differently to activities
    const effects = {
      dinner: `Enjoyed good food and conversation`,
      retreat: `Found peace in nature`,
      training: `Appreciated skill development`,
      game_night: `Had fun with competitive games`,
      group_therapy: `Opened up about personal struggles`
    };
    
    return effects[activityType];
  }
  
  private static getActivityStatChange(character: TeamCharacter, activityType: TeamBuildingActivity['activityType']): number {
    // Mental health gains vary by character and activity
    const baseGains = {
      dinner: 5,
      retreat: 12,
      training: 3,
      game_night: 8,
      group_therapy: 10
    };
    
    let gain = baseGains[activityType];
    
    // Character-specific modifiers
    if (activityType === 'training' && character.archetype === 'warrior') gain += 3;
    if (activityType === 'group_therapy' && character.psychStats.mentalHealth < 40) gain += 5;
    
    return gain;
  }
  
  private static calculateActivityDynamics(
    characters: TeamCharacter[],
    activityType: TeamBuildingActivity['activityType']
  ): { conflicts: TeamBuildingActivity['conflicts']; bonds: TeamBuildingActivity['bonds'] } {
    
    const conflicts: TeamBuildingActivity['conflicts'] = [];
    const bonds: TeamBuildingActivity['bonds'] = [];
    
    // Check for personality clashes
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];
        
        // High ego characters clash
        if (char1.psychStats.ego > 80 && char2.psychStats.ego > 80) {
          conflicts.push({
            character1: char1.id,
            character2: char2.id,
            description: `${char1.name} and ${char2.name} compete for attention during the activity`
          });
        }
        
        // High team players bond
        if (char1.psychStats.teamPlayer > 80 && char2.psychStats.teamPlayer > 80) {
          bonds.push({
            character1: char1.id,
            character2: char2.id,
            description: `${char1.name} and ${char2.name} work together naturally`
          });
        }
      }
    }
    
    return { conflicts, bonds };
  }
  
  private static getActivityDuration(activityType: TeamBuildingActivity['activityType']): number {
    const durations = {
      dinner: 2,
      retreat: 24,
      training: 4,
      game_night: 3,
      group_therapy: 2
    };
    
    return durations[activityType];
  }
}
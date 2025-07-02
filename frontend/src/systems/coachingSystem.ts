// Coaching System - Mid-Battle Psychology Management
// This is where players actually manage their team's mental state during combat

import { 
  BattleState, 
  CoachingTimeout, 
  TimeoutAction, 
  BattleCharacter,
  TimeoutCharacterState,
  UrgentIssue,
  CoachingData
} from '../data/battleFlow';

export interface CoachingInteraction {
  characterId: string;
  approach: 'supportive' | 'firm' | 'tactical' | 'empathetic';
  message: string;
  effects: CoachingResult;
}

export interface CoachingResult {
  mentalHealthChange: number;
  gameplanAdherenceChange: number;
  stressChange: number;
  confidenceChange: number;
  teamTrustChange: number;
  relationshipEffects: Record<string, number>;
  success: boolean;
  characterReaction: string;
  teamReaction: string;
}

export class CoachingSystem {
  
  // ============= COACHING TIMEOUT MECHANICS =============
  
  static processCoachingTimeout(
    battleState: BattleState, 
    selectedActions: TimeoutAction[]
  ): CoachingTimeout {
    const timeout = this.initializeTimeout(battleState);
    let timeRemaining = timeout.timeLimit;
    
    // Process each selected action
    for (const action of selectedActions) {
      if (timeRemaining <= 0) break;
      
      const result = this.executeTimeoutAction(action, battleState);
      this.applyTimeoutResults(result, battleState);
      
      timeRemaining -= action.timeConsumed;
      
      // Update coaching effectiveness based on results
      this.updateCoachingReputation(result, battleState.coachingData);
    }
    
    // Final assessment after timeout
    timeout.characterStates = this.reassessCharacterStates(battleState);
    timeout.urgentIssues = this.identifyRemainingIssues(battleState);
    
    return timeout;
  }

  static executeTimeoutAction(action: TimeoutAction, battleState: BattleState): CoachingResult[] {
    const results: CoachingResult[] = [];
    
    switch (action.type) {
      case 'individual_coaching':
        results.push(...this.conductIndividualCoaching(action, battleState));
        break;
        
      case 'team_rallying':
        results.push(...this.conductTeamRallying(action, battleState));
        break;
        
      case 'conflict_mediation':
        results.push(...this.conductConflictMediation(action, battleState));
        break;
        
      case 'strategic_pivot':
        results.push(...this.conductStrategicPivot(action, battleState));
        break;
    }
    
    return results;
  }

  // ============= INDIVIDUAL COACHING =============
  
  static conductIndividualCoaching(
    action: TimeoutAction, 
    battleState: BattleState
  ): CoachingResult[] {
    const results: CoachingResult[] = [];
    
    for (const characterId of action.targetCharacters) {
      const character = this.findCharacter(battleState, characterId);
      if (!character) continue;
      
      const coachingApproach = this.determineOptimalApproach(character);
      const interaction = this.createCoachingInteraction(character, coachingApproach, action);
      
      const result = this.processIndividualInteraction(interaction, character, battleState);
      results.push(result);
      
      // Apply character-specific coaching
      this.applyPersonalizedCoaching(character, result);
    }
    
    return results;
  }

  static determineOptimalApproach(character: BattleCharacter): 'supportive' | 'firm' | 'tactical' | 'empathetic' {
    const personality = character.character.personality;
    const mentalState = character.mentalState;
    
    // Analyze character traits to determine best approach
    if (personality.traits.includes('Prideful') || personality.traits.includes('Defiant')) {
      return mentalState.stress > 70 ? 'empathetic' : 'tactical';
    }
    
    if (personality.traits.includes('Loyal') || personality.traits.includes('Honorable')) {
      return mentalState.confidence < 40 ? 'supportive' : 'firm';
    }
    
    if (personality.traits.includes('Emotional') || personality.traits.includes('Sensitive')) {
      return 'empathetic';
    }
    
    if (personality.traits.includes('Logical') || personality.traits.includes('Strategic')) {
      return 'tactical';
    }
    
    // Default based on mental state
    if (mentalState.stress > 60) return 'empathetic';
    if (mentalState.confidence < 50) return 'supportive';
    if (character.gameplanAdherence < 60) return 'firm';
    
    return 'tactical';
  }

  static createCoachingInteraction(
    character: BattleCharacter, 
    approach: string, 
    action: TimeoutAction
  ): CoachingInteraction {
    const messages = this.generateCoachingMessages(character, approach);
    const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      characterId: character.character.id,
      approach: approach as 'emotional' | 'analytical' | 'authoritative' | 'collaborative',
      message: selectedMessage,
      effects: {
        mentalHealthChange: 0,
        gameplanAdherenceChange: 0,
        stressChange: 0,
        confidenceChange: 0,
        teamTrustChange: 0,
        relationshipEffects: {},
        success: false,
        characterReaction: '',
        teamReaction: ''
      }
    };
  }

  static generateCoachingMessages(character: BattleCharacter, approach: string): string[] {
    const name = character.character.name;
    
    switch (approach) {
      case 'supportive':
        return [
          `${name}, I believe in you. You've got this.`,
          `${name}, remember why you're fighting. Your team needs you.`,
          `${name}, you're stronger than you think. Trust yourself.`,
          `${name}, we're all here for you. You're not alone in this.`
        ];
        
      case 'firm':
        return [
          `${name}, I need you to focus. The team is counting on you.`,
          `${name}, this is what we trained for. Execute the plan.`,
          `${name}, put aside your doubts and do your job.`,
          `${name}, the mission comes first. Stay disciplined.`
        ];
        
      case 'tactical':
        return [
          `${name}, here's the situation and what we need from you...`,
          `${name}, analyze their weaknesses and exploit them.`,
          `${name}, adapt your strategy to their movements.`,
          `${name}, think three moves ahead. What's your counter?`
        ];
        
      case 'empathetic':
        return [
          `${name}, I can see you're struggling. Let's work through this.`,
          `${name}, it's okay to feel overwhelmed. What do you need?`,
          `${name}, your feelings are valid. How can I help?`,
          `${name}, take a breath. We'll figure this out together.`
        ];
        
      default:
        return [`${name}, stay focused and do your best.`];
    }
  }

  static processIndividualInteraction(
    interaction: CoachingInteraction,
    character: BattleCharacter,
    battleState: BattleState
  ): CoachingResult {
    const coachingEffectiveness = battleState.coachingData.coachingEffectiveness;
    const teamRespect = battleState.coachingData.teamRespect;
    const characterTrust = character.mentalState.teamTrust;
    
    // Calculate base effectiveness
    let effectiveness = (coachingEffectiveness + teamRespect + characterTrust) / 3;
    
    // Modify based on approach and character personality
    effectiveness *= this.getApproachEffectiveness(interaction.approach, character);
    
    // Modify based on character's current state
    effectiveness *= this.getStateEffectiveness(character);
    
    // Generate results based on effectiveness
    const result: CoachingResult = {
      mentalHealthChange: 0,
      gameplanAdherenceChange: 0,
      stressChange: 0,
      confidenceChange: 0,
      teamTrustChange: 0,
      relationshipEffects: {},
      success: effectiveness > 60,
      characterReaction: '',
      teamReaction: ''
    };
    
    if (result.success) {
      // Positive coaching outcome
      result.mentalHealthChange = Math.floor(effectiveness * 0.3);
      result.stressChange = -Math.floor(effectiveness * 0.4);
      result.confidenceChange = Math.floor(effectiveness * 0.25);
      result.gameplanAdherenceChange = Math.floor(effectiveness * 0.2);
      result.teamTrustChange = Math.floor(effectiveness * 0.15);
      
      result.characterReaction = this.generatePositiveReaction(character, interaction.approach);
    } else {
      // Coaching backfired
      result.mentalHealthChange = -Math.floor((100 - effectiveness) * 0.1);
      result.stressChange = Math.floor((100 - effectiveness) * 0.2);
      result.teamTrustChange = -Math.floor((100 - effectiveness) * 0.1);
      
      result.characterReaction = this.generateNegativeReaction(character, interaction.approach);
    }
    
    result.teamReaction = this.generateTeamReaction(result.success, character, battleState);
    
    return result;
  }

  // ============= TEAM RALLYING =============
  
  static conductTeamRallying(action: TimeoutAction, battleState: BattleState): CoachingResult[] {
    const teamMorale = battleState.teams.player.currentMorale;
    const teamChemistry = battleState.teams.player.teamChemistry;
    
    // Assess team receptiveness to rallying
    const receptiveness = (teamMorale + teamChemistry + battleState.coachingData.teamRespect) / 3;
    
    const results: CoachingResult[] = [];
    
    // Apply team-wide effects
    for (const character of battleState.teams.player.characters) {
      if (character.currentHealth <= 0) continue; // Skip defeated characters
      
      const individualResult = this.applyTeamRallying(character, receptiveness, action);
      results.push(individualResult);
    }
    
    // Update team-level stats
    this.updateTeamMorale(battleState, receptiveness > 60 ? 15 : -10);
    
    return results;
  }

  static applyTeamRallying(
    character: BattleCharacter, 
    receptiveness: number, 
    action: TimeoutAction
  ): CoachingResult {
    const personalityModifier = this.getRallyingPersonalityModifier(character);
    const finalEffectiveness = receptiveness * personalityModifier;
    
    const result: CoachingResult = {
      mentalHealthChange: 0,
      gameplanAdherenceChange: 0,
      stressChange: 0,
      confidenceChange: 0,
      teamTrustChange: 0,
      relationshipEffects: {},
      success: finalEffectiveness > 50,
      characterReaction: '',
      teamReaction: ''
    };
    
    if (result.success) {
      result.confidenceChange = Math.floor(finalEffectiveness * 0.2);
      result.teamTrustChange = Math.floor(finalEffectiveness * 0.15);
      result.stressChange = -Math.floor(finalEffectiveness * 0.1);
      
      result.characterReaction = this.generateRallyingReaction(character, true);
    } else {
      result.confidenceChange = -5;
      result.teamTrustChange = -5;
      
      result.characterReaction = this.generateRallyingReaction(character, false);
    }
    
    return result;
  }

  // ============= CONFLICT MEDIATION =============
  
  static conductConflictMediation(action: TimeoutAction, battleState: BattleState): CoachingResult[] {
    // Identify conflicting characters
    const conflicts = this.identifyActiveConflicts(battleState);
    const results: CoachingResult[] = [];
    
    for (const conflict of conflicts) {
      const char1 = this.findCharacter(battleState, conflict.character1);
      const char2 = this.findCharacter(battleState, conflict.character2);
      
      if (!char1 || !char2) continue;
      
      const mediationResult = this.mediateConflict(char1, char2, conflict, battleState);
      results.push(...mediationResult);
      
      // Update relationship between characters
      this.updateRelationship(char1, char2, mediationResult[0].success ? 10 : -5);
    }
    
    return results;
  }

  static identifyActiveConflicts(battleState: BattleState): Array<{character1: string, character2: string, severity: number}> {
    const conflicts = [];
    const characters = battleState.teams.player.characters;
    
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];
        
        const relationship = char1.relationshipModifiers.find(
          rel => rel.withCharacter === char2.character.name.toLowerCase().replace(/\s+/g, '_')
        );
        
        if (relationship && relationship.strength < -30) {
          conflicts.push({
            character1: char1.character.id,
            character2: char2.character.id,
            severity: Math.abs(relationship.strength)
          });
        }
      }
    }
    
    return conflicts.sort((a, b) => b.severity - a.severity);
  }

  // ============= STRATEGIC PIVOT =============
  
  static conductStrategicPivot(action: TimeoutAction, battleState: BattleState): CoachingResult[] {
    // Analyze current battle situation
    const battleAnalysis = this.analyzeBattleSituation(battleState);
    
    // Generate new strategy
    const newStrategy = this.generateAdaptiveStrategy(battleAnalysis, battleState);
    
    // Communicate strategy to team
    const results = this.communicateStrategy(newStrategy, battleState);
    
    // Update team tactical understanding
    this.updateTacticalKnowledge(battleState, newStrategy);
    
    return results;
  }

  // ============= UTILITY METHODS =============
  
  static findCharacter(battleState: BattleState, characterId: string): BattleCharacter | null {
    return battleState.teams.player.characters.find(char => char.character.id === characterId) || null;
  }

  static getApproachEffectiveness(approach: string, character: BattleCharacter): number {
    const traits = character.character.personality.traits;
    
    switch (approach) {
      case 'supportive':
        if (traits.includes('Insecure') || traits.includes('Emotional')) return 1.3;
        if (traits.includes('Proud') || traits.includes('Independent')) return 0.7;
        return 1.0;
        
      case 'firm':
        if (traits.includes('Disciplined') || traits.includes('Military')) return 1.3;
        if (traits.includes('Rebellious') || traits.includes('Free-spirited')) return 0.6;
        return 1.0;
        
      case 'tactical':
        if (traits.includes('Strategic') || traits.includes('Intelligent')) return 1.4;
        if (traits.includes('Emotional') || traits.includes('Impulsive')) return 0.8;
        return 1.0;
        
      case 'empathetic':
        if (traits.includes('Traumatized') || traits.includes('Sensitive')) return 1.5;
        if (traits.includes('Stoic') || traits.includes('Unemotional')) return 0.7;
        return 1.0;
        
      default:
        return 1.0;
    }
  }

  static getStateEffectiveness(character: BattleCharacter): number {
    let multiplier = 1.0;
    
    // High stress makes coaching harder
    if (character.mentalState.stress > 70) multiplier *= 0.7;
    else if (character.mentalState.stress > 50) multiplier *= 0.85;
    
    // Low trust makes coaching less effective
    if (character.mentalState.teamTrust < 30) multiplier *= 0.6;
    else if (character.mentalState.teamTrust < 50) multiplier *= 0.8;
    
    // Low mental health reduces receptiveness
    if (character.mentalState.currentMentalHealth < 30) multiplier *= 0.5;
    else if (character.mentalState.currentMentalHealth < 50) multiplier *= 0.75;
    
    return multiplier;
  }

  static generatePositiveReaction(character: BattleCharacter, approach: string): string {
    const name = character.character.name;
    const reactions = {
      supportive: [
        `${name} nods with renewed determination.`,
        `${name} takes a deep breath and seems more focused.`,
        `${name} smiles slightly, confidence returning.`
      ],
      firm: [
        `${name} straightens up and acknowledges the command.`,
        `${name} nods curtly, discipline restored.`,
        `${name} refocuses with military precision.`
      ],
      tactical: [
        `${name} analyzes the information and nods in understanding.`,
        `${name} adjusts their stance, strategy clear.`,
        `${name} calculates possibilities, mind sharpened.`
      ],
      empathetic: [
        `${name} visibly relaxes, stress melting away.`,
        `${name} seems grateful for the understanding.`,
        `${name} takes comfort in the compassionate words.`
      ]
    };
    
    const reactionList = reactions[approach as keyof typeof reactions] || [`${name} responds positively.`];
    return reactionList[Math.floor(Math.random() * reactionList.length)];
  }

  static generateNegativeReaction(character: BattleCharacter, approach: string): string {
    const name = character.character.name;
    return `${name} seems resistant to the coaching approach and becomes more withdrawn.`;
  }

  static generateTeamReaction(success: boolean, character: BattleCharacter, battleState: BattleState): string {
    if (success) {
      return `The team watches as ${character.character.name} responds well to coaching, boosting overall morale.`;
    } else {
      return `The team notices the failed coaching attempt, creating some tension.`;
    }
  }

  static applyTimeoutResults(results: CoachingResult[], battleState: BattleState): void {
    for (const result of results) {
      const character = this.findCharacter(battleState, result.characterReaction.split(' ')[0]);
      if (!character) continue;
      
      // Apply mental state changes
      character.mentalState.currentMentalHealth = Math.max(0, Math.min(100, 
        character.mentalState.currentMentalHealth + result.mentalHealthChange
      ));
      
      character.mentalState.stress = Math.max(0, Math.min(100, 
        character.mentalState.stress + result.stressChange
      ));
      
      character.mentalState.confidence = Math.max(0, Math.min(100, 
        character.mentalState.confidence + result.confidenceChange
      ));
      
      character.mentalState.teamTrust = Math.max(0, Math.min(100, 
        character.mentalState.teamTrust + result.teamTrustChange
      ));
      
      character.gameplanAdherence = Math.max(0, Math.min(100, 
        character.gameplanAdherence + result.gameplanAdherenceChange
      ));
    }
  }

  static updateCoachingReputation(results: CoachingResult[], coachingData: CoachingData): void {
    const successRate = results.filter(r => r.success).length / results.length;
    
    if (successRate > 0.7) {
      coachingData.coachingEffectiveness = Math.min(100, coachingData.coachingEffectiveness + 2);
      coachingData.teamRespect = Math.min(100, coachingData.teamRespect + 3);
    } else if (successRate < 0.3) {
      coachingData.coachingEffectiveness = Math.max(0, coachingData.coachingEffectiveness - 3);
      coachingData.teamRespect = Math.max(0, coachingData.teamRespect - 5);
    }
  }

  // Additional methods would be implemented for full functionality...
  private static initializeTimeout(battleState: BattleState): CoachingTimeout {
    return {
      triggerCondition: {
        type: 'player_requested',
        severity: 'warning',
        description: 'Coach called timeout',
        timeRemaining: 90
      },
      availableActions: [],
      timeLimit: 90,
      characterStates: [],
      urgentIssues: [],
      strategicOptions: []
    };
  }

  private static reassessCharacterStates(battleState: BattleState): TimeoutCharacterState[] {
    return [];
  }

  private static identifyRemainingIssues(battleState: BattleState): UrgentIssue[] {
    return [];
  }

  private static applyPersonalizedCoaching(character: BattleCharacter, result: CoachingResult): void {
    // Apply coaching results to character
  }

  private static getRallyingPersonalityModifier(character: BattleCharacter): number {
    return 1.0;
  }

  private static generateRallyingReaction(character: BattleCharacter, success: boolean): string {
    return success ? `${character.character.name} is inspired!` : `${character.character.name} seems unmoved.`;
  }

  private static updateTeamMorale(battleState: BattleState, change: number): void {
    battleState.teams.player.currentMorale = Math.max(0, Math.min(100, 
      battleState.teams.player.currentMorale + change
    ));
  }

  private static mediateConflict(char1: BattleCharacter, char2: BattleCharacter, conflict: { type: string; severity: string; description: string }, battleState: BattleState): CoachingResult[] {
    return [];
  }

  private static updateRelationship(char1: BattleCharacter, char2: BattleCharacter, change: number): void {
    // Update relationship strength
  }

  private static analyzeBattleSituation(battleState: BattleState): {
    teamMorale: number;
    averageHealth: number;
    strategicPosition: string;
    emergingPatterns: string[];
    keyThreats: string[];
    opportunities: string[];
  } {
    return {};
  }

  private static generateAdaptiveStrategy(analysis: { teamMorale: number; averageHealth: number; strategicPosition: string; emergingPatterns: string[]; keyThreats: string[]; opportunities: string[] }, battleState: BattleState): {
    type: string;
    description: string;
    characterAssignments: Record<string, string>;
    expectedOutcome: string;
    riskLevel: string;
  } {
    return {};
  }

  private static communicateStrategy(strategy: { type: string; description: string; characterAssignments: Record<string, string>; expectedOutcome: string; riskLevel: string }, battleState: BattleState): CoachingResult[] {
    return [];
  }

  private static updateTacticalKnowledge(battleState: BattleState, strategy: { type: string; description: string; characterAssignments: Record<string, string> }): void {
    // Update team's tactical understanding
  }
}

export default CoachingSystem;
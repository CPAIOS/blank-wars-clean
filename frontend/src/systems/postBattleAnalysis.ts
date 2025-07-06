// Post-Battle Analysis System - Relationship Evolution & Psychology Management
// Where the long-term consequences of battle decisions play out

import { 
  BattleState, 
  PostBattleAnalysis, 
  CharacterEvaluation, 
  RelationshipChange, 
  PsychologicalConsequence,
  TrainingRecommendation,
  ChemistryEvolution,
  TeamMetrics,
  BattleCharacter
} from '../data/battleFlow';

export interface BattleMemory {
  characterId: string;
  notableEvents: BattleEvent[];
  emotionalImpact: number; // -100 to 100
  relationshipMoments: RelationshipMoment[];
  personalGrowth: GrowthMoment[];
  trauma: TraumaEvent[];
}

export interface BattleEvent {
  type: 'heroic_action' | 'betrayal' | 'saved_by_ally' | 'witnessed_death' | 'successful_teamwork' | 'conflict';
  description: string;
  witnessedBy: string[];
  emotionalWeight: number;
  longTermImpact: 'positive' | 'negative' | 'complex';
}

export interface RelationshipMoment {
  withCharacter: string;
  eventType: 'saved_life' | 'abandoned' | 'supported' | 'conflicted' | 'bonded';
  strengthChange: number;
  emotionalContext: string;
  witnessedByTeam: boolean;
}

export interface GrowthMoment {
  type: 'overcame_fear' | 'showed_leadership' | 'learned_teamwork' | 'developed_skill';
  description: string;
  statImprovement: Record<string, number>;
  permanentTrait?: string;
}

export interface TraumaEvent {
  type: 'witnessed_violence' | 'betrayed_by_ally' | 'failed_team' | 'overwhelming_fear';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  triggerConditions: string[];
  recoveryTime: number;
}

export class PostBattleAnalysisSystem {
  
  // ============= MAIN ANALYSIS PIPELINE =============
  
  static conductCompleteAnalysis(battleState: BattleState): PostBattleAnalysis {
    // Step 1: Collect battle memories for each character
    const battleMemories = this.collectBattleMemories(battleState);
    
    // Step 2: Evaluate individual character performance and growth
    const characterEvaluations = this.evaluateCharacterPerformances(battleState, battleMemories);
    
    // Step 3: Calculate relationship changes based on battle events
    const relationshipChanges = this.calculateRelationshipEvolution(battleState, battleMemories);
    
    // Step 4: Assess psychological consequences and trauma
    const psychologicalConsequences = this.assessPsychologicalImpact(battleState, battleMemories);
    
    // Step 5: Apply combat experience psychStats improvements - NEW!
    this.applyCombatExperienceGains(battleState, characterEvaluations, psychologicalConsequences);
    
    // Step 6: Generate training recommendations
    const trainingRecommendations = this.generateTrainingPlan(characterEvaluations, psychologicalConsequences);
    
    // Step 7: Analyze team chemistry evolution
    const teamChemistryEvolution = this.analyzeTeamEvolution(battleState, relationshipChanges);
    
    // Step 8: Calculate overall team metrics
    const teamMetrics = this.calculateTeamPerformanceMetrics(battleState, characterEvaluations);
    
    return {
      battleResult: this.determineBattleResult(battleState),
      teamPerformanceMetrics: teamMetrics,
      characterEvaluations,
      relationshipChanges,
      psychologicalConsequences,
      trainingRecommendations,
      teamChemistryEvolution
    };
  }

  // ============= BATTLE MEMORY COLLECTION =============
  
  static collectBattleMemories(battleState: BattleState): Record<string, BattleMemory> {
    const memories: Record<string, BattleMemory> = {};
    
    // Initialize memories for each character
    battleState.teams.player.characters.forEach(char => {
      memories[char.character.id] = {
        characterId: char.character.id,
        notableEvents: [],
        emotionalImpact: 0,
        relationshipMoments: [],
        personalGrowth: [],
        trauma: []
      };
    });
    
    // Analyze battle log for significant events
    battleState.battleLog.forEach(logEntry => {
      this.processLogEntryForMemories(logEntry, memories, battleState);
    });
    
    // Analyze character interactions and relationships
    this.analyzeCharacterInteractions(battleState, memories);
    
    // Identify personal growth moments
    this.identifyPersonalGrowth(battleState, memories);
    
    // Assess trauma and negative experiences
    this.assessTraumaEvents(battleState, memories);
    
    return memories;
  }

  static processLogEntryForMemories(
    logEntry: { characterInvolved?: string; description?: string }, 
    memories: Record<string, BattleMemory>, 
    battleState: BattleState
  ): void {
    if (logEntry.characterInvolved) {
      const memory = memories[logEntry.characterInvolved];
      if (!memory) return;
      
      // Create battle event based on log entry
      const event: BattleEvent = {
        type: this.categorizeLogEvent(logEntry),
        description: logEntry.description,
        witnessedBy: this.determineWitnesses(logEntry, battleState),
        emotionalWeight: this.calculateEmotionalWeight(logEntry),
        longTermImpact: this.determineLongTermImpact(logEntry)
      };
      
      memory.notableEvents.push(event);
      memory.emotionalImpact += event.emotionalWeight;
    }
  }

  static analyzeCharacterInteractions(
    battleState: BattleState, 
    memories: Record<string, BattleMemory>
  ): void {
    // Look for specific interaction patterns during battle
    battleState.teams.player.characters.forEach(char1 => {
      battleState.teams.player.characters.forEach(char2 => {
        if (char1.character.id === char2.character.id) return;
        
        const interactions = this.findCharacterInteractions(char1, char2, battleState);
        interactions.forEach(interaction => {
          const moment: RelationshipMoment = {
            withCharacter: char2.character.id,
            eventType: interaction.type,
            strengthChange: interaction.relationshipImpact,
            emotionalContext: interaction.context,
            witnessedByTeam: interaction.publicEvent
          };
          
          memories[char1.character.id].relationshipMoments.push(moment);
        });
      });
    });
  }

  // ============= CHARACTER EVALUATION =============
  
  static evaluateCharacterPerformances(
    battleState: BattleState, 
    memories: Record<string, BattleMemory>
  ): CharacterEvaluation[] {
    return battleState.teams.player.characters.map(char => {
      const memory = memories[char.character.id];
      const performance = char.battlePerformance;
      
      // Calculate battle rating based on multiple factors
      const combatEffectiveness = this.calculateCombatEffectiveness(char);
      const teamworkScore = this.calculateTeamworkScore(char, memory);
      const gameplanAdherenceScore = this.calculateGameplanAdherenceScore(char);
      const adaptabilityScore = this.calculateAdaptabilityScore(char, memory);
      
      const overallRating = Math.floor(
        (combatEffectiveness * 0.3 + teamworkScore * 0.3 + gameplanAdherenceScore * 0.2 + adaptabilityScore * 0.2)
      );
      
      // Assess mental health changes
      const mentalHealthChange = this.calculateMentalHealthImpact(char, memory);
      const stressImpact = this.calculateStressImpact(char, memory);
      const confidenceChange = this.calculateConfidenceImpact(char, memory);
      
      // Identify notable actions and patterns
      const notableActions = this.identifyNotableActions(char, memory);
      const behaviorPatterns = this.analyzeBehaviorPatterns(char, memory);
      const growthAreas = this.identifyGrowthAreas(char, memory);
      const strengthsDisplayed = this.identifyStrengthsDisplayed(char, memory);
      
      return {
        characterId: char.character.id,
        battleRating: overallRating,
        gameplanAdherenceScore,
        teamplayScore: teamworkScore,
        mentalhealthChange: mentalHealthChange,
        stressLevel: char.mentalState.stress,
        confidenceChange,
        notableActions,
        behaviorPatterns,
        growthAreas,
        strengthsDisplayed
      };
    });
  }

  static calculateCombatEffectiveness(char: BattleCharacter): number {
    const performance = char.battlePerformance;
    
    // Base combat metrics
    let effectiveness = 0;
    
    // Damage output (40% weight)
    const damageRatio = performance.damageDealt / Math.max(1, char.character.combatStats.attack);
    effectiveness += Math.min(40, damageRatio * 10);
    
    // Accuracy (30% weight)
    const accuracyRate = performance.successfulHits / Math.max(1, performance.abilitiesUsed);
    effectiveness += accuracyRate * 30;
    
    // Survival (30% weight)
    const survivalRate = char.currentHealth / char.character.combatStats.maxHealth;
    effectiveness += survivalRate * 30;
    
    return Math.min(100, effectiveness);
  }

  static calculateTeamworkScore(char: BattleCharacter, memory: BattleMemory): number {
    let teamworkScore = 50; // Base score
    
    // Positive teamwork actions
    teamworkScore += char.battlePerformance.teamplayActions * 5;
    
    // Relationship moments impact
    memory.relationshipMoments.forEach(moment => {
      if (moment.eventType === 'saved_life' || moment.eventType === 'supported') {
        teamworkScore += 10;
      } else if (moment.eventType === 'abandoned' || moment.eventType === 'conflicted') {
        teamworkScore -= 15;
      }
    });
    
    // Growth moments in teamwork
    memory.personalGrowth.forEach(growth => {
      if (growth.type === 'learned_teamwork' || growth.type === 'showed_leadership') {
        teamworkScore += 15;
      }
    });
    
    return Math.max(0, Math.min(100, teamworkScore));
  }

  static calculateGameplanAdherenceScore(char: BattleCharacter): number {
    const totalActions = char.battlePerformance.abilitiesUsed + char.battlePerformance.strategyDeviations;
    if (totalActions === 0) return char.gameplanAdherence;
    
    const gameplanAdherenceRate = (totalActions - char.battlePerformance.strategyDeviations) / totalActions;
    return Math.floor(gameplanAdherenceRate * 100);
  }

  // ============= RELATIONSHIP EVOLUTION =============
  
  static calculateRelationshipEvolution(
    battleState: BattleState, 
    memories: Record<string, BattleMemory>
  ): RelationshipChange[] {
    const changes: RelationshipChange[] = [];
    
    battleState.teams.player.characters.forEach(char1 => {
      battleState.teams.player.characters.forEach(char2 => {
        if (char1.character.id >= char2.character.id) return; // Avoid duplicates
        
        const relationshipChange = this.calculateSpecificRelationshipChange(
          char1, char2, memories, battleState
        );
        
        if (relationshipChange.newRelationshipStrength !== relationshipChange.oldRelationshipStrength) {
          changes.push(relationshipChange);
        }
      });
    });
    
    return changes;
  }

  static calculateSpecificRelationshipChange(
    char1: BattleCharacter,
    char2: BattleCharacter,
    memories: Record<string, BattleMemory>,
    battleState: BattleState
  ): RelationshipChange {
    // Find existing relationship
    const existingRelationship = char1.relationshipModifiers.find(
      rel => rel.withCharacter === char2.character.name.toLowerCase().replace(/\s+/g, '_')
    );
    
    const oldStrength = existingRelationship?.strength || 0;
    let newStrength = oldStrength;
    
    const battleEvents: string[] = [];
    let changeReason = "No significant interactions during battle";
    
    // Analyze relationship moments from both characters' perspectives
    const char1Memory = memories[char1.character.id];
    const char2Memory = memories[char2.character.id];
    
    if (char1Memory && char2Memory) {
      // Look for mutual moments
      const mutualMoments = this.findMutualRelationshipMoments(char1Memory, char2Memory);
      
      mutualMoments.forEach(moment => {
        newStrength += moment.strengthChange;
        battleEvents.push(moment.description);
        
        if (moment.strengthChange > 0) {
          changeReason = "Positive interactions during battle strengthened their bond";
        } else {
          changeReason = "Conflicts and tension during battle strained their relationship";
        }
      });
    }
    
    // Apply personality compatibility effects
    const compatibilityEffect = this.calculateCompatibilityEffect(char1, char2);
    newStrength += compatibilityEffect;
    
    // Clamp to valid range
    newStrength = Math.max(-100, Math.min(100, newStrength));
    
    return {
      character1: char1.character.id,
      character2: char2.character.id,
      oldRelationshipStrength: oldStrength,
      newRelationshipStrength: newStrength,
      changeReason,
      battleEvents,
      futureImplications: this.generateFutureImplications(oldStrength, newStrength, char1, char2)
    };
  }

  // ============= PSYCHOLOGICAL CONSEQUENCES =============
  
  static assessPsychologicalImpact(
    battleState: BattleState, 
    memories: Record<string, BattleMemory>
  ): PsychologicalConsequence[] {
    const consequences: PsychologicalConsequence[] = [];
    
    battleState.teams.player.characters.forEach(char => {
      const memory = memories[char.character.id];
      if (!memory) return;
      
      // Assess different types of psychological impact
      const trauma = this.assessTrauma(char, memory);
      const growth = this.assessPersonalGrowth(char, memory);
      const bonding = this.assessBondingExperiences(char, memory);
      const resentment = this.assessResentmentBuildup(char, memory);
      const inspiration = this.assessInspirationalMoments(char, memory);
      
      [trauma, growth, bonding, resentment, inspiration].forEach(consequence => {
        if (consequence && consequence.severity !== 'minor') {
          consequences.push(consequence);
        }
      });
    });
    
    return consequences;
  }

  static assessTrauma(char: BattleCharacter, memory: BattleMemory): PsychologicalConsequence | null {
    const traumaEvents = memory.trauma;
    if (traumaEvents.length === 0) return null;
    
    const severestTrauma = traumaEvents.reduce((worst, current) => 
      this.getTraumaSeverityValue(current.severity) > this.getTraumaSeverityValue(worst.severity) 
        ? current : worst
    );
    
    const recoveryTime = this.calculateTraumaRecoveryTime(severestTrauma, char);
    
    return {
      characterId: char.character.id,
      type: 'trauma',
      severity: severestTrauma.severity,
      description: `${char.character.name} experienced ${severestTrauma.description}`,
      longTermEffects: this.generateTraumaEffects(severestTrauma, char),
      recoveryTime,
      treatmentOptions: this.generateTraumaTreatmentOptions(severestTrauma, char)
    };
  }

  static assessPersonalGrowth(char: BattleCharacter, memory: BattleMemory): PsychologicalConsequence | null {
    const growthMoments = memory.personalGrowth;
    if (growthMoments.length === 0) return null;
    
    const significantGrowth = growthMoments.filter(growth => 
      growth.type === 'overcame_fear' || growth.type === 'showed_leadership'
    );
    
    if (significantGrowth.length === 0) return null;
    
    return {
      characterId: char.character.id,
      type: 'growth',
      severity: 'moderate',
      description: `${char.character.name} showed significant personal development`,
      longTermEffects: this.generateGrowthEffects(significantGrowth, char),
      recoveryTime: 0,
      treatmentOptions: this.generateGrowthContinuationOptions(significantGrowth, char)
    };
  }

  // ============= TRAINING RECOMMENDATIONS =============
  
  static generateTrainingPlan(
    evaluations: CharacterEvaluation[], 
    consequences: PsychologicalConsequence[]
  ): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];
    
    evaluations.forEach(evaluation => {
      // Mental health recommendations
      if (evaluation.mentalhealthChange < -20) {
        recommendations.push({
          characterId: evaluation.characterId,
          type: 'mental_health',
          priority: 'urgent',
          description: 'Immediate mental health support needed to prevent breakdown',
          expectedBenefit: 'Restore mental stability and prevent future deviation from gameplan',
          timeRequired: 5
        });
      }
      
      // Gameplan adherence training
      if (evaluation.gameplanAdherenceScore < 40) {
        recommendations.push({
          characterId: evaluation.characterId,
          type: 'gameplan_adherence',
          priority: 'high',
          description: 'Intensive discipline and trust-building exercises',
          expectedBenefit: 'Improved following of strategic commands',
          timeRequired: 8
        });
      }
      
      // Team chemistry work
      if (evaluation.teamplayScore < 50) {
        recommendations.push({
          characterId: evaluation.characterId,
          type: 'team_chemistry',
          priority: 'medium',
          description: 'Group activities and bonding exercises with teammates',
          expectedBenefit: 'Better cooperation and team dynamics',
          timeRequired: 4
        });
      }
      
      // Combat skill improvement
      if (evaluation.battleRating < 60) {
        recommendations.push({
          characterId: evaluation.characterId,
          type: 'combat_skills',
          priority: 'medium',
          description: 'Combat training and tactical education',
          expectedBenefit: 'Enhanced battle effectiveness',
          timeRequired: 6
        });
      }
      
      // Stress management
      if (evaluation.stressLevel > 70) {
        recommendations.push({
          characterId: evaluation.characterId,
          type: 'stress_management',
          priority: 'high',
          description: 'Relaxation techniques and pressure handling training',
          expectedBenefit: 'Reduced stress and better performance under pressure',
          timeRequired: 3
        });
      }
    });
    
    // Add trauma-specific recommendations
    consequences.forEach(consequence => {
      if (consequence.type === 'trauma') {
        recommendations.push({
          characterId: consequence.characterId,
          type: 'mental_health',
          priority: consequence.severity === 'severe' ? 'urgent' : 'high',
          description: `Specialized trauma therapy for ${consequence.description}`,
          expectedBenefit: 'Recovery from traumatic experience',
          timeRequired: consequence.recoveryTime
        });
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ============= TEAM CHEMISTRY EVOLUTION =============
  
  static analyzeTeamEvolution(
    battleState: BattleState, 
    relationshipChanges: RelationshipChange[]
  ): ChemistryEvolution {
    const oldChemistry = battleState.teams.player.teamChemistry;
    
    // Calculate new chemistry based on relationship changes
    let chemistryDelta = 0;
    const evolutionFactors: string[] = [];
    const strengthenedBonds: string[] = [];
    const weakenedBonds: string[] = [];
    
    relationshipChanges.forEach(change => {
      const delta = change.newRelationshipStrength - change.oldRelationshipStrength;
      chemistryDelta += delta * 0.1; // Each relationship change affects team chemistry
      
      if (delta > 20) {
        strengthenedBonds.push(`${change.character1} and ${change.character2} grew closer`);
        evolutionFactors.push(`Strong bonding between team members`);
      } else if (delta < -20) {
        weakenedBonds.push(`${change.character1} and ${change.character2} relationship deteriorated`);
        evolutionFactors.push(`Conflicts damaging team cohesion`);
      }
    });
    
    const newChemistry = Math.max(0, Math.min(100, oldChemistry + chemistryDelta));
    
    // Determine emerging dynamics
    const emergingDynamics = this.identifyEmergingDynamics(battleState, relationshipChanges);
    
    // Determine culture shift
    const cultureShift = this.determineCultureShift(oldChemistry, newChemistry, relationshipChanges);
    
    return {
      oldChemistry,
      newChemistry,
      evolutionFactors,
      emergingDynamics,
      strengthenedBonds,
      weakenedBonds,
      cultureShift
    };
  }

  // ============= UTILITY METHODS =============
  
  private static determineBattleResult(battleState: BattleState): 'victory' | 'defeat' | 'draw' {
    const playerAlive = battleState.teams.player.characters.some(char => char.currentHealth > 0);
    const opponentAlive = battleState.teams.opponent.characters.some(char => char.currentHealth > 0);
    
    if (playerAlive && !opponentAlive) return 'victory';
    if (!playerAlive && opponentAlive) return 'defeat';
    return 'draw';
  }

  private static calculateTeamPerformanceMetrics(
    battleState: BattleState, 
    evaluations: CharacterEvaluation[]
  ): TeamMetrics {
    const avgGameplanAdherence = evaluations.reduce((sum, eval) => sum + eval.gameplanAdherenceScore, 0) / evaluations.length;
    const avgTeamwork = evaluations.reduce((sum, eval) => sum + eval.teamplayScore, 0) / evaluations.length;
    const avgRating = evaluations.reduce((sum, eval) => sum + eval.battleRating, 0) / evaluations.length;
    
    return {
      overallTeamwork: Math.floor(avgTeamwork),
      gameplanAdherence: Math.floor(avgGameplanAdherence),
      strategicExecution: Math.floor(avgRating),
      moraleManagement: battleState.teams.player.currentMorale,
      conflictResolution: this.calculateConflictResolution(battleState),
      adaptability: this.calculateAdaptability(battleState)
    };
  }

  // Additional helper methods would be implemented here...
  // (Keeping focused on core functionality for brevity)
  
  private static categorizeLogEvent(logEntry: { description?: string }): 'heroic_action' | 'betrayal' | 'saved_by_ally' | 'witnessed_death' | 'successful_teamwork' | 'conflict' {
    const description = logEntry.description?.toLowerCase() || '';
    
    if (description.includes('critical hit') || description.includes('decisive blow')) {
      return 'heroic_action';
    }
    if (description.includes('assist') || description.includes('support') || description.includes('help')) {
      return 'successful_teamwork';
    }
    if (description.includes('abandon') || description.includes('betray')) {
      return 'betrayal';
    }
    if (description.includes('save') || description.includes('rescue')) {
      return 'saved_by_ally';
    }
    if (description.includes('death') || description.includes('defeat')) {
      return 'witnessed_death';
    }
    if (description.includes('conflict') || description.includes('argue')) {
      return 'conflict';
    }
    
    // Default categorization
    return 'heroic_action';
  }
  private static determineWitnesses(logEntry: { characterInvolved?: string; description?: string }, battleState: BattleState): string[] {
    const witnesses: string[] = [];
    
    // All living team members can potentially witness events
    battleState.teams.player.characters.forEach(char => {
      if (char.currentHealth > 0 && char.character.id !== logEntry.characterInvolved) {
        // High visibility events are witnessed by everyone
        if (logEntry.description?.includes('critical') || logEntry.description?.includes('decisive')) {
          witnesses.push(char.character.id);
        }
        // Team actions are witnessed by nearby members
        else if (logEntry.description?.includes('team') || logEntry.description?.includes('assist')) {
          witnesses.push(char.character.id);
        }
        // Random chance for other events
        else if (Math.random() > 0.6) {
          witnesses.push(char.character.id);
        }
      }
    });
    
    return witnesses;
  }
  private static calculateEmotionalWeight(logEntry: { description?: string }): number {
    const description = logEntry.description?.toLowerCase() || '';
    
    if (description.includes('critical hit') || description.includes('victory')) {
      return 15;
    }
    if (description.includes('saved') || description.includes('rescue')) {
      return 20;
    }
    if (description.includes('death') || description.includes('defeat')) {
      return -25;
    }
    if (description.includes('betray') || description.includes('abandon')) {
      return -20;
    }
    if (description.includes('assist') || description.includes('teamwork')) {
      return 10;
    }
    if (description.includes('conflict') || description.includes('argue')) {
      return -10;
    }
    
    return 5; // Default positive emotional weight
  }
  private static determineLongTermImpact(logEntry: { description?: string }): 'positive' | 'negative' | 'complex' {
    const description = logEntry.description?.toLowerCase() || '';
    
    if (description.includes('death') || description.includes('betray')) {
      return 'negative';
    }
    if (description.includes('saved') || description.includes('victory') || description.includes('critical')) {
      return 'positive';
    }
    if (description.includes('conflict') && description.includes('resolve')) {
      return 'complex';
    }
    if (description.includes('abandon') || description.includes('fail')) {
      return 'negative';
    }
    
    return 'positive';
  }
  private static findCharacterInteractions(char1: BattleCharacter, char2: BattleCharacter, battleState: BattleState): Array<{
    type: 'supported' | 'saved_life' | 'conflicted' | 'bonded';
    relationshipImpact: number;
    context: string;
    publicEvent: boolean;
  }> {
    const interactions: Array<{
      type: 'supported' | 'saved_life' | 'conflicted' | 'bonded';
      relationshipImpact: number;
      context: string;
      publicEvent: boolean;
    }> = [];
    
    // Check if characters were positioned near each other
    const char1Actions = battleState.battleLog.filter(log => log.characterInvolved === char1.character.id);
    const char2Actions = battleState.battleLog.filter(log => log.characterInvolved === char2.character.id);
    
    // Look for mutual assistance patterns
    char1Actions.forEach(action => {
      if (action.description?.includes('assist') || action.description?.includes('support')) {
        if (action.description.includes(char2.character.name)) {
          interactions.push({
            type: 'supported',
            relationshipImpact: 15,
            context: `${char1.character.name} provided tactical support to ${char2.character.name}`,
            publicEvent: true
          });
        }
      }
    });
    
    // Check for protective actions
    if (char1.battlePerformance.teamplayActions > 0 && char2.battlePerformance.damageReceived > 20) {
      interactions.push({
        type: 'saved_life',
        relationshipImpact: 25,
        context: `${char1.character.name} helped protect ${char2.character.name} from harm`,
        publicEvent: true
      });
    }
    
    // Check for conflicting strategies
    if (char1.battlePerformance.strategyDeviations > 2 && char2.battlePerformance.strategyDeviations === 0) {
      interactions.push({
        type: 'conflicted',
        relationshipImpact: -10,
        context: `${char1.character.name}'s reckless actions frustrated disciplined ${char2.character.name}`,
        publicEvent: false
      });
    }
    
    // Check for shared experiences
    if (char1.currentHealth < char1.character.combatStats.maxHealth * 0.5 && 
        char2.currentHealth < char2.character.combatStats.maxHealth * 0.5) {
      interactions.push({
        type: 'bonded',
        relationshipImpact: 10,
        context: `${char1.character.name} and ${char2.character.name} endured hardship together`,
        publicEvent: true
      });
    }
    
    return interactions;
  }
  private static identifyPersonalGrowth(battleState: BattleState, memories: Record<string, BattleMemory>): void {
    battleState.teams.player.characters.forEach(char => {
      const memory = memories[char.character.id];
      if (!memory) return;
      
      // Check for overcoming fear through performance
      if (char.battlePerformance.successfulHits > 5 && char.mentalState.stress > 60) {
        memory.personalGrowth.push({
          type: 'overcame_fear',
          description: `${char.character.name} performed well despite high stress`,
          statImprovement: { confidence: 5, mentalHealth: 3 }
        });
      }
      
      // Check for leadership development
      if (char.battlePerformance.teamplayActions > 3 && char.battlePerformance.strategyDeviations === 0) {
        memory.personalGrowth.push({
          type: 'showed_leadership',
          description: `${char.character.name} demonstrated excellent leadership and team coordination`,
          statImprovement: { confidence: 8, gameplanAdherence: 5 },
          permanentTrait: 'Natural Leader'
        });
      }
      
      // Check for teamwork learning
      const supportiveActions = memory.relationshipMoments.filter(
        rm => rm.eventType === 'supported' || rm.eventType === 'saved_life'
      );
      if (supportiveActions.length > 1) {
        memory.personalGrowth.push({
          type: 'learned_teamwork',
          description: `${char.character.name} learned the value of cooperation`,
          statImprovement: { teamwork: 10, mentalHealth: 5 }
        });
      }
      
      // Check for skill development through critical hits
      if (char.battlePerformance.criticalHitsDealt > 2) {
        memory.personalGrowth.push({
          type: 'developed_skill',
          description: `${char.character.name} showed improved combat technique`,
          statImprovement: { attack: 2, accuracy: 5 }
        });
      }
    });
  }
  private static assessTraumaEvents(battleState: BattleState, memories: Record<string, BattleMemory>): void {
    battleState.teams.player.characters.forEach(char => {
      const memory = memories[char.character.id];
      if (!memory) return;
      
      // Severe injury trauma
      if (char.currentHealth < char.character.combatStats.maxHealth * 0.2) {
        memory.trauma.push({
          type: 'overwhelming_fear',
          severity: 'severe',
          description: 'Near-death experience causing lasting fear',
          triggerConditions: ['low health', 'high stress situations'],
          recoveryTime: 10
        });
      }
      
      // Betrayal trauma from teammate conflicts
      const betrayalEvents = memory.relationshipMoments.filter(rm => rm.eventType === 'abandoned');
      if (betrayalEvents.length > 0) {
        memory.trauma.push({
          type: 'betrayed_by_ally',
          severity: 'moderate',
          description: 'Felt abandoned by teammates in critical moment',
          triggerConditions: ['team missions', 'high pressure situations'],
          recoveryTime: 5
        });
      }
      
      // Witnessed violence trauma
      const violentEvents = memory.notableEvents.filter(e => e.type === 'witnessed_death');
      if (violentEvents.length > 0) {
        memory.trauma.push({
          type: 'witnessed_violence',
          severity: 'moderate',
          description: 'Witnessed traumatic events during battle',
          triggerConditions: ['similar combat scenarios', 'ally in danger'],
          recoveryTime: 7
        });
      }
      
      // Strategy failure trauma
      if (char.battlePerformance.strategyDeviations > 3 && memory.emotionalImpact < -20) {
        memory.trauma.push({
          type: 'failed_team',
          severity: 'mild',
          description: 'Feels responsible for not following orders',
          triggerConditions: ['receiving strategic commands', 'team criticism'],
          recoveryTime: 3
        });
      }
    });
  }
  private static calculateAdaptabilityScore(char: BattleCharacter, memory: BattleMemory): number { return 50; }
  private static calculateMentalHealthImpact(char: BattleCharacter, memory: BattleMemory): number {
    let impact = 0;
    
    // Base impact from battle outcome
    const healthPercent = char.currentHealth / char.character.combatStats.maxHealth;
    if (healthPercent < 0.3) impact -= 15; // Severe injury trauma
    else if (healthPercent < 0.5) impact -= 10; // Moderate injury stress
    
    // Impact from notable events
    memory.notableEvents.forEach(event => {
      switch (event.type) {
        case 'heroic_action':
          impact += 5;
          break;
        case 'betrayal':
        case 'witnessed_death':
          impact -= 20;
          break;
        case 'saved_by_ally':
          impact += 3;
          break;
        case 'successful_teamwork':
          impact += 2;
          break;
        case 'conflict':
          impact -= 5;
          break;
      }
    });
    
    // Strategy deviations cause stress
    if (char.battlePerformance.strategyDeviations > 2) impact -= 10;
    
    return Math.max(-50, Math.min(50, impact));
  }
  private static calculateStressImpact(char: BattleCharacter, memory: BattleMemory): number {
    let stressChange = 0;
    
    // Base stress from battle intensity
    const damageRatio = char.battlePerformance.damageReceived / char.character.combatStats.maxHealth;
    stressChange += damageRatio * 20; // Taking damage is stressful
    
    // Critical hits received are very stressful
    if (char.battlePerformance.criticalHitsReceived > 0) {
      stressChange += char.battlePerformance.criticalHitsReceived * 10;
    }
    
    // Strategy deviations increase stress
    stressChange += char.battlePerformance.strategyDeviations * 5;
    
    // Positive factors reduce stress
    if (memory.emotionalImpact > 0) {
      stressChange -= 10; // Positive battle experience
    }
    
    // Team support reduces stress
    const supportiveRelationships = memory.relationshipMoments.filter(
      rm => rm.eventType === 'supported' || rm.eventType === 'saved_life'
    ).length;
    stressChange -= supportiveRelationships * 5;
    
    return Math.max(-30, Math.min(50, stressChange));
  }
  private static calculateConfidenceImpact(char: BattleCharacter, memory: BattleMemory): number {
    let confidenceChange = 0;
    
    // Success breeds confidence
    const hitRate = char.battlePerformance.successfulHits / Math.max(1, char.battlePerformance.abilitiesUsed);
    if (hitRate > 0.8) confidenceChange += 15; // High accuracy
    else if (hitRate < 0.4) confidenceChange -= 10; // Poor accuracy
    
    // Critical hits boost confidence
    confidenceChange += char.battlePerformance.criticalHitsDealt * 5;
    
    // Taking heavy damage hurts confidence
    if (char.currentHealth < char.character.combatStats.maxHealth * 0.3) {
      confidenceChange -= 15;
    }
    
    // Heroic actions boost confidence
    const heroicActions = memory.notableEvents.filter(e => e.type === 'heroic_action').length;
    confidenceChange += heroicActions * 10;
    
    // Team success matters
    if (memory.emotionalImpact > 20) confidenceChange += 10;
    
    return Math.max(-50, Math.min(50, confidenceChange));
  }
  private static identifyNotableActions(char: BattleCharacter, memory: BattleMemory): string[] {
    const actions: string[] = [];
    
    // Combat achievements
    if (char.battlePerformance.criticalHitsDealt > 2) {
      actions.push(`Landed ${char.battlePerformance.criticalHitsDealt} critical hits`);
    }
    
    if (char.battlePerformance.successfulHits > 10) {
      actions.push('Maintained sustained offensive pressure');
    }
    
    // Defensive achievements
    if (char.battlePerformance.damageReceived === 0) {
      actions.push('Avoided all damage - perfect defense');
    }
    
    // Team play
    if (char.battlePerformance.teamplayActions > 3) {
      actions.push('Excellent team coordination');
    }
    
    // Strategy adherence
    if (char.battlePerformance.strategyDeviations === 0) {
      actions.push('Perfect gameplan adherence');
    } else if (char.battlePerformance.strategyDeviations > 3) {
      actions.push('Frequently deviated from strategy');
    }
    
    // Psychological events
    memory.notableEvents.forEach(event => {
      if (event.type === 'heroic_action') {
        actions.push('Performed heroic action');
      } else if (event.type === 'saved_by_ally') {
        actions.push('Saved by teammate intervention');
      }
    });
    
    return actions;
  }
  private static analyzeBehaviorPatterns(char: BattleCharacter, memory: BattleMemory): string[] {
    const patterns: string[] = [];
    
    // Analyze strategy adherence patterns
    if (char.battlePerformance.strategyDeviations > 3) {
      patterns.push('Tends to ignore strategic orders when stressed');
    } else if (char.battlePerformance.strategyDeviations === 0) {
      patterns.push('Excellent discipline - consistently follows gameplan');
    }
    
    // Analyze teamwork patterns
    if (char.battlePerformance.teamplayActions > 5) {
      patterns.push('Strong team player - frequently assists allies');
    } else if (char.battlePerformance.teamplayActions === 0) {
      patterns.push('Isolated fighting style - rarely cooperates with team');
    }
    
    // Analyze combat style patterns
    const hitRate = char.battlePerformance.successfulHits / Math.max(1, char.battlePerformance.abilitiesUsed);
    if (hitRate > 0.8) {
      patterns.push('Calculated and precise - high accuracy fighter');
    } else if (hitRate < 0.4) {
      patterns.push('Aggressive but reckless - struggles with accuracy');
    }
    
    // Analyze emotional patterns from events
    const traumaticEvents = memory.notableEvents.filter(e => e.type === 'witnessed_death' || e.type === 'betrayal');
    if (traumaticEvents.length > 0) {
      patterns.push('Shows signs of emotional distress during intense moments');
    }
    
    const heroicEvents = memory.notableEvents.filter(e => e.type === 'heroic_action');
    if (heroicEvents.length > 1) {
      patterns.push('Natural leader - rises to challenges under pressure');
    }
    
    return patterns;
  }
  private static identifyGrowthAreas(char: BattleCharacter, memory: BattleMemory): string[] {
    const growthAreas: string[] = [];
    
    // Strategy adherence improvement
    if (char.battlePerformance.strategyDeviations > 2) {
      growthAreas.push('Gameplan adherence - needs better discipline and trust in leadership');
    }
    
    // Combat effectiveness
    const hitRate = char.battlePerformance.successfulHits / Math.max(1, char.battlePerformance.abilitiesUsed);
    if (hitRate < 0.6) {
      growthAreas.push('Combat accuracy - requires target practice and technique refinement');
    }
    
    // Teamwork development
    if (char.battlePerformance.teamplayActions < 3) {
      growthAreas.push('Team coordination - needs to develop cooperation and communication skills');
    }
    
    // Mental resilience
    if (char.mentalState.stress > 70) {
      growthAreas.push('Stress management - requires mental conditioning and pressure training');
    }
    
    // Relationship building
    const negativeRelationships = memory.relationshipMoments.filter(
      rm => rm.eventType === 'conflicted' || rm.eventType === 'abandoned'
    );
    if (negativeRelationships.length > 0) {
      growthAreas.push('Interpersonal relationships - needs conflict resolution and empathy training');
    }
    
    // Adaptability
    if (char.battlePerformance.strategyDeviations > 0 && this.calculateAdaptabilityScore(char, memory) < 40) {
      growthAreas.push('Tactical adaptability - must learn when to adapt vs when to follow orders');
    }
    
    // Confidence building
    if (char.mentalState.confidence < 40) {
      growthAreas.push('Self-confidence - needs success experiences and positive reinforcement');
    }
    
    return growthAreas;
  }
  private static identifyStrengthsDisplayed(char: BattleCharacter, memory: BattleMemory): string[] {
    const strengths: string[] = [];
    
    // Combat strengths
    const hitRate = char.battlePerformance.successfulHits / Math.max(1, char.battlePerformance.abilitiesUsed);
    if (hitRate > 0.8) {
      strengths.push('Exceptional accuracy and precision in combat');
    }
    
    if (char.battlePerformance.criticalHitsDealt > 2) {
      strengths.push('Ability to find and exploit enemy weaknesses');
    }
    
    // Strategic strengths
    if (char.battlePerformance.strategyDeviations === 0) {
      strengths.push('Perfect gameplan adherence - excellent discipline');
    }
    
    // Teamwork strengths
    if (char.battlePerformance.teamplayActions > 5) {
      strengths.push('Outstanding team player and supporter');
    }
    
    // Mental fortitude
    if (char.mentalState.stress < 30 && memory.emotionalImpact > 0) {
      strengths.push('Mental resilience under pressure');
    }
    
    // Leadership qualities
    const heroicActions = memory.notableEvents.filter(e => e.type === 'heroic_action');
    if (heroicActions.length > 0) {
      strengths.push('Natural leadership and courage in critical moments');
    }
    
    // Relationship building
    const positiveRelationships = memory.relationshipMoments.filter(
      rm => rm.eventType === 'saved_life' || rm.eventType === 'supported'
    );
    if (positiveRelationships.length > 2) {
      strengths.push('Strong relationship building and teammate support');
    }
    
    // Survival ability
    if (char.currentHealth > char.character.combatStats.maxHealth * 0.7) {
      strengths.push('Excellent defensive awareness and survival instincts');
    }
    
    // Growth mindset
    if (memory.personalGrowth.length > 0) {
      strengths.push('Shows continuous learning and personal development');
    }
    
    return strengths;
  }
  private static findMutualRelationshipMoments(memory1: BattleMemory, memory2: BattleMemory): Array<{
    description: string;
    strengthChange: number;
    type: string;
    witnessed: boolean;
  }> {
    const mutualMoments: Array<{
      description: string;
      strengthChange: number;
      type: string;
      witnessed: boolean;
    }> = [];
    
    // Find moments that both characters experienced together
    memory1.relationshipMoments.forEach(moment1 => {
      const matchingMoment = memory2.relationshipMoments.find(moment2 => 
        moment2.withCharacter === memory1.characterId && 
        moment1.withCharacter === memory2.characterId &&
        Math.abs(moment1.strengthChange - moment2.strengthChange) < 5
      );
      
      if (matchingMoment) {
        mutualMoments.push({
          description: moment1.emotionalContext,
          strengthChange: (moment1.strengthChange + matchingMoment.strengthChange) / 2,
          type: moment1.eventType,
          witnessed: moment1.witnessedByTeam
        });
      }
    });
    
    return mutualMoments;
  }
  private static calculateCompatibilityEffect(char1: BattleCharacter, char2: BattleCharacter): number {
    let compatibilityBonus = 0;
    
    // Strategy adherence compatibility
    const adherenceDiff = Math.abs(char1.battlePerformance.strategyDeviations - char2.battlePerformance.strategyDeviations);
    if (adherenceDiff < 2) {
      compatibilityBonus += 5; // Similar discipline levels
    } else if (adherenceDiff > 4) {
      compatibilityBonus -= 5; // Very different approaches
    }
    
    // Teamwork compatibility
    if (char1.battlePerformance.teamplayActions > 3 && char2.battlePerformance.teamplayActions > 3) {
      compatibilityBonus += 10; // Both are team players
    }
    
    // Confidence level compatibility
    const confidenceDiff = Math.abs(char1.mentalState.confidence - char2.mentalState.confidence);
    if (confidenceDiff < 20) {
      compatibilityBonus += 3; // Similar confidence levels
    } else if (confidenceDiff > 50) {
      compatibilityBonus -= 3; // Very different confidence levels
    }
    
    // Stress level effects
    if (char1.mentalState.stress > 70 && char2.mentalState.stress > 70) {
      compatibilityBonus -= 5; // Both stressed = more conflict
    }
    
    return compatibilityBonus;
  }
  private static generateFutureImplications(oldStrength: number, newStrength: number, char1: BattleCharacter, char2: BattleCharacter): string[] {
    const implications: string[] = [];
    const strengthDelta = newStrength - oldStrength;
    
    if (strengthDelta > 20) {
      implications.push('Strong bond will improve team coordination in future battles');
      implications.push('May develop into natural battle partnership');
      if (newStrength > 70) {
        implications.push('Could become inseparable - may struggle if separated');
      }
    } else if (strengthDelta < -20) {
      implications.push('Tension may disrupt team chemistry if not addressed');
      implications.push('May need mediation or separate training sessions');
      if (newStrength < -50) {
        implications.push('Risk of open conflict during missions');
      }
    } else if (Math.abs(strengthDelta) > 5) {
      implications.push('Relationship is evolving - monitor for further changes');
    }
    
    // Personality-based implications
    if (char1.mentalState.confidence > 80 && char2.mentalState.confidence < 40) {
      implications.push('Confidence gap may create mentor-student dynamic');
    }
    
    return implications;
  }
  private static getTraumaSeverityValue(severity: string): number {
    switch (severity) {
      case 'mild': return 1;
      case 'moderate': return 2;
      case 'severe': return 3;
      default: return 1;
    }
  }
  private static calculateTraumaRecoveryTime(trauma: TraumaEvent, char: BattleCharacter): number { return 3; }
  private static generateTraumaEffects(trauma: TraumaEvent, char: BattleCharacter): string[] {
    const effects: string[] = [];
    
    switch (trauma.type) {
      case 'witnessed_violence':
        effects.push('Increased hesitation in combat situations');
        effects.push('Heightened stress response to violence');
        if (trauma.severity === 'severe') {
          effects.push('Potential flashbacks during intense battles');
        }
        break;
        
      case 'betrayed_by_ally':
        effects.push('Reduced trust in team members');
        effects.push('Increased tendency to act independently');
        effects.push('Difficulty accepting help from others');
        break;
        
      case 'failed_team':
        effects.push('Increased anxiety about following orders');
        effects.push('Self-doubt regarding strategic decisions');
        effects.push('Tendency to second-guess leadership');
        break;
        
      case 'overwhelming_fear':
        effects.push('Panic responses in similar threatening situations');
        effects.push('Reduced combat effectiveness under pressure');
        if (trauma.severity === 'severe') {
          effects.push('Possible withdrawal from dangerous missions');
        }
        break;
    }
    
    return effects;
  }
  private static generateTraumaTreatmentOptions(trauma: TraumaEvent, char: BattleCharacter): string[] {
    const treatments: string[] = [];
    
    // Universal treatments
    treatments.push('Individual counseling sessions');
    treatments.push('Gradual exposure therapy in safe environments');
    
    switch (trauma.type) {
      case 'witnessed_violence':
        treatments.push('Desensitization training with simulated combat');
        treatments.push('Mindfulness and grounding techniques');
        treatments.push('Peer support groups with other survivors');
        break;
        
      case 'betrayed_by_ally':
        treatments.push('Trust-building exercises with reliable teammates');
        treatments.push('Mediated discussions with involved parties');
        treatments.push('Team integration activities');
        break;
        
      case 'failed_team':
        treatments.push('Command structure education and clarification');
        treatments.push('Practice missions with clear success criteria');
        treatments.push('Leadership communication training');
        break;
        
      case 'overwhelming_fear':
        treatments.push('Anxiety management and breathing techniques');
        treatments.push('Progressive combat simulation training');
        treatments.push('Confidence-building through achievable goals');
        break;
    }
    
    if (trauma.severity === 'severe') {
      treatments.push('Temporary duty modification or leave');
      treatments.push('Intensive therapy program');
    }
    
    return treatments;
  }
  private static generateGrowthEffects(growth: GrowthMoment[], char: BattleCharacter): string[] {
    const effects: string[] = [];
    
    growth.forEach(moment => {
      switch (moment.type) {
        case 'overcame_fear':
          effects.push('Increased confidence in challenging situations');
          effects.push('Better stress management under pressure');
          break;
          
        case 'showed_leadership':
          effects.push('Enhanced natural leadership abilities');
          effects.push('Improved team coordination skills');
          effects.push('Increased respect from teammates');
          break;
          
        case 'learned_teamwork':
          effects.push('Better cooperation with team members');
          effects.push('Improved communication during missions');
          effects.push('Enhanced group tactical awareness');
          break;
          
        case 'developed_skill':
          effects.push('Improved combat technique and accuracy');
          effects.push('Enhanced tactical decision-making');
          break;
      }
    });
    
    return [...new Set(effects)]; // Remove duplicates
  }
  private static generateGrowthContinuationOptions(growth: GrowthMoment[], char: BattleCharacter): string[] {
    const options: string[] = [];
    
    growth.forEach(moment => {
      switch (moment.type) {
        case 'overcame_fear':
          options.push('Progressive challenge training to build on courage');
          options.push('Leadership opportunities in low-risk scenarios');
          break;
          
        case 'showed_leadership':
          options.push('Advanced leadership and tactics training');
          options.push('Mentoring role for newer team members');
          options.push('Command simulation exercises');
          break;
          
        case 'learned_teamwork':
          options.push('Team captain training and responsibilities');
          options.push('Cross-training with different team combinations');
          break;
          
        case 'developed_skill':
          options.push('Advanced combat technique refinement');
          options.push('Specialized weapon or ability training');
          options.push('Teaching role to help others improve');
          break;
      }
    });
    
    return [...new Set(options)]; // Remove duplicates
  }
  private static assessBondingExperiences(char: BattleCharacter, memory: BattleMemory): PsychologicalConsequence | null {
    const bondingMoments = memory.relationshipMoments.filter(
      rm => rm.eventType === 'saved_life' || rm.eventType === 'supported' || rm.eventType === 'bonded'
    );
    
    if (bondingMoments.length < 2) return null;
    
    const totalBondingStrength = bondingMoments.reduce((sum, moment) => sum + moment.strengthChange, 0);
    
    if (totalBondingStrength > 30) {
      return {
        characterId: char.character.id,
        type: 'growth',
        severity: 'moderate',
        description: `${char.character.name} formed strong bonds with teammates`,
        longTermEffects: [
          'Increased team loyalty and cooperation',
          'Better stress management through social support',
          'Enhanced motivation in group missions'
        ],
        recoveryTime: 0,
        treatmentOptions: [
          'Continue team-building exercises',
          'Assign to missions with bonded teammates',
          'Use as mentor for newer team members'
        ]
      };
    }
    
    return null;
  }
  private static assessResentmentBuildup(char: BattleCharacter, memory: BattleMemory): PsychologicalConsequence | null {
    const negativeEvents = memory.relationshipMoments.filter(
      rm => rm.eventType === 'abandoned' || rm.eventType === 'conflicted'
    );
    
    if (negativeEvents.length === 0) return null;
    
    const resentmentLevel = negativeEvents.reduce((sum, event) => sum + Math.abs(event.strengthChange), 0);
    
    if (resentmentLevel > 25) {
      return {
        characterId: char.character.id,
        type: 'trauma',
        severity: resentmentLevel > 50 ? 'severe' : 'moderate',
        description: `${char.character.name} harbors resentment toward teammates`,
        longTermEffects: [
          'Reduced cooperation with specific team members',
          'Increased likelihood of strategy deviation',
          'Potential for open conflict during missions'
        ],
        recoveryTime: Math.floor(resentmentLevel / 10),
        treatmentOptions: [
          'Mediated conflict resolution sessions',
          'Individual counseling to address grievances',
          'Temporary separation from conflicted teammates',
          'Team-building exercises focused on trust'
        ]
      };
    }
    
    return null;
  }
  private static assessInspirationalMoments(char: BattleCharacter, memory: BattleMemory): PsychologicalConsequence | null {
    const heroicEvents = memory.notableEvents.filter(e => e.type === 'heroic_action');
    const growthMoments = memory.personalGrowth.filter(g => g.type === 'showed_leadership' || g.type === 'overcame_fear');
    
    if (heroicEvents.length === 0 && growthMoments.length === 0) return null;
    
    if (heroicEvents.length > 0 || growthMoments.length > 1) {
      return {
        characterId: char.character.id,
        type: 'growth',
        severity: 'moderate',
        description: `${char.character.name} experienced inspiring moments of personal triumph`,
        longTermEffects: [
          'Increased self-confidence and leadership potential',
          'Enhanced resilience in future challenging situations',
          'Positive influence on team morale and inspiration'
        ],
        recoveryTime: 0,
        treatmentOptions: [
          'Leadership development training',
          'Assign mentor role for struggling teammates',
          'Advanced tactical training to build on strengths',
          'Public recognition to reinforce positive behavior'
        ]
      };
    }
    
    return null;
  }
  private static identifyEmergingDynamics(battleState: BattleState, changes: RelationshipChange[]): string[] {
    const dynamics: string[] = [];
    
    // Analyze overall relationship trends
    const strongBonds = changes.filter(change => change.newRelationshipStrength > 60).length;
    const conflicts = changes.filter(change => change.newRelationshipStrength < -30).length;
    const newAlliances = changes.filter(change => 
      change.oldRelationshipStrength < 20 && change.newRelationshipStrength > 40
    ).length;
    
    if (strongBonds > 2) {
      dynamics.push('Team is forming tight-knit battle partnerships');
    }
    
    if (conflicts > 1) {
      dynamics.push('Multiple interpersonal conflicts threaten team cohesion');
    }
    
    if (newAlliances > 0) {
      dynamics.push('New friendships and alliances are forming through shared combat');
    }
    
    // Check for leadership emergence
    const highPerformers = battleState.teams.player.characters.filter(char => 
      char.battlePerformance.teamplayActions > 4 && char.battlePerformance.strategyDeviations < 2
    );
    
    if (highPerformers.length > 0) {
      dynamics.push('Natural leaders are emerging within the team structure');
    }
    
    // Check for team splitting
    const isolatedCharacters = battleState.teams.player.characters.filter(char => 
      char.battlePerformance.teamplayActions === 0
    );
    
    if (isolatedCharacters.length > 1) {
      dynamics.push('Some members are becoming isolated from the group');
    }
    
    return dynamics;
  }
  private static determineCultureShift(oldChemistry: number, newChemistry: number, changes: RelationshipChange[]): string { return 'No significant culture change'; }
  private static calculateConflictResolution(battleState: BattleState): number { return 50; }
  private static calculateAdaptability(battleState: BattleState): number { return 50; }

  // ============= COMBAT EXPERIENCE PSYCHSTATS PROGRESSION =============
  
  /**
   * Apply psychStats improvements based on combat experience and battle performance
   * This connects battle outcomes to character psychological development
   */
  static applyCombatExperienceGains(
    battleState: BattleState, 
    evaluations: CharacterEvaluation[], 
    consequences: PsychologicalConsequence[]
  ): void {
    evaluations.forEach(evaluation => {
      const character = battleState.teams.player.characters.find(c => c.character.id === evaluation.characterId);
      if (!character) return;

      // Calculate psychStats improvements based on battle performance
      let trainingImprovement = 0;
      let teamPlayerImprovement = 0;
      let egoChange = 0;
      let mentalHealthChange = 0;
      let communicationImprovement = 0;

      // Performance-based improvements
      if (evaluation.overallPerformance > 70) {
        // Good performance builds confidence and competence
        trainingImprovement += 1.5;
        mentalHealthChange += 2;
        egoChange += 1;
        console.log(`${character.character.name}: Excellent performance (+training, +mental health, +ego)`);
      }

      if (evaluation.teamplayScore > 70) {
        // Good teamwork improves teamPlayer and communication
        teamPlayerImprovement += 2;
        communicationImprovement += 1.5;
        console.log(`${character.character.name}: Great teamwork (+teamPlayer, +communication)`);
      }

      // Victory/defeat effects
      const won = battleState.result?.winner === 'player';
      if (won) {
        // Victory improves mental health and confidence
        mentalHealthChange += 1;
        egoChange += 0.5;
      } else {
        // Defeat teaches humility but can harm mental health
        egoChange -= 1;
        mentalHealthChange -= 0.5;
        trainingImprovement += 0.5; // Learn from mistakes
      }

      // Psychological consequence effects
      consequences.forEach(consequence => {
        if (consequence.characterId === evaluation.characterId) {
          switch (consequence.type) {
            case 'growth':
              trainingImprovement += 2;
              mentalHealthChange += 3;
              communicationImprovement += 1;
              console.log(`${character.character.name}: Personal growth (+training, +mental health, +communication)`);
              break;
            case 'trauma':
              mentalHealthChange -= 3;
              egoChange -= 1;
              console.log(`${character.character.name}: Trauma experienced (-mental health, -ego)`);
              break;
            case 'inspiration':
              egoChange += 2;
              communicationImprovement += 2;
              console.log(`${character.character.name}: Inspired (+ego, +communication)`);
              break;
          }
        }
      });

      // Apply improvements (using same system as training)
      this.updateCharacterPsychStatsFromCombat(
        evaluation.characterId, 
        {
          training: trainingImprovement,
          teamPlayer: teamPlayerImprovement,
          ego: egoChange,
          mentalHealth: mentalHealthChange,
          communication: communicationImprovement
        }
      );
    });
  }

  /**
   * Update character psychStats based on combat experience
   * Similar to training system but for battle-based improvements
   */
  private static updateCharacterPsychStatsFromCombat(
    characterId: string,
    improvements: {
      training: number;
      teamPlayer: number;
      ego: number;
      mentalHealth: number;
      communication: number;
    }
  ): void {
    // Only update if localStorage is available (browser environment)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log(`Combat experience skipped (SSR): ${characterId} improvements`);
      return;
    }

    const templateId = characterId.split('_')[0]; // Remove instance suffix

    Object.entries(improvements).forEach(([statType, change]) => {
      if (Math.abs(change) > 0.1) { // Only apply meaningful changes
        const improvementKey = `${templateId}_${statType}_improvement`;
        const currentImprovement = parseFloat(localStorage.getItem(improvementKey) || '0');
        const newImprovement = Math.max(-20, Math.min(30, currentImprovement + change)); // Cap between -20 and +30
        
        localStorage.setItem(improvementKey, newImprovement.toString());
        
        const changeStr = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
        console.log(`Combat experience: ${characterId}'s ${statType} ${changeStr} (total: ${newImprovement.toFixed(1)})`);
      }
    });
  }
}

export default PostBattleAnalysisSystem;
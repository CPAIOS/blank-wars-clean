// Progression Integration System
// Connects post-battle analysis to real character improvements

import { Character, BaseStats, CombatStats } from '../data/characters';
import { TrainingRecommendation, CharacterEvaluation, PostBattleAnalysis } from '../data/battleFlow';
import { TrainingActivity, TrainingEffect, TrainingResult, CharacterTrainingState } from './trainingSystem';
import { audioService } from '../services/audioService';

export interface ProgressionSession {
  characterId: string;
  type: 'training' | 'recovery' | 'development';
  recommendations: TrainingRecommendation[];
  selectedActions: ProgressionAction[];
  results: ProgressionResult[];
  timestamp: Date;
}

export interface ProgressionAction {
  type: TrainingRecommendation['type'];
  intensity: 'light' | 'moderate' | 'intensive';
  duration: number; // hours
  cost: {
    trainingPoints: number;
    time: number;
  };
}

export interface ProgressionResult {
  characterId: string;
  statChanges: Partial<BaseStats>;
  mentalStateChanges: {
    stress?: number;
    confidence?: number;
    mentalHealth?: number;
    teamTrust?: number;
  };
  skillImprovements: {
    gameplanAdherence?: number;
    trainingLevel?: number;
    bondLevel?: number;
  };
  experienceGained: number;
  description: string;
}

export class ProgressionIntegrationSystem {
  
  // Convert post-battle recommendations to actionable training
  static generateTrainingPlan(
    analysis: PostBattleAnalysis,
    characters: Character[]
  ): Map<string, ProgressionSession> {
    const sessions = new Map<string, ProgressionSession>();
    
    analysis.trainingRecommendations.forEach(recommendation => {
      const character = characters.find(c => c.id === recommendation.characterId);
      if (!character) return;
      
      let session = sessions.get(recommendation.characterId);
      if (!session) {
        session = {
          characterId: recommendation.characterId,
          type: 'training',
          recommendations: [],
          selectedActions: [],
          results: [],
          timestamp: new Date()
        };
        sessions.set(recommendation.characterId, session);
      }
      
      session.recommendations.push(recommendation);
      
      // Auto-generate suggested action based on recommendation
      const suggestedAction = this.createActionFromRecommendation(recommendation, character);
      session.selectedActions.push(suggestedAction);
    });
    
    return sessions;
  }
  
  private static createActionFromRecommendation(
    recommendation: TrainingRecommendation,
    character: Character
  ): ProgressionAction {
    // Map recommendation types to training intensities and costs
    const actionMapping: Record<string, Partial<ProgressionAction>> = {
      'mental_health': {
        intensity: recommendation.priority === 'urgent' ? 'intensive' : 'moderate',
        duration: 4,
        cost: { trainingPoints: 15, time: 4 }
      },
      'strategy_focus': {
        intensity: 'moderate',
        duration: 3,
        cost: { trainingPoints: 10, time: 3 }
      },
      'team_chemistry': {
        intensity: 'light',
        duration: 2,
        cost: { trainingPoints: 8, time: 2 }
      },
      'combat_skills': {
        intensity: 'intensive',
        duration: 6,
        cost: { trainingPoints: 20, time: 6 }
      },
      'stress_management': {
        intensity: 'moderate',
        duration: 3,
        cost: { trainingPoints: 12, time: 3 }
      }
    };
    
    const baseAction = actionMapping[recommendation.type] || {
      intensity: 'moderate',
      duration: 3,
      cost: { trainingPoints: 10, time: 3 }
    };
    
    return {
      type: recommendation.type,
      intensity: baseAction.intensity as 'light' | 'moderate' | 'intensive',
      duration: baseAction.duration!,
      cost: baseAction.cost!
    };
  }
  
  // Execute training session and apply real character improvements
  static executeTrainingSession(
    session: ProgressionSession,
    character: Character
  ): ProgressionResult {
    const result: ProgressionResult = {
      characterId: character.id,
      statChanges: {},
      mentalStateChanges: {},
      skillImprovements: {},
      experienceGained: 0,
      description: ''
    };
    
    session.selectedActions.forEach(action => {
      this.applyTrainingAction(action, character, result);
    });
    
    // Calculate total experience gained
    result.experienceGained = this.calculateExperienceGain(session, character);
    
    // Generate description
    result.description = this.generateTrainingDescription(session, result);
    
    // Play training completion sound
    audioService.playSoundEffect('level_up');
    
    return result;
  }
  
  private static applyTrainingAction(
    action: ProgressionAction,
    character: Character,
    result: ProgressionResult
  ): void {
    const intensityMultiplier = {
      'light': 0.5,
      'moderate': 1.0,
      'intensive': 1.5
    }[action.intensity];
    
    switch (action.type) {
      case 'mental_health':
        result.mentalStateChanges.mentalHealth = (result.mentalStateChanges.mentalHealth || 0) + 
          Math.floor(15 * intensityMultiplier);
        result.mentalStateChanges.stress = (result.mentalStateChanges.stress || 0) - 
          Math.floor(10 * intensityMultiplier);
        break;
        
      case 'strategy_focus':
        result.skillImprovements.gameplanAdherence = (result.skillImprovements.gameplanAdherence || 0) + 
          Math.floor(8 * intensityMultiplier);
        result.mentalStateChanges.confidence = (result.mentalStateChanges.confidence || 0) + 
          Math.floor(5 * intensityMultiplier);
        break;
        
      case 'team_chemistry':
        result.mentalStateChanges.teamTrust = (result.mentalStateChanges.teamTrust || 0) + 
          Math.floor(12 * intensityMultiplier);
        result.skillImprovements.bondLevel = (result.skillImprovements.bondLevel || 0) + 
          Math.floor(6 * intensityMultiplier);
        break;
        
      case 'combat_skills':
        const statIncrease = Math.floor(2 * intensityMultiplier);
        result.statChanges.strength = (result.statChanges.strength || 0) + statIncrease;
        result.statChanges.agility = (result.statChanges.agility || 0) + statIncrease;
        break;
        
      case 'stress_management':
        result.mentalStateChanges.stress = (result.mentalStateChanges.stress || 0) - 
          Math.floor(15 * intensityMultiplier);
        result.mentalStateChanges.confidence = (result.mentalStateChanges.confidence || 0) + 
          Math.floor(8 * intensityMultiplier);
        break;
    }
  }
  
  private static calculateExperienceGain(
    session: ProgressionSession,
    character: Character
  ): number {
    let baseXP = 0;
    
    session.selectedActions.forEach(action => {
      const actionXP = {
        'mental_health': 50,
        'strategy_focus': 40,
        'team_chemistry': 30,
        'combat_skills': 60,
        'stress_management': 35
      }[action.type] || 30;
      
      const intensityMultiplier = {
        'light': 0.7,
        'moderate': 1.0,
        'intensive': 1.3
      }[action.intensity];
      
      baseXP += Math.floor(actionXP * intensityMultiplier);
    });
    
    // Bonus XP for urgent recommendations (shows dedication)
    const urgentCount = session.recommendations.filter(r => r.priority === 'urgent').length;
    baseXP += urgentCount * 25;
    
    return baseXP;
  }
  
  private static generateTrainingDescription(
    session: ProgressionSession,
    result: ProgressionResult
  ): string {
    const improvements: string[] = [];
    
    if (result.statChanges.strength || result.statChanges.agility) {
      improvements.push('enhanced combat abilities');
    }
    if (result.mentalStateChanges.mentalHealth && result.mentalStateChanges.mentalHealth > 0) {
      improvements.push('improved mental health');
    }
    if (result.skillImprovements.gameplanAdherence && result.skillImprovements.gameplanAdherence > 0) {
      improvements.push('better strategy adherence');
    }
    if (result.mentalStateChanges.teamTrust && result.mentalStateChanges.teamTrust > 0) {
      improvements.push('stronger team bonds');
    }
    if (result.mentalStateChanges.stress && result.mentalStateChanges.stress < 0) {
      improvements.push('reduced stress levels');
    }
    
    if (improvements.length === 0) {
      return 'Completed training session with minor improvements.';
    }
    
    return `Training session successful! Character gained: ${improvements.join(', ')}.`;
  }
  
  // Apply progression results to character data
  static applyProgressionToCharacter(
    character: Character,
    result: ProgressionResult
  ): Character {
    const updatedCharacter = { ...character };
    
    // Apply stat changes
    if (result.statChanges) {
      updatedCharacter.baseStats = {
        ...updatedCharacter.baseStats,
        strength: Math.min(100, updatedCharacter.baseStats.strength + (result.statChanges.strength || 0)),
        agility: Math.min(100, updatedCharacter.baseStats.agility + (result.statChanges.agility || 0)),
        intelligence: Math.min(100, updatedCharacter.baseStats.intelligence + (result.statChanges.intelligence || 0)),
        vitality: Math.min(100, updatedCharacter.baseStats.vitality + (result.statChanges.vitality || 0)),
        wisdom: Math.min(100, updatedCharacter.baseStats.wisdom + (result.statChanges.wisdom || 0)),
        charisma: Math.min(100, updatedCharacter.baseStats.charisma + (result.statChanges.charisma || 0))
      };
    }
    
    // Apply skill improvements
    if (result.skillImprovements.trainingLevel) {
      updatedCharacter.trainingLevel = Math.min(100, 
        updatedCharacter.trainingLevel + result.skillImprovements.trainingLevel
      );
    }
    
    if (result.skillImprovements.bondLevel) {
      updatedCharacter.bondLevel = Math.min(100, 
        updatedCharacter.bondLevel + result.skillImprovements.bondLevel
      );
    }
    
    // Apply experience gain
    updatedCharacter.experience.totalXP += result.experienceGained;
    updatedCharacter.experience.currentXP += result.experienceGained;
    
    // Check for level up
    const newLevelData = this.checkForLevelUp(updatedCharacter);
    if (newLevelData) {
      updatedCharacter.level = newLevelData.level;
      updatedCharacter.experience.currentLevel = newLevelData.level;
      updatedCharacter.statPoints += newLevelData.statPointsGained;
      
      // Play level up sound
      audioService.playSoundEffect('level_up');
    }
    
    // Update last training date
    updatedCharacter.lastTrainingDate = new Date();
    
    return updatedCharacter;
  }
  
  private static checkForLevelUp(character: Character): { level: number; statPointsGained: number } | null {
    // Simple level up calculation
    const xpPerLevel = 1000;
    const newLevel = Math.floor(character.experience.totalXP / xpPerLevel) + 1;
    
    if (newLevel > character.level) {
      const statPointsGained = (newLevel - character.level) * 3; // 3 stat points per level
      return { level: newLevel, statPointsGained };
    }
    
    return null;
  }
  
  // Generate battle performance-based XP
  static calculateBattleExperience(
    evaluation: CharacterEvaluation,
    battleResult: 'victory' | 'defeat' | 'draw'
  ): number {
    let baseXP = 100; // Base battle participation XP
    
    // Battle result bonus
    const resultBonus = {
      'victory': 50,
      'draw': 25,
      'defeat': 10
    }[battleResult];
    
    baseXP += resultBonus;
    
    // Performance bonuses
    baseXP += Math.floor(evaluation.battleRating * 0.5); // Up to 50 XP for perfect performance
    baseXP += Math.floor(evaluation.gameplanAdherenceScore * 0.3); // Up to 30 XP for perfect adherence
    baseXP += Math.floor(evaluation.teamplayScore * 0.3); // Up to 30 XP for perfect teamwork
    
    // Growth area penalties (learning opportunity)
    const growthPenalty = evaluation.growthAreas.length * 5;
    baseXP = Math.max(50, baseXP - growthPenalty); // Minimum 50 XP
    
    // Notable actions bonus
    baseXP += evaluation.notableActions.length * 10;
    
    return Math.floor(baseXP);
  }
}

export default ProgressionIntegrationSystem;
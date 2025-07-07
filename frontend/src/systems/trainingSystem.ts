/**
 * Training System
 * Between-battle character development and psychology management
 * Part of the revolutionary _____ WARS psychology-based battle system
 */

import { Character } from '../data/characters';

export interface TrainingActivity {
  id: string;
  name: string;
  description: string;
  category: 'mental-health' | 'skill-development' | 'relationship' | 'therapy';
  duration: number; // in minutes
  cost: number; // training points
  requirements: string[];
  effects: TrainingEffect[];
  unlockLevel: number;
}

export interface TrainingEffect {
  type: 'psychology' | 'skill' | 'relationship' | 'stat';
  target: string; // character trait, skill, or relationship
  change: number;
  duration?: number; // temporary effects (in battles)
  description: string;
}

export interface TrainingSession {
  id: string;
  characterId: string;
  activityId: string;
  startTime: Date;
  duration: number;
  completed: boolean;
  results?: TrainingResult[];
}

export interface TrainingResult {
  type: string;
  before: number;
  after: number;
  improvement: number;
  description: string;
}

export interface CharacterTrainingState {
  characterId: string;
  trainingPoints: number;
  mentalHealth: number;
  stressLevel: number;
  focusLevel: number;
  trainingHistory: TrainingSession[];
  availableActivities: string[];
  completedSessions: number;
  specializations: string[];
}

// Training Activities Database
export const trainingActivities: TrainingActivity[] = [
  // Mental Health Recovery
  {
    id: 'meditation',
    name: 'Meditation & Mindfulness',
    description: 'Reduce stress and improve mental clarity through focused meditation practices.',
    category: 'mental-health',
    duration: 30,
    cost: 10,
    requirements: [],
    unlockLevel: 1,
    effects: [
      {
        type: 'psychology',
        target: 'stress',
        change: -15,
        description: 'Significantly reduces stress levels'
      },
      {
        type: 'psychology',
        target: 'focus',
        change: 10,
        description: 'Improves mental focus and clarity'
      }
    ]
  },
  {
    id: 'therapy-session',
    name: 'Psychological Therapy',
    description: 'Professional therapy session to address deep-rooted psychological issues.',
    category: 'therapy',
    duration: 60,
    cost: 25,
    requirements: ['high-stress'],
    unlockLevel: 2,
    effects: [
      {
        type: 'psychology',
        target: 'trauma',
        change: -20,
        description: 'Helps process and reduce trauma effects'
      },
      {
        type: 'psychology',
        target: 'emotional-stability',
        change: 15,
        description: 'Improves emotional regulation'
      }
    ]
  },
  {
    id: 'anger-management',
    name: 'Anger Management Workshop',
    description: 'Specialized training for characters with anger control issues.',
    category: 'therapy',
    duration: 45,
    cost: 20,
    requirements: ['anger-issues'],
    unlockLevel: 1,
    effects: [
      {
        type: 'psychology',
        target: 'rage-control',
        change: 25,
        description: 'Significantly improves anger management'
      },
      {
        type: 'psychology',
        target: 'patience',
        change: 15,
        description: 'Increases patience and tolerance'
      }
    ]
  },
  
  // Skill Development
  {
    id: 'tactical-training',
    name: 'Advanced Tactical Training',
    description: 'Improve battle strategy and tactical decision-making skills.',
    category: 'skill-development',
    duration: 90,
    cost: 30,
    requirements: [],
    unlockLevel: 1,
    effects: [
      {
        type: 'skill',
        target: 'tactics',
        change: 20,
        description: 'Enhances tactical thinking abilities'
      },
      {
        type: 'psychology',
        target: 'confidence',
        change: 10,
        description: 'Builds confidence in decision-making'
      }
    ]
  },
  {
    id: 'leadership-development',
    name: 'Leadership Development',
    description: 'Develop leadership skills and team management abilities.',
    category: 'skill-development',
    duration: 75,
    cost: 35,
    requirements: ['leadership-potential'],
    unlockLevel: 3,
    effects: [
      {
        type: 'skill',
        target: 'leadership',
        change: 30,
        description: 'Dramatically improves leadership capabilities'
      },
      {
        type: 'psychology',
        target: 'charisma',
        change: 15,
        description: 'Increases natural charisma and influence'
      }
    ]
  },
  
  // Relationship Building
  {
    id: 'team-bonding',
    name: 'Team Bonding Exercise',
    description: 'Structured activities to improve relationships with teammates.',
    category: 'relationship',
    duration: 60,
    cost: 15,
    requirements: ['team-conflict'],
    unlockLevel: 1,
    effects: [
      {
        type: 'relationship',
        target: 'all-teammates',
        change: 10,
        description: 'Improves relationships with all team members'
      },
      {
        type: 'psychology',
        target: 'social-skills',
        change: 8,
        description: 'Enhances social interaction abilities'
      }
    ]
  },
  {
    id: 'conflict-resolution',
    name: 'Conflict Resolution Training',
    description: 'Learn to mediate and resolve interpersonal conflicts.',
    category: 'relationship',
    duration: 45,
    cost: 18,
    requirements: [],
    unlockLevel: 2,
    effects: [
      {
        type: 'skill',
        target: 'diplomacy',
        change: 25,
        description: 'Significantly improves diplomatic skills'
      },
      {
        type: 'psychology',
        target: 'empathy',
        change: 12,
        description: 'Increases empathy and understanding'
      }
    ]
  },
  {
    id: 'trust-building',
    name: 'Trust Building Workshop',
    description: 'Exercises designed to build trust between team members.',
    category: 'relationship',
    duration: 90,
    cost: 22,
    requirements: ['trust-issues'],
    unlockLevel: 2,
    effects: [
      {
        type: 'psychology',
        target: 'trustworthiness',
        change: 20,
        description: 'Increases perceived trustworthiness'
      },
      {
        type: 'relationship',
        target: 'team-trust',
        change: 15,
        description: 'Builds stronger trust with team'
      }
    ]
  },

  // Specialized Therapy
  {
    id: 'trauma-therapy',
    name: 'Trauma Processing Therapy',
    description: 'Specialized therapy for characters dealing with battle trauma.',
    category: 'therapy',
    duration: 120,
    cost: 40,
    requirements: ['ptsd', 'battle-trauma'],
    unlockLevel: 3,
    effects: [
      {
        type: 'psychology',
        target: 'trauma',
        change: -30,
        description: 'Significantly reduces trauma symptoms'
      },
      {
        type: 'psychology',
        target: 'resilience',
        change: 20,
        description: 'Builds psychological resilience'
      }
    ]
  },
  {
    id: 'addiction-counseling',
    name: 'Addiction Counseling',
    description: 'Professional support for characters with addictive behaviors.',
    category: 'therapy',
    duration: 90,
    cost: 35,
    requirements: ['addiction-issues'],
    unlockLevel: 2,
    effects: [
      {
        type: 'psychology',
        target: 'addiction-resistance',
        change: 25,
        description: 'Improves resistance to addictive behaviors'
      },
      {
        type: 'psychology',
        target: 'self-control',
        change: 18,
        description: 'Enhances self-control and discipline'
      }
    ]
  }
];

export class TrainingSystemManager {
  private characterStates: Map<string, CharacterTrainingState> = new Map();
  private activeSessions: Map<string, TrainingSession> = new Map();

  constructor(savedData?: {
    characterStates?: Record<string, CharacterTrainingState>;
    activeSessions?: Record<string, TrainingSession>;
  }) {
    if (savedData) {
      this.loadFromSaveData(savedData);
    }
  }

  // Initialize character for training
  initializeCharacter(characterId: string): void {
    if (!this.characterStates.has(characterId)) {
      const state: CharacterTrainingState = {
        characterId,
        trainingPoints: 50, // Starting points
        mentalHealth: 100,
        stressLevel: 20,
        focusLevel: 80,
        trainingHistory: [],
        availableActivities: this.getAvailableActivities(characterId, 1),
        completedSessions: 0,
        specializations: []
      };
      this.characterStates.set(characterId, state);
    }
  }

  // Get available training activities for character
  getAvailableActivities(characterId: string, level: number): string[] {
    const character = this.getCharacterState(characterId);
    
    return trainingActivities
      .filter(activity => {
        // Check level requirement
        if (activity.unlockLevel > level) return false;
        
        // Check specific requirements
        return activity.requirements.every(req => 
          this.checkRequirement(characterId, req)
        );
      })
      .map(activity => activity.id);
  }

  // Start training session with usage tracking
  async startTraining(characterId: string, activityId: string, userId: string, gymTier: string = 'community'): Promise<TrainingSession | null> {
    try {
      // Use training API
      const response = await fetch('/api/training/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          characterId,
          activityId,
          userId,
          gymTier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start training');
      }

      const result = await response.json();
      
      if (result.usageLimitReached) {
        throw new Error('Daily training limit reached. Upgrade to premium or use a better gym for more training sessions!');
      }
      
      if (!result.session) {
        return null;
      }
      
      const character = this.getCharacterState(characterId);
      const activity = trainingActivities.find(a => a.id === activityId);
      
      if (!character || !activity) return null;
      
      // Check if character can afford the training
      if (character.trainingPoints < activity.cost) return null;
      
      // Check if character is already training
      if (this.activeSessions.has(characterId)) return null;
      
      // Deduct training points
      character.trainingPoints -= activity.cost;
      
      // Store session locally
      this.activeSessions.set(characterId, result.session);
      return result.session;
      
    } catch (error) {
      console.error('Training failed:', error);
      throw error;
    }
  }

  private getBaseLimit(subscriptionTier: string): number {
    switch (subscriptionTier) {
      case 'free': return 3;
      case 'premium': return 5;
      case 'legendary': return 10;
      default: return 3;
    }
  }

  private getGymBonus(gymTier: string): number {
    switch (gymTier) {
      case 'community': return 0;
      case 'bronze': return 2;
      case 'elite': return 5;
      case 'legendary': return 10;
      default: return 0;
    }
  }

  private getPerCharacterLimit(gymTier: string): number {
    switch (gymTier) {
      case 'community': return 2;
      case 'bronze': return 3;
      case 'elite': return 4;
      case 'legendary': return 5;
      default: return 2;
    }
  }

  private getCharacterUsageToday(characterId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const character = this.getCharacterState(characterId);
    if (!character) return 0;
    
    return character.trainingHistory.filter(session => 
      session.startTime.toISOString().split('T')[0] === today && session.completed
    ).length;
  }


  // Complete training session
  completeTraining(characterId: string): TrainingResult[] | null {
    const session = this.activeSessions.get(characterId);
    if (!session) return null;
    
    const character = this.getCharacterState(characterId);
    const activity = trainingActivities.find(a => a.id === session.activityId);
    
    if (!character || !activity) return null;
    
    const results: TrainingResult[] = [];
    
    // Apply training effects
    activity.effects.forEach(effect => {
      const before = this.getTraitValue(character, effect.target);
      const after = Math.max(0, Math.min(100, before + effect.change));
      
      this.applyTrainingEffect(character, effect);
      
      results.push({
        type: effect.type,
        before,
        after,
        improvement: after - before,
        description: effect.description
      });
    });
    
    // Update session
    session.completed = true;
    session.results = results;
    character.trainingHistory.push(session);
    character.completedSessions++;
    
    // Remove from active sessions
    this.activeSessions.delete(characterId);
    
    // Award bonus training points based on performance
    const bonus = Math.floor(results.reduce((sum, r) => sum + Math.abs(r.improvement), 0) / 10);
    character.trainingPoints += bonus;
    
    return results;
  }

  // Get character training state
  getCharacterState(characterId: string): CharacterTrainingState | null {
    return this.characterStates.get(characterId) || null;
  }

  // Get active training session
  getActiveSession(characterId: string): TrainingSession | null {
    return this.activeSessions.get(characterId) || null;
  }

  // Get training recommendations for character
  getRecommendations(characterId: string): TrainingActivity[] {
    const character = this.getCharacterState(characterId);
    if (!character) return [];
    
    const recommendations: TrainingActivity[] = [];
    
    // High stress - recommend stress reduction
    if (character.stressLevel > 70) {
      recommendations.push(...trainingActivities.filter(a => 
        a.effects.some(e => e.target === 'stress' && e.change < 0)
      ));
    }
    
    // Low mental health - recommend therapy
    if (character.mentalHealth < 60) {
      recommendations.push(...trainingActivities.filter(a => 
        a.category === 'therapy' || a.category === 'mental-health'
      ));
    }
    
    // Relationship issues - recommend social training
    const avgRelationship = this.getAverageRelationshipLevel(characterId);
    if (avgRelationship < 50) {
      recommendations.push(...trainingActivities.filter(a => 
        a.category === 'relationship'
      ));
    }
    
    return recommendations.slice(0, 3); // Top 3 recommendations
  }

  // Private helper methods
  private checkRequirement(characterId: string, requirement: string): boolean {
    const character = this.getCharacterState(characterId);
    if (!character) return false;
    
    switch (requirement) {
      case 'high-stress':
        return character.stressLevel > 70;
      case 'anger-issues':
        return this.hasAngerIssues(characterId);
      case 'leadership-potential':
        return this.hasLeadershipPotential(characterId);
      case 'team-conflict':
        return this.hasTeamConflict(characterId);
      case 'trust-issues':
        return this.hasTrustIssues(characterId);
      case 'ptsd':
      case 'battle-trauma':
        return this.hasBattleTrauma(characterId);
      case 'addiction-issues':
        return this.hasAddictionIssues(characterId);
      default:
        return false;
    }
  }

  private getTraitValue(character: CharacterTrainingState, trait: string): number {
    switch (trait) {
      case 'stress':
        return character.stressLevel;
      case 'focus':
        return character.focusLevel;
      case 'mental-health':
        return character.mentalHealth;
      default:
        return 50; // Default value
    }
  }

  private applyTrainingEffect(character: CharacterTrainingState, effect: TrainingEffect): void {
    switch (effect.target) {
      case 'stress':
        character.stressLevel = Math.max(0, Math.min(100, character.stressLevel + effect.change));
        break;
      case 'focus':
        character.focusLevel = Math.max(0, Math.min(100, character.focusLevel + effect.change));
        break;
      case 'mental-health':
        character.mentalHealth = Math.max(0, Math.min(100, character.mentalHealth + effect.change));
        // ALSO improve character's actual psychStats.mentalHealth
        this.updateCharacterPsychStats(character.characterId, 'mentalHealth', effect.change * 0.3);
        break;
      
      // Map training effects to character psychStats improvements
      case 'tactics':
      case 'strategy':
      case 'discipline':
        // Tactical training improves ability to follow instructions
        this.updateCharacterPsychStats(character.characterId, 'training', effect.change * 0.4);
        break;
      
      case 'leadership':
      case 'charisma':
      case 'communication':
        // Leadership training improves communication abilities
        this.updateCharacterPsychStats(character.characterId, 'communication', effect.change * 0.4);
        break;
      
      case 'social-skills':
      case 'empathy':
      case 'team-cooperation':
        // Social training improves teamwork
        this.updateCharacterPsychStats(character.characterId, 'teamPlayer', effect.change * 0.4);
        break;
      
      case 'confidence':
      case 'self-esteem':
        // Confidence training affects ego
        this.updateCharacterPsychStats(character.characterId, 'ego', effect.change * 0.3);
        break;
      
      case 'rage-control':
      case 'patience':
      case 'emotional-stability':
      case 'self-control':
        // Anger management improves mental health and reduces ego
        this.updateCharacterPsychStats(character.characterId, 'mentalHealth', effect.change * 0.4);
        this.updateCharacterPsychStats(character.characterId, 'ego', -effect.change * 0.2);
        break;
      
      case 'resilience':
      case 'trauma':
        // Trauma therapy and resilience training improve mental health
        this.updateCharacterPsychStats(character.characterId, 'mentalHealth', effect.change * 0.5);
        break;
      
      case 'team-trust':
      case 'trustworthiness':
        // Trust-building improves teamwork
        this.updateCharacterPsychStats(character.characterId, 'teamPlayer', effect.change * 0.4);
        break;
      
      case 'addiction-resistance':
        // Addiction counseling improves mental health and training discipline
        this.updateCharacterPsychStats(character.characterId, 'mentalHealth', effect.change * 0.3);
        this.updateCharacterPsychStats(character.characterId, 'training', effect.change * 0.2);
        break;
        
      // Add more trait handling as needed
    }
  }

  private hasAngerIssues(characterId: string): boolean {
    // Check character's psychology profile for anger issues
    return characterId === 'achilles' || characterId === 'thor';
  }

  /**
   * Updates the character's actual psychStats used in battle psychology
   * This is the critical connection between training and battle performance
   */
  private updateCharacterPsychStats(
    characterId: string, 
    statType: 'training' | 'teamPlayer' | 'ego' | 'mentalHealth' | 'communication',
    change: number
  ): void {
    // Only update if localStorage is available (browser environment)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log(`Training improvement skipped (SSR): ${characterId}'s ${statType} +${change.toFixed(1)}`);
      return;
    }

    // Find character in the character database
    const { createCharacter, characterTemplates } = require('../data/characters');
    const templateId = characterId.replace(/_.*$/, ''); // Remove instance suffix
    
    if (!characterTemplates[templateId]) {
      console.warn(`Character template ${templateId} not found for psychStats update`);
      return;
    }

    // In a real app, this would update persistent character data
    // For now, we'll track improvements and apply them during character creation
    const improvementKey = `${characterId}_${statType}_improvement`;
    const currentImprovement = parseFloat(localStorage.getItem(improvementKey) || '0');
    const newImprovement = Math.max(0, Math.min(30, currentImprovement + change)); // Cap at +30 improvement
    
    localStorage.setItem(improvementKey, newImprovement.toString());
    
    console.log(`Training improved ${characterId}'s ${statType} by ${change.toFixed(1)} (total: +${newImprovement.toFixed(1)})`);
  }

  private hasLeadershipPotential(characterId: string): boolean {
    return characterId === 'cleopatra' || characterId === 'achilles';
  }

  private hasTeamConflict(characterId: string): boolean {
    return this.getAverageRelationshipLevel(characterId) < 40;
  }

  private hasTrustIssues(characterId: string): boolean {
    return characterId === 'dracula' || this.getAverageRelationshipLevel(characterId) < 30;
  }

  private hasBattleTrauma(characterId: string): boolean {
    return characterId === 'achilles'; // Achilles has PTSD from Trojan War
  }

  private hasAddictionIssues(characterId: string): boolean {
    return characterId === 'sherlock-holmes'; // Holmes has cocaine addiction
  }

  private getAverageRelationshipLevel(characterId: string): number {
    // Simplified - would integrate with relationship system
    return 50;
  }

  // Save/Load functionality
  private loadFromSaveData(data: {
    characterStates?: Record<string, CharacterTrainingState>;
    activeSessions?: Record<string, TrainingSession>;
  }): void {
    if (data.characterStates) {
      this.characterStates = new Map(Object.entries(data.characterStates));
    }
    if (data.activeSessions) {
      this.activeSessions = new Map(Object.entries(data.activeSessions));
    }
  }

  saveProgress(): {
    characterStates: Record<string, CharacterTrainingState>;
    activeSessions: Record<string, TrainingSession>;
  } {
    return {
      characterStates: Object.fromEntries(this.characterStates),
      activeSessions: Object.fromEntries(this.activeSessions)
    };
  }

  static loadProgress(): TrainingSystemManager {
    const saved = localStorage.getItem('training-system');
    const data = saved ? JSON.parse(saved) : {};
    return new TrainingSystemManager(data);
  }

  saveToStorage(): void {
    localStorage.setItem('training-system', JSON.stringify(this.saveProgress()));
  }
}
import { usageTrackingService } from './usageTrackingService';

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
  }
];

export class TrainingService {
  /**
   * Start training session with usage tracking
   */
  async startTraining(
    characterId: string,
    activityId: string,
    userId: string,
    gymTier: string = 'community',
    db: any
  ): Promise<{ session: TrainingSession | null; usageLimitReached?: boolean }> {
    try {
      // Check usage limits with gym bonuses (following aiChatService pattern)
      const canTrain = await usageTrackingService.trackTrainingUsage(userId, db, gymTier);
      if (!canTrain) {
        return {
          session: null,
          usageLimitReached: true
        };
      }

      const activity = trainingActivities.find(a => a.id === activityId);
      if (!activity) {
        return { session: null };
      }

      // Create training session
      const session: TrainingSession = {
        id: `${characterId}-${activityId}-${Date.now()}`,
        characterId,
        activityId,
        startTime: new Date(),
        duration: activity.duration,
        completed: false
      };

      return { session };
    } catch (error) {
      console.error('Training service error:', error);
      throw new Error(`Training failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Complete training session and apply effects
   */
  async completeTraining(
    sessionId: string,
    characterId: string,
    gymTier: string = 'community'
  ): Promise<TrainingResult[]> {
    // Implementation would go here following the existing training completion logic
    return [];
  }

  /**
   * Get available training activities for character
   */
  getAvailableActivities(characterLevel: number, characterRequirements: string[]): TrainingActivity[] {
    return trainingActivities.filter(activity => {
      // Check level requirement
      if (activity.unlockLevel > characterLevel) return false;
      
      // Check specific requirements
      return activity.requirements.every(req => 
        characterRequirements.includes(req)
      );
    });
  }

  /**
   * Calculate training limits with gym bonuses
   */
  getTrainingLimitsWithGymBonus(subscriptionTier: string, gymTier: string): number {
    const baseLimits = {
      free: 3,
      premium: 5,
      legendary: 10
    };

    const gymBonuses = {
      community: 0,
      bronze: 2,
      elite: 5,
      legendary: 10
    };

    const baseLimit = baseLimits[subscriptionTier as keyof typeof baseLimits] || 3;
    const gymBonus = gymBonuses[gymTier as keyof typeof gymBonuses] || 0;

    return baseLimit + gymBonus;
  }
}

// Export singleton instance
export const trainingService = new TrainingService();
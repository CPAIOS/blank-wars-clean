/**
 * Campaign Progression System
 * Manages character unlocks, story progression, and psychology tutorial integration
 * Part of the revolutionary _____ WARS psychology-based battle system
 */

import { Character } from '../data/characters';
import { characters } from '../data/characters';

export interface UnlockRequirement {
  type: 'battle' | 'psychology' | 'relationship' | 'story';
  description: string;
  requirement: Record<string, unknown>;
}

export interface CharacterUnlock {
  characterId: string;
  chapter: number;
  unlockRequirements: UnlockRequirement[];
  storyContext: string;
  psychologyIntroduction: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface CampaignChapter {
  id: string;
  title: string;
  description: string;
  psychologyFocus: string[];
  availableCharacters: string[];
  requiredCharacters: string[];
  objectives: string[];
  unlockRequirements: UnlockRequirement[];
  completed: boolean;
}

export interface CoachingProgress {
  currentChapter: number;
  unlockedCharacters: string[];
  completedChapters: string[];
  psychologyMasteryLevels: Record<string, number>;
  totalBattlesWon: number;
  totalCoachingActions: number;
  relationshipMilestones: Record<string, number>;
}

// Campaign Structure - Progressive Psychology Mastery
export const campaignChapters: CampaignChapter[] = [
  {
    id: 'chapter-1',
    title: 'The Forest Outlaw',
    description: 'Learn the basics of AI psychology management with Robin Hood, your clever companion',
    psychologyFocus: ['basic-psychology', 'morale-management'],
    availableCharacters: ['robin_hood'],
    requiredCharacters: ['robin_hood'],
    objectives: [
      'Complete tutorial battle with Robin Hood',
      'Successfully coach Robin Hood through one strategic decision',
      'Win a battle while maintaining team morale above 70%'
    ],
    unlockRequirements: [],
    completed: false
  },
  {
    id: 'chapter-2',
    title: 'The Mind Detective',
    description: 'Master analytical psychology with Sherlock Holmes',
    psychologyFocus: ['analytical-thinking', 'stress-management'],
    availableCharacters: ['achilles', 'sherlock-holmes'],
    requiredCharacters: ['sherlock-holmes'],
    objectives: [
      'Unlock Sherlock Holmes through investigation challenge',
      'Use Holmes\' analytical abilities to solve team conflicts',
      'Win 3 battles using psychological analysis'
    ],
    unlockRequirements: [
      {
        type: 'psychology',
        description: 'Demonstrate basic psychology mastery',
        requirement: { battlesWithHighMorale: 2 }
      }
    ],
    completed: false
  },
  {
    id: 'chapter-3',
    title: 'The Dark Arts',
    description: 'Navigate complex personality disorders with Dracula',
    psychologyFocus: ['personality-disorders', 'manipulation-resistance'],
    availableCharacters: ['achilles', 'sherlock-holmes', 'dracula'],
    requiredCharacters: ['dracula'],
    objectives: [
      'Successfully manage Dracula\'s manipulative tendencies',
      'Prevent team members from being psychologically influenced',
      'Win a battle with Dracula while maintaining team trust'
    ],
    unlockRequirements: [
      {
        type: 'relationship',
        description: 'Build strong relationships to resist manipulation',
        requirement: { averageRelationshipLevel: 60 }
      }
    ],
    completed: false
  },
  {
    id: 'chapter-4',
    title: 'Divine Fury',
    description: 'Channel divine psychology with Thor\'s lightning powers',
    psychologyFocus: ['divine-psychology', 'power-management'],
    availableCharacters: ['achilles', 'sherlock-holmes', 'dracula', 'thor'],
    requiredCharacters: ['thor'],
    objectives: [
      'Manage Thor\'s godly pride and anger',
      'Balance divine power with team cooperation',
      'Win battles using coordinated divine abilities'
    ],
    unlockRequirements: [
      {
        type: 'psychology',
        description: 'Master complex personality management',
        requirement: { successfulCoachingActions: 10 }
      }
    ],
    completed: false
  },
  {
    id: 'chapter-5',
    title: 'The Queen\'s Gambit',
    description: 'Master strategic psychology with Cleopatra',
    psychologyFocus: ['leadership-psychology', 'political-manipulation'],
    availableCharacters: ['achilles', 'sherlock-holmes', 'dracula', 'thor', 'cleopatra'],
    requiredCharacters: ['cleopatra'],
    objectives: [
      'Navigate Cleopatra\'s political manipulations',
      'Use royal authority to manage team dynamics',
      'Win strategic battles through psychological warfare'
    ],
    unlockRequirements: [
      {
        type: 'story',
        description: 'Complete previous chapters with high psychology scores',
        requirement: { averagePsychologyScore: 80 }
      }
    ],
    completed: false
  }
];

// Character Unlock Progression
export const characterUnlocks: CharacterUnlock[] = [
  {
    characterId: 'achilles',
    chapter: 1,
    unlockRequirements: [],
    storyContext: 'The legendary warrior Achilles awakens, but his rage burns uncontrolled. Can you coach him to channel his fury into victory?',
    psychologyIntroduction: 'Achilles suffers from anger management issues and pride. Learning to manage his psychology is crucial for team success.',
    unlocked: true
  },
  {
    characterId: 'sherlock-holmes',
    chapter: 2,
    unlockRequirements: [
      {
        type: 'psychology',
        description: 'Successfully manage Achilles\' rage in 2 battles',
        requirement: { character: 'achilles', successfulRageManagement: 2 }
      }
    ],
    storyContext: 'The brilliant detective Holmes notices your psychological insights. Solve his investigation challenge to earn his respect.',
    psychologyIntroduction: 'Holmes is highly analytical but can become obsessive. His deductive abilities are powerful but require careful psychological balance.',
    unlocked: false
  },
  {
    characterId: 'dracula',
    chapter: 3,
    unlockRequirements: [
      {
        type: 'relationship',
        description: 'Build strong team relationships to resist manipulation',
        requirement: { averageTeamTrust: 70 }
      }
    ],
    storyContext: 'Count Dracula emerges from the shadows, drawn to your growing power. His dark psychology will test your coaching skills.',
    psychologyIntroduction: 'Dracula is manipulative and feeds on psychological weakness. Managing him requires strong team bonds and constant vigilance.',
    unlocked: false
  },
  {
    characterId: 'thor',
    chapter: 4,
    unlockRequirements: [
      {
        type: 'psychology',
        description: 'Demonstrate mastery over complex personalities',
        requirement: { managedPersonalityDisorders: 1 }
      }
    ],
    storyContext: 'The God of Thunder is impressed by your psychological prowess. Prove worthy by managing divine psychology.',
    psychologyIntroduction: 'Thor has godly pride and divine anger. His immense power requires equally strong psychological management.',
    unlocked: false
  },
  {
    characterId: 'cleopatra',
    chapter: 5,
    unlockRequirements: [
      {
        type: 'story',
        description: 'Master the psychological challenges of previous chapters',
        requirement: { completedChapters: 4, avgPsychologyScore: 75 }
      }
    ],
    storyContext: 'The Queen of Egypt recognizes your strategic mind. Navigate her political psychology to gain her allegiance.',
    psychologyIntroduction: 'Cleopatra is a master manipulator and political strategist. Her psychology is layered with royal authority and feminine cunning.',
    unlocked: false
  }
];

export class CampaignProgressionManager {
  private progress: CoachingProgress;

  constructor(savedProgress?: Partial<CoachingProgress>) {
    this.progress = {
      currentChapter: 1,
      unlockedCharacters: ['robin_hood'],
      completedChapters: [],
      psychologyMasteryLevels: {},
      totalBattlesWon: 0,
      totalCoachingActions: 0,
      relationshipMilestones: {},
      ...savedProgress
    };
  }

  // Check if character can be unlocked
  canUnlockCharacter(characterId: string): boolean {
    const unlock = characterUnlocks.find(u => u.characterId === characterId);
    if (!unlock || unlock.unlocked) return false;

    return unlock.unlockRequirements.every(req => this.checkRequirement(req));
  }

  // Unlock a character
  unlockCharacter(characterId: string): boolean {
    if (!this.canUnlockCharacter(characterId)) return false;

    const unlock = characterUnlocks.find(u => u.characterId === characterId);
    if (unlock) {
      unlock.unlocked = true;
      unlock.unlockedAt = new Date();
      this.progress.unlockedCharacters.push(characterId);
      return true;
    }
    return false;
  }

  // Check if chapter can be unlocked
  canUnlockChapter(chapterId: string): boolean {
    const chapter = campaignChapters.find(c => c.id === chapterId);
    if (!chapter) return false;

    return chapter.unlockRequirements.every(req => this.checkRequirement(req));
  }

  // Complete chapter
  completeChapter(chapterId: string): boolean {
    const chapter = campaignChapters.find(c => c.id === chapterId);
    if (!chapter) return false;

    const allObjectivesMet = chapter.objectives.every(objective => 
      this.checkObjectiveCompletion(objective)
    );

    if (allObjectivesMet) {
      chapter.completed = true;
      this.progress.completedChapters.push(chapterId);
      this.progress.currentChapter = Math.max(this.progress.currentChapter, chapter.id === 'chapter-5' ? 5 : parseInt(chapter.id.split('-')[1]) + 1);
      return true;
    }
    return false;
  }

  // Check requirement fulfillment
  private checkRequirement(requirement: UnlockRequirement): boolean {
    switch (requirement.type) {
      case 'psychology':
        return this.checkPsychologyRequirement(requirement.requirement);
      case 'relationship':
        return this.checkRelationshipRequirement(requirement.requirement);
      case 'battle':
        return this.checkBattleRequirement(requirement.requirement);
      case 'story':
        return this.checkStoryRequirement(requirement.requirement);
      default:
        return false;
    }
  }

  private checkPsychologyRequirement(req: { character: string; trait: string; minimumValue: number }): boolean {
    if (req.battlesWithHighMorale) {
      return this.progress.totalBattlesWon >= req.battlesWithHighMorale;
    }
    if (req.successfulCoachingActions) {
      return this.progress.totalCoachingActions >= req.successfulCoachingActions;
    }
    if (req.averagePsychologyScore) {
      const avgScore = Object.values(this.progress.psychologyMasteryLevels)
        .reduce((sum, level) => sum + level, 0) / Object.keys(this.progress.psychologyMasteryLevels).length;
      return avgScore >= req.averagePsychologyScore;
    }
    return false;
  }

  private checkRelationshipRequirement(req: { character1: string; character2: string; minimumStrength: number }): boolean {
    if (req.averageTeamTrust || req.averageRelationshipLevel) {
      const target = req.averageTeamTrust || req.averageRelationshipLevel;
      const avgRelationship = Object.values(this.progress.relationshipMilestones)
        .reduce((sum, level) => sum + level, 0) / Math.max(1, Object.keys(this.progress.relationshipMilestones).length);
      return avgRelationship >= target;
    }
    return false;
  }

  private checkBattleRequirement(req: { battleType: string; minimumRating?: number; outcome?: string }): boolean {
    if (req.battlesWon) {
      return this.progress.totalBattlesWon >= req.battlesWon;
    }
    return false;
  }

  private checkStoryRequirement(req: { storyId: string; completed: boolean }): boolean {
    if (req.completedChapters) {
      return this.progress.completedChapters.length >= req.completedChapters;
    }
    if (req.avgPsychologyScore) {
      const avgScore = Object.values(this.progress.psychologyMasteryLevels)
        .reduce((sum, level) => sum + level, 0) / Object.keys(this.progress.psychologyMasteryLevels).length;
      return avgScore >= req.avgPsychologyScore;
    }
    return false;
  }

  private checkObjectiveCompletion(objective: string): boolean {
    // Check objective completion based on player progress
    switch (objective) {
      case 'first_victory':
        return this.progress.totalBattlesWon > 0;
      case 'coaching_master':
        return this.progress.totalCoachingActions >= 10;
      case 'psychology_expert':
        return this.progress.charactersCoached >= 5;
      case 'team_builder':
        return this.progress.totalBattlesWon >= 3;
      case 'relationship_guru':
        return this.progress.totalCoachingActions >= 20;
      default:
        // For unknown objectives, check if the player has made significant progress
        return this.progress.totalBattlesWon >= 2 && this.progress.totalCoachingActions >= 5;
    }
  }

  // Update progress
  updateProgress(update: Partial<CoachingProgress>): void {
    this.progress = { ...this.progress, ...update };
  }

  // Get available characters for current chapter
  getAvailableCharacters(): Character[] {
    return characters.filter(char => 
      this.progress.unlockedCharacters.includes(char.id)
    );
  }

  // Get current chapter info
  getCurrentChapter(): CampaignChapter | null {
    return campaignChapters.find(c => c.id === `chapter-${this.progress.currentChapter}`) || null;
  }

  // Get unlockable characters
  getUnlockableCharacters(): CharacterUnlock[] {
    return characterUnlocks.filter(unlock => 
      !unlock.unlocked && this.canUnlockCharacter(unlock.characterId)
    );
  }

  // Get progress data
  getProgress(): CoachingProgress {
    return { ...this.progress };
  }

  // Save progress (would integrate with actual save system)
  saveProgress(): void {
    localStorage.setItem('campaign-progress', JSON.stringify(this.progress));
  }

  // Load progress
  static loadProgress(): CampaignProgressionManager {
    const saved = localStorage.getItem('campaign-progress');
    const progress = saved ? JSON.parse(saved) : {};
    return new CampaignProgressionManager(progress);
  }
}
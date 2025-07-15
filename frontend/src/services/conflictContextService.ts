// Service for generating kitchen table conflict context for AI chat
// Integrates with therapy system data to provide realistic living situations

import { ConflictData, TherapyContext } from './ConflictDatabaseService';
import ConflictDatabaseService from './ConflictDatabaseService';

export interface LivingContext {
  housingTier: string;
  currentOccupancy: number;
  roomCapacity: number;
  roommates: Array<{
    id: string;
    name: string;
    relationship: 'ally' | 'rival' | 'neutral' | 'enemy';
  }>;
  teamChemistry: number;
  leagueRanking: number;
  activeConflicts: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    involvedCharacters: string[];
  }>;
  recentEvents?: Array<{
    type: 'conflict' | 'resolution' | 'tension';
    description: string;
    timestamp: Date;
  }>;
  // New headquarters theme effects
  roomThemeEffects?: {
    currentTheme: string | null;
    moodBonus: number;
    energyBonus: number;
    comfortLevel: 'cramped' | 'basic' | 'comfortable' | 'luxurious';
    themeCompatibility: boolean;
  };
}

class ConflictContextService {
  private static instance: ConflictContextService;
  private conflictService: ConflictDatabaseService;

  constructor() {
    this.conflictService = ConflictDatabaseService.getInstance();
  }

  static getInstance(): ConflictContextService {
    if (!ConflictContextService.instance) {
      ConflictContextService.instance = new ConflictContextService();
    }
    return ConflictContextService.instance;
  }

  /**
   * Generate living context for a character using therapy system data
   */
  async generateLivingContext(characterId: string): Promise<LivingContext> {
    try {
      // Get therapy context which includes conflict data
      const therapyContext = await this.conflictService.getTherapyContextForCharacter(characterId);
      
      // Transform therapy context into living context format
      const livingContext: LivingContext = {
        housingTier: therapyContext.housingTier,
        currentOccupancy: therapyContext.currentOccupancy,
        roomCapacity: therapyContext.roomCapacity,
        teamChemistry: therapyContext.teamChemistry,
        leagueRanking: therapyContext.leagueRanking,
        roommates: therapyContext.roommates.map(roommate => ({
          id: roommate.id,
          name: roommate.name,
          relationship: this.determineRelationship(roommate.conflictLevel || 0)
        })),
        activeConflicts: therapyContext.activeConflicts.map(conflict => ({
          category: conflict.category,
          severity: conflict.severity,
          description: conflict.description,
          involvedCharacters: conflict.involvedCharacters || []
        })),
        recentEvents: this.generateRecentEvents(therapyContext.activeConflicts),
        roomThemeEffects: await this.calculateRoomThemeEffects(characterId, therapyContext.housingTier)
      };

      return livingContext;
    } catch (error) {
      console.error('Error generating living context:', error);
      // Return fallback context
      return this.getFallbackLivingContext(characterId);
    }
  }

  /**
   * Calculate room theme effects on character mood and energy
   */
  private async calculateRoomThemeEffects(characterId: string, housingTier: string): Promise<{
    currentTheme: string | null;
    moodBonus: number;
    energyBonus: number;
    comfortLevel: 'cramped' | 'basic' | 'comfortable' | 'luxurious';
    themeCompatibility: boolean;
  }> {
    // Simulate getting headquarters data (in real implementation, would fetch from API)
    const simulatedHeadquarters = this.getSimulatedHeadquartersData(characterId);
    
    // Determine comfort level based on housing tier
    const comfortLevels = {
      'spartan_apartment': 'cramped' as const,
      'basic_house': 'basic' as const,
      'team_mansion': 'comfortable' as const,
      'elite_compound': 'luxurious' as const
    };
    
    const comfortLevel = comfortLevels[housingTier] || 'basic';
    
    // Base mood/energy based on comfort level
    const comfortBonuses = {
      'cramped': { mood: -15, energy: -20 },
      'basic': { mood: 0, energy: 0 },
      'comfortable': { mood: 20, energy: 15 },
      'luxurious': { mood: 35, energy: 30 }
    };
    
    let moodBonus = comfortBonuses[comfortLevel].mood;
    let energyBonus = comfortBonuses[comfortLevel].energy;
    let currentTheme: string | null = null;
    let themeCompatibility = false;
    
    // Add room theme bonuses
    if (simulatedHeadquarters.assignedRoom?.theme) {
      currentTheme = simulatedHeadquarters.assignedRoom.theme;
      
      // Check if character is compatible with theme
      const compatibleThemes = this.getCompatibleThemes(characterId);
      themeCompatibility = compatibleThemes.includes(currentTheme);
      
      if (themeCompatibility) {
        moodBonus += 25; // Compatible theme gives significant mood boost
        energyBonus += 20;
      } else {
        moodBonus -= 10; // Incompatible theme causes some stress
        energyBonus -= 5;
      }
    }
    
    return {
      currentTheme,
      moodBonus,
      energyBonus,
      comfortLevel,
      themeCompatibility
    };
  }

  /**
   * Get compatible room themes for a character
   */
  private getCompatibleThemes(characterId: string): string[] {
    const themeCompatibility = {
      'achilles': ['medieval', 'spartan'],
      'joan': ['medieval', 'victorian'],
      'dracula': ['gothic', 'mystical'],
      'frankenstein_monster': ['gothic', 'mystical'],
      'holmes': ['victorian', 'modern'],
      'cleopatra': ['egyptian', 'luxurious'],
      'tesla': ['mystical', 'modern'],
      'robin_hood': ['medieval', 'saloon'],
      'space_cyborg': ['mystical', 'modern']
    };
    
    return themeCompatibility[characterId] || ['basic'];
  }

  /**
   * Simulate headquarters data (placeholder for real integration)
   */
  private getSimulatedHeadquartersData(characterId: string): {
    assignedRoom: { theme: string | null } | null;
  } {
    // This would be replaced with actual API call to headquarters service
    const simulatedData = {
      'achilles': { assignedRoom: { theme: 'medieval' } },
      'joan': { assignedRoom: { theme: 'medieval' } },
      'dracula': { assignedRoom: { theme: 'gothic' } },
      'holmes': { assignedRoom: { theme: 'victorian' } },
      'cleopatra': { assignedRoom: { theme: 'egyptian' } }
    };
    
    return simulatedData[characterId] || { assignedRoom: null };
  }

  /**
   * Determine relationship type based on conflict level
   */
  private determineRelationship(conflictLevel: number): 'ally' | 'rival' | 'neutral' | 'enemy' {
    if (conflictLevel >= 80) return 'enemy';
    if (conflictLevel >= 60) return 'rival';
    if (conflictLevel >= 30) return 'neutral';
    return 'ally';
  }

  /**
   * Generate recent events based on active conflicts
   */
  private generateRecentEvents(conflicts: ConflictData[]): Array<{
    type: 'conflict' | 'resolution' | 'tension';
    description: string;
    timestamp: Date;
  }> {
    const events: Array<{
      type: 'conflict' | 'resolution' | 'tension';
      description: string;
      timestamp: Date;
    }> = [];

    // Generate events from conflicts
    conflicts.slice(0, 3).forEach((conflict, index) => {
      const daysAgo = Math.random() * 7; // Events within last week
      const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      let eventType: 'conflict' | 'resolution' | 'tension';
      let description: string;

      if (conflict.severity === 'critical' || conflict.severity === 'high') {
        eventType = 'conflict';
        description = this.generateConflictEventDescription(conflict);
      } else if (Math.random() > 0.7) {
        eventType = 'resolution';
        description = this.generateResolutionEventDescription(conflict);
      } else {
        eventType = 'tension';
        description = this.generateTensionEventDescription(conflict);
      }

      events.push({ type: eventType, description, timestamp });
    });

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate conflict event descriptions
   */
  private generateConflictEventDescription(conflict: ConflictData): string {
    const conflictDescriptions: Record<string, string[]> = {
      kitchen_disputes: [
        "Heated argument over someone leaving dirty dishes for three days",
        "Shouting match about who ate the last of someone's labeled food",
        "Major fight over kitchen cleaning responsibilities"
      ],
      sleeping_arrangements: [
        "Loud argument about snoring disrupting everyone's sleep",
        "Conflict over bedroom temperature and window preferences",
        "Dispute about overnight guests and noise levels"
      ],
      bathroom_schedule: [
        "Tense confrontation about excessive shower time during peak hours",
        "Argument over bathroom cleanliness and hair in the drain",
        "Conflict about personal items taking up all the counter space"
      ],
      common_areas: [
        "Major disagreement about living room furniture arrangement",
        "Heated debate over TV show choices during shared viewing time",
        "Argument about workout equipment left in common areas"
      ],
      personal_space: [
        "Confrontation about respecting personal belongings and boundaries",
        "Argument over noise levels during training and personal time",
        "Dispute about privacy and knocking before entering rooms"
      ]
    };

    const descriptions = conflictDescriptions[conflict.category] || [
      `Significant disagreement about ${conflict.category.replace('_', ' ')}`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * Generate resolution event descriptions
   */
  private generateResolutionEventDescription(conflict: ConflictData): string {
    const resolutionDescriptions: Record<string, string[]> = {
      kitchen_disputes: [
        "Successful house meeting established new kitchen cleaning schedule",
        "Compromise reached on food labeling and refrigerator space",
        "Agreement made on shared meal preparation and cleanup duties"
      ],
      sleeping_arrangements: [
        "Worked out sleeping arrangements and quiet hours that everyone can live with",
        "Found solution for room temperature issues with fans and blankets",
        "Established guest policies that respect everyone's sleep schedule"
      ],
      bathroom_schedule: [
        "Created bathroom schedule that works for everyone's training routine",
        "Agreed on cleaning responsibilities and personal space boundaries",
        "Set up morning routine timing that reduces conflicts"
      ]
    };

    const descriptions = resolutionDescriptions[conflict.category] || [
      `Reached understanding about ${conflict.category.replace('_', ' ')} issues`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * Generate tension event descriptions
   */
  private generateTensionEventDescription(conflict: ConflictData): string {
    const tensionDescriptions: Record<string, string[]> = {
      kitchen_disputes: [
        "Awkward silence during breakfast after yesterday's kitchen argument",
        "Passive-aggressive note left about dirty dishes in the sink",
        "Tension over someone finishing the coffee without making more"
      ],
      sleeping_arrangements: [
        "Uncomfortable conversation about sleep schedule differences",
        "Subtle tension over thermostat settings at bedtime",
        "Awkward moment when discussing overnight training partners"
      ],
      bathroom_schedule: [
        "Mild frustration expressed about bathroom availability during peak times",
        "Tense exchange about bathroom tidiness after morning routines",
        "Slight irritation over hot water usage during consecutive showers"
      ]
    };

    const descriptions = tensionDescriptions[conflict.category] || [
      `Underlying tension about ${conflict.category.replace('_', ' ')} continues`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * Get fallback living context when therapy data isn't available
   */
  private getFallbackLivingContext(characterId: string): LivingContext {
    // Generate realistic fallback data
    const commonRoommates = ['achilles', 'joan', 'holmes', 'dracula', 'sun_wukong'];
    const roommates = commonRoommates
      .filter(id => id !== characterId)
      .slice(0, 2 + Math.floor(Math.random() * 2))
      .map(id => ({
        id,
        name: this.getCharacterDisplayName(id),
        relationship: (['ally', 'rival', 'neutral'] as const)[Math.floor(Math.random() * 3)]
      }));

    const fallbackConflicts = this.generateFallbackConflicts();

    return {
      housingTier: 'standard',
      currentOccupancy: 4,
      roomCapacity: 3,
      teamChemistry: 60 + Math.floor(Math.random() * 30),
      leagueRanking: 15 + Math.floor(Math.random() * 20),
      roommates,
      activeConflicts: fallbackConflicts,
      recentEvents: this.generateRecentEvents(fallbackConflicts.map(c => ({
        ...c,
        category: c.category,
        severity: c.severity,
        description: c.description,
        id: `fallback_${Date.now()}`,
        startDate: new Date(),
        priority: 1,
        tags: []
      })))
    };
  }

  /**
   * Generate fallback conflicts when therapy data isn't available
   */
  private generateFallbackConflicts() {
    const possibleConflicts = [
      {
        category: 'kitchen_disputes',
        severity: 'medium' as const,
        description: 'Ongoing disagreements about kitchen cleanup responsibilities and dirty dishes',
        involvedCharacters: ['achilles', 'joan']
      },
      {
        category: 'sleeping_arrangements',
        severity: 'low' as const,
        description: 'Tension over different sleep schedules affecting training routines',
        involvedCharacters: ['holmes', 'dracula']
      },
      {
        category: 'bathroom_schedule',
        severity: 'high' as const,
        description: 'Conflicts over bathroom time during peak morning training hours',
        involvedCharacters: ['sun_wukong', 'achilles', 'joan']
      }
    ];

    // Return 1-2 random conflicts
    const numConflicts = 1 + Math.floor(Math.random() * 2);
    return possibleConflicts.slice(0, numConflicts);
  }

  /**
   * Get display name for character ID
   */
  private getCharacterDisplayName(characterId: string): string {
    const nameMap: Record<string, string> = {
      'achilles': 'Achilles',
      'joan': 'Joan of Arc',
      'holmes': 'Sherlock Holmes',
      'dracula': 'Dracula',
      'sun_wukong': 'Sun Wukong',
      'cleopatra': 'Cleopatra',
      'tesla': 'Nikola Tesla',
      'merlin': 'Merlin'
    };
    
    return nameMap[characterId] || characterId.charAt(0).toUpperCase() + characterId.slice(1);
  }
}

export default ConflictContextService;
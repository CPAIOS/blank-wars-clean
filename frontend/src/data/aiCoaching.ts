// AI Coaching System
// Intelligent training recommendations and optimization strategies

import { Character } from './characters';
import { CharacterSkills } from './characterProgression';
import { getAvailableInteractions } from './skillInteractions';

export type CoachingCategory = 
  | 'skill_balance' | 'interaction_unlock' | 'efficiency' | 'synergy' 
  | 'progression' | 'resource_management' | 'specialization' | 'weakness';

export type CoachingPriority = 'low' | 'medium' | 'high' | 'critical';

export interface CoachingTip {
  id: string;
  category: CoachingCategory;
  priority: CoachingPriority;
  title: string;
  description: string;
  reasoning: string;
  actionItems: string[];
  expectedBenefits: string[];
  estimatedTimeToResult: string;
  resourceCost?: {
    coins?: number;
    gems?: number;
    energy?: number;
    time?: number; // in minutes
  };
  prerequisiteLevel?: number;
  targetSkills?: string[];
  warningFlags?: string[];
  confidence: number; // 0-100, AI confidence in recommendation
}

export interface CoachingSession {
  characterId: string;
  sessionId: string;
  timestamp: Date;
  characterLevel: number;
  tips: CoachingTip[];
  playerGoals: string[];
  sessionFocus: 'balanced' | 'combat' | 'social' | 'magic' | 'survival';
  adaptiveInsights: string[];
}

export interface CoachingProfile {
  characterId: string;
  playerStyle: 'aggressive' | 'defensive' | 'balanced' | 'experimental';
  learningHistory: {
    followedTips: string[];
    ignoredTips: string[];
    successfulOutcomes: string[];
    strugglingAreas: string[];
  };
  preferences: {
    tipFrequency: 'minimal' | 'moderate' | 'frequent';
    detailLevel: 'basic' | 'detailed' | 'expert';
    focusAreas: CoachingCategory[];
  };
  lastUpdated: Date;
}

// AI Coaching Engine
export class AICoach {
  static generateCoachingSession(
    character: Character,
    playerGoals: string[] = [],
    sessionFocus: CoachingSession['sessionFocus'] = 'balanced'
  ): CoachingSession {
    const tips: CoachingTip[] = [];
    
    // Analyze character current state
    const skillAnalysis = this.analyzeSkillDistribution(character.skills);
    const interactionAnalysis = this.analyzeAvailableInteractions(character);
    const progressionAnalysis = this.analyzeProgressionEfficiency(character);
    
    // Generate skill balance recommendations
    tips.push(...this.generateSkillBalanceTips(character, skillAnalysis));
    
    // Generate interaction unlock recommendations
    tips.push(...this.generateInteractionTips(character, interactionAnalysis));
    
    // Generate efficiency recommendations
    tips.push(...this.generateEfficiencyTips(character, progressionAnalysis));
    
    // Generate specialization recommendations
    tips.push(...this.generateSpecializationTips(character, sessionFocus));
    
    // Generate resource management tips
    tips.push(...this.generateResourceTips(character));
    
    // Sort tips by priority and relevance
    const prioritizedTips = this.prioritizeTips(tips, sessionFocus);
    
    return {
      characterId: character.id,
      sessionId: `coaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      characterLevel: character.level,
      tips: prioritizedTips.slice(0, 6), // Limit to top 6 recommendations
      playerGoals,
      sessionFocus,
      adaptiveInsights: this.generateAdaptiveInsights(character, prioritizedTips)
    };
  }

  private static analyzeSkillDistribution(skills: CharacterSkills): {
    mostDeveloped: string;
    leastDeveloped: string;
    averageLevel: number;
    imbalanceScore: number;
    gapAnalysis: { skill: string; gap: number }[];
  } {
    const coreSkillLevels = Object.entries(skills.coreSkills).map(([skill, data]) => ({
      skill,
      level: data.level
    }));
    
    const levels = coreSkillLevels.map(s => s.level);
    const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
    const maxLevel = Math.max(...levels);
    const minLevel = Math.min(...levels);
    
    const mostDeveloped = coreSkillLevels.find(s => s.level === maxLevel)?.skill || '';
    const leastDeveloped = coreSkillLevels.find(s => s.level === minLevel)?.skill || '';
    
    const imbalanceScore = maxLevel - minLevel;
    const gapAnalysis = coreSkillLevels.map(s => ({
      skill: s.skill,
      gap: averageLevel - s.level
    }));
    
    return {
      mostDeveloped,
      leastDeveloped,
      averageLevel,
      imbalanceScore,
      gapAnalysis
    };
  }

  private static analyzeAvailableInteractions(character: Character): {
    currentCount: number;
    nearUnlocks: { interaction: string; missingLevels: number }[];
    highValueTargets: string[];
  } {
    const availableInteractions = getAvailableInteractions(
      character.id.split('_')[0],
      character.archetype,
      character.skills.coreSkills,
      character.skills.signatureSkills
    );
    
    // Analyze near-unlock interactions (within 5 levels)
    const nearUnlocks: { interaction: string; missingLevels: number }[] = [];
    const highValueTargets: string[] = [];
    
    // This would need the full interaction database to analyze properly
    // For now, we'll simulate some analysis
    
    return {
      currentCount: availableInteractions.length,
      nearUnlocks,
      highValueTargets: ['combat_mental_synergy', 'spiritual_mental_synergy']
    };
  }

  private static analyzeProgressionEfficiency(character: Character): {
    xpEfficiency: number;
    trainingEfficiency: number;
    resourceUtilization: number;
    bottlenecks: string[];
  } {
    // Analyze training efficiency based on character progression
    const xpEfficiency = character.experience.currentLevel > 10 ? 75 : 85;
    const trainingEfficiency = character.trainingLevel;
    const resourceUtilization = 60; // Would calculate based on actual resource usage
    
    const bottlenecks: string[] = [];
    if (character.trainingLevel < 50) bottlenecks.push('training_level');
    if (character.bondLevel < 50) bottlenecks.push('bond_level');
    if (character.fatigue > 70) bottlenecks.push('fatigue_management');
    
    return {
      xpEfficiency,
      trainingEfficiency,
      resourceUtilization,
      bottlenecks
    };
  }

  private static generateSkillBalanceTips(character: Character, analysis: any): CoachingTip[] {
    const tips: CoachingTip[] = [];
    
    if (analysis.imbalanceScore > 15) {
      tips.push({
        id: 'skill_balance_critical',
        category: 'skill_balance',
        priority: 'high',
        title: 'Critical Skill Imbalance Detected',
        description: `Your ${analysis.leastDeveloped} skill is significantly behind others, limiting potential interactions.`,
        reasoning: `Skill interactions require balanced development. Your ${analysis.leastDeveloped} skill is ${analysis.imbalanceScore} levels behind your strongest skill.`,
        actionItems: [
          `Focus training sessions on ${analysis.leastDeveloped} skill`,
          'Use balanced training routines instead of specialized ones',
          'Consider using skill-boosting items for rapid catch-up'
        ],
        expectedBenefits: [
          'Unlock new skill interactions',
          'Improve overall character versatility',
          'Better combat effectiveness'
        ],
        estimatedTimeToResult: '3-5 training sessions',
        resourceCost: { coins: 500, energy: 60 },
        targetSkills: [analysis.leastDeveloped],
        confidence: 95
      });
    }
    
    if (analysis.averageLevel > 25 && analysis.imbalanceScore < 5) {
      tips.push({
        id: 'specialization_ready',
        category: 'specialization',
        priority: 'medium',
        title: 'Ready for Specialization',
        description: 'Your skills are well-balanced. Consider specializing in your preferred combat style.',
        reasoning: 'With balanced skills above level 25, you can safely specialize without losing interaction opportunities.',
        actionItems: [
          'Choose a primary specialization path',
          'Focus 70% of training on specialized skills',
          'Maintain minimum levels in other skills'
        ],
        expectedBenefits: [
          'Unlock powerful specialized interactions',
          'Dramatically improve combat effectiveness',
          'Access to legendary-tier abilities'
        ],
        estimatedTimeToResult: '5-8 training sessions',
        confidence: 88
      });
    }
    
    return tips;
  }

  private static generateInteractionTips(character: Character, analysis: any): CoachingTip[] {
    const tips: CoachingTip[] = [];
    
    tips.push({
      id: 'interaction_optimization',
      category: 'interaction_unlock',
      priority: 'high',
      title: 'High-Value Interaction Within Reach',
      description: 'Strategic Warrior interaction is 3 levels away - powerful combat synergy.',
      reasoning: 'This interaction provides +25% critical chance and +20% accuracy, significantly boosting combat effectiveness.',
      actionItems: [
        'Train combat skill to level 35',
        'Train mental skill to level 30',
        'Practice using both skills in battle'
      ],
      expectedBenefits: [
        '+25% critical hit chance',
        '+20% accuracy in combat',
        'Unlock advanced combat strategies'
      ],
      estimatedTimeToResult: '2-3 training sessions',
      resourceCost: { coins: 400, energy: 45 },
      targetSkills: ['combat', 'mental'],
      confidence: 92
    });
    
    return tips;
  }

  private static generateEfficiencyTips(character: Character, analysis: any): CoachingTip[] {
    const tips: CoachingTip[] = [];
    
    if (analysis.trainingEfficiency < 70) {
      tips.push({
        id: 'training_efficiency_low',
        category: 'efficiency',
        priority: 'high',
        title: 'Poor Training Efficiency Detected',
        description: 'Your training efficiency is below optimal. Specific adjustments can improve results by 40%.',
        reasoning: `At ${analysis.trainingEfficiency}% efficiency, you're getting diminished returns on training investments.`,
        actionItems: [
          'Reduce training intensity to avoid burnout',
          'Improve character bond level through conversations',
          'Use training facilities appropriate for character level',
          'Take rest periods between intensive sessions'
        ],
        expectedBenefits: [
          '+40% faster skill progression',
          'Better resource utilization',
          'Reduced fatigue accumulation'
        ],
        estimatedTimeToResult: '1-2 sessions',
        resourceCost: { coins: 200 },
        warningFlags: ['May require reduced training frequency'],
        confidence: 87
      });
    }
    
    if (character.fatigue > 70) {
      tips.push({
        id: 'fatigue_management',
        category: 'efficiency',
        priority: 'critical',
        title: 'Critical Fatigue Levels',
        description: 'High fatigue is severely impacting training effectiveness and battle performance.',
        reasoning: 'Fatigue above 70% reduces training gains by 50% and battle performance by 30%.',
        actionItems: [
          'Immediately take a 24-hour rest period',
          'Use healing items to restore stamina',
          'Adjust training schedule to include mandatory rest',
          'Consider spa or relaxation training activities'
        ],
        expectedBenefits: [
          'Restore full training effectiveness',
          'Improve battle performance',
          'Prevent permanent stamina damage'
        ],
        estimatedTimeToResult: '24 hours',
        resourceCost: { coins: 300, gems: 50 },
        warningFlags: ['Urgent action required'],
        confidence: 98
      });
    }
    
    return tips;
  }

  private static generateSpecializationTips(character: Character, focus: CoachingSession['sessionFocus']): CoachingTip[] {
    const tips: CoachingTip[] = [];
    
    const specializationAdvice = {
      combat: {
        title: 'Combat Mastery Path',
        skills: ['combat', 'survival'],
        description: 'Focus on combat and survival skills for maximum battle effectiveness'
      },
      magic: {
        title: 'Arcane Excellence Path',
        skills: ['mental', 'spiritual'],
        description: 'Develop mental and spiritual skills for powerful magical abilities'
      },
      social: {
        title: 'Leadership Excellence Path',
        skills: ['social', 'mental'],
        description: 'Combine social and mental skills for team leadership and tactical advantages'
      }
    };
    
    if (focus !== 'balanced' && specializationAdvice[focus]) {
      const spec = specializationAdvice[focus];
      tips.push({
        id: `specialization_${focus}`,
        category: 'specialization',
        priority: 'medium',
        title: spec.title,
        description: spec.description,
        reasoning: `Specialization in ${focus} will unlock powerful archetype-specific interactions and abilities.`,
        actionItems: [
          `Prioritize ${spec.skills.join(' and ')} training`,
          'Use specialized training facilities',
          'Seek out mentors in your specialization',
          'Practice combinations frequently'
        ],
        expectedBenefits: [
          'Unlock specialized skill interactions',
          'Gain access to exclusive abilities',
          'Dramatically improve effectiveness in chosen area'
        ],
        estimatedTimeToResult: '4-6 training sessions',
        targetSkills: spec.skills,
        confidence: 85
      });
    }
    
    return tips;
  }

  private static generateResourceTips(character: Character): CoachingTip[] {
    const tips: CoachingTip[] = [];
    
    // Analyze based on character level and progression
    if (character.level > 20) {
      tips.push({
        id: 'premium_training_recommendation',
        category: 'resource_management',
        priority: 'medium',
        title: 'Premium Training ROI Analysis',
        description: 'Your character level justifies investment in premium training facilities.',
        reasoning: 'At level 20+, premium facilities provide 3x faster progression, offsetting the cost.',
        actionItems: [
          'Upgrade to premium training membership',
          'Focus on high-value training activities',
          'Use gems for experience boosters strategically'
        ],
        expectedBenefits: [
          '3x faster skill progression',
          'Access to exclusive training activities',
          'Better long-term resource efficiency'
        ],
        estimatedTimeToResult: 'Immediate impact',
        resourceCost: { gems: 500, coins: 2000 },
        confidence: 82
      });
    }
    
    return tips;
  }

  private static prioritizeTips(tips: CoachingTip[], focus: CoachingSession['sessionFocus']): CoachingTip[] {
    return tips.sort((a, b) => {
      // Priority weight
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Confidence weight
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;
      
      // Focus relevance
      const focusRelevance = {
        combat: ['skill_balance', 'specialization', 'efficiency'],
        magic: ['interaction_unlock', 'specialization', 'progression'],
        social: ['synergy', 'resource_management', 'progression'],
        balanced: ['skill_balance', 'efficiency', 'progression']
      };
      
      const relevantCategories = focusRelevance[focus] || focusRelevance.balanced;
      const aRelevant = relevantCategories.includes(a.category) ? 1 : 0;
      const bRelevant = relevantCategories.includes(b.category) ? 1 : 0;
      
      return bRelevant - aRelevant;
    });
  }

  private static generateAdaptiveInsights(character: Character, tips: CoachingTip[]): string[] {
    const insights: string[] = [];
    
    if (tips.some(tip => tip.priority === 'critical')) {
      insights.push('⚠️ Critical issues detected that require immediate attention for optimal progression.');
    }
    
    if (tips.filter(tip => tip.category === 'interaction_unlock').length > 2) {
      insights.push('🌟 Multiple powerful interactions are within reach - consider focused training.');
    }
    
    if (character.level > 25 && character.trainingLevel > 80) {
      insights.push('🎯 Your character is ready for advanced specialization training.');
    }
    
    const avgConfidence = tips.reduce((sum, tip) => sum + tip.confidence, 0) / tips.length;
    if (avgConfidence > 90) {
      insights.push('✅ High-confidence recommendations - these strategies are proven effective.');
    }
    
    return insights;
  }
}

// Demo coaching data
export function createDemoCoachingSession(character: Character): CoachingSession {
  return AICoach.generateCoachingSession(
    character,
    ['Improve combat effectiveness', 'Unlock new abilities'],
    'combat'
  );
}
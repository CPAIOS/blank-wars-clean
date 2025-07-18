// Smart Context Compression Service
// Generates concise, efficient context from the centralized event system

import GameEventBus, { GameEvent, CharacterMemory, CharacterRelationship, EventFilter, EventCategory } from './gameEventBus';
import ComedyTemplateService from './comedyTemplateService';

export interface ContextConfig {
  maxTokens: number;
  domainFocus: 'performance' | 'equipment' | 'skills' | 'therapy' | 'social' | 'general';
  includeLivingContext: boolean;
  includeRelationships: boolean;
  includeRecentEvents: boolean;
  includeEmotionalState: boolean;
  timeRange: '1_hour' | '6_hours' | '1_day' | '3_days' | '1_week';
}

export interface CompressedContext {
  recentEvents: string;
  relationships: string;
  emotionalState: string;
  domainSpecific: string;
  tokenCount: number;
}

export interface RelationshipSummary {
  allies: Array<{ name: string; trust: number; note: string }>;
  rivals: Array<{ name: string; rivalry: number; note: string }>;
  neutral: Array<{ name: string; note: string }>;
}

export class EventContextService {
  private static instance: EventContextService;
  private eventBus: GameEventBus;
  private characterNameMap: Map<string, string> = new Map();

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.initializeCharacterNames();
  }

  static getInstance(): EventContextService {
    if (!EventContextService.instance) {
      EventContextService.instance = new EventContextService();
    }
    return EventContextService.instance;
  }

  private initializeCharacterNames(): void {
    // Map character IDs to display names
    const names = {
      'achilles': 'Achilles',
      'joan': 'Joan of Arc',
      'holmes': 'Sherlock Holmes',
      'dracula': 'Dracula',
      'sun_wukong': 'Sun Wukong',
      'cleopatra': 'Cleopatra',
      'tesla': 'Nikola Tesla',
      'merlin': 'Merlin',
      'billy_the_kid': 'Billy the Kid',
      'genghis_khan': 'Genghis Khan',
      'fenrir': 'Fenrir',
      'frankenstein': 'Frankenstein'
    };

    for (const [id, name] of Object.entries(names)) {
      this.characterNameMap.set(id, name);
    }
  }

  // Main context generation method
  async generateCompressedContext(characterId: string, config: ContextConfig): Promise<CompressedContext> {
    const recentEvents = config.includeRecentEvents ? 
      await this.generateRecentEventsContext(characterId, config) : '';
    
    const relationships = config.includeRelationships ? 
      await this.generateRelationshipsContext(characterId, config) : '';
    
    const emotionalState = config.includeEmotionalState ? 
      await this.generateEmotionalStateContext(characterId, config) : '';
    
    const domainSpecific = await this.generateDomainSpecificContext(characterId, config);

    // Calculate token count (rough estimate: 1 token ≈ 4 characters)
    const fullContext = [recentEvents, relationships, emotionalState, domainSpecific].join('\n');
    const tokenCount = Math.ceil(fullContext.length / 4);

    // If over token limit, compress further
    if (tokenCount > config.maxTokens) {
      return await this.compressContext({
        recentEvents,
        relationships,
        emotionalState,
        domainSpecific,
        tokenCount
      }, config);
    }

    return {
      recentEvents,
      relationships,
      emotionalState,
      domainSpecific,
      tokenCount
    };
  }

  // Generate recent events context
  private async generateRecentEventsContext(characterId: string, config: ContextConfig): Promise<string> {
    const filter: EventFilter = {
      timeRange: config.timeRange,
      limit: 5
    };

    // Domain-specific event filtering
    if (config.domainFocus !== 'general') {
      filter.categories = this.getDomainCategories(config.domainFocus);
    }

    const events = this.eventBus.getEventHistory(characterId, filter);
    
    if (events.length === 0) return '';

    const eventStrings = events.map(event => this.formatEventForContext(event, characterId));
    
    return `RECENT EVENTS (last ${config.timeRange.replace('_', ' ')}):\n${eventStrings.join('\n')}`;
  }

  // Generate relationships context
  private async generateRelationshipsContext(characterId: string, config: ContextConfig): Promise<string> {
    const relationshipMap = this.eventBus.getRelationshipSummary(characterId);
    
    if (relationshipMap.size === 0) return '';

    const summary = this.categorizeRelationships(relationshipMap);
    const parts: string[] = [];

    if (summary.allies.length > 0) {
      const allies = summary.allies.slice(0, 3).map(a => `${a.name} (+${a.trust})`).join(', ');
      parts.push(`Allies: ${allies}`);
    }

    if (summary.rivals.length > 0) {
      const rivals = summary.rivals.slice(0, 2).map(r => `${r.name} (rivalry ${r.rivalry})`).join(', ');
      parts.push(`Rivals: ${rivals}`);
    }

    if (summary.neutral.length > 0 && parts.length < 2) {
      const neutral = summary.neutral.slice(0, 2).map(n => n.name).join(', ');
      parts.push(`Neutral: ${neutral}`);
    }

    return parts.length > 0 ? `RELATIONSHIPS:\n• ${parts.join('\n• ')}` : '';
  }

  // Generate emotional state context
  private async generateEmotionalStateContext(characterId: string, config: ContextConfig): Promise<string> {
    const memories = this.eventBus.getCharacterMemories(characterId, {
      importance: 6,
      limit: 5
    });

    if (memories.length === 0) return '';

    // Calculate emotional state from recent memories
    let positiveIntensity = 0;
    let negativeIntensity = 0;
    let stressLevel = 0;

    for (const memory of memories) {
      if (memory.emotionalValence === 'positive') {
        positiveIntensity += memory.emotionalIntensity;
      } else if (memory.emotionalValence === 'negative') {
        negativeIntensity += memory.emotionalIntensity;
        stressLevel += memory.emotionalIntensity;
      }
    }

    const overallMood = positiveIntensity > negativeIntensity ? 'positive' : 
                       negativeIntensity > positiveIntensity ? 'stressed' : 'neutral';

    const confidence = Math.max(0, Math.min(100, 50 + positiveIntensity - negativeIntensity));
    
    return `EMOTIONAL STATE: ${overallMood} (confidence: ${confidence}%, stress: ${Math.min(100, stressLevel * 10)}%)`;
  }

  // Generate domain-specific context
  private async generateDomainSpecificContext(characterId: string, config: ContextConfig): Promise<string> {
    switch (config.domainFocus) {
      case 'performance':
        return await this.generatePerformanceContext(characterId);
      case 'equipment':
        return await this.generateEquipmentContext(characterId);
      case 'skills':
        return await this.generateSkillsContext(characterId);
      case 'therapy':
        return await this.generateTherapyContext(characterId);
      case 'social':
        return await this.generateSocialContext(characterId);
      default:
        return '';
    }
  }

  // Domain-specific context generators
  private async generatePerformanceContext(characterId: string): Promise<string> {
    const battleEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['battle'],
      timeRange: '1_week',
      limit: 5
    });

    const victories = battleEvents.filter(e => e.type === 'battle_victory').length;
    const defeats = battleEvents.filter(e => e.type === 'battle_defeat').length;
    const total = victories + defeats;

    if (total === 0) return 'PERFORMANCE: No recent battles';

    const winRate = Math.round((victories / total) * 100);
    const trend = victories > defeats ? '📈 improving' : defeats > victories ? '📉 declining' : '➡️ stable';

    return `PERFORMANCE: ${victories}W/${defeats}L (${winRate}% win rate, ${trend})`;
  }

  private async generateEquipmentContext(characterId: string): Promise<string> {
    const equipmentEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['progression'],
      timeRange: '3_days'
    }).filter(e => e.type === 'equipment_equipped' || e.type === 'equipment_upgraded');

    if (equipmentEvents.length === 0) return 'EQUIPMENT: No recent changes';

    const recentChanges = equipmentEvents.slice(0, 2).map(e => 
      `${e.metadata.itemName} ${e.type === 'equipment_upgraded' ? 'upgraded' : 'equipped'}`
    ).join(', ');

    return `EQUIPMENT: Recent changes - ${recentChanges}`;
  }

  private async generateSkillsContext(characterId: string): Promise<string> {
    const skillEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['training', 'progression'],
      timeRange: '1_week'
    }).filter(e => e.type === 'skill_improvement' || e.type === 'new_technique_learned');

    if (skillEvents.length === 0) return 'SKILLS: No recent learning';

    const recentSkills = skillEvents.slice(0, 3).map(e => 
      e.metadata.skillName || e.description.split(' ')[0]
    ).join(', ');

    return `SKILLS: Recently learned - ${recentSkills}`;
  }

  private async generateTherapyContext(characterId: string): Promise<string> {
    const therapyEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['therapy'],
      timeRange: '1_week'
    });

    const breakthroughs = therapyEvents.filter(e => e.type === 'therapy_breakthrough').length;
    const resistances = therapyEvents.filter(e => e.type === 'therapy_resistance').length;
    
    if (therapyEvents.length === 0) return 'THERAPY: No recent sessions';

    const progress = breakthroughs > resistances ? '🎯 making progress' : 
                    resistances > breakthroughs ? '🛡️ showing resistance' : '➡️ stable';

    return `THERAPY: ${therapyEvents.length} sessions this week, ${progress}`;
  }

  private async generateSocialContext(characterId: string): Promise<string> {
    const socialEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['social'],
      timeRange: '3_days'
    });

    const conflicts = socialEvents.filter(e => e.type.includes('conflict') || e.type.includes('argument')).length;
    const positive = socialEvents.filter(e => e.type.includes('conversation') || e.type.includes('activity')).length;

    if (socialEvents.length === 0) return 'SOCIAL: Quiet few days';

    const mood = conflicts > positive ? '⚡ tense household' : 
                positive > conflicts ? '🤝 harmonious' : '😐 typical interactions';

    return `SOCIAL: ${socialEvents.length} interactions, ${mood}`;
  }

  // Helper methods
  private formatEventForContext(event: GameEvent, characterId: string): string {
    const timeAgo = this.getTimeAgo(event.timestamp);
    const severity = this.getSeverityEmoji(event.severity);
    const otherCharacters = [event.primaryCharacterId, ...(event.secondaryCharacterIds || [])]
      .filter(id => id !== characterId)
      .map(id => this.characterNameMap.get(id) || id)
      .slice(0, 2);

    let description = event.description;
    if (otherCharacters.length > 0) {
      description += ` (with ${otherCharacters.join(', ')})`;
    }

    return `• ${severity} ${description} (${timeAgo})`;
  }

  private categorizeRelationships(relationshipMap: Map<string, CharacterRelationship>): RelationshipSummary {
    const allies: RelationshipSummary['allies'] = [];
    const rivals: RelationshipSummary['rivals'] = [];
    const neutral: RelationshipSummary['neutral'] = [];

    for (const targetId of Array.from(relationshipMap.keys())) {
      const relationship = relationshipMap.get(targetId);
      if (!relationship) continue;
      const name = this.characterNameMap.get(targetId) || targetId;
      
      if (relationship.trustLevel > 20 || relationship.affectionLevel > 20) {
        allies.push({
          name,
          trust: relationship.trustLevel,
          note: relationship.relationshipTrajectory
        });
      } else if (relationship.rivalryIntensity > 30 || relationship.trustLevel < -20) {
        rivals.push({
          name,
          rivalry: relationship.rivalryIntensity,
          note: `${relationship.conflicts.length} conflicts`
        });
      } else {
        neutral.push({
          name,
          note: relationship.relationshipTrajectory
        });
      }
    }

    // Sort by strength
    allies.sort((a, b) => b.trust - a.trust);
    rivals.sort((a, b) => b.rivalry - a.rivalry);

    return { allies, rivals, neutral };
  }

  private getDomainCategories(domain: string): EventCategory[] {
    const categoryMap: Record<string, EventCategory[]> = {
      'performance': ['battle', 'training'],
      'equipment': ['progression', 'battle'],
      'skills': ['training', 'progression'],
      'therapy': ['therapy', 'social'],
      'social': ['social', 'communication']
    };

    return categoryMap[domain] || [];
  }

  private getSeverityEmoji(severity: string): string {
    const emojiMap = {
      'low': '🟨',
      'medium': '🟧',
      'high': '🟥',
      'critical': '💥'
    };
    return emojiMap[severity as keyof typeof emojiMap] || '•';
  }

  private getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return 'last week';
  }

  // Context compression when over token limit
  private async compressContext(context: CompressedContext, config: ContextConfig): Promise<CompressedContext> {
    // Priority order for compression
    const sections = [
      { name: 'domainSpecific', content: context.domainSpecific, priority: 1 },
      { name: 'recentEvents', content: context.recentEvents, priority: 2 },
      { name: 'relationships', content: context.relationships, priority: 3 },
      { name: 'emotionalState', content: context.emotionalState, priority: 4 }
    ];

    let compressedContext = { ...context };
    let currentTokens = context.tokenCount;

    // Compress sections in order of priority
    for (const section of sections.sort((a, b) => a.priority - b.priority)) {
      if (currentTokens <= config.maxTokens) break;

      const compressed = this.compressSection(section.content);
      (compressedContext as any)[section.name] = compressed;
      
      const tokenReduction = Math.ceil((section.content.length - compressed.length) / 4);
      currentTokens -= tokenReduction;
    }

    compressedContext.tokenCount = currentTokens;
    return compressedContext;
  }

  private compressSection(content: string): string {
    if (!content) return content;

    // Remove extra details in parentheses
    let compressed = content.replace(/\([^)]*\)/g, '');
    
    // Shorten time references
    compressed = compressed.replace(/\d+h ago/g, 'recent');
    compressed = compressed.replace(/\d+d ago/g, 'recent');
    compressed = compressed.replace(/yesterday/g, 'recent');
    
    // Remove extra whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();
    
    return compressed;
  }

  // Public API for easy integration
  async getPerformanceContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 200,
      domainFocus: 'performance',
      includeLivingContext: true,
      includeRelationships: true,
      includeRecentEvents: true,
      includeEmotionalState: true,
      timeRange: '3_days'
    };

    const context = await this.generateCompressedContext(characterId, config);
    return this.formatContextForPrompt(context);
  }

  async getEquipmentContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 150,
      domainFocus: 'equipment',
      includeLivingContext: false,
      includeRelationships: false,
      includeRecentEvents: true,
      includeEmotionalState: false,
      timeRange: '1_week'
    };

    const context = await this.generateCompressedContext(characterId, config);
    return this.formatContextForPrompt(context);
  }

  async getSkillsContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 180,
      domainFocus: 'skills',
      includeLivingContext: false,
      includeRelationships: false,
      includeRecentEvents: true,
      includeEmotionalState: true,
      timeRange: '1_week'
    };

    const context = await this.generateCompressedContext(characterId, config);
    return this.formatContextForPrompt(context);
  }

  async getTherapyContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 300,
      domainFocus: 'therapy',
      includeLivingContext: true,
      includeRelationships: true,
      includeRecentEvents: true,
      includeEmotionalState: true,
      timeRange: '1_week'
    };

    const context = await this.generateCompressedContext(characterId, config);
    return this.formatContextForPrompt(context);
  }

  private formatContextForPrompt(context: CompressedContext): string {
    const sections = [
      context.recentEvents,
      context.relationships,
      context.emotionalState,
      context.domainSpecific
    ].filter(Boolean);

    return sections.join('\n\n');
  }

  // Alias methods for compatibility
  async getSkillContext(characterId: string): Promise<string> {
    return this.getSkillsContext(characterId);
  }

  async getSocialContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 150,
      domainFocus: 'social',
      includeLivingContext: true,
      includeRelationships: true,
      includeRecentEvents: true,
      includeEmotionalState: false,
      timeRange: '3_days'
    };

    const context = await this.generateCompressedContext(characterId, config);
    return this.formatContextForPrompt(context);
  }

  async getComprehensiveContext(characterId: string, config: ContextConfig): Promise<string> {
    const context = await this.generateCompressedContext(characterId, config);
    return this.formatContextForPrompt(context);
  }

  /**
   * Get financial decision history context for a character
   */
  async getFinancialContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 250,
      domainFocus: 'general',
      includeLivingContext: false,
      includeRelationships: false,
      includeRecentEvents: true,
      includeEmotionalState: true,
      timeRange: '1_week'
    };

    // Get financial-specific memories
    const financialMemories = this.eventBus.getCharacterMemories(characterId, {
      memoryType: 'financial',
      limit: 5
    });

    // Get recent financial events
    const financialEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['financial'],
      timeRange: '1_week',
      limit: 10
    });

    const context = await this.generateCompressedContext(characterId, config);
    
    // Add financial-specific context
    let financialContext = '';
    
    if (financialMemories.length > 0) {
      const memoryStrings = financialMemories.map(memory => {
        const outcome = memory.financialMetadata?.outcome || 'unknown';
        const amount = memory.financialMetadata?.amountInvolved || 0;
        const decisionType = memory.financialMetadata?.decisionType || 'unknown';
        const timeAgo = this.getTimeAgo(memory.createdAt);
        
        return `• ${memory.content} (${decisionType}, $${amount.toLocaleString()}, ${outcome}, ${timeAgo})`;
      });
      
      financialContext += `FINANCIAL DECISION HISTORY:\n${memoryStrings.join('\n')}\n\n`;
    }

    if (financialEvents.length > 0) {
      const recentEvents = financialEvents.slice(0, 5).map(event => {
        const timeAgo = this.getTimeAgo(event.timestamp);
        const severity = this.getSeverityEmoji(event.severity);
        return `• ${severity} ${event.description} (${timeAgo})`;
      });
      
      financialContext += `RECENT FINANCIAL EVENTS:\n${recentEvents.join('\n')}\n\n`;
    }

    return financialContext + this.formatContextForPrompt(context);
  }

  /**
   * Get financial patterns and trends for a character
   */
  async getFinancialPatterns(characterId: string): Promise<{
    successfulDecisions: number;
    failedDecisions: number;
    totalAmount: number;
    commonDecisionTypes: string[];
    stressTrend: 'improving' | 'declining' | 'stable';
    trustTrend: 'improving' | 'declining' | 'stable';
  }> {
    const financialMemories = this.eventBus.getCharacterMemories(characterId, {
      memoryType: 'financial',
      limit: 20
    });

    let successfulDecisions = 0;
    let failedDecisions = 0;
    let totalAmount = 0;
    const decisionTypes: string[] = [];
    const stressImpacts: number[] = [];
    const trustImpacts: number[] = [];

    for (const memory of financialMemories) {
      if (memory.financialMetadata) {
        const { outcome, amountInvolved, decisionType, stressImpact, trustImpact } = memory.financialMetadata;
        
        if (outcome === 'success') successfulDecisions++;
        else if (outcome === 'failure') failedDecisions++;
        
        totalAmount += amountInvolved;
        decisionTypes.push(decisionType);
        stressImpacts.push(stressImpact);
        trustImpacts.push(trustImpact);
      }
    }

    // Calculate trends
    const recentStressImpacts = stressImpacts.slice(-5);
    const recentTrustImpacts = trustImpacts.slice(-5);
    
    const stressTrend = this.calculateTrend(recentStressImpacts);
    const trustTrend = this.calculateTrend(recentTrustImpacts);

    // Get common decision types
    const decisionTypeCount = decisionTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonDecisionTypes = Object.entries(decisionTypeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      successfulDecisions,
      failedDecisions,
      totalAmount,
      commonDecisionTypes,
      stressTrend,
      trustTrend
    };
  }

  /**
   * Calculate trend from array of numbers
   */
  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 2) return 'improving';
    if (diff < -2) return 'declining';
    return 'stable';
  }

  /**
   * Get confessional context - Heavy on shame, secrets, guilt
   */
  async getConfessionalContext(characterId: string): Promise<string> {
    // Get memories from multiple types - we'll need to call multiple times since API only supports single memoryType
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const memories = allMemories.filter(m => 
      ['conflict', 'therapy', 'personal_problems', 'drama', 'confession'].includes(m.memoryType)
    ).slice(0, 8);

    const relevantMemories = memories.filter(memory => {
      const embarrassing = memory.crossReferenceData?.embarrassmentLevel >= 3;
      const secretive = memory.crossReferenceData?.secretLevel >= 3;
      const emotional = memory.emotionalIntensity >= 6;
      return embarrassing || secretive || emotional;
    });

    let context = `Recent memories weighing on ${characterId}:\n`;
    
    relevantMemories.forEach(memory => {
      const embarrassmentNote = memory.crossReferenceData?.embarrassmentLevel >= 5 ? " (deeply embarrassing)" : "";
      const secretNote = memory.crossReferenceData?.secretLevel >= 5 ? " (secret shame)" : "";
      context += `- ${memory.content}${embarrassmentNote}${secretNote}\n`;
    });

    // Add cross-references to other chats
    const crossRefs = this.generateComedyReferences(characterId, 'confessional');
    if (crossRefs.length > 0) {
      context += `\nPotential contradictions to address:\n`;
      crossRefs.forEach(ref => context += `- ${ref}\n`);
    }

    return context;
  }

  /**
   * Get real estate context - Focus on living conditions, complaints
   */
  async getRealEstateContext(characterId: string): Promise<string> {
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const memories = allMemories.filter(m => 
      ['social', 'conflict', 'bonding', 'real_estate', 'therapy'].includes(m.memoryType)
    ).slice(0, 6);

    const livingRelevant = memories.filter(memory => {
      const socialConflict = memory.memoryType === 'conflict' && memory.associatedCharacters.length > 0;
      const privacyIssues = memory.tags.includes('privacy') || memory.tags.includes('space');
      const therapyRelated = memory.memoryType === 'therapy' && memory.tags.includes('boundaries');
      return socialConflict || privacyIssues || therapyRelated;
    });

    let context = `Living situation insights for ${characterId}:\n`;
    
    livingRelevant.forEach(memory => {
      const privacyNote = memory.tags.includes('privacy') ? " (privacy concern)" : "";
      const conflictNote = memory.associatedCharacters.length > 1 ? ` (involves ${memory.associatedCharacters.join(', ')})` : "";
      context += `- ${memory.content}${privacyNote}${conflictNote}\n`;
    });

    // Add therapy session references
    const therapyMemories = memories.filter(m => m.memoryType === 'therapy');
    if (therapyMemories.length > 0) {
      context += `\nTherapy insights affecting living preferences:\n`;
      therapyMemories.slice(0, 2).forEach(memory => {
        context += `- ${memory.content}\n`;
      });
    }

    return context;
  }

  /**
   * Get training context - Physical achievements, failures, progress
   */
  async getTrainingContext(characterId: string): Promise<string> {
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const memories = allMemories.filter(m => 
      ['training', 'battle', 'achievement', 'personal_problems', 'therapy'].includes(m.memoryType)
    ).slice(0, 8);

    const trainingRelevant = memories.filter(memory => {
      const physicalProgress = memory.tags.includes('physical') || memory.tags.includes('training');
      const mentalBlockage = memory.memoryType === 'therapy' && memory.tags.includes('confidence');
      const personalStruggles = memory.memoryType === 'personal_problems';
      return physicalProgress || mentalBlockage || personalStruggles;
    });

    let context = `Training history and mental state for ${characterId}:\n`;
    
    trainingRelevant.forEach(memory => {
      const progressNote = memory.emotionalValence === 'positive' ? " (progress)" : memory.emotionalValence === 'negative' ? " (setback)" : "";
      context += `- ${memory.content}${progressNote}\n`;
    });

    // Add cross-references for comedy
    const crossRefs = this.generateComedyReferences(characterId, 'training');
    if (crossRefs.length > 0) {
      context += `\nIronic contrasts with other areas:\n`;
      crossRefs.forEach(ref => context += `- ${ref}\n`);
    }

    return context;
  }

  /**
   * Get personal problems context - Emotional support and advice
   */
  async getPersonalProblemsContext(characterId: string): Promise<string> {
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const memories = allMemories.filter(m => 
      ['personal_problems', 'therapy', 'conflict', 'social'].includes(m.memoryType)
    ).slice(0, 10);

    const supportRelevant = memories.filter(memory => {
      const emotionallyIntense = memory.emotionalIntensity >= 5;
      const recentConflict = memory.memoryType === 'conflict' && memory.createdAt > Date.now() - (7 * 24 * 60 * 60 * 1000);
      return emotionallyIntense || recentConflict;
    });

    let context = `Personal struggles and emotional state for ${characterId}:\n`;
    
    supportRelevant.forEach(memory => {
      const intensityNote = memory.emotionalIntensity >= 8 ? " (very intense)" : memory.emotionalIntensity >= 6 ? " (significant)" : "";
      context += `- ${memory.content}${intensityNote}\n`;
    });

    // Add therapy session context
    const therapyMemories = memories.filter(m => m.memoryType === 'therapy');
    if (therapyMemories.length > 0) {
      context += `\nTherapy progress relevant to current problems:\n`;
      therapyMemories.slice(0, 2).forEach(memory => {
        context += `- ${memory.content}\n`;
      });
    }

    return context;
  }

  /**
   * Get kitchen context - Social conflicts and living arrangements
   */
  async getKitchenContext(characterId: string): Promise<string> {
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const memories = allMemories.filter(m => 
      ['social', 'conflict', 'drama', 'kitchen'].includes(m.memoryType)
    ).slice(0, 8);

    const kitchenRelevant = memories.filter(memory => {
      const livingConflict = memory.tags.includes('kitchen') || memory.tags.includes('living');
      const socialTension = memory.memoryType === 'conflict' && memory.associatedCharacters.length > 0;
      const dailyDrama = memory.tags.includes('daily') || memory.tags.includes('routine');
      return livingConflict || socialTension || dailyDrama;
    });

    let context = `Recent kitchen and living arrangement dynamics for ${characterId}:\n`;
    
    kitchenRelevant.forEach(memory => {
      const conflictNote = memory.associatedCharacters.length > 1 ? ` (tension with ${memory.associatedCharacters.join(', ')})` : "";
      const intensityNote = memory.emotionalIntensity >= 7 ? " (heated)" : "";
      context += `- ${memory.content}${conflictNote}${intensityNote}\n`;
    });

    return context;
  }

  /**
   * Get group activities context - Team dynamics and social interactions
   */
  async getGroupActivitiesContext(characterId: string): Promise<string> {
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const memories = allMemories.filter(m => 
      ['group_activity', 'social', 'conflict', 'bonding'].includes(m.memoryType)
    ).slice(0, 8);

    const groupRelevant = memories.filter(memory => {
      const multipleParticipants = memory.associatedCharacters.length >= 2;
      const teamDynamics = memory.tags.includes('team') || memory.tags.includes('group');
      return multipleParticipants || teamDynamics;
    });

    let context = `Group dynamics and social patterns for ${characterId}:\n`;
    
    groupRelevant.forEach(memory => {
      const participantNote = memory.associatedCharacters.length > 0 ? ` (with ${memory.associatedCharacters.join(', ')})` : "";
      const roleNote = memory.tags.includes('leadership') ? " (leadership moment)" : memory.tags.includes('cooperation') ? " (cooperation)" : "";
      context += `- ${memory.content}${participantNote}${roleNote}\n`;
    });

    return context;
  }

  /**
   * Generate comedy references from past events for cross-chat humor using flexible templates
   */
  generateComedyReferences(characterId: string, currentChatType: string, currentTopic: string = ''): string[] {
    const allMemories = this.eventBus.getCharacterMemories(characterId, { limit: 20 });
    const comedyService = ComedyTemplateService.getInstance();

    const relevantMemories = allMemories.filter(memory => {
      const hasComedyPotential = memory.crossReferenceData?.comedyPotential >= 6;
      const canReference = memory.crossReferenceData?.canReferencedIn?.includes(currentChatType);
      const hasContradiction = memory.crossReferenceData?.contradictionPotential >= 5;
      const hasEmbarrassment = memory.crossReferenceData?.embarrassmentLevel >= 5;
      const hasQuotability = memory.crossReferenceData?.quotability >= 5;
      
      return hasComedyPotential || canReference || hasContradiction || hasEmbarrassment || hasQuotability;
    });

    // Use flexible template system to generate comedy references
    return comedyService.generateMultipleReferences(relevantMemories, currentChatType, currentTopic, 3);
  }

  /**
   * Get comedy context for a specific chat interaction
   */
  getComedyContext(characterId: string, currentChatType: string, currentTopic: string = ''): string {
    const comedyReferences = this.generateComedyReferences(characterId, currentChatType, currentTopic);
    
    if (comedyReferences.length === 0) {
      return '';
    }

    let context = 'Recent moments that could create humor or tension:\n';
    comedyReferences.forEach((reference, index) => {
      context += `${index + 1}. ${reference}\n`;
    });

    return context;
  }

  /**
   * Get team battle context for battle communications
   */
  async getTeamBattleContext(characterId: string): Promise<string> {
    const config: ContextConfig = {
      maxTokens: 250,
      domainFocus: 'performance',
      includeLivingContext: false,
      includeRelationships: true,
      includeRecentEvents: true,
      includeEmotionalState: true,
      timeRange: '1_day'
    };

    const context = await this.generateCompressedContext(characterId, config);
    
    // Add battle-specific context
    let battleContext = '';
    
    // Get recent battle events
    const battleEvents = this.eventBus.getEventHistory(characterId, {
      categories: ['battle'],
      timeRange: '1_day',
      limit: 3
    });

    if (battleEvents.length > 0) {
      const recentBattles = battleEvents.map(event => {
        const timeAgo = this.getTimeAgo(event.timestamp);
        const result = event.type.includes('victory') ? 'victory' : event.type.includes('defeat') ? 'defeat' : 'participation';
        return `• Recent ${result}: ${event.description} (${timeAgo})`;
      });
      
      battleContext += `RECENT BATTLE HISTORY:\n${recentBattles.join('\n')}\n\n`;
    }

    return battleContext + this.formatContextForPrompt(context);
  }
}

export default EventContextService;
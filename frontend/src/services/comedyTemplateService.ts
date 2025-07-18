import { CharacterMemory } from './gameEventBus';

/**
 * Comedy Template Service - Creates flexible cross-chat humor references
 * Uses variable templates that adapt to actual memory content for authentic comedy
 */

export interface ComedyTemplate {
  id: string;
  template: string;
  requiredFields: string[];
  minEmbarrassmentLevel?: number;
  minContradictionPotential?: number;
  minQuotability?: number;
  requiredTags?: string[];
  category: 'contradiction' | 'embarrassing' | 'ironic' | 'callback';
}

export interface TemplateVariables {
  chatSystem: string;
  timeReference: string;
  topic: string;
  action?: string;
  emotionalEvent?: string;
  characterName?: string;
  pastBehavior?: string;
  severity?: string;
}

export class ComedyTemplateService {
  private static instance: ComedyTemplateService;

  public static getInstance(): ComedyTemplateService {
    if (!ComedyTemplateService.instance) {
      ComedyTemplateService.instance = new ComedyTemplateService();
    }
    return ComedyTemplateService.instance;
  }

  private comedyTemplates: ComedyTemplate[] = [
    // Contradiction Templates
    {
      id: 'contradiction_past_action',
      template: "Funny, because in {chatSystem} {timeReference} you were {action} about {topic}...",
      requiredFields: ['chatSystem', 'timeReference', 'action', 'topic'],
      minContradictionPotential: 6,
      category: 'contradiction'
    },
    {
      id: 'contradiction_advice',
      template: "You're giving me advice, but in {chatSystem} you said you struggle with {topic}.",
      requiredFields: ['chatSystem', 'topic'],
      minContradictionPotential: 7,
      category: 'contradiction'
    },
    {
      id: 'contradiction_opposite',
      template: "The irony is that just {timeReference} in {chatSystem} you were saying the opposite about {topic}...",
      requiredFields: ['timeReference', 'chatSystem', 'topic'],
      minContradictionPotential: 8,
      category: 'contradiction'
    },

    // Embarrassing Callback Templates  
    {
      id: 'embarrassing_meltdown',
      template: "Remember when you had that {emotionalEvent} in {chatSystem} about {topic}?",
      requiredFields: ['emotionalEvent', 'chatSystem', 'topic'],
      minEmbarrassmentLevel: 6,
      requiredTags: ['embarrassing'],
      category: 'embarrassing'
    },
    {
      id: 'embarrassing_confession',
      template: "This reminds me of when you {pastBehavior} in {chatSystem} about {topic}.",
      requiredFields: ['pastBehavior', 'chatSystem', 'topic'],
      minEmbarrassmentLevel: 5,
      category: 'embarrassing'
    },
    {
      id: 'embarrassing_dramatic',
      template: "Just like when you got all {severity} during {chatSystem} about {topic}...",
      requiredFields: ['severity', 'chatSystem', 'topic'],
      minEmbarrassmentLevel: 7,
      requiredTags: ['dramatic'],
      category: 'embarrassing'
    },

    // Ironic Reference Templates
    {
      id: 'ironic_advice_giver',
      template: "Of all people to give advice about {topic}, considering what happened in {chatSystem}...",
      requiredFields: ['topic', 'chatSystem'],
      minQuotability: 6,
      category: 'ironic'
    },
    {
      id: 'ironic_focus_own_issues',
      template: "Maybe focus on your own {topic} first, like what happened in {chatSystem} {timeReference}?",
      requiredFields: ['topic', 'chatSystem', 'timeReference'],
      minQuotability: 7,
      category: 'ironic'
    },

    // Callback Templates
    {
      id: 'callback_pattern',
      template: "Here we go again... just like in {chatSystem} when you {pastBehavior} about {topic}.",
      requiredFields: ['chatSystem', 'pastBehavior', 'topic'],
      minQuotability: 5,
      category: 'callback'
    },
    {
      id: 'callback_history',
      template: "Your track record speaks for itself - remember {chatSystem}? The whole {topic} situation?",
      requiredFields: ['chatSystem', 'topic'],
      minQuotability: 6,
      category: 'callback'
    }
  ];

  /**
   * Generate comedy reference from a memory and current context
   */
  public generateComedyReference(
    targetMemory: CharacterMemory,
    currentContext: string,
    currentTopic: string
  ): string | null {
    // Find suitable templates based on memory metadata
    const suitableTemplates = this.findSuitableTemplates(targetMemory);
    
    if (suitableTemplates.length === 0) {
      return null;
    }

    // Select best template (randomly from suitable ones for variety)
    const selectedTemplate = suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];
    
    // Extract variables from memory
    const variables = this.extractVariables(targetMemory, currentContext, currentTopic);
    
    // Generate the comedy reference
    return this.fillTemplate(selectedTemplate, variables);
  }

  /**
   * Find templates that match the memory's comedy potential
   */
  private findSuitableTemplates(memory: CharacterMemory): ComedyTemplate[] {
    return this.comedyTemplates.filter(template => {
      // Check embarrassment level requirement
      if (template.minEmbarrassmentLevel && 
          (!memory.crossReferenceData?.embarrassmentLevel || 
           memory.crossReferenceData.embarrassmentLevel < template.minEmbarrassmentLevel)) {
        return false;
      }

      // Check contradiction potential requirement
      if (template.minContradictionPotential && 
          (!memory.crossReferenceData?.contradictionPotential || 
           memory.crossReferenceData.contradictionPotential < template.minContradictionPotential)) {
        return false;
      }

      // Check quotability requirement
      if (template.minQuotability && 
          (!memory.crossReferenceData?.quotability || 
           memory.crossReferenceData.quotability < template.minQuotability)) {
        return false;
      }

      // Check required tags
      if (template.requiredTags && 
          !template.requiredTags.some(tag => memory.crossReferenceData?.comedyTags?.includes(tag))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Extract variables from memory for template filling
   */
  private extractVariables(
    memory: CharacterMemory,
    currentContext: string,
    currentTopic: string
  ): TemplateVariables {
    const chatSystemMap: { [key: string]: string } = {
      'kitchen_table': 'kitchen',
      'therapy_session': 'therapy',
      'real_estate': 'real estate',
      'training_session': 'training',
      'equipment_advice': 'equipment consultation',
      'confessional_booth': 'confessional',
      'clubhouse_lounge': 'clubhouse',
      'group_activities': 'group activities',
      'ai_drama_board': 'message board',
      'team_battle_chat': 'team chat',
      'combat_coaching': 'coaching',
      'financial_advisor': 'financial planning'
    };

    const timeReference = this.getTimeReference(memory.timestamp);
    const chatSystem = chatSystemMap[memory.source] || memory.source;
    const topic = this.extractTopic(memory.content);
    
    return {
      chatSystem,
      timeReference,
      topic,
      action: this.extractAction(memory),
      emotionalEvent: this.extractEmotionalEvent(memory),
      characterName: memory.characterId,
      pastBehavior: this.extractPastBehavior(memory),
      severity: this.extractSeverity(memory)
    };
  }

  /**
   * Fill template with variables
   */
  private fillTemplate(template: ComedyTemplate, variables: TemplateVariables): string {
    let result = template.template;
    
    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), value);
      }
    });

    return result;
  }

  /**
   * Convert timestamp to natural time reference
   */
  private getTimeReference(timestamp: Date): string {
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 2) return 'just now';
    if (diffHours < 12) return 'earlier today';
    if (diffHours < 24) return 'yesterday';
    if (diffHours < 48) return 'the other day';
    if (diffHours < 168) return 'this week';
    return 'recently';
  }

  /**
   * Extract main topic from memory content
   */
  private extractTopic(content: string): string {
    // Simple topic extraction - take key phrases from content
    const words = content.toLowerCase().split(' ');
    const keyTopics = ['bathroom', 'kitchen', 'money', 'training', 'battle', 'relationship', 'therapy', 'living', 'housing'];
    
    for (const topic of keyTopics) {
      if (content.toLowerCase().includes(topic)) {
        return topic;
      }
    }
    
    // Fallback to first few words
    return words.slice(0, 3).join(' ');
  }

  /**
   * Extract action from memory type and content
   */
  private extractAction(memory: CharacterMemory): string {
    const actionMap: { [key: string]: string } = {
      'conflict': 'arguing',
      'complaint': 'complaining',
      'celebration': 'bragging',
      'confession': 'admitting',
      'struggle': 'struggling'
    };

    return actionMap[memory.memoryType] || 'talking';
  }

  /**
   * Extract emotional event description
   */
  private extractEmotionalEvent(memory: CharacterMemory): string {
    const severity = memory.severity;
    const emotionalTags = memory.crossReferenceData?.comedyTags || [];
    
    if (emotionalTags.includes('dramatic')) return 'breakdown';
    if (severity === 'critical') return 'meltdown';
    if (severity === 'high') return 'outburst';
    if (emotionalTags.includes('embarrassing')) return 'moment';
    
    return 'situation';
  }

  /**
   * Extract past behavior description
   */
  private extractPastBehavior(memory: CharacterMemory): string {
    const behaviorMap: { [key: string]: string } = {
      'conflict': 'got all worked up',
      'confession': 'opened up',
      'complaint': 'vented',
      'celebration': 'celebrated',
      'drama': 'caused drama'
    };

    return behaviorMap[memory.memoryType] || 'made a scene';
  }

  /**
   * Extract severity description
   */
  private extractSeverity(memory: CharacterMemory): string {
    const severityMap: { [key: string]: string } = {
      'critical': 'dramatic',
      'high': 'emotional',
      'medium': 'worked up',
      'low': 'upset'
    };

    return severityMap[memory.severity] || 'intense';
  }

  /**
   * Get multiple comedy references for variety
   */
  public generateMultipleReferences(
    memories: CharacterMemory[],
    currentContext: string,
    currentTopic: string,
    maxReferences: number = 3
  ): string[] {
    const references: string[] = [];
    
    for (const memory of memories) {
      if (references.length >= maxReferences) break;
      
      const reference = this.generateComedyReference(memory, currentContext, currentTopic);
      if (reference) {
        references.push(reference);
      }
    }
    
    return references;
  }
}

export default ComedyTemplateService;
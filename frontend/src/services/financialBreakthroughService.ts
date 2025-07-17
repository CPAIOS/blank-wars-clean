// Financial Breakthrough Service
// Integrates with existing therapy system to provide financial healing breakthroughs
import { FinancialPersonality } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService } from './financialPsychologyService';
import FinancialTraumaRecoveryService from './financialTraumaRecoveryService';

export interface FinancialBreakthrough {
  id: string;
  characterId: string;
  therapistId: string;
  sessionId: string;
  breakthroughType: 'trauma_healing' | 'spiral_recovery' | 'trust_restoration' | 'pattern_recognition' | 'value_clarification';
  triggerInsight: string;
  healingEffect: {
    stressReduction: number;
    trustIncrease: number;
    decisionQualityImprovement: number;
    spiralRiskReduction: number;
    traumaHealingProgress: number;
  };
  therapistApproach: string;
  characterRevelation: string;
  integrationSteps: string[];
  timestamp: Date;
}

export interface TherapyBreakthroughContext {
  characterId: string;
  therapistId: string;
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  financialStressLevel: number;
  isInSpiral: boolean;
  spiralIntensity: number;
  traumaLevel: number;
  trustLevel: number;
  activeFinancialConflicts: string[];
  recentFinancialDecisions: any[];
  financialPersonality: FinancialPersonality;
}

export class FinancialBreakthroughService {
  private static instance: FinancialBreakthroughService;
  private eventBus: GameEventBus;
  private psychologyService: FinancialPsychologyService;
  private traumaRecoveryService: FinancialTraumaRecoveryService;
  private activeBreakthroughs: Map<string, FinancialBreakthrough[]> = new Map();

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.psychologyService = FinancialPsychologyService.getInstance();
    this.traumaRecoveryService = FinancialTraumaRecoveryService.getInstance();
  }

  static getInstance(): FinancialBreakthroughService {
    if (!FinancialBreakthroughService.instance) {
      FinancialBreakthroughService.instance = new FinancialBreakthroughService();
    }
    return FinancialBreakthroughService.instance;
  }

  /**
   * Generate breakthrough moment based on therapy context
   */
  async generateFinancialBreakthrough(
    context: TherapyBreakthroughContext,
    sessionId: string
  ): Promise<FinancialBreakthrough | null> {
    // Only generate breakthroughs during breakthrough stage
    if (context.sessionStage !== 'breakthrough') {
      return null;
    }

    const breakthroughType = this.determineBreakthroughType(context);
    const triggerInsight = this.generateTriggerInsight(context, breakthroughType);
    const healingEffect = this.calculateHealingEffect(context, breakthroughType);
    const therapistApproach = this.generateTherapistApproach(context, breakthroughType);
    const characterRevelation = this.generateCharacterRevelation(context, breakthroughType);
    const integrationSteps = this.generateIntegrationSteps(context, breakthroughType);

    const breakthrough: FinancialBreakthrough = {
      id: `financial_breakthrough_${Date.now()}_${context.characterId}`,
      characterId: context.characterId,
      therapistId: context.therapistId,
      sessionId,
      breakthroughType,
      triggerInsight,
      healingEffect,
      therapistApproach,
      characterRevelation,
      integrationSteps,
      timestamp: new Date()
    };

    // Store breakthrough
    const characterBreakthroughs = this.activeBreakthroughs.get(context.characterId) || [];
    characterBreakthroughs.push(breakthrough);
    this.activeBreakthroughs.set(context.characterId, characterBreakthroughs);

    // Apply healing effects
    await this.applyBreakthroughHealing(breakthrough, context);

    // Publish breakthrough event
    this.eventBus.publish(
      'financial_breakthrough_achieved',
      context.characterId,
      `Financial breakthrough: ${breakthroughType} - ${triggerInsight}`,
      { breakthrough, context }
    );

    return breakthrough;
  }

  /**
   * Determine what type of breakthrough is most needed
   */
  private determineBreakthroughType(context: TherapyBreakthroughContext): FinancialBreakthrough['breakthroughType'] {
    // Priority order based on severity
    if (context.traumaLevel > 70) {
      return 'trauma_healing';
    }
    
    if (context.isInSpiral && context.spiralIntensity > 60) {
      return 'spiral_recovery';
    }
    
    if (context.trustLevel < 30) {
      return 'trust_restoration';
    }
    
    if (context.recentFinancialDecisions.length > 5) {
      return 'pattern_recognition';
    }
    
    return 'value_clarification';
  }

  /**
   * Generate the key insight that triggers the breakthrough
   */
  private generateTriggerInsight(
    context: TherapyBreakthroughContext,
    breakthroughType: FinancialBreakthrough['breakthroughType']
  ): string {
    const personality = context.financialPersonality;
    
    switch (breakthroughType) {
      case 'trauma_healing':
        return this.generateTraumaHealingInsight(context, personality);
      
      case 'spiral_recovery':
        return this.generateSpiralRecoveryInsight(context, personality);
      
      case 'trust_restoration':
        return this.generateTrustRestorationInsight(context, personality);
      
      case 'pattern_recognition':
        return this.generatePatternRecognitionInsight(context, personality);
      
      case 'value_clarification':
        return this.generateValueClarificationInsight(context, personality);
      
      default:
        return 'You realize that your relationship with money reflects deeper patterns in your life';
    }
  }

  /**
   * Generate trauma healing insights
   */
  private generateTraumaHealingInsight(context: TherapyBreakthroughContext, personality: FinancialPersonality): string {
    const insights = [
      'You realize that your money fears stem from childhood feelings of insecurity and scarcity',
      'The connection between financial stress and your need for control becomes crystal clear',
      'You understand that your spending patterns are attempts to heal an old emotional wound',
      'The root of your financial anxiety traces back to times when you felt powerless and vulnerable',
      'You recognize that money has become a symbol for love, security, or self-worth in your subconscious'
    ];
    
    // Personalize based on personality traits
    if (personality.spendingStyle === 'impulsive') {
      return 'You realize that your impulsive spending is actually your inner child trying to heal old wounds of deprivation and fear';
    } else if (personality.spendingStyle === 'strategic') {
      return 'You understand that your need to control every financial detail stems from childhood trauma around unpredictability and chaos';
    }
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Generate spiral recovery insights
   */
  private generateSpiralRecoveryInsight(context: TherapyBreakthroughContext, personality: FinancialPersonality): string {
    const insights = [
      'You see clearly how each poor financial decision was driven by emotional states, not logic',
      'The spiral pattern becomes obvious - stress leads to poor decisions, which create more stress',
      'You realize that breaking the spiral requires addressing the emotions underneath, not just the decisions',
      'You understand that the spiral is a symptom of deeper patterns that can be changed',
      'The connection between your emotional state and decision quality becomes undeniable'
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Generate trust restoration insights
   */
  private generateTrustRestorationInsight(context: TherapyBreakthroughContext, personality: FinancialPersonality): string {
    const insights = [
      'You realize that your distrust of financial advice stems from past betrayals, not present reality',
      'The walls you built around money advice were protective, but now they\'re holding you back',
      'You understand that learning to trust again starts with trusting yourself first',
      'You see that your coach truly wants to help, and your resistance was fear-based',
      'The connection between financial trust and emotional vulnerability becomes clear'
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Generate pattern recognition insights
   */
  private generatePatternRecognitionInsight(context: TherapyBreakthroughContext, personality: FinancialPersonality): string {
    const insights = [
      'You suddenly see the repetitive patterns in your financial decisions across different situations',
      'The underlying emotional drivers behind your money choices become crystal clear',
      'You realize you\'ve been unconsciously recreating the same financial dynamics over and over',
      'The connection between your emotional state and financial behavior becomes undeniable',
      'You understand that changing the pattern requires changing the emotional triggers'
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Generate value clarification insights
   */
  private generateValueClarificationInsight(context: TherapyBreakthroughContext, personality: FinancialPersonality): string {
    const insights = [
      'You realize that your money decisions haven\'t been aligned with your true values',
      'The disconnect between what you say you want and how you spend becomes clear',
      'You understand what truly matters to you versus what you thought should matter',
      'Your authentic financial priorities emerge from beneath layers of external expectations',
      'The difference between genuine needs and conditioned wants becomes crystal clear'
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  /**
   * Calculate healing effects based on breakthrough type
   */
  private calculateHealingEffect(
    context: TherapyBreakthroughContext,
    breakthroughType: FinancialBreakthrough['breakthroughType']
  ): FinancialBreakthrough['healingEffect'] {
    const baseEffect = {
      stressReduction: 0,
      trustIncrease: 0,
      decisionQualityImprovement: 0,
      spiralRiskReduction: 0,
      traumaHealingProgress: 0
    };

    switch (breakthroughType) {
      case 'trauma_healing':
        return {
          stressReduction: 25 + Math.random() * 15, // 25-40% reduction
          trustIncrease: 15 + Math.random() * 10, // 15-25% increase
          decisionQualityImprovement: 20 + Math.random() * 10, // 20-30% improvement
          spiralRiskReduction: 30 + Math.random() * 20, // 30-50% reduction
          traumaHealingProgress: 40 + Math.random() * 20 // 40-60% progress
        };
      
      case 'spiral_recovery':
        return {
          stressReduction: 20 + Math.random() * 10, // 20-30% reduction
          trustIncrease: 10 + Math.random() * 10, // 10-20% increase
          decisionQualityImprovement: 30 + Math.random() * 15, // 30-45% improvement
          spiralRiskReduction: 50 + Math.random() * 25, // 50-75% reduction
          traumaHealingProgress: 15 + Math.random() * 10 // 15-25% progress
        };
      
      case 'trust_restoration':
        return {
          stressReduction: 15 + Math.random() * 10, // 15-25% reduction
          trustIncrease: 35 + Math.random() * 20, // 35-55% increase
          decisionQualityImprovement: 25 + Math.random() * 10, // 25-35% improvement
          spiralRiskReduction: 20 + Math.random() * 15, // 20-35% reduction
          traumaHealingProgress: 20 + Math.random() * 10 // 20-30% progress
        };
      
      case 'pattern_recognition':
        return {
          stressReduction: 10 + Math.random() * 10, // 10-20% reduction
          trustIncrease: 15 + Math.random() * 10, // 15-25% increase
          decisionQualityImprovement: 40 + Math.random() * 20, // 40-60% improvement
          spiralRiskReduction: 35 + Math.random() * 15, // 35-50% reduction
          traumaHealingProgress: 10 + Math.random() * 10 // 10-20% progress
        };
      
      case 'value_clarification':
        return {
          stressReduction: 20 + Math.random() * 10, // 20-30% reduction
          trustIncrease: 20 + Math.random() * 10, // 20-30% increase
          decisionQualityImprovement: 25 + Math.random() * 15, // 25-40% improvement
          spiralRiskReduction: 25 + Math.random() * 15, // 25-40% reduction
          traumaHealingProgress: 15 + Math.random() * 10 // 15-25% progress
        };
      
      default:
        return baseEffect;
    }
  }

  /**
   * Generate therapist approach based on therapist type and breakthrough
   */
  private generateTherapistApproach(
    context: TherapyBreakthroughContext,
    breakthroughType: FinancialBreakthrough['breakthroughType']
  ): string {
    const therapistId = context.therapistId;
    
    switch (therapistId) {
      case 'carl-jung':
        return this.generateJungianApproach(breakthroughType);
      
      case 'zxk14bw7':
        return this.generateAlienApproach(breakthroughType);
      
      case 'seraphina':
        return this.generateFairyApproach(breakthroughType);
      
      default:
        return 'Guides you through understanding your financial patterns and healing';
    }
  }

  /**
   * Generate Jung's therapeutic approach
   */
  private generateJungianApproach(breakthroughType: FinancialBreakthrough['breakthroughType']): string {
    const approaches = {
      trauma_healing: 'Jung helps you understand how your financial trauma connects to archetypal patterns of scarcity and abundance, guiding you to integrate your shadow relationship with money',
      spiral_recovery: 'Jung reveals how your financial spiral reflects the eternal cycle of destruction and renewal, helping you find the wisdom hidden in your repeated patterns',
      trust_restoration: 'Jung explores how your financial trust issues mirror archetypal fears of betrayal, guiding you to differentiate between past wounds and present reality',
      pattern_recognition: 'Jung illuminates how your financial patterns connect to deeper archetypal drives, helping you understand the unconscious motivations behind your money decisions',
      value_clarification: 'Jung helps you discover your authentic relationship with money by exploring how cultural conditioning has obscured your true values and desires'
    };
    
    return approaches[breakthroughType];
  }

  /**
   * Generate alien therapist approach
   */
  private generateAlienApproach(breakthroughType: FinancialBreakthrough['breakthroughType']): string {
    const approaches = {
      trauma_healing: 'Zxk14bW^7 uses advanced psychological algorithms to help you process financial trauma, applying cosmic healing techniques from seventeen different galaxies',
      spiral_recovery: 'Zxk14bW^7 analyzes your spiral pattern with quantum precision, implementing strategic intervention protocols to break the destructive cycle',
      trust_restoration: 'Zxk14bW^7 recalibrates your trust matrices using inter-galactic wisdom about advisor relationships, helping you distinguish between logical and emotional responses',
      pattern_recognition: 'Zxk14bW^7 maps your financial behavioral patterns using multi-dimensional analysis, revealing the logical inconsistencies that create suffering',
      value_clarification: 'Zxk14bW^7 helps you identify your core values using universal consciousness principles, separating authentic desires from cultural programming'
    };
    
    return approaches[breakthroughType];
  }

  /**
   * Generate fairy godmother approach
   */
  private generateFairyApproach(breakthroughType: FinancialBreakthrough['breakthroughType']): string {
    const approaches = {
      trauma_healing: 'Seraphina wraps you in healing fairy magic, helping your wounded heart understand that your money fears are just scared inner child parts that need love and comfort',
      spiral_recovery: 'Seraphina uses gentle fairy magic to break the spiral spell, helping you see that each mistake was just your heart trying to find its way back to safety',
      trust_restoration: 'Seraphina helps heal your trust wounds with magical fairy dust, showing you that your heart is ready to open again to guidance and support',
      pattern_recognition: 'Seraphina illuminates your money patterns with fairy light, helping you see the beautiful truth behind what looked like ugly behavior',
      value_clarification: 'Seraphina helps you remember your heart\'s true desires about money and abundance, clearing away the cobwebs of confusion with gentle fairy magic'
    };
    
    return approaches[breakthroughType];
  }

  /**
   * Generate character revelation
   */
  private generateCharacterRevelation(
    context: TherapyBreakthroughContext,
    breakthroughType: FinancialBreakthrough['breakthroughType']
  ): string {
    const revelations = {
      trauma_healing: 'I finally understand that my money issues aren\'t about money at all - they\'re about the deeper wounds I\'ve been carrying. I can heal this.',
      spiral_recovery: 'I see it now - every poor decision was driven by fear and stress. I can break this pattern by addressing the emotions underneath.',
      trust_restoration: 'I realize that my resistance to advice was about protecting myself from past hurts. I\'m ready to trust again, starting with myself.',
      pattern_recognition: 'The patterns are so clear now - I\'ve been unconsciously recreating the same situations over and over. I can choose differently.',
      value_clarification: 'I know what truly matters to me now. My money decisions can finally align with my authentic values instead of external expectations.'
    };
    
    return revelations[breakthroughType];
  }

  /**
   * Generate integration steps for the breakthrough
   */
  private generateIntegrationSteps(
    context: TherapyBreakthroughContext,
    breakthroughType: FinancialBreakthrough['breakthroughType']
  ): string[] {
    const steps = {
      trauma_healing: [
        'Practice self-compassion when making financial decisions',
        'Notice when financial stress triggers old emotional wounds',
        'Develop new coping strategies for financial anxiety',
        'Work with coach to create a supportive financial environment',
        'Continue processing underlying trauma with therapist support'
      ],
      spiral_recovery: [
        'Implement emotional check-ins before major financial decisions',
        'Practice pause-and-breathe techniques during financial stress',
        'Develop early warning signs for spiral patterns',
        'Create accountability systems with coach support',
        'Build new neural pathways through positive financial experiences'
      ],
      trust_restoration: [
        'Start with small steps in accepting financial guidance',
        'Practice discernment between healthy and unhealthy advice',
        'Develop internal trust through successful small decisions',
        'Build transparent communication with financial coach',
        'Continue healing trust wounds through therapeutic support'
      ],
      pattern_recognition: [
        'Keep a decision journal to track patterns and triggers',
        'Practice identifying emotional states before financial choices',
        'Develop alternative responses to familiar triggers',
        'Create new decision-making frameworks aligned with insights',
        'Regularly review and adjust patterns with coach guidance'
      ],
      value_clarification: [
        'Define clear financial values and priorities',
        'Align spending and saving with authentic values',
        'Practice saying no to decisions that don\'t match values',
        'Create value-based financial goals and systems',
        'Regularly review and refine values as they evolve'
      ]
    };
    
    return steps[breakthroughType];
  }

  /**
   * Apply breakthrough healing effects to character
   */
  private async applyBreakthroughHealing(
    breakthrough: FinancialBreakthrough,
    context: TherapyBreakthroughContext
  ): Promise<void> {
    const effect = breakthrough.healingEffect;
    
    // Apply trauma healing if applicable
    if (effect.traumaHealingProgress > 0) {
      await this.traumaRecoveryService.applyTherapeuticHealing(
        context.characterId,
        breakthrough.therapistId,
        effect.traumaHealingProgress,
        breakthrough.breakthroughType
      );
    }
    
    // Publish healing events for other systems to respond
    this.eventBus.publish(
      'financial_breakthrough_healing',
      context.characterId,
      `Financial breakthrough healing: ${breakthrough.breakthroughType}`,
      {
        characterId: context.characterId,
        healingEffect: effect,
        breakthroughType: breakthrough.breakthroughType
      }
    );
  }

  /**
   * Get character's breakthrough history
   */
  getCharacterBreakthroughs(characterId: string): FinancialBreakthrough[] {
    return this.activeBreakthroughs.get(characterId) || [];
  }

  /**
   * Generate breakthrough prompts for therapy sessions
   */
  generateBreakthroughPrompts(
    context: TherapyBreakthroughContext
  ): {
    therapistPrompt: string;
    characterPrompt: string;
    breakthroughTriggers: string[];
  } {
    const breakthroughType = this.determineBreakthroughType(context);
    const therapistId = context.therapistId;
    
    const therapistPrompts = {
      'carl-jung': {
        trauma_healing: 'Guide the character to understand how their financial trauma connects to archetypal patterns. Help them see the universal nature of their struggle.',
        spiral_recovery: 'Help the character understand their spiral as part of the eternal cycle of destruction and renewal. Find the wisdom in their repeated patterns.',
        trust_restoration: 'Explore how financial trust issues mirror archetypal fears. Help differentiate between past wounds and present reality.',
        pattern_recognition: 'Illuminate how financial patterns connect to deeper archetypal drives. Reveal unconscious motivations.',
        value_clarification: 'Help discover authentic relationship with money by exploring how cultural conditioning has obscured true values.'
      },
      'zxk14bw7': {
        trauma_healing: 'Use advanced psychological algorithms to process financial trauma. Apply cosmic healing techniques from galactic experience.',
        spiral_recovery: 'Analyze spiral pattern with quantum precision. Implement strategic intervention protocols to break the cycle.',
        trust_restoration: 'Recalibrate trust matrices using inter-galactic wisdom. Help distinguish logical from emotional responses.',
        pattern_recognition: 'Map financial behavioral patterns using multi-dimensional analysis. Reveal logical inconsistencies.',
        value_clarification: 'Identify core values using universal consciousness principles. Separate authentic desires from programming.'
      },
      'seraphina': {
        trauma_healing: 'Wrap in healing fairy magic. Help wounded heart understand that money fears are scared inner child parts needing love.',
        spiral_recovery: 'Use gentle fairy magic to break spiral spell. Show that mistakes were heart trying to find safety.',
        trust_restoration: 'Heal trust wounds with magical fairy dust. Show heart is ready to open to guidance.',
        pattern_recognition: 'Illuminate money patterns with fairy light. Help see beautiful truth behind seeming ugly behavior.',
        value_clarification: 'Help remember heart\'s true desires about money. Clear confusion cobwebs with gentle fairy magic.'
      }
    };
    
    const characterPrompts = {
      trauma_healing: 'You\'re ready to explore the deeper wounds that your money fears have been protecting. You feel safe enough to be vulnerable.',
      spiral_recovery: 'You can see your spiral pattern clearly now and are ready to understand what\'s really driving it.',
      trust_restoration: 'You recognize that your distrust has been a protection, but you\'re ready to open up to guidance again.',
      pattern_recognition: 'You\'re prepared to see the patterns you\'ve been unconsciously repeating in your financial decisions.',
      value_clarification: 'You\'re ready to discover what truly matters to you beneath all the external expectations and pressures.'
    };
    
    const breakthroughTriggers = [
      'A moment of deep emotional safety in the therapeutic relationship',
      'Recognition of a pattern that suddenly makes perfect sense',
      'Connection between current financial stress and past emotional wounds',
      'Realization that the same dynamics play out in multiple areas of life',
      'Understanding that you have the power to choose differently'
    ];
    
    return {
      therapistPrompt: therapistPrompts[therapistId]?.[breakthroughType] || 'Guide the character toward financial healing and insight.',
      characterPrompt: characterPrompts[breakthroughType],
      breakthroughTriggers
    };
  }
}

export default FinancialBreakthroughService;
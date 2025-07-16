// Luxury Purchase Effect System
// Implements immediate happiness boost with realistic decay mechanics based on personality

import { FinancialPersonality, FinancialDecision } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService } from './financialPsychologyService';

export interface LuxuryPurchase {
  id: string;
  characterId: string;
  amount: number;
  category: 'electronics' | 'clothing' | 'jewelry' | 'vehicle' | 'entertainment' | 'travel' | 'food' | 'other';
  description: string;
  purchaseDate: Date;
  initialHappinessBoost: number; // 0-100, immediate boost
  currentHappinessEffect: number; // Current ongoing effect
  adaptationRate: number; // How quickly the effect decays (based on personality)
  prestigeValue: number; // Social status component
  practicalValue: number; // Utility component
  expectedLifespan: number; // Days until effect fully decays
  isActiveEffect: boolean; // Whether still providing benefits
}

export interface LuxuryCategory {
  name: string;
  baseHappinessMultiplier: number;
  adaptationSpeed: 'very_fast' | 'fast' | 'moderate' | 'slow' | 'very_slow';
  prestigeComponent: number; // 0-1, how much is about status
  practicalComponent: number; // 0-1, how much is about utility
  typicalLifespan: number; // Base days before full adaptation
}

export class LuxuryPurchaseService {
  private static instance: LuxuryPurchaseService;
  private eventBus: GameEventBus;
  private financialPsychology: FinancialPsychologyService;
  private activeLuxuryEffects: Map<string, LuxuryPurchase[]> = new Map(); // characterId -> purchases

  private luxuryCategories: Record<string, LuxuryCategory> = {
    electronics: {
      name: 'Electronics',
      baseHappinessMultiplier: 1.2,
      adaptationSpeed: 'fast',
      prestigeComponent: 0.3,
      practicalComponent: 0.7,
      typicalLifespan: 90 // 3 months before novelty wears off
    },
    clothing: {
      name: 'Designer Clothing',
      baseHappinessMultiplier: 1.0,
      adaptationSpeed: 'moderate',
      prestigeComponent: 0.8,
      practicalComponent: 0.2,
      typicalLifespan: 60 // 2 months
    },
    jewelry: {
      name: 'Jewelry',
      baseHappinessMultiplier: 0.8,
      adaptationSpeed: 'slow',
      prestigeComponent: 0.9,
      practicalComponent: 0.1,
      typicalLifespan: 180 // 6 months
    },
    vehicle: {
      name: 'Vehicle',
      baseHappinessMultiplier: 1.5,
      adaptationSpeed: 'slow',
      prestigeComponent: 0.6,
      practicalComponent: 0.4,
      typicalLifespan: 365 // 1 year
    },
    entertainment: {
      name: 'Entertainment',
      baseHappinessMultiplier: 1.3,
      adaptationSpeed: 'very_fast',
      prestigeComponent: 0.2,
      practicalComponent: 0.8,
      typicalLifespan: 30 // 1 month
    },
    travel: {
      name: 'Luxury Travel',
      baseHappinessMultiplier: 1.8,
      adaptationSpeed: 'moderate',
      prestigeComponent: 0.5,
      practicalComponent: 0.5,
      typicalLifespan: 120 // 4 months of memories
    },
    food: {
      name: 'Fine Dining',
      baseHappinessMultiplier: 1.1,
      adaptationSpeed: 'very_fast',
      prestigeComponent: 0.4,
      practicalComponent: 0.6,
      typicalLifespan: 7 // 1 week
    },
    other: {
      name: 'Other Luxury',
      baseHappinessMultiplier: 1.0,
      adaptationSpeed: 'moderate',
      prestigeComponent: 0.5,
      practicalComponent: 0.5,
      typicalLifespan: 90
    }
  };

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.financialPsychology = FinancialPsychologyService.getInstance();
    
    // Start decay processing for all active luxury effects
    this.startDecayProcessor();
  }

  static getInstance(): LuxuryPurchaseService {
    if (!LuxuryPurchaseService.instance) {
      LuxuryPurchaseService.instance = new LuxuryPurchaseService();
    }
    return LuxuryPurchaseService.instance;
  }

  /**
   * Process a luxury purchase and calculate immediate and ongoing effects
   */
  async processLuxuryPurchase(
    characterId: string,
    amount: number,
    category: keyof typeof this.luxuryCategories,
    description: string,
    financialPersonality: FinancialPersonality
  ): Promise<LuxuryPurchase> {
    
    const categoryData = this.luxuryCategories[category];
    
    // Calculate initial happiness boost based on personality and amount
    const baseHappiness = Math.min(50, (amount / 1000) * 10); // $1k = 10 happiness, max 50
    const personalityMultiplier = this.getPersonalityHappinessMultiplier(financialPersonality, category);
    const initialHappinessBoost = baseHappiness * personalityMultiplier * categoryData.baseHappinessMultiplier;
    
    // Calculate adaptation rate based on personality
    const adaptationRate = this.calculateAdaptationRate(financialPersonality, categoryData);
    
    // Calculate prestige and practical values
    const prestigeValue = (amount / 10000) * categoryData.prestigeComponent * 100; // Max 100 prestige
    const practicalValue = categoryData.practicalComponent * 50; // Base practical value
    
    // Calculate expected lifespan based on personality
    const expectedLifespan = this.calculateExpectedLifespan(financialPersonality, categoryData);
    
    const luxuryPurchase: LuxuryPurchase = {
      id: `luxury_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characterId,
      amount,
      category,
      description,
      purchaseDate: new Date(),
      initialHappinessBoost,
      currentHappinessEffect: initialHappinessBoost,
      adaptationRate,
      prestigeValue,
      practicalValue,
      expectedLifespan,
      isActiveEffect: true
    };
    
    // Add to active effects
    if (!this.activeLuxuryEffects.has(characterId)) {
      this.activeLuxuryEffects.set(characterId, []);
    }
    this.activeLuxuryEffects.get(characterId)!.push(luxuryPurchase);
    
    // Publish immediate happiness event
    await this.eventBus.publishEvent({
      type: 'luxury_purchase',
      source: 'marketplace',
      primaryCharacterId: characterId,
      severity: amount > 5000 ? 'high' : amount > 1000 ? 'medium' : 'low',
      category: 'financial',
      description: `Made luxury purchase: ${description} for $${amount.toLocaleString()}`,
      metadata: {
        purchaseId: luxuryPurchase.id,
        amount,
        category,
        initialHappinessBoost,
        adaptationRate,
        expectedLifespan
      },
      tags: ['luxury', 'spending', 'happiness'],
      emotionalImpact: [{
        characterId,
        impact: 'positive',
        intensity: Math.min(10, Math.ceil(initialHappinessBoost / 10))
      }]
    });
    
    return luxuryPurchase;
  }

  /**
   * Get current total happiness effect from all active luxury purchases
   */
  getCurrentLuxuryHappiness(characterId: string): {
    totalHappiness: number;
    prestigeBonus: number;
    practicalBonus: number;
    activePurchases: LuxuryPurchase[];
  } {
    const purchases = this.activeLuxuryEffects.get(characterId) || [];
    const activePurchases = purchases.filter(p => p.isActiveEffect);
    
    const totalHappiness = activePurchases.reduce((sum, p) => sum + p.currentHappinessEffect, 0);
    const prestigeBonus = activePurchases.reduce((sum, p) => sum + p.prestigeValue, 0);
    const practicalBonus = activePurchases.reduce((sum, p) => sum + p.practicalValue, 0);
    
    return {
      totalHappiness: Math.min(100, totalHappiness), // Cap at 100
      prestigeBonus: Math.min(100, prestigeBonus),
      practicalBonus: Math.min(100, practicalBonus),
      activePurchases
    };
  }

  /**
   * Calculate personality-based happiness multiplier for different categories
   */
  private getPersonalityHappinessMultiplier(
    personality: FinancialPersonality,
    category: keyof typeof this.luxuryCategories
  ): number {
    let multiplier = 1.0;
    
    // Base luxury desire effect
    multiplier *= (0.5 + personality.luxuryDesire / 100);
    
    // Category-specific personality effects
    switch (category) {
      case 'electronics':
        if (personality.spendingStyle === 'strategic') multiplier *= 1.2;
        break;
      case 'clothing':
      case 'jewelry':
        if (personality.moneyMotivations.includes('status')) multiplier *= 1.4;
        break;
      case 'vehicle':
        if (personality.spendingStyle === 'impulsive') multiplier *= 1.3;
        if (personality.moneyMotivations.includes('power')) multiplier *= 1.2;
        break;
      case 'travel':
        if (personality.moneyMotivations.includes('experience')) multiplier *= 1.5;
        break;
      case 'entertainment':
        if (personality.spendingStyle === 'impulsive') multiplier *= 1.2;
        break;
    }
    
    return multiplier;
  }

  /**
   * Calculate how quickly a character adapts to luxury based on personality
   */
  private calculateAdaptationRate(
    personality: FinancialPersonality,
    categoryData: LuxuryCategory
  ): number {
    let baseRate = 1.0;
    
    // Adaptation speed modifiers based on category
    switch (categoryData.adaptationSpeed) {
      case 'very_fast': baseRate = 2.0; break;
      case 'fast': baseRate = 1.5; break;
      case 'moderate': baseRate = 1.0; break;
      case 'slow': baseRate = 0.7; break;
      case 'very_slow': baseRate = 0.5; break;
    }
    
    // Personality modifiers
    if (personality.spendingStyle === 'impulsive') {
      baseRate *= 1.3; // Impulsive people adapt faster (get bored quicker)
    }
    
    if (personality.luxuryDesire > 80) {
      baseRate *= 1.2; // High luxury desire = faster adaptation
    }
    
    if (personality.financialWisdom > 70) {
      baseRate *= 0.8; // Wise people appreciate things longer
    }
    
    return baseRate;
  }

  /**
   * Calculate expected lifespan of luxury effect based on personality
   */
  private calculateExpectedLifespan(
    personality: FinancialPersonality,
    categoryData: LuxuryCategory
  ): number {
    let lifespan = categoryData.typicalLifespan;
    
    // Personality adjustments
    if (personality.spendingStyle === 'conservative') {
      lifespan *= 1.5; // Conservative people appreciate things longer
    }
    
    if (personality.luxuryDesire < 30) {
      lifespan *= 0.7; // Low luxury desire = shorter appreciation
    }
    
    if (personality.financialWisdom > 80) {
      lifespan *= 1.3; // Wise people get more lasting satisfaction
    }
    
    return Math.round(lifespan);
  }

  /**
   * Start the decay processor that runs periodically to update luxury effects
   */
  private startDecayProcessor(): void {
    setInterval(() => {
      this.processLuxuryDecay();
    }, 60000); // Process every minute
  }

  /**
   * Process decay for all active luxury effects
   */
  private async processLuxuryDecay(): Promise<void> {
    for (const [characterId, purchases] of this.activeLuxuryEffects.entries()) {
      for (const purchase of purchases) {
        if (!purchase.isActiveEffect) continue;
        
        const daysSincePurchase = (Date.now() - purchase.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
        const decayProgress = Math.min(1, daysSincePurchase / purchase.expectedLifespan);
        
        // Exponential decay curve: happiness = initial * e^(-rate * time)
        const decayFactor = Math.exp(-purchase.adaptationRate * decayProgress);
        purchase.currentHappinessEffect = purchase.initialHappinessBoost * decayFactor;
        
        // Deactivate if effect is very low
        if (purchase.currentHappinessEffect < 1) {
          purchase.isActiveEffect = false;
          
          // Publish adaptation complete event
          await this.eventBus.publishEvent({
            type: 'luxury_purchase',
            source: 'marketplace',
            primaryCharacterId: characterId,
            severity: 'low',
            category: 'financial',
            description: `Fully adapted to luxury purchase: ${purchase.description}`,
            metadata: {
              purchaseId: purchase.id,
              originalAmount: purchase.amount,
              daysSincePurchase: Math.round(daysSincePurchase),
              adaptationType: 'complete'
            },
            tags: ['luxury', 'adaptation', 'psychology']
          });
        }
        // Publish significant decay milestones
        else if (decayProgress > 0.5 && purchase.currentHappinessEffect < purchase.initialHappinessBoost * 0.5) {
          // 50% decay milestone
          await this.eventBus.publishEvent({
            type: 'luxury_purchase',
            source: 'marketplace',
            primaryCharacterId: characterId,
            severity: 'low',
            category: 'financial',
            description: `Novelty wearing off for luxury purchase: ${purchase.description}`,
            metadata: {
              purchaseId: purchase.id,
              decayProgress: Math.round(decayProgress * 100),
              remainingEffect: Math.round(purchase.currentHappinessEffect),
              adaptationType: 'partial'
            },
            tags: ['luxury', 'adaptation', 'psychology']
          });
        }
      }
    }
  }

  /**
   * Get luxury purchase history for a character
   */
  getLuxuryHistory(characterId: string): LuxuryPurchase[] {
    return this.activeLuxuryEffects.get(characterId) || [];
  }

  /**
   * Calculate luxury addiction risk based on recent purchases
   */
  calculateLuxuryAddictionRisk(characterId: string): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  } {
    const purchases = this.activeLuxuryEffects.get(characterId) || [];
    const recentPurchases = purchases.filter(p => {
      const daysSince = (Date.now() - p.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Last 30 days
    });
    
    const totalSpent = recentPurchases.reduce((sum, p) => sum + p.amount, 0);
    const purchaseFrequency = recentPurchases.length;
    const averageSpending = totalSpent / Math.max(1, purchaseFrequency);
    
    const factors: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;
    
    // Frequency risk
    if (purchaseFrequency > 10) {
      riskScore += 30;
      factors.push('Very high purchase frequency');
      recommendations.push('Consider implementing purchase delays');
    } else if (purchaseFrequency > 5) {
      riskScore += 15;
      factors.push('High purchase frequency');
    }
    
    // Spending amount risk
    if (totalSpent > 50000) {
      riskScore += 25;
      factors.push('Extremely high spending amounts');
      recommendations.push('Set strict monthly luxury budgets');
    } else if (totalSpent > 20000) {
      riskScore += 15;
      factors.push('High spending amounts');
    }
    
    // Average purchase size risk
    if (averageSpending > 5000) {
      riskScore += 20;
      factors.push('Large individual purchases');
      recommendations.push('Focus on experiences over material goods');
    }
    
    // Pattern analysis
    const recentDays = recentPurchases.map(p => {
      const days = (Date.now() - p.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      return Math.floor(days);
    });
    
    const uniqueDays = new Set(recentDays);
    if (uniqueDays.size < recentPurchases.length * 0.7) {
      riskScore += 15;
      factors.push('Cluster purchasing patterns');
      recommendations.push('Practice mindful spending techniques');
    }
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 20) riskLevel = 'low';
    else if (riskScore < 40) riskLevel = 'medium';
    else if (riskScore < 60) riskLevel = 'high';
    else riskLevel = 'critical';
    
    return { riskLevel, factors, recommendations };
  }
}

export default LuxuryPurchaseService;
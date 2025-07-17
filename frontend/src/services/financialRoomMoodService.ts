// Financial Room Mood Integration Service
// Connects financial decisions and stress to room atmosphere and character happiness
import { FinancialPersonality, FinancialDecision } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService } from './financialPsychologyService';
import LuxuryPurchaseService from './luxuryPurchaseService';
import { getCharacterHappiness } from './characterHappinessService';

export interface FinancialRoomEffect {
  characterId: string;
  roomId: string;
  effectType: 'stress_reduction' | 'luxury_boost' | 'financial_anxiety' | 'room_investment_mood';
  magnitude: number; // -2 to +2 happiness modifier
  duration: number; // in hours
  description: string;
  timestamp: Date;
}

export interface RoomFinancialMoodState {
  roomId: string;
  baseHappiness: number;
  financialStressModifier: number;
  luxuryBoostModifier: number;
  roomInvestmentModifier: number;
  conflictFinancialModifier: number;
  totalFinancialMoodEffect: number;
}

export class FinancialRoomMoodService {
  private static instance: FinancialRoomMoodService;
  private eventBus: GameEventBus;
  private psychologyService: FinancialPsychologyService;
  private luxuryService: LuxuryPurchaseService;
  private activeEffects: Map<string, FinancialRoomEffect[]> = new Map();

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.psychologyService = FinancialPsychologyService.getInstance();
    this.luxuryService = LuxuryPurchaseService.getInstance();
    this.setupEventListeners();
  }

  static getInstance(): FinancialRoomMoodService {
    if (!FinancialRoomMoodService.instance) {
      FinancialRoomMoodService.instance = new FinancialRoomMoodService();
    }
    return FinancialRoomMoodService.instance;
  }

  /**
   * Setup event listeners for financial events that affect room mood
   */
  private setupEventListeners(): void {
    // Listen for financial decisions
    this.eventBus.subscribe('financial_decision_made', this.handleFinancialDecision.bind(this));
    
    // Listen for luxury purchases
    this.eventBus.subscribe('luxury_purchase_made', this.handleLuxuryPurchase.bind(this));
    
    // Listen for financial stress changes
    this.eventBus.subscribe('financial_stress_change', this.handleStressChange.bind(this));
    
    // Listen for room investment decisions
    this.eventBus.subscribe('room_investment_made', this.handleRoomInvestment.bind(this));
    
    // Listen for financial conflicts
    this.eventBus.subscribe('financial_conflict_created', this.handleFinancialConflict.bind(this));
  }

  /**
   * Calculate enhanced character happiness including financial effects
   */
  calculateFinancialEnhancedHappiness(
    characterId: string,
    roomId: string,
    headquarters: any,
    currentWallet: number,
    monthlyEarnings: number,
    financialPersonality: FinancialPersonality
  ): {
    baseHappiness: number;
    financialMoodModifier: number;
    totalHappiness: number;
    moodFactors: {
      financialStress: number;
      luxuryBoost: number;
      roomInvestments: number;
      financialConflicts: number;
    };
  } {
    // Get base happiness from existing system
    const baseHappinessResult = getCharacterHappiness(characterId, roomId, headquarters);
    const baseHappiness = baseHappinessResult.level;

    // Calculate financial stress impact on room mood
    const stressData = this.psychologyService.calculateFinancialStress(
      characterId, currentWallet, monthlyEarnings, [], financialPersonality
    );
    
    // Financial stress reduces room happiness effectiveness
    const stressModifier = this.calculateStressRoomMoodEffect(stressData.totalStress);
    
    // Luxury purchases can boost room mood temporarily
    const luxuryBoost = this.calculateLuxuryRoomMoodBoost(characterId);
    
    // Room investments affect mood based on outcomes
    const roomInvestmentModifier = this.calculateRoomInvestmentMoodEffect(characterId, roomId);
    
    // Financial conflicts in shared rooms
    const conflictModifier = this.calculateFinancialConflictRoomEffect(roomId, headquarters);
    
    const totalFinancialModifier = stressModifier + luxuryBoost + roomInvestmentModifier + conflictModifier;
    const finalHappiness = Math.max(1, Math.min(5, baseHappiness + totalFinancialModifier));

    return {
      baseHappiness,
      financialMoodModifier: totalFinancialModifier,
      totalHappiness: finalHappiness,
      moodFactors: {
        financialStress: stressModifier,
        luxuryBoost: luxuryBoost,
        roomInvestments: roomInvestmentModifier,
        financialConflicts: conflictModifier
      }
    };
  }

  /**
   * Calculate how financial stress affects room mood
   */
  private calculateStressRoomMoodEffect(stressLevel: number): number {
    if (stressLevel < 20) return 0;           // No effect at low stress
    if (stressLevel < 40) return -0.5;        // Minor mood reduction
    if (stressLevel < 60) return -1;          // Moderate mood reduction
    if (stressLevel < 80) return -1.5;        // Significant mood reduction
    return -2;                                // Maximum mood penalty
  }

  /**
   * Calculate luxury purchase mood boost in room context
   */
  private calculateLuxuryRoomMoodBoost(characterId: string): number {
    const luxuryData = this.luxuryService.getCurrentLuxuryHappiness(characterId);
    
    // Room-specific luxury effects (furniture, decoration, etc.)
    const roomLuxuries = luxuryData.activePurchases.filter(purchase => 
      ['home_decor', 'furniture', 'electronics', 'appliances'].includes(purchase.category)
    );
    
    if (roomLuxuries.length === 0) return 0;
    
    // Calculate room luxury boost
    const totalBoost = roomLuxuries.reduce((sum, luxury) => sum + luxury.currentHappiness, 0);
    
    // Convert to room mood scale (-2 to +2)
    return Math.min(2, totalBoost / 25); // 50 points = +2 happiness
  }

  /**
   * Calculate room investment mood effects
   */
  private calculateRoomInvestmentMoodEffect(characterId: string, roomId: string): number {
    const effects = this.getActiveEffects(characterId);
    const roomInvestmentEffects = effects.filter(
      effect => effect.roomId === roomId && effect.effectType === 'room_investment_mood'
    );
    
    return roomInvestmentEffects.reduce((sum, effect) => sum + effect.magnitude, 0);
  }

  /**
   * Calculate financial conflict effects on room mood
   */
  private calculateFinancialConflictRoomEffect(roomId: string, headquarters: any): number {
    const room = headquarters?.rooms?.find(r => r.id === roomId);
    if (!room || room.assignedCharacters.length < 2) return 0;
    
    // Check for financial conflicts between roommates
    const effects = this.getActiveEffectsForRoom(roomId);
    const conflictEffects = effects.filter(effect => effect.effectType === 'financial_anxiety');
    
    return Math.max(-1.5, conflictEffects.reduce((sum, effect) => sum + effect.magnitude, 0));
  }

  /**
   * Handle financial decision events
   */
  private async handleFinancialDecision(data: any): Promise<void> {
    const { characterId, decision, outcome } = data;
    
    // Poor financial decisions create room mood anxiety
    if (outcome === 'negative' && decision.amount > 1000) {
      await this.addFinancialRoomEffect({
        characterId,
        roomId: 'current', // Will be resolved to actual room
        effectType: 'financial_anxiety',
        magnitude: -0.5,
        duration: 48, // 48 hours
        description: `Financial anxiety from poor ${decision.type} decision affecting room mood`,
        timestamp: new Date()
      });
    }
    
    // Very positive decisions boost confidence and room mood
    if (outcome === 'positive' && decision.amount > 2000) {
      await this.addFinancialRoomEffect({
        characterId,
        roomId: 'current',
        effectType: 'stress_reduction',
        magnitude: 0.5,
        duration: 72, // 72 hours
        description: `Financial confidence boost from successful ${decision.type} decision`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle luxury purchase events
   */
  private async handleLuxuryPurchase(data: any): Promise<void> {
    const { characterId, purchase } = data;
    
    // Room-related luxury purchases boost room mood
    if (['home_decor', 'furniture', 'electronics'].includes(purchase.category)) {
      const boostAmount = Math.min(1.5, purchase.amount / 3000); // Scale with price
      
      await this.addFinancialRoomEffect({
        characterId,
        roomId: 'current',
        effectType: 'luxury_boost',
        magnitude: boostAmount,
        duration: purchase.durationHours || 168, // 1 week default
        description: `Room mood boost from luxury ${purchase.category} purchase`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle financial stress change events
   */
  private async handleStressChange(data: any): Promise<void> {
    const { characterId, oldStress, newStress } = data;
    
    // Significant stress increases affect room mood
    const stressIncrease = newStress - oldStress;
    if (stressIncrease > 20) {
      await this.addFinancialRoomEffect({
        characterId,
        roomId: 'current',
        effectType: 'financial_anxiety',
        magnitude: -Math.min(1, stressIncrease / 40),
        duration: 24, // 24 hours
        description: `Room mood affected by increased financial stress`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle room investment events
   */
  private async handleRoomInvestment(data: any): Promise<void> {
    const { characterId, roomId, investment, outcome } = data;
    
    const magnitude = outcome === 'positive' ? 
      Math.min(1.5, investment.amount / 2000) : 
      -Math.min(1, investment.amount / 3000);
    
    await this.addFinancialRoomEffect({
      characterId,
      roomId,
      effectType: 'room_investment_mood',
      magnitude,
      duration: outcome === 'positive' ? 336 : 168, // 2 weeks positive, 1 week negative
      description: `Room mood ${outcome === 'positive' ? 'boost' : 'penalty'} from room investment outcome`,
      timestamp: new Date()
    });
  }

  /**
   * Handle financial conflict events
   */
  private async handleFinancialConflict(data: any): Promise<void> {
    const { roomId, charactersInvolved, severity } = data;
    
    const magnitude = {
      low: -0.3,
      medium: -0.6,
      high: -1,
      critical: -1.5
    }[severity] || -0.5;
    
    // Apply to all characters in the room
    for (const characterId of charactersInvolved) {
      await this.addFinancialRoomEffect({
        characterId,
        roomId,
        effectType: 'financial_anxiety',
        magnitude,
        duration: 96, // 4 days
        description: `Room tension from financial conflict between roommates`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Add a financial room effect
   */
  private async addFinancialRoomEffect(effect: Omit<FinancialRoomEffect, 'id'>): Promise<void> {
    const effectWithId: FinancialRoomEffect = {
      ...effect,
      characterId: effect.characterId
    };
    
    const characterEffects = this.activeEffects.get(effect.characterId) || [];
    characterEffects.push(effectWithId);
    this.activeEffects.set(effect.characterId, characterEffects);
    
    // Publish event for tracking
    this.eventBus.publish(
      'financial_room_mood_effect',
      effect.characterId,
      effect.description,
      { effect: effectWithId }
    );
  }

  /**
   * Get active effects for a character
   */
  private getActiveEffects(characterId: string): FinancialRoomEffect[] {
    const effects = this.activeEffects.get(characterId) || [];
    const now = new Date();
    
    // Filter out expired effects
    const activeEffects = effects.filter(effect => {
      const expiryTime = new Date(effect.timestamp.getTime() + effect.duration * 60 * 60 * 1000);
      return now < expiryTime;
    });
    
    this.activeEffects.set(characterId, activeEffects);
    return activeEffects;
  }

  /**
   * Get active effects for a room
   */
  private getActiveEffectsForRoom(roomId: string): FinancialRoomEffect[] {
    const allEffects: FinancialRoomEffect[] = [];
    
    for (const [characterId, effects] of this.activeEffects) {
      const activeEffects = this.getActiveEffects(characterId);
      const roomEffects = activeEffects.filter(effect => effect.roomId === roomId);
      allEffects.push(...roomEffects);
    }
    
    return allEffects;
  }

  /**
   * Get room financial mood state summary
   */
  getRoomFinancialMoodState(roomId: string, headquarters: any): RoomFinancialMoodState {
    const room = headquarters?.rooms?.find(r => r.id === roomId);
    if (!room) {
      return {
        roomId,
        baseHappiness: 3,
        financialStressModifier: 0,
        luxuryBoostModifier: 0,
        roomInvestmentModifier: 0,
        conflictFinancialModifier: 0,
        totalFinancialMoodEffect: 0
      };
    }

    const roomEffects = this.getActiveEffectsForRoom(roomId);
    
    const financialStressModifier = roomEffects
      .filter(e => e.effectType === 'financial_anxiety')
      .reduce((sum, e) => sum + e.magnitude, 0);
    
    const luxuryBoostModifier = roomEffects
      .filter(e => e.effectType === 'luxury_boost')
      .reduce((sum, e) => sum + e.magnitude, 0);
    
    const roomInvestmentModifier = roomEffects
      .filter(e => e.effectType === 'room_investment_mood')
      .reduce((sum, e) => sum + e.magnitude, 0);
    
    const stressReductionModifier = roomEffects
      .filter(e => e.effectType === 'stress_reduction')
      .reduce((sum, e) => sum + e.magnitude, 0);

    const totalFinancialMoodEffect = financialStressModifier + luxuryBoostModifier + 
                                    roomInvestmentModifier + stressReductionModifier;

    return {
      roomId,
      baseHappiness: 3, // This would come from existing system
      financialStressModifier,
      luxuryBoostModifier,
      roomInvestmentModifier,
      conflictFinancialModifier: financialStressModifier, // Conflicts contribute to stress
      totalFinancialMoodEffect
    };
  }
}

export default FinancialRoomMoodService;
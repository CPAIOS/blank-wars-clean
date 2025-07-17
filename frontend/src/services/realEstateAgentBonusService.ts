/**
 * Real Estate Agent Bonus Service
 * 
 * This service handles applying real estate agent bonuses to facility purchases,
 * training, and other game systems as promised by the agents.
 */

import { ExperienceBonus } from '../data/experience';

interface AgentBonus {
  name: string;
  effects: string[];
  icon: string;
  color: string;
}

interface Cost {
  coins: number;
  gems: number;
}

interface AgentBonusEffects {
  facilityCostReduction: number; // Percentage (0-100)
  trainingSpeedBoost: number;    // Percentage
  xpGainIncrease: number;        // Percentage
  energyRegenBonus: number;      // Percentage
  hasTeamAmbitionTrait: boolean;
  hasClimateImmunity: boolean;
}

interface FacilityTier {
  name: string;
  minCost: number;
  maxCost: number;
  tier: 'spartan' | 'standard' | 'luxury';
}

const FACILITY_TIERS: FacilityTier[] = [
  { name: 'Spartan', minCost: 0, maxCost: 10000, tier: 'spartan' },
  { name: 'Standard', minCost: 10001, maxCost: 50000, tier: 'standard' },
  { name: 'Luxury', minCost: 50001, maxCost: Infinity, tier: 'luxury' }
];

const AGENT_BONUSES = {
  'barry_the_closer': {
    name: 'Speed Deals',
    effects: ['3-8% facility cost reduction (by tier)', '10% training speed boost'],
    icon: '⚡',
    color: 'text-yellow-400'
  },
  'lmb_3000': {
    name: 'Dramatic Ambition', 
    effects: ['5-12% XP gain increase (by tier)', 'Team "Ambition" trait unlock'],
    icon: '👑',
    color: 'text-purple-400'
  },
  'zyxthala_reptilian': {
    name: 'Optimal Efficiency',
    effects: ['3-8% training bonus (by tier)', 'Climate immunity for team'],
    icon: '🦎',
    color: 'text-green-400'
  }
};

class RealEstateAgentBonusService {
  private static instance: RealEstateAgentBonusService;
  private selectedAgentId: string | null = null;
  private readonly STORAGE_KEY = 'selectedRealEstateAgent';

  constructor() {
    this.loadFromStorage();
  }

  static getInstance(): RealEstateAgentBonusService {
    if (!RealEstateAgentBonusService.instance) {
      RealEstateAgentBonusService.instance = new RealEstateAgentBonusService();
    }
    return RealEstateAgentBonusService.instance;
  }

  /**
   * Set the currently selected real estate agent
   */
  setSelectedAgent(agentId: string): void {
    this.selectedAgentId = agentId;
    this.saveToStorage();
    console.log(`🏠 Real Estate Agent selected: ${agentId}`);
    this.logCurrentBonuses();
  }

  /**
   * Get the currently selected agent ID
   */
  getSelectedAgent(): string | null {
    return this.selectedAgentId;
  }

  /**
   * Calculate agent bonus effects with tiered scaling based on facility cost
   */
  getAgentBonusEffects(facilityCost?: Cost): AgentBonusEffects {
    if (!this.selectedAgentId) {
      return this.getDefaultEffects();
    }

    const totalCost = facilityCost ? facilityCost.coins + (facilityCost.gems * 100) : 0;
    const tier = this.getFacilityTier(totalCost);

    switch (this.selectedAgentId) {
      case 'barry_the_closer':
        return {
          facilityCostReduction: this.getBarryTieredBonus(tier),
          trainingSpeedBoost: 10,
          xpGainIncrease: 0,
          energyRegenBonus: 0,
          hasTeamAmbitionTrait: false,
          hasClimateImmunity: false
        };
      
      case 'lmb_3000':
        return {
          facilityCostReduction: 0,
          trainingSpeedBoost: 0,
          xpGainIncrease: this.getLmbTieredBonus(tier),
          energyRegenBonus: 0,
          hasTeamAmbitionTrait: true,
          hasClimateImmunity: false
        };
      
      case 'zyxthala_reptilian':
        return {
          facilityCostReduction: 0,
          trainingSpeedBoost: this.getZyxthalaTieredBonus(tier),
          xpGainIncrease: 0,
          energyRegenBonus: 15,
          hasTeamAmbitionTrait: false,
          hasClimateImmunity: true
        };
      
      default:
        return this.getDefaultEffects();
    }
  }

  /**
   * Apply facility cost reduction from selected agent
   */
  applyFacilityCostReduction(originalCost: Cost): Cost {
    const effects = this.getAgentBonusEffects(originalCost);
    
    if (effects.facilityCostReduction > 0) {
      const reduction = effects.facilityCostReduction / 100;
      const reducedCost = {
        coins: Math.floor(originalCost.coins * (1 - reduction)),
        gems: Math.floor(originalCost.gems * (1 - reduction))
      };
      
      const totalCost = originalCost.coins + (originalCost.gems * 100);
      const tier = this.getFacilityTier(totalCost);
      
      console.log(`🏠 Applied ${effects.facilityCostReduction}% cost reduction (${tier} tier):`, {
        original: originalCost,
        reduced: reducedCost,
        savings: {
          coins: originalCost.coins - reducedCost.coins,
          gems: originalCost.gems - reducedCost.gems
        }
      });
      
      return reducedCost;
    }
    
    return originalCost;
  }

  /**
   * Apply training speed boost from selected agent
   */
  applyTrainingSpeedBoost(baseTime: number): number {
    const effects = this.getAgentBonusEffects();
    
    if (effects.trainingSpeedBoost > 0) {
      const boost = effects.trainingSpeedBoost / 100;
      const reducedTime = Math.floor(baseTime * (1 - boost));
      
      console.log(`🏠 Applied ${effects.trainingSpeedBoost}% training speed boost:`, {
        originalTime: baseTime,
        reducedTime: reducedTime,
        timeSaved: baseTime - reducedTime
      });
      
      return reducedTime;
    }
    
    return baseTime;
  }

  /**
   * Apply XP gain increase from selected agent
   */
  applyXpGainBonus(baseXp: number): number {
    const effects = this.getAgentBonusEffects();
    
    if (effects.xpGainIncrease > 0) {
      const bonus = effects.xpGainIncrease / 100;
      const boostedXp = Math.floor(baseXp * (1 + bonus));
      
      console.log(`🏠 Applied ${effects.xpGainIncrease}% XP gain bonus:`, {
        baseXp: baseXp,
        boostedXp: boostedXp,
        bonus: boostedXp - baseXp
      });
      
      return boostedXp;
    }
    
    return baseXp;
  }

  /**
   * Apply energy regeneration bonus from selected agent
   */
  applyEnergyRegenBonus(baseRegen: number): number {
    const effects = this.getAgentBonusEffects();
    
    if (effects.energyRegenBonus > 0) {
      const bonus = effects.energyRegenBonus / 100;
      const boostedRegen = Math.floor(baseRegen * (1 + bonus));
      
      console.log(`🏠 Applied ${effects.energyRegenBonus}% energy regen bonus:`, {
        baseRegen: baseRegen,
        boostedRegen: boostedRegen,
        bonus: boostedRegen - baseRegen
      });
      
      return boostedRegen;
    }
    
    return baseRegen;
  }

  /**
   * Check if team has special traits from agent
   */
  hasTeamAmbitionTrait(): boolean {
    return this.getAgentBonusEffects().hasTeamAmbitionTrait;
  }

  /**
   * Check if team has climate immunity from agent
   */
  hasClimateImmunity(): boolean {
    return this.getAgentBonusEffects().hasClimateImmunity;
  }

  /**
   * Get XP bonus for experience calculations (uses average tier for global XP)
   */
  getXpBonusForExperience(): ExperienceBonus | null {
    if (!this.selectedAgentId || this.selectedAgentId !== 'lmb_3000') {
      return null;
    }

    // Use standard tier as default for global XP calculations
    const xpBonus = this.getLmbTieredBonus('standard');
    
    return {
      id: 'lmb_xp_bonus',
      name: 'LMB-3000 XP Boost',
      description: `+${xpBonus}% XP gain from real estate agent`,
      multiplier: 1 + (xpBonus / 100),
      source: 'agent',
      stackable: true
    };
  }

  /**
   * Get gameplan adherence multiplier for battle systems
   */
  getGameplanAdherenceMultiplier(facilityCost?: Cost): number {
    if (!this.selectedAgentId || this.selectedAgentId !== 'zyxthala_reptilian') {
      return 1;
    }

    const totalCost = facilityCost ? facilityCost.coins + (facilityCost.gems * 100) : 0;
    const tier = this.getFacilityTier(totalCost);
    const bonus = this.getZyxthalaTieredBonus(tier);
    
    return 1 + (bonus / 100);
  }

  /**
   * Get agent bonus description for UI display
   */
  getSelectedAgentBonus(): AgentBonus | null {
    if (!this.selectedAgentId) {
      return null;
    }
    
    return AGENT_BONUSES[this.selectedAgentId] || null;
  }

  /**
   * Log current bonuses for debugging
   */
  private logCurrentBonuses(): void {
    const effects = this.getAgentBonusEffects();
    const agentName = this.selectedAgentId ? 
      AGENT_BONUSES[this.selectedAgentId]?.name || 'Unknown' : 
      'None';
    
    console.log(`🏠 Active Real Estate Agent Bonuses (${agentName}):`, {
      facilityCostReduction: `${effects.facilityCostReduction}%`,
      trainingSpeedBoost: `${effects.trainingSpeedBoost}%`,
      xpGainIncrease: `${effects.xpGainIncrease}%`,
      energyRegenBonus: `${effects.energyRegenBonus}%`,
      specialTraits: {
        teamAmbition: effects.hasTeamAmbitionTrait,
        climateImmunity: effects.hasClimateImmunity
      }
    });
  }

  /**
   * Default effects when no agent is selected
   */
  private getDefaultEffects(): AgentBonusEffects {
    return {
      facilityCostReduction: 0,
      trainingSpeedBoost: 0,
      xpGainIncrease: 0,
      energyRegenBonus: 0,
      hasTeamAmbitionTrait: false,
      hasClimateImmunity: false
    };
  }

  /**
   * Save selected agent to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      if (this.selectedAgentId) {
        localStorage.setItem(this.STORAGE_KEY, this.selectedAgentId);
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to save agent selection to localStorage:', error);
    }
  }

  /**
   * Load selected agent from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      const savedAgentId = localStorage.getItem(this.STORAGE_KEY);
      if (savedAgentId && AGENT_BONUSES[savedAgentId]) {
        this.selectedAgentId = savedAgentId;
        console.log(`🏠 Restored agent selection from storage: ${savedAgentId}`);
      }
    } catch (error) {
      console.warn('Failed to load agent selection from localStorage:', error);
    }
  }

  /**
   * Determine facility tier based on total cost
   */
  private getFacilityTier(totalCost: number): 'spartan' | 'standard' | 'luxury' {
    const tier = FACILITY_TIERS.find(t => totalCost >= t.minCost && totalCost <= t.maxCost);
    return tier?.tier || 'spartan';
  }

  /**
   * Get Barry's tiered cost reduction bonus (3%, 5%, 8%)
   */
  private getBarryTieredBonus(tier: 'spartan' | 'standard' | 'luxury'): number {
    switch (tier) {
      case 'spartan': return 3;
      case 'standard': return 5;
      case 'luxury': return 8;
      default: return 3;
    }
  }

  /**
   * Get LMB-3000's tiered XP gain bonus (5%, 8%, 12%)
   */
  private getLmbTieredBonus(tier: 'spartan' | 'standard' | 'luxury'): number {
    switch (tier) {
      case 'spartan': return 5;
      case 'standard': return 8;
      case 'luxury': return 12;
      default: return 5;
    }
  }

  /**
   * Get Zyxthala's tiered training bonus (3%, 5%, 8%)
   */
  private getZyxthalaTieredBonus(tier: 'spartan' | 'standard' | 'luxury'): number {
    switch (tier) {
      case 'spartan': return 3;
      case 'standard': return 5;
      case 'luxury': return 8;
      default: return 3;
    }
  }
}

export default RealEstateAgentBonusService;
export type { AgentBonus, AgentBonusEffects, FacilityTier };